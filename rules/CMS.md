# CMS

## Content

### [EmDash](STACK.md#emdash)

- CMS. Start from the EmDash Cloudflare template (D1 + R2); no hand-port of the Node.js setup.
- `react()` before `emdash()` in `integrations` (admin UI hangs on "Loading EmDash..." otherwise). Public pages need no React.
- Content types in the admin UI (`/_emdash/admin`, stored in the database); `pnpm exec emdash types` after a schema change. No hand-written content types.
- `getEmDashCollection()`, `getEmDashEntry()` from `emdash`; always handle `error`.
- Pass `cacheHint` to route caching: `if (Astro.cache?.enabled) Astro.cache.set(cacheHint)`.
- Rich text = Portable Text (JSON), never HTML.
- Plugins: `definePlugin()`, minimal capabilities (`content:read`).
- Skills: `pnpm dlx skills add emdash-cms/skills`.

## Rendering

### Querying content

- `<PortableText value={post.data.content} />` from `emdash/ui`; no hand conversion to HTML.
- Public routes: published only; no `status: "draft"`.

## Plugins

### EmDash plugin CPU budget

- Plugins share the page's CPU budget: ≤ 10 ms per request in total. → [PERF](PERF.md#workers)
- Native plugin: runs in the Worker process, so its hooks, routes, and page rendering count toward the 10 ms of the request.
- Sandboxed plugin: target ≤ 10 ms per invocation. The Cloudflare runner's `cpuMs` default of 50 ms is the hard stop, not the target. → [SAAS](SAAS.md#emdash-plugins)
- Measure before each new plugin or plugin update: DevTools CPU profile under `wrangler dev`; in production, `$workers.cpuTimeMs` in Workers Logs. No `Date.now()` or `performance.now()`: timers advance only on I/O.
- Third-party plugin over budget → do not install it.
- Heavy work in a plugin → build time or a queue, not a hook on the request path.
- Sandboxed plugins: at most 4 distinct Dynamic Workers in flight per request; keep few plugins on one hook. Behavior of EmDash over this limit: not verified.
- Dynamic Workers also bill startup CPU (isolate start, code parsing): keep the plugin bundle small.
- The 50 ms is the default of the EmDash Cloudflare runner, not a Worker Loader limit (Worker Loader default: Workers plan limits). `emdash()` has no option to change it.

### Plugins on Workers Free and Paid

Own plugins work on Free, as native plugins or in the site process.

| Plugin setup | Free | Paid |
| --- | --- | --- |
| Own native plugin in `plugins: []` | Yes | Yes |
| Own sandboxed-format plugin in `plugins: []` (site process, no isolation or runner limits) | Yes | Yes |
| `sandboxed: []` with `sandboxRunner: sandbox()` (Dynamic Worker per plugin) | No: not loaded, startup warning | Yes, with `worker_loaders` binding `LOADER` |
| Registry install from the admin UI | No: needs a sandbox runner | Yes |
| CPU per HTTP request | 10 ms | 5 min, default 30 s |
| CPU per sandboxed call | No sandbox | 50 ms, 10 subrequests, 30 s wall time |

- Third-party plugin that needs isolation → Paid + `sandbox()`. No `sandbox: false` in production.
- Free limits → [SAAS](SAAS.md#workers-free-plan). Prices → [CLOUDFLARE](CLOUDFLARE.md#cost).

### [EmDash Field Kit](STACK.md#emdash-field-kit)

- `fieldKitPlugin()` in `emdash()` `plugins`. Widgets for `json` fields through field `options` in a seed file.

### [EmDash Forms](STACK.md#emdash-forms)

- `formsPlugin()` in `emdash()` `plugins`. For site forms that editors manage. App forms stay Astro Actions. → [ARCH](ARCH.md) (Astro)
- Render with `<Form id="<slug>" />` from `@emdash-cms/plugin-forms/ui`, or with the Portable Text block. A page with a form gets an entry in `page-js-limits.json`. → [PERF](PERF.md#client-javascript)
- No `defaultSpamProtection`: `createPlugin()` ignores it → `src/lib/forms/policy.ts`, called from `src/middleware.ts`.
- Check `POST`, `PUT`, `PATCH`, and `DELETE`: the plugin routes accept each of them.
- `forms/create` and `forms/update`: `400` unless `spamProtection` is `turnstile` and `retentionDays` is 1 to `FORM_RETENTION_DAYS` (365); `413` over `FORM_BODY_LIMIT_BYTES` (1 MiB). No body rewrite: `next(request)` does not send a new body to the route.
- `submit`: `FORMS_LIMITER` in `wrangler.jsonc`, 10 requests per 60 s per `CF-Connecting-IP`; `429` + `Retry-After`.
- Turnstile keys: admin plugin settings `turnstileSiteKey`, `turnstileSecretKey`. No keys → `submit` returns `500`. → [SECURITY](SECURITY.md) (Turnstile)
- Form webhook: empty, or an endpoint you own. The plugin does not sign it. → [SAAS](SAAS.md) (Outgoing webhooks)
- Notifications need an email provider. → [AUTH](AUTH.md)

## Drafts and preview

### Preview mode

- `getEmDashEntry()` for every lookup on a page that can show a draft (middleware checks signed `_preview` token; draft only for a valid token for that entry). 404 when `entry` is missing.
- `isPreview` from `getEmDashEntry()` → preview banner.
- Links: admin **View on site** or `getPreviewUrl()`. No hand-built or parsed tokens.
- Preview secret stays private (anyone with it can mint tokens). `EMDASH_PREVIEW_SECRET` only to share or pin; otherwise EmDash stores a generated one in the database.

### Content lifecycle

- Scheduled publish: editor **Schedule** action (`scheduledAt`).
- Do not assume publish purges cached pages (undocumented): test a published entry on a cached route; purge yourself if stale. → [PERF](PERF.md) (Cache)

### Scheduled publishing on [Workers](STACK.md#workers)

- `"triggers": { "crons": ["* * * * *"] }` in `wrangler.jsonc`.
- `src/worker.ts`: `export default { ...handler, scheduled: createScheduledHandler() }`; import `handler`, `createScheduledHandler`, `PluginBridge` from `@emdash-cms/cloudflare/worker`; export `PluginBridge`.
- `pnpm exec emdash doctor` checks trigger and handler; read only its scheduler line on [D1](STACK.md#d1) (its database check looks for a local SQLite file: `database: not found at ./data.db`). `wrangler tail` shows `[scheduled] Published 1 scheduled item(s)`.
- Preview deployments do not run Cron Triggers → scheduled entries do not publish there.

## Menus and taxonomies

### Navigation menus

- `getMenu(name, { locale })` from `emdash`, server-rendered; returns `null` when missing → handle. `items`: `label`, `url`, `target`, `titleAttr`, `cssClasses`, `children`.
- `rel="noopener noreferrer"` on `target="_blank"`; `aria-current="page"` on the active link.

### Taxonomies

- Create in admin **Taxonomies**; stable name = lowercase letters, numbers, underscores. Query by name, not label.
- `getTaxonomyTerms(name, { includeCounts: false })` when counts are unused; `getTerm(name, slug)` with the route param through `decodeSlug()`.
- Entries by term: `getEmDashCollection(collection, { where: { <taxonomy>: "<term-slug>" } })`. Entry terms: `entry.data.terms`.

## Migrations

### Core database migrations

- Production: `migrations: { runtime: "manual" }` in `emdash()` (no migrate on first request); `EMDASH_MIGRATIONS_MODE` overrides per environment. Release order → [DEPLOY](DEPLOY.md) (Migrations).
- `pnpm exec emdash migrate` from the release pipeline, after build, before the new version gets traffic. Remote D1 flags, target fingerprint, post-deploy check, migration lock → [DEPLOY](DEPLOY.md) (EmDash core migrations).

## WordPress import

### Migrate from WordPress

- Admin `/_emdash/admin/import/wordpress`; needs `import:execute`. Source: WXR file ("All content" export), EmDash Exporter migration key, or site URL (analysis only).
- Review analysis first: target collection and fields per post type; map WordPress authors to EmDash users (unmapped → guest byline).
- Media step after import (downloads attachments, stores in configured storage, rewrites URLs). Keep the WordPress site online until done.
- `publish` → `published`; every other status → `draft`. Scheduled dates are not rebuilt.
- Before removing or redirecting the WordPress site, check: counts by type and status, media, taxonomies, menus, SEO fields, old-URL redirects, drafts hidden from logged-out visitors.
