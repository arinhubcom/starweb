# CMS

This file covers how to work with content, plugins, previews, menus, migrations, and imports in [EmDash](STACK.md#emdash). Read it before you add a content type, a page that reads content, or a plugin.

## Define a content type

- Create content types in the admin UI (`/_emdash/admin`). EmDash stores them in the database.
- Do not write content types by hand.
- After a schema change, run `pnpm exec emdash types`.
- To add EmDash skills, run `pnpm dlx skills add emdash-cms/skills`.

## Read content in a page

- Use `getEmDashCollection()` and `getEmDashEntry()` from `emdash`.
- Always handle `error` from these calls.
- Pass `cacheHint` to route caching: `if (Astro.cache?.enabled) Astro.cache.set(cacheHint)`.
- Public routes show published content only. Do not use `status: "draft"`.

## Render rich text

- Rich text is Portable Text (JSON), never HTML.
- Render it with `<PortableText value={post.data.content} />` from `emdash/ui`.
- Do not convert Portable Text to HTML by hand.

## Add a menu or a taxonomy

### Navigation menus

- Use `getMenu(name, { locale })` from `emdash`, and render it on the server.
- `getMenu()` returns `null` when the menu is missing. Handle that case.
- Each item has `label`, `url`, `target`, `titleAttr`, `cssClasses`, and `children`.
- Add `rel="noopener noreferrer"` to a link with `target="_blank"`.
- Add `aria-current="page"` to the active link.

### Taxonomies

- Create a taxonomy in the admin **Taxonomies** page.
- Give it a stable name of lowercase letters, numbers, and underscores. Query by name, not by label.
- Use `getTaxonomyTerms(name, { includeCounts: false })` when you do not use the counts.
- Use `getTerm(name, slug)`, and pass the route parameter through `decodeSlug()`.
- To get the entries of a term, use `getEmDashCollection(collection, { where: { <taxonomy>: "<term-slug>" } })`.
- Read the terms of an entry from `entry.data.terms`.

## Show a draft in preview

- On a page that can show a draft, use `getEmDashEntry()` for every lookup.
- The middleware checks the signed `_preview` token. It shows the draft only for a valid token for that entry.
- Return a 404 when `entry` is missing.
- Show a preview banner when `isPreview` from `getEmDashEntry()` is true.
- Link to a preview with the admin **View on site** action or with `getPreviewUrl()`.
- Do not build or parse preview tokens by hand.
- Keep the preview secret private. Anyone who has it can mint tokens.
- Set `EMDASH_PREVIEW_SECRET` only to share or pin the secret. Otherwise EmDash stores a generated secret in the database.

## Publish on a schedule

- To schedule a publish, use the editor **Schedule** action (`scheduledAt`).
- Do not assume that a publish purges cached pages. This is undocumented.
- Test a published entry on a cached route, and purge the cache yourself if the page is stale. See [PERF](PERF.md#use-astro-route-caching).

### Check scheduled publishing on [Workers](STACK.md#workers)

- Run `pnpm exec emdash doctor`. It checks the trigger and the handler.
- On [D1](STACK.md#d1), read only the scheduler line. The database check looks for a local SQLite file and prints `database: not found at ./data.db`.
- Run `wrangler tail`. It shows `[scheduled] Published 1 scheduled item(s)` after a publish.
- Preview deployments do not run Cron Triggers, so scheduled entries do not publish there.

## Add a plugin

### Keep to the CPU budget

- Plugins share the CPU budget of the page: at most 10 ms per request in total. See [PERF](PERF.md#budget-workers-cpu).
- A native plugin runs in the Worker process. Its hooks, routes, and page rendering count toward the 10 ms of the request.
- For a sandboxed plugin, aim for at most 10 ms per invocation.
- The 50 ms `cpuMs` default of the Cloudflare runner is the hard stop, not the target. See [SAAS](SAAS.md#use-emdash-plugins).
- Measure before each new plugin and each plugin update. Use a DevTools CPU profile under `wrangler dev`.
- In production, measure with `pnpm run worker-cpu <worker>` or with `$workers.cpuTimeMs` in Workers Logs.
- Do not measure with `Date.now()` or `performance.now()`. Timers advance only on I/O.
- If a third-party plugin goes over the budget, do not install it.
- Do heavy work in a plugin at build time or in a queue, not in a hook on the request path.
- Run at most 4 distinct Dynamic Workers in flight per request.
- Keep few plugins on one hook.
- What EmDash does over the limit of 4 is not verified.
- Dynamic Workers also bill startup CPU (isolate start and code parsing). Keep the plugin bundle small.
- The 50 ms is the default of the EmDash Cloudflare runner, not a Worker Loader limit. The Worker Loader default is the Workers plan limits.
- `emdash()` has no option to change the 50 ms.

### Write a plugin

- Define a plugin with `definePlugin()`.
- Request the minimum capabilities, such as `content:read`.

### Choose a plugin setup for your plan

Own plugins work on Workers Free, as native plugins or in the site process.

| Plugin setup | Free | Paid |
| --- | --- | --- |
| Own native plugin in `plugins: []` | Yes | Yes |
| Own sandboxed-format plugin in `plugins: []` (site process, no isolation or runner limits) | Yes | Yes |
| `sandboxed: []` with `sandboxRunner: sandbox()` (Dynamic Worker per plugin) | No: not loaded, startup warning | Yes, with `worker_loaders` binding `LOADER` |
| Registry install from the admin UI | No: needs a sandbox runner | Yes |
| CPU per HTTP request | 10 ms | 5 min, default 30 s |
| CPU per sandboxed call | No sandbox | 50 ms, 10 subrequests, 30 s wall time |

- A third-party plugin that needs isolation needs the Paid plan and `sandbox()`.
- Do not use `sandbox: false` in production.
- For the Free limits, see [SAAS](SAAS.md#workers-free-plan). For prices, see [CLOUDFLARE](CLOUDFLARE.md#look-up-a-price).

### Add [EmDash Field Kit](STACK.md#emdash-field-kit)

- Add widgets for `json` fields through field `options` in a seed file.

### Add [EmDash Forms](STACK.md#emdash-forms)

- Use EmDash Forms for site forms that editors manage. App forms stay Astro Actions. See [ARCH](ARCH.md#build-pages-with-astro).
- Render a form with `<Form id="<slug>" />` from `@emdash-cms/plugin-forms/ui`, or with the Portable Text block.
- Add an entry to `page-js-limits.json` for a page with a form. See [PERF](PERF.md#set-a-size-limit).
- Do not set `defaultSpamProtection`. `createPlugin()` ignores it.
- Do not rewrite the body in the forms policy. `next(request)` does not send a new body to the route.
- Set the Turnstile keys in the admin plugin settings `turnstileSiteKey` and `turnstileSecretKey`. See [SECURITY](SECURITY.md#add-turnstile).
- Without the keys, `submit` returns `500`.
- Leave the form webhook empty, or set it to an endpoint you own. The plugin does not sign it. See [SAAS](SAAS.md#send-outgoing-webhooks-with-standard-webhooks).
- Notifications need an email provider. See [AUTH](AUTH.md).

## Run migrations

- In production, set `EMDASH_MIGRATIONS_MODE` to `manual` in `env.production.vars`. EmDash then does not migrate on the first request.
- Do not set `migrations: { runtime: "manual" }` in `emdash()`. See [WHY](../WHY.md#why-the-migration-mode-is-a-production-variable).
- Run `pnpm exec emdash migrate` from the release pipeline, after the build and before the new version gets traffic.
- For the release order, see [DEPLOY](DEPLOY.md#migrate-the-databases).
- For the remote D1 flags, the target fingerprint, the post-deploy check, and the migration lock, see [DEPLOY](DEPLOY.md#emdash-core-migrations).

## Import from WordPress

- Open `/_emdash/admin/import/wordpress`. You need the `import:execute` permission.
- Use one of these sources: a WXR file ("All content" export), an EmDash Exporter migration key, or the site URL (analysis only).
- Review the analysis first: the target collection and fields for each post type.
- Map WordPress authors to EmDash users. An unmapped author becomes a guest byline.
- Run the media step after the import. It downloads attachments, stores them in the configured storage, and rewrites the URLs.
- Keep the WordPress site online until the media step is done.
- The status `publish` becomes `published`. Every other status becomes `draft`. EmDash does not rebuild scheduled dates.
- Before you remove or redirect the WordPress site, check these items:
  - Counts by type and status.
  - Media.
  - Taxonomies.
  - Menus.
  - SEO fields.
  - Redirects from old URLs.
  - Drafts that are hidden from logged-out visitors.
