import { getSheetYearOptions } from "../../shared/constants";
import { SelectField, TextField } from "./fields";
import type { ConfigUpdater, FrameConfig } from "../types";

type Props = {
  config: FrameConfig;
  onChange: ConfigUpdater;
  onNumberRows: () => void;
};

const SheetSourceBar = ({ config, onChange, onNumberRows }: Props) => (
  <div className="sheetSource">
    <SelectField
      label="Sheet year"
      value={config.sheetYear}
      options={getSheetYearOptions(config.sheetYear)}
      onChange={(sheetYear) => onChange("sheetYear", sheetYear)}
    />
    <TextField
      label="Sheet tab"
      placeholder="e.g. Voucher - 02.10.26"
      value={config.sheetTab}
      onChange={(sheetTab) => onChange("sheetTab", sheetTab)}
    />
    <button
      type="button"
      className="ghostButton"
      title="Number sheet rows consecutively, starting from the first filled row"
      onClick={onNumberRows}
    >
      Number rows ↓
    </button>
  </div>
);

export default SheetSourceBar;
