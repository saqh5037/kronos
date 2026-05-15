export function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden"
      style={{ background: "var(--k-line)" }}
    >
      <div
        className="h-full transition-all"
        style={{
          width: `${pct}%`,
          background: "var(--k-t1)",
          boxShadow: "0 0 8px rgba(255,255,255,0.06)",
        }}
      />
    </div>
  );
}
