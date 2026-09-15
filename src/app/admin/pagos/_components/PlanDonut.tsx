"use client";

import { DonutChart } from "@/components/charts/DonutChart";

type Datum = { name: string; value: number };

/**
 * Plan mix. The donut used to be all one lime with no labels or values, so it
 * read as decoration: the legend now carries the name, the count and the share,
 * and each segment varies only in opacity to stay monochrome.
 */
export function PlanDonut({ data }: { data: Datum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const shaded = data.map((d, i) => ({
    ...d,
    color: `rgba(200, 255, 45, ${Math.max(0.28, 1 - i * 0.18).toFixed(2)})`,
  }));

  return (
    <div className="flex flex-col gap-3">
      <DonutChart
        data={shaded}
        height={200}
        formatter={(v: number, n: string) =>
          `${n}: ${v} ${v === 1 ? "membresía" : "membresías"}`
        }
      />
      <ul className="flex flex-col gap-1.5">
        {shaded.map((d) => (
          <li
            key={d.name}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              />
              <span className="truncate" style={{ color: "var(--k-t2)" }}>
                {d.name}
              </span>
            </span>
            <span
              className="font-display shrink-0 font-bold"
              style={{ color: "var(--k-t1)" }}
            >
              {d.value}
              <span
                className="ml-1 font-normal"
                style={{ color: "var(--k-t3)" }}
              >
                {total === 0
                  ? ""
                  : `· ${Math.round((d.value / total) * 100)} %`}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
