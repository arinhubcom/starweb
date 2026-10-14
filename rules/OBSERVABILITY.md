# OBSERVABILITY

Related files: [DEPLOY.md](DEPLOY.md) (version metadata and release tags), [SAAS.md](SAAS.md) (Sentry per tenant), [SECURITY.md](SECURITY.md), [ARCH.md](ARCH.md).

## Logs

### [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)

- Set `"observability": { "enabled": true }` in `wrangler.jsonc`, and repeat it in `env.production`. Redeploy after you change it.
- Set `head_sampling_rate` (0 to 1) in `observability` only for a high-traffic Worker. The default is `1` (all requests). Use the same key under `observability.logs` and `observability.traces` for separate rates.
- Do not rely on Workers Logs for history: retention is 3 days on the Workers Free plan and 7 days on the Workers Paid plan. Export logs for longer retention (see OpenTelemetry export).
- Keep each log entry under 256 KB. Larger entries are truncated.

### [console](https://developers.cloudflare.com/workers/runtime-apis/console/)

- Use only `console.debug()`, `console.info()`, `console.log()`, `console.warn()`, and `console.error()`. Do not use `console.dir()`, `console.time()`, or `console.assert()`: they do nothing in Workers.
- Pass an object to `console.log()`, for example `console.log({ event: "order.created", order_id })`. Do not build a string such as `console.log("order " + id)`. Workers Logs indexes the object fields, so you can filter by them.
- Use `console.error(error)` for a caught error that you handle. Do not swallow it.
- Use `console.error()` for failures, `console.warn()` for a recoverable problem, `console.info()` for normal events, and `console.debug()` for detail you need only when you debug.
- Do not log secrets, tokens, passwords, session IDs, full request bodies, or personal data such as emails. Log IDs, for example `user_id` and `tenant_id`.
- Add `env.CF_VERSION_METADATA.id` as `version` to each log entry. Follow the rules in [DEPLOY.md](DEPLOY.md) (Version metadata).

### [Real-time logs](https://developers.cloudflare.com/workers/observability/logs/real-time-logs/)

- Use `npx wrangler tail <worker>-production --format json` to watch live logs after a release. Use `--status error`, `--search <text>`, or `--version-id <id>` to filter.
- Pipe `wrangler tail --format json` to `jq` to query fields, for example `npx wrangler tail <worker>-production --format json | jq .event.request.url`.
- Do not use `wrangler tail` to store logs. It stores nothing and can drop messages under high traffic.

## Effect

### [Effect logging](https://effect.website/docs/observability/logging/)

- Log from Effect code with `Effect.log`, `Effect.logDebug`, `Effect.logInfo`, `Effect.logWarning`, `Effect.logError`, and `Effect.logFatal`.
- Provide the `Logger.structured` layer to the runtime of the Worker. It calls `console.log` with an object, so Workers Logs indexes the fields. Do not use `Logger.json`: it logs one JSON string.
- Add fields with `Effect.annotateLogs({ request_id, tenant_id })`. Do not put them in the message text.
- Set the minimum level with the `Logger.minimumLogLevel(LogLevel.Info)` layer. `Effect.logDebug` is hidden by default.
- Pass a `Cause` or an error to the log call, for example `Effect.logError("save failed", cause)`. Do not log only `String(error)`.

### [Effect tracing](https://effect.website/docs/observability/tracing/)

- Wrap an operation in `Effect.withSpan("name")` to time it. Use a name that is stable, such as `orders.create`.

## Traces

### [Workers traces](https://developers.cloudflare.com/workers/observability/traces/)

- Set `"observability": { "traces": { "enabled": true, "head_sampling_rate": 0.05 } }` to trace fetch calls, binding calls (D1, KV, R2), RPC, and handlers without code changes.
- Lower `traces.head_sampling_rate` for a high-traffic Worker. Stored traces have 7 days of retention and count toward Cloudflare Observability pricing from 2026-12-01.

### [OpenTelemetry export](https://developers.cloudflare.com/workers/observability/opentelemetry-export/)

- Use OpenTelemetry export to send logs and traces to a third-party destination. Do not add an SDK to the Worker for it.

## Errors

### [Sentry for Cloudflare](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)

- Use `@sentry/cloudflare` for error tracking in Workers.
- Set a `compatibility_date` of `2026-08-04` or later in `wrangler.jsonc`, as in [ARCH.md](ARCH.md). Do not add the `nodejs_compat` flag.
- Store the DSN as a Worker secret or var named `SENTRY_DSN` and read it from `env`. Do not hardcode it for each environment. For production, set it as in [DEPLOY.md](DEPLOY.md) (Secrets).
- Set `environment: env.SENTRY_ENVIRONMENT` in the options, and set the var `SENTRY_ENVIRONMENT` to `production` or `dev` in each Wrangler environment, so Sentry separates the events.
- Set `tracesSampleRate` below `1.0` in production. Do not send 100% of traces from a high-traffic Worker.
- Do not use span durations to measure CPU-only work. `Date.now()` and `performance.now()` advance only after I/O in Workers, so such spans show `0ms`.

### [Sentry for Astro on Cloudflare](https://docs.sentry.io/platforms/javascript/guides/cloudflare/frameworks/astro/)

- Install both `@sentry/astro` and `@sentry/cloudflare`. The `@sentry/astro` guide does not support Cloudflare Workers on its own. Use Astro 6 or later and `@astrojs/cloudflare` v13 or later.
- Keep `"main": "./src/worker.ts"` in `wrangler.jsonc`. Do not point `main` at `sentry.server.config.ts` or use the handler from `@astrojs/cloudflare/entrypoints/server`: the Sentry guide shows that setup, but it replaces the EmDash handler (see [ARCH.md](ARCH.md) (Background work)).
- Wrap the handler object in `src/worker.ts`: `export default Sentry.withSentry((env) => ({ dsn: env.SENTRY_DSN, ... }), { ...handler, scheduled: createScheduledHandler() })`, with `handler` from `@emdash-cms/cloudflare/worker`. `withSentry` instruments `fetch`, `scheduled`, `email`, `queue`, and `tail` on the object you pass, so keep `queue()` in that object.
- Keep Workflow and Durable Object classes as separate named exports of `src/worker.ts`. `withSentry` does not wrap them. Instrument each class with `Sentry.instrumentWorkflowWithSentry` or `Sentry.instrumentDurableObjectWithSentry` when you want its errors in Sentry.
- Add `sentry()` from `@sentry/astro` to `integrations` in `astro.config`, next to the Cloudflare adapter.
- Create `sentry.client.config.ts` for the browser SDK, and call `Sentry.init({ dsn })` in it.
- Add the host of the DSN, for example `https://o<orgId>.ingest.sentry.io`, to `connect-src` in the CSP module (see [SECURITY.md](SECURITY.md) (Headers)). Without it the browser blocks the events.
- List Sentry as a processor in the privacy policy (see [PRIVACY.md](PRIVACY.md)).

### [Sentry data collection](https://docs.sentry.io/platforms/javascript/guides/cloudflare/configuration/options/#dataCollection)

- Set `dataCollection` in the server options: `{ userInfo: false, httpBodies: [] }`. The default sends the IP address, user fields, and request bodies.
- Extend the denylist for headers, cookies, and query parameters that identify a user, for example `httpHeaders: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] }`.
- Set only IDs with `Sentry.setUser({ id: userId })` and `Sentry.setTag("tenant_id", tenantId)`. Do not send emails or names.

### [Sentry releases](https://docs.sentry.io/platforms/javascript/guides/cloudflare/sourcemaps/uploading/wrangler/)

- Add the `version_metadata` binding `CF_VERSION_METADATA` (see [DEPLOY.md](DEPLOY.md)). When no `release` is set, the SDK uses `SENTRY_RELEASE` first, then `CF_VERSION_METADATA.id`.
- To name the release after the release tag, pass `--var SENTRY_RELEASE:<worker>-YYYY-MM-DD-rN` to `wrangler versions upload` in the tag workflow, for example `--var SENTRY_RELEASE:${{ github.ref_name }}`.
- Use the same release name in the SDK and in the source map upload. Sentry needs the names to match. Set `release: { name: process.env.SENTRY_RELEASE }` in the `sentry()` options of `astro.config`, and set the `SENTRY_RELEASE` environment variable to the release tag in the build step of the tag workflow.

### [Source maps](https://developers.cloudflare.com/workers/observability/source-maps/)

- Set `"upload_source_maps": true` in `wrangler.jsonc`. Wrangler then uploads the maps on `wrangler deploy` and `wrangler versions upload`.
- Set `vite: { build: { sourcemap: true } }` in `astro.config`, so the build writes server and client maps with `//# sourceMappingURL=` comments. Wrangler finds the server maps by those comments. Do not leave `sourcemap` unset: `sentry()` then sets `"hidden"`, which writes no comment, and Wrangler uploads no map.
- Keep the server maps in `dist/server` until `wrangler deploy` or `wrangler versions upload` runs. Do not delete them in the build.
- Delete only the client maps, because `dist/client` is the public assets directory. Set `sourcemaps: { filesToDeleteAfterUpload: ["./dist/client/**/*.map"] }` in the `sentry()` options. Do not rely on the default: when `sourcemap` is unset, `sentry()` deletes `./dist/**/client/**/*.map` and `./dist/**/server/**/*.map`.

### [Sentry source maps](https://docs.sentry.io/platforms/javascript/guides/cloudflare/sourcemaps/)

- Set `org`, `project`, and `authToken: process.env.SENTRY_AUTH_TOKEN` in the `sentry()` options of `astro.config`, so the build uploads the maps to Sentry.
- Store `SENTRY_AUTH_TOKEN` as a GitHub Actions secret for the build, or in `.env.sentry-build-plugin` locally. Do not commit it.
- Check Sentry source maps with a production build, not with `wrangler dev`.

### [Workers Issues](https://developers.cloudflare.com/workers/observability/issues/)

- Use Workers Issues only as a second view, while it is in open beta. Enable it with `"observability": { "issues": { "enabled": true } }` and Wrangler 4.134.0 or later.

## Alerts

### [Sentry alerts](https://docs.sentry.io/product/alerts/)

- Create an alert from **Monitors > Alerts** for new issues and for issues that come back. Send it to one team channel.
- Add filters for the production environment and for severity. Do not alert on every event.

### [Cloudflare Notifications](https://developers.cloudflare.com/notifications/notification-available/)

- Create a Custom Alert or a usage-based billing notification in Cloudflare Notifications for platform limits. Send it to an email address, a webhook, or PagerDuty.

## Health checks

### [Astro endpoints](https://docs.astro.build/en/guides/endpoints/)

- Add a health endpoint in `src/pages/health.ts` that exports `GET` and `export const prerender = false`. Return status `200` and JSON with `status` and `version: env.CF_VERSION_METADATA.id`. Bind `CF_VERSION_METADATA` again in `env.production`: bindings are not inherited (see [DEPLOY.md](DEPLOY.md) (Environments)).
- Do not return secrets, binding names, or error details in the health response.

### [Sentry uptime monitoring](https://docs.sentry.io/product/uptime-monitoring/)

- Create an Uptime Monitor for `https://<your-domain>/health` from the **Monitors** page. A check passes on a `2xx` response.
- Keep the default failure tolerance of 3 consecutive failures. Do not put API tokens in the monitor headers.
