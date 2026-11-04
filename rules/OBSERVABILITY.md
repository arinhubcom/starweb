# OBSERVABILITY

→ [DEPLOY](DEPLOY.md) (version metadata, release tags), [SAAS](SAAS.md) (Sentry per tenant), [SECURITY](SECURITY.md), [ARCH](ARCH.md).

## Logs

### [Workers](STACK.md#workers) Logs

- `"observability": { "enabled": true }` in `wrangler.jsonc`; `env.production` inherits it, repeat only for a different value. → [DEPLOY](DEPLOY.md) (Environments). Redeploy after a change.
- `head_sampling_rate` (0-1, default `1`) only for a high-traffic Worker; same key under `observability.logs` and `observability.traces` for separate rates.
- Retention 3 days (Free) / 7 days (Paid): export for longer ([OpenTelemetry](STACK.md#opentelemetry) export).
- Entry ≤ 256 KB (truncated above).

### console

- Only `console.debug/info/log/warn/error`. No `console.dir/time/assert` (no-ops in Workers).
- Log an object: `console.log({ event: "order.created", order_id })`. No string concatenation (fields are indexed).
- Caught error → `console.error(error)`; never swallow.
- Levels: `error` failure, `warn` recoverable, `info` normal event, `debug` detail.
- No secrets, tokens, passwords, session IDs, request bodies, personal data (emails). Log IDs (`user_id`, `tenant_id`).
- Add `env.CF_VERSION_METADATA.id` as `version` to each entry. → [DEPLOY](DEPLOY.md) (Version metadata)

### Real-time logs

- Live view after a release: `pnpm exec wrangler tail <worker>-production --format json`; filter `--status error`, `--search <text>`, `--version-id <id>`; query with `jq`.
- No `wrangler tail` for storage (stores nothing, drops messages under load).

## [Effect](STACK.md#effect)

- Log with `Effect.log`, `logDebug`, `logInfo`, `logWarning`, `logError`, `logFatal`.
- Runtime layer `Logger.structured` (object → indexed fields). No `Logger.json` (one string).
- Fields via `Effect.annotateLogs({ request_id, tenant_id })`, not in the message.
- Min level: `Logger.minimumLogLevel(LogLevel.Info)` layer.
- Pass the `Cause` or error: `Effect.logError("save failed", cause)`, not `String(error)`.
- `Effect.withSpan("orders.create")` to time an operation; stable names.

## Traces

### Workers traces

- `"observability": { "traces": { "enabled": true, "head_sampling_rate": 0.05 } }` traces fetch, bindings (D1, KV, R2), RPC, handlers.
- Lower the rate for high traffic. 7 days retention; billed from 2026-12-01.

### OpenTelemetry export

- Export logs and traces to a third party with OpenTelemetry export. No SDK in the Worker.

## Errors

### [Sentry](STACK.md#sentry) for Cloudflare

- `@sentry/cloudflare`.
- `compatibility_date` ≥ `2026-08-04`, no `nodejs_compat`. → [ARCH](ARCH.md)
- DSN: Worker secret/var `SENTRY_DSN` read from `env`; `wrangler types` after adding. No hardcoded DSN per environment. Production → [DEPLOY](DEPLOY.md) (Secrets).
- `environment: env.SENTRY_ENVIRONMENT`; var `SENTRY_ENVIRONMENT` = `production` or `dev` per Wrangler environment.
- `tracesSampleRate` < `1.0` in production.
- No span durations for CPU-only work (`Date.now()`/`performance.now()` advance only after I/O → `0ms`).

### Sentry for [Astro](STACK.md#astro) on Cloudflare

- Packages `@sentry/astro`, `@sentry/cloudflare`. Astro ≥ 6, `@astrojs/cloudflare` ≥ 13.
- Keep `"main": "./src/worker.ts"`. Not `sentry.server.config.ts`, not the `@astrojs/cloudflare/entrypoints/server` handler (replaces the [EmDash](STACK.md#emdash) handler). → [ARCH](ARCH.md) (Background work)
- `src/worker.ts`: `export default Sentry.withSentry((env) => ({ dsn: env.SENTRY_DSN, ... }), { ...handler, scheduled: createScheduledHandler() })`, `handler` from `@emdash-cms/cloudflare/worker`. Wraps `fetch`, `scheduled`, `email`, `queue`, `tail` of that object; keep `queue()` in it.
- [Workflow](STACK.md#workflows) and [Durable Object](STACK.md#durable-objects) classes: separate named exports of `src/worker.ts`, not wrapped → `Sentry.instrumentWorkflowWithSentry` / `instrumentDurableObjectWithSentry`.
- `sentry()` from `@sentry/astro` in `integrations`, next to the Cloudflare adapter.
- `sentry.client.config.ts`: `Sentry.init({ dsn: import.meta.env.PUBLIC_SENTRY_DSN })`; `PUBLIC_SENTRY_DSN` in `.env` for the build.
- CSP `connect-src` gets the DSN host (`https://o<orgId>.ingest.sentry.io`). → [SECURITY](SECURITY.md) (Headers)
- List Sentry as processor. → [PRIVACY](PRIVACY.md)

### Sentry data collection

- Server options `dataCollection: { userInfo: false, httpBodies: [] }` (default sends IP, user fields, bodies).
- Extend denylist for identifying headers, cookies, query params: `httpHeaders: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] }`.
- IDs only: `Sentry.setUser({ id: userId })`, `Sentry.setTag("tenant_id", tenantId)`. No emails, names.

### Sentry releases

- `version_metadata` binding `CF_VERSION_METADATA`. → [DEPLOY](DEPLOY.md) Release fallback order: `release`, `SENTRY_RELEASE`, `CF_VERSION_METADATA.id`.
- Release name = release tag: `--var SENTRY_RELEASE:<worker>-YYYY-MM-DD-rN` on `wrangler versions upload` in the tag workflow (`${{ github.ref_name }}`).
- Same name in SDK and source map upload: `release: { name: process.env.SENTRY_RELEASE }` in `sentry()` options; `SENTRY_RELEASE` env = tag in the tag workflow build step.

### Source maps

- `"upload_source_maps": true` in `wrangler.jsonc` (uploads on `wrangler deploy` and `versions upload`).
- `vite: { build: { sourcemap: true } }` in `astro.config`. Never leave unset: `sentry()` sets `"hidden"`, no `sourceMappingURL` comment, Wrangler uploads nothing, no error. After build, `dist/server/entry.mjs` ends with `//# sourceMappingURL=entry.mjs.map`.
- Keep server maps in `dist/server` until deploy/upload; do not delete in the build.
- Delete only client maps: `sourcemaps: { filesToDeleteAfterUpload: ["./dist/client/**/*.map"] }` in `sentry()`. Do not rely on the default (`./dist/**/client/**/*.map` and `./dist/**/server/**/*.map`).

### Sentry source maps

- `org`, `project`, `authToken: process.env.SENTRY_AUTH_TOKEN` in `sentry()` options.
- `SENTRY_AUTH_TOKEN`: GitHub Actions secret, or `.env.sentry-build-plugin` locally. Never commit.
- Build without it: upload skipped, client maps still deleted, `sourceMappingURL` stays → DevTools missing-map warning. Set it for client stack traces.
- Check with a production build, not `wrangler dev`.

### Workers Issues

- Second view only (open beta): `"observability": { "issues": { "enabled": true } }`, Wrangler ≥ 4.134.0.

## Alerts

### Sentry alerts

- **Monitors > Alerts**: new issues and regressions, one team channel. Filter production environment and severity; not every event.

### Cloudflare Notifications

- Custom Alert or usage-based billing notification for platform limits → email, webhook, or PagerDuty.

## Health checks

### Astro endpoints

- `src/pages/health.ts`: `GET`, `export const prerender = false`; `200` + JSON `{ status, version: env.CF_VERSION_METADATA.id }`. Bind `CF_VERSION_METADATA` again in `env.production`. → [DEPLOY](DEPLOY.md) (Environments)
- No secrets, binding names, or error details in the response.

### Sentry uptime monitoring

- Uptime Monitor (**Monitors**) for `https://<your-domain>/health`; `2xx` passes.
- Keep failure tolerance 3. No API tokens in monitor headers.
