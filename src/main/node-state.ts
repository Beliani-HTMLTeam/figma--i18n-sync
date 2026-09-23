const SCALAR_PROPS = [
  "x",
  "y",
  "width",
  "height",
  "opacity",
  "visible",
  "cornerRadius",
  "characters",
  "fontSize",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  "paddingBottom",
  "itemSpacing",
  "layoutMode",
  "primaryAxisAlignItems",
  "counterAxisAlignItems",
];

const PAINT_PROPS = ["fills", "strokes", "effects"];

type NodeRecord = SceneNode & Record<string, unknown>;

function readProps(
  node: NodeRecord,
  props: string[],
  format: (value: unknown) => string | undefined,
): string[] {
  return props
    .filter((prop) => prop in node && node[prop] !== figma.mixed)
    .map((prop) => format(node[prop]))
    .filter((part): part is string => part !== undefined);
}

const formatScalar = (value: unknown) =>
  typeof value === "number" ? String(Math.round(value)) : String(value);

const formatJson = (value: unknown) => {
  try {
    return `${JSON.stringify(value)}`;
  } catch {
    return undefined;
  }
};

export function serializeNodeState(node: SceneNode): string {
  const record = node as NodeRecord;
  const parts = [
    `${node.type}:${node.name}`,
    ...readProps(record, SCALAR_PROPS, formatScalar),
    ...readProps(record, PAINT_PROPS, formatJson),
  ];

  if ("children" in node) {
    const children = node.children.map(serializeNodeState).join(",");
    parts.push(`c${node.children.length}:[${children}]`);
  }

  return parts.join("|");
}
