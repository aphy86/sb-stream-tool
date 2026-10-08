import { defineProject } from "vitest/config";
import path from "path";

export default defineProject({
  resolve: {
    alias: {
      "@app/common": path.resolve(import.meta.dirname, "../common/src/index.ts"),
      // @app/common pulls a type from the renderer package; resolve it the same way the app does.
      "@renderer": path.resolve(import.meta.dirname, "../renderer/src"),
    },
  },
  test: {
    name: "main",
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Let Node load slippi-js directly instead of running it through Vite. Faster, and avoids
    // harmless "Sourcemap ... points to missing source files" warnings from its published package.
    server: { deps: { external: [/@slippi\/slippi-js/] } },
  },
});
