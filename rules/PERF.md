# PERF

## Core Web Vitals

### [Web performance](STACK.md#web-performance)

- Targets at P75 of page loads, mobile and desktop separately: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- Field: [Web Analytics](STACK.md#web-analytics) dashboard → site → **Core Web Vitals** (CLS from Chromium only); setup → [PRIVACY](PRIVACY.md). CrUX via PageSpeed Insights and the Search Console Core Web Vitals report.
- Lab: Lighthouse or Chrome DevTools before each release; INP not measurable in lab → Total Blocking Time proxy, INP in the field. Field data decides.

## Backend

### [Workers](STACK.md#workers)

- CPU ≤ 10 ms per request; heavy work at build time.
- `Cache-Control` only on non-Astro responses (custom Worker entrypoint); Astro pages use route caching (Cache).

## Placement

### Workers placement

- D1 with a location hint near most users: `npx wrangler d1 create <name> --location=weur` (`wnam`, `enam`, `weur`, `eeur`, `apac`, `oc`); `database_id` in `wrangler.jsonc`.
- Targeted Placement in `wrangler.jsonc`: `"placement": { "mode": "targeted", "region": "aws:eu-central-1" }` (cloud region nearest the hint) → [EmDash on Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/#place-the-worker-near-d1).
- No D1 read replication with it: remove the starter's `session: "auto"` in `d1({ binding: "DB", session: "auto" })` (EmDash `session` stays `"disabled"`).

## Cache

### [Astro](STACK.md#astro) route caching

- `cache: { provider: cacheCloudflare() }` (from `@astrojs/cloudflare/cache`) in `astro.config` turns on Workers Cache. Rules: `Astro.cache.set({ maxAge, swr, tags })` or `routeRules`; per-user pages `Astro.cache.set(false)`; purge `cache.invalidate()`.
- Verify Workers Cache on the account first (private-beta origin: without access nothing is served from cache and `cache.invalidate()` throws); test a hit on the deployed Worker.
- Cache API for page data (slow upstream `fetch`): `caches.default` `match()`/`put()`, `put()` inside `Astro.locals.cfContext.waitUntil()`; single data center.
- Workers KV for small, rarely changing, widely read data (config, flags): `env.MY_KV.get(key, { cacheTtl })` from `cloudflare:workers`; writes take ≥ 60 s to propagate, never for data that must be fresh.
- Images, fonts, LCP image → [MEDIA](MEDIA.md).
