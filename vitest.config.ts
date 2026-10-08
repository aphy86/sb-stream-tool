import { defineConfig } from "vitest/config";

// One entry point for every package's unit tests: `npm run test:unit`.
// Each project keeps its own config (aliases, environment) next to its code.
export default defineConfig({
  test: {
    projects: ["packages/renderer", "packages/main", "packages/common"],
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: { junit: "test-results/junit.xml" },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Measure the logic modules under test, not React components or Electron wiring.
      include: [
        "packages/renderer/src/rate-limit/**/*.ts",
        "packages/renderer/src/utils/helpers.ts",
        "packages/renderer/src/match/helpers.ts",
        "packages/renderer/src/hooks/helpers.ts",
        "packages/renderer/src/platform/registry.ts",
        "packages/common/src/types/settings/shortcut.ts",
        "packages/main/src/components/slippi/helpers.ts",
      ],
      exclude: ["**/*.test.ts"],
      // Quality gate: CI fails if coverage of these modules drops below today's baseline.
      // Raise these as more tests land; never lower them to make a build pass.
      thresholds: {
        statements: 85,
        lines: 85,
        functions: 95,
        branches: 80,
      },
    },
  },
});
