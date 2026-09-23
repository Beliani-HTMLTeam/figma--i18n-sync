import { getMinFontSize, setNodesFontSize } from "./text";

export type TypographyGroups = Map<string, TextNode[]>;

type Bucket = {
  minFontSize: number;
  nodes: TextNode[];
};

export function createFontSizeSync() {
  const buckets = new Map<string, Bucket>();

  const add = (key: string, nodes: TextNode[]): void => {
    const localMin = getMinFontSize(nodes);
    if (localMin === null) {
      return;
    }

    const bucket = buckets.get(key);
    if (!bucket) {
      setNodesFontSize(nodes, localMin);
      buckets.set(key, { minFontSize: localMin, nodes: [...nodes] });
      return;
    }

    const targetSize = Math.min(bucket.minFontSize, localMin);
    if (targetSize < bucket.minFontSize) {
      setNodesFontSize(bucket.nodes, targetSize);
    }
    setNodesFontSize(nodes, targetSize);

    bucket.minFontSize = targetSize;
    bucket.nodes.push(...nodes);
  };

  return {
    add,
    addGroups(scope: string, groups: TypographyGroups): void {
      groups.forEach((nodes, key) => add(`${scope}::${key}`, nodes));
    },
  };
}

export type FontSizeSync = ReturnType<typeof createFontSizeSync>;
