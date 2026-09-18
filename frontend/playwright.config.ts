import { defineConfig, devices } from "@playwright/test";

/**
 * E2E smoke tests for PCEA Connect.
 *
 * Prerequisites (see ../.freebuff/run.md):
 *  1. Backend running with the in-memory dev profile:
 *     .freebuff/start-backend.ps1 — boots ./gradlew.bat bootRun with
 *     --spring.profiles.active=local --spring.flyway.enabled=false and
 *     --server.port=8090 (this machine's WSL portproxy holds 0.0.0.0:8080;
 *     Apache httpd holds 8081). Flyway is disabled because its Postgres-only
 *     migrations do not run on H2 — Hibernate ddl-auto builds the schema.
 *  2. Frontend dev server running on :3000 pointed at that backend:
 *     .freebuff/start-dev.ps1 -ApiUrl http://localhost:8090
 *
 * Uses the system-installed Google Chrome via channel: "chrome", so no
 * `npx playwright install` browser download is required.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1, // the smoke test registers a fresh user; keep runs serial
  retries: 0,
  timeout: 90_000, // dev-mode on-demand compilation of first routes can be slow
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    channel: "chrome",
    viewport: { width: 1280, height: 800 },
  },
  projects: [{ name: "auth-smoke", use: { ...devices["Desktop Chrome"] } }],
});
