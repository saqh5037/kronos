import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/fixtures/**"],
  /**
   * Playwright's 30 s default was measuring the Next DEV COMPILER, not the
   * product: the first hit on a heavy route (`/admin/leaderboards`,
   * `/admin/auditoria`, `/atleta/wod`) can spend 20-40 s compiling, and
   * `page.goto` inherits the test timeout. That produced a rotating cast of
   * "failures" whose only symptom was `page.goto: Test timeout exceeded`, on a
   * different spec each run depending on which one hit the route first.
   *
   * This bounds the TEST, not the assertions — every `expect` keeps its own
   * (5 s by default, or whatever the spec passes), so nothing waits longer for
   * a real defect than it did before.
   */
  timeout: 90_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: "development",
      NEXT_PUBLIC_DEV_LOGIN: "1",
      DEV_PASSWORD: process.env.DEV_PASSWORD ?? "dev",
    },
  },
});
