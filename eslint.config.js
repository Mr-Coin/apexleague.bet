import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["dist", ".wrangler", "coverage", "worker-configuration.d.ts"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022 },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}", "shared/**/*.ts"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      "react-refresh/only-export-components": ["error", { allowConstantExport: true, allowExportNames: ["badgeVariants", "buttonVariants"] }],
    },
  },
  {
    files: ["worker/**/*.ts", "shared/**/*.ts", "test/**/*.ts"],
    languageOptions: { globals: { ...globals.serviceworker, ...globals.es2022 } },
  },
  {
    files: ["*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
);
