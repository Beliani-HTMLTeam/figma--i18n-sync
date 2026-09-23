export const API_URL = "https://tj31c889tzsk.share.zrok.io/api/sheets";
export const API_TIMEOUT_MS = 20_000;

export const UI_SIZE_STORAGE_KEY = "i18n-sync-ui-size";

export const VERTICAL_GAP = 20;

export const MIN_FONT_SIZE = 4;
export const FIT_ALGORITHM_VERSION = 3;

export const MISSING_TRANSLATION_TEXT = "TRANSLATION NOT FOUND";

export const PLUGIN_DATA_KEYS = {
  config: "i18n-sync-config",
  signature: "i18n-sync-signature",
  clone: "i18n-sync-clone",
} as const;

export const PNG_EXPORT_SETTINGS: ExportSettings[] = [
  {
    format: "PNG",
    suffix: "",
    constraint: { type: "SCALE", value: 1 },
  },
];
