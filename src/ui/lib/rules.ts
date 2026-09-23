import type { TextFetchRule, TranslationType } from "../types";

const NUMERIC_RANGE = /^\d+$/;

export const isNumericRange = (range: string | undefined): boolean =>
  NUMERIC_RANGE.test(range?.trim() ?? "");

export const hasSheetRules = (rules: TextFetchRule[]): boolean =>
  rules.some((rule) => rule.sourceType === "sheet");

export function summarizeSources(
  rules: TextFetchRule[],
): Array<[TranslationType, number]> {
  const counts = new Map<TranslationType, number>();
  rules.forEach((rule) =>
    counts.set(rule.sourceType, (counts.get(rule.sourceType) ?? 0) + 1),
  );
  return [...counts.entries()];
}

function nextRangeBefore(rules: TextFetchRule[], index: number): string {
  const previous = rules
    .slice(0, index)
    .reverse()
    .find((rule) => rule.sourceType === "sheet" && isNumericRange(rule.range));
  return previous ? String(Number(previous.range) + 1) : "";
}

const withSheetRange = (
  rules: TextFetchRule[],
  index: number,
  rule: TextFetchRule,
) =>
  rule.sourceType === "sheet" && !isNumericRange(rule.range)
    ? { ...rule, range: nextRangeBefore(rules, index) }
    : rule;

export function updateRuleAt(
  rules: TextFetchRule[],
  index: number,
  patch: Partial<TextFetchRule>,
): TextFetchRule[] {
  return rules.map((rule, i) => {
    if (i !== index) {
      return rule;
    }
    const updated = { ...rule, ...patch };
    return patch.sourceType ? withSheetRange(rules, i, updated) : updated;
  });
}

export function setAllSources(
  rules: TextFetchRule[],
  sourceType: TranslationType,
): TextFetchRule[] {
  return rules.reduce<TextFetchRule[]>((next, rule, index) => {
    next.push(withSheetRange(next, index, { ...rule, sourceType }));
    return next;
  }, []);
}

export function numberSheetRanges(rules: TextFetchRule[]): TextFetchRule[] {
  const first = rules.find(
    (rule) => rule.sourceType === "sheet" && isNumericRange(rule.range),
  );
  if (!first) {
    return rules;
  }

  let range = Number(first.range);
  const firstIndex = rules.indexOf(first);
  return rules.map((rule, index) => {
    if (rule.sourceType !== "sheet" || index < firstIndex) {
      return rule;
    }
    return { ...rule, range: String(range++) };
  });
}
