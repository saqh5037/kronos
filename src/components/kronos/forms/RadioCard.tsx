type RadioCardProps = {
  selected: boolean;
  onChange: (selected: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
};

export function RadioCard({
  selected,
  onChange,
  label,
  description,
  icon,
}: RadioCardProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(true)}
      className="w-full px-4 py-4 rounded-xl border text-left transition-all"
      style={{
        background: selected ? "var(--k-surface)" : "transparent",
        borderColor: selected ? "var(--k-accent)" : "var(--k-line-2)",
        borderWidth: selected ? "2px" : "1px",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-5 h-5 rounded-full border mt-0.5 flex-shrink-0"
          style={{
            borderColor: selected ? "var(--k-accent)" : "var(--k-t3)",
            background: selected ? "var(--k-accent)" : "transparent",
          }}
        >
          {selected && (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ color: "var(--k-bg)" }}
            >
              ✓
            </div>
          )}
        </div>
        <div className="flex-1">
          {icon && <div className="text-xl mb-1">{icon}</div>}
          <div
            className="font-semibold text-sm"
            style={{ color: "var(--k-t1)" }}
          >
            {label}
          </div>
          {description && (
            <div className="text-xs mt-0.5" style={{ color: "var(--k-t2)" }}>
              {description}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
