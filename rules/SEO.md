# SEO

This file covers search engine optimization of the public site: site URL, page head, crawling, structured data, errors, and redirects. Read it before you add a public page.

- For `hreflang`, see [I18N](I18N.md).
- For images and social preview images, see [MEDIA](MEDIA.md).
- For speed, see [PERF](PERF.md).
- For EmDash content, see [CMS](CMS.md).

## Set the site URL

- Set the same origin for [EmDash](STACK.md#emdash): **Settings > General > Site URL**, `siteUrl` in `emdash()`, or `EMDASH_SITE_URL`.
- EmDash builds the sitemap, `robots.txt`, and JSON-LD URLs from it. The [Astro](STACK.md#astro) `site` alone leaves `localhost` there.
- Check that `/robots.txt` and the `WebSite` JSON-LD show the public origin.
- Build absolute URLs with `new URL(path, Astro.site)`. Never use `Astro.url.origin`.
- Never set `trailingSlash: 'ignore'`.
- Check prerendered pages on the deployed Worker, because the host may ignore `trailingSlash`.
- Do not fix it with Astro `redirects`. They do not support it.

## Write the page head

### Set the title, description, and canonical

- Follow [Google Search Central](STACK.md#google-search-central).
- Give each page a unique, specific, short `<title>`. Do not use "Home".
- Put the site name after a separator, at the end or the start: `Pricing | Starweb`.
- Use the full tagline on the home page only.
- Use one `<h1>` that matches the title.
- Give each page a unique `<meta name="description">` of 160 characters or fewer.
- For many similar sibling pages, generate the description from page data such as `excerpt`.
- Put exactly one absolute `<link rel="canonical">` on every indexable page, also a self-canonical.
- Use the same URL in `rel="canonical"`, `og:url`, and the sitemap.
- Check the rendered HTML of one sample page for each template.

### Use EmDash SEO

- Add `"seo"` to `supports` of each routable collection, or turn on **SEO** in **Content Types**.
- The SEO panel has title, description, image, canonical, and **Hide from search engines**.
- `<EmDashHead>` renders description, robots, canonical, Open Graph, and Twitter Card.
- On a content page, pass `content: { collection, id, slug }`. Take the title and canonical from `getSeoMeta()`.
- A custom page uses the `Base.astro` default, which is built from the pathname.
- A page that is not indexable passes `canonical={null}`.
- `<EmDashHead>` emits no `hreflang` on a custom page. See [I18N](I18N.md#add-hreflang-links).
- Skip `<EmDashHead>` only on private pages and app routes. Add `<meta name="robots" content="noindex">` there.
- On a page with `<EmDashHead>`, do not write your own description, canonical, or Open Graph tags.
- Change them with the SEO panel, the page context, or the plugin `page:metadata` hook.
- Set the title separator and the default social image in **Settings > SEO**.
- Pass `settings.seo?.titleSeparator` to `getSeoMeta()` as `titleSeparator`.

### Add Open Graph tags

- With `<EmDashHead>`, do not write your own tags. Follow [Open Graph](STACK.md#open-graph).
- Verify `og:type`, `og:title`, `og:description`, `og:image`, `og:site_name`, and `og:url`.
- Fill gaps in the SEO panel, in **Settings > SEO**, or in the page context.
- On a shared page without `<EmDashHead>`, add `<meta property>` tags: `og:title`, `og:type`, `og:image`, `og:url`, `og:description`, and `og:site_name`.
- Set `og:url` to the canonical URL.
- Add `og:image:alt` with `og:image`.
- Build the image URL as `new URL('/images/preview.png', Astro.site)`.

## Configure crawling

### Add sitemaps

- Use the EmDash `/sitemap.xml` for CMS content: published, routable, SEO-enabled, and not hidden. Do not add your own `/sitemap.xml`.
- For prerendered non-CMS pages, use [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) `sitemap()`. It writes `/sitemap-index.xml` and `/sitemap-0.xml`.
- In on-demand mode, `sitemap()` has no dynamic routes.
- Use `filter` to drop private and app pages, such as `!page.includes('/app')`, and add `noindex` to them.
- Add `<link rel="sitemap" href="/sitemap-index.xml" />` in the `<head>` of the base layout.

### Configure robots.txt

- Use the EmDash `/robots.txt` only. Do not add `public/robots.txt` or `src/pages/robots.txt.ts`.
- The default allows all and disallows `/_emdash/`.
- To change it, edit **Settings > SEO > robots.txt** with the full text.
- Write one `Sitemap:` line for each sitemap: `/sitemap.xml`, plus `/sitemap-index.xml` with `@astrojs/sitemap`. EmDash adds its own line only if none exists.
- Do not use `Disallow` to deindex a page. Use a `noindex` meta tag or `X-Robots-Tag: noindex`, and keep the page crawlable.
- Do not put `noindex` in `robots.txt`.

## Add structured data

- Use [Schema.org](STACK.md#schemaorg) JSON-LD only. Do not use Microdata or RDFa.
- `<EmDashHead>` renders `BlogPosting` and the `WebSite` graph. Change them with the plugin `page:metadata` hook.
- For other types such as `Organization`, `BreadcrumbList`, and `Product`, use `<script type="application/ld+json" set:html={JSON.stringify(data)} />`.
- Make `data` a typed object.
- Include all required properties, as Search Central lists them.
- Prefer fewer, complete recommended properties over many incomplete ones.

## Handle errors and redirects

### Return 404

- Return a real `404` status, never `200` (a soft 404).
- For a dynamic page without an entry, `return Astro.rewrite("/404")`.
- For custom markup in on-demand mode, set `Astro.response.status = 404`.

### Return 410

- Return `410` for deliberately removed content. Return `404` for content that never existed.
- For CMS paths, use an EmDash **Redirects** rule, or mark the path from the **404 Errors** tab. Do not write your own handler.
- For other on-demand pages, set `Astro.response.status = 410` and show a "removed" page. Astro `redirects` cannot do this.

### Redirect moved URLs

- Use a permanent `301` or `308` for moved URLs.
- Use `302` or `307` only if the old URL returns.
- For a fixed redirect, use `redirects` in `astro.config`. The default is `301` for GET.
- For a temporary fixed redirect, use `{ status: 302, destination }`.
- For a request-dependent redirect, use `Astro.redirect(path, 301)`. The default is `302`.
- Call `Astro.redirect()` in the page, not in a child component.
- For static assets such as old PDFs, use `public/_redirects`.
- For CMS paths, use the EmDash **Redirects** page, which adds a `301` on a slug change. Do not add a config redirect for them.

## Add llms.txt

- Create `src/pages/llms.txt.ts` that exports `GET` and returns a `Response`. See [llms.txt](STACK.md#llmstxt).
- Take the site URL from `site` in the endpoint context.
- Start with an H1 that holds the site name. It is required.
- Add a blockquote with a summary.
- Add H2 sections with `- [Name](url): note` lists.
- Put secondary links under an H2 named `Optional`.
