import { defineProject } from "vitest/config";
import path from "path";

export default defineProject({
  resolve: {
    alias: {
      // Some shared types live in the renderer package.
      "@renderer": path.resolve(import.meta.dirname, "../renderer/src"),
    },
  },
  test: {
    name: "common",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
