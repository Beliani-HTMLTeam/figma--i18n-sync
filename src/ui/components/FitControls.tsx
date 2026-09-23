import { CheckboxField, NumberField } from "./fields";
import type { ConfigUpdater, FrameConfig } from "../types";

type Props = {
  config: FrameConfig;
  onChange: ConfigUpdater;
};

const FitControls = ({ config, onChange }: Props) => (
  <div className="fitControls">
    <CheckboxField
      label="Shrink text to fit its container"
      checked={config.resizeTextToFit}
      onChange={(checked) => onChange("resizeTextToFit", checked)}
    />
    <CheckboxField
      label="Remove text layers without translation"
      checked={config.removeEmptyTextNodes}
      onChange={(checked) => onChange("removeEmptyTextNodes", checked)}
    />

    {config.resizeTextToFit && (
      <div className="fitControlsRow">
        <NumberField
          label="Side padding (px)"
          value={config.fitPadding}
          onChange={(value) => onChange("fitPadding", value)}
        />
        <CheckboxField
          label="Same font size across frames of one language"
          checked={config.resizeWithinCountryScope}
          onChange={(checked) => onChange("resizeWithinCountryScope", checked)}
        />
      </div>
    )}
  </div>
);

export default FitControls;
