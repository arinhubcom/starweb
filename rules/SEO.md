# SEO

Public site only. `hreflang` → [I18N](I18N.md). Images, social preview images → [MEDIA](MEDIA.md). Speed → [PERF](PERF.md). EmDash content → [CMS](CMS.md).

## Site URL

### [Astro](STACK.md#astro) `site`

- Same origin for [EmDash](STACK.md#emdash): **Settings > General > Site URL**, `siteUrl` in `emdash()`, or `EMDASH_SITE_URL`. It builds sitemap, `robots.txt`, JSON-LD URLs; Astro `site` alone leaves `localhost` there.
- Check `/robots.txt` and `WebSite` JSON-LD show the public origin.
- Absolute URLs: `new URL(path, Astro.site)`, never `Astro.url.origin`.
- Never `trailingSlash: 'ignore'`. Check prerendered pages on the deployed Worker (host may ignore it). No Astro `redirects` fix (unsupported).

## Page head

### [Google Search Central](STACK.md#google-search-central)

- Per page: unique, specific, short `<title>`; no "Home"; site name after a separator at the end or start (`Pricing | Starweb`); full tagline on home only. One `<h1>` matching the title.
- `<meta name="description">`: unique, 160 characters or less. Generate from page data (`excerpt`) for many similar siblings.
- Exactly one absolute `<link rel="canonical">` on every indexable page (self-canonical too). Same URL in `rel="canonical"`, `og:url`, and the sitemap. Check rendered HTML of a sample page per template.

### EmDash SEO

- `"seo"` in `supports` of each routable collection, or **SEO** in **Content Types** (SEO panel: title, description, image, canonical, **Hide from search engines**).
- `<EmDashHead>` renders description, robots, canonical, Open Graph, Twitter Card.
- Content page: `content: { collection, id, slug }`; title and canonical from `getSeoMeta()`. Custom pages (home, listings, landing): `kind: "custom"` plus `canonical: new URL(Astro.url.pathname, Astro.site).href` (EmDashHead computes none). It emits no `hreflang` there → [I18N](I18N.md) (hreflang).
- Skip `<EmDashHead>` only on private pages and app routes; add `<meta name="robots" content="noindex">`.
- No own description, canonical, or Open Graph tags on pages with `<EmDashHead>`; change via SEO panel, page context, or plugin `page:metadata` hook.
- Title separator and default social image: **Settings > SEO**; pass `settings.seo?.titleSeparator` to `getSeoMeta()` as `titleSeparator`.

### [Open Graph](STACK.md#open-graph)

- With `<EmDashHead>`: no own tags; verify `og:type`, `og:title`, `og:description`, `og:image`, `og:site_name`, `og:url`; fill gaps in SEO panel, **Settings > SEO**, or page context.
- Shared page without it: `<meta property>` `og:title`, `og:type`, `og:image`, `og:url`, `og:description`, `og:site_name`; `og:url` = canonical; `og:image:alt` with `og:image`; image `new URL('/images/preview.png', Astro.site)`.

## Crawling

### Sitemaps

- EmDash `/sitemap.xml` for CMS content (published, routable, SEO-enabled, not hidden); no own `/sitemap.xml`.
- [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) `sitemap()` for prerendered non-CMS pages (`/sitemap-index.xml`, `/sitemap-0.xml`; no dynamic routes in on-demand mode). `filter` out private/app pages (`!page.includes('/app')`) and `noindex` them. Add `<link rel="sitemap" href="/sitemap-index.xml" />` in the base layout `<head>`.

### robots.txt

- EmDash `/robots.txt` only; no `public/robots.txt` or `src/pages/robots.txt.ts` (default: allow all, disallow `/_emdash/`).
- Change in **Settings > SEO > robots.txt** with full text; one `Sitemap:` line each (`/sitemap.xml`, plus `/sitemap-index.xml` with `@astrojs/sitemap`); EmDash adds its own only if none.
- No `Disallow` to deindex: `noindex` meta or `X-Robots-Tag: noindex`, crawlable. No `noindex` in `robots.txt`.

## Structured data

### [Schema.org](STACK.md#schemaorg)

- JSON-LD only; no Microdata or RDFa.
- `<EmDashHead>` renders `BlogPosting` and the `WebSite` graph; change via plugin `page:metadata`.
- Other types (`Organization`, `BreadcrumbList`, `Product`): `<script type="application/ld+json" set:html={JSON.stringify(data)} />`, `data` a typed object.
- All required properties per Search Central; fewer complete recommended ones over many incomplete.

## Errors and redirects

### 404

- Real `404` status, never `200` (soft 404). Dynamic page without entry: `return Astro.rewrite("/404")`; custom markup on-demand: `Astro.response.status = 404`.

### 410

- `410` for deliberately removed content, `404` for never-existed. CMS paths: EmDash **Redirects** rule or mark from **404 Errors** tab; no own handler. Other on-demand pages: `Astro.response.status = 410` + "removed" page (Astro `redirects` cannot).

### Redirects

- Permanent `301`/`308` for moved URLs; `302`/`307` only if the old URL returns.
- Fixed: `redirects` in `astro.config` (default `301` for GET; `{ status: 302, destination }` for temporary).
- Request-dependent: `Astro.redirect(path, 301)` (default `302`), in the page, not a child component.
- Static assets (old PDFs): `public/_redirects`.
- CMS paths: EmDash **Redirects** page (auto `301` on slug change); no config redirect for those.

## LLM files

### [llms.txt](STACK.md#llmstxt)

- `src/pages/llms.txt.ts` exports `GET` returning `Response`; site URL from `site` in endpoint context.
- Order: H1 site name (required), blockquote summary, H2 sections with `- [Name](url): note` lists; secondary links under H2 `Optional`.
