import { expect, type Page } from "@playwright/test";

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
    // dev compile of the destination route. 30 s was not enough — `/atleta` and
    // `/admin` are the two heaviest routes in the app and `waitForURL` waits for
    // `load`, which a streaming RSC page only reaches once the compile is done.
    // The suite timeout is 90 s (playwright.config.ts), so this stays inside it.
    // Regex matches /admin, /admin/, /admin/*, /atleta, /atleta/, /atleta/*
    page.waitForURL(/\/(admin|atleta)(\/|$|\?)/, { timeout: 60_000 }),
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

  // `waitForURL(/\/login/)` used to match the `callbackUrl=/login` QUERY STRING
  // of the page we were already on, so it returned instantly, before NextAuth
  // had finished. The next navigation then aborted the in-flight `/api/auth/csrf`
  // request ("CLIENT_FETCH_ERROR … Failed to fetch"), the cookie survived, and
  // a following `loginAs` with a DIFFERENT role silently stayed on the previous
  // user — `/login` just bounced it back. Match the pathname, then confirm the
  // session is really gone before handing the page back.
  await page.waitForURL((url) => url.pathname === "/login", {
    timeout: 15_000,
  });
  await expect
    .poll(
      async () => {
        const res = await page.request.get("/api/auth/session");
        const body = (await res.json()) as { user?: unknown } | null;
        return body?.user ? "signed-in" : "signed-out";
      },
      { timeout: 10_000 },
    )
    .toBe("signed-out");
}
