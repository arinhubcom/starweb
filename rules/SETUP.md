# SETUP

Set up a new Starweb project with these steps, in order. Later steps depend on earlier ones. Each step links to the rules for its topic.

## Project

### [create-emdash](https://github.com/emdash-cms/emdash/tree/main/packages/create-emdash)

1. Check that `node --version` is 22.16.0 or later.
2. Create the project from the EmDash Cloudflare starter template: `npm create emdash@latest my-site -- --template cloudflare:starter --install --yes`. Replace `my-site` with the project name. Add `--sandboxed-plugins` only when the site uses sandboxed plugins: it needs a Workers paid plan. Do not use the `node` platform. Follow the rules in [CMS.md](CMS.md).
3. Rename the `AGENTS.md` file of the template to `EMDASH.md`, and delete `pnpm-workspace.yaml`: with it, `shadcn init` uses pnpm and writes `pnpm-lock.yaml`. Follow the rules in [DEPS.md](DEPS.md) (Install).
4. Copy `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `WHY.md`, and the `rules/` folder from the [Starweb repository](https://github.com/arinhubcom/starweb) to the project root.
5. Add `- Follow the rules in [EMDASH.md](EMDASH.md) for the EmDash template.` to the `## Rules` list in `AGENTS.md`.
6. Run `git init`. Keep the `.gitignore` of the template: it ignores `.env` and `.dev.vars`.
7. Add `.emdash/migrations.json`, `test-results/`, `coverage/`, and the folder for D1 exports (`backups/`) to `.gitignore`. Add `.env.sentry-build-plugin` if the site uses Sentry. Follow the rules in [DEPLOY.md](DEPLOY.md) (EmDash core migrations), [TESTING.md](TESTING.md) (Screenshots, Coverage), [DATA.md](DATA.md) (Backups), and [OBSERVABILITY.md](OBSERVABILITY.md) (Source maps).
8. Pin the Node.js version: write `22` in `.nvmrc`, or set `engines.node` in `package.json`. CI reads it with `node-version-file` of `actions/setup-node`. Follow the rules in [DEPS.md](DEPS.md) (Install).
9. Add a committed `.npmrc` with `min-release-age=3`, `.github/dependabot.yml`, and the automerge workflow. Follow the rules in [DEPS.md](DEPS.md) (Update, Supply chain).

## Cloudflare

### [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

10. Log in to Cloudflare with `npx wrangler login`.
11. Set `compatibility_date` in `wrangler.jsonc` to `2026-08-04` or later, and remove `nodejs_compat` from `compatibility_flags`. The template sets an older date. Follow the rules in [ARCH.md](ARCH.md).
12. Keep the binding names `DB` and `MEDIA`, and the `src/worker.ts` entrypoint from the template. The EmDash adapters need them. Rename `my-emdash-site` (`name`, `database_name`) and `my-emdash-media` (`bucket_name`) to the project name. Change `d1({ binding: "DB", session: "auto" })` in `astro.config.mjs` to `d1({ binding: "DB" })`. Create the D1 database with a location hint and set Targeted Placement. Follow the rules in [PERF.md](PERF.md) (Placement). Follow the rules in [SAAS.md](SAAS.md) (Architecture).
13. Add the `CF_VERSION_METADATA` version metadata binding. Follow the rules in [DEPLOY.md](DEPLOY.md) (Releases).
14. Turn on Workers Logs with `"observability": { "enabled": true }`. Follow the rules in [OBSERVABILITY.md](OBSERVABILITY.md) (Logs).
15. Keep local secrets in the `.env` file that `create-emdash` writes with `EMDASH_ENCRYPTION_KEY`. Do not add a `.dev.vars` file: when it exists, Wrangler ignores `.env`. Follow the rules in [SECURITY.md](SECURITY.md) (Secrets).
16. Check the Cron Trigger and the `scheduled` handler in `src/worker.ts`: the template has them. Remove them if the site does not publish on a schedule. Follow the rules in [CMS.md](CMS.md) (Drafts and preview).
17. Add the Queue producers and consumers, a dead letter queue, and the `queue()` export in `src/worker.ts`, if the site uses Queues. Follow the rules in [ARCH.md](ARCH.md) (Backend).

## TypeScript

### [TypeScript](https://www.typescriptlang.org/tsconfig/)

18. Change `extends` in `tsconfig.json` from `astro/tsconfigs/base` to `astro/tsconfigs/strict`, add the strict flags to `compilerOptions`, and set `include` to `src`, `scripts`, `e2e`, `.storybook/**/*`, `*.config.ts`, `sentry.*.config.ts`, `.astro/types.d.ts`, `emdash-env.d.ts`, and `worker-configuration.d.ts`. Follow the rules in [QUALITY.md](QUALITY.md) (Language, Lint).
19. Add the `@/*` path alias to `compilerOptions` in `tsconfig.json`. Follow the rules in [COMPONENTS.md](COMPONENTS.md).

### [Effect](https://effect.website) and [Zod](https://zod.dev)

20. Install Effect and Zod with `npm i effect zod zod-compiler`. Add `import zodCompiler from "zod-compiler/vite"` (a default import) and `zodCompiler()` to `vite.plugins` in `astro.config.mjs`. Follow the rules in [ARCH.md](ARCH.md) (Code).
21. Create `src/lib/effect/decode.ts` with `decode` and `ValidationError`. Follow the rules in [ARCH.md](ARCH.md) (Code).

## Astro

### [Astro configuration](https://docs.astro.build/en/reference/configuration-reference/)

22. Set `site` to the final public URL and `trailingSlash` to `'always'` or `'never'` in `astro.config.mjs`. Follow the rules in [SEO.md](SEO.md) (Site URL).
23. Set `cache: { provider: cacheCloudflare() }` in `astro.config.mjs`. Follow the rules in [PERF.md](PERF.md) (Cache).
24. Add Astro i18n routing, the Paraglide plugin, and `src/middleware.ts` that branches on `isPrerendered`, if the site is multilingual. Follow the rules in [I18N.md](I18N.md).

## UI

### [Tailwind CSS](https://tailwindcss.com/docs)

25. Install Tailwind CSS with `npx astro add tailwind`. Follow the rules in [DESIGN.md](DESIGN.md).
26. Set up Fulldev UI with `shadcn init`, then install `@base-ui/react` and `lucide-react`. Follow the rules in [COMPONENTS.md](COMPONENTS.md).
27. Add the Material Design 3 breakpoints and easing curves to `src/styles/global.css`. Generate `src/styles/theme.css` from the brand seed color with `npx tsx scripts/theme.ts`, and import it in `global.css`. Follow the rules in [MATERIAL.md](MATERIAL.md) (Color).
28. Update the base layout `src/layouts/Base.astro`: import `src/styles/global.css`, add `class="@container"` to `<body>`, render `<EmDashHead>` with `createPublicPageContext()` in `<head>`, add the blocking theme script in `<head>`, and add the "Skip to main content" link and one `<main>`. Follow the rules in [DESIGN.md](DESIGN.md), [COMPONENTS.md](COMPONENTS.md), [UI-UX.md](UI-UX.md) (Theme), and [SEO.md](SEO.md) (Page head).

## Security

### [Astro Content Security Policy](https://docs.astro.build/en/reference/configuration-reference/#securitycsp)

29. Create the CSP module `src/lib/security/csp.ts` with the hash of the theme script and `frame-ancestors` in `directives`, and pass it to `security.csp` in `astro.config.mjs`. Add sources for Sentry, Turnstile, and Web Analytics only if the site uses them. Follow the rules in [SECURITY.md](SECURITY.md) (Headers) and [COMPONENTS.md](COMPONENTS.md) (Astro components).
30. Create `src/lib/security/headers.ts` and use it in the middleware. Create `scripts/write-headers.ts` to write `public/_headers`, install `tsx`, and set `"build": "tsx scripts/write-headers.ts && astro build"`. Follow the rules in [SECURITY.md](SECURITY.md) (Headers).
31. Create `src/middleware.ts` with the `Origin` check, and set the security headers in it. If the site is multilingual, merge it with the i18n middleware of step 24 in the same file with `sequence()`. Follow the rules in [SECURITY.md](SECURITY.md) (CSRF) and [I18N.md](I18N.md).

## Auth

### [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth)

32. Add emdash-better-auth, an email provider, and `BETTER_AUTH_SECRET` in `.env`, if the site has user login. Install it with `npm i react@^19.2.6 react-dom@^19.2.6 emdash-better-auth`: the plugin needs React 19.2.6 or later, and the template pins an older version. Follow the rules in [AUTH.md](AUTH.md).

## Apps and payments

### [SaaS](SAAS.md)

33. Create `src/apps/<app>/` with its pages, API routes, and `db/` folder, and its own D1 database and migrations folder, if the site has an app. Follow the rules in [SAAS.md](SAAS.md) (Multiple apps) and [ARCH.md](ARCH.md) (Apps).
34. Add `src/apps/<app>/db/seed.sql` and a `db:seed` npm script, if the app has a database. Follow the rules in [DATA.md](DATA.md) (Seed data).
35. Add `scripts/openapi.ts` and the route `src/apps/<app>/api/openapi.json.ts`, if the app has an API. Follow the rules in [API.md](API.md) (Contract).
36. Add a table with a unique constraint for processed webhook event IDs, if the site sells with Creem. Follow the rules in [PAYMENTS.md](PAYMENTS.md) (EU sales).

## Observability

### [Sentry](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)

37. Install `@sentry/astro` and `@sentry/cloudflare`, and wrap the handler in `src/worker.ts` with `Sentry.withSentry`, if the site uses Sentry. Set `vite: { build: { sourcemap: true } }` and delete only `./dist/client/**/*.map` after the upload. Follow the rules in [OBSERVABILITY.md](OBSERVABILITY.md) (Errors, Source maps).

## Quality

### [ESLint](https://eslint.org/docs/latest/use/configure/configuration-files)

38. Install ESLint and create the flat config `eslint.config.mjs`, with the scoped `strictTypeChecked` preset and `globalIgnores` that include `worker-configuration.d.ts`, `.agents/`, `.claude/`, and `.cursor/`. Follow the rules in [QUALITY.md](QUALITY.md) (Lint).
39. Install Prettier with `npm i -D prettier prettier-plugin-astro prettier-plugin-tailwindcss`. Put `prettier-plugin-tailwindcss` last in `plugins` in `.prettierrc`. Create `.prettierignore`, run `npx prettier . --write` once, and commit the result. Follow the rules in [QUALITY.md](QUALITY.md) (Format).
40. Install Knip and create `knip.json` with `entry` (including `src/live.config.ts`), `ignore`, `ignoreIssues`, and `ignoreDependencies`. Follow the rules in [QUALITY.md](QUALITY.md) (Unused code).
41. Add the `typecheck`, `lint`, `format`, `format:check`, `knip`, `test`, and `check` scripts to `package.json`. Follow the rules in [QUALITY.md](QUALITY.md) (Scripts).
42. Remove the `deploy` script `astro build && wrangler deploy` that the template writes to `package.json`, or replace it with `astro build && wrangler versions upload`. Follow the rules in [DEPLOY.md](DEPLOY.md) (Releases).

## Tests

### [Vitest](https://vitest.dev/guide/)

43. Install Vitest 4.1 and `@cloudflare/vitest-plugin`. Create `wrangler.test.jsonc` (a copy of `wrangler.jsonc` without `main` and `triggers`) and `vitest.config.ts` with `cloudflareTest()`, one `readD1Migrations()` call for each app database, `test.exclude` with `e2e/**`, and the `istanbul` coverage provider with 80 % thresholds. Write the first test (the `decode` helper), and test or exclude `src/live.config.ts`, `src/middleware.ts`, and `src/utils/site-identity.ts` in the coverage. Follow the rules in [TESTING.md](TESTING.md) (Test runner, Unit and integration tests, Coverage).
44. Install Storybook with Storybook Astro by hand, and create `.storybook/main.ts`. Follow the rules in [TESTING.md](TESTING.md) (Components).
45. Install Playwright and `@axe-core/playwright`, run `npx playwright install chromium`, and create `playwright.config.ts` with the `webServer` option for `astro preview`. Follow the rules in [TESTING.md](TESTING.md) (Screenshots, End-to-end tests, Accessibility).

## Agent skills

### [skills CLI](https://github.com/vercel-labs/skills)

46. Install the agent skills that [CMS.md](CMS.md) and [COMPONENTS.md](COMPONENTS.md) list.

## Checks

### [Astro](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

47. Generate the binding types with `npx wrangler types`.
48. Run `npx astro check`. Install each missing package that it reports. Fix the template type errors (`exactOptionalPropertyTypes` in the starter pages and `Base.astro`, and `satisfies ExportedHandler` in `src/worker.ts`), until it has no errors. Follow the rules in [QUALITY.md](QUALITY.md) (Language).
49. Start the dev server with `npm run dev`. Open `http://localhost:4321/_emdash/admin/` and complete the setup wizard.
50. Run `npm run check`. It must pass before the first commit.
51. Build with `npm run build`, and test the built Worker in workerd with `npm run preview`.
52. Run `npx emdash doctor` and read only its scheduler line: its database check looks for a local SQLite file, not D1. Follow the rules in [CMS.md](CMS.md) (Drafts and preview).
53. Commit the project.

## Deploy

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

54. Back up `EMDASH_ENCRYPTION_KEY` from `.env` in a password manager. Do not commit `.env`: EmDash cannot decrypt plugin secrets without the key.
55. Add the `env.production` block to `wrangler.jsonc` with its own D1 database, R2 bucket, `routes`, and `"preview_urls": true`. Repeat each non-inheritable key that the site uses: `d1_databases`, `r2_buckets`, `kv_namespaces`, `version_metadata`, `images`, `ratelimits`, `queues`, `workflows`, `durable_objects`, `services`, `vars`, `secrets`, and `define`. Follow the rules in [DEPLOY.md](DEPLOY.md) (Environments).
56. Set `EMDASH_SITE_URL` to the production URL in `env.production.vars` before you complete the admin setup on prod. Do not set it at the top level: without it, dev and local dev keep the address that the setup runs on.
57. Create the GitHub environments `dev` and `production` with the variables `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, and `EMDASH_TARGET_FINGERPRINT`, and the Cloudflare tokens. Limit `production` to the release tag pattern and `main`, and add required reviewers. Follow the rules in [DEPLOY.md](DEPLOY.md) (CI, Migrations).
58. Set the production secrets (`EMDASH_ENCRYPTION_KEY` and `BETTER_AUTH_SECRET`) before the first stage upload. Follow the rules in [DEPLOY.md](DEPLOY.md) (Secrets).
59. Add the CI workflows: PR checks, PR preview, dev deploy, stage upload on a release tag, and promotion. Add the scheduled D1 export if the site has app data. Follow the rules in [DEPLOY.md](DEPLOY.md) (CI) and [QUALITY.md](QUALITY.md) (Order).
60. Do the first dev deploy: run `npm run build`, `npx emdash migrate`, `wrangler d1 migrations apply <db> --remote --env=""` for each app database, then `wrangler deploy --env=""`. After this, each push to `main` deploys dev. Follow the rules in [DEPLOY.md](DEPLOY.md) (Migrations, CI).
61. Do the first release: push the tag `<worker>-YYYY-MM-DD-r1`, approve the `production` job, test the stage URL, then run the promotion workflow to raise traffic in steps. Follow the rules in [DEPLOY.md](DEPLOY.md) (Releases, CI).
62. Check that the dev-bypass routes return `403` on prod. Follow the rules in [SECURITY.md](SECURITY.md) (Auth).
