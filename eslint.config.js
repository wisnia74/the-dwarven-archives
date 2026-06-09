import jseslint from "@eslint/js";
import eslintPluginPerfectionist from "eslint-plugin-perfectionist";
import eslintPluginReactDOM from "eslint-plugin-react-dom";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import eslintPluginReactRefresh from "eslint-plugin-react-refresh";
import eslintPluginReactX from "eslint-plugin-react-x";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    extends: [
      jseslint.configs.recommended,
      eslintPluginPerfectionist.configs["recommended-alphabetical"],
    ],
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    name: "base",
  },
  {
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    name: "typescript",
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
]);
