const INT_RE = /^\d+$/;

function parseSegment(raw: string): number | null {
  if (!INT_RE.test(raw)) return null;
  return Number.parseInt(raw, 10);
}

export function parseTimeToSeconds(input: string): number | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;

  const parts = trimmed.split(":");
  if (parts.length !== 2 && parts.length !== 3) return null;

  const nums: number[] = [];
  for (const part of parts) {
    const n = parseSegment(part);
    if (n === null) return null;
    nums.push(n);
  }

  if (parts.length === 2) {
    const [mm, ss] = nums;
    if (ss >= 60) return null;
    return mm * 60 + ss;
  }

  const [hh, mm, ss] = nums;
  if (mm >= 60 || ss >= 60) return null;
  return hh * 3600 + mm * 60 + ss;
}

export function formatSecondsToTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(secs)}`;
  return `${pad(minutes)}:${pad(secs)}`;
}
