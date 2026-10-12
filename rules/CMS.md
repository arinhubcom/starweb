# CMS

## Content

### [EmDash](https://docs.emdashcms.com/)

- Use EmDash as the CMS. Start from the EmDash Cloudflare template (D1 for data, R2 for media). Do not port the Node.js setup by hand.
- Add `react()` before `emdash()` in the Astro `integrations` array. The EmDash admin UI is a React app and stays on "Loading EmDash..." without it. Public pages do not need React.
- Content types live in the database and are managed in the admin UI (`/_emdash/admin`). Run `npx emdash types` after a schema change. Do not write content types by hand.
- Query content with `getEmDashCollection()` and `getEmDashEntry()` from `emdash`. Always handle the returned `error`.
- Pass the returned `cacheHint` to route caching: `if (Astro.cache?.enabled) Astro.cache.set(cacheHint)`.
- Rich text is stored as Portable Text (JSON), not HTML. Do not store HTML.
- Write plugins with `definePlugin()`. Request only the capabilities the plugin needs, for example `content:read`.
- Install the EmDash agent skills with `npx skills add emdash-cms/skills`.
