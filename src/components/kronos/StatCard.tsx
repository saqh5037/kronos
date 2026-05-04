type Tone = "recovery" | "strain" | "pr";

const TONE_VAR: Record<Tone, string> = {
  recovery: "var(--recovery)",
  strain: "var(--strain)",
  pr: "var(--pr)",
};

export function KPI({
  label,
  value,
  subtitle,
  tone,
  delta,
}: {
  label: string;
  value: string;
  subtitle?: string;
  tone?: Tone;
  delta?: number;
}) {
  const color = tone ? TONE_VAR[tone] : "var(--text)";
  return (
    <div className="k-card p-4">
      <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
        {label}
      </p>
      <p className="font-display font-bold text-3xl mt-1" style={{ color }}>
        {value}
      </p>
      {delta !== undefined && delta !== 0 && (
        <p
          className="text-[10px] font-mono mt-1"
          style={{
            color:
              delta > 0
                ? "var(--recovery)"
                : delta < 0
                  ? "var(--pr)"
                  : "var(--text-3)",
          }}
        >
          {delta > 0 ? "↑" : "↓"} {Math.abs(Math.round(delta * 100))}% vs mes
          anterior
        </p>
      )}
      {subtitle && (
        <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function SimpleCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="k-card p-4">
      <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
        {label}
      </p>
      <p className="font-display font-bold text-2xl mt-1">{value}</p>
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
