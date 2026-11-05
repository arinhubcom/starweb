# SAAS

Small SaaS: few tenants, little data per tenant, no real-time collaboration. Site and apps in one Astro project, one Worker, one domain.

## Architecture

### [EmDash](STACK.md#emdash)

- Site, apps, EmDash: one [Astro](STACK.md#astro) project, one Worker.
- App in `src/apps/<app>/`, pages and API under its prefix (`/app1`, `/app1/api`); `src/pages/` is the site. → [ARCH](ARCH.md) (Apps)
- Never use `/_emdash/*`, `/sitemap.xml`, `/robots.txt`, `/.well-known/oauth-protected-resource` (EmDash owns them).
- EmDash content only for editorial content (pages, posts, docs); app data in own tables.
- No EmDash internals (`handleContentCreate`, `emdash/internal/*`) in app code → REST API, MCP, or plugin `ctx.content`.
- `outer` middleware option skips EmDash middleware on app routes that do not need it.
- Bindings from `env` in `cloudflare:workers`.
- `queue`, `scheduled`, [Durable Object](STACK.md#durable-objects) exports in `src/worker.ts` next to the EmDash handler.
- `createScheduledHandler()` for `scheduled`; custom cron expressions match `triggers.crons`.

## Multiple apps

### Micro frontends

- One micro frontend per app in `src/apps/<app>/`, own prefix (`/app1`, `/app2`). → [ARCH](ARCH.md) (Apps)
- Same login and organizations for all apps. → [AUTH](AUTH.md)
- Check app access (plan or membership) at the start of each app route; not the path prefix alone. → [AUTH](AUTH.md) (Organizations)

### [D1](STACK.md#d1)

- One D1 database and binding per app (`APP1_DB`, `APP2_DB`); no shared app tables.
- Count databases first against the D1 limit per account of your plan; EmDash uses 1.
- `migrations_dir` per `d1_databases` entry (`migrations/app1`, `migrations/app2`).
- Apply per database by name, not binding: `wrangler d1 migrations apply app1-db --remote` (`--local` for dev).

### [Kysely](STACK.md#kysely)

- One Kysely instance per app database in `src/apps/app1/db/`, own `Database` interface. → [DATA](DATA.md)

## Auth

- → [AUTH](AUTH.md)

## Data

### D1

- Separate D1 database per app (`APP1_DB`); no app tables in the EmDash database.
- Read `APP1_DB` from `env` in `cloudflare:workers`; not `locals.emdash.db`.
- D1 migrations for app tables, no manual schema changes. Kysely for queries. → [DATA](DATA.md)
- EmDash migrations manual: run `emdash migrate` and app migrations before each release. → [DEPLOY](DEPLOY.md) (Migrations)
- One app database for all tenants: `tenant_id` column on each tenant table, index starting with `tenant_id`.
- Filter every query by `tenant_id` from the session; never from body or URL.
- Tenant filtering in one data-access module; no raw tenant queries in route handlers.
- Organizations on for any multi-tenant app: `tenant_id` = `session.activeOrganizationId` ([emdash-better-auth](STACK.md#emdash-better-auth)), `user_id` = `locals.user.id`. → [AUTH](AUTH.md) (Organizations)
- API key requests: `tenant_id` and `user_id` from the key row. → [API](API.md) (API keys)
- `tenant_id`, `user_id` as plain text columns; no foreign keys or joins to EmDash tables.
- Deleted user or organization → Cleanup.

### Durable Objects

- Only for real-time state (WebSockets, collaboration) or per-tenant locks; not the main database.
- SQLite backend (the only one on Free).
- [WebSocket Hibernation API](https://developers.cloudflare.com/durable-objects/best-practices/websockets/); no `accept()` (bills full connection duration).
- One larger RPC call over many small (each stub call is a billed request).

## Plugins

### EmDash plugins

- Native plugin for admin pages and dashboard widgets that manage the app.
- No plugin API routes for customer traffic → `src/apps/<app>/api/`, under `/<app>/api/`.
- Sandboxed plugins only on Paid; each call < 50 ms CPU (hard stop; target ≤ 10 ms → [CMS](CMS.md#plugins)), ≤ 10 subrequests.

## Building blocks

Not in the stack; add when the app needs them.

### App admin: EmDash native plugins

- Admin for app data = native EmDash plugin with React admin pages in the app folder; no second admin panel. → [ARCH](ARCH.md) (App admin)
- [Kumo](STACK.md#kumo) (`@cloudflare/kumo`) components; no Base UI wrappers, no site theme.
- `@cloudflare/kumo`, `react`, `react-dom` as plugin peer dependencies; no second bundled copy.
- Kumo props for layout/style; Tailwind in `className` only for small gaps (`space-y-4`, `text-kumo-danger`). Verify in the browser: admin CSS is compiled before the plugin, unused classes may have no styles.
- [TanStack](STACK.md#tanstack) Table for lists, Form for edit forms.
- Data through app repository modules; no direct app database queries from the plugin.
- Log each admin change (who, what, when) to an `audit_log` table in the app database.

### Cleanup: Cron Triggers

- Daily cron deletes app data of deleted users/organizations (EmDash has no documented delete hook).
- `deleted_at` first, hard delete after a grace period (for example 30 days).
- Many rows → [Workflow](STACK.md#workflows), one `step.do()` per batch; never all rows in one request.
- Per-tenant data export (JSON or CSV) and full delete. → [PRIVACY](PRIVACY.md)

### Plan limits: Rate Limiting binding

- Plans and limits in one module (`src/lib/plans.ts`); none hardcoded in routes.
- Count limits (projects, seats) checked on the server before each create, counting app database rows.
- Workers Rate Limiting binding (`ratelimits` in Wrangler config) for API rate limits per tenant or API key.
- Usage events (API calls, AI tokens) → Workers Analytics Engine; not one D1 row per event.
- Durable Object per tenant only for limits that must be exact in real time.

### Email

- → [EMAIL](EMAIL.md) ([React Email](STACK.md#react-email))

### Outgoing webhooks: [Standard Webhooks](STACK.md#standard-webhooks)

- Sign with the spec (`standardwebhooks` package).
- Send from a [Queue](STACK.md#queues) consumer with retries; store each delivery and status in the app database.
- Svix when customers need a webhook portal.

### Files: [R2](STACK.md#r2)

- Tenant files under a `tenant_id/` key prefix.
- Large uploads: presigned URLs from the browser, signed with `aws4fetch`; not streamed through the Worker.

### Search: D1 FTS5

- FTS5 tables in the app database; `tenant_id` in each FTS query.

### Real time: [PartyServer](STACK.md#partyserver)

- Live updates and presence; room named by `tenant_id` or document ID.

### Feature flags: [Flagship](STACK.md#flagship)

- Feature flags and staged rollouts per tenant; no code-constant flags that need a deploy.

### Errors and logs: [Sentry](STACK.md#sentry)

- → [OBSERVABILITY](OBSERVABILITY.md). `tenant_id` and `user_id` on the Sentry scope.

### App i18n: [Paraglide JS](STACK.md#paraglide-js)

- UI strings in app pages and islands; Astro i18n routing for URLs. Site → [I18N](I18N.md).

### Tests

- → [TESTING](TESTING.md), incl. the tenant isolation test per repository module.

## Limits

### Workers Free plan

- Over a free daily limit → errors; reset 00:00 UTC.
- Move to Paid before launching to paying customers. Prices → [CLOUDFLARE](CLOUDFLARE.md#cost).

## Billing

- → [PAYMENTS](PAYMENTS.md)
- Subscription plan per organization, not per user. `premium` content flag is per user. → [PAYMENTS](PAYMENTS.md) (Premium content)
- Plan limits checked on the server before each create.
