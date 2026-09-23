import { useMemo } from "react";
import { TRANSLATION_TYPES } from "../../shared/constants";
import { setAllSources, updateRuleAt } from "../lib/rules";
import { buildStyleGroups, describeStyle, toPreview } from "../lib/text";
import { Input, Select } from "./fields";
import type { TextFetchRule, TranslationType } from "../types";

type Props = {
  rules: TextFetchRule[];
  textKeys: string[];
  textStyles: string[];
  onChange: (rules: TextFetchRule[]) => void;
};

type RowProps = {
  rule: TextFetchRule;
  index: number;
  text: string;
  groupColor?: string;
  groupTitle: string;
  onPatch: (patch: Partial<TextFetchRule>) => void;
};

const RuleValueInput = ({
  rule,
  index,
  onPatch,
}: Pick<RowProps, "rule" | "index" | "onPatch">) =>
  rule.sourceType === "sheet" ? (
    <Input
      aria-label={`Sheet row for text ${index + 1}`}
      placeholder="Row, e.g. 16"
      inputMode="numeric"
      value={rule.range ?? ""}
      onChange={(range) => onPatch({ range })}
    />
  ) : (
    <Input
      aria-label={`Lookup key for text ${index + 1}`}
      placeholder="Lookup key"
      value={rule.lookupKey}
      onChange={(lookupKey) => onPatch({ lookupKey })}
    />
  );

const RuleTableRow = ({
  rule,
  index,
  text,
  groupColor,
  groupTitle,
  onPatch,
}: RowProps) => (
  <div className="ruleRow">
    <span className="ruleIndex">{index + 1}</span>
    <span
      className="styleDot"
      style={groupColor ? { background: groupColor } : undefined}
      title={groupTitle}
      aria-label={groupTitle}
      role="img"
    />
    <span className="rulePreview" title={text}>
      {toPreview(text) || <em>empty</em>}
    </span>
    <Select
      ariaLabel={`Source for text ${index + 1}`}
      value={rule.sourceType}
      options={TRANSLATION_TYPES}
      onChange={(sourceType) => onPatch({ sourceType })}
    />
    <RuleValueInput rule={rule} index={index} onPatch={onPatch} />
  </div>
);

const RuleTable = ({ rules, textKeys, textStyles, onChange }: Props) => {
  const styleGroups = useMemo(() => buildStyleGroups(textStyles), [textStyles]);

  const groupTitle = (index: number) => {
    const style = textStyles[index] ?? "";
    const group = styleGroups.get(style);
    const base = describeStyle(style) || "Unknown style";
    if (!group) {
      return base;
    }
    const others = group.members
      .filter((member) => member !== index)
      .map((member) => member + 1);
    return `${base} · font size synced with text ${others.join(", ")}`;
  };

  return (
    <div className="ruleTable">
      <div className="ruleTableHead">
        <span>Texts ({rules.length})</span>
        <Select<TranslationType | "">
          className="compactSelect"
          title="Set source for all texts"
          value=""
          placeholder="Set all to…"
          options={TRANSLATION_TYPES}
          onChange={(sourceType) =>
            sourceType && onChange(setAllSources(rules, sourceType))
          }
        />
      </div>
      {rules.map((rule, index) => (
        <RuleTableRow
          key={rule.id}
          rule={rule}
          index={index}
          text={textKeys[index] ?? ""}
          groupColor={styleGroups.get(textStyles[index] ?? "")?.color}
          groupTitle={groupTitle(index)}
          onPatch={(patch) => onChange(updateRuleAt(rules, index, patch))}
        />
      ))}
    </div>
  );
};

export default RuleTable;
