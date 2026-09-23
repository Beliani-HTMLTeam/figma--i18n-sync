import { useState } from "react";
import { Icon } from "@iconify/react";
import { ALL_LOCALES } from "../../shared/constants";
import { buildLocaleFrameName } from "../../shared/naming";
import { hasSheetRules, numberSheetRanges } from "../lib/rules";
import FitControls from "./FitControls";
import FrameNameEditor from "./FrameNameEditor";
import LocalePicker from "./LocalePicker";
import RuleTable from "./RuleTable";
import SheetSourceBar from "./SheetSourceBar";
import SourceSummary from "./SourceSummary";
import { TextField } from "./fields";
import type { ConfigUpdater, FrameConfig, FrameInfo } from "../types";

type Props = {
  frame: FrameInfo;
  config: FrameConfig;
  dateValue: string;
  issues: string[];
  onChange: ConfigUpdater;
  onRename: (name: string) => void;
  onApplyToOthers?: () => void;
};

const FALLBACK_PREVIEW_LOCALE = "uk";
const ICON_SIZE = "14";

export const CloneCard = ({ frame }: { frame: FrameInfo }) => (
  <article className="card card--muted">
    <header className="cardHeader">
      <Icon icon="mdi:content-copy" width={ICON_SIZE} height={ICON_SIZE} />
      <h2 title={frame.name}>{frame.name}</h2>
    </header>
    <p className="cardNote">
      Generated translation of <strong>{frame.generatedFrom}</strong>. Select
      the source frame to change settings or regenerate. This frame is skipped.
    </p>
  </article>
);

const FrameCard = ({
  frame,
  config,
  dateValue,
  issues,
  onChange,
  onRename,
  onApplyToOthers,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLocalePickerOpen, setIsLocalePickerOpen] = useState(false);

  const previewLocale = (
    config.selectedLocales[0] ?? FALLBACK_PREVIEW_LOCALE
  ).toLowerCase();
  const namePreview = buildLocaleFrameName(
    previewLocale,
    config,
    dateValue,
    frame.name,
  );

  return (
    <article className={`card ${issues.length > 0 ? "card--invalid" : ""}`}>
      <header className="cardHeader">
        <button
          type="button"
          className="iconButton"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-label={isExpanded ? "Collapse frame" : "Expand frame"}
          aria-expanded={isExpanded}
        >
          <Icon
            icon={isExpanded ? "mdi:chevron-down" : "mdi:chevron-right"}
            width={ICON_SIZE}
            height={ICON_SIZE}
          />
        </button>
        <div className="nameRow">
          <FrameNameEditor name={frame.name} onCommit={onRename} />
        </div>
        <span className="cardMeta">
          {Math.round(frame.width)}×{Math.round(frame.height)}
        </span>
        <button
          type="button"
          className={`localeToggle ${isLocalePickerOpen ? "localeToggle--open" : ""}`}
          onClick={() => setIsLocalePickerOpen((open) => !open)}
          aria-expanded={isLocalePickerOpen}
          title="Select languages"
        >
          <Icon icon="mdi:globe" width={ICON_SIZE} height={ICON_SIZE} />
          {config.selectedLocales.length}/{ALL_LOCALES.length}
        </button>
        <SourceSummary rules={config.rules} />
      </header>

      {isLocalePickerOpen && (
        <LocalePicker
          selected={config.selectedLocales}
          onChange={(locales) => onChange("selectedLocales", locales)}
        />
      )}

      {isExpanded && (
        <>
          <div className="namingRow">
            <TextField
              label="Delimiter"
              placeholder="_"
              value={config.delimiter}
              onChange={(delimiter) => onChange("delimiter", delimiter)}
            />
            <TextField
              label="Name suffix"
              hint="%date% = date"
              placeholder="%date%_Cat00"
              value={config.nameSuffix}
              onChange={(nameSuffix) => onChange("nameSuffix", nameSuffix)}
            />
            <TextField
              label="Preview"
              value={namePreview}
              readOnly
              tabIndex={-1}
            />
          </div>

          {hasSheetRules(config.rules) && (
            <SheetSourceBar
              config={config}
              onChange={onChange}
              onNumberRows={() =>
                onChange("rules", numberSheetRanges(config.rules))
              }
            />
          )}

          <RuleTable
            rules={config.rules}
            textKeys={frame.textKeys}
            textStyles={frame.textStyles}
            onChange={(rules) => onChange("rules", rules)}
          />

          <FitControls config={config} onChange={onChange} />

          {onApplyToOthers && (
            <button
              type="button"
              className="ghostButton alignStart"
              onClick={onApplyToOthers}
            >
              Copy settings to other frames
            </button>
          )}
        </>
      )}

      {issues.length > 0 && (
        <ul className="issues">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
    </article>
  );
};

export default FrameCard;
