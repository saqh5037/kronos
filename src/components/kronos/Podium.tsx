"use client";

import { motion } from "framer-motion";
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
        const heightClass = isFirst ? "h-32" : e.rank === 2 ? "h-24" : "h-20";
        const delay = i * 0.1;

        return (
          <motion.div
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
                background: isFirst ? "var(--grad)" : "var(--card-2)",
                border: isFirst ? "none" : "1px solid var(--line)",
                color: isFirst ? "#1c1917" : "var(--text)",
                boxShadow: isFirst ? "0 0 20px rgba(220,75,23,0.25)" : "none",
              }}
            >
              {e.rank}
            </div>
            <div className="text-center min-w-[80px]">
              <p className="text-xs font-medium truncate">{e.name}</p>
              <p
                className="font-mono font-bold text-sm mt-0.5"
                style={{ color: isFirst ? "var(--moss)" : "var(--text)" }}
              >
                {formatScore(e.value, e.scoreType)}
              </p>
              {e.scaling !== "RX" && (
                <span className="text-[10px]" style={{ color: "var(--steel)" }}>
                  {e.scaling}
                </span>
              )}
            </div>
            <div
              className={`w-16 rounded-t-lg ${heightClass}`}
              style={{
                background: isFirst ? "var(--grad)" : "var(--btn-ghost-bg)",
                border: isFirst ? "none" : "1px solid var(--line)",
                borderBottom: "none",
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
