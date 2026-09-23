import { UI_SIZE } from "../shared/constants";
import type { MessageOf } from "../shared/types";
import { UI_SIZE_STORAGE_KEY } from "./constants";
import { findFrameById, postSelectionFrames, postToUi } from "./frame";
import { generateTranslatedFrames } from "./generate";
import { frameConfigStore, isGeneratedClone } from "./plugin-data";
import type { GenerateMessage, GenerationReport, UIMessage } from "./types";

type MessageHandlers = {
  [TType in UIMessage["type"]]: (
    message: MessageOf<UIMessage, TType>,
  ) => unknown;
};

type Size = { width: number; height: number };

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown error";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

const clampSize = ({ width, height }: Size): Size => ({
  width: clamp(width, UI_SIZE.min.width, UI_SIZE.max.width),
  height: clamp(height, UI_SIZE.min.height, UI_SIZE.max.height),
});

function formatReportNotice(report: GenerationReport) {
  const parts = [
    report.created && `${report.created} created`,
    report.updated && `${report.updated} updated`,
    report.renamed && `${report.renamed} renamed`,
    report.upToDate && `${report.upToDate} up to date`,
    report.warnings.length && `${report.warnings.length} warning(s)`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Nothing to generate";
}

async function handleGenerate(message: GenerateMessage) {
  postToUi({ type: "GENERATION_STATUS", status: "running" });

  try {
    const report = await generateTranslatedFrames(message);
    postToUi({ type: "GENERATION_STATUS", status: "completed", report });
    figma.notify(formatReportNotice(report));
  } catch (error) {
    const details = errorMessage(error);
    postToUi({ type: "GENERATION_STATUS", status: "failed", error: details });
    figma.notify(`Generation failed: ${details}`, { error: true });
  }
}

async function restoreUiSize() {
  const saved = (await figma.clientStorage.getAsync(UI_SIZE_STORAGE_KEY)) as
    | Size
    | undefined;
  if (saved?.width && saved?.height) {
    const size = clampSize(saved);
    figma.ui.resize(size.width, size.height);
  }
}

const handlers: MessageHandlers = {
  REQUEST_SELECTION_FRAMES: postSelectionFrames,

  RENAME_FRAME: async ({ frameId, name }) => {
    const frame = await findFrameById(frameId);
    const nextName = name.trim();
    if (frame && nextName) {
      frame.name = nextName;
      await postSelectionFrames();
    }
  },

  SAVE_FRAME_CONFIG: async ({ frameId, config }) => {
    const frame = await findFrameById(frameId);
    if (frame && !isGeneratedClone(frame)) {
      frameConfigStore.write(frame, config);
    }
  },

  RESIZE_UI: async (message) => {
    const size = clampSize(message);
    figma.ui.resize(size.width, size.height);
    await figma.clientStorage.setAsync(UI_SIZE_STORAGE_KEY, size);
  },

  GENERATE_TRANSLATED_FRAMES: handleGenerate,
};

async function dispatch<TType extends UIMessage["type"]>(
  message: MessageOf<UIMessage, TType>,
) {
  try {
    await handlers[message.type as TType](message);
  } catch (error) {
    figma.notify(`I18n Sync: ${errorMessage(error)}`, { error: true });
  }
}

export default function () {
  figma.showUI(__html__, { ...UI_SIZE.initial, themeColors: true });
  figma.ui.onmessage = (message: UIMessage) => dispatch(message);
  figma.on("selectionchange", postSelectionFrames);
  void restoreUiSize();
  void postSelectionFrames();
}
