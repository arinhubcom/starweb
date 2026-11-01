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
