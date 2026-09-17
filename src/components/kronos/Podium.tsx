"use client";

import { m } from "framer-motion";
import { formatScore } from "@/lib/scores";
import type { ScoreType } from "@/lib/validations/wod";

interface PodiumEntry {
  rank: number;
  name: string;
  value: number;
  scoreType: ScoreType;
  scaling: string;
}

export default function Podium({ entries }: { entries: PodiumEntry[] }) {
  if (entries.length === 0) return null;

  const top3 = entries.slice(0, 3);
  // Reorder for visual: 2nd, 1st, 3rd
  const ordered =
    top3.length === 1
      ? [top3[0]]
      : top3.length === 2
        ? [top3[1], top3[0]]
        : [top3[1], top3[0], top3[2]];

  return (
    <div className="flex items-end justify-center gap-3 mb-6">
      {ordered.map((e, i) => {
        const isFirst = e.rank === 1;
        // Rank is intensity of one thing, so it is one hue at three opacities.
        const rankOpacity = e.rank === 1 ? 1 : e.rank === 2 ? 0.7 : 0.4;
        const heightClass = isFirst ? "h-32" : e.rank === 2 ? "h-24" : "h-20";
        const delay = i * 0.1;

        return (
          <m.div
            key={e.rank}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm"
              style={{
                background: "var(--k-accent)",
                opacity: rankOpacity,
                border: "none",
                color: "var(--k-accent-on)",
              }}
            >
              {e.rank}
            </div>
            <div className="text-center min-w-[80px]">
              <p className="text-xs font-medium truncate">{e.name}</p>
              <p
                className="font-mono font-bold text-sm mt-0.5"
                style={{
                  color: "var(--k-accent)",
                  opacity: rankOpacity,
                }}
              >
                {formatScore(e.value, e.scoreType)}
              </p>
              {e.scaling !== "RX" && (
                <span className="text-[10px]" style={{ color: "var(--k-t2)" }}>
                  {e.scaling}
                </span>
              )}
            </div>
            <div
              className={`w-16 rounded-t-lg ${heightClass}`}
              style={{
                background: "var(--k-accent)",
                opacity: rankOpacity,
                border: "none",
                borderBottom: "none",
              }}
            />
          </m.div>
        );
      })}
    </div>
  );
}
