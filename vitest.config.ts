import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = {
  "@": path.resolve(import.meta.dirname, "src"),
  "#shared": path.resolve(import.meta.dirname, "shared"),
};

// Two projects: Worker/shared logic runs in Node with faked bindings (test/, worker/, shared/);
// the React app runs in jsdom with Testing Library (test/ui/).
export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "worker",
          include: ["test/**/*.test.ts", "shared/**/*.test.ts", "worker/**/*.test.ts"],
          exclude: ["test/ui/**"],
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: "ui",
          environment: "jsdom",
          include: ["test/ui/**/*.test.{ts,tsx}"],
          setupFiles: ["test/ui/setup.ts"],
          css: false,
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["worker/**/*.ts", "shared/**/*.ts", "src/**/*.{ts,tsx}"],
      exclude: [
        "worker/parlay/types.ts",
        "worker/env.ts",
        "shared/parlay/settlement-rule.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/components/parlay/types.ts",
        // shadcn primitives are vendored wrappers around Radix; covered only as far as the app uses them.
        "src/components/ui/**",
        // League content is editorial data, not logic.
        "src/config/**",
      ],
      reporter: ["text-summary", "text", "lcov"],
      // `vitest run --coverage` fails below these; CI runs it on every pull request.
      thresholds: {
        "worker/**": { lines: 98, functions: 100, statements: 98, branches: 90 },
        "shared/**": { lines: 98, functions: 100, statements: 98, branches: 90 },
        "src/**": { lines: 90, functions: 90, statements: 90, branches: 80 },
      },
    },
  },
});
