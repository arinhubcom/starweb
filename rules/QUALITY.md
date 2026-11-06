# QUALITY

→ [TESTING](TESTING.md) (tests), [DEPLOY](DEPLOY.md#ci) (CI).

## Language

### [TypeScript](STACK.md#typescript)

- No `"jsx": "preserve"` in `tsconfig.json`: it fails `vitest run --coverage` on any uncovered `.tsx` (`Support for the experimental syntax 'jsx'`).
- Keep `exactOptionalPropertyTypes`. Spread optional values only when set: `...(cursor ? { cursor } : {})` for `getEmDashCollection()`; `...(Astro.currentLocale ? { currentLocale: Astro.currentLocale } : {})` for `createPublicPageContext()`; pass `canonical ?? null`, `image ?? null`; spread `content` the same way.
- No `satisfies ExportedHandler` in `src/worker.ts` (`handler.fetch` optional → fails).

## Lint

### [Oxlint](STACK.md#oxlint)

- The only linter. No ESLint, no `typescript-eslint`, no Biome. Oxlint lints only the `<script>` blocks of `.astro` files; `astro check` covers the rest.
- `oxlint-plugin-react-doctor`, `@e18e/eslint-plugin`: JS plugins are alpha and outside semver.
- Fix or disable the rule.
- No `react-perf` plugin.
- `tsconfig.json`: no `baseUrl` (`oxlint-tsgolint` rejects it; TypeScript 7 removed it).
- Type-aware rules need `.astro/types.d.ts`: run `pnpm run typecheck` once before `pnpm run lint` in a new clone (else false `no-unsafe-*` errors on `astro:*` imports). `check` already runs them in this order.

### React Doctor rules

- Listed: active rules with `framework: "global"` whose `requires` fits the capabilities (`REACT_DOCTOR_RULES` from the package).
- Not listed: `defaultEnabled: false`, `scan` and `project` rules (no effect in Oxlint), ports of built-in rules (`originallyExternal`; use `react/*`, `jsx-a11y/*`), `no-array-index-as-key` (= `react/no-array-index-key`), and the `ink-`, `jotai-`, `motion-`, `redux-`, `react-markdown-`, `server-`, `webgl-` families.
- Project adds a library from one of those families (for example: Motion) → add its rules, and its capability if the rules need one.
- Plugin update → compare `REACT_DOCTOR_RULES` with `rules`; an update does not turn on new rules.

## Format

### [Oxfmt](STACK.md#oxfmt)

- No formatting rules in Oxlint.
- No Prettier plugins, no `prettier` package.
- `stylesheet` imports the generated `theme.css`: run `scripts/theme.ts` before Oxfmt. `scripts/update-starter.mjs` drops `stylesheet`: the starter has no `global.css`.
- No `useTabs`. Run `oxfmt` once after setup, commit.
- No `.prettierignore`.

## Unused code

### [Knip](STACK.md#knip)

- [Astro](STACK.md#astro) plugin auto-adds `src/pages/**`, `src/content.config.ts`, `src/middleware.ts`.
- Delete unused code/deps; no ignore-list additions except the named exceptions below.
- Wrangler plugin adds `main` (`src/worker.ts`) as entry; do not list it.
- `entry` in `knip.json` replaces default `index`, `main`, `cli`; it is not an ignore list. Add a glob per other file kind registered via `injectRoute()`, `addMiddleware()`, `adminEntry`. `!` = production code for `knip --production`.
- `ignoreIssues` (installed components, agent skills): no other folders.
- `ignoreDependencies`, only after installing and until code uses them: `@base-ui/react` (React components); `@storybook/builder-vite` (Storybook). No other packages.
- No `.agents/**` in `ignore`: `ignoreIssues` covers it.
- Storybook, Vitest, Playwright plugins find stories, `.storybook/`, tests, `playwright.config.ts`: not in `entry`.
- `knip --production` finds code used only by tests and stories.

## Scripts

### [pnpm](STACK.md#pnpm) scripts

- Not in `test` or `check`: `fonts` (needs the network; → [MEDIA](MEDIA.md) (Fonts)), `build`, `size` (needs `dist/`; → [PERF](PERF.md#client-javascript)), API checks, dependency checks, screenshot and e2e tests (CI only).

## Order

### [GitHub Actions](STACK.md#github-actions)

- `pnpm run check` locally before commit.
- Optional PR workflow steps, in order, stop at first failure: API after `size` and before the audits (regenerate `openapi.json` + `git diff --exit-code`, `redocly lint`, `oasdiff breaking`). → [API](API.md)
- E2e, then screenshot tests, after the audits. → [TESTING](TESTING.md#ci)
- `pnpm run typecheck` before each release. → [DEPLOY](DEPLOY.md)
