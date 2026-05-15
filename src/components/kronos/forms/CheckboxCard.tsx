"use client";

type CheckboxCardProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
};

export function CheckboxCard({
  checked,
  onChange,
  label,
  description,
}: CheckboxCardProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full px-4 py-4 rounded-xl border text-left transition-all"
      style={{
        background: checked ? "var(--k-surface)" : "transparent",
        borderColor: checked ? "var(--k-accent)" : "var(--k-line-2)",
        borderWidth: checked ? "2px" : "1px",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-5 h-5 rounded-md border mt-0.5 flex-shrink-0"
          style={{
            borderColor: checked ? "var(--k-accent)" : "var(--k-t3)",
            background: checked ? "var(--k-accent)" : "transparent",
          }}
        >
          {checked && (
            <div
              className="w-full h-full flex items-center justify-center text-[11px]"
              style={{ color: "var(--k-bg)" }}
            >
              ✓
            </div>
          )}
        </div>
        <div className="flex-1">
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
