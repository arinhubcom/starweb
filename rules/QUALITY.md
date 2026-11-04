# QUALITY

→ [TESTING](TESTING.md) (tests), [DEPLOY](DEPLOY.md#ci) (CI).

## Language

### [TypeScript](STACK.md#typescript)

- Strict. `tsconfig.json` extends `astro/tsconfigs/strict` (or `strictest`).
- With `strict`, add `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`. Not with `strictest` (sets all).
- `"jsx": "react-jsx"`, `"jsxImportSource": "react"` in `tsconfig.json`. The inherited `preserve` fails `vitest run --coverage` on any uncovered `.tsx` (`Support for the experimental syntax 'jsx'`).
- Keep `exactOptionalPropertyTypes`; `template/` already fixes the starter pages and `Base.astro`. Spread optional values only when set: `...(cursor ? { cursor } : {})` for `getEmDashCollection()`; `...(Astro.currentLocale ? { currentLocale: Astro.currentLocale } : {})` for `createPublicPageContext()`; pass `canonical ?? null`, `image ?? null`; spread `content` the same way.
- No `satisfies ExportedHandler` in `src/worker.ts` (`handler.fetch` optional → fails).

## Checks

### [Astro](STACK.md#astro) check

- `pnpm run typecheck` before commit: no errors or warnings.
- `typecheck` = `astro check --minimumFailingSeverity warning`.

## Lint

### [Oxlint](STACK.md#oxlint)

- The only linter. No ESLint, no `typescript-eslint`, no Biome. Oxlint lints only the `<script>` blocks of `.astro` files; `astro check` covers the rest.
- Exact versions of `oxlint`, `oxlint-tsgolint`, `oxlint-plugin-react-doctor`, `@e18e/eslint-plugin`. JS plugins are alpha and outside semver.
- Config `.oxlintrc.json`. Lint with `oxlint --type-aware --max-warnings 0` (no path: covers `scripts/`, root config files); fix or disable the rule.
- `plugins` replaces the default set: `typescript`, `unicorn`, `oxc`, `import`, `promise`, `vitest`, `react`, `jsx-a11y`. No `react-perf`.
- `categories`: `correctness` = error; `suspicious`, `perf` = warn.
- `rules` also turns on, as `error`, each rule of the `typescript-eslint` `strictTypeChecked` preset that no category above turns on (36 rules).
- `tsconfig.json`: no `baseUrl` (`oxlint-tsgolint` rejects it; TypeScript 7 removed it). `paths` stay. `include`: `src`, `scripts`, `test`, `e2e`, `.storybook/**/*`, `*.config.ts`, `sentry.*.config.ts`.
- `ignorePatterns`: `.agents/`, `.claude/`, `.cursor/`, `dist/`, `coverage/`, `.astro/`, `.wrangler/`, `worker-configuration.d.ts`, `emdash-env.d.ts`.
- Off: `no-await-in-loop`, `oxc/no-map-spread`, `react/react-in-jsx-scope`, `typescript/no-unsafe-type-assertion`, `unicorn/require-module-specifiers`.
- `import/no-unassigned-import`: `allow: ["**/*.css"]`.
- Tests (`test/**`, `**/*.test.ts`, `**/*.test.tsx`): `e18e/prefer-static-regex` off.
- JavaScript (`**/*.js`, `**/*.mjs`, `**/*.cjs`): `typescript/no-unsafe-argument`, `-assignment`, `-call`, `-member-access`, `-return` off.
- Type-aware rules need `.astro/types.d.ts`: run `pnpm run typecheck` once before `pnpm run lint` in a new clone (else false `no-unsafe-*` errors on `astro:*` imports). `check` already runs them in this order.

### React Doctor rules

- `jsPlugins`: `{ "name": "react-doctor", "specifier": "oxlint-plugin-react-doctor" }`. No preset: list each rule in `rules`, with its default severity.
- `settings["react-doctor"].capabilities` is required: without it, rules run for every library they name. Template list: `base-ui`, `react`, `react:19`, `react:19.2`, `shadcn`, `ssr`, `tailwind`, `tailwind:3.4`, `tailwind:4`, `zod:4`.
- Listed: active rules with `framework: "global"` whose `requires` fits the capabilities (`REACT_DOCTOR_RULES` from the package).
- Not listed: `defaultEnabled: false`, `scan` and `project` rules (no effect in Oxlint), ports of built-in rules (`originallyExternal`; use `react/*`, `jsx-a11y/*`), `no-array-index-as-key` (= `react/no-array-index-key`), and the `ink-`, `jotai-`, `motion-`, `redux-`, `react-markdown-`, `server-`, `webgl-` families.
- Project adds a library from one of those families (for example: Motion) → add its rules, and its capability if the rules need one.
- Plugin update → compare `REACT_DOCTOR_RULES` with `rules`; an update does not turn on new rules.

### e18e rules

- `jsPlugins`: `{ "name": "e18e", "specifier": "@e18e/eslint-plugin" }`. No preset in `.oxlintrc.json`: list each rule in `rules` as `error`.
- Template list: `ban-dependencies`, `prefer-array-at`, `prefer-array-fill`, `prefer-array-from-map`, `prefer-array-some`, `prefer-array-to-reversed`, `prefer-array-to-sorted`, `prefer-array-to-spliced`, `prefer-date-now`, `prefer-includes`, `prefer-nullish-coalescing`, `prefer-object-has-own`, `prefer-regex-test`, `prefer-spread-syntax`, `prefer-static-regex`, `prefer-timer-args`, `prefer-url-canparse`.

## Format

### [Prettier](STACK.md#prettier)

- `prettier-plugin-astro` for all formatting; no formatting rules in Oxlint.
- `.prettierrc`: `plugins` has `prettier-plugin-astro`, `prettier-plugin-tailwindcss` last (→ [DESIGN](DESIGN.md)); `overrides`: `files: "*.astro"`, `options: { parser: "astro" }`.
- No `useTabs`. Run `prettier . --write` once after setup, commit.
- `.prettierignore`: `rules/`, `WHY.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `EMDASH.md`, `worker-configuration.d.ts`, `emdash-env.d.ts`, `.agents/`.
- CI `prettier . --check`; local `prettier . --write`.

## Unused code

### [Knip](STACK.md#knip)

- Astro plugin auto-adds `src/pages/**`, `src/content.config.ts`, `src/middleware.ts`.
- `knip` in CI, zero issues. Delete unused code/deps; no ignore-list additions except the named exceptions below.
- Wrangler plugin adds `main` (`src/worker.ts`) as entry; do not list it.
- `entry` in `knip.json` (replaces default `index`, `main`, `cli`; not an ignore list): at least `src/live.config.ts`, `src/apps/*/pages/**/*.astro!`, `src/apps/*/middleware.ts!`, `src/apps/*/admin/{plugin.ts,pages.tsx}!`, `scripts/*.ts`; add a glob per other file kind registered via `injectRoute()`, `addMiddleware()`, `adminEntry`. `!` = production code for `knip --production`.
- Keep the template `knip.json`: `entry` and that `ignoreIssues`, no ignore list.
- Template `knip.json`: `"ignoreIssues": { "src/components/ui/**": ["files", "exports", "types"] }` for installed components. No other folders.
- `ignoreDependencies`, only after installing and until code uses them: `@base-ui/react`, `lucide-react` (React components); `@storybook/builder-vite` (Storybook). No other packages.
- No `.agents/**` in `ignore` (not reported).
- Storybook, Vitest, Playwright plugins find stories, `.storybook/`, tests, `playwright.config.ts`: not in `entry`.
- `knip --production` finds code used only by tests and stories.

## Scripts

### [pnpm](STACK.md#pnpm) scripts

- Template `package.json`: `dev`, `build`, `preview`, `typecheck`, `lint` (`oxlint --type-aware --max-warnings 0`), `format` (`prettier . --write`), `format:check` (`prettier . --check`), `knip` (`knip`), `test` (`vitest run --coverage`; → [TESTING](TESTING.md#coverage)).
- `check` = `pnpm run format:check && pnpm run typecheck && pnpm run lint && pnpm run knip && pnpm run test`.
- Not in `test` or `check`: `build`, `size` (needs `dist/`; → [PERF](PERF.md#client-javascript)), API checks, dependency checks, screenshot and e2e tests (CI only).

## Order

### [GitHub Actions](STACK.md#github-actions)

- Order, fastest first, stop at first failure: `format:check`, `typecheck`, `lint`, `knip`, `test`.
- `pnpm run check` locally before commit; same scripts in the PR workflow.
- PR workflow after `check`, in order, stop at first failure:
  1. `pnpm run build` (e2e and screenshot tests need its output).
  2. `pnpm run size`. → [PERF](PERF.md#client-javascript)
  3. API: regenerate `openapi.json` + `git diff --exit-code`, `redocly lint`, `oasdiff breaking`. → [API](API.md)
  4. Dependencies: `pnpm audit --prod --audit-level high`, `pnpm audit signatures`. → [DEPS](DEPS.md)
  5. e2e, then screenshot tests. → [TESTING](TESTING.md#ci)
- `pnpm run typecheck` before each release. → [DEPLOY](DEPLOY.md)
