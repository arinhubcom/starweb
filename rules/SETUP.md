# SETUP

Set up a new Starweb project with these steps, in order. Later steps depend on earlier ones. Each step links to the rules for its topic. Steps 1 to 3 create the project from the tested [template](https://github.com/arinhubcom/starweb/tree/main/template) and the script [setup.mjs](https://github.com/arinhubcom/starweb/blob/main/scripts/setup.mjs). The other steps are manual.

## Project

### [create-emdash](https://github.com/emdash-cms/emdash/tree/main/packages/create-emdash)

1. Check that `node --version` is 22.16.0 or later.
2. Create the project from the EmDash Cloudflare starter template at the pinned version: read the version in `devDependencies` of `template/package.json` in the [Starweb repository](https://github.com/arinhubcom/starweb), then run `npm create emdash@<version> my-site -- --template cloudflare:starter --install --yes`. Replace `my-site` with the project name. Add `--sandboxed-plugins` only when the site uses sandboxed plugins: it needs a Workers paid plan. Do not use the `node` platform. Follow the rules in [CMS.md](CMS.md).

### [setup.mjs](https://github.com/arinhubcom/starweb/blob/main/scripts/setup.mjs)

3. Run `node <starweb>/scripts/setup.mjs my-site --name <name> --site <url>`, where `<starweb>` is your clone of the Starweb repository. Keep the clone in a folder outside the project (for example `~/starweb`), not in a temporary folder: the script reads it, and `update.mjs` needs it later (see Update). The script writes `.starweb.json` with the clone commit, the name, and the site. Commit this file with the project. It renames `AGENTS.md` to `EMDASH.md`, deletes `pnpm-workspace.yaml`, copies the agent files and `rules/` ([DEPS.md](DEPS.md)), copies the config, security, test, CI, and Dependabot files of `template/files/` ([QUALITY.md](QUALITY.md), [SECURITY.md](SECURITY.md), [TESTING.md](TESTING.md), [DEPLOY.md](DEPLOY.md), [DEPS.md](DEPS.md)), patches the starter files and the Tailwind, Zod, and Effect setup ([ARCH.md](ARCH.md), [DESIGN.md](DESIGN.md), [UI-UX.md](UI-UX.md)), pins the package versions, deletes the starter lockfile and runs `npm install`, runs `npx wrangler types` and `prettier`, and runs `git init`. Stop and report when it prints `Starter changed`.

## Cloudflare

### [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

4. Log in to Cloudflare with `npx wrangler login`.
5. Create the D1 database with a location hint, set `database_id` in `wrangler.jsonc`, and set the Targeted Placement region. Follow the rules in [PERF.md](PERF.md) (Placement) and [SAAS.md](SAAS.md) (Architecture).
6. Remove the Cron Trigger and the `scheduled` handler in `src/worker.ts` if the site does not publish on a schedule. Follow the rules in [CMS.md](CMS.md) (Drafts and preview).
7. Add the Queue producers and consumers, a dead letter queue, and the `queue()` export in `src/worker.ts`, if the site uses Queues. Follow the rules in [ARCH.md](ARCH.md) (Backend).

## Astro

### [Astro i18n](https://docs.astro.build/en/guides/internationalization/)

8. Add Astro i18n routing, the Paraglide plugin, and the `isPrerendered` branch in `src/middleware.ts` with `sequence()`, if the site is multilingual. Follow the rules in [I18N.md](I18N.md) and [SECURITY.md](SECURITY.md) (CSRF).

## UI

### [Fulldev UI](https://ui.full.dev)

9. Set up Fulldev UI with `npx shadcn@<version> init https://ui.full.dev/r/styles/base-vega/base.json`, where `<version>` is `shadcn` in `devDependencies` of `template/package.json`. The init adds `shadcn` to the project. Then install `@base-ui/react` and `lucide-react`. Add the Knip exceptions for Fulldev. Follow the rules in [COMPONENTS.md](COMPONENTS.md) and [QUALITY.md](QUALITY.md) (Unused code).
10. Generate `src/styles/theme.css` from the brand seed color with `npx tsx scripts/theme.ts`, and import it in `src/styles/global.css`. Follow the rules in [MATERIAL.md](MATERIAL.md) (Color).

## Auth

### [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth)

11. Add emdash-better-auth, an email provider, and `BETTER_AUTH_SECRET` in `.env`, if the site has user login. Follow the rules in [AUTH.md](AUTH.md) and [DEPS.md](DEPS.md) (Install).

## Apps and payments

### [SaaS](SAAS.md)

12. Create `src/apps/<app>/` with its pages, API routes, and `db/` folder, and its own D1 database and migrations folder, if the site has an app. Follow the rules in [SAAS.md](SAAS.md) (Multiple apps) and [ARCH.md](ARCH.md) (Apps).
13. Add `src/apps/<app>/db/seed.sql` and a `db:seed` npm script, if the app has a database. Follow the rules in [DATA.md](DATA.md) (Seed data).
14. Add `scripts/openapi.ts` and the route `src/apps/app1/api/openapi.ts`, injected in `integration.ts` with `injectRoute({ pattern: "/app1/api/openapi.json", ... })`, if the app has an API. Follow the rules in [API.md](API.md) (Contract).
15. Add a table with a unique constraint for processed webhook event IDs, if the site sells with Creem. Follow the rules in [PAYMENTS.md](PAYMENTS.md) (EU sales).

## Observability

### [Sentry](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)

16. Install `@sentry/astro` and `@sentry/cloudflare`, wrap the handler in `src/worker.ts` with `Sentry.withSentry`, add `.env.sentry-build-plugin` to `.gitignore`, and add the Sentry sources to the CSP module, if the site uses Sentry. Set `vite: { build: { sourcemap: true } }` and delete only `./dist/client/**/*.map` after the upload. Follow the rules in [OBSERVABILITY.md](OBSERVABILITY.md) (Errors, Source maps) and [SECURITY.md](SECURITY.md) (Headers).

## Tests

### [Storybook](https://storybook.js.org/docs)

17. Install Storybook with Storybook Astro by hand, and create `.storybook/main.ts`, if the site has a component library. Follow the rules in [TESTING.md](TESTING.md) (Components).

### [Playwright](https://playwright.dev/docs/intro)

18. Install Playwright and `@axe-core/playwright`, run `npx playwright install chromium`, and create `playwright.config.ts` with the `webServer` option for `astro preview`, if the site has end-to-end tests. Follow the rules in [TESTING.md](TESTING.md) (Screenshots, End-to-end tests, Accessibility).

## Agent skills

### [skills CLI](https://github.com/vercel-labs/skills)

19. Install the agent skills that [CMS.md](CMS.md) and [COMPONENTS.md](COMPONENTS.md) list.

## Checks

### [Astro](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

20. Start the dev server with `npm run dev`. Open `http://localhost:4321/_emdash/admin/` and complete the setup wizard. Follow the rules in [DEV.md](DEV.md).
21. Run `npm run check`, `npm run build`, and `npm run preview`. All three must pass before the first commit. Follow the rules in [QUALITY.md](QUALITY.md) (Order) and [DEV.md](DEV.md).
22. Run `npx emdash doctor` and read only its scheduler line: its database check looks for a local SQLite file, not D1. Follow the rules in [CMS.md](CMS.md) (Drafts and preview).
23. Commit the project.

## Deploy

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

24. Back up `EMDASH_ENCRYPTION_KEY` from `.env` in a password manager. Do not commit `.env`: EmDash cannot decrypt plugin secrets without the key.
25. Add the `env.production` block to `wrangler.jsonc` with its own D1 database, R2 bucket, `routes`, and `"preview_urls": true`. Repeat each non-inheritable key that the site uses: `d1_databases`, `r2_buckets`, `kv_namespaces`, `version_metadata`, `images`, `ratelimits`, `queues`, `workflows`, `durable_objects`, `services`, `vars`, `secrets`, and `define`. Follow the rules in [DEPLOY.md](DEPLOY.md) (Environments).
26. Set `EMDASH_SITE_URL` to the production URL in `env.production.vars` before you complete the admin setup on prod. Do not set it at the top level: without it, dev and local dev keep the address that the setup runs on.
27. Create the GitHub environments `dev` and `production` with the variables `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID`, and `EMDASH_TARGET_FINGERPRINT`, and the Cloudflare tokens. Limit `production` to the release tag pattern and `main`, and add required reviewers. Follow the rules in [DEPLOY.md](DEPLOY.md) (CI, Migrations).
28. Set the production secrets (`EMDASH_ENCRYPTION_KEY` and `BETTER_AUTH_SECRET`) before the first stage upload. Follow the rules in [DEPLOY.md](DEPLOY.md) (Secrets).
29. Add the Dependabot automerge workflow, and the CI workflows that the template does not have: PR preview, dev deploy, stage upload on a release tag, and promotion. Add the scheduled D1 export if the site has app data. Follow the rules in [DEPS.md](DEPS.md) (Update) and [DEPLOY.md](DEPLOY.md) (CI).
30. Do the first dev deploy: run `npm run build`, `npx emdash migrate`, `wrangler d1 migrations apply <db> --remote --env=""` for each app database, then `wrangler deploy --env=""`. After this, each push to `main` deploys dev. Follow the rules in [DEPLOY.md](DEPLOY.md) (Migrations, CI).
31. Do the first release: push the tag `<worker>-YYYY-MM-DD-r1`, approve the `production` job, test the stage URL, then run the promotion workflow to raise traffic in steps. Follow the rules in [DEPLOY.md](DEPLOY.md) (Releases, CI).
32. Check that the dev-bypass routes return `403` on prod. Follow the rules in [SECURITY.md](SECURITY.md) (Auth).

## Update

Bring the Starweb changes into an existing project with [update.mjs](https://github.com/arinhubcom/starweb/blob/main/scripts/update.mjs). It uses `.starweb.json` and the Starweb clone that you kept.

1. Run `git -C <starweb> pull`.
2. Run `node <starweb>/scripts/update.mjs <project> --dry-run` and read the plan. It changes nothing.
3. Run `node <starweb>/scripts/update.mjs <project>` without `--dry-run`. It merges the agent files, `rules/`, and the template files, updates the unchanged `package.json` versions and scripts, and runs `npm install`.
4. Resolve each conflict: the file has the markers `<<<<<<< project`, `||||||| base`, and `>>>>>>> starweb`. Then set `commit` in `.starweb.json` to the commit that the script prints.
5. Run `npm run check` and `npm run build`. Both must pass.
6. Commit the project.
