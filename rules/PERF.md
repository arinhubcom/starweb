# PERF

## Core Web Vitals

### [Web performance](STACK.md#web-performance)

- Targets at P75 of page loads, mobile and desktop separately: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- Field: [Web Analytics](STACK.md#web-analytics) dashboard → site → **Core Web Vitals** (CLS from Chromium only); setup → [PRIVACY](PRIVACY.md). CrUX via PageSpeed Insights and the Search Console Core Web Vitals report.
- Lab: `pnpm run lighthouse` before each release (or Chrome DevTools); INP not measurable in lab → Total Blocking Time proxy, INP in the field. Field data decides.
- Lab score target: performance 100, mobile and desktop. PageSpeed Insights on the production URL: `pnpm run pagespeed [url...]` after each release (it cannot reach a stage URL behind Cloudflare Access). Below 100 → run again (scores vary), then fix the cause. → [WHY](../WHY.md#why-a-lab-score-target-of-100)

### [Lighthouse CI](STACK.md#lighthouse-ci)

- `pnpm run lighthouse` after `pnpm run build`: a project adds its key pages to `collect.url` in `lighthouserc.json`. Stop any other server on port 4322 first. Needs Chrome (preinstalled on GitHub-hosted runners; locally `CHROME_PATH`).
- Reports stay private: no temporary public storage.
- PageSpeed Insights stays for production: real network and Workers Cache, free, daily and after each release; it covers desktop. → [WHY](../WHY.md#why-lighthouse-ci-and-pagespeed-insights-both-run)

## Client JavaScript

### [Size Limit](STACK.md#size-limit)

- Per island: `.size-limit.mjs`. An empty list skips the check.
- Per page: `page-js-limits.json`, `{ "<path>": <max brotli bytes> }`. Counts everything the page loads: scripts, `modulepreload`, island `component-url`, `renderer-url`, `before-hydration-url`, inline scripts, and their static imports, from any origin. Lazy `import()` does not count.
- Each new public route gets an entry. Page with no script: limit `0`; `Base.astro` adds the inline theme script, so its pages need more.
- Admin (`/_emdash/**`) is out of scope: no entry, and no limit on all of `dist/client/_astro/`.

### Limit values

- New limit: the `pnpm run size` measurement plus 10 %, rounded up to a whole kB. → [WHY](../WHY.md#why-limits-have-10--headroom)
- Before you raise a limit: walk the order in [ARCH](ARCH.md) (Astro), try a lower hydration directive, then lazy `import()`.
- Raise a limit only in its own commit; the message gives the old value, the new value, and the reason.
- Lower a limit, in the same commit as the change that shrinks the page or island, when the new limit rule gives a value at least 10 % below the current limit.
- Code review checks these rules; `pnpm run size` fails only over a limit, not far under one.

## Backend

### [Workers](STACK.md#workers)

- CPU ≤ 10 ms per request; heavy work at build time.
- EmDash plugins share this budget. → [CMS](CMS.md#plugins)
- Measure: `pnpm run worker-cpu <worker>` (for example `<worker>-production`).
- Only requests that ran the Worker count; a cache hit does not run it.
- `Cache-Control` only on non-Astro responses (custom Worker entrypoint); Astro pages use route caching (Cache).

## Placement

### Workers placement

- D1 with a location hint near most users: `pnpm exec wrangler d1 create <name> --location=weur` (`wnam`, `enam`, `weur`, `eeur`, `apac`, `oc`); `database_id` in `wrangler.jsonc`.

## Cache

### [Astro](STACK.md#astro) route caching

- `Astro.cache.set({ maxAge, swr, tags })` or `routeRules`; per-user pages `Astro.cache.set(false)`; purge `cache.invalidate()`.
- Test a cache hit on the deployed Worker.
- Cache API for page data (slow upstream `fetch`): `caches.default` `match()`/`put()`, `put()` inside `Astro.locals.cfContext.waitUntil()`; single data center.
- Workers KV for small, rarely changing, widely read data (config, flags): `env.MY_KV.get(key, { cacheTtl })` from `cloudflare:workers`; writes take ≥ 60 s to propagate, never for data that must be fresh.
- Images, fonts, LCP image → [MEDIA](MEDIA.md).
