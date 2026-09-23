export const TRANSLATION_TYPES = [
  "category_titles",
  "templates",
  "header",
  "footer",
  "category_links",
  "sheet",
] as const;

export const ALL_LOCALES = [
  "CHDE",
  "CHFR",
  "CHIT",
  "AT",
  "BENL",
  "BEFR",
  "CZ",
  "DE",
  "DK",
  "FI",
  "FR",
  "HU",
  "IT",
  "NL",
  "NO",
  "PL",
  "PT",
  "RO",
  "SE",
  "SK",
  "ES",
  "UK",
  "SI",
  "HR",
];

export const DEFAULT_SOURCE_TYPE = "category_titles";
export const DATE_TOKENS = ["{date}", "%date%"];

export const UI_SIZE = {
  initial: { width: 800, height: 600 },
  min: { width: 480, height: 360 },
  max: { width: 1600, height: 1200 },
};

export const currentYear = (): string => String(new Date().getFullYear());

export function getSheetYearOptions(selected?: string): string[] {
  const year = Number(currentYear());
  const years = [year - 1, year, year + 1].map(String);
  return selected && !years.includes(selected) ? [selected, ...years] : years;
}
