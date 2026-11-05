# SETUP

Existing project → [UPDATE](UPDATE.md). Ordered procedure for a new Starweb project; step 1 chooses the optional parts, steps 2-4 create the project from the [template](https://github.com/arinhubcom/starweb/tree/main/template) and [setup.mjs](https://github.com/arinhubcom/starweb/blob/main/scripts/setup.mjs), the rest is manual.

## Choose

### Optional parts

1. Ask the user which optional parts to add, with the whole list in one question, and ask for the site URL for step 4. Wait for the answer before step 2. → [WHY](../WHY.md#why-setup-asks-about-optional-parts-first)
   - Sandboxed plugins (Workers paid plan): step 3.
   - Queues: step 8.
   - Many languages: step 9.
   - User login, emdash-better-auth: step 12.
   - Email, Cloudflare Email Service: step 13. Without it, user login has no email verification, password reset, or email login.
   - Apps with their own D1 database: steps 14 and 15. A multi-tenant app needs user login with organizations.
   - OpenAPI contract for an app: step 16. Needs an app.
   - Stripe billing, without EU consumer sales: step 17. Needs user login.
   - Creem, for EU consumer sales: step 18. Needs user login with organizations, Queues, and an app database.
   - Sentry: step 19.
   - Storybook: step 20.
   - Playwright and axe: step 21.
   - The template turns on scheduled publishing. Ask whether to keep it; no → step 7.

   Add only what the user picks, and skip the steps of the other parts. A step that names no optional part runs in every project. A pick needs another part → add that part too, and tell the user. User not sure about a part → leave it out, and say that the step can run later.

## Project

### [EmDash](STACK.md#emdash)

2. Newest Node.js LTS, the major in `template/.nvmrc`; `node --version` starts with it, `pnpm --version` ≥ 12 ([installation](https://pnpm.io/installation)). → [DEPS](DEPS.md) (Install)
3. No `create-emdash` run: `template/` holds its `cloudflare:starter` output. Sandboxed plugins (Workers paid plan) → uncomment `worker_loaders` in `wrangler.jsonc`. Never the `node` platform. → [CMS](CMS.md)

### setup.mjs

4. `node <starweb>/scripts/setup.mjs my-site --name <name> --site <url>`; `<starweb>` = Starweb clone kept outside the project (for example `~/starweb`), never in a temporary folder (`update.mjs` needs it, [UPDATE](UPDATE.md)); `my-site` = new or empty folder. Writes `.starweb.json` (clone commit, name, site); commit it. The script: copies `template/` to the project root: starter files, configs, security, tests, CI, Dependabot ([QUALITY](QUALITY.md), [SECURITY](SECURITY.md), [TESTING](TESTING.md), [DEPLOY](DEPLOY.md), [DEPS](DEPS.md)), copies agent files and `rules/`, writes `package.json` with the project name, copies `pnpm-lock.yaml`, writes a new `EMDASH_ENCRYPTION_KEY` to `.env`, `pnpm install --frozen-lockfile`, `pnpm exec wrangler types`, `pnpm exec tsx scripts/theme.ts`, `git init`, `oxfmt`.

## Cloudflare

### [Wrangler](STACK.md#wrangler)

5. `pnpm exec wrangler login`.
6. Create the [D1](STACK.md#d1) database with a location hint, set `database_id` in `wrangler.jsonc`, and change the Targeted Placement region if the database is not near the template default `aws:eu-central-1`. Give `FORMS_LIMITER` a `namespace_id` that no other Worker in the account uses. → [PERF](PERF.md) (Placement), [SAAS](SAAS.md), [CMS](CMS.md#emdash-forms) (Architecture)
7. No scheduled publishing → remove the Cron Trigger and the `scheduled` handler in `src/worker.ts`. → [CMS](CMS.md) (Drafts and preview)
8. Uses [Queues](STACK.md#queues) → producers, consumers, a dead letter queue, `queue()` export in `src/worker.ts`. → [ARCH](ARCH.md) (Backend)

## Astro

### [Astro](STACK.md#astro) i18n

9. Multilingual → Astro i18n routing, [Paraglide JS](STACK.md#paraglide-js) plugin for UI strings, `isPrerendered` branch in `src/middleware.ts` with `sequence()`; [PolyStella](STACK.md#polystella) EmDash plugin and the `AI` binding for content. → [I18N](I18N.md), [SECURITY](SECURITY.md) (CSRF), [DEPLOY](DEPLOY.md)

## UI

### [Fulldev UI](STACK.md#fulldev-ui)

10. `template/` already holds [Fulldev UI](STACK.md#fulldev-ui): `components.json`, `src/lib/utils.ts`, the button, and the home page button. No `shadcn init`. Add components with `pnpm exec shadcn add`, then apply `tv()` and [MATERIAL](MATERIAL.md). React island → add `@base-ui/react` and its [Knip](STACK.md#knip) exception. → [COMPONENTS](COMPONENTS.md), [QUALITY](QUALITY.md) (Unused code)
11. Set the brand color in `SEED` in `scripts/theme.ts`; `pnpm exec tsx scripts/theme.ts` rewrites `src/styles/theme.css` (`setup.mjs` generates it with the default seed, and `src/styles/global.css` imports it). → [MATERIAL](MATERIAL.md) (Color). Keep or change the fonts in `src/lib/fonts.ts`; `pnpm run fonts` checks them. → [MEDIA](MEDIA.md) (Fonts)

## Auth

### [emdash-better-auth](STACK.md#emdash-better-auth)

12. User login → emdash-better-auth; `betterAuthProvider`, `betterAuthSettingsPlugin` from `emdash-better-auth`; `authProviders: [betterAuthProvider()]` and `betterAuthSettingsPlugin()` in `plugins` of `emdash()`; `BETTER_AUTH_SECRET` in `.env`. No email part → turn off **Require email verification** on the Better Auth settings page, because sign-up cannot finish without an email. → [AUTH](AUTH.md), [DEPS](DEPS.md) (Install)
13. Email → `send_email` binding `EMAIL` in `wrangler.jsonc`, verified sender domain, `cloudflareEmail()` in `plugins` of `emdash()`. → [AUTH](AUTH.md) (Email), [EMAIL](EMAIL.md)

## Apps and payments

### SaaS

14. App → `src/apps/<app>/` with pages, API routes, `db/`, own D1 database and migrations folder. → [SAAS](SAAS.md) (Multiple apps), [ARCH](ARCH.md) (Apps)
15. App database → `src/apps/<app>/db/seed.sql` and package script `db:seed`. → [DATA](DATA.md) (Seed data)
16. App API → `scripts/openapi.ts` and route `src/apps/app1/api/openapi.ts`, injected in `integration.ts` with `injectRoute({ pattern: "/app1/api/openapi.json", ... })`. → [API](API.md) (Contract)
17. Sells with [Stripe](STACK.md#stripe) → secrets and price variables, then "Stripe billing" in the Better Auth admin settings page. → [PAYMENTS](PAYMENTS.md) (Providers)
18. Sells with [Creem](STACK.md#creem) → table with a unique constraint for processed webhook event IDs. → [PAYMENTS](PAYMENTS.md) (EU sales)

## Observability

### [Sentry](STACK.md#sentry)

19. Uses Sentry → `@sentry/astro`, `@sentry/cloudflare`; wrap the handler in `src/worker.ts` with `Sentry.withSentry`; `.env.sentry-build-plugin` in `.gitignore`; Sentry sources in the CSP module; `vite: { build: { sourcemap: true } }`; after upload delete only `./dist/client/**/*.map`. → [OBSERVABILITY](OBSERVABILITY.md) (Errors, Source maps), [SECURITY](SECURITY.md) (Headers)

## Tests

### [Storybook](STACK.md#storybook)

20. Component library → Storybook with [Storybook Astro](STACK.md#storybook-astro), not `pnpm create storybook`; create `.storybook/main.ts`. → [TESTING](TESTING.md) (Components)

### [Playwright](STACK.md#playwright)

21. End-to-end tests → Playwright and `@axe-core/playwright` ([axe](STACK.md#axe)), `pnpm exec playwright install chromium`, `playwright.config.ts` with `webServer` for `astro preview`. → [TESTING](TESTING.md) (Screenshots, End-to-end tests, Accessibility)

## Agent skills

### [skills CLI](STACK.md#skills-cli)

22. Install the skills listed in [CMS](CMS.md) and [COMPONENTS](COMPONENTS.md).

## Checks

23. `pnpm run dev`; open `http://localhost:4321/_emdash/admin/`; complete the setup wizard. To test a form, set the [Turnstile test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) in the Forms plugin settings. → [DEV](DEV.md), [CMS](CMS.md#emdash-forms)
24. `pnpm run check`, `pnpm run build`, `pnpm run size`, `pnpm run preview` all pass before the first commit. → [QUALITY](QUALITY.md) (Order), [PERF](PERF.md#client-javascript), [DEV](DEV.md)
25. `pnpm exec emdash doctor`; read only the scheduler line (its database check looks for local SQLite, not D1). → [CMS](CMS.md) (Drafts and preview)
26. Commit.

## Deploy

### [Workers](STACK.md#workers)

27. In `src/lib/site.ts`, set `SITE`, `CONTROLLER`, and the contact addresses (`SECURITY_CONTACT` must be a mailbox that someone reads). In `src/pages/privacy.astro`, replace each `[Add` marker; `grep -n '\[Add' src/pages/privacy.astro` prints nothing. Value not known → ask the user; never invent legal text. → [SECURITY](SECURITY.md) (Disclosure), [PRIVACY](PRIVACY.md) (Privacy policy)
28. Back up `EMDASH_ENCRYPTION_KEY` from `.env` in a password manager; never commit `.env` (plugin secrets are undecryptable without it).
29. `env.production` block in `wrangler.jsonc`: own D1 database, R2 bucket, `routes`, `"preview_urls": true`, plus every used non-inheritable key (`d1_databases`, `r2_buckets`, `kv_namespaces` with `SESSION`, `version_metadata`, `images`, `ratelimits`, `ai`, `queues`, `workflows`, `durable_objects`, `services`, `vars`, `secrets`, `define`). → [DEPLOY](DEPLOY.md) (Environments)
30. `EMDASH_SITE_URL` = production URL in `env.production.vars`, before the prod admin setup. Never top level (dev keeps the address setup runs on).
31. GitHub environments `dev` and `production`: variables `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `EMDASH_TARGET_FINGERPRINT`, plus the Cloudflare tokens. `production`: release tag pattern and `main` only. Private repository: GitHub Pro or Team → [GITHUB](GITHUB.md#plans). → [DEPLOY](DEPLOY.md) (CI, Migrations)
32. Prod secret `EMDASH_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET` with user login, and the secrets of the other picked parts, before the first stage upload. → [DEPLOY](DEPLOY.md) (Secrets)
33. Dependabot automerge workflow and the CI workflows the template lacks: PR preview, dev deploy, stage upload on release tag, promotion; scheduled D1 export if the site has app data. → [DEPS](DEPS.md) (Update), [DEPLOY](DEPLOY.md) (CI)
34. First dev deploy: `pnpm run build`, `pnpm exec emdash migrate`, `wrangler d1 migrations apply <db> --remote --env=""` per app database, `wrangler deploy --env=""`. Then each push to `main` deploys dev. → [DEPLOY](DEPLOY.md) (Migrations, CI)
35. First release: push tag `<worker>-YYYY-MM-DD-r1`, test the stage URL, run the promotion workflow (traffic in steps). Site uses forms → create a Turnstile widget and set its keys in the Forms plugin settings on production. → [DEPLOY](DEPLOY.md) (Releases, CI), [CMS](CMS.md#emdash-forms)
36. Dev-bypass routes return `403` on prod. → [SECURITY](SECURITY.md) (Auth)
37. Production checks, after the first release: create a Google API key with the PageSpeed Insights API enabled, and set the repository secret `PAGESPEED_API_KEY`. Create a Cloudflare API token with the permission Workers Observability Write, and set the repository secret `CLOUDFLARE_OBSERVABILITY_TOKEN`. Set the repository variables `CLOUDFLARE_ACCOUNT_ID` and `PRODUCTION_WORKER` (`<worker>-production`). Repository level, not the `production` environment, because these checks do not deploy. `.github/workflows/perf.yml` runs daily and stays silent until `PRODUCTION_WORKER` is set. → [PERF](PERF.md) (Core Web Vitals, Workers)
