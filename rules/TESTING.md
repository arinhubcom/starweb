# TESTING

## Test runner

### [Vitest](https://vitest.dev/guide/)

- Use Vitest 4.1. Do not upgrade to Vitest 5 while `@storybook-astro/framework` accepts only `vitest ^4.1.0` in its peer dependencies. Read [WHY.md](../WHY.md#why-vitest-41-and-not-vitest-5).
- Install `@vitest/expect`, `@vitest/spy`, `@vitest/utils`, and `@vitest/pretty-format` at the same version as `vitest`. Do not let npm hoist the 3.x copies that Storybook depends on.
- Do not install `@effect/vitest` 4.x. Run Effect code in a test with `Effect.runPromise()`.
- Do not run `vitest -u` in the PR workflow. Update snapshots only in the manual workflow (see Screenshots). Vitest does not write snapshots when the `CI` environment variable is set, so a missing snapshot fails the PR run. Run `vitest run -u` in the manual workflow to create it.

## Unit and integration tests

### [Cloudflare Vitest plugin](https://developers.cloudflare.com/workers/testing/vitest-integration/get-started/)

- Test Worker code with `@cloudflare/vitest-plugin`. Do not use `@cloudflare/vitest-pool-workers`. Read [WHY.md](../WHY.md#why-cloudflarevitest-plugin).
- Create `wrangler.test.jsonc` as a copy of `wrangler.jsonc` without `main` and `triggers`. With `main`, the plugin loads `src/worker.ts` and the Astro handler, and fails with `Cannot find package 'virtual:astro-cloudflare:config'`.
- Add `cloudflareTest({ wrangler: { configPath: './wrangler.test.jsonc' } })` to `plugins` in `vitest.config.ts`.
- Add `@cloudflare/vitest-plugin/types` to `compilerOptions.types` and the test folder to `include` in `tsconfig.json`. Otherwise `astro check` reports `Cannot find module 'cloudflare:test'`.
- Do not import `astro:*` modules (such as `astro:middleware`) in code that a test imports: Vitest cannot resolve them. Use `import type`, or `vi.mock()` the module.
- Read the migrations of each app database in `vitest.config.ts`: call `readD1Migrations()` from `@cloudflare/vitest-plugin` with the `migrations_dir` of that database (see [SAAS.md](SAAS.md) (Multiple apps)), for example `migrations/app1`. Pass each result as its own binding in `miniflare.bindings`, for example `APP1_TEST_MIGRATIONS`.
- Apply each set in `beforeEach()` of a setup file with `applyD1Migrations()` from `cloudflare:test` to the matching binding, for example `applyD1Migrations(env.APP1_DB, env.APP1_TEST_MIGRATIONS)`. Do not apply app migrations to `env.DB`: it is the EmDash database, and `emdash migrate` manages its schema.
- Call `reset()` from `cloudflare:test` in `afterEach()` when tests in one file must not share data. It drops the tables too, so apply the migrations again in `beforeEach()`. Storage is isolated per test file, not per test.
- Set `test.exclude` to `[...configDefaults.exclude, 'e2e/**']` (from `vitest/config`), so Vitest does not run the Playwright tests.
- Write a test for each repository module that checks that a query never returns rows of another tenant.

### [Coverage](https://vitest.dev/guide/coverage)

- Use the `istanbul` coverage provider: set `test.coverage.provider` to `'istanbul'` and install `@vitest/coverage-istanbul` at the same version as `vitest`. Do not use `v8`: the Workers Vitest plugin does not support it ([known issues](https://developers.cloudflare.com/workers/testing/vitest-integration/known-issues/)).
- Set `test.coverage.thresholds` to `lines: 80`, `functions: 80`, `branches: 80`, and `statements: 80`. Vitest fails the run when one is lower.
- Set `test.coverage.include` to `['src/**/*.{ts,tsx}']`. By default Vitest counts only files that a test imports, so an untested file would not lower the result. Exclude stories with `exclude: [...coverageConfigDefaults.exclude, '**/*.stories.*']` (from `vitest/config`).
- Write a test for each starter file under `src/` that you keep, or add it to `test.coverage.exclude`, such as `src/live.config.ts`, `src/middleware.ts`, and `src/utils/site-identity.ts`. Add re-export files such as `index.ts` to the same list.
- Run the `test` script as `vitest run --coverage`. Coverage thresholds apply only when coverage is on.

## Components

### [Storybook](https://storybook.js.org/docs)

- Use one Storybook 10 for `.astro` components and React islands. Read [WHY.md](../WHY.md#why-storybook-astro).
- Write a story for each visible state of a component: default, edge cases, hover, focus, and error.
- Add `@storybook/addon-a11y` to check each story for accessibility problems.

### [Storybook Astro](https://github.com/storybook-astro/storybook-astro)

- Use `@storybook-astro/framework` as the framework in `.storybook/main.ts`. Do not use the `storybook-astro` package.
- Install it by hand with `npm install -D storybook @storybook/builder-vite @storybook/react @storybook-astro/framework`. Do not use `npm create storybook`.
- Use `@astrojs/react` 6.x. Do not upgrade to 7.x while `@storybook-astro/framework` accepts only `^4.2.3 || ^5.0.0 || ^6.0.0`.
- Render React islands with `react({ include: ['**/react/**'] })` from `@storybook-astro/framework/integrations`, so the `.tsx` files in `src/components/ui/react/` render as React.
- Set `parameters: { renderer: 'react' }` in the meta of each React story. Do not use `renderer: '@storybook/react'`.
- Keep the default `renderMode: 'static'`. Do not use `renderMode: 'server'`.
- Pass plain values as story args. Do not pass functions as args of Astro stories.
- Pass images to Astro stories as string URLs or `ImageMetadata`. Do not import them with `astro:assets` in a story.
- Set fonts once in `fonts` in `astro.config.mjs`. Do not copy them into `.storybook/`. Read [WHY.md](../WHY.md#astro-fonts-in-storybook).

## Component tests

### [Storybook Astro testing](https://storybook-astro.org/guides/testing/)

- Test the rendered output of an Astro story (content, props, slots) with `composeStories()` and `renderStory()` from `@storybook-astro/framework/testing`, and query it with `screen.getByRole()`.
- Create the Vitest config for these tests with `defineConfig()` from `@storybook-astro/framework/vitest`, with `environment: 'happy-dom'`. Do not use this config in browser mode.
- Do not render React stories with `renderStory()`. It renders only Astro components.
- Test interactions (click, type, focus, and `play` functions) with `@storybook/addon-vitest` in Vitest browser mode with Playwright Chromium. Do not test them in happy-dom.
- Test the `<script>` tags of `.astro` components with Playwright. Do not test them with `renderStory()`.

## Snapshots

### [Vitest ARIA snapshots](https://vitest.dev/guide/browser/aria-snapshots)

- Use `toMatchAriaSnapshot()` to check the structure of a React island. Do not snapshot the DOM with `toMatchSnapshot()`. Read [WHY.md](../WHY.md#why-aria-snapshots-and-not-dom-snapshots).
- Run ARIA snapshots in a Vitest browser test: render the story with `composeStories()` from `@storybook/react` and `await Story.run()`, then call `await expect.element(locator).toMatchAriaSnapshot()`. Do not call it in a `play` function or in happy-dom.
- Commit `.snap` files to git and review them in the PR.

### [Playwright ARIA snapshots](https://playwright.dev/docs/aria-snapshots)

- Use `toMatchAriaSnapshot()` to check the structure of a page. Store it in a file with `{ name: '<page>.aria.yml' }`.

## Screenshots

### [Playwright screenshots](https://playwright.dev/docs/test-snapshots)

- Use Playwright `toHaveScreenshot()` for all screenshot tests. Do not use Vitest `toMatchScreenshot()`. Read [WHY.md](../WHY.md#why-one-tool-for-screenshots).
- Take screenshots of components on the story page of the built Storybook: `iframe.html?id=<story-id>&viewMode=story`.
- Take a screenshot of the component locator, for example `expect(page.locator('#storybook-root')).toHaveScreenshot()`. Do not take a screenshot of the full viewport for a component.
- Take screenshots of full pages against `astro preview` with the `webServer` option.
- Keep the default PNG format for baselines. Do not set `type: 'webp'`. Read [WHY.md](../WHY.md#why-png-baselines-in-git).
- Commit baselines to git. Do not use Git LFS.
- Set the viewport in `playwright.config.ts`, and hide dynamic content with the `mask` option.
- Allow requests to the font provider in screenshot tests of stories. Storybook Astro loads fonts from the provider URLs.
- Create and update baselines only in CI, with a workflow that you start by hand and that runs `npx vitest run -u` (ARIA `.snap` files) and `npx playwright test --update-snapshots` (screenshots and `.aria.yml` files). Do not commit baselines from a local machine. Read [WHY.md](../WHY.md#why-baselines-come-only-from-ci).
- Upload the diff images in `test-results/` as a CI artifact when a screenshot test fails.

## End-to-end tests

### [Playwright](https://playwright.dev/docs/intro)

- Run end-to-end tests against `astro preview`. Follow the rules in [DEV.md](DEV.md).
- Install the browser with `npx playwright install chromium`.
- Start the server with the `webServer` option and a fixed port: `command: 'npm run preview -- --port <port>'`, with the same port in `url`. Set `reuseExistingServer: !process.env.CI`, so CI never reuses a stale server.
- Run `astro build` before the tests. Do not delete `.wrangler/deploy/config.json`: `astro preview` stops with `No build output found` without it.
- Test each critical flow: signup, login, and payment.
- Run payment tests in provider test mode, never with live keys. For Stripe, use the test API keys of a [sandbox](https://docs.stripe.com/test-mode). For Creem, use a test API key and set `server: "test"` in the `creem` SDK, which uses `https://test-api.creem.io` ([test mode](https://docs.creem.io/getting-started/test-mode)). Pass the test keys as CI secrets.
- Read the verification link of the signup test from `GET /_emdash/api/dev/emails`. Run this test against `astro dev`, not `astro preview`: the EmDash console email provider and this endpoint exist only in `astro dev` and never in a production build ([EmDash email setup](https://docs.emdashcms.com/guides/email/)).

## Accessibility

### [axe for Playwright](https://playwright.dev/docs/accessibility-testing)

- Scan each page with `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()` from `@axe-core/playwright`, and expect `violations` to equal `[]`.

## CI

### [GitHub Actions](https://docs.github.com/en/actions)

- Run the unit, snapshot, end-to-end, and screenshot tests in the PR workflow, in the order in [QUALITY.md](QUALITY.md#order). Follow the rules in [DEPLOY.md](DEPLOY.md#ci).
