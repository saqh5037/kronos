/**
 * Aggregate tonnage entries into time buckets (day / week / month).
 * Pure — no DB. ISO week format `YYYY-Www`.
 */

export type TonnageEntry = {
  date: Date | string;
  kg: number;
};

export type Period = "day" | "week" | "month";

export type TonnageBucket = {
  bucket: string;
  kg: number;
  sessions: number;
};

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * ISO week number per ISO-8601 (week 01 contains the first Thursday).
 * Returns `YYYY-Www`.
 */
export function isoWeekKey(d: Date): string {
  const t = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return `${t.getUTCFullYear()}-W${pad2(week)}`;
}

export function dayKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(
    d.getUTCDate(),
  )}`;
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

function bucketKey(d: Date, period: Period): string {
  switch (period) {
    case "day":
      return dayKey(d);
    case "week":
      return isoWeekKey(d);
    case "month":
      return monthKey(d);
  }
}

/**
 * Bucket entries by period and sum kg + count sessions per bucket.
 * Output is sorted ascending by bucket key.
 */
export function aggregateTonnageByPeriod(
  entries: TonnageEntry[],
  period: Period,
): TonnageBucket[] {
  const map = new Map<string, { kg: number; sessions: number }>();
  for (const e of entries) {
    const key = bucketKey(toDate(e.date), period);
    const acc = map.get(key);
    if (acc) {
      acc.kg += e.kg;
      acc.sessions += 1;
    } else {
      map.set(key, { kg: e.kg, sessions: 1 });
    }
  }
  return Array.from(map.entries())
    .map(([bucket, v]) => ({
      bucket,
      kg: Math.round(v.kg * 100) / 100,
      sessions: v.sessions,
    }))
    .sort((a, b) => (a.bucket < b.bucket ? -1 : a.bucket > b.bucket ? 1 : 0));
}
