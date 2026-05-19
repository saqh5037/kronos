import type { Page } from "@playwright/test";

export const SEED_USERS = {
  owner: { email: "owner@iron-hands.demo", expectedPath: "/admin" },
  coach: { email: "coach@iron-hands.demo", expectedPath: "/admin" },
  atleta: { email: "atleta@iron-hands.demo", expectedPath: "/admin" },
} as const;

export type Role = keyof typeof SEED_USERS;

const DEV_PASSWORD = process.env.DEV_PASSWORD ?? "dev";

/**
 * Logs in via the dev CredentialsProvider (NODE_ENV=development).
 * Assumes seed has run (pnpm db:seed) and dev login UI is enabled
 * (NEXT_PUBLIC_DEV_LOGIN=1). After login the user lands on /admin
 * regardless of role — middleware does not enforce role yet (Fase 2 deuda).
 */
export async function loginAs(page: Page, role: Role): Promise<void> {
  const user = SEED_USERS[role];
  await page.goto("/login");
  await page.locator('input[placeholder="email"]').fill(user.email);
  await page.locator('input[placeholder="password"]').fill(DEV_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/(admin|atleta)/, { timeout: 10_000 }),
    page.getByRole("button", { name: /Entrar \(dev\)/ }).click(),
  ]);
}

export async function signOut(page: Page): Promise<void> {
  await page.goto("/api/auth/signout");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/login/);
}

/**
 * Login vía dev CredentialsProvider con email arbitrario.
 * Útil para atletas creados dinámicamente (p.ej. via inviteAthletes).
 * Requiere que el User exista en DB y NODE_ENV=development + NEXT_PUBLIC_DEV_LOGIN=1.
 */
export async function loginAsEmail(page: Page, email: string): Promise<void> {
  await page.goto("/login");
  await page.locator('input[placeholder="email"]').fill(email);
  await page.locator('input[placeholder="password"]').fill(DEV_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/(admin|atleta)/, { timeout: 10_000 }),
    page.getByRole("button", { name: /Entrar \(dev\)/ }).click(),
  ]);
}
