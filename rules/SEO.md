# SEO

Rules for search engine optimization of the public site. For `hreflang` and translated pages, follow [I18N.md](I18N.md). For images and social preview images, follow [MEDIA.md](MEDIA.md). For speed, follow [PERF.md](PERF.md). For EmDash content, follow [CMS.md](CMS.md).

## Site URL

### [Astro site and canonical URLs](https://docs.astro.build/en/reference/configuration-reference/#site)

- Set `site` in `astro.config` to the final public URL, for example `https://example.com`. Include the scheme. Astro uses it for `Astro.site`, the sitemap, and canonical URLs.
- Set the same origin for EmDash: **Settings > General > Site URL** in the admin, or `siteUrl` in the `emdash()` options, or `EMDASH_SITE_URL`. EmDash builds the sitemap, `robots.txt`, and JSON-LD URLs from it.
- Check that `/robots.txt` and the `WebSite` JSON-LD show the public origin, not `localhost`. They do when only the Astro `site` is set, so set the EmDash Site URL too.
- Build absolute URLs with `new URL(path, Astro.site)`. Do not build them from `Astro.url.origin`: it is a `localhost` URL in dev and can be an internal address behind a proxy.

### [Trailing slash](https://docs.astro.build/en/reference/configuration-reference/#trailingslash)

- Set `trailingSlash` in `astro.config` to `'always'` or `'never'`. Do not keep the default `'ignore'`: both URLs then serve the same page.
- Check the trailing slash behavior of prerendered pages on the deployed Worker. The host handles them, and they may not follow `trailingSlash`. Do not try to fix this with Astro `redirects`: it is not supported.

## Page head

### [Title links](https://developers.google.com/search/docs/appearance/title-link)

- Set a `<title>` on each page. Make it unique, specific, and short. Do not use "Home" or a text that repeats on every page.
- Put the site name at the start or end of the title, after a separator, for example `Pricing | Starweb`. Use the full tagline only on the home page.
- Give each page one clear `<h1>` that matches the title.

### [Meta descriptions](https://developers.google.com/search/docs/appearance/snippet#meta-descriptions)

- Set `<meta name="description">` on each page with a unique summary of that page. Keep it 160 characters or less (the EmDash SEO panel guideline).
- Generate the description from page data, such as the entry `excerpt`, when a page has many similar siblings. Do not copy the same text to many pages.

### [Canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)

- Make every indexable page output exactly one `<link rel="canonical">`, also when the canonical URL is the page itself. A page that renders `<EmDashHead>` gets it from there (see EmDash SEO below). Do not add a second one.
- Use an absolute URL in `rel="canonical"`. Do not use a relative path.
- Use one canonical URL per page in every place: `rel="canonical"`, `og:url`, and the sitemap. Do not give different URLs for the same page.
- Check the rendered HTML of a sample page for each template: one `rel="canonical"`, one `og:url`, and both equal to the sitemap URL.

### [EmDash SEO](https://docs.emdashcms.com/guides/seo/)

- Add `"seo"` to `supports` of each routable collection, or turn on **SEO** in **Content Types**. Editors then get the SEO panel (title, description, image, canonical URL, and **Hide from search engines**).
- Render `<EmDashHead page={page} />` from `emdash/ui` in the `<head>` of every public page. Build `page` with `createPublicPageContext()` from `emdash/page`. It renders the description, robots, canonical, Open Graph, and Twitter Card tags.
- On a content page, pass `content: { collection, id, slug }` to `createPublicPageContext()`, and get the title and canonical URL from `getSeoMeta()`. Use `kind: "custom"` for pages that are not content entries.
- Render `<EmDashHead>` on custom pages too (home, listings, landing pages). The `WebSite` JSON-LD and verification tags depend on it. It emits no `hreflang` on custom pages: add them as in [I18N.md](I18N.md) (hreflang).
- Pass `canonical: new URL(Astro.url.pathname, Astro.site).href` to `createPublicPageContext()` on a `kind: "custom"` page. `<EmDashHead>` writes `rel="canonical"` and `og:url` only when the page context or the entry sets a canonical URL: it does not compute one.
- Skip `<EmDashHead>` only on pages that are not public: private pages and app routes. Add `<meta name="robots" content="noindex">` to them.
- Render the `<title>` element yourself. `<EmDashHead>` does not render it.
- Do not write your own description, canonical, or Open Graph tags on a page that renders `<EmDashHead>`. Change them with the SEO panel, the page context, or the `page:metadata` hook of a plugin.
- Set the title separator and the default social image in **Settings > SEO**. Pass `settings.seo?.titleSeparator` to `getSeoMeta()` as `titleSeparator`.

### [Open Graph](https://ogp.me/)

- Do not write Open Graph tags on pages that render `<EmDashHead>`. Check that the output has `og:type`, `og:title`, `og:description`, `og:image`, `og:site_name`, and `og:url`. Set missing values in the SEO panel, **Settings > SEO** (default social image), or the page context.
- Set `og:title`, `og:type`, `og:image`, and `og:url` as `<meta property>` tags on a page that does not render `<EmDashHead>` but people share. Also set `og:description` and `og:site_name`.
- Set `og:url` to the canonical URL. Set `og:image:alt` when you set `og:image`.
- Build the `og:image` URL with `new URL('/images/preview.png', Astro.site)`. Do not use a relative path.

## Crawling

### [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)

- Use the EmDash sitemap at `/sitemap.xml` for CMS content. Do not add your own `/sitemap.xml`. EmDash lists only published, routable entries of collections with SEO turned on, and leaves out entries that are hidden from search engines.
- Add [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) with `integrations: [sitemap()]` for prerendered pages that are not in the CMS. It writes `/sitemap-index.xml` and `/sitemap-0.xml`. It cannot list dynamic routes in on-demand mode.
- Keep private pages and app routes out of the sitemap with the `filter` option of `sitemap()`, for example `filter: (page) => !page.includes('/app')`. Add `noindex` to them.
- Add `<link rel="sitemap" href="/sitemap-index.xml" />` to the `<head>` of the base layout when you use `@astrojs/sitemap`.

### [robots.txt](https://developers.google.com/search/docs/crawling-indexing/robots/intro)

- Use the EmDash `/robots.txt`. Do not add `public/robots.txt` or `src/pages/robots.txt.ts`. EmDash allows all crawlers and disallows `/_emdash/` by default.
- To change `robots.txt`, enter the full text in **Settings > SEO > robots.txt**. List each sitemap on its own line: `Sitemap: https://example.com/sitemap.xml`, and `Sitemap: https://example.com/sitemap-index.xml` when you use `@astrojs/sitemap`. EmDash adds its `Sitemap:` line only when your text has none.
- Do not use `Disallow` to keep a page out of search results: the URL can still be listed. Use `<meta name="robots" content="noindex">` or an `X-Robots-Tag: noindex` response header, and let crawlers read the page.
- Do not put `noindex` in `robots.txt`. Google does not support it.

## Structured data

### [JSON-LD](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)

- Use JSON-LD with the [schema.org](https://schema.org/) vocabulary. Do not use Microdata or RDFa.
- Let `<EmDashHead>` render the JSON-LD for articles (`BlogPosting`) and the `WebSite` graph. To change it, use the `page:metadata` hook of a plugin.
- Add JSON-LD for other types, such as `Organization`, `BreadcrumbList`, or `Product`, as `<script type="application/ld+json" set:html={JSON.stringify(data)} />`. Build `data` as a typed object, and do not build the JSON by hand as a string.
- Include all required properties of the type, as listed in the Google Search Central page for that feature. Add fewer recommended properties that are complete and correct, rather than many that are not.

## Errors and redirects

### [404 page](https://docs.astro.build/en/basics/astro-pages/#custom-404-error-page)

- Create `src/pages/404.astro` for a custom 404 page.
- Return a `404` status for a missing page. Do not return `200` with an error message: search engines count it as a soft 404.
- When a dynamic page finds no entry, run `return Astro.rewrite("/404")` in the page. For an on-demand page with its own markup, set `Astro.response.status = 404`.

### [410 Gone](https://developers.google.com/search/docs/crawling-indexing/http-network-errors)

- Use `410` for content that you removed on purpose, and `404` for URLs that never existed. Google treats both as "does not exist".
- For CMS content, add a rule in **Redirects** in the EmDash admin, or mark a path from the **404 Errors** tab as gone. Do not write a 410 handler for CMS paths.
- For other on-demand pages, set `Astro.response.status = 410` and render a "removed" page. Astro `redirects` cannot return `410`.

### [Redirects](https://docs.astro.build/en/guides/routing/#redirects)

- Use a permanent redirect (`301` or `308`) when a URL moves for good. Use a temporary one (`302` or `307`) only when the old URL comes back.
- Put fixed redirects in the `redirects` option of `astro.config`, for example `redirects: { '/old': '/new' }`. Its default status is `301` for GET requests. Set `{ status: 302, destination: '/new' }` for a temporary one.
- Use `Astro.redirect(path, 301)` for redirects that depend on a request. Its default status is `302`. Call it in the page, not in a child component.
- Use `public/_redirects` for redirects of static assets, such as old PDF files.
- Use the EmDash **Redirects** page for CMS paths. EmDash creates a `301` when the slug of a published entry changes. Do not add a config redirect for those.

## LLM files

### [llms.txt](https://llmstxt.org/)

- Add `src/pages/llms.txt.ts` that exports `GET` and returns a `Response`. Read the site URL from `site` in the endpoint context.
- Write `llms.txt` in this order: an H1 with the site name (required), a blockquote with a short summary, then H2 sections that hold lists of `- [Name](url): note` links.
- Put secondary links under an H2 named `Optional`.
