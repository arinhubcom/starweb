# OBSERVABILITY

This file covers logs, traces, errors, alerts, and health checks. Read it before you add logging, error reporting, or a monitor. For version metadata and release tags, see [DEPLOY](DEPLOY.md#version-metadata). For Sentry per tenant, see [SAAS](SAAS.md). See also [SECURITY](SECURITY.md) and [ARCH](ARCH.md).

## Write logs

### Workers Logs

- `env.production` inherits `observability`. Repeat it only for a different value. See [DEPLOY](DEPLOY.md#wrangler-config).
- Redeploy after you change `observability`.
- Set `head_sampling_rate` (0 to 1, default `1`) only for a high-traffic [Workers](STACK.md#workers) Worker.
- To set separate rates, use the same key under `observability.logs` and `observability.traces`.
- Workers Logs keep entries for 3 days on Free and 7 days on Paid. For longer, export them with [OpenTelemetry](STACK.md#opentelemetry).
- An entry larger than 256 KB is truncated.

### console

- Use only `console.debug`, `console.info`, `console.log`, `console.warn`, and `console.error`.
- Do not use `console.dir`, `console.time`, or `console.assert`. They do nothing in Workers.
- Log an object, for example `console.log({ event: "order.created", order_id })`.
- Do not build a log string by concatenation. Fields are indexed.
- For a caught error, call `console.error(error)`. Never swallow an error.
- Use `error` for a failure, `warn` for a recoverable problem, `info` for a normal event, and `debug` for detail.
- Never log secrets, tokens, passwords, session IDs, request bodies, or personal data such as emails.
- Log IDs instead, such as `user_id` and `tenant_id`.
- Add `env.CF_VERSION_METADATA.id` as `version` to each entry. See [DEPLOY](DEPLOY.md#version-metadata).

### Effect

- With [Effect](STACK.md#effect), log with `Effect.log`, `logDebug`, `logInfo`, `logWarning`, `logError`, and `logFatal`.
- Use the runtime layer `Logger.structured`, which turns an object into indexed fields.
- Do not use `Logger.json`. It writes one string.
- Add fields with `Effect.annotateLogs({ request_id, tenant_id })`, not in the message.
- Set the minimum level with the `Logger.minimumLogLevel(LogLevel.Info)` layer.
- Pass the `Cause` or the error, for example `Effect.logError("save failed", cause)`. Do not use `String(error)`.
- Time an operation with `Effect.withSpan("orders.create")`. Use stable names.

### Real-time logs

- To watch a release live, run `pnpm exec wrangler tail <worker>-production --format json`.
- Filter with `--status error`, `--search <text>`, or `--version-id <id>`. Query the output with `jq`.
- Do not use `wrangler tail` for storage. It stores nothing and drops messages under load.

## Add traces

- To trace fetch, bindings (D1, KV, R2), RPC, and handlers, set `"observability": { "traces": { "enabled": true, "head_sampling_rate": 0.05 } }`.
- Lower the rate for high traffic.
- Traces have 7 days of retention. They are billed from 2026-12-01.
- To export logs and traces to a third party, use OpenTelemetry export. Do not add an SDK to the Worker.

## Report errors with Sentry

### Cloudflare setup

- Use [Sentry](STACK.md#sentry) with the package `@sentry/cloudflare`.
- Use `compatibility_date` of `2026-08-04` or later, and do not set `nodejs_compat`. See [ARCH](ARCH.md).
- Read the DSN from `env` as the Worker secret or variable `SENTRY_DSN`. Run `wrangler types` after you add it.
- Do not hardcode a DSN for each environment. For production, see [DEPLOY](DEPLOY.md#set-secrets).
- Set `environment: env.SENTRY_ENVIRONMENT`.
- Set the variable `SENTRY_ENVIRONMENT` to `production` or `dev` for each Wrangler environment.
- Set `tracesSampleRate` below `1.0` in production.
- Do not measure span durations for CPU-only work. `Date.now()` and `performance.now()` advance only after I/O, so the result is `0ms`.

### Astro setup

- For [Astro](STACK.md#astro) on Cloudflare, use the packages `@sentry/astro` and `@sentry/cloudflare`.
- Use Astro 6 or newer and `@astrojs/cloudflare` 13 or newer.
- Keep `"main": "./src/worker.ts"`.
- Do not use `sentry.server.config.ts`.
- Do not use the `@astrojs/cloudflare/entrypoints/server` handler. It replaces the [EmDash](STACK.md#emdash) handler. See [ARCH](ARCH.md#run-background-work).
- In `src/worker.ts`, export `Sentry.withSentry((env) => ({ dsn: env.SENTRY_DSN, ... }), { ...handler, scheduled: createScheduledHandler() })`.
- Take `handler` from `@emdash-cms/cloudflare/worker`.
- `withSentry` wraps `fetch`, `scheduled`, `email`, `queue`, and `tail` of that object. Keep `queue()` in it.
- Export [Workflow](STACK.md#workflows) and [Durable Object](STACK.md#durable-objects) classes as separate named exports of `src/worker.ts`. `withSentry` does not wrap them.
- Wrap them with `Sentry.instrumentWorkflowWithSentry` or `instrumentDurableObjectWithSentry`.
- Add `sentry()` from `@sentry/astro` to `integrations`, next to the Cloudflare adapter.
- In `sentry.client.config.ts`, call `Sentry.init({ dsn: import.meta.env.PUBLIC_SENTRY_DSN })`.
- Put `PUBLIC_SENTRY_DSN` in `.env` for the build.
- Add the DSN host to the CSP `connect-src`, for example `https://o<orgId>.ingest.sentry.io`. See [SECURITY](SECURITY.md#change-the-csp).
- List Sentry as a processor. See [PRIVACY](PRIVACY.md).

### Data collection

- Set the server options `dataCollection: { userInfo: false, httpBodies: [] }`. The default sends IP, user fields, and bodies.
- Extend the denylist for identifying headers, cookies, and query params: `httpHeaders: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] }`.
- Send IDs only: `Sentry.setUser({ id: userId })` and `Sentry.setTag("tenant_id", tenantId)`.
- Never send emails or names.

### Releases

- Sentry takes the release from `release`, then `SENTRY_RELEASE`, then `CF_VERSION_METADATA.id`, in this order. See [DEPLOY](DEPLOY.md).
- Name the release like the release tag.
- In the tag workflow, pass `--var SENTRY_RELEASE:<worker>-YYYY-MM-DD-rN` to `wrangler versions upload`, using `${{ github.ref_name }}`.
- Use the same name in the SDK and the source map upload.
- Set `release: { name: process.env.SENTRY_RELEASE }` in the `sentry()` options.
- In the tag workflow build step, set the `SENTRY_RELEASE` env to the tag.

### Source maps

- Set `"upload_source_maps": true` in `wrangler.jsonc`. It uploads on `wrangler deploy` and `versions upload`.
- Set `vite: { build: { sourcemap: true } }` in `astro.config`.
- Never leave it unset. `sentry()` then sets `"hidden"`, the build writes no `sourceMappingURL` comment, and Wrangler uploads nothing without an error.
- After the build, check that `dist/server/entry.mjs` ends with `//# sourceMappingURL=entry.mjs.map`.
- Keep server maps in `dist/server` until the deploy or upload. Do not delete them in the build.
- Delete only client maps: `sourcemaps: { filesToDeleteAfterUpload: ["./dist/client/**/*.map"] }` in `sentry()`.
- Do not rely on the default, which is `./dist/**/client/**/*.map` and `./dist/**/server/**/*.map`.
- Set `org`, `project`, and `authToken: process.env.SENTRY_AUTH_TOKEN` in the `sentry()` options.
- Store `SENTRY_AUTH_TOKEN` as a GitHub Actions secret, or in `.env.sentry-build-plugin` locally. Never commit it.
- Without the token, the build skips the upload, still deletes client maps, and keeps `sourceMappingURL`. DevTools shows a missing-map warning.
- Set the token to get client stack traces.
- Check with a production build, not `wrangler dev`.

### Workers Issues

- Use Workers Issues as a second view only. It is in open beta.
- Enable it with `"observability": { "issues": { "enabled": true } }`. It needs Wrangler 4.134.0 or newer.

## Set up alerts

- In Sentry, open **Monitors > Alerts**. Alert on new issues and regressions, to one team channel.
- Filter by production environment and severity. Do not alert on every event.
- In Cloudflare, add a Custom Alert or a usage-based billing notification for platform limits. Send it to email, a webhook, or PagerDuty.

## Add a health check

### Astro endpoint

- Create `src/pages/health.ts` with a `GET` handler and `export const prerender = false`.
- Return `200` and JSON `{ status, version: env.CF_VERSION_METADATA.id }`.
- Bind `CF_VERSION_METADATA` again in `env.production`. See [DEPLOY](DEPLOY.md#wrangler-config).
- Do not return secrets, binding names, or error details.

### Sentry uptime monitoring

- Create an Uptime Monitor under **Monitors** for `https://<your-domain>/health`. A `2xx` response passes.
- Keep the failure tolerance at 3.
- Do not put API tokens in monitor headers.
