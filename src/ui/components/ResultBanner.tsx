import { Icon } from "@iconify/react";
import type { GenerationResult } from "../hooks/useFrameConfigs";

type Props = {
  result: GenerationResult;
  onDismiss: () => void;
};

const COUNT_LABELS = [
  ["created", "created"],
  ["updated", "updated"],
  ["renamed", "renamed"],
  ["upToDate", "up to date"],
] as const;

const ResultBanner = ({ result, onDismiss }: Props) => {
  const isFailed = result.status === "failed";
  const warnings = isFailed ? [] : result.report.warnings;
  const summary = isFailed
    ? `Generation failed: ${result.error}`
    : COUNT_LABELS.filter(([key]) => result.report[key] > 0)
        .map(([key, label]) => `${result.report[key]} ${label}`)
        .join(" · ") || "Nothing to generate";

  return (
    <section
      className={`resultBanner ${isFailed ? "resultBanner--error" : warnings.length > 0 ? "resultBanner--warning" : ""}`}
      role="status"
    >
      <div className="resultBannerHead">
        <Icon
          icon={isFailed ? "mdi:alert-circle" : "mdi:check-circle"}
          width="14"
          height="14"
        />
        <span className="resultBannerSummary">{summary}</span>
        <button
          type="button"
          className="iconButton"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <Icon icon="mdi:close" width="12" height="12" />
        </button>
      </div>
      {warnings.length > 0 && (
        <details>
          <summary>{warnings.length} warning(s)</summary>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
};

export default ResultBanner;
