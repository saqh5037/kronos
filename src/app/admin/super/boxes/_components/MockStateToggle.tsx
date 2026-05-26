"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import type { MockState } from "./types";

const STATES: { key: MockState; label: string; shortcut: string }[] = [
  { key: "positive", label: "Positivo", shortcut: "1" },
  { key: "negative", label: "Negativo", shortcut: "2" },
  { key: "neutral", label: "Neutro", shortcut: "3" },
];

export function MockStateToggle() {
  // Only render in development
  if (process.env.NODE_ENV !== "development") return null;

  return <MockStateToggleInner />;
}

function MockStateToggleInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = (searchParams.get("__mock") ?? "positive") as MockState;

  const setMock = useCallback(
    (state: MockState) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("__mock", state);
      router.replace(`${pathname}?${next.toString()}` as never, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  // Keyboard shortcuts: Ctrl+1/2/3
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.ctrlKey) return;
      if (e.key === "1") setMock("positive");
      if (e.key === "2") setMock("negative");
      if (e.key === "3") setMock("neutral");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setMock]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        background: "var(--k-surface)",
        border: "1px solid var(--k-line-2)",
        borderRadius: 12,
        padding: "10px 12px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          color: "var(--k-t3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 4,
        }}
      >
        Mock state
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        {STATES.map(({ key, label, shortcut }) => {
          const isActive = current === key;
          const color =
            key === "positive"
              ? "var(--k-accent)"
              : key === "negative"
                ? "var(--k-danger)"
                : "var(--k-warning)";

          return (
            <button
              key={key}
              type="button"
              onClick={() => setMock(key)}
              title={`Ctrl+${shortcut}`}
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${isActive ? color : "var(--k-line)"}`,
                background: isActive ? `${color}1a` : "transparent",
                color: isActive ? color : "var(--k-t3)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          color: "var(--k-t3)",
          marginTop: 2,
        }}
      >
        Ctrl+1/2/3 para alternar
      </span>
    </div>
  );
}
