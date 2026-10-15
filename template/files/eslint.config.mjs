import js from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default [
  globalIgnores([
    ".agents/",
    ".claude/",
    ".cursor/",
    "dist/",
    "coverage/",
    ".astro/",
    ".wrangler/",
    "worker-configuration.d.ts",
  ]),
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
  })),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: { parserOptions: { projectService: true } },
  },
  ...eslintPluginAstro.configs.recommended,
  eslintConfigPrettier,
];
