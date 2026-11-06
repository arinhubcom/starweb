# SAAS

Read this file when you build a small SaaS: few tenants, little data per tenant, and no real-time collaboration. The site and the apps run in one Astro project, one Worker, and one domain.

## Set up the architecture

### Combine site, apps, and [EmDash](STACK.md#emdash)

- Run the site, the apps, and EmDash in one [Astro](STACK.md#astro) project and one Worker.
- Put each app in `src/apps/<app>/`, with its pages and API under its prefix (`/app1`, `/app1/api`). `src/pages/` is the site. See [ARCH](ARCH.md#add-a-micro-frontend-as-an-astro-integration).
- Do not add routes or files at `/_emdash/*`, `/sitemap.xml`, `/robots.txt`, or `/.well-known/oauth-protected-resource`. EmDash owns them.
- Use EmDash content only for editorial content: pages, posts, and docs. Keep app data in your own tables.
- Do not use EmDash internals (`handleContentCreate`, `emdash/internal/*`) in app code. Use the REST API, MCP, or plugin `ctx.content`.
- Use the `outer` middleware option to skip EmDash middleware on app routes that do not need it.
- Read bindings from `env` in `cloudflare:workers`.
- Export `queue`, `scheduled`, and [Durable Object](STACK.md#durable-objects) classes from `src/worker.ts`, next to the EmDash handler.
- Make custom cron expressions match `triggers.crons`.

## Add more than one app

### Use micro frontends

- Build one micro frontend per app in `src/apps/<app>/`, each with its own prefix (`/app1`, `/app2`). See [ARCH](ARCH.md#add-a-micro-frontend-as-an-astro-integration).
- Share one login and one set of organizations across all apps. See [AUTH](AUTH.md).
- Check app access (plan or membership) at the start of each app route. Do not rely on the path prefix alone. See [AUTH](AUTH.md#use-organizations).

### Give each app a [D1](STACK.md#d1) database

- Use one D1 database and one binding per app, such as `APP1_DB` and `APP2_DB`. Share no app tables.
- Count the databases first against the D1 limit per account of your plan. EmDash uses one.
- Set `migrations_dir` on each `d1_databases` entry: `migrations/app1`, `migrations/app2`.
- Apply migrations per database by name, not by binding: `wrangler d1 migrations apply app1-db --remote`. Use `--local` for development.

### Give each app a [Kysely](STACK.md#kysely) instance

- Create one Kysely instance per app database in `src/apps/app1/db/`, with its own `Database` interface. See [DATA](DATA.md).

## Authenticate

See [AUTH](AUTH.md).

## Store data

### Use D1 for app data

- Use a separate D1 database per app (`APP1_DB`). Put no app tables in the EmDash database.
- Read `APP1_DB` from `env` in `cloudflare:workers`, not from `locals.emdash.db`.
- Create app tables with D1 migrations. Make no manual schema changes.
- Query with Kysely. See [DATA](DATA.md).
- Run `emdash migrate` and the app migrations before each release. EmDash migrations are manual. See [DEPLOY](DEPLOY.md#migrate-the-databases).

### Separate tenants

- Keep all tenants in one app database.
- Add a `tenant_id` column to each tenant table.
- Start each index with `tenant_id`.
- Filter every query by `tenant_id` from the session. Never take it from the body or the URL.
- Do tenant filtering in one data-access module. Write no raw tenant queries in route handlers.
- Turn organizations on for any multi-tenant app.
- Set `tenant_id` to `session.activeOrganizationId` ([emdash-better-auth](STACK.md#emdash-better-auth)). See [AUTH](AUTH.md#use-organizations).
- Set `user_id` to `locals.user.id`.
- For API key requests, take `tenant_id` and `user_id` from the key row. See [API](API.md#issue-api-keys).
- Store `tenant_id` and `user_id` as plain text columns. Add no foreign keys or joins to EmDash tables.
- For a deleted user or organization, see [cleanup](#clean-up-deleted-users-and-organizations).

### Use Durable Objects

- Use a Durable Object only for real-time state (WebSockets, collaboration) or per-tenant locks. Never use it as the main database.
- Use the SQLite backend. It is the only one on Free.
- Use the [WebSocket Hibernation API](https://developers.cloudflare.com/durable-objects/best-practices/websockets/). Do not call `accept()`, because it bills the full connection duration.
- Prefer one larger RPC call over many small ones, because each stub call is a billed request.

## Add plugins

### Use EmDash plugins

- Use a native plugin for admin pages and dashboard widgets that manage the app.
- Do not add plugin API routes for customer traffic. Put them in `src/apps/<app>/api/`, under `/<app>/api/`.
- Use sandboxed plugins only on Paid.
- Keep each sandboxed call under 50 ms CPU, which is a hard stop. Aim for 10 ms or less. See [CMS](CMS.md#keep-to-the-cpu-budget).
- Make at most 10 subrequests in each sandboxed call.

## Add building blocks

These are not in the stack. Add them when the app needs them.

### Add an app admin as an EmDash native plugin

- Build the admin for app data as a native EmDash plugin with React admin pages in the app folder. Do not add a second admin panel. See [ARCH](ARCH.md#add-an-app-admin-as-an-emdash-native-plugin).
- Use [Kumo](STACK.md#kumo) (`@cloudflare/kumo`) components. Do not use Base UI wrappers or the site theme.
- List `@cloudflare/kumo`, `react`, and `react-dom` as plugin peer dependencies. Do not bundle a second copy.
- Use Kumo props for layout and style. Use Tailwind in `className` only for small gaps, such as `space-y-4` and `text-kumo-danger`.
- Verify Tailwind classes in the browser. Admin CSS is compiled before the plugin, so unused classes may have no styles.
- Use [TanStack](STACK.md#tanstack) Table for lists and Form for edit forms.
- Read data through the app repository modules. Do not query the app database directly from the plugin.
- Log each admin change (who, what, when) to an `audit_log` table in the app database.

### Clean up deleted users and organizations

- Run a daily Cron Trigger that deletes the app data of deleted users and organizations. EmDash has no documented delete hook.
- Set `deleted_at` first. Hard delete after a grace period, for example 30 days.
- For many rows, use a [Workflow](STACK.md#workflows) with one `step.do()` per batch. Never process all rows in one request.
- Offer a per-tenant data export (JSON or CSV) and a full delete. See [PRIVACY](PRIVACY.md).

### Enforce plan limits

- Keep plans and limits in one module, `src/lib/plans.ts`. Hardcode none in routes.
- Check count limits (projects, seats) on the server before each create, by counting rows in the app database.
- Use the Workers Rate Limiting binding (`ratelimits` in the Wrangler config) for API rate limits per tenant or API key.
- Send usage events (API calls, AI tokens) to Workers Analytics Engine. Do not write one D1 row per event.
- Use a Durable Object per tenant only for limits that must be exact in real time.

### Send email

See [EMAIL](EMAIL.md) and [React Email](STACK.md#react-email).

### Send outgoing webhooks with [Standard Webhooks](STACK.md#standard-webhooks)

- Sign webhooks with the spec, using the `standardwebhooks` package.
- Send from a [Queue](STACK.md#queues) consumer with retries.
- Store each delivery and its status in the app database.
- Use Svix when customers need a webhook portal.

### Store files in [R2](STACK.md#r2)

- Store tenant files under a `tenant_id/` key prefix.
- For large uploads, use presigned URLs from the browser, signed with `aws4fetch`. Do not stream them through the Worker.

### Search with D1 FTS5

- Put FTS5 tables in the app database.
- Include `tenant_id` in each FTS query.

### Add real time with [PartyServer](STACK.md#partyserver)

- Use PartyServer for live updates and presence.
- Name each room by `tenant_id` or document ID.

### Use feature flags with [Flagship](STACK.md#flagship)

- Use Flagship for feature flags and staged rollouts per tenant.
- Do not use code-constant flags that need a deploy.

### Track errors and logs with [Sentry](STACK.md#sentry)

- See [OBSERVABILITY](OBSERVABILITY.md).
- Set `tenant_id` and `user_id` on the Sentry scope.

### Translate the app with [Paraglide JS](STACK.md#paraglide-js)

- Use Paraglide JS for UI strings in app pages and islands.
- Use Astro i18n routing for URLs.
- For the site, see [I18N](I18N.md).

### Test the app

- See [TESTING](TESTING.md), including the tenant isolation test per repository module.

## Plan for limits

### Workers Free plan

- Over a free daily limit, requests fail with errors. The limits reset at 00:00 UTC.
- Move to Paid before you launch to paying customers. For prices, see [CLOUDFLARE](CLOUDFLARE.md#look-up-a-price).

## Bill customers

- See [PAYMENTS](PAYMENTS.md).
- Attach the subscription plan to the organization, not to the user.
- The `premium` content flag is per user. See [PAYMENTS](PAYMENTS.md#gate-premium-content).
- Check plan limits on the server before each create.
