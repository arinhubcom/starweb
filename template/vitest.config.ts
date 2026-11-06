import { cloudflareTest } from "@cloudflare/vitest-plugin";
import {
  configDefaults,
  coverageConfigDefaults,
  defineConfig,
} from "vitest/config";

// Tests use relative imports: `@/` does not resolve. To use it, add
// `resolve.alias` `@` here.
// tsconfig.json needs `@cloudflare/vitest-plugin/types` in
// `compilerOptions.types` and the test folder in `include`, else `astro check`
// reports `Cannot find module 'cloudflare:test'`.
export default defineConfig({
  plugins: [
    // Per app database: `readD1Migrations()` with its `migrations_dir`
    // (`migrations/app1`), own binding in `miniflare.bindings`
    // (`APP1_TEST_MIGRATIONS`). test/setup.ts applies them.
    cloudflareTest({ wrangler: { configPath: "./wrangler.test.jsonc" } }),
  ],
  test: {
    setupFiles: ["./test/setup.ts"],
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      // No `v8`: the plugin does not support it.
      // https://developers.cloudflare.com/workers/testing/vitest-integration/known-issues/
      provider: "istanbul",
      // The default counts only imported files.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/*.stories.*",
        "src/live.config.ts",
        "src/middleware.ts",
        "src/worker.ts",
        "src/utils/site-identity.ts",
        "src/lib/utils.ts",
        "src/components/ui/**/index.ts",
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
