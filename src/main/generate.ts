import { ALL_LOCALES } from "../shared/constants";
import { buildLocaleFrameName } from "../shared/naming";
import { createApiClient, type ApiClient } from "./api";
import { FIT_ALGORITHM_VERSION } from "./constants";
import { getLocaleTextsForFrame } from "./data";
import { createFontSizeSync, type FontSizeSync } from "./font-size-sync";
import {
  applyExportSettings,
  applyTextsToFrame,
  findFrameById,
  findSiblingFrame,
  type TextApplyResult,
} from "./frame";
import { stackedPosition } from "./layout";
import { serializeNodeState } from "./node-state";
import {
  cloneMetaStore,
  cloneSignatureStore,
  frameConfigStore,
  isGeneratedClone,
} from "./plugin-data";
import { getTextNodes } from "./text";
import type {
  FitOptions,
  FrameConfig,
  GenerateMessage,
  GenerationReport,
  TranslationValue,
} from "./types";

type CloneOutcome = "created" | "updated" | "renamed" | "upToDate";

type FrameIssues = {
  missingTexts: Map<number, string[]>;
  missingFontTexts: Set<number>;
};

type LocaleCloneJob = {
  source: FrameNode;
  locale: string;
  name: string;
  texts: TranslationValue[];
  slot: number;
  signature: string;
  config: FrameConfig;
  sizer: FontSizeSync;
  issues: FrameIssues;
};

const PREVIEW_LENGTH = 30;
const KNOWN_LOCALES = new Set(
  ALL_LOCALES.map((locale) => locale.toLowerCase()),
);

const toFitOptions = (config: FrameConfig): FitOptions => ({
  resizeTextToFit: config.resizeTextToFit,
  fitPadding: config.fitPadding,
  removeEmptyTextNodes: config.removeEmptyTextNodes,
});

const preview = (text: string) => {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > PREVIEW_LENGTH
    ? `${line.slice(0, PREVIEW_LENGTH - 1)}…`
    : line;
};

const createReport = (): GenerationReport => ({
  created: 0,
  updated: 0,
  renamed: 0,
  upToDate: 0,
  warnings: [],
});

function findExistingClone(source: FrameNode, locale: string, name: string) {
  return (
    findSiblingFrame(source, (sibling) => {
      const meta = cloneMetaStore.read(sibling);
      return meta?.sourceId === source.id && meta.locale === locale;
    }) ??
    findSiblingFrame(
      source,
      (sibling) =>
        sibling.name === name && cloneMetaStore.read(sibling) === undefined,
    )
  );
}

function recordIssues(
  issues: FrameIssues,
  locale: string,
  result: TextApplyResult,
): void {
  result.missingTextIndexes.forEach((index) =>
    issues.missingTexts.set(index, [
      ...(issues.missingTexts.get(index) ?? []),
      locale,
    ]),
  );
  result.missingFontTextIndexes.forEach((index) =>
    issues.missingFontTexts.add(index),
  );
}

async function upsertLocaleClone(job: LocaleCloneJob): Promise<CloneOutcome> {
  const existing = findExistingClone(job.source, job.locale, job.name);
  const meta = { sourceId: job.source.id, locale: job.locale };

  if (existing && cloneSignatureStore.read(existing) === job.signature) {
    cloneMetaStore.write(existing, meta);
    if (existing.name === job.name) {
      return "upToDate";
    }
    existing.name = job.name;
    return "renamed";
  }

  const position = existing
    ? { x: existing.x, y: existing.y }
    : stackedPosition(job.source, job.slot);
  existing?.remove();

  const clone = job.source.clone();
  frameConfigStore.clear(clone);
  cloneMetaStore.write(clone, meta);
  cloneSignatureStore.write(clone, job.signature);

  const result = await applyTextsToFrame(
    clone,
    job.texts,
    toFitOptions(job.config),
  );
  recordIssues(job.issues, job.locale, result);
  applyExportSettings(clone);

  if (job.config.resizeTextToFit && job.config.resizeWithinCountryScope) {
    job.sizer.addGroups(job.locale, result.groups);
  }

  clone.name = job.name;
  clone.x = position.x;
  clone.y = position.y;
  return existing ? "updated" : "created";
}

function describeIssues(
  frame: FrameNode,
  issues: FrameIssues,
  unknownLocales: string[],
): string[] {
  const sourceTexts = getTextNodes(frame).map((node) => node.characters);
  const label = (index: number) =>
    `text ${index + 1} ("${preview(sourceTexts[index] ?? "")}")`;

  return [
    ...[...issues.missingTexts].map(
      ([index, locales]) =>
        `${frame.name}: ${label(index)} has no translation for ${locales.join(", ").toUpperCase()}`,
    ),
    ...[...issues.missingFontTexts].map(
      (index) =>
        `${frame.name}: ${label(index)} uses a font that is not installed, left unchanged`,
    ),
    ...(unknownLocales.length > 0
      ? [
          `${frame.name}: skipped languages unknown to the plugin: ${unknownLocales.join(", ").toUpperCase()}`,
        ]
      : []),
  ];
}

async function generateForFrame(
  api: ApiClient,
  source: FrameNode,
  config: FrameConfig,
  dateValue: string,
  sizer: FontSizeSync,
  report: GenerationReport,
): Promise<void> {
  frameConfigStore.write(source, config);
  applyExportSettings(source);

  const localeTexts = await getLocaleTextsForFrame(
    api,
    source,
    config.rules,
    config,
  );
  const selected = new Set(
    config.selectedLocales.map((locale) => locale.toLowerCase()),
  );
  const unknownLocales = [...localeTexts.keys()].filter(
    (locale) => !KNOWN_LOCALES.has(locale),
  );
  const fitOptions = toFitOptions(config);
  const sourceState = serializeNodeState(source);
  const issues: FrameIssues = {
    missingTexts: new Map(),
    missingFontTexts: new Set(),
  };

  let slot = 0;
  for (const [locale, texts] of localeTexts) {
    if (!selected.has(locale)) {
      continue;
    }

    slot++;
    const outcome = await upsertLocaleClone({
      source,
      locale,
      name: buildLocaleFrameName(locale, config, dateValue, source.name),
      texts,
      slot,
      signature: JSON.stringify({
        texts,
        fitOptions,
        baseFrameState: sourceState,
        fitVersion: FIT_ALGORITHM_VERSION,
      }),
      config,
      sizer,
      issues,
    });
    report[outcome]++;
  }

  report.warnings.push(...describeIssues(source, issues, unknownLocales));
}

export async function generateTranslatedFrames(
  message: GenerateMessage,
): Promise<GenerationReport> {
  const api = createApiClient();
  const sizer = createFontSizeSync();
  const report = createReport();

  for (const item of message.items) {
    const frame = await findFrameById(item.frameId);
    if (!frame) {
      report.warnings.push("A selected frame no longer exists and was skipped");
      continue;
    }
    if (isGeneratedClone(frame)) {
      report.warnings.push(
        `${frame.name}: is a generated translation, select its source frame instead`,
      );
      continue;
    }
    await generateForFrame(
      api,
      frame,
      item.config,
      message.dateValue,
      sizer,
      report,
    );
  }

  return report;
}
