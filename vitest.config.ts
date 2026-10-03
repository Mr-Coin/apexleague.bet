import path from "node:path";
import { defineConfig } from "vitest/config";

// Pure-logic tests run in Node; Worker bindings are faked in test/helpers.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "#shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    include: ["test/**/*.test.ts", "shared/**/*.test.ts", "worker/**/*.test.ts"],
  },
});
