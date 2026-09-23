import { ALL_LOCALES } from "../../shared/constants";

type Props = {
  selected: string[];
  onChange: (locales: string[]) => void;
};

const toggle = (list: string[], item: string) =>
  list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];

const LocalePicker = ({ selected, onChange }: Props) => {
  const bulkActions = [
    { label: "Select all", locales: ALL_LOCALES },
    { label: "Deselect all", locales: [] },
  ];

  return (
    <div className="localesModal">
      <div className="localesModalActions">
        {bulkActions.map(({ label, locales }) => (
          <button
            key={label}
            type="button"
            className="localeChip localeChip--action"
            onClick={() => onChange([...locales])}
          >
            {label}
          </button>
        ))}
      </div>
      {ALL_LOCALES.map((locale) => {
        const state = selected.includes(locale) ? "selected" : "unselected";
        return (
          <button
            key={locale}
            type="button"
            className={`localeChip localeChip--${state}`}
            onClick={() => onChange(toggle(selected, locale))}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
};

export default LocalePicker;
