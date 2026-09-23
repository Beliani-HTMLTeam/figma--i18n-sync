export type {
  FitOptions,
  FrameConfig,
  FrameInfo,
  GenerateMessage,
  GenerationReport,
  PluginMessage,
  SheetSource,
  StaticTranslationType,
  TextFetchRule,
  UIMessage,
} from "../shared/types";

export type ApiEnvelope = {
  code: number;
  data: Record<string, unknown>;
};

export type TranslationValue = string | null;

export type LocaleTexts = Map<string, TranslationValue[]>;
