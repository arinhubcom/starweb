# SETUP

Set up a new Starweb project with these steps, in order. Later steps depend on earlier ones. Each step links to the rules for its topic.

## Project

### [create-emdash](https://github.com/emdash-cms/emdash/tree/main/packages/create-emdash)

1. Check that `node --version` is 22.16.0 or later.
2. Create the project from the EmDash Cloudflare starter template: `npm create emdash@latest my-site -- --template cloudflare:starter --install --yes`. Replace `my-site` with the project name. Add `--sandboxed-plugins` only when the site uses sandboxed plugins: it needs a Workers paid plan. Do not use the `node` platform. Follow the rules in [CMS.md](CMS.md).
3. Rename the `AGENTS.md` file of the template to `EMDASH.md`.
4. Copy `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `WHY.md`, and the `rules/` folder from the [Starweb repository](https://github.com/arinhubcom/starweb) to the project root.
5. Add `- Follow the rules in [EMDASH.md](EMDASH.md) for the EmDash template.` to the `## Rules` list in `AGENTS.md`.
6. Run `git init`. Keep the `.gitignore` of the template: it ignores `.env` and `.dev.vars`.
7. Add `.emdash/migrations.json`, `test-results/`, and the folder for D1 exports to `.gitignore`. Add `.env.sentry-build-plugin` if the site uses Sentry. Follow the rules in [DEPLOY.md](DEPLOY.md) (EmDash core migrations), [TESTING.md](TESTING.md) (Screenshots), [DATA.md](DATA.md) (Backups), and [OBSERVABILITY.md](OBSERVABILITY.md) (Source maps).
8. Pin the Node.js version in `.nvmrc` or in `engines.node` of `package.json`. CI reads it with `node-version-file` of `actions/setup-node`. Follow the rules in [DEPS.md](DEPS.md) (Install).
9. Add a committed `.npmrc` with `min-release-age=3`, `.github/dependabot.yml`, and the automerge workflow. Follow the rules in [DEPS.md](DEPS.md) (Update, Supply chain).

## Cloudflare

### [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

10. Log in to Cloudflare with `npx wrangler login`.
11. Set `compatibility_date` in `wrangler.jsonc` to `2026-08-04` or later, and remove `nodejs_compat` from `compatibility_flags`. The template sets an older date. Follow the rules in [ARCH.md](ARCH.md).
12. Keep the binding names `DB` and `MEDIA`, and the `src/worker.ts` entrypoint from the template. The EmDash adapters need them. Create the D1 database with a location hint and set Targeted Placement. Follow the rules in [PERF.md](PERF.md) (Placement). Follow the rules in [SAAS.md](SAAS.md) (Architecture).
13. Add the `CF_VERSION_METADATA` version metadata binding. Follow the rules in [DEPLOY.md](DEPLOY.md) (Releases).
14. Turn on Workers Logs with `"observability": { "enabled": true }`. Follow the rules in [OBSERVABILITY.md](OBSERVABILITY.md) (Logs).
15. Keep local secrets in the `.env` file that `create-emdash` writes with `EMDASH_ENCRYPTION_KEY`. Do not add a `.dev.vars` file: when it exists, Wrangler ignores `.env`. Follow the rules in [SECURITY.md](SECURITY.md) (Secrets).
16. Add the Cron Trigger and the `scheduled` handler in `src/worker.ts`, if the site publishes on a schedule. Follow the rules in [CMS.md](CMS.md) (Drafts and preview).
17. Add the Queue producers and consumers, a dead letter queue, and the `queue()` export in `src/worker.ts`, if the site uses Queues. Follow the rules in [ARCH.md](ARCH.md) (Backend).

## TypeScript

### [TypeScript](https://www.typescriptlang.org/tsconfig/)

18. Change `extends` in `tsconfig.json` from `astro/tsconfigs/base` to `astro/tsconfigs/strict`, and add `scripts/` and `sentry.*.config.ts` to `include`. Follow the rules in [QUALITY.md](QUALITY.md) (Language, Lint).
19. Add the `@/*` path alias to `compilerOptions` in `tsconfig.json`. Follow the rules in [COMPONENTS.md](COMPONENTS.md).

### [Effect](https://effect.website) and [Zod](https://zod.dev)

20. Install Effect and Zod with `npm i effect zod zod-compiler`. Add `zodCompiler()` from `zod-compiler/vite` to `vite.plugins` in `astro.config.mjs`. Follow the rules in [ARCH.md](ARCH.md) (Code).
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

29. Create the CSP module `src/lib/security/csp.ts` with the hash of the theme script, and pass it to `security.csp` in `astro.config.mjs`. Add sources for Sentry, Turnstile, and Web Analytics only if the site uses them. Follow the rules in [SECURITY.md](SECURITY.md) (Headers) and [COMPONENTS.md](COMPONENTS.md) (Astro components).
30. Create `src/lib/security/headers.ts`, and use it in the middleware and in `public/_headers`. Follow the rules in [SECURITY.md](SECURITY.md) (Headers).

## Auth

### [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth)

31. Add emdash-better-auth, an email provider, and `BETTER_AUTH_SECRET` in `.env`, if the site has user login. Follow the rules in [AUTH.md](AUTH.md).

## Apps and payments

### [SaaS](SAAS.md)

32. Create `src/apps/<app>/` with its pages, API routes, and `db/` folder, and its own D1 database and migrations folder, if the site has an app. Follow the rules in [SAAS.md](SAAS.md) (Multiple apps) and [ARCH.md](ARCH.md) (Apps).
33. Add `src/apps/<app>/db/seed.sql` and a `db:seed` npm script, if the app has a database. Follow the rules in [DATA.md](DATA.md) (Seed data).
34. Add `scripts/openapi.ts` and the route `src/apps/<app>/api/openapi.json.ts`, if the app has an API. Follow the rules in [API.md](API.md) (Contract).
35. Add a table with a unique constraint for processed webhook event IDs, if the site sells with Creem. Follow the rules in [PAYMENTS.md](PAYMENTS.md) (EU sales).

## Observability

### [Sentry](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)

36. Install `@sentry/astro` and `@sentry/cloudflare`, and wrap the handler in `src/worker.ts` with `Sentry.withSentry`, if the site uses Sentry. Set `vite: { build: { sourcemap: true } }` and delete only `./dist/client/**/*.map` after the upload. Follow the rules in [OBSERVABILITY.md](OBSERVABILITY.md) (Errors, Source maps).

## Quality

### [ESLint](https://eslint.org/docs/latest/use/configure/configuration-files)

37. Install ESLint and create the flat config `eslint.config.mjs`, with `globalIgnores`. Follow the rules in [QUALITY.md](QUALITY.md) (Lint).
38. Install Prettier with `npm i -D prettier prettier-plugin-astro prettier-plugin-tailwindcss`. Put `prettier-plugin-tailwindcss` last in `plugins` in `.prettierrc`. Follow the rules in [QUALITY.md](QUALITY.md) (Format).
39. Install Knip and create `knip.json` with the `entry` globs. Follow the rules in [QUALITY.md](QUALITY.md) (Unused code).
40. Add the `typecheck`, `lint`, `format`, `format:check`, `knip`, `test`, and `check` scripts to `package.json`. Follow the rules in [QUALITY.md](QUALITY.md) (Scripts).

## Tests

### [Vitest](https://vitest.dev/guide/)

41. Install Vitest 4.1 and `@cloudflare/vitest-plugin`, and create `vitest.config.ts` with `cloudflareTest()`, one `readD1Migrations()` call for each app database, and the `istanbul` coverage provider with 80 % thresholds. Follow the rules in [TESTING.md](TESTING.md) (Test runner, Unit and integration tests).
42. Install Storybook with Storybook Astro by hand, and create `.storybook/main.ts`. Follow the rules in [TESTING.md](TESTING.md) (Components).
43. Install Playwright and `@axe-core/playwright`, and create `playwright.config.ts` with the `webServer` option for `astro preview`. Follow the rules in [TESTING.md](TESTING.md) (Screenshots, End-to-end tests, Accessibility).

## Agent skills

### [skills CLI](https://github.com/vercel-labs/skills)

44. Install the agent skills that [CMS.md](CMS.md) and [COMPONENTS.md](COMPONENTS.md) list.

## Checks

### [Astro](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

45. Generate the binding types with `npx wrangler types`.
46. Run `npx astro check`. Install each missing package that it reports, until it has no errors. Follow the rules in [QUALITY.md](QUALITY.md).
47. Start the dev server with `npm run dev`. Open `http://localhost:4321/_emdash/admin/` and complete the setup wizard.
48. Run `npm run check`. It must pass before the first commit.
49. Build with `npm run build`, and test the built Worker in workerd with `npm run preview`.
50. Run `npx emdash doctor`. Follow the rules in [CMS.md](CMS.md) (Drafts and preview).
51. Commit the project.

## Deploy

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

52. Back up `EMDASH_ENCRYPTION_KEY` from `.env` in a password manager. Do not commit `.env`: EmDash cannot decrypt plugin secrets without the key.
53. Add the `env.production` block to `wrangler.jsonc` with its own D1 database, R2 bucket, `routes`, and `"preview_urls": true`. Repeat each non-inheritable key that the site uses: `d1_databases`, `r2_buckets`, `kv_namespaces`, `version_metadata`, `images`, `ratelimits`, `queues`, `workflows`, `durable_objects`, `services`, `vars`, `secrets`, and `define`. Follow the rules in [DEPLOY.md](DEPLOY.md) (Environments).
54. Set `EMDASH_SITE_URL` to the production URL in `env.production.vars` before you complete the admin setup on prod. Do not set it at the top level: without it, dev and local dev keep the address that the setup runs on.
55. Create the GitHub environments `dev` and `production` with the variables `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, and `EMDASH_TARGET_FINGERPRINT`, and the Cloudflare tokens. Limit `production` to the release tag pattern and `main`, and add required reviewers. Follow the rules in [DEPLOY.md](DEPLOY.md) (CI, Migrations).
56. Set the production secrets (`EMDASH_ENCRYPTION_KEY` and `BETTER_AUTH_SECRET`) before the first stage upload. Follow the rules in [DEPLOY.md](DEPLOY.md) (Secrets).
57. Add the CI workflows: PR checks, PR preview, dev deploy, stage upload on a release tag, and promotion. Add the scheduled D1 export if the site has app data. Follow the rules in [DEPLOY.md](DEPLOY.md) (CI) and [QUALITY.md](QUALITY.md) (Order).
58. Do the first dev deploy: run `npm run build`, `npx emdash migrate`, `wrangler d1 migrations apply <db> --remote --env=""` for each app database, then `wrangler deploy --env=""`. After this, each push to `main` deploys dev. Follow the rules in [DEPLOY.md](DEPLOY.md) (Migrations, CI).
59. Do the first release: push the tag `<worker>-YYYY-MM-DD-r1`, approve the `production` job, test the stage URL, then run the promotion workflow to raise traffic in steps. Follow the rules in [DEPLOY.md](DEPLOY.md) (Releases, CI).
60. Check that the dev-bypass routes return `403` on prod. Follow the rules in [SECURITY.md](SECURITY.md) (Auth).
