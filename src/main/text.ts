import { MIN_FONT_SIZE } from "./constants";

export type FitBox = {
  maxWidth: number;
  maxHeight?: number;
};

const OVERFLOW_TOLERANCE = 0.5;

export function getTextNodes(root: SceneNode): TextNode[] {
  if (root.type === "TEXT") {
    return [root];
  }
  if (!("children" in root)) {
    return [];
  }
  return root.children.flatMap((child) => getTextNodes(child));
}

function getUsedFonts(node: TextNode): FontName[] {
  if (node.characters.length > 0) {
    return node.getRangeAllFontNames(0, node.characters.length);
  }
  return node.fontName === figma.mixed ? [] : [node.fontName];
}

export async function loadFontsForTextNode(node: TextNode): Promise<void> {
  const uniqueFonts = new Map(
    getUsedFonts(node).map((font) => [`${font.family}:${font.style}`, font]),
  );
  for (const font of uniqueFonts.values()) {
    await figma.loadFontAsync(font);
  }
}

function getFontSize(node: TextNode): number | null {
  if (typeof node.fontSize === "number") {
    return node.fontSize;
  }
  if (node.characters.length === 0) {
    return null;
  }

  try {
    const size = node.getRangeFontSize(0, 1);
    return typeof size === "number" ? size : null;
  } catch {
    return null;
  }
}

function getFirstFontName(node: TextNode): FontName | null {
  if (node.fontName !== figma.mixed) {
    return node.fontName;
  }
  if (node.characters.length === 0) {
    return null;
  }
  const font = node.getRangeFontName(0, 1);
  return font === figma.mixed ? null : font;
}

export function getTypographyKey(node: TextNode): string {
  const font = getFirstFontName(node);
  return [font?.family, font?.style, getFontSize(node)].join("|");
}

function setFontSize(node: TextNode, size: number): void {
  if (node.characters.length > 0) {
    node.setRangeFontSize(0, node.characters.length, size);
  }
}

const overflows = (node: TextNode, box: FitBox) =>
  node.width > box.maxWidth + OVERFLOW_TOLERANCE ||
  (box.maxHeight !== undefined &&
    node.height > box.maxHeight + OVERFLOW_TOLERANCE);

function findLargestFittingSize(
  node: TextNode,
  box: FitBox,
  startSize: number,
): number {
  let low = MIN_FONT_SIZE;
  let high = Math.floor(startSize);
  let best = MIN_FONT_SIZE;

  while (low <= high) {
    const size = Math.floor((low + high) / 2);
    setFontSize(node, size);
    if (overflows(node, box)) {
      high = size - 1;
    } else {
      best = size;
      low = size + 1;
    }
  }
  return best;
}

function withMeasurableHeight(node: TextNode, measure: () => void): void {
  const mode = node.textAutoResize;
  if (mode !== "NONE" && mode !== "TRUNCATE") {
    measure();
    return;
  }

  const { width, height } = node;
  node.textAutoResize = "HEIGHT";
  measure();
  node.textAutoResize = mode;
  node.resize(width, height);
}

export function shrinkTextToFit(node: TextNode, box: FitBox): void {
  const startSize = getFontSize(node);
  if (startSize === null) {
    return;
  }

  withMeasurableHeight(node, () => {
    if (overflows(node, box)) {
      setFontSize(node, findLargestFittingSize(node, box, startSize));
    }
  });
}

export function getMinFontSize(nodes: TextNode[]): number | null {
  const sizes = nodes
    .map(getFontSize)
    .filter((size): size is number => size !== null);
  return sizes.length > 0 ? Math.min(...sizes) : null;
}

export function setNodesFontSize(nodes: TextNode[], size: number): void {
  nodes.forEach((node) => setFontSize(node, size));
}
