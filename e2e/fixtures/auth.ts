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
    // Generous timeout: the first navigation after login may hit a cold Next
    // dev compile of the destination route, which can exceed 10s.
    // Regex matches /admin, /admin/, /admin/*, /atleta, /atleta/, /atleta/*
    page.waitForURL(/\/(admin|atleta)(\/|$|\?)/, { timeout: 30_000 }),
    page.getByRole("button", { name: /Entrar \(dev\)/ }).click(),
  ]);
}

export async function signOut(page: Page): Promise<void> {
  // The app uses a custom /logout page (not the NextAuth /api/auth/signout
  // default). Pass callbackUrl=/login so after signout we land on /login.
  await page.goto("/logout?callbackUrl=/login");
  await page
    .getByRole("button", { name: /cerrar sesión/i })
    .click({ timeout: 10_000 });
  await page.waitForURL(/\/login/, { timeout: 15_000 });
}
