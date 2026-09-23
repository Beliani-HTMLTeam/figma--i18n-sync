import type { TRANSLATION_TYPES } from "./constants";

export type TranslationType = (typeof TRANSLATION_TYPES)[number];
export type StaticTranslationType = Exclude<TranslationType, "sheet">;

export type TextFetchRule = {
  id: string;
  sourceType: TranslationType;
  lookupKey: string;
  range?: string;
};

export type SheetSource = {
  sheetYear: string;
  sheetTab: string;
};

export type FitOptions = {
  resizeTextToFit: boolean;
  fitPadding: number;
  removeEmptyTextNodes: boolean;
};

export type NamingOptions = {
  delimiter: string;
  nameSuffix: string;
};

export type FrameConfig = NamingOptions &
  FitOptions &
  SheetSource & {
    rules: TextFetchRule[];
    resizeWithinCountryScope: boolean;
    selectedLocales: string[];
  };

export type FrameInfo = {
  id: string;
  name: string;
  textKeys: string[];
  textStyles: string[];
  width: number;
  height: number;
  savedConfig?: Partial<FrameConfig>;
  generatedFrom?: string;
};

export type GenerateMessage = {
  type: "GENERATE_TRANSLATED_FRAMES";
  dateValue: string;
  items: Array<{ frameId: string; config: FrameConfig }>;
};

export type RequestSelectionMessage = {
  type: "REQUEST_SELECTION_FRAMES";
};

export type RenameFrameMessage = {
  type: "RENAME_FRAME";
  frameId: string;
  name: string;
};

export type SaveFrameConfigMessage = {
  type: "SAVE_FRAME_CONFIG";
  frameId: string;
  config: FrameConfig;
};

export type ResizeUiMessage = {
  type: "RESIZE_UI";
  width: number;
  height: number;
};

export type UIMessage =
  | GenerateMessage
  | RequestSelectionMessage
  | RenameFrameMessage
  | SaveFrameConfigMessage
  | ResizeUiMessage;

export type SelectionMessage = {
  type: "POST_SELECTION_FRAMES";
  frames: FrameInfo[];
  ignoredCount: number;
};

export type GenerationReport = {
  created: number;
  updated: number;
  renamed: number;
  upToDate: number;
  warnings: string[];
};

export type GenerationStatusMessage =
  | { type: "GENERATION_STATUS"; status: "running" }
  | { type: "GENERATION_STATUS"; status: "completed"; report: GenerationReport }
  | { type: "GENERATION_STATUS"; status: "failed"; error: string };

export type PluginMessage = SelectionMessage | GenerationStatusMessage;

export type MessageOf<
  TUnion extends { type: string },
  TType extends TUnion["type"],
> = Extract<TUnion, { type: TType }>;
