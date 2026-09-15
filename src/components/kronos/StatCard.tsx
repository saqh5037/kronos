import { cn } from "@/lib/utils";

type Tone = "moss" | "steel" | "ember" | "fire";

/** Decorative tones are one hue; `--k-warning` is not a decoration. */
const toneMap: Record<Tone, string> = {
  moss: "var(--k-accent)",
  steel: "var(--k-t2)",
  ember: "var(--k-accent)",
  fire: "var(--k-accent)",
};

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  tone?: Tone;
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  tone,
  className,
}: StatCardProps) {
  const color = tone ? toneMap[tone] : "var(--k-t1)";
  return (
    <div className={cn("k-card p-4", className)}>
      <p className="k-eyebrow mb-1" style={{ color: "var(--k-t3)" }}>
        {label}
      </p>
      <p
        className="font-display text-2xl font-bold tracking-tight"
        style={{ color }}
      >
        {value}
      </p>
      {delta && (
        <p className="mt-1 text-xs" style={{ color: "var(--k-t2)" }}>
          {delta}
        </p>
      )}
    </div>
  );
}
