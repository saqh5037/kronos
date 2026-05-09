export type Unit = "kg" | "lb";
export type Level = "rx" | "scaled" | "beginner";

export const UNIT_TAG_PREFIX = "unit:";
export const LEVEL_TAG_PREFIX = "level:";

export function withReplacedTag(
  tags: string[],
  prefix: string,
  value: string | null,
): string[] {
  const next = tags.filter((t) => !t.startsWith(prefix));
  if (value) next.push(`${prefix}${value}`);
  return next;
}

export function readPrefs(tags: string[]): {
  unit: Unit | null;
  level: Level | null;
} {
  const unit = tags
    .find((t) => t.startsWith(UNIT_TAG_PREFIX))
    ?.slice(UNIT_TAG_PREFIX.length) as Unit | undefined;
  const level = tags
    .find((t) => t.startsWith(LEVEL_TAG_PREFIX))
    ?.slice(LEVEL_TAG_PREFIX.length) as Level | undefined;
  return { unit: unit ?? null, level: level ?? null };
}
