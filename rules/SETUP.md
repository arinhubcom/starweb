# SETUP

Ordered procedure for a new Starweb project; steps 1-3 create it from the [template](https://github.com/arinhubcom/starweb/tree/main/template) and [setup.mjs](https://github.com/arinhubcom/starweb/blob/main/scripts/setup.mjs), the rest is manual.

## Project

### [EmDash](STACK.md#emdash)

1. Newest Node.js LTS, the major in `template/files/.nvmrc`; `node --version` starts with it, `npm --version` ≥ 11. → [DEPS](DEPS.md) (Install)
2. Read the EmDash version from `devDependencies` of `template/package.json` in the [Starweb repository](https://github.com/arinhubcom/starweb). `npm create emdash@<version> my-site -- --template cloudflare:starter --install --yes`. `--sandboxed-plugins` only with sandboxed plugins (Workers paid plan). Never the `node` platform. → [CMS](CMS.md)

### setup.mjs

3. `node <starweb>/scripts/setup.mjs my-site --name <name> --site <url>`; `<starweb>` = Starweb clone kept outside the project (for example `~/starweb`), never in a temporary folder (`update.mjs` needs it, Update). Writes `.starweb.json` (clone commit, name, site); commit it. The script: renames `AGENTS.md` → `EMDASH.md`, deletes `pnpm-workspace.yaml`, copies agent files and `rules/` ([DEPS](DEPS.md)), copies config/security/test/CI/Dependabot files of `template/files/` ([QUALITY](QUALITY.md), [SECURITY](SECURITY.md), [TESTING](TESTING.md), [DEPLOY](DEPLOY.md), [DEPS](DEPS.md)), patches starter files and the [Tailwind CSS](STACK.md#tailwind-css), [Zod](STACK.md#zod), [Effect](STACK.md#effect) setup ([ARCH](ARCH.md), [DESIGN](DESIGN.md), [UI-UX](UI-UX.md)), adds the `/privacy` page and its footer link ([PRIVACY](PRIVACY.md)), adds `security.txt` generation ([SECURITY](SECURITY.md)), pins versions and the `overrides`, deletes the starter lockfile, `npm install`, `npx wrangler types`, `npx tsx scripts/theme.ts`, `prettier`, `git init`. Stop and report on `Starter changed`.

## Cloudflare

### [Wrangler](STACK.md#wrangler)

4. `npx wrangler login`.
5. Create the [D1](STACK.md#d1) database with a location hint, set `database_id` in `wrangler.jsonc`, and change the Targeted Placement region if the database is not near the template default `aws:eu-central-1`. → [PERF](PERF.md) (Placement), [SAAS](SAAS.md) (Architecture)
6. No scheduled publishing → remove the Cron Trigger and the `scheduled` handler in `src/worker.ts`. → [CMS](CMS.md) (Drafts and preview)
7. Uses [Queues](STACK.md#queues) → producers, consumers, a dead letter queue, `queue()` export in `src/worker.ts`. → [ARCH](ARCH.md) (Backend)

## Astro

### [Astro](STACK.md#astro) i18n

8. Multilingual → Astro i18n routing, [Paraglide JS](STACK.md#paraglide-js) plugin for UI strings, `isPrerendered` branch in `src/middleware.ts` with `sequence()`; [PolyStella](STACK.md#polystella) EmDash plugin and the `AI` binding for content. → [I18N](I18N.md), [SECURITY](SECURITY.md) (CSRF), [DEPLOY](DEPLOY.md)

## UI

### [Fulldev UI](STACK.md#fulldev-ui)

9. `npx shadcn@<version> init https://ui.full.dev/r/styles/base-vega/base.json`; `<version>` = `shadcn` in `devDependencies` of `template/package.json` (init adds `shadcn`). Install `@base-ui/react`, `lucide-react`, `tailwind-variants`; `npm rm class-variance-authority`. Add the [Knip](STACK.md#knip) exceptions for Fulldev. → [COMPONENTS](COMPONENTS.md), [QUALITY](QUALITY.md) (Unused code)
10. Set the brand color in `SEED` in `scripts/theme.ts`; `npx tsx scripts/theme.ts` rewrites `src/styles/theme.css` (`setup.mjs` generates it with the default seed, and `src/styles/global.css` imports it). After step 9, remove the color variables that `shadcn init` wrote to `:root` and `.dark` in `global.css`: they override `theme.css`. → [MATERIAL](MATERIAL.md) (Color)

## Auth

### [emdash-better-auth](STACK.md#emdash-better-auth)

11. User login → emdash-better-auth, an email provider, `BETTER_AUTH_SECRET` in `.env`. → [AUTH](AUTH.md), [DEPS](DEPS.md) (Install)

## Apps and payments

### SaaS

12. App → `src/apps/<app>/` with pages, API routes, `db/`, own D1 database and migrations folder. → [SAAS](SAAS.md) (Multiple apps), [ARCH](ARCH.md) (Apps)
13. App database → `src/apps/<app>/db/seed.sql` and npm script `db:seed`. → [DATA](DATA.md) (Seed data)
14. App API → `scripts/openapi.ts` and route `src/apps/app1/api/openapi.ts`, injected in `integration.ts` with `injectRoute({ pattern: "/app1/api/openapi.json", ... })`. → [API](API.md) (Contract)
15. Sells with [Creem](STACK.md#creem) → table with a unique constraint for processed webhook event IDs. → [PAYMENTS](PAYMENTS.md) (EU sales)

## Observability

### [Sentry](STACK.md#sentry)

16. Uses Sentry → `@sentry/astro`, `@sentry/cloudflare`; wrap the handler in `src/worker.ts` with `Sentry.withSentry`; `.env.sentry-build-plugin` in `.gitignore`; Sentry sources in the CSP module; `vite: { build: { sourcemap: true } }`; after upload delete only `./dist/client/**/*.map`. → [OBSERVABILITY](OBSERVABILITY.md) (Errors, Source maps), [SECURITY](SECURITY.md) (Headers)

## Tests

### [Storybook](STACK.md#storybook)

17. Component library → install Storybook with [Storybook Astro](STACK.md#storybook-astro) by hand, create `.storybook/main.ts`. → [TESTING](TESTING.md) (Components)

### [Playwright](STACK.md#playwright)

18. End-to-end tests → Playwright and `@axe-core/playwright` ([axe](STACK.md#axe)), `npx playwright install chromium`, `playwright.config.ts` with `webServer` for `astro preview`. → [TESTING](TESTING.md) (Screenshots, End-to-end tests, Accessibility)

## Agent skills

### [skills CLI](STACK.md#skills-cli)

19. Install the skills listed in [CMS](CMS.md) and [COMPONENTS](COMPONENTS.md).

## Checks

20. `npm run dev`; open `http://localhost:4321/_emdash/admin/`; complete the setup wizard. → [DEV](DEV.md)
21. `npm run check`, `npm run build`, `npm run size`, `npm run preview` all pass before the first commit. → [QUALITY](QUALITY.md) (Order), [PERF](PERF.md#client-javascript), [DEV](DEV.md)
22. `npx emdash doctor`; read only the scheduler line (its database check looks for local SQLite, not D1). → [CMS](CMS.md) (Drafts and preview)
23. Commit.

## Deploy

### [Workers](STACK.md#workers)

24. In `src/lib/site.ts`, set `SITE`, `CONTROLLER`, and the contact addresses (`SECURITY_CONTACT` must be a mailbox that someone reads). In `src/pages/privacy.astro`, replace each `[Add` marker; `grep -n '\[Add' src/pages/privacy.astro` prints nothing. → [SECURITY](SECURITY.md) (Disclosure), [PRIVACY](PRIVACY.md) (Privacy policy)
25. Back up `EMDASH_ENCRYPTION_KEY` from `.env` in a password manager; never commit `.env` (plugin secrets are undecryptable without it).
26. `env.production` block in `wrangler.jsonc`: own D1 database, R2 bucket, `routes`, `"preview_urls": true`, plus every used non-inheritable key (`d1_databases`, `r2_buckets`, `kv_namespaces` with `SESSION`, `version_metadata`, `images`, `ratelimits`, `ai`, `queues`, `workflows`, `durable_objects`, `services`, `vars`, `secrets`, `define`). → [DEPLOY](DEPLOY.md) (Environments)
27. `EMDASH_SITE_URL` = production URL in `env.production.vars`, before the prod admin setup. Never top level (dev keeps the address setup runs on).
28. GitHub environments `dev` and `production`: variables `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, `EMDASH_TARGET_FINGERPRINT`, plus the Cloudflare tokens. `production`: release tag pattern and `main` only, required reviewers. → [DEPLOY](DEPLOY.md) (CI, Migrations)
29. Prod secrets `EMDASH_ENCRYPTION_KEY`, `BETTER_AUTH_SECRET` before the first stage upload. → [DEPLOY](DEPLOY.md) (Secrets)
30. Dependabot automerge workflow and the CI workflows the template lacks: PR preview, dev deploy, stage upload on release tag, promotion; scheduled D1 export if the site has app data. → [DEPS](DEPS.md) (Update), [DEPLOY](DEPLOY.md) (CI)
31. First dev deploy: `npm run build`, `npx emdash migrate`, `wrangler d1 migrations apply <db> --remote --env=""` per app database, `wrangler deploy --env=""`. Then each push to `main` deploys dev. → [DEPLOY](DEPLOY.md) (Migrations, CI)
32. First release: push tag `<worker>-YYYY-MM-DD-r1`, approve the `production` job, test the stage URL, run the promotion workflow (traffic in steps). → [DEPLOY](DEPLOY.md) (Releases, CI)
33. Dev-bypass routes return `403` on prod. → [SECURITY](SECURITY.md) (Auth)

## Update

[update.mjs](https://github.com/arinhubcom/starweb/blob/main/scripts/update.mjs) uses `.starweb.json` and the kept Starweb clone.

1. `git -C <starweb> pull`.
2. `node <starweb>/scripts/update.mjs <project> --dry-run`; read the plan (changes nothing).
3. `node <starweb>/scripts/update.mjs <project>`: merges agent files, `rules/`, template files; updates unchanged `package.json` versions and scripts; `npm install`.
4. Resolve conflicts (markers `<<<<<<< project`, `||||||| base`, `>>>>>>> starweb`); set `commit` in `.starweb.json` to the commit the script prints.
5. `update.mjs` does not change starter files or generated files. If they are missing, add the footer link to `/privacy` in `src/layouts/Base.astro`, add `public/.well-known/security.txt` to `.gitignore`, and run `npx tsx scripts/theme.ts`.
6. `npm run check` and `npm run build` pass.
7. Commit.
