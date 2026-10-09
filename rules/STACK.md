# Tech Stack Rules

## Language

### TypeScript

- Use TypeScript in strict mode. Extend `astro/tsconfigs/strict` (or `strictest`) in `tsconfig.json`.

### [Effect](https://effect.website)

- Use Effect for typed errors, async code, and dependency injection. Do not use Effect Schema.

### [Zod](https://zod.dev)

- Compile schemas at build time with [zod-compiler](https://github.com/gajus/zod-compiler) (Vite plugin in `astro.config`). Do not use `z.compile()`: it uses `new Function()`, which Cloudflare Workers do not allow.
- Use Zod for all schemas and validation. In Effect code, use the `decode` helper to turn Zod results into typed errors.

## Backend

### Cloudflare Workers

- Keep CPU time per request below 10 ms. Do heavy work at build time, not per request.
- Set `Cache-Control` only on responses that do not come from Astro pages, such as a custom Worker entrypoint. For Astro pages, use Astro route caching (see Astro).
- Use bindings (KV, D1, R2) from the `env` object. Do not call Cloudflare services over public HTTP when a binding exists.
- Keep secrets out of code and `wrangler.jsonc`. Use `wrangler secret put`, and `.dev.vars` for local dev.
- Do not keep request state in global variables. An isolate serves many requests.
- Use `ctx.waitUntil()` for work after the response, such as logs or analytics. In Astro code, use `Astro.locals.cfContext.waitUntil()`.
- Prefer Web APIs (`fetch`, `Request`, `Response`, Web Crypto) over Node.js APIs. Set `compatibility_date` to `2026-08-04` or later: Node.js APIs are then on by default, so do not add the `nodejs_compat` flag.
- Generate binding types with `wrangler types`. Do not write them by hand.
- Test locally with `wrangler dev` before you deploy.

## Frontend

### [Astro](https://docs.astro.build/)

- Use `output: "server"` with the `@astrojs/cloudflare` adapter. Add `export const prerender = true` to pages that do not change per request.
- Use the CDN cache with [Astro route caching](https://docs.astro.build/en/guides/caching/). Set `cache: { provider: cacheCloudflare() }` (from `@astrojs/cloudflare/cache`) in `astro.config`. It turns on Workers Cache. Set cache rules with `Astro.cache.set({ maxAge, swr, tags })` or `routeRules`. Use `Astro.cache.set(false)` for per-user pages. Purge with `cache.invalidate()`.
- Use the Cache API for data that is part of a page, such as a slow upstream `fetch`. Use the global `caches.default` (`match()` and `put()`), and run `put()` in `Astro.locals.cfContext.waitUntil()`. This cache stays in one data center.
- Use Workers KV for small data that many locations read and that changes rarely, such as config or feature flags. Read it with `env.MY_KV.get(key, { cacheTtl })` from `cloudflare:workers`. Writes can take 60 seconds or more to reach other locations, so do not use KV for data that must be fresh.
- Write UI as `.astro` components by default. Use a UI framework island only when the part must be interactive.
- Pick the lowest hydration directive that works: `client:visible` or `client:idle` before `client:load`.
- Use content collections for Markdown and MDX content. Do not render Markdown per request.
- Use Astro Actions for forms and mutations. Validate input with Zod.
- Read Cloudflare bindings and secrets with `import { env } from "cloudflare:workers"`. Do not use `process.env` or the removed `Astro.locals.runtime` API.
- Use `astro:assets` (`<Image />`) for images. Keep the adapter default `imageService: "cloudflare-binding"`.
- Run `astro check` before you commit. It must have no errors.
