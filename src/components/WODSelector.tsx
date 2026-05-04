"use client";

import { useRouter } from "next/navigation";

type Option = { id: string; name: string };

export default function WODSelector({
  options,
  selected,
}: {
  options: Option[];
  selected?: string;
}) {
  const router = useRouter();

  return (
    <label
      className="flex items-center gap-2 text-xs"
      style={{ color: "var(--text-2)" }}
    >
      <span className="k-eyebrow">WOD</span>
      <select
        defaultValue={selected ?? options[0]?.id}
        onChange={(e) => {
          const wod = e.target.value;
          if (!wod) return;
          router.push(`/admin/leaderboards?wod=${encodeURIComponent(wod)}`);
        }}
        className="px-3 py-2 rounded-lg text-sm border bg-transparent flex-1 max-w-xs"
        style={{
          borderColor: "var(--line)",
          background: "var(--card)",
        }}
      >
        {options.length === 0 && <option value="">— Sin WODs —</option>}
        {options.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </label>
  );
}
