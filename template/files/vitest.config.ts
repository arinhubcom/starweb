import { cloudflareTest } from "@cloudflare/vitest-plugin";
import {
  configDefaults,
  coverageConfigDefaults,
  defineConfig,
} from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({ wrangler: { configPath: "./wrangler.test.jsonc" } }),
  ],
  test: {
    setupFiles: ["./test/setup.ts"],
    exclude: [...configDefaults.exclude, "e2e/**"],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/*.stories.*",
        "src/live.config.ts",
        "src/middleware.ts",
        "src/worker.ts",
        "src/utils/site-identity.ts",
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
