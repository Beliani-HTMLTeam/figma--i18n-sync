const PREVIEW_MAX_LENGTH = 40;

export function toPreview(
  text: string,
  maxLength = PREVIEW_MAX_LENGTH,
): string {
  const singleLine = text.replace(/\s+/g, " ").trim();
  return singleLine.length > maxLength
    ? `${singleLine.slice(0, maxLength - 1)}…`
    : singleLine;
}

const GROUP_COLORS = [
  "#3ea5ff",
  "#57d983",
  "#f3c256",
  "#ff8a4f",
  "#b48cff",
  "#5cd2c5",
  "#ff6fae",
];

export type StyleGroup = { color: string; members: number[] };

export function buildStyleGroups(styles: string[]): Map<string, StyleGroup> {
  const members = new Map<string, number[]>();
  styles.forEach((style, index) =>
    members.set(style, [...(members.get(style) ?? []), index]),
  );

  const groups = new Map<string, StyleGroup>();
  [...members.entries()]
    .filter(([, indexes]) => indexes.length > 1)
    .forEach(([style, indexes], groupIndex) =>
      groups.set(style, {
        color: GROUP_COLORS[groupIndex % GROUP_COLORS.length],
        members: indexes,
      }),
    );
  return groups;
}

export const describeStyle = (style: string): string =>
  style.split("|").filter(Boolean).join(" ");
