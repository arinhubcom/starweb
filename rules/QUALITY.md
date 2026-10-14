# QUALITY

Follow the rules in [TESTING.md](TESTING.md) for tests and [DEPLOY.md](DEPLOY.md#ci) for CI workflows.

## Language

### [TypeScript](https://www.typescriptlang.org/tsconfig/#strict)

- Use TypeScript in strict mode. Extend `astro/tsconfigs/strict` (or `strictest`) in `tsconfig.json`.
- Add `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, and `noUnusedParameters` to `compilerOptions` when you extend `strict`. Do not add them when you extend `astro/tsconfigs/strictest`: it sets all of them.

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
- Include the `.astro` extension in the lint glob: ESLint targets only `.js` files by default. Use `eslint "src/**/*.{js,ts,tsx,astro}"`.
- Run `eslint --max-warnings 0` in CI. Fix a warning or turn the rule off. Do not leave warnings in the code.
- Add `"astro"` to `eslint.validate` in `.vscode/settings.json`, so the editor lints `.astro` files.

### [typescript-eslint](https://typescript-eslint.io/getting-started/typed-linting)

- Add `tseslint.configs.strictTypeChecked` (from `typescript-eslint`) for `.ts` and `.tsx` files, with `languageOptions.parserOptions.projectService: true`. Do not also add `tseslint.configs.strict`: the type-checked preset replaces it.
- Do not use typed linting for `.astro` files unless you set `parserOptions.project` for them. See the [eslint-plugin-astro user guide](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/).

## Format

### [Prettier](https://prettier.io/docs/install)

- Use Prettier with [`prettier-plugin-astro`](https://github.com/withastro/prettier-plugin-astro) for all formatting. Do not set formatting rules in ESLint.
- List `prettier-plugin-astro` in `plugins` in `.prettierrc`, and add an `overrides` entry with `files: "*.astro"` and `options: { parser: "astro" }`. Put `prettier-plugin-tailwindcss` last in `plugins` (see [DESIGN.md](DESIGN.md)).
- Run `prettier . --check` in CI. Run `prettier . --write` locally.

## Unused code

### [Knip](https://knip.dev/overview/getting-started)

- Use Knip to find unused files, exports, and dependencies. Install it with `npm i -D knip`. Its Astro plugin turns on when `astro` is in `package.json`, and it adds `src/pages/**`, `src/content.config.ts`, and `src/middleware.ts` as entry files.
- Run `knip` in CI. It must report no issues. Delete the unused code or dependency. Do not add it to an ignore list to make the check pass.
- Add the entry files that Astro does not know, such as `src/worker.ts`, to `entry` in `knip.json`. See the [Knip configuration](https://knip.dev/reference/configuration).
- Run `knip --production` to find code that is used only by tests and stories.

## Scripts

### [npm scripts](https://docs.npmjs.com/cli/using-npm/scripts)

- Keep the template scripts `dev`, `build`, and `preview`. Do not rename them. Add `typecheck` (see Checks).
- Add these scripts to `package.json`: `lint` (`eslint "src/**/*.{js,ts,tsx,astro}" --max-warnings 0`), `format` (`prettier . --write`), `format:check` (`prettier . --check`), `knip` (`knip`), and `test` (`vitest run`). Keep the screenshot and end-to-end tests out of `test` and `check`: run them in CI as in [TESTING.md](TESTING.md#ci).
- Add `check` as the one command for all checks: `npm run format:check && npm run typecheck && npm run lint && npm run knip && npm run test`. Use the order in the Order section.

## Order

### [GitHub Actions](https://docs.github.com/en/actions)

- Run the checks in this order, from fastest to slowest: `format:check`, `typecheck`, `lint`, `knip`, `test`. Stop at the first failure.
- Run `npm run check` locally before you commit. Run the same scripts in the PR workflow.
- Run the end-to-end and screenshot tests in the PR workflow after `check` passes. Follow the rules in [TESTING.md](TESTING.md#ci).
- Run `npm run typecheck` before each release. Follow the rules in [DEPLOY.md](DEPLOY.md).
