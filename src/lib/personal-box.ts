import { randomBytes } from "node:crypto";

const PERSONAL_PREFIX = "me-";

export function generatePersonalSlug(): string {
  return `${PERSONAL_PREFIX}${randomBytes(4).toString("hex")}`;
}

export function isPersonalBoxSlug(slug: string): boolean {
  return slug.startsWith(PERSONAL_PREFIX);
}

export const PERSONAL_BOX_NAME = "Mi entrenamiento";
export { PERSONAL_PREFIX };
