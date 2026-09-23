import type { FrameConfig } from "../shared/types";

export type {
  FrameConfig,
  FrameInfo,
  PluginMessage,
  SheetSource,
  TextFetchRule,
  TranslationType,
  UIMessage,
} from "../shared/types";

export type FieldUpdater<T> = <K extends keyof T>(key: K, value: T[K]) => void;
export type ConfigUpdater = FieldUpdater<FrameConfig>;
