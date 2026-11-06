# SETUP

This file is an ordered procedure for a new Starweb project. If the project already exists, see [UPDATE](UPDATE.md).

Step 1 chooses the optional parts. Steps 2 to 4 create the project with [setup.mjs](https://github.com/arinhubcom/starweb/blob/main/scripts/setup.mjs). The other steps are manual.

## Choose

### Optional parts

1. Ask the user which optional parts to add.
   - Put the whole list in one question.
   - Ask for the site URL for step 4 in the same question.
   - Ask for the D1 location for step 6 in the same question. The choices are `wnam` (Western North America), `enam` (Eastern North America), `weur` (Western Europe), `eeur` (Eastern Europe), `apac` (Asia-Pacific), `oc` (Oceania), or no location.
   - Say that with no location, D1 creates the database close to where step 6 runs.
   - If the user is not sure about the location, use no location.
   - Wait for the answer before step 2. See [WHY](../WHY.md#why-setup-asks-about-optional-parts-first).
   - These are the optional parts and their steps:
     - Sandboxed plugins (Workers paid plan): step 3.
     - Queues: step 8.
     - Many languages: step 9.
     - User login, emdash-better-auth: step 12.
     - Email, Cloudflare Email Service: step 13. Without it, user login has no email verification, password reset, or email login.
     - Apps with their own D1 database: steps 14 and 15. A multi-tenant app needs user login with organizations.
     - OpenAPI contract for an app: step 16. It needs an app.
     - Stripe billing, without EU consumer sales: step 17. It needs user login.
     - Creem, for EU consumer sales: step 18. It needs user login with organizations, Queues, and an app database.
     - Sentry: step 19.
     - Storybook: step 20.
     - Playwright and axe: step 21.
     - Scheduled publishing is on by default. Ask whether to keep it. If the user says no, run step 7.
   - Add only what the user picks, and skip the steps of the other parts.
   - A step that names no optional part runs in every project.
   - If a pick needs another part, add that part too, and tell the user.
   - If the user is not sure about a part, leave it out, and say that the step can run later.

## Project

### [EmDash](STACK.md#emdash)

2. Install the newest Node.js LTS.
   - Use the major in `<starweb>/template/.nvmrc`. Check that `node --version` starts with it.
   - Check that `pnpm --version` is 12 or higher. See the [installation](https://pnpm.io/installation) guide.
   - See [DEPS](DEPS.md#install-packages).
3. Do not run `create-emdash`. `setup.mjs` copies its `cloudflare:starter` output.
   - If the project uses sandboxed plugins (Workers paid plan), uncomment `worker_loaders` in `wrangler.jsonc`.
   - Never use the `node` platform.
   - See [CMS](CMS.md).

### setup.mjs

4. Run `node <starweb>/scripts/setup.mjs <project-dir> --name <name> --site <url>`.
   - `<starweb>` is a Starweb clone that you keep outside the project, for example `~/starweb`.
   - Never keep the clone in a temporary folder, because `update.mjs` needs it. See [UPDATE](UPDATE.md).
   - `<project-dir>` is the path of a new or empty folder.
   - `<name>` has lowercase letters, digits, and hyphens, and starts with a letter.
   - The script writes `.starweb.json` with the clone commit, the name, and the site. Step 26 commits it.
   - The script copies the starter files, configs, security, tests, CI, and Dependabot. See [QUALITY](QUALITY.md), [SECURITY](SECURITY.md), [TESTING](TESTING.md), [DEPLOY](DEPLOY.md), and [DEPS](DEPS.md).
   - The script copies the agent files and `rules/`.
   - The script writes `package.json` with the project name, and copies `pnpm-lock.yaml`.
   - The script writes a new `EMDASH_ENCRYPTION_KEY` to `.env`.
   - The script runs `pnpm install --frozen-lockfile`, `pnpm exec wrangler types`, and `pnpm exec tsx scripts/theme.ts`.
   - The script runs `git init` and `oxfmt`.

## Cloudflare

### [Wrangler](STACK.md#wrangler)

5. Run `pnpm exec wrangler login`.
6. Set up the Cloudflare resources in `wrangler.jsonc`.
   - If the user chose a location in step 1, create the [D1](STACK.md#d1) database with `pnpm exec wrangler d1 create <name> --location=<hint>`.
   - If the user chose no location, create it with `pnpm exec wrangler d1 create <name>`.
   - Write the choice in a comment next to `d1_databases` in `wrangler.jsonc`, so that later databases use the same one.
   - Add its `database_id` to the `DB` entry of `d1_databases` in `wrangler.jsonc`.
   - If the database is not near the default `aws:eu-central-1`, change the Targeted Placement region.
   - Give `FORMS_LIMITER` a `namespace_id` that no other Worker in the account uses.
   - See [PERF](PERF.md#choose-the-placement), [SAAS](SAAS.md), and [CMS](CMS.md#add-emdash-forms).
7. Decide whether to keep scheduled publishing. This is a local edit. It needs no login and not step 6.
   - If the project has no scheduled publishing, remove the Cron Trigger and the `scheduled` handler in `src/worker.ts`.
   - If the project keeps it, change nothing.
   - See [CMS](CMS.md#show-a-draft-in-preview).
8. If the project uses [Queues](STACK.md#queues), set up these parts:
   - Producers and consumers.
   - A dead letter queue.
   - The `queue()` export in `src/worker.ts`.
   - See [ARCH](ARCH.md#write-worker-code).

## Astro

### [Astro](STACK.md#astro) i18n

9. If the project is multilingual, set up these parts:
   - Astro i18n routing.
   - The [Paraglide JS](STACK.md#paraglide-js) plugin for UI strings.
   - An `isPrerendered` branch in `src/middleware.ts` with `sequence()`.
   - The [PolyStella](STACK.md#polystella) EmDash plugin and the `AI` binding for content.
   - See [I18N](I18N.md), [SECURITY](SECURITY.md#protect-against-csrf), and [DEPLOY](DEPLOY.md).

## UI

### [Fulldev UI](STACK.md#fulldev-ui)

10. The project already holds [Fulldev UI](STACK.md#fulldev-ui): `components.json`, `src/lib/utils.ts`, the button, and the home page button.
    - Do not run `shadcn init`.
    - Add components with `pnpm exec shadcn add`, then apply `tv()` and [MATERIAL](MATERIAL.md).
    - If the project uses a React island, add `@base-ui/react` and its [Knip](STACK.md#knip) exception.
    - See [COMPONENTS](COMPONENTS.md) and [QUALITY](QUALITY.md#remove-unused-code).
11. Set the brand color and the fonts.
    - Set the brand color in `SEED` in `scripts/theme.ts`.
    - Run `pnpm exec tsx scripts/theme.ts`. It rewrites `src/styles/theme.css`.
    - `setup.mjs` generates `src/styles/theme.css` with the default seed, and `src/styles/global.css` imports it.
    - See [MATERIAL](MATERIAL.md#set-the-colors).
    - Keep or change the fonts in `src/lib/fonts.ts`. `pnpm run fonts` checks them.
    - See [MEDIA](MEDIA.md#change-or-add-a-font).

## Auth

### [emdash-better-auth](STACK.md#emdash-better-auth)

12. If the project has user login, use emdash-better-auth.
    - Import `betterAuthProvider` and `betterAuthSettingsPlugin` from `emdash-better-auth`.
    - Set `authProviders: [betterAuthProvider()]` in `emdash()`.
    - Add `betterAuthSettingsPlugin()` to `plugins` of `emdash()`.
    - Put `BETTER_AUTH_SECRET` in `.env`. Create it with `openssl rand -base64 32`.
    - See [AUTH](AUTH.md#set-up-login) and [DEPS](DEPS.md#install-packages).
13. If the project sends email, set up these parts:
    - A `send_email` binding `EMAIL` in `wrangler.jsonc`.
    - A verified sender domain.
    - `cloudflareEmail()` in `plugins` of `emdash()`.
    - See [AUTH](AUTH.md#send-auth-email) and [EMAIL](EMAIL.md).

## Apps and payments

### SaaS

14. If the project has an app, create `src/apps/<app>/`.
    - Add pages, API routes, and `db/`.
    - Give the app its own D1 database and a migrations folder.
    - See [SAAS](SAAS.md#add-more-than-one-app) and [ARCH](ARCH.md#add-an-app).
15. If the app has a database, add `src/apps/<app>/db/seed.sql` and the package script `db:seed`. See [DATA](DATA.md#seed-data-for-local-development).
16. If the app has an API, add `scripts/openapi.ts` and the route `src/apps/app1/api/openapi.ts`.
    - Inject the route in `integration.ts` with `injectRoute({ pattern: "/app1/api/openapi.json", ... })`.
    - See [API](API.md#define-the-contract).
17. If the project sells with [Stripe](STACK.md#stripe), set the secrets and price variables.
    - Then set up "Stripe billing" on the Better Auth admin settings page.
    - See [PAYMENTS](PAYMENTS.md#choose-a-billing-provider).
18. If the project sells with [Creem](STACK.md#creem), add a table with a unique constraint for processed webhook event IDs. See [PAYMENTS](PAYMENTS.md#sell-to-eu-customers).

## Observability

### [Sentry](STACK.md#sentry)

19. If the project uses Sentry, set up these parts:
    - Add `@sentry/astro` and `@sentry/cloudflare`.
    - Wrap the handler in `src/worker.ts` with `Sentry.withSentry`.
    - Add `.env.sentry-build-plugin` to `.gitignore`.
    - Add the Sentry sources to the CSP module.
    - Set `vite: { build: { sourcemap: true } }`.
    - After the upload, delete only `./dist/client/**/*.map`.
    - See [OBSERVABILITY](OBSERVABILITY.md#report-errors-with-sentry), [OBSERVABILITY](OBSERVABILITY.md#source-maps), and [SECURITY](SECURITY.md#set-the-security-headers).

## Tests

### [Storybook](STACK.md#storybook)

20. If the project has a component library, use Storybook with [Storybook Astro](STACK.md#storybook-astro).
    - Do not use `pnpm create storybook`.
    - Create `.storybook/main.ts`.
    - See [TESTING](TESTING.md#write-component-tests).

### [Playwright](STACK.md#playwright)

21. If the project has end-to-end tests, set up these parts:
    - Playwright and `@axe-core/playwright` ([axe](STACK.md#axe)).
    - `pnpm exec playwright install chromium`.
    - `playwright.config.ts` with `webServer` for `astro preview --ignore-lock`.
    - See [TESTING](TESTING.md#write-screenshot-tests), [TESTING](TESTING.md#write-end-to-end-tests), and [TESTING](TESTING.md#test-accessibility).

## Agent skills

### [skills CLI](STACK.md#skills-cli)

22. Install the agent skills.
    - Run these commands one at a time: `pnpm dlx skills add emdash-cms/skills`, `pnpm dlx skills add shadcn/ui`, and `pnpm dlx skills add fulldotdev/ui --skill fulldev-ui`.
    - Run only these commands. The `skills` sources in [STACK](STACK.md) are not part of setup.
    - If an agent or a script runs them, add `--yes`.
    - Skills go to `.agents/skills`. `.claude/skills` links to that folder.
    - Step 26 commits them.

## Checks

23. Run `pnpm run dev`, open `http://localhost:4321/_emdash/admin/`, and complete the setup wizard.
    - If the project has user login without the email part, turn off **Require email verification** on the Better Auth settings page. Sign-up cannot finish without an email.
    - To test a form, set the [Turnstile test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) in the Forms plugin settings.
    - See [DEV](DEV.md) and [CMS](CMS.md#add-emdash-forms).
24. Check that the project builds and serves before the first commit.
    - Check that `pnpm run check`, `pnpm run build`, and `pnpm run size` exit with 0.
    - Run `pnpm run preview --port <port> --background`. Check that `/` returns 200.
    - Then run `pnpm exec astro preview stop`.
    - See [QUALITY](QUALITY.md#order-the-steps-of-a-pull-request-workflow), [PERF](PERF.md#limit-client-javascript), and [DEV](DEV.md).
25. Run `pnpm exec emdash doctor`.
    - The check passes when the scheduler line has `✔`.
    - Exit code 1, `database: not found`, and `ERROR 1 issues found` are expected, not a failure. Its database check looks for local SQLite, not D1.
    - If you removed scheduled publishing in step 7, skip this step.
    - See [CMS](CMS.md#show-a-draft-in-preview).
26. Make the first commit.
    - Run `git add -A`, then `git commit -m "chore: set up <name> with Starweb"`.
    - `setup.mjs` makes no commit.
    - `.gitignore` keeps `.env` out.

## Deploy

### [Workers](STACK.md#workers)

27. Set the site values and the privacy policy.
    - In `src/lib/site.ts`, set `SITE`, `CONTROLLER`, and the contact addresses. `SECURITY_CONTACT` must be a mailbox that someone reads.
    - In `src/pages/privacy.astro`, replace each `[Add` marker. Check that `grep -n '\[Add' src/pages/privacy.astro` prints nothing.
    - If you do not know a value, ask the user. Never invent legal text.
    - See [SECURITY](SECURITY.md#publish-a-disclosure-contact) and [PRIVACY](PRIVACY.md#write-the-privacy-policy).
28. Back up `EMDASH_ENCRYPTION_KEY` from `.env` in a password manager.
    - Never commit `.env`.
    - Plugin secrets are undecryptable without the key.
29. Add an `env.production` block to `wrangler.jsonc`.
    - Give it its own D1 database and R2 bucket.
    - Add `routes` and `"preview_urls": true`.
    - Add every non-inheritable key that the project uses: `d1_databases`, `r2_buckets`, `kv_namespaces` with `SESSION`, `version_metadata`, `images`, `ratelimits`, `ai`, `queues`, `workflows`, `durable_objects`, `services`, `vars`, `secrets`, `define`.
    - See [DEPLOY](DEPLOY.md#set-up-the-environments).
30. Set the production site URL and the migrations mode.
    - Set `EMDASH_SITE_URL` to the production URL in `env.production.vars`, before the production admin setup.
    - Never set it at the top level. Dev keeps the address that setup runs on.
    - Set `EMDASH_MIGRATIONS_MODE` to `manual` in `env.production.vars` too.
    - See [CMS](CMS.md#run-migrations).
31. Create the GitHub environments `dev` and `production`.
    - Set the variables `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, and `EMDASH_TARGET_FINGERPRINT`, plus the Cloudflare tokens.
    - For `dev`, use `main` and `refs/pull/*/merge`.
    - For `production`, use the release tag pattern and `main` only.
    - If the repository is private, you need GitHub Pro or Team. See [GITHUB](GITHUB.md#choose-a-plan).
    - See [DEPLOY](DEPLOY.md#set-up-ci), [DEPLOY](DEPLOY.md#migrate-the-databases), and [TOKENS](TOKENS.md).
32. Set the production secrets before the first stage upload.
    - Set `EMDASH_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET` if the project has user login, and the secrets of the other picked parts.
    - Run `<source> | pnpm run set-secrets production`, after `gh auth login` and `wrangler login`.
    - Worker secrets need an uploaded version of the production Worker. Without one, Cloudflare fails with error 10222.
    - For the first version, use `wrangler versions upload --secrets-file <file>`.
    - See [TOKENS](TOKENS.md) and [DEPLOY](DEPLOY.md#set-secrets).
33. Set the repository settings.
    - Enable "Allow auto-merge".
    - Make CI a required status check for `main`. `dependabot-automerge.yml` needs both.
    - Add the CI workflows that the project lacks: PR preview, dev deploy, stage upload on release tag, and promotion.
    - If the site has app data, add the scheduled D1 export.
    - See [DEPS](DEPS.md#update-packages) and [DEPLOY](DEPLOY.md#set-up-ci).
34. Make the first dev deploy.
    - Run `pnpm run build`.
    - Run `pnpm exec emdash migrate`.
    - Run `wrangler d1 migrations apply <db> --remote --env=""` for each app database.
    - Run `wrangler deploy --env=""`.
    - After this, each push to `main` deploys dev.
    - See [DEPLOY](DEPLOY.md#migrate-the-databases) and [DEPLOY](DEPLOY.md#set-up-ci).
35. Make the first release.
    - Push the tag `<worker>-YYYY-MM-DD-r1`.
    - Test the stage URL.
    - Run the promotion workflow. It moves traffic in steps.
    - If the site uses forms, create a Turnstile widget and set its keys in the Forms plugin settings on production.
    - See [DEPLOY](DEPLOY.md#release-to-production), [DEPLOY](DEPLOY.md#set-up-ci), and [CMS](CMS.md#add-emdash-forms).
36. Check that the dev-bypass routes return `403` on production. See [SECURITY](SECURITY.md#check-auth).
37. Set up the production checks after the first release.
    - Create a Google API key with the PageSpeed Insights API enabled, as `PAGESPEED_API_KEY`.
    - Create a Cloudflare API token with the permission Workers Observability Write, as `CLOUDFLARE_OBSERVABILITY_TOKEN`.
    - Set both as secrets of the environment `production`: `<source> | pnpm run set-secrets production`.
    - Set the repository variable `PRODUCTION_WORKER` (`<worker>-production`).
    - `.github/workflows/perf.yml` runs daily and stays silent until `PRODUCTION_WORKER` is set.
    - See [TOKENS](TOKENS.md), [PERF](PERF.md#measure-core-web-vitals), and [PERF](PERF.md#budget-workers-cpu).
