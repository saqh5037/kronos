/**
 * Dashboard greeting (audit 2026-09-15, `/admin` P2 copy).
 *
 * The old code printed a hardcoded "Buenos días" at 12:52 and fell back to the
 * English literal "Owner" — and because `ownerName` was fed from the box in
 * some paths it greeted the user as "Iron". Rules:
 *   - time of day decides días / tardes / noches (box timezone hour)
 *   - the name is the PERSON's first name, never the box name
 *   - no name: plain "Hola", never a placeholder identity
 */

export type Daypart = "morning" | "afternoon" | "evening";

/** 05:00–11:59 morning · 12:00–18:59 afternoon · 19:00–04:59 evening. */
export function daypartForHour(hour: number): Daypart {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 19) return "afternoon";
  return "evening";
}

const DAYPART_GREETING: Record<Daypart, string> = {
  morning: "Buenos días",
  afternoon: "Buenas tardes",
  evening: "Buenas noches",
};

/** "Samuel Quiroz Hernandez" becomes "Samuel". Blank input becomes null. */
export function firstName(fullName: string | null | undefined): string | null {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return null;
  const first = trimmed.split(/\s+/)[0];
  return first || null;
}

/**
 * Hour of `date` in `timeZone` (default America/Mexico_City), so a server in
 * UTC does not greet a Mexican owner with "Buenas noches" at 6 pm.
 */
export function hourInTimeZone(
  date: Date,
  timeZone = "America/Mexico_City",
): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(date);
  const hour = Number.parseInt(parts, 10);
  return Number.isFinite(hour) ? hour % 24 : date.getHours();
}

/**
 * "Buenas tardes, Samuel" · "Hola" when the session carries no name.
 * Never receives or renders the box name.
 */
export function dashboardGreeting(
  userName: string | null | undefined,
  now: Date,
  timeZone = "America/Mexico_City",
): string {
  const name = firstName(userName);
  if (!name) return "Hola";
  const daypart = daypartForHour(hourInTimeZone(now, timeZone));
  return `${DAYPART_GREETING[daypart]}, ${name}`;
}
