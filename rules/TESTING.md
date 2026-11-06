# TESTING

## Test runner

### [Vitest](STACK.md#vitest)

- Vitest 5 → [WHY](../WHY.md#why-vitest-5).
- Relative imports in tests and tested code; `@/` does not resolve.
- `Effect.runPromise()` in tests, or `it.effect()` from `@effect/vitest` at the `effect` version.
- No `vitest -u` in the PR workflow. Update only in the manual workflow (Screenshots).

## Unit and integration tests

### [Cloudflare Vitest plugin](STACK.md#cloudflare-vitest-plugin)

- `@cloudflare/vitest-plugin`, not `@cloudflare/vitest-pool-workers` → [WHY](../WHY.md#why-cloudflarevitest-plugin).
- Config in the template: `vitest.config.ts`, `wrangler.test.jsonc`, `test/setup.ts`.
- `wrangler.test.jsonc`: no `main`, no `triggers`; add each binding a test needs → [WHY](../WHY.md#why-tests-use-wranglertestjsonc).
- No `astro:*` imports in tested code: `import type` or `vi.mock()`.
- App database: apply migrations in `test/setup.ts`, never on `env.DB` → [SAAS](SAAS.md) (Multiple apps).
- `reset()` from `cloudflare:test` in `afterEach()` when tests in a file must not share data; re-apply migrations in `beforeEach()`.
- Test per repository module: a query never returns rows of another tenant.

### Coverage

- Settings in `vitest.config.ts`: `istanbul`, no `v8` → [WHY](../WHY.md#why-istanbul-coverage-and-not-v8); all thresholds `80`.
- `@vitest/coverage-istanbul` at the `vitest` version.
- Each kept starter file under `src/` gets a test or goes to `test.coverage.exclude`; re-export files too.
- `test` script: `vitest run --coverage`; thresholds apply only with coverage on.

## Components

### [Storybook](STACK.md#storybook)

- One Storybook 10 for `.astro` and React islands → [WHY](../WHY.md#why-storybook-astro).
- A story per visible state: default, edge cases, hover, focus, error.
- `@storybook/addon-a11y` on every story.

### [Storybook Astro](STACK.md#storybook-astro)

- `@storybook-astro/framework` in `.storybook/main.ts`; not the `storybook-astro` package.
- Dev packages `storybook`, `@storybook/builder-vite`, `@storybook/react`, `@storybook-astro/framework`; not `pnpm create storybook`.
- `@storybook-astro/framework` 1.13 or newer; no TypeScript 7.
- React islands: `react({ include: ['**/react/**'] })` from `@storybook-astro/framework/integrations`.
- Meta of each React story: `parameters: { renderer: 'react' }`, not `'@storybook/react'`.
- `renderMode: 'static'`; no `'server'`.
- Plain values as story args; no functions in Astro story args.
- Images in Astro stories: string URLs or `ImageMetadata`; no `astro:assets` import.
- Fonts once in `fonts` in `astro.config.mjs`; not in `.storybook/` → [WHY](../WHY.md#astro-fonts-in-storybook).

## Component tests

### Storybook Astro testing

- Astro stories: `composeStories()` + `renderStory()` from `@storybook-astro/framework/testing`, query with `screen.getByRole()`.
- Config: `defineConfig()` from `@storybook-astro/framework/vitest`, `environment: 'happy-dom'`; not browser mode.
- React stories: not `renderStory()`; it renders Astro only.
- Interactions (click, type, focus, `play`): `@storybook/addon-vitest` in Vitest browser mode with Playwright Chromium; not happy-dom.
- `<script>` tags of `.astro` components: Playwright, not `renderStory()`.

## Snapshots

### Vitest ARIA snapshots

- `toMatchAriaSnapshot()` for React island structure; no `toMatchSnapshot()` → [WHY](../WHY.md#why-aria-snapshots-and-not-dom-snapshots).
- Vitest browser test: `composeStories()` from `@storybook/react`, `await Story.run()`, `await expect.element(locator).toMatchAriaSnapshot()`. Not in `play` or happy-dom.
- Commit `.snap` files; review in the PR.

### [Playwright](STACK.md#playwright) ARIA snapshots

- `toMatchAriaSnapshot()` for page structure, stored with `{ name: '<page>.aria.yml' }`.

## Screenshots

### Playwright screenshots

- `toHaveScreenshot()` only; no Vitest `toMatchScreenshot()` → [WHY](../WHY.md#why-one-tool-for-screenshots).
- Components: built Storybook `iframe.html?id=<story-id>&viewMode=story`; screenshot `page.locator('#storybook-root')`, not the viewport.
- Full pages: `astro preview` via `webServer`.
- Baselines: PNG, no `type: 'webp'` → [WHY](../WHY.md#why-png-baselines-in-git); in git, no Git LFS.
- Viewport in `playwright.config.ts`; `mask` dynamic content.
- Allow font provider requests in story screenshot tests.
- Baselines only from CI: manual workflow with `pnpm exec vitest run -u` and `pnpm exec playwright test --update-snapshots`. No local baseline commits → [WHY](../WHY.md#why-baselines-come-only-from-ci).
- On failure, upload `test-results/` as a CI artifact.

## End-to-end tests

### Playwright

- Against `astro preview` → [DEV](DEV.md). `pnpm exec playwright install chromium`.
- `webServer`: `command: 'pnpm run preview --port <port>'`, same port in `url`, `reuseExistingServer: !process.env.CI`.
- Manual, script, or agent start with `--background`, stop by PID → [DEV](DEV.md) (Local dev).
- Test each critical flow: signup, login, payment.
- Payments in provider test mode, never live keys; keys as CI secrets.
- [Stripe](STACK.md#stripe): sandbox test API keys ([test mode](https://docs.stripe.com/test-mode)).
- [Creem](STACK.md#creem): test API key, `server: "test"` in the `creem` SDK ([test mode](https://docs.creem.io/getting-started/test-mode)).
- Signup test: read the verification link from `GET /_emdash/api/dev/emails`, against `astro dev` ([EmDash email setup](https://docs.emdashcms.com/guides/email/)).

## Accessibility

### [axe](STACK.md#axe)

- Each page: `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()` from `@axe-core/playwright`; `violations` equals `[]`.

## CI

### [GitHub Actions](STACK.md#github-actions)

- PR workflow runs unit, snapshot, end-to-end, screenshot tests in the order of [QUALITY](QUALITY.md#order) → [DEPLOY](DEPLOY.md#ci).
