# QUALITY

→ [TESTING](TESTING.md) (tests), [DEPLOY](DEPLOY.md#ci) (CI).

## Language

### [TypeScript](STACK.md#typescript)

- Strict. `tsconfig.json` extends `astro/tsconfigs/strict` (or `strictest`).
- With `strict`, add `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`. Not with `strictest` (sets all).
- Keep `exactOptionalPropertyTypes`; `setup.mjs` already fixes starter pages and `Base.astro`. Spread optional values only when set: `...(cursor ? { cursor } : {})` for `getEmDashCollection()`; `...(Astro.currentLocale ? { currentLocale: Astro.currentLocale } : {})` for `createPublicPageContext()`; pass `canonical ?? null`, `image ?? null`; spread `content` the same way.
- No `satisfies ExportedHandler` in `src/worker.ts` (`handler.fetch` optional → fails).

## Checks

### [Astro](STACK.md#astro) check

- `npm run typecheck` before commit: no errors or warnings.
- `@astrojs/check` as dev dependency.
- `typecheck` = `astro check --minimumFailingSeverity warning`.

## Lint

### [ESLint](STACK.md#eslint)

- Flat config `eslint.config.mjs`. No `.eslintrc`, no Biome (`.astro` support experimental).
- `npm i -D eslint @eslint/js typescript-eslint eslint-plugin-astro eslint-config-prettier`.
- Config array: `eslintPluginAstro.configs.recommended` (sets Astro parser), `js.configs.recommended`, last `eslintConfigPrettier` (from `eslint-config-prettier/flat`). No `eslint-plugin-prettier`.
- Lint with `eslint .` (no `src/**` glob: skips `scripts/`, root `sentry.*.config.ts`).
- `globalIgnores(['dist/', '.astro/', '.wrangler/', 'worker-configuration.d.ts', '.agents/', '.claude/', '.cursor/'])` from `eslint/config`.
- `tsconfig.json` `include`: `src`, `scripts`, `e2e`, `.storybook/**/*`, `*.config.ts`, `sentry.*.config.ts` (else typed lint parsing error).
- CI: `eslint --max-warnings 0`; fix or disable the rule.
- `.vscode/settings.json`: `"astro"` in `eslint.validate`.

### typescript-eslint

- Scoped: `...tseslint.configs.strictTypeChecked.map((config) => ({ ...config, files: ['**/*.ts', '**/*.tsx'] }))`. Unscoped fails on `.astro` (`Parsing error: Expression expected`). No `tseslint.configs.strict` alongside.
- After it: `{ files: ['**/*.ts', '**/*.tsx'], languageOptions: { parserOptions: { projectService: true } } }`.
- No typed linting for `.astro` unless `parserOptions.project` is set. [eslint-plugin-astro user guide](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/)

## Format

### [Prettier](STACK.md#prettier)

- `prettier-plugin-astro` for all formatting; no formatting rules in ESLint.
- `.prettierrc`: `plugins` has `prettier-plugin-astro`, `prettier-plugin-tailwindcss` last (→ [DESIGN](DESIGN.md)); `overrides`: `files: "*.astro"`, `options: { parser: "astro" }`.
- No `useTabs`. Run `prettier . --write` once after setup, commit.
- `.prettierignore`: `rules/`, `WHY.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `EMDASH.md`, `worker-configuration.d.ts`, `emdash-env.d.ts`, `.agents/`.
- CI `prettier . --check`; local `prettier . --write`.

## Unused code

### [Knip](STACK.md#knip)

- `npm i -D knip`. Astro plugin auto-adds `src/pages/**`, `src/content.config.ts`, `src/middleware.ts`.
- `knip` in CI, zero issues. Delete unused code/deps; no ignore-list additions except the named exceptions below.
- Wrangler plugin adds `main` (`src/worker.ts`) as entry; do not list it.
- `entry` in `knip.json` (replaces default `index`, `main`, `cli`; not an ignore list): at least `src/live.config.ts`, `src/apps/*/pages/**/*.astro!`, `src/apps/*/middleware.ts!`, `src/apps/*/admin/{plugin.ts,pages.tsx}!`, `scripts/*.ts`; add a glob per other file kind registered via `injectRoute()`, `addMiddleware()`, `adminEntry`. `!` = production code for `knip --production`.
- Keep the template `knip.json` (`entry` only, no ignore list).
- After installing Fulldev UI only: `"ignoreIssues": { "src/components/ui/**": ["files", "exports", "types"], "src/lib/utils.ts": ["files"] }`, `"ignoreDependencies": ["cn", "tailwind-variants"]`. No other folders. Remove `"files"` entries and the two packages once pages use the components and `cn`.
- `ignoreDependencies`, only after installing and until code uses them: `@base-ui/react`, `lucide-react` (React components); `@storybook/builder-vite` (Storybook); `@vitest/expect`, `@vitest/spy`, `@vitest/utils`, `@vitest/pretty-format` (Storybook with Vitest). No other packages.
- No `.agents/**` in `ignore` (not reported).
- Storybook, Vitest, Playwright plugins find stories, `.storybook/`, tests, `playwright.config.ts`: not in `entry`.
- `knip --production` finds code used only by tests and stories.

## Scripts

### [npm](STACK.md#npm) scripts

- Keep template `dev`, `build`, `preview`; add `typecheck`.
- Add `lint` (`eslint . --max-warnings 0`), `format` (`prettier . --write`), `format:check` (`prettier . --check`), `knip` (`knip`), `test` (`vitest run --coverage`; → [TESTING](TESTING.md#coverage)).
- `check` = `npm run format:check && npm run typecheck && npm run lint && npm run knip && npm run test`.
- Not in `test` or `check`: `build`, API checks, dependency checks, screenshot and e2e tests (CI only).

## Order

### [GitHub Actions](STACK.md#github-actions)

- Order, fastest first, stop at first failure: `format:check`, `typecheck`, `lint`, `knip`, `test`.
- `npm run check` locally before commit; same scripts in the PR workflow.
- PR workflow after `check`, in order, stop at first failure:
  1. `npm run build` (e2e and screenshot tests need its output).
  2. API: regenerate `openapi.json` + `git diff --exit-code`, `redocly lint`, `oasdiff breaking`. → [API](API.md)
  3. Dependencies: `npm audit --omit=dev --audit-level=high`, `npm audit signatures`. → [DEPS](DEPS.md)
  4. e2e, then screenshot tests. → [TESTING](TESTING.md#ci)
- `npm run typecheck` before each release. → [DEPLOY](DEPLOY.md)
