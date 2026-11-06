# QUALITY

This file covers the code checks in a project: types, lint, format, and unused code. Read it when a check fails or before you change a check. Tests are in [TESTING](TESTING.md), and CI is in [DEPLOY](DEPLOY.md#set-up-ci).

## Before you commit

- Run `pnpm run check`.
- Run `pnpm run typecheck` before each release. See [DEPLOY](DEPLOY.md).
- These commands are not in `test` or `check`: `fonts`, `build`, `size`, API checks, and dependency checks.
- Run screenshot and e2e tests in CI only.
- `fonts` needs the network. See [MEDIA](MEDIA.md).
- `size` needs `dist/`. See [PERF](PERF.md#set-a-size-limit).

## Write TypeScript

- Keep `exactOptionalPropertyTypes` on. Spread an optional value only when it is set: `...(cursor ? { cursor } : {})`.
- For the other options, read the comments in `tsconfig.json`. See [TypeScript](STACK.md#typescript).
- Use this form for `cursor` in `getEmDashCollection()`.
- Use `...(Astro.currentLocale ? { currentLocale: Astro.currentLocale } : {})` in `createPublicPageContext()`.
- Pass `canonical ?? null` and `image ?? null`.
- Spread `content` in the same way.
- Do not add `satisfies ExportedHandler` in `src/worker.ts`. `handler.fetch` is optional, so the check fails.

## Fix a lint error

- Use only [Oxlint](STACK.md#oxlint). Do not add ESLint, `typescript-eslint`, or Biome.
- Oxlint lints only the `<script>` blocks of `.astro` files. `astro check` covers the rest.
- Fix the code, or disable the rule.
- In a new clone, run `pnpm run typecheck` once before `pnpm run lint`. Type-aware rules need `.astro/types.d.ts`, and without it you get false `no-unsafe-*` errors on `astro:*` imports.
- `pnpm run check` already runs them in this order.

## Change the React Doctor rules

- `.oxlintrc.json` explains which rules are on and which are off.
- If a project adds a library from a family that is off, such as Motion, add the rules of that family.
- Add the capability of the family too, if its rules need one.
- After a plugin update, compare `REACT_DOCTOR_RULES` with `rules`. An update does not turn on new rules.

## Format code

- Use only [Oxfmt](STACK.md#oxfmt). Do not add Prettier plugins, the `prettier` package, or `.prettierignore`.
- Do not add formatting rules to Oxlint.
- Do not use `useTabs`.
- Run `scripts/theme.ts` before Oxfmt, because `stylesheet` imports the generated `theme.css`.

## Remove unused code

- Delete unused code and dependencies. Do not add them to an ignore list.
- If a file is registered through `injectRoute()`, `addMiddleware()`, or `adminEntry`, add a glob for it to `entry` in `knip.json`. See [Knip](STACK.md#knip).
- Add `!` to the glob when the file is production code.
- If you use `@base-ui/react` for React components, add it to `ignoreDependencies` until code uses it.
- If you use Storybook, add `@storybook/builder-vite` to `ignoreDependencies`.
- Do not add other packages to `ignoreDependencies`.
- Do not add other folders to `ignoreIssues`.

## Order the steps of a pull request workflow

- If an app has an API contract, put the API steps after `size` and before the audits. See [API](API.md).
- The API steps are: regenerate `openapi.json` and run `git diff --exit-code`, `redocly lint`, and `oasdiff breaking`.
- Put e2e tests and then screenshot tests after the audits. See [TESTING](TESTING.md#run-tests-in-ci).
- Run the steps in this order, and stop at the first failure. See [GitHub Actions](STACK.md#github-actions).
