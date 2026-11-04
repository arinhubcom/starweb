# TESTING

## Test runner

### [Vitest](STACK.md#vitest)

- Vitest 5 → [WHY](../WHY.md#why-vitest-5).
- Relative imports in tests and tested code; `@/` does not resolve (else add `resolve.alias` `@` in `vitest.config.ts`; the template uses relative).
- `Effect.runPromise()` in tests, or `it.effect()` from `@effect/vitest` at the `effect` version.
- No `vitest -u` in the PR workflow (no snapshot writes when `CI` is set; a missing snapshot fails). Update only in the manual workflow (Screenshots).

## Unit and integration tests

### [Cloudflare Vitest plugin](STACK.md#cloudflare-vitest-plugin)

- `@cloudflare/vitest-plugin`, not `@cloudflare/vitest-pool-workers` → [WHY](../WHY.md#why-cloudflarevitest-plugin).
- `wrangler.test.jsonc` = `wrangler.jsonc` without `main` and `triggers` (`main` fails with `Cannot find package 'virtual:astro-cloudflare:config'`).
- `vitest.config.ts`: `cloudflareTest({ wrangler: { configPath: './wrangler.test.jsonc' } })` in `plugins`.
- `tsconfig.json`: `@cloudflare/vitest-plugin/types` in `compilerOptions.types`, test folder in `include` (else `astro check` reports `Cannot find module 'cloudflare:test'`).
- No `astro:*` imports (`astro:middleware`) in tested code: `import type` or `vi.mock()`.
- Per app database: `readD1Migrations()` in `vitest.config.ts` with its `migrations_dir` (`migrations/app1`) → [SAAS](SAAS.md) (Multiple apps); own binding in `miniflare.bindings` (`APP1_TEST_MIGRATIONS`).
- Apply in `beforeEach()` of a setup file: `applyD1Migrations(env.APP1_DB, env.APP1_TEST_MIGRATIONS)`. Never on `env.DB` (EmDash; `emdash migrate` owns it).
- `reset()` from `cloudflare:test` in `afterEach()` when tests in a file must not share data; it drops tables, so re-apply migrations in `beforeEach()`. Storage is isolated per file, not per test.
- `test.exclude`: `[...configDefaults.exclude, 'e2e/**']` (`vitest/config`).
- Test per repository module: a query never returns rows of another tenant.

### Coverage

- Provider `istanbul`: `test.coverage.provider: 'istanbul'`, `@vitest/coverage-istanbul` at the `vitest` version. No `v8` (unsupported by the plugin, [known issues](https://developers.cloudflare.com/workers/testing/vitest-integration/known-issues/)).
- `test.coverage.thresholds`: `lines`, `functions`, `branches`, `statements` all `80`.
- `test.coverage.include`: `['src/**/*.{ts,tsx}']` (default counts only imported files); `exclude: [...coverageConfigDefaults.exclude, '**/*.stories.*']`.
- Each kept starter file under `src/` gets a test or goes to `test.coverage.exclude` (`src/live.config.ts`, `src/middleware.ts`, `src/utils/site-identity.ts`); re-export files such as `index.ts` too.
- `test` script: `vitest run --coverage` (thresholds apply only with coverage on).

## Components

### [Storybook](STACK.md#storybook)

- One Storybook 10 for `.astro` and React islands → [WHY](../WHY.md#why-storybook-astro).
- A story per visible state: default, edge cases, hover, focus, error.
- `@storybook/addon-a11y` on every story.

### [Storybook Astro](STACK.md#storybook-astro)

- `@storybook-astro/framework` in `.storybook/main.ts`; not the `storybook-astro` package.
- Dev packages `storybook`, `@storybook/builder-vite`, `@storybook/react`, `@storybook-astro/framework`; not `npm create storybook`.
- `@storybook-astro/framework` 1.13 or newer for `@astrojs/react` 7 and Vitest 5; no TypeScript 7 (peer `typescript ^5.0.0 || ^6.0.0`, docgen is skipped).
- React islands: `react({ include: ['**/react/**'] })` from `@storybook-astro/framework/integrations` (`src/components/ui/react/*.tsx`).
- Meta of each React story: `parameters: { renderer: 'react' }`, not `'@storybook/react'`.
- `renderMode: 'static'` (default); no `'server'`.
- Plain values as story args; no functions in Astro story args.
- Images in Astro stories: string URLs or `ImageMetadata`; no `astro:assets` import.
- Fonts once in `fonts` in `astro.config.mjs`; not copied to `.storybook/` → [WHY](../WHY.md#astro-fonts-in-storybook).

## Component tests

### Storybook Astro testing

- Rendered output of Astro stories (content, props, slots): `composeStories()` + `renderStory()` from `@storybook-astro/framework/testing`, query with `screen.getByRole()`.
- Config: `defineConfig()` from `@storybook-astro/framework/vitest`, `environment: 'happy-dom'`; not in browser mode.
- `renderStory()` renders Astro only, not React stories.
- Interactions (click, type, focus, `play`): `@storybook/addon-vitest` in Vitest browser mode with Playwright Chromium; not happy-dom.
- `<script>` tags of `.astro` components: Playwright, not `renderStory()`.

## Snapshots

### Vitest ARIA snapshots

- `toMatchAriaSnapshot()` for React island structure; no `toMatchSnapshot()` DOM snapshots → [WHY](../WHY.md#why-aria-snapshots-and-not-dom-snapshots).
- Vitest browser test: `composeStories()` from `@storybook/react`, `await Story.run()`, `await expect.element(locator).toMatchAriaSnapshot()`. Not in a `play` function or happy-dom.
- Commit `.snap` files; review in the PR.

### [Playwright](STACK.md#playwright) ARIA snapshots

- `toMatchAriaSnapshot()` for page structure, stored with `{ name: '<page>.aria.yml' }`.

## Screenshots

### Playwright screenshots

- `toHaveScreenshot()` only; no Vitest `toMatchScreenshot()` → [WHY](../WHY.md#why-one-tool-for-screenshots).
- Components: story page of built Storybook `iframe.html?id=<story-id>&viewMode=story`; screenshot the locator (`page.locator('#storybook-root')`), not the viewport.
- Full pages: against `astro preview` via `webServer`.
- Baselines: default PNG, no `type: 'webp'` → [WHY](../WHY.md#why-png-baselines-in-git); in git, no Git LFS.
- Viewport in `playwright.config.ts`; `mask` dynamic content.
- Allow font provider requests in story screenshot tests (Storybook Astro loads fonts from provider URLs).
- Create and update baselines only in CI: manual workflow running `npx vitest run -u` (ARIA `.snap`) and `npx playwright test --update-snapshots` (screenshots, `.aria.yml`). No local baseline commits → [WHY](../WHY.md#why-baselines-come-only-from-ci).
- On failure upload `test-results/` diff images as a CI artifact.

## End-to-end tests

### Playwright

- Against `astro preview` → [DEV](DEV.md). `npx playwright install chromium`.
- `webServer`: `command: 'npm run preview -- --port <port>'`, same port in `url`, `reuseExistingServer: !process.env.CI`.
- Manual, script, or agent start with `--background`, stop by PID → [DEV](DEV.md) (Local dev).
- `astro build` first. Keep `.wrangler/deploy/config.json` (`astro preview` fails `No build output found` without it).
- Test each critical flow: signup, login, payment.
- Payments in provider test mode, never live keys; keys as CI secrets. [Stripe](STACK.md#stripe): sandbox test API keys ([test mode](https://docs.stripe.com/test-mode)). [Creem](STACK.md#creem): test API key, `server: "test"` in the `creem` SDK (`https://test-api.creem.io`, [test mode](https://docs.creem.io/getting-started/test-mode)).
- Signup test reads the verification link from `GET /_emdash/api/dev/emails`; run it against `astro dev` (console email provider and endpoint are dev-only, [EmDash email setup](https://docs.emdashcms.com/guides/email/)).

## Accessibility

### [axe](STACK.md#axe)

- Each page: `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()` from `@axe-core/playwright`; `violations` equals `[]`.

## CI

### [GitHub Actions](STACK.md#github-actions)

- PR workflow runs unit, snapshot, end-to-end, screenshot tests in the order of [QUALITY](QUALITY.md#order) → [DEPLOY](DEPLOY.md#ci).
