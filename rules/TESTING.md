# TESTING

## Test runner

### [Vitest](https://vitest.dev/guide/)

- Use Vitest 4.1. Do not upgrade to Vitest 5 while `@storybook-astro/framework` accepts only `vitest ^4.1.0` in its peer dependencies. Read [WHY.md](../WHY.md#why-vitest-41-and-not-vitest-5).
- Do not install `@effect/vitest` 4.x. Run Effect code in a test with `Effect.runPromise()`.
- Do not run `vitest -u` in the PR workflow. Update snapshots and baselines only in the manual workflow (see Screenshots).

## Unit and integration tests

### [Cloudflare Vitest plugin](https://developers.cloudflare.com/workers/testing/vitest-integration/get-started/)

- Test Worker code with `@cloudflare/vitest-plugin`. Do not use `@cloudflare/vitest-pool-workers`. Read [WHY.md](../WHY.md#why-cloudflarevitest-plugin).
- Add `cloudflareTest({ wrangler: { configPath: './wrangler.jsonc' } })` to `plugins` in `vitest.config.ts`.
- Write a test for each repository module that checks that a query never returns rows of another tenant.

## Components

### [Storybook](https://storybook.js.org/docs)

- Use one Storybook 10 for `.astro` components and React islands. Read [WHY.md](../WHY.md#why-storybook-astro).
- Write a story for each visible state of a component: default, edge cases, hover, focus, and error.
- Add `@storybook/addon-a11y` to check each story for accessibility problems.

### [Storybook Astro](https://github.com/storybook-astro/storybook-astro)

- Use `@storybook-astro/framework` as the framework in `.storybook/main.ts`. Do not use the `storybook-astro` package.
- Install it by hand with `npm install -D storybook @storybook/builder-vite @storybook-astro/framework`. Do not use `npm create storybook`.
- Render React islands with `react({ include: ['**/react/**'] })` from `@storybook-astro/framework/integrations`, so the `.tsx` files in `src/components/ui/react/` render as React.
- Keep the default `renderMode: 'static'`. Do not use `renderMode: 'server'`.
- Pass plain values as story args. Do not pass functions as args of Astro stories.
- Pass images to Astro stories as string URLs or `ImageMetadata`. Do not import them with `astro:assets` in a story.
- Set fonts once in `fonts` in `astro.config.mjs`. Do not copy them into `.storybook/`. Read [WHY.md](../WHY.md#astro-fonts-in-storybook).
- Test the rendered output of a story (content, props, slots) with `composeStories()` and `renderStory()` from `@storybook-astro/framework/testing`.
- Create the Vitest config for these tests with `defineConfig()` from `@storybook-astro/framework/vitest`.
- Test interactions (click, type, focus, and `play` functions) with `@storybook/addon-vitest` in a real browser. Do not test them in happy-dom.
- Test the `<script>` tags of `.astro` components with Playwright. Do not test them with `renderStory()`.

## Snapshots

### [Vitest ARIA snapshots](https://vitest.dev/guide/browser/aria-snapshots)

- Use `toMatchAriaSnapshot()` to check the structure of a component. Do not snapshot the DOM with `toMatchSnapshot()`. Read [WHY.md](../WHY.md#why-aria-snapshots-and-not-dom-snapshots).
- Run ARIA snapshots in Vitest browser mode. Do not run them in happy-dom or jsdom.
- Commit `.snap` files to git, not to Git LFS, and review them in the PR.

### [Playwright ARIA snapshots](https://playwright.dev/docs/aria-snapshots)

- Use `toMatchAriaSnapshot()` to check the structure of a page. Store it in a file with `{ name: '<page>.aria.yml' }`.

## Screenshots

### [Vitest visual regression](https://vitest.dev/guide/browser/visual-regression-testing)

- Use `toMatchScreenshot()` on the locator of one component. For a full page, use Playwright `toHaveScreenshot()`.
- Set the viewport before you take a screenshot.
- Wait for `document.fonts.ready` before you take a screenshot.
- Hide dynamic content with the `mask` option of `screenshotOptions`.
- Set `allowedMismatchedPixelRatio` in `browser.expect.toMatchScreenshot.comparatorOptions`.
- Create and update baselines only in CI, with a workflow that you start by hand and that runs `vitest --update`. Do not commit baselines from a local machine. Read [WHY.md](../WHY.md#why-baselines-come-only-from-ci).
- Store baseline images in Git LFS. Add `**/__screenshots__/**/*.png filter=lfs diff=lfs merge=lfs -text` to `.gitattributes`.

### [Playwright screenshots](https://playwright.dev/docs/test-snapshots)

- Use `toHaveScreenshot()` for full pages. Run it against `astro preview` with the `webServer` option.
- Create and update baselines with `npx playwright test --update-snapshots` in the same manual CI workflow.
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
