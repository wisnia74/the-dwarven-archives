import jseslint from "@eslint/js";
import eslintPluginPerfectionist from "eslint-plugin-perfectionist";
import eslintPluginReactDOM from "eslint-plugin-react-dom";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import eslintPluginReactX from "eslint-plugin-react-x";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import path from "node:path";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([
  globalIgnores(["dist"]),
  {
    extends: [
      jseslint.configs.recommended,
      eslintPluginPerfectionist.configs["recommended-alphabetical"],
    ],
    files: ["**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts,d.ts}"],
    languageOptions: {
      globals: globals.browser,
    },
    name: "base",
    plugins: { "unused-imports": eslintPluginUnusedImports },
    rules: {
      "no-unused-vars": "off",
      "perfectionist/sort-modules": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{ts,tsx,cts,mts,d.ts}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: __dirname,
      },
    },
    name: "typescript",
    rules: {
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    extends: [
      eslintPluginReactDOM.configs.recommended,
      eslintPluginReactHooks.configs.flat.recommended,
      eslintPluginReactRefresh.configs.vite,
      eslintPluginReactX.configs["recommended-typescript"],
    ],
    files: ["**/*.{tsx}"],
    name: "react",
  },
  // Disable some rules for test files
  {
    files: ["**/*.test.{ts,tsx,cts,mts}"],
    name: "test-file-overrides",
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
]);
