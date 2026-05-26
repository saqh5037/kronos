"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { closeSupportSession } from "@/server/actions/support";

type Props = {
  boxName: string;
  expiresAt: Date;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function SupportBanner({ boxName, expiresAt }: Props) {
  const router = useRouter();
  const [remaining, setRemaining] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const expiresAtTime = new Date(expiresAt).getTime();
  const hasRefreshed = useRef(false);

  // Hydration-safe: initialize after mount
  useEffect(() => {
    function tick() {
      const now = Date.now();
      const diff = expiresAtTime - now;
      setRemaining(diff);

      if (diff <= 0 && !hasRefreshed.current) {
        hasRefreshed.current = true;
        router.push("/admin/super/soporte?expired=1");
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAtTime, router]);

  async function handleClose() {
    setClosing(true);
    try {
      await closeSupportSession();
      router.refresh();
    } finally {
      setClosing(false);
    }
  }

  const isExpiringSoon =
    remaining !== null && remaining > 0 && remaining < 5 * 60 * 1000;

  return (
    <div
      className="sticky top-0 z-40 flex items-center justify-between gap-3 px-5 py-2.5"
      style={{
        background: "rgba(255, 176, 32, 0.12)",
        borderBottom: "1px solid rgba(255, 176, 32, 0.35)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{
            background: isExpiringSoon ? "var(--k-danger)" : "var(--k-warning)",
            boxShadow: `0 0 6px ${isExpiringSoon ? "var(--k-danger)" : "var(--k-warning)"}`,
          }}
        />
        <span
          className="text-sm font-semibold truncate"
          style={{ color: "var(--k-warning)" }}
        >
          Sesion de soporte activa
          <span
            className="mx-2 font-normal"
            style={{ color: "rgba(255,176,32,0.6)" }}
          >
            ·
          </span>
          <span style={{ color: "var(--k-t1)" }}>{boxName}</span>
          <span
            className="mx-2 font-normal"
            style={{ color: "rgba(255,176,32,0.6)" }}
          >
            ·
          </span>
          <span
            className="font-mono"
            style={{
              color: isExpiringSoon
                ? "var(--k-danger)"
                : "rgba(255,176,32,0.85)",
            }}
          >
            expira en{" "}
            {remaining === null ? "--:--" : formatCountdown(remaining)}
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={handleClose}
        disabled={closing}
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40"
        style={{
          background: "rgba(255, 176, 32, 0.15)",
          color: "var(--k-warning)",
          border: "1px solid rgba(255, 176, 32, 0.4)",
        }}
      >
        {closing ? "Cerrando…" : "Cerrar sesion"}
      </button>
    </div>
  );
}
