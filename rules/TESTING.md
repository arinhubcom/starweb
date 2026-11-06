# TESTING

This file covers how to write and run tests in a project: unit, component, snapshot, screenshot, end-to-end, and accessibility tests. Read it before you add or change a test.

## Write unit and integration tests

### Vitest

- Use [Vitest](STACK.md#vitest) 5. See [WHY](../WHY.md#why-vitest-5).
- In tests, use `Effect.runPromise()`, or `it.effect()` from `@effect/vitest` at the `effect` version.
- Do not run `vitest -u` in the PR workflow. Update snapshots only in the manual workflow. See [TESTING](TESTING.md#write-screenshot-tests).

### Cloudflare Vitest plugin

- Use the [Cloudflare Vitest plugin](STACK.md#cloudflare-vitest-plugin) `@cloudflare/vitest-plugin`, not `@cloudflare/vitest-pool-workers`. See [WHY](../WHY.md#why-cloudflarevitest-plugin).
- The test config is in `vitest.config.ts`, `wrangler.test.jsonc`, and `test/setup.ts`.
- Add each binding that a test needs to `wrangler.test.jsonc`. See [WHY](../WHY.md#why-tests-use-wranglertestjsonc).
- Do not import `astro:*` in tested code. Use `import type` or `vi.mock()`.
- Apply the migrations of an app database in `test/setup.ts`. Never apply them on `env.DB`. See [SAAS](SAAS.md#give-each-app-a-d1-database).
- If tests in a file must not share data, call `reset()` from `cloudflare:test` in `afterEach()`.
- Then apply the migrations again in `beforeEach()`.
- For each repository module, test that a query never returns rows of another tenant.

### Coverage

- Use `istanbul` for coverage, not `v8`. See [WHY](../WHY.md#why-istanbul-coverage-and-not-v8).
- Give each kept starter file under `src/` a test, or add it to `test.coverage.exclude`. This includes re-export files.

## Write component tests

### Storybook

- Use one [Storybook](STACK.md#storybook) 10 for `.astro` files and React islands. See [WHY](../WHY.md#why-storybook-astro).
- Write a story for each visible state: default, edge cases, hover, focus, and error.
- Add `@storybook/addon-a11y` to every story.

### Storybook Astro

- Use [Storybook Astro](STACK.md#storybook-astro): `@storybook-astro/framework` in `.storybook/main.ts`, not the `storybook-astro` package.
- Install the dev packages `storybook`, `@storybook/builder-vite`, `@storybook/react`, and `@storybook-astro/framework`. Do not use `pnpm create storybook`.
- Use `@storybook-astro/framework` 1.13 or newer. Do not use TypeScript 7.
- For React islands, use `react({ include: ['**/react/**'] })` from `@storybook-astro/framework/integrations`.
- In the meta of each React story, set `parameters: { renderer: 'react' }`, not `'@storybook/react'`.
- Set `renderMode: 'static'`. Do not use `'server'`.
- Use plain values as story args. Do not use functions in Astro story args.
- For images in Astro stories, use string URLs or `ImageMetadata`. Do not import `astro:assets`.
- Set fonts once in `fonts` in `astro.config.mjs`, not in `.storybook/`. See [WHY](../WHY.md#astro-fonts-in-storybook).

### Test components in Vitest

- Test Astro stories with `composeStories()` and `renderStory()` from `@storybook-astro/framework/testing`.
- Query with `screen.getByRole()`.
- Use `defineConfig()` from `@storybook-astro/framework/vitest` with `environment: 'happy-dom'`. Do not use browser mode for this.
- Do not use `renderStory()` for React stories. It renders Astro only.
- Test interactions (click, type, focus, `play`) with `@storybook/addon-vitest` in Vitest browser mode with Playwright Chromium. Do not use happy-dom.
- Test the `<script>` tags of `.astro` components with Playwright, not `renderStory()`.

## Write snapshot tests

### Vitest ARIA snapshots

- Use `toMatchAriaSnapshot()` for React island structure. Do not use `toMatchSnapshot()`. See [WHY](../WHY.md#why-aria-snapshots-and-not-dom-snapshots).
- Write a Vitest browser test with `composeStories()` from `@storybook/react`.
- Run `await Story.run()`, then `await expect.element(locator).toMatchAriaSnapshot()`.
- Do not run it in `play` or in happy-dom.
- Commit the `.snap` files. Review them in the PR.

### Playwright ARIA snapshots

- Use [Playwright](STACK.md#playwright) `toMatchAriaSnapshot()` for page structure.
- Store each snapshot with `{ name: '<page>.aria.yml' }`.

## Write screenshot tests

- Use `toHaveScreenshot()` of Playwright only. Do not use the Vitest `toMatchScreenshot()`. See [WHY](../WHY.md#why-one-tool-for-screenshots).
- For components, open the built Storybook at `iframe.html?id=<story-id>&viewMode=story`.
- Screenshot `page.locator('#storybook-root')`, not the viewport.
- For full pages, use `astro preview` through `webServer`.
- Store baselines as PNG. Do not use `type: 'webp'`. See [WHY](../WHY.md#why-png-baselines-in-git).
- Keep baselines in git. Do not use Git LFS.
- Set the viewport in `playwright.config.ts`. Use `mask` for dynamic content.
- Allow font provider requests in story screenshot tests.
- Create baselines only in CI, with a manual workflow that runs `pnpm exec vitest run -u` and `pnpm exec playwright test --update-snapshots`.
- Do not commit local baselines. See [WHY](../WHY.md#why-baselines-come-only-from-ci).
- On failure, upload `test-results/` as a CI artifact.

## Write end-to-end tests

### Playwright setup

- Run Playwright against `astro preview`. See [DEV](DEV.md).
- Install the browser with `pnpm exec playwright install chromium`.
- In `webServer`, set `command: 'pnpm run preview --port <port> --ignore-lock'`, the same port in `url`, and `reuseExistingServer: !process.env.CI`.
- Keep `--ignore-lock`. Without it, `astro preview` moves to the background under an agent, and Playwright reports that the server exited early.
- If you start the server by hand, from a script, or from an agent, add `--background` and stop it by process ID. See [DEV](DEV.md#start-a-preview-from-an-agent-or-a-script).

### Critical flows

- Test each critical flow: signup, login, and payment.
- Run payments in the provider test mode. Never use live keys. Store the keys as CI secrets.
- For [Stripe](STACK.md#stripe), use sandbox test API keys. See [test mode](https://docs.stripe.com/test-mode).
- For [Creem](STACK.md#creem), use a test API key and `server: "test"` in the `creem` SDK. See [test mode](https://docs.creem.io/getting-started/test-mode).
- In the signup test, read the verification link from `GET /_emdash/api/dev/emails`, against `astro dev`. See [EmDash email setup](https://docs.emdashcms.com/guides/email/).

## Test accessibility

- On each page, run `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()` from `@axe-core/playwright`, using [axe](STACK.md#axe).
- Expect `violations` to equal `[]`.

## Run tests in CI

- Run the unit, snapshot, end-to-end, and screenshot tests in the PR workflow in the order of [QUALITY](QUALITY.md#order-the-steps-of-a-pull-request-workflow). See [DEPLOY](DEPLOY.md#set-up-ci) and [GitHub Actions](STACK.md#github-actions).
