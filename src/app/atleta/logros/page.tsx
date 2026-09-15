import { Suspense } from "react";
import type { Metadata } from "next";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import {
  LogrosContent,
  LogrosContentSkeleton,
} from "./_components/LogrosContent";
import { LogrosXPHeader, LogrosXPHeaderSkeleton } from "./_components/LogrosXP";

export const metadata: Metadata = { title: "Logros · Kronos" };
export const dynamic = "force-dynamic";

export default function LogrosPage() {
  return (
    <main
      className="min-h-screen pb-28"
      style={{ background: "var(--k-bg)", color: "var(--k-t1)" }}
    >
      {/* HEADER — paints immediately. The back link sits in its own row with a
          left gutter so the fixed hamburger (12 px + 40 px) never covers it. */}
      <header className="px-4 pt-5 pb-4">
        <div className="pl-12 lg:pl-0" style={{ marginBottom: 4 }}>
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <div className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          Logros
        </div>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            lineHeight: 1.05,
            marginTop: 4,
          }}
        >
          Tus logros
        </h1>
      </header>

      {/* XP + level — the same ledger the home reads, so the two screens
          can no longer disagree. */}
      <Suspense fallback={<LogrosXPHeaderSkeleton />}>
        <LogrosXPHeader />
      </Suspense>

      {/* BADGES GRID — deferred */}
      <Suspense fallback={<LogrosContentSkeleton />}>
        <LogrosContent />
      </Suspense>
    </main>
  );
}
