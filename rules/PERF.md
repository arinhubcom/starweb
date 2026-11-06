# PERF

This file covers performance targets, limits, and caching. Read it before you measure a release, change a size limit, or add caching.

## Measure Core Web Vitals

### Check the [web performance](STACK.md#web-performance) targets

- Measure at P75 of page loads, for mobile and desktop separately.
- The targets are LCP at most 2.5 s, INP at most 200 ms, and CLS at most 0.1.
- For field data, open the [Web Analytics](STACK.md#web-analytics) dashboard, choose the site, and open **Core Web Vitals**. CLS comes from Chromium only. For setup, see [PRIVACY](PRIVACY.md).
- Also use CrUX through PageSpeed Insights and the Search Console Core Web Vitals report.
- For lab data, run `pnpm run lighthouse` before each release, or use Chrome DevTools.
- You cannot measure INP in the lab. Use Total Blocking Time as a proxy, and read INP in the field.
- Field data decides.
- The lab score target is performance 100, for mobile and desktop.
- After each release, run `pnpm run pagespeed [url...]` against the production URL. It cannot reach a stage URL behind Cloudflare Access.
- If a score is below 100, run the check again, because scores vary. Then fix the cause. See [WHY](../WHY.md#why-a-lab-score-target-of-100).

### Run [Lighthouse CI](STACK.md#lighthouse-ci)

- Run `pnpm run lighthouse` after `pnpm run build`.
- Add the key pages of your project to `collect.url` in `lighthouserc.json`.
- Lighthouse CI needs Chrome. GitHub-hosted runners have it. Locally, set `CHROME_PATH`.
- Keep PageSpeed Insights for production. It uses the real network and Workers Cache, is free, and covers desktop.
- Run PageSpeed Insights daily and after each release. See [WHY](../WHY.md#why-lighthouse-ci-and-pagespeed-insights-both-run).

## Limit client JavaScript

### Set a [Size Limit](STACK.md#size-limit)

- `.size-limit.mjs` holds the limit per island.
- Set a limit per page in `page-js-limits.json`, in the form `{ "<path>": <max brotli bytes> }`.
- A page limit counts everything the page loads, from any origin. This includes scripts, `modulepreload`, island `component-url`, `renderer-url`, `before-hydration-url`, inline scripts, and their static imports.
- A lazy `import()` does not count.
- Add an entry for each new public route.
- For a page with no script, set the limit to `0`. `Base.astro` adds the inline theme script, so its pages need more.
- Do not add an entry for the admin (`/_emdash/**`). Do not set a limit on all of `dist/client/_astro/`.

### Change a limit

- Set a new limit to the `pnpm run size` measurement plus 10 %, rounded up to a whole kB. See [WHY](../WHY.md#why-limits-have-10--headroom).
- Before you raise a limit, walk the order in [ARCH](ARCH.md#build-pages-with-astro).
- Then try a lower hydration directive, and then a lazy `import()`.
- Raise a limit only in its own commit. The message gives the old value, the new value, and the reason.
- Lower a limit when the new limit rule gives a value at least 10 % below the current limit.
- Lower it in the same commit as the change that shrinks the page or island.
- Code review checks these rules. `pnpm run size` fails only over a limit, not far under one.

## Keep the Worker fast

### Budget [Workers](STACK.md#workers) CPU

- Keep CPU at 10 ms per request or less.
- Do heavy work at build time.
- EmDash plugins share this budget. See [CMS](CMS.md#keep-to-the-cpu-budget).
- Measure with `pnpm run worker-cpu <worker>`, for example `<worker>-production`.
- Only requests that ran the Worker count. A cache hit does not run it.
- Set `Cache-Control` only on non-Astro responses, which come from a custom Worker entrypoint. Astro pages use route caching. See [Cache pages](#cache-pages).

### Choose the placement

- Choose the D1 location during setup, because you set it when you create the database. See [SETUP](SETUP.md#optional-parts).
- To set a location, pick the hint near most users: `pnpm exec wrangler d1 create <name> --location=weur`.
- The hints are `wnam` (Western North America), `enam` (Eastern North America), `weur` (Western Europe), `eeur` (Eastern Europe), `apac` (Asia-Pacific), and `oc` (Oceania).
- To set no location, leave out `--location`. D1 then creates the database close to where you run the command.
- Use the same choice for each D1 database of the project. A comment next to `d1_databases` in `wrangler.jsonc` holds it.
- Put the `database_id` in `wrangler.jsonc`.

## Cache pages

### Use [Astro](STACK.md#astro) route caching

- Use `Astro.cache.set({ maxAge, swr, tags })` or `routeRules`.
- For per-user pages, use `Astro.cache.set(false)`.
- To purge, use `cache.invalidate()`.
- Test a cache hit on the deployed Worker.
- For page data from a slow upstream `fetch`, use the Cache API: `caches.default` with `match()` and `put()`. It covers a single data center.
- Call `put()` inside `Astro.locals.cfContext.waitUntil()`.
- For small, rarely changing, widely read data such as config and flags, use Workers KV: `env.MY_KV.get(key, { cacheTtl })` from `cloudflare:workers`.
- Workers KV writes take at least 60 s to propagate. Never use it for data that must be fresh.
- For images, fonts, and the LCP image, see [MEDIA](MEDIA.md).
