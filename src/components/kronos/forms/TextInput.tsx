type TextInputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  type?: string;
};

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  type = "text",
}: TextInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none transition-colors"
        style={{
          background: "var(--k-surface)",
          borderColor: "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      />
    </div>
  );
}
