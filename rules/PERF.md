# PERF

## Backend

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

- Keep CPU time per request below 10 ms. Do heavy work at build time, not per request.
- Set `Cache-Control` only on responses that do not come from Astro pages, such as a custom Worker entrypoint. For Astro pages, use Astro route caching (see Astro).

## Cache

### [Astro](https://docs.astro.build/)

- Use the CDN cache with [Astro route caching](https://docs.astro.build/en/guides/caching/). Set `cache: { provider: cacheCloudflare() }` (from `@astrojs/cloudflare/cache`) in `astro.config`. It turns on Workers Cache. Set cache rules with `Astro.cache.set({ maxAge, swr, tags })` or `routeRules`. Use `Astro.cache.set(false)` for per-user pages. Purge with `cache.invalidate()`.
- Check that [Workers Cache](https://developers.cloudflare.com/workers/cache/) works on your account before you set `cacheCloudflare()`. It started as a private beta: without access, cached responses are never served and `cache.invalidate()` throws an error. Test a cache hit on the deployed Worker.
- Use the Cache API for data that is part of a page, such as a slow upstream `fetch`. Use the global `caches.default` (`match()` and `put()`), and run `put()` in `Astro.locals.cfContext.waitUntil()`. This cache stays in one data center.
- Use Workers KV for small data that many locations read and that changes rarely, such as config or feature flags. Read it with `env.MY_KV.get(key, { cacheTtl })` from `cloudflare:workers`. Writes can take 60 seconds or more to reach other locations, so do not use KV for data that must be fresh.
- Follow the rules in [MEDIA.md](MEDIA.md) for images and fonts, including the LCP image.
