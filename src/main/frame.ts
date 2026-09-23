import { MISSING_TRANSLATION_TEXT, PNG_EXPORT_SETTINGS } from "./constants";
import { createFontSizeSync, type TypographyGroups } from "./font-size-sync";
import {
  cloneMetaStore,
  frameConfigStore,
  isGeneratedClone,
} from "./plugin-data";
import {
  getTextNodes,
  getTypographyKey,
  loadFontsForTextNode,
  shrinkTextToFit,
  type FitBox,
} from "./text";
import type {
  FitOptions,
  FrameInfo,
  PluginMessage,
  TranslationValue,
} from "./types";

export type TextApplyResult = {
  groups: TypographyGroups;
  missingTextIndexes: number[];
  missingFontTextIndexes: number[];
};

type SizedContainer = BaseNode & {
  width: number;
  layoutSizingHorizontal?: "FIXED" | "HUG" | "FILL";
  paddingLeft?: number;
  paddingRight?: number;
};

export const postToUi = (message: PluginMessage) =>
  figma.ui.postMessage(message);

const isFrame = (node: BaseNode | null | undefined): node is FrameNode =>
  node?.type === "FRAME";

export async function findFrameById(id: string): Promise<FrameNode | null> {
  const node = await figma.getNodeByIdAsync(id);
  return isFrame(node) ? node : null;
}

export function findSiblingFrame(
  frame: FrameNode,
  matches: (sibling: FrameNode) => boolean,
): FrameNode | undefined {
  return frame.parent?.children.find(
    (child): child is FrameNode =>
      isFrame(child) && child !== frame && matches(child),
  );
}

export function applyExportSettings(frame: FrameNode): void {
  frame.exportSettings = PNG_EXPORT_SETTINGS;
}

const isSizedContainer = (node: BaseNode | null): node is SizedContainer =>
  node !== null && "width" in node && "children" in node;

const horizontalPadding = (node: SizedContainer) =>
  (node.paddingLeft ?? 0) + (node.paddingRight ?? 0);

const growsWithContent = (node: SizedContainer) =>
  node.type === "GROUP" || node.layoutSizingHorizontal === "HUG";

function getAvailableTextWidth(
  node: TextNode,
  root: FrameNode,
  fitPadding: number,
): number {
  let reserved = Math.max(0, fitPadding) * 2;
  let ancestor = node.parent;

  while (isSizedContainer(ancestor)) {
    reserved += horizontalPadding(ancestor);
    if (ancestor === root || !growsWithContent(ancestor)) {
      return Math.max(1, ancestor.width - reserved);
    }
    ancestor = ancestor.parent;
  }

  return Math.max(1, root.width - reserved);
}

function isInsideInstance(node: BaseNode): boolean {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "INSTANCE") {
      return true;
    }
  }
  return false;
}

function dropTextNode(node: TextNode): void {
  if (isInsideInstance(node)) {
    node.visible = false;
  } else {
    node.remove();
  }
}

const isBlank = (value: TranslationValue) =>
  value === null || value.trim() === "";

const pushToGroup = (groups: TypographyGroups, key: string, node: TextNode) =>
  groups.set(key, [...(groups.get(key) ?? []), node]);

export async function applyTextsToFrame(
  frame: FrameNode,
  texts: TranslationValue[],
  options: FitOptions,
): Promise<TextApplyResult> {
  const result: TextApplyResult = {
    groups: new Map(),
    missingTextIndexes: [],
    missingFontTextIndexes: [],
  };
  const heights = new Map<TextNode, number>();

  for (const [index, node] of getTextNodes(frame).entries()) {
    const value = texts[index];
    const typographyKey = getTypographyKey(node);

    if (value === null) {
      result.missingTextIndexes.push(index);
    }
    if (value !== undefined && options.removeEmptyTextNodes && isBlank(value)) {
      dropTextNode(node);
      continue;
    }
    if (node.hasMissingFont) {
      result.missingFontTextIndexes.push(index);
      continue;
    }

    await loadFontsForTextNode(node);
    heights.set(node, node.height);
    if (value !== undefined) {
      node.characters = value ?? MISSING_TRANSLATION_TEXT;
    }
    pushToGroup(result.groups, typographyKey, node);
  }

  if (options.resizeTextToFit) {
    fitGroups(frame, result.groups, options.fitPadding, heights);
  }

  return result;
}

function getFitBox(
  node: TextNode,
  frame: FrameNode,
  fitPadding: number,
  height?: number,
): FitBox {
  const maxWidth = getAvailableTextWidth(node, frame, fitPadding);
  return node.textAutoResize === "WIDTH_AND_HEIGHT"
    ? { maxWidth }
    : { maxWidth, maxHeight: height };
}

function fitGroups(
  frame: FrameNode,
  groups: TypographyGroups,
  fitPadding: number,
  heights: Map<TextNode, number>,
): void {
  const sync = createFontSizeSync();

  groups.forEach((nodes, key) => {
    nodes.forEach((node) =>
      shrinkTextToFit(
        node,
        getFitBox(node, frame, fitPadding, heights.get(node)),
      ),
    );
    sync.add(key, nodes);
  });
}

async function describeFrame(frame: FrameNode): Promise<FrameInfo> {
  const textNodes = getTextNodes(frame);
  const meta = cloneMetaStore.read(frame);
  const source = meta ? await figma.getNodeByIdAsync(meta.sourceId) : null;

  return {
    id: frame.id,
    name: frame.name,
    textKeys: textNodes.map((node) => node.characters.trim()),
    textStyles: textNodes.map(getTypographyKey),
    width: frame.width,
    height: frame.height,
    savedConfig: frameConfigStore.read(frame),
    generatedFrom: isGeneratedClone(frame)
      ? (source?.name ?? "another frame")
      : undefined,
  };
}

export async function postSelectionFrames(): Promise<void> {
  const selection = figma.currentPage.selection;
  const frames = await Promise.all(
    selection.filter(isFrame).map(describeFrame),
  );

  postToUi({
    type: "POST_SELECTION_FRAMES",
    frames,
    ignoredCount: selection.length - frames.length,
  });
}
