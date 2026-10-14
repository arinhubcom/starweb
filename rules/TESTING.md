# TESTING

## Test runner

### [Vitest](https://vitest.dev/guide/)

- Use Vitest 4.1. Do not upgrade to Vitest 5 while `@storybook-astro/framework` accepts only `vitest ^4.1.0` in its peer dependencies. Read [WHY.md](../WHY.md#why-vitest-41-and-not-vitest-5).
- Install `@vitest/expect`, `@vitest/spy`, `@vitest/utils`, and `@vitest/pretty-format` at the same version as `vitest`. Do not let npm hoist the 3.x copies that Storybook depends on.
- Do not install `@effect/vitest` 4.x. Run Effect code in a test with `Effect.runPromise()`.
- Do not run `vitest -u` in the PR workflow. Update snapshots only in the manual workflow (see Screenshots).

## Unit and integration tests

### [Cloudflare Vitest plugin](https://developers.cloudflare.com/workers/testing/vitest-integration/get-started/)

- Test Worker code with `@cloudflare/vitest-plugin`. Do not use `@cloudflare/vitest-pool-workers`. Read [WHY.md](../WHY.md#why-cloudflarevitest-plugin).
- Add `cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' } })` to `plugins` in `vitest.config.ts`.
- Read the D1 migrations in `vitest.config.ts` with `readD1Migrations()` from `@cloudflare/vitest-plugin`, and pass them as a `TEST_MIGRATIONS` binding in `miniflare.bindings`.
- Apply the migrations in a setup file with `applyD1Migrations(env.DB, env.TEST_MIGRATIONS)` from `cloudflare:test`.
- Call `reset()` from `cloudflare:test` in `afterEach()` when tests in one file must not share data. Storage is isolated per test file, not per test.
- Write a test for each repository module that checks that a query never returns rows of another tenant.

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
- Create and update baselines only in CI, with a workflow that you start by hand and that runs `npx playwright test --update-snapshots`. Do not commit baselines from a local machine. Read [WHY.md](../WHY.md#why-baselines-come-only-from-ci).
- Upload the diff images in `test-results/` as a CI artifact when a screenshot test fails.

## End-to-end tests

### [Playwright](https://playwright.dev/docs/intro)

- Run end-to-end tests against `astro preview`. Follow the rules in [DEV.md](DEV.md).
- Test each critical flow: signup, login, and payment.

## Accessibility

### [axe for Playwright](https://playwright.dev/docs/accessibility-testing)

- Scan each page with `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()` from `@axe-core/playwright`, and expect `violations` to equal `[]`.

## CI

### [GitHub Actions](https://docs.github.com/en/actions)

- Run the unit, snapshot, end-to-end, and screenshot tests in the PR workflow. Follow the rules in [DEPLOY.md](DEPLOY.md#ci).
- Run the baseline update workflow only by hand.
