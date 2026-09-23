import {
  ALL_LOCALES,
  currentYear,
  DEFAULT_SOURCE_TYPE,
} from "../../shared/constants";
import type {
  FrameConfig,
  FrameInfo,
  SheetSource,
  TextFetchRule,
} from "../types";
import { hasSheetRules, isNumericRange } from "./rules";

const DEFAULT_DELIMITER = "_";
const DEFAULT_FIT_PADDING = 10;

type LegacyRule = Partial<TextFetchRule> & { year?: string; sheetTab?: string };
type LegacyConfig = Omit<Partial<FrameConfig>, "rules"> & {
  parentName?: string;
  rules?: LegacyRule[];
};

export const SHARED_SETTING_KEYS = [
  "delimiter",
  "nameSuffix",
  "sheetYear",
  "sheetTab",
  "resizeTextToFit",
  "fitPadding",
  "resizeWithinCountryScope",
  "removeEmptyTextNodes",
  "selectedLocales",
] as const satisfies ReadonlyArray<keyof FrameConfig>;

const createDefaultRule = (
  frameId: string,
  lookupKey: string,
  index: number,
): TextFetchRule => ({
  id: `${frameId}:${index}`,
  sourceType: DEFAULT_SOURCE_TYPE,
  lookupKey,
  range: "",
});

export const createDefaultConfig = (frame: FrameInfo): FrameConfig => ({
  delimiter: DEFAULT_DELIMITER,
  nameSuffix: "",
  sheetYear: currentYear(),
  sheetTab: "",
  rules: frame.textKeys.map((key, index) =>
    createDefaultRule(frame.id, key, index),
  ),
  resizeTextToFit: false,
  fitPadding: DEFAULT_FIT_PADDING,
  resizeWithinCountryScope: true,
  removeEmptyTextNodes: false,
  selectedLocales: [...ALL_LOCALES],
});

function findLegacySheetSource(
  rules: LegacyRule[] | undefined,
): Partial<SheetSource> {
  const legacy = rules?.find((rule) => rule.sheetTab?.trim());
  return legacy?.sheetTab
    ? { sheetTab: legacy.sheetTab, sheetYear: legacy.year ?? currentYear() }
    : {};
}

const stripLegacyRule = ({
  year: _year,
  sheetTab: _sheetTab,
  ...rule
}: LegacyRule) => rule;

function normalizeSaved(saved: LegacyConfig | undefined): Partial<FrameConfig> {
  if (!saved) {
    return {};
  }
  const { parentName: _parentName, rules, ...rest } = saved;
  const legacySheet =
    rest.sheetTab === undefined ? findLegacySheetSource(rules) : {};
  return {
    ...rest,
    ...legacySheet,
    rules: rules?.map(stripLegacyRule) as TextFetchRule[],
  };
}

export function mergeFrameConfig(
  frame: FrameInfo,
  current: FrameConfig | undefined,
): FrameConfig {
  const defaults = createDefaultConfig(frame);
  const saved = normalizeSaved(frame.savedConfig as LegacyConfig | undefined);

  const rules = defaults.rules.map((rule, index) => ({
    ...rule,
    ...(current?.rules?.[index] ?? saved.rules?.[index]),
    id: rule.id,
  }));

  return { ...defaults, ...saved, ...current, rules };
}

type ConfigCheck = (config: FrameConfig) => string[];

const ruleIssues: ConfigCheck = (config) =>
  config.rules.flatMap((rule, index) => {
    const label = `Text ${index + 1}`;
    if (rule.sourceType === "sheet") {
      return isNumericRange(rule.range)
        ? []
        : [`${label}: row must be a number`];
    }
    return rule.lookupKey.trim() ? [] : [`${label}: lookup key is empty`];
  });

const configChecks: ConfigCheck[] = [
  (config) => (config.rules.length > 0 ? [] : ["Frame has no text layers"]),
  (config) =>
    config.selectedLocales.length > 0 ? [] : ["No languages selected"],
  (config) =>
    hasSheetRules(config.rules) && !config.sheetTab.trim()
      ? ["Sheet tab is empty"]
      : [],
  ruleIssues,
];

export const getConfigIssues = (config: FrameConfig): string[] =>
  configChecks.flatMap((check) => check(config));

export const pickSharedSettings = (config: FrameConfig): Partial<FrameConfig> =>
  Object.fromEntries(SHARED_SETTING_KEYS.map((key) => [key, config[key]]));
