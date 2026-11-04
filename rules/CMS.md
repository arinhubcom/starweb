# CMS

## Content

### [EmDash](STACK.md#emdash)

- CMS. Start from the EmDash Cloudflare template (D1 + R2); no hand-port of the Node.js setup.
- `react()` before `emdash()` in `integrations` (admin UI hangs on "Loading EmDash..." otherwise). Public pages need no React.
- Content types in the admin UI (`/_emdash/admin`, stored in the database); `npx emdash types` after a schema change. No hand-written content types.
- `getEmDashCollection()`, `getEmDashEntry()` from `emdash`; always handle `error`.
- Pass `cacheHint` to route caching: `if (Astro.cache?.enabled) Astro.cache.set(cacheHint)`.
- Rich text = Portable Text (JSON), never HTML.
- Plugins: `definePlugin()`, minimal capabilities (`content:read`).
- Skills: `npx skills add emdash-cms/skills`.

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
- The 50 ms comes from EmDash `DEFAULT_LIMITS`, not from Worker Loader (default: Workers plan limits). `emdash()` has no option to change it.

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
- Free limits → [SAAS](SAAS.md#workers-free-plan).

### Cloudflare cost

Prices checked 2026-11-04, in USD, without tax. Paid minimum: $5 per month per account.

| Service | Free | Paid included per month | Paid extra |
| --- | --- | --- | --- |
| Worker requests | 100,000 per day | 10 million | $0.30 per million |
| Worker CPU | 10 ms per invocation | 30 million ms | $0.02 per million ms |
| Static asset requests | Free, unlimited | Free, unlimited | None |
| D1 rows read | 5 million per day | 25 billion | $0.001 per million |
| D1 rows written | 100,000 per day | 50 million | $1.00 per million |
| D1 storage | 5 GB total, 500 MB per database | 5 GB, 10 GB per database | $0.75 per GB-month |
| R2 Standard storage | 10 GB-month | 10 GB-month | $0.015 per GB-month |
| R2 Class A operations | 1 million | 1 million | $4.50 per million |
| R2 Class B operations | 10 million | 10 million | $0.36 per million |
| R2 egress | Free | Free | None |
| Workers KV reads | 100,000 per day | 10 million | $0.50 per million |
| Workers KV writes | 1,000 per day | 1 million | $5.00 per million |
| Queues operations | 10,000 per day | 1 million | $0.40 per million |
| Images transformations | 5,000 unique per month, then error `9422` | See Images pricing | See Images pricing |
| Workers Logs events | 200,000 per day | 20 million | $0.60 per million; new pricing from 2026-12-01 |
| Dynamic Workers created | None | 1,000 unique | $0.002 per Dynamic Worker per day |

Worker cost per month, with every request at the full 10 ms and no cache hits. D1, R2, and other services are extra.

| Requests per month | Requests | CPU | Total |
| --- | --- | --- | --- |
| Up to 100,000 per day | Free plan | Free plan | $0 |
| 10 million | Included | $1.40 | $6.40 |
| 30 million | $6.00 | $5.40 | $16.40 |
| 100 million | $27.00 | $19.40 | $51.40 |

- Total = $5 + requests + CPU.
- Check before a plan decision: [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/), [R2](https://developers.cloudflare.com/r2/pricing/), [Workers KV](https://developers.cloudflare.com/kv/platform/pricing/), [Queues](https://developers.cloudflare.com/queues/platform/pricing/), [Images](https://developers.cloudflare.com/images/pricing/).

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
- `npx emdash doctor` checks trigger and handler; read only its scheduler line on [D1](STACK.md#d1) (its database check looks for a local SQLite file: `database: not found at ./data.db`). `wrangler tail` shows `[scheduled] Published 1 scheduled item(s)`.
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
- `npx emdash migrate` from the release pipeline, after build, before the new version gets traffic. Remote D1 flags, target fingerprint, post-deploy check, migration lock → [DEPLOY](DEPLOY.md) (EmDash core migrations).

## WordPress import

### Migrate from WordPress

- Admin `/_emdash/admin/import/wordpress`; needs `import:execute`. Source: WXR file ("All content" export), EmDash Exporter migration key, or site URL (analysis only).
- Review analysis first: target collection and fields per post type; map WordPress authors to EmDash users (unmapped → guest byline).
- Media step after import (downloads attachments, stores in configured storage, rewrites URLs). Keep the WordPress site online until done.
- `publish` → `published`; every other status → `draft`. Scheduled dates are not rebuilt.
- Before removing or redirecting the WordPress site, check: counts by type and status, media, taxonomies, menus, SEO fields, old-URL redirects, drafts hidden from logged-out visitors.
