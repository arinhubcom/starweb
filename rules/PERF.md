# PERF

## Core Web Vitals

### [Web Vitals](https://web.dev/articles/vitals)

- Meet all three targets at the 75th percentile of page loads, for mobile and desktop separately: Largest Contentful Paint (LCP) 2.5 seconds or less, Interaction to Next Paint (INP) 200 milliseconds or less, and Cumulative Layout Shift (CLS) 0.1 or less.
- Measure in the field with [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/data-metrics/core-web-vitals/): in the dashboard, open Web Analytics, select the site, then select **Core Web Vitals**. It grades LCP, INP, and CLS and shows the 75th percentile (P75). Set it up as in [PRIVACY.md](PRIVACY.md). CLS data comes only from Chromium browsers.
- Check the Chrome User Experience Report data for the public URL in PageSpeed Insights, and in the Search Console Core Web Vitals report.
- Measure in the lab with Lighthouse or Chrome DevTools before each release. Lighthouse cannot measure INP: use Total Blocking Time as the lab proxy, and check INP in the field.
- Do not trust lab numbers alone. Field data is the result that counts.


## Backend

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

- Keep CPU time per request below 10 ms. Do heavy work at build time, not per request.
- Set `Cache-Control` only on responses that do not come from Astro pages, such as a custom Worker entrypoint. For Astro pages, use Astro route caching (see Astro).

## Placement

### [Workers placement](https://developers.cloudflare.com/workers/configuration/placement/)

- Create the D1 database with a location hint near most of the users, for example `npx wrangler d1 create <name> --location=weur`. Valid hints are `wnam`, `enam`, `weur`, `eeur`, `apac`, and `oc`. Set its `database_id` in `wrangler.jsonc`.
- Run the Worker near the D1 primary with Targeted Placement: set `"placement": { "mode": "targeted", "region": "aws:eu-central-1" }` in `wrangler.jsonc`, with the cloud region nearest to the location hint. Follow [EmDash on Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/#place-the-worker-near-d1).
- Do not turn on D1 read replication with Targeted Placement. Remove the `session: "auto"` that the starter sets in `d1({ binding: "DB", session: "auto" })`, so the EmDash `session` option stays at its default, `"disabled"`.

## Cache

### [Astro](https://docs.astro.build/)

- Use the CDN cache with [Astro route caching](https://docs.astro.build/en/guides/caching/). Set `cache: { provider: cacheCloudflare() }` (from `@astrojs/cloudflare/cache`) in `astro.config`. It turns on Workers Cache. Set cache rules with `Astro.cache.set({ maxAge, swr, tags })` or `routeRules`. Use `Astro.cache.set(false)` for per-user pages. Purge with `cache.invalidate()`.
- Check that [Workers Cache](https://developers.cloudflare.com/workers/cache/) works on your account before you set `cacheCloudflare()`. It started as a private beta: without access, cached responses are never served and `cache.invalidate()` throws an error. Test a cache hit on the deployed Worker.
- Use the Cache API for data that is part of a page, such as a slow upstream `fetch`. Use the global `caches.default` (`match()` and `put()`), and run `put()` in `Astro.locals.cfContext.waitUntil()`. This cache stays in one data center.
- Use Workers KV for small data that many locations read and that changes rarely, such as config or feature flags. Read it with `env.MY_KV.get(key, { cacheTtl })` from `cloudflare:workers`. Writes can take 60 seconds or more to reach other locations, so do not use KV for data that must be fresh.
- Follow the rules in [MEDIA.md](MEDIA.md) for images and fonts, including the LCP image.
