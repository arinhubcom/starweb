# CMS

## Content

### [EmDash](https://docs.emdashcms.com/)

- Use EmDash as the CMS. Start from the EmDash Cloudflare template (D1 for data, R2 for media). Do not port the Node.js setup by hand.
- Add `react()` before `emdash()` in the Astro `integrations` array. The EmDash admin UI is a React app and stays on "Loading EmDash..." without it. Public pages do not need React.
- Manage content types in the admin UI (`/_emdash/admin`): they live in the database. Run `npx emdash types` after a schema change. Do not write content types by hand.
- Query content with `getEmDashCollection()` and `getEmDashEntry()` from `emdash`. Always handle the returned `error`.
- Pass the returned `cacheHint` to route caching: `if (Astro.cache?.enabled) Astro.cache.set(cacheHint)`.
- Store rich text as Portable Text (JSON), not HTML. Do not store HTML.
- Write plugins with `definePlugin()`. Request only the capabilities the plugin needs, for example `content:read`.
- Install the EmDash agent skills with `npx skills add emdash-cms/skills`.

## Rendering

### [Querying content](https://docs.emdashcms.com/guides/querying-content/)

- Render Portable Text with `PortableText` from `emdash/ui`: `<PortableText value={post.data.content} />`. Do not convert it to HTML by hand.
- Query only published content on public routes. Do not pass `status: "draft"` there.

## Drafts and preview

### [Preview mode](https://docs.emdashcms.com/guides/preview/)

- Use `getEmDashEntry()` for every content lookup on a page that can show a draft. Middleware checks the signed `_preview` token, and the function returns the draft only for a valid token for that entry. Return a 404 when `entry` is missing.
- Use the `isPreview` flag that `getEmDashEntry()` returns to show a preview banner.
- Create preview links with the **View on site** action in the admin, or with `getPreviewUrl()` in server code. Do not build or parse tokens by hand.
- Keep the preview secret private: anyone who has it can make a preview token for any content. Set `EMDASH_PREVIEW_SECRET` only to share or pin the secret. Without it, EmDash stores a generated secret in the database.

### [Content lifecycle](https://docs.emdashcms.com/reference/content-lifecycle/)

- Use the **Schedule** action in the editor to publish at a later time. EmDash sets `scheduledAt` and publishes the entry when it is due.
- Do not rely on a scheduled publish to refresh a cached page. The EmDash docs do not say that publishing purges the cache. Test that a published entry shows on a cached route, and purge it yourself when it does not (see [PERF.md](PERF.md) (Cache)).

### [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)

- Add `"triggers": { "crons": ["* * * * *"] }` to `wrangler.jsonc` for scheduled publishing. On Workers, it needs a Cron Trigger.
- Export a `scheduled` handler from `src/worker.ts`: `export default { ...handler, scheduled: createScheduledHandler() }`. Import `handler`, `createScheduledHandler`, and `PluginBridge` from `@emdash-cms/cloudflare/worker`, and export `PluginBridge`.
- Run `npx emdash doctor` to check the trigger and the handler. Read only its scheduler line on D1: its database check looks for a local SQLite file and reports `database: not found at ./data.db`. Watch a run with `wrangler tail`: a publish logs `[scheduled] Published 1 scheduled item(s)`.
- Do not expect scheduled entries to publish on preview deployments: Cron Triggers do not run there.

## Menus and taxonomies

### [Navigation menus](https://docs.emdashcms.com/guides/menus/)

- Read a menu with `getMenu(name, { locale })` from `emdash` in server-rendered code. It returns `null` when the menu does not exist, so handle `null`. Its `items` have `label`, `url`, `target`, `titleAttr`, `cssClasses`, and `children`.
- Add `rel="noopener noreferrer"` to links with `target="_blank"`. Set `aria-current="page"` on the active link.

### [Taxonomies](https://docs.emdashcms.com/guides/taxonomies/)

- Create taxonomies in the admin under **Taxonomies**, with a stable name of lowercase letters, numbers, and underscores. Query by the stable name, not by the label.
- List terms with `getTaxonomyTerms(name, { includeCounts: false })` when you do not show counts. Get one term with `getTerm(name, slug)`, and decode the route param with `decodeSlug()` first.
- Get entries by term with `getEmDashCollection(collection, { where: { <taxonomy>: "<term-slug>" } })`. Read the terms of an entry from `entry.data.terms`.

## Migrations

### [Core database migrations](https://docs.emdashcms.com/deployment/core-migrations/)

- Set `migrations: { runtime: "manual" }` in `emdash()` for production, so the Worker does not migrate on its first request. `EMDASH_MIGRATIONS_MODE` overrides the mode for one environment. Follow [DEPLOY.md](DEPLOY.md) (Migrations) for the release order.
- Apply the migrations with `npx emdash migrate` from the release pipeline, after the build and before the new version gets traffic. Follow [DEPLOY.md](DEPLOY.md) (EmDash core migrations) for the flags of the remote D1 database, the target fingerprint, the check after the deploy, and the migration lock.

## WordPress import

### [Migrate from WordPress](https://docs.emdashcms.com/migration/from-wordpress/)

- Import WordPress content in the admin at `/_emdash/admin/import/wordpress`. You need the `import:execute` permission. Use a WXR file ("All content" export), an EmDash Exporter migration key, or the site URL for analysis only.
- Review the analysis before you start: confirm the target collection and fields for each post type, and map WordPress authors to EmDash users. Unmapped authors get a guest byline.
- Run the media step after the import. EmDash downloads the attachments, stores them in the configured storage, and rewrites the URLs. Keep the WordPress site online until it finishes.
- Expect `publish` to become `published` and every other status to become `draft`. Scheduled dates are not rebuilt.
- Do not remove or redirect the WordPress site until you check counts by type and status, media, taxonomies, menus, SEO fields, old-URL redirects, and that drafts stay hidden from logged-out visitors.
