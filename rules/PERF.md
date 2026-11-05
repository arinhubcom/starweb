# PERF

## Core Web Vitals

### [Web performance](STACK.md#web-performance)

- Targets at P75 of page loads, mobile and desktop separately: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- Field: [Web Analytics](STACK.md#web-analytics) dashboard → site → **Core Web Vitals** (CLS from Chromium only); setup → [PRIVACY](PRIVACY.md). CrUX via PageSpeed Insights and the Search Console Core Web Vitals report.
- Lab: `pnpm run lighthouse` before each release (or Chrome DevTools); INP not measurable in lab → Total Blocking Time proxy, INP in the field. Field data decides.
- Lab score target: performance 100, mobile and desktop. PageSpeed Insights on the production URL: `pnpm run pagespeed [url...]` (median of 3 runs per strategy, needs `PAGESPEED_API_KEY`), daily in `.github/workflows/perf.yml` and after each release (it cannot reach a stage URL behind Cloudflare Access). Below 100 → run again (scores vary), then fix the cause. → [WHY](../WHY.md#why-a-lab-score-target-of-100)

### [Lighthouse CI](STACK.md#lighthouse-ci)

- `pnpm run lighthouse` (after `pnpm run build`): `lighthouserc.json`, mobile, `performance` only, median of 3 runs on `/`; a project adds its key pages to `collect.url`. Starts `astro preview --port 4322` itself; stop any other server on that port first. Needs Chrome (preinstalled on GitHub-hosted runners; locally `CHROME_PATH`). Not in `check`.
- Reports stay private: `upload.target` is `filesystem` (`.lighthouseci/out`, in `.gitignore`); no temporary public storage.
- `.github/workflows/lighthouse.yml` in each pull request, its own workflow: a score below 100 is a warning annotation and a step summary, never a failed job. Never a required check. Outside Actions, `scripts/report-lighthouse.ts` exits 1.
- PageSpeed Insights stays for production: real network and Workers Cache, free, daily and after each release; it covers desktop. → [WHY](../WHY.md#why-lighthouse-ci-and-pagespeed-insights-both-run)

## Client JavaScript

### [Size Limit](STACK.md#size-limit)

- Per island: `.size-limit.mjs` lists each `src/components/islands/*.tsx` and `src/apps/*/islands/*.tsx` (no `*.stories.tsx`, `*.test.tsx`); measures its own chunk, brotli. Default `10 kB`; raise one island in `LIMIT_OVERRIDES` (name without extension → limit). An empty list skips the check.
- Per page: `page-js-limits.json`, `{ "<path>": <max brotli bytes> }`. Counts everything the page loads: scripts, `modulepreload`, island `component-url`, `renderer-url`, `before-hydration-url`, inline scripts, and their static imports, from any origin. Lazy `import()` does not count.
- Each new public route gets an entry. Page with no script: limit `0`; `Base.astro` adds the inline theme script, so its pages need more.
- `pnpm run size` after `pnpm run build` (needs `dist/`); in the PR workflow and in `scripts/test-template.sh`. Not in `check`.
- Admin (`/_emdash/**`) is out of scope: no entry, and no limit on all of `dist/client/_astro/`.
- The script starts `astro preview` on a free port and fetches each path; a redirect to another path, a non-200 status, or a script that fails to load fails the check.
- Parsing: [parse5](STACK.md#parse5) for HTML, [es-module-lexer](STACK.md#es-module-lexer) (`/js` build) for imports; no regexes. Code in `scripts/check-js-size.ts`, `scripts/lib/page-js.ts`.

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
- Measure: `pnpm run worker-cpu <worker>` (for example `<worker>-production`; needs `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_OBSERVABILITY_TOKEN`), daily in `.github/workflows/perf.yml`. Over 24 hours: P95 CPU ≤ 10 ms, no `exceededCpu` outcome. Below 20 requests the check reports P95 and does not fail.
- Only requests that ran the Worker count; a cache hit does not run it.
- No grouping by `$workers.event.request.path` (no rows for several Workers); group by `$workers.event.request.url` for diagnosis only. → [WHY](../WHY.md#why-the-worker-cpu-check-uses-the-whole-worker)
- `Cache-Control` only on non-Astro responses (custom Worker entrypoint); Astro pages use route caching (Cache).

## Placement

### Workers placement

- D1 with a location hint near most users: `pnpm exec wrangler d1 create <name> --location=weur` (`wnam`, `enam`, `weur`, `eeur`, `apac`, `oc`); `database_id` in `wrangler.jsonc`.
- Targeted Placement in `wrangler.jsonc`: `"placement": { "mode": "targeted", "region": "aws:eu-central-1" }` (cloud region nearest the hint) → [EmDash on Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/#place-the-worker-near-d1).
- No D1 read replication with it: remove the starter's `session: "auto"` and `coalesce: true` in `d1({ binding: "DB", session: "auto", coalesce: true })` (EmDash `session` stays `"disabled"`).

## Cache

### [Astro](STACK.md#astro) route caching

- `cache: { provider: cacheCloudflare() }` (from `@astrojs/cloudflare/cache`) in `astro.config` turns on Workers Cache. Rules: `Astro.cache.set({ maxAge, swr, tags })` or `routeRules`; per-user pages `Astro.cache.set(false)`; purge `cache.invalidate()`.
- Test a cache hit on the deployed Worker.
- Cache API for page data (slow upstream `fetch`): `caches.default` `match()`/`put()`, `put()` inside `Astro.locals.cfContext.waitUntil()`; single data center.
- Workers KV for small, rarely changing, widely read data (config, flags): `env.MY_KV.get(key, { cacheTtl })` from `cloudflare:workers`; writes take ≥ 60 s to propagate, never for data that must be fresh.
- Images, fonts, LCP image → [MEDIA](MEDIA.md).
