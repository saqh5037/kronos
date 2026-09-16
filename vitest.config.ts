import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    // Integration tests need real Postgres — run with `pnpm test:integration`
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
    // Defaults the process timezone to UTC so a local run reproduces CI.
    setupFiles: ["./tests/setup/timezone.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
