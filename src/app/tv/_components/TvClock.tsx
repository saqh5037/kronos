"use client";

import { useEffect, useState } from "react";
import { formatDateWeekday, formatTime24 } from "@/lib/format";

/**
 * The wall clock on the box TV.
 *
 * `src/app/tv/[slug]/page.tsx` is a server component with `revalidate = 30`,
 * so a `new Date()` read during its render is frozen at the instant the page
 * was generated — the screen on the wall showed the time the HTML was built,
 * not the time in the room, and it only moved when the data happened to be
 * revalidated. It also read the SERVER's clock, not the box's.
 *
 * Rendering `null` until mounted keeps the server and client markup identical
 * (CLAUDE.md, "Hydration patterns"); the reserved height stops the header from
 * jumping when the clock appears. 15 s is short enough that the displayed
 * minute is never visibly wrong and long enough to be free on an always-on TV.
 */
export function TvClock({
  timeZone,
}: {
  /** Box timezone. Falls back to the product default in `src/lib/format.ts`. */
  timeZone?: string;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="text-right min-w-0">
      <p
        className="font-mono font-bold"
        style={{
          color: "var(--k-t1)",
          fontSize: "clamp(40px, 11vw, 88px)",
          lineHeight: 1,
          // Reserve the line while `now` is null so nothing reflows on mount.
          minHeight: "1em",
        }}
        suppressHydrationWarning
      >
        {now ? formatTime24(now, timeZone) : ""}
      </p>
      <p
        className="k-eyebrow mt-1"
        style={{ color: "var(--k-t3)", minHeight: "1em" }}
        suppressHydrationWarning
      >
        {now ? formatDateWeekday(now, timeZone) : ""}
      </p>
    </div>
  );
}
