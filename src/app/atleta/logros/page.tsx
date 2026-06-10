import { Suspense } from "react";
import type { Metadata } from "next";
import {
  LogrosContent,
  LogrosContentSkeleton,
} from "./_components/LogrosContent";

export const metadata: Metadata = { title: "Logros · Kronos" };
export const dynamic = "force-dynamic";

export default function TrophyRoomPage() {
  return (
    <main
      className="min-h-screen pb-28"
      style={{ background: "var(--k-bg)", color: "var(--k-t1)" }}
    >
      {/* HEADER — paints immediately */}
      <header className="px-4 pt-5 pb-4">
        <div className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          Trophy Room · Atleta
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

      {/* BADGES GRID — deferred */}
      <Suspense fallback={<LogrosContentSkeleton />}>
        <LogrosContent />
      </Suspense>
    </main>
  );
}
