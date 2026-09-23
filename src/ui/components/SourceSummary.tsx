import { summarizeSources } from "../lib/rules";
import type { TextFetchRule } from "../types";

const SourceSummary = ({ rules }: { rules: TextFetchRule[] }) => (
  <div className="sourceSummary">
    {summarizeSources(rules).map(([sourceType, count]) => (
      <span key={sourceType} className={`frameTag frameTag--${sourceType}`}>
        {sourceType} ×{count}
      </span>
    ))}
  </div>
);

export default SourceSummary;
