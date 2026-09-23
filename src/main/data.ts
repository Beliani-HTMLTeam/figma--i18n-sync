import { currentYear } from "../shared/constants";
import type { ApiClient } from "./api";
import { getTextNodes } from "./text";
import type {
  LocaleTexts,
  SheetSource,
  StaticTranslationType,
  TextFetchRule,
  TranslationValue,
} from "./types";

type LocaleValue = { locale: string; value: TranslationValue | undefined };

type RuleResolver = (
  api: ApiClient,
  rule: TextFetchRule,
  sheet: SheetSource,
) => Promise<LocaleValue[]>;

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function toPlainText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity]);
}

function toCell(raw: unknown): TranslationValue | undefined {
  if (raw === null) {
    return null;
  }
  return raw === undefined ? undefined : toPlainText(String(raw));
}

const toCells = (value: unknown): Array<TranslationValue | undefined> =>
  Array.isArray(value) ? value.map(toCell) : [];

const normalizeLocale = (locale: string) => locale.trim().toLowerCase();

function findKeyIgnoringCase(
  data: Record<string, unknown>,
  key: string,
): string | undefined {
  if (key in data) {
    return key;
  }
  const normalized = key.toLowerCase();
  return Object.keys(data).find(
    (existing) => existing.toLowerCase() === normalized,
  );
}

const resolveSheetRule: RuleResolver = async (api, rule, sheet) => {
  const { data } = await api.getSheetRow(
    sheet.sheetYear || currentYear(),
    sheet.sheetTab.trim(),
    (rule.range ?? "").trim(),
  );

  return Object.entries(data).map(([locale, row]) => ({
    locale: normalizeLocale(locale),
    value: toCells(row)[0],
  }));
};

const resolveStaticRule: RuleResolver = async (api, rule) => {
  const { data } = await api.getStaticData(
    rule.sourceType as StaticTranslationType,
  );
  const key = findKeyIgnoringCase(data, rule.lookupKey.trim());
  const values = key ? toCells(data[key]) : [];

  return toCells(data.slug).map((locale, localeIndex) => ({
    locale: normalizeLocale(locale ?? ""),
    value: values[localeIndex],
  }));
};

const resolveRule: RuleResolver = (api, rule, sheet) =>
  rule.sourceType === "sheet"
    ? resolveSheetRule(api, rule, sheet)
    : resolveStaticRule(api, rule, sheet);

export async function getLocaleTextsForFrame(
  api: ApiClient,
  frame: FrameNode,
  rules: TextFetchRule[],
  sheet: SheetSource,
): Promise<LocaleTexts> {
  const sourceTexts: TranslationValue[] = getTextNodes(frame).map(
    (node) => node.characters,
  );
  const locales: LocaleTexts = new Map();

  for (const [ruleIndex, rule] of rules.entries()) {
    const resolved = await resolveRule(api, rule, sheet);
    for (const { locale, value } of resolved) {
      if (!locale) {
        continue;
      }
      const texts = locales.get(locale) ?? [...sourceTexts];
      texts[ruleIndex] = value === undefined ? texts[ruleIndex] : value;
      locales.set(locale, texts);
    }
  }

  return locales;
}
