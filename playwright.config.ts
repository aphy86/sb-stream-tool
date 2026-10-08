import { defineConfig } from "@playwright/test";

/**
 * End-to-end tests launch the real Electron app from the build output.
 * Run `npm run test:e2e` (builds first) or `npm test` (uses the existing build).
 */
export default defineConfig({
  testDir: "./tests",
  // One app at a time: the app holds a single-instance lock and a fixed overlay port (20242).
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
