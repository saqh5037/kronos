"use client";

type SegmentedOption = { value: string; label: string };

type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (v: string) => void;
};

export function SegmentedControl({
  options,
  value,
  onChange,
}: SegmentedControlProps) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-line-2)",
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors"
            style={{
              background: active ? "var(--k-t1)" : "transparent",
              color: active ? "var(--k-bg)" : "var(--k-t2)",
              fontWeight: active ? 700 : 500,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
