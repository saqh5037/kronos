type NumberStepperProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export function NumberStepper({
  label,
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
}: NumberStepperProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-10 rounded-lg border flex items-center justify-center font-semibold disabled:opacity-50"
          style={{
            borderColor: "var(--k-line-2)",
            background: "var(--k-surface)",
            color: "var(--k-t1)",
          }}
        >
          −
        </button>
        <div
          className="flex-1 text-center font-mono text-lg font-bold"
          style={{ color: "var(--k-t1)" }}
        >
          {value}
        </div>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-10 h-10 rounded-lg border flex items-center justify-center font-semibold disabled:opacity-50"
          style={{
            borderColor: "var(--k-line-2)",
            background: "var(--k-surface)",
            color: "var(--k-t1)",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
