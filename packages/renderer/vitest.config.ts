import { defineProject } from "vitest/config";
import path from "path";

// Unit tests run in Node without the React/Tailwind plugins the app build needs.
export default defineProject({
  resolve: {
    alias: {
      "@renderer": path.resolve(import.meta.dirname, "./src"),
      "@app/common": path.resolve(import.meta.dirname, "../common/src/index.ts"),
      // The Electron preload bridge only exists in the running app.
      "@app/preload": path.resolve(import.meta.dirname, "./src/test/preload-stub.ts"),
    },
  },
  test: {
    name: "renderer",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
