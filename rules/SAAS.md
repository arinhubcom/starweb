# SAAS

These rules are for a small SaaS app: few tenants, little data per tenant, no real-time collaboration. The site and one or more apps run in one Astro project, on one Worker and one domain.

## Architecture

### [EmDash](https://docs.emdashcms.com/)

- Keep the site, the app, and EmDash in one Astro project and one Worker.
- Put each app in its own folder under `src/apps/`, with its pages and API routes under its path prefix, for example `/app1` and `/app1/api`. Keep `src/pages/` for the site. Follow the rules in [ARCH.md](ARCH.md) (Apps).
- Do not use paths under `/_emdash/`. Do not add `/sitemap.xml`, `/robots.txt`, or `/.well-known/oauth-protected-resource`. EmDash owns them.
- Use EmDash content only for editorial content (pages, posts, docs). Store app data in your own tables.
- Do not use EmDash internal handlers (`handleContentCreate`, `emdash/internal/*`) in app code. Use the REST API, MCP, or plugin `ctx.content` to write content.
- Use the `outer` middleware option to skip EmDash middleware on app routes that do not need it.
- Read Cloudflare bindings from `env` in `cloudflare:workers`.
- Add `queue`, `scheduled`, and Durable Object exports in `src/worker.ts`, next to the EmDash handler.
- Use `createScheduledHandler()` for the `scheduled` handler. Keep custom cron expressions in sync with `triggers.crons`.

## Multiple apps

### Micro frontends: [Astro integrations](https://docs.astro.build/en/reference/integrations-reference/)

- Build each app as a micro frontend in its own folder, for example `src/apps/app1/`, with its own path prefix, for example `/app1` and `/app2`. Follow the rules in [ARCH.md](ARCH.md) (Apps).
- Use the same login and organizations for all apps. Follow the rules in [AUTH.md](AUTH.md).
- Check app access (plan or membership) at the start of each app route. Do not rely on the path prefix alone. Follow the rules in [AUTH.md](AUTH.md) (Organizations).

### [D1](https://developers.cloudflare.com/d1/platform/limits/)

- Give each app its own D1 database and binding, for example `APP1_DB` and `APP2_DB`. Do not share app tables between apps. Create each database with `--jurisdiction=eu`, as in [PRIVACY.md](PRIVACY.md) (Data residency).
- Count databases before you add an app. The Workers Free plan allows 10 D1 databases per account, and EmDash uses one of them, so you can have up to 9 apps. The Workers Paid plan allows 50,000.

### [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)

- Set `migrations_dir` in each `d1_databases` entry of the Wrangler config, for example `migrations/app1` and `migrations/app2`.
- Apply migrations per database. Use the database name, not the binding name: `wrangler d1 migrations apply app1-db --remote`. Use `--local` for local dev.

### [Kysely](https://kysely.dev)

- Create one Kysely instance per app database in `src/apps/app1/db/`, each with its own `Database` interface. Follow the rules in [DATA.md](DATA.md).

## Auth

### [Auth](AUTH.md)

- Follow the rules in [AUTH.md](AUTH.md) for users, login, and organizations.

## Data

### [D1](https://developers.cloudflare.com/d1/)

- Create a separate D1 database for app data, one per app, for example `APP1_DB` (see Multiple apps). Do not put app tables in the EmDash database.
- Read the app binding (`APP1_DB`) from `env` in `cloudflare:workers`. Do not use `locals.emdash.db` for app data.
- Use D1 migrations for app tables (see Multiple apps). Do not change the schema by hand.
- Query app tables with Kysely (see [DATA.md](DATA.md)).
- Set EmDash migrations to manual mode. Run `emdash migrate` and the app migrations before each release. Follow the rules in [DEPLOY.md](DEPLOY.md) (Migrations).
- Use one app database for all tenants. Add a `tenant_id` column to each tenant table and an index that starts with `tenant_id`.
- Filter each query by `tenant_id` from the session. Do not read `tenant_id` from the request body or URL.
- Put tenant filtering in one data-access module. Do not write raw tenant queries in route handlers.
- Use `session.activeOrganizationId` from emdash-better-auth as `tenant_id`, and `locals.user.id` as `user_id`.
- Store `tenant_id` and `user_id` as plain text columns. Do not add foreign keys or joins to EmDash tables: users and organizations live in the EmDash database.
- Delete app data of a deleted user or organization in your own code, for example in a cron job.

### [Durable Objects](https://developers.cloudflare.com/durable-objects/)

- Use a Durable Object only for real-time state (WebSockets, collaboration) or per-tenant locks. Do not use it as the main database of a small app.
- Use the SQLite storage backend. The Workers Free plan supports only SQLite-backed Durable Objects.
- Use the [WebSocket Hibernation API](https://developers.cloudflare.com/durable-objects/best-practices/websockets/). Do not call `accept()` on a WebSocket, because it bills duration for the full connection time.
- Make one larger RPC call instead of many small calls. Each RPC call on a stub is a billed request.

## Plugins

### [EmDash plugins](https://docs.emdashcms.com/plugins/creating-plugins/)

- Use a native plugin for admin pages and dashboard widgets that manage the app.
- Do not use plugin API routes for customer traffic. Use Astro API routes in `src/pages`.
- Use sandboxed plugins only on the Workers Paid plan. Keep each call under 50 ms CPU and 10 subrequests.

## Building blocks

These parts are not in the stack. Add them when the app needs them.

### App admin: [EmDash native plugins](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/)

- Build the admin for app data as a native EmDash plugin with React admin pages, in the app folder. Follow the rules in [ARCH.md](ARCH.md) (App admin). Do not build a second admin panel.
- Build admin pages with [Kumo](https://github.com/cloudflare/kumo) components (`@cloudflare/kumo`), like the EmDash admin. Do not use your Base UI wrappers or the site theme in admin pages.
- Declare `@cloudflare/kumo`, `react`, and `react-dom` as peer dependencies of the plugin. The EmDash admin provides them. Do not bundle a second copy.
- Use Kumo props for layout and style where you can. Use Tailwind classes in `className` only for small layout gaps, as the EmDash docs examples do (`space-y-4`, `text-kumo-danger`). Check each class in the browser: the admin CSS is compiled before your plugin, so a class that the admin does not use can have no styles.
- Use [TanStack Table](https://tanstack.com/table) for lists and [TanStack Form](https://tanstack.com/form) for edit forms in admin pages.
- Read and write app data through the app repository modules. Do not query app databases from the plugin directly.
- Log each admin change to app data (who, what, when) in an `audit_log` table in the app database.

### Cleanup: [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)

- Delete app data of a deleted user or organization in a daily cron job. EmDash has no documented hook for user or organization delete.
- Mark rows as deleted first (`deleted_at`), then delete them for good after a grace period, for example 30 days.
- Run a cleanup with many rows as a [Workflow](https://developers.cloudflare.com/workflows/), one `step.do()` per batch. Do not delete all rows in one request.
- Give each tenant a data export (JSON or CSV) and a full delete, for GDPR.

### Plan limits: [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

- Define plans and their limits in one config module, for example `src/lib/plans.ts`. Do not hardcode limits in routes.
- Check count limits (projects, seats) on the server before each create action. Count rows in the app database.
- Use the Workers Rate Limiting binding (`ratelimits` in the Wrangler config) for API rate limits per tenant or API key.
- Write usage events (API calls, AI tokens) to [Workers Analytics Engine](https://developers.cloudflare.com/analytics/analytics-engine/) for metering. Do not write one D1 row per event.
- Use a Durable Object per tenant only when a usage limit must be exact in real time.

### Email: [React Email](https://react.email)

- Follow the rules in [EMAIL.md](EMAIL.md).

### Outgoing webhooks: [Standard Webhooks](https://www.standardwebhooks.com)

- Sign outgoing webhooks with the Standard Webhooks spec (`standardwebhooks` package).
- Send webhooks from a Queue consumer with retries. Store each delivery and its status in the app database.
- Use [Svix](https://www.svix.com) instead when customers need a webhook portal.

### Files: [R2](https://developers.cloudflare.com/r2/)

- Store tenant files in R2 under a `tenant_id/` key prefix.
- Upload large files from the browser with presigned URLs. Sign them with [aws4fetch](https://developers.cloudflare.com/r2/examples/aws/aws4fetch/). Do not stream large uploads through the Worker.

### Search: [D1 FTS5](https://developers.cloudflare.com/d1/sql-api/sql-statements/)

- Use SQLite FTS5 tables in the app database for full-text search. Add `tenant_id` to each FTS query.

### Real time: [PartyServer](https://github.com/cloudflare/partykit/tree/main/packages/partyserver)

- Use PartyServer (on Durable Objects) for live updates and presence. Name each room by `tenant_id` or document ID.

### Feature flags: [Cloudflare Flagship](https://developers.cloudflare.com/flagship/)

- Use Flagship for feature flags and staged rollouts per tenant. Do not add flags as code constants that need a deploy.

### Errors and logs: [Sentry for Cloudflare](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)

- Follow the rules in [OBSERVABILITY.md](OBSERVABILITY.md) for Workers Logs and Sentry. Add `tenant_id` and `user_id` to the Sentry scope.

### App i18n: [Paraglide JS](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)

- Use Paraglide JS for UI strings in app pages and islands. Use Astro i18n routing for the URLs. For the site, follow the rules in [I18N.md](I18N.md).

### Tests

- Follow the rules in [TESTING.md](TESTING.md), including the tenant isolation test for each repository module.

## Limits

### [Workers Free plan](https://developers.cloudflare.com/durable-objects/platform/pricing/)

- Expect errors when you go over a free daily limit. Limits reset at 00:00 UTC.
- Move to the Workers Paid plan before you launch to paying customers.

## Billing

### [Payments](PAYMENTS.md)

- Follow the rules in [PAYMENTS.md](PAYMENTS.md).
- Store the subscription plan per organization, not per user.
- Check plan limits (for example, number of projects) on the server before each create action.
