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
    coverage: {
      provider: "v8",
      // The Worker and shared parlay logic are what settlement correctness depends on; the
      // React UI is exercised in the browser and excluded until it has its own harness.
      include: ["worker/**/*.ts", "shared/**/*.ts"],
      exclude: ["worker/parlay/types.ts", "worker/env.ts", "shared/parlay/settlement-rule.ts"],
      reporter: ["text-summary", "text", "lcov"],
      // `vitest run --coverage` fails below these; CI runs it on every pull request.
      thresholds: { lines: 98, functions: 100, statements: 98, branches: 90 },
    },
  },
});
