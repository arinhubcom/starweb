# QUALITY

Follow the rules in [TESTING.md](TESTING.md) for tests and [DEPLOY.md](DEPLOY.md#ci) for CI workflows.

## Language

### [TypeScript](https://www.typescriptlang.org/tsconfig/#strict)

- Use TypeScript in strict mode. Extend `astro/tsconfigs/strict` (or `strictest`) in `tsconfig.json`.
- Add `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, and `noUnusedParameters` to `compilerOptions` when you extend `strict`. Do not add them when you extend `astro/tsconfigs/strictest`: it sets all of them.
- Keep `exactOptionalPropertyTypes` on. `setup.mjs` fixes the starter pages and `Base.astro` for it. Fix the same error in your own code. Do not remove the flag. Spread an optional value only when it is set: `...(cursor ? { cursor } : {})` for `cursor` in `getEmDashCollection()`, and `...(Astro.currentLocale ? { currentLocale: Astro.currentLocale } : {})` for `currentLocale` in `createPublicPageContext()`. Pass `canonical ?? null` and `image ?? null`, and spread `content` the same way.
- Do not use `satisfies ExportedHandler` in `src/worker.ts`: `handler.fetch` is optional, so the check fails. The template `src/worker.ts` does not use it.

## Checks

### [Astro](https://docs.astro.build/en/reference/cli-reference/#astro-check)

- Run `npm run typecheck` before you commit. It must have no errors or warnings.
- Install `@astrojs/check` as a dev dependency. `astro check` needs it.
- Set the `typecheck` script to `astro check --minimumFailingSeverity warning`, so that warnings fail the check.

## Lint

### [ESLint](https://eslint.org/docs/latest/use/configure/configuration-files)

- Use ESLint with a flat config in `eslint.config.mjs`. Do not use `.eslintrc` files. Biome supports `.astro` files only as an experimental feature, so do not use it.
- Install the packages with `npm i -D eslint @eslint/js typescript-eslint eslint-plugin-astro eslint-config-prettier`.
- Spread `eslintPluginAstro.configs.recommended` into the config array. It sets the Astro parser for `.astro` files.
- Add `js.configs.recommended` (from `@eslint/js`) to the config array.
- Put `eslintConfigPrettier` (from `eslint-config-prettier/flat`) last in the config array. Do not use `eslint-plugin-prettier`: run Prettier as its own command.
- Lint the whole project with `eslint .`. ESLint lints every file that matches a `files` pattern of a config object, so the Astro and typescript-eslint configs cover `.astro`, `.ts`, and `.tsx` files in `src/`, `scripts/`, and the root (such as `sentry.*.config.ts`). Do not pass a `src/**` glob: it skips those files.
- Add `globalIgnores(['dist/', '.astro/', '.wrangler/', 'worker-configuration.d.ts', '.agents/', '.claude/', '.cursor/'])` (from `eslint/config`) to the config array, so `eslint .` skips build output, generated files, and agent files. ESLint ignores only `node_modules` and `.git` by default.
- Include every linted `.ts` file in `tsconfig.json` (`include`): `src`, `scripts`, `e2e`, `.storybook/**/*`, `*.config.ts`, and `sentry.*.config.ts`. Otherwise typed linting fails with a parsing error for that file.
- Run `eslint --max-warnings 0` in CI. Fix a warning or turn the rule off. Do not leave warnings in the code.
- Add `"astro"` to `eslint.validate` in `.vscode/settings.json`, so the editor lints `.astro` files.

### [typescript-eslint](https://typescript-eslint.io/getting-started/typed-linting)

- Scope `tseslint.configs.strictTypeChecked` (from `typescript-eslint`) to `.ts` and `.tsx` files: `...tseslint.configs.strictTypeChecked.map((config) => ({ ...config, files: ['**/*.ts', '**/*.tsx'] }))`. Do not spread it unscoped: its parser fails on `.astro` files with `Parsing error: Expression expected`. Do not also add `tseslint.configs.strict`: the type-checked preset replaces it.
- Add a config object with `files: ['**/*.ts', '**/*.tsx']` and `languageOptions: { parserOptions: { projectService: true } }` after the scoped preset.
- Do not use typed linting for `.astro` files unless you set `parserOptions.project` for them. See the [eslint-plugin-astro user guide](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/).

## Format

### [Prettier](https://prettier.io/docs/install)

- Use Prettier with [`prettier-plugin-astro`](https://github.com/withastro/prettier-plugin-astro) for all formatting. Do not set formatting rules in ESLint.
- List `prettier-plugin-astro` in `plugins` in `.prettierrc`, and add an `overrides` entry with `files: "*.astro"` and `options: { parser: "astro" }`. Put `prettier-plugin-tailwindcss` last in `plugins` (see [DESIGN.md](DESIGN.md)).
- Do not set `useTabs`. The starter files use tabs and other formatting that Prettier changes, so run `prettier . --write` once after setup and commit the result.
- Add a `.prettierignore` file with `rules/`, `WHY.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `EMDASH.md`, `worker-configuration.d.ts`, `emdash-env.d.ts`, and `.agents/`. Prettier skips generated files and agent files only when they are listed.
- Run `prettier . --check` in CI. Run `prettier . --write` locally.

## Unused code

### [Knip](https://knip.dev/overview/getting-started)

- Use Knip to find unused files, exports, and dependencies. Install it with `npm i -D knip`. Its Astro plugin turns on when `astro` is in `package.json`, and it adds `src/pages/**`, `src/content.config.ts`, and `src/middleware.ts` as entry files.
- Run `knip` in CI. It must report no issues. Delete the unused code or dependency. Do not add anything to an ignore list to make the check pass, except the named exceptions in this section.
- Let the Knip Wrangler plugin find the Worker entry. It adds `main` from the Wrangler config (`src/worker.ts`) as a production entry when `wrangler` is in `package.json`. Do not list it.
- Add the files that the code registers by path or URL to `entry` in `knip.json`. Astro finds only `src/pages/**` and `src/middleware.ts`, so Knip reports app pages, middleware, and admin plugin files as unused. These globs are entry points, not an ignore list. See the [Knip configuration](https://knip.dev/reference/configuration).
- Set `entry` to at least: `src/live.config.ts`, `src/apps/*/pages/**/*.astro!`, `src/apps/*/middleware.ts!`, `src/apps/*/admin/{plugin.ts,pages.tsx}!`, and `scripts/*.ts`. Add a glob for each other file kind that you register with `injectRoute()`, `addMiddleware()`, or `adminEntry`. The `!` marks production code for `knip --production`. A value in `entry` replaces the default `index`, `main`, and `cli` entries.
- Keep the `knip.json` of the template. It sets `entry` only, and Knip passes with no ignore list on a new project.
- Add the Fulldev exceptions to `knip.json` only after you install Fulldev UI: `"ignoreIssues": { "src/components/ui/**": ["files", "exports", "types"], "src/lib/utils.ts": ["files"] }` and `"ignoreDependencies": ["cn", "class-variance-authority"]`. Installed components export their full API, and Knip reports the component files, `src/lib/utils.ts`, and these two packages until a page imports `Button`. Do not ignore other folders.
- Remove `"files"` from the `ignoreIssues` entries, and the two packages from `ignoreDependencies`, when pages use the components and `cn`. Knip then reports them as used.
- Add the dependencies that you install before any code uses them to `ignoreDependencies` only after you install them: `@base-ui/react` and `lucide-react` (React components), `@storybook/builder-vite` (Storybook), and `@vitest/expect`, `@vitest/spy`, `@vitest/utils`, and `@vitest/pretty-format` (Storybook with Vitest). Remove each entry when code uses the package. Do not add other packages.
- Do not add `.agents/**` to `ignore`: Knip does not report the agent skills.
- Let the Storybook, Vitest, and Playwright plugins find stories, `.storybook/` files, test files, and `playwright.config.ts`. Do not list them in `entry`.
- Run `knip --production` to find code that is used only by tests and stories.

## Scripts

### [npm scripts](https://docs.npmjs.com/cli/using-npm/scripts)

- Keep the template scripts `dev`, `build`, and `preview`. Do not rename them. Add `typecheck` (see Checks).
- Add these scripts to `package.json`: `lint` (`eslint . --max-warnings 0`), `format` (`prettier . --write`), `format:check` (`prettier . --check`), `knip` (`knip`), and `test` (`vitest run --coverage`, see [TESTING.md](TESTING.md#coverage)). Keep `build`, the API checks, the dependency checks, and the screenshot and end-to-end tests out of `test` and `check`, so `check` stays fast: run them in CI (see Order).
- Add `check` as the one command for all checks: `npm run format:check && npm run typecheck && npm run lint && npm run knip && npm run test`. Use the order in the Order section.

## Order

### [GitHub Actions](https://docs.github.com/en/actions)

- Run the checks in this order, from fastest to slowest: `format:check`, `typecheck`, `lint`, `knip`, `test`. Stop at the first failure.
- Run `npm run check` locally before you commit. Run the same scripts in the PR workflow.
- Run these checks in the PR workflow, in this order, after `check` passes. Stop at the first failure:
  1. `npm run build`. The end-to-end and screenshot tests need its output.
  2. The API checks: generate `openapi.json` again and run `git diff --exit-code`, then `redocly lint`, then `oasdiff breaking`. See [API.md](API.md).
  3. The dependency checks: `npm audit --omit=dev --audit-level=high` and `npm audit signatures`. See [DEPS.md](DEPS.md).
  4. The end-to-end tests, then the screenshot tests. See [TESTING.md](TESTING.md#ci).
- Run `npm run typecheck` before each release. Follow the rules in [DEPLOY.md](DEPLOY.md).
