import {
  useEffect,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> & {
  value: string | number;
  onChange?: (value: string) => void;
};

export const Input = ({ onChange, ...inputProps }: InputProps) => (
  <input {...inputProps} onChange={(event) => onChange?.(event.target.value)} />
);

type SelectProps<T extends string> = {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  title?: string;
  ariaLabel?: string;
};

export const Select = <T extends string>({
  value,
  options,
  onChange,
  placeholder,
  className,
  title,
  ariaLabel,
}: SelectProps<T>) => (
  <select
    className={className}
    title={title}
    aria-label={ariaLabel ?? title}
    value={value}
    onChange={(event) => onChange(event.target.value as T)}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
);

const Labeled = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) => (
  <label>
    <span className="labelText">
      {label}
      {hint && <span className="labelHint">{hint}</span>}
    </span>
    {children}
  </label>
);

export const TextField = ({
  label,
  hint,
  ...props
}: InputProps & { label: string; hint?: string }) => (
  <Labeled label={label} hint={hint}>
    <Input {...props} />
  </Labeled>
);

type NumberFieldProps = {
  label: string;
  value: number;
  min?: number;
  onChange: (value: number) => void;
};

export const NumberField = ({
  label,
  value,
  min = 0,
  onChange,
}: NumberFieldProps) => {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const update = (next: string) => {
    setDraft(next);
    const parsed = Number(next);
    if (next.trim() !== "" && Number.isFinite(parsed) && parsed >= min) {
      onChange(parsed);
    }
  };

  return (
    <Labeled label={label}>
      <Input
        type="number"
        min={min}
        value={draft}
        onChange={update}
        onBlur={() => setDraft(String(value))}
      />
    </Labeled>
  );
};

export const SelectField = <T extends string>({
  label,
  ...props
}: SelectProps<T> & { label: string }) => (
  <Labeled label={label}>
    <Select {...props} />
  </Labeled>
);

type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export const CheckboxField = ({
  label,
  checked,
  onChange,
}: CheckboxFieldProps) => (
  <label className="checkboxRow">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span>{label}</span>
  </label>
);
