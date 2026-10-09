# Starweb

Starweb is a template for AI agents. Use it to build websites and web apps.
It is built on [Astro](https://astro.build) and
[Cloudflare Workers](https://workers.cloudflare.com).

## Features

- Rules and instructions in `AGENTS.md`, `CLAUDE.md`, and `rules/`.
- Built on Astro.
- Runs on Cloudflare Workers.

## Why Astro

- Hybrid rendering: SSR by default, prerender static pages where it helps.
- Fast pages: Astro sends zero JavaScript to the browser by default.
- Astro components: simple `.astro` files with HTML, scoped CSS, and server-only code. They render to plain HTML.
- Islands architecture: add interactive parts only where you need them.
- Use any UI framework: React, Vue, Svelte, Solid, or none.
- Content first: built-in Markdown, MDX, and type-safe content collections.
- Official Cloudflare adapter: deploy to Cloudflare Workers.
- Good SEO: HTML is rendered on the server.

## Why Cloudflare Workers

- Global edge network: code runs close to the user in many locations.
- Fast start: no cold starts like in container-based platforms.
- Full platform: KV, D1 (SQL), R2 (storage), Queues, Durable Objects, and Workers AI.
- Low cost: a generous free plan and pay for use.
- Local dev: `wrangler dev` runs the same runtime on your machine.
- Built-in security: DDoS protection and HTTPS by default.

### Caching

Cloudflare gives three cache layers:

1. **CDN cache (main layer):** the Cloudflare edge caches full responses, including SSR pages. Control it with `Cache-Control` headers. A cache hit does not run the Worker, so it is the fastest and cheapest path.
2. **Cache API:** the Worker reads and writes responses with `caches.default`. The data stays in one data center. Use it for fine control in code.
3. **Workers KV:** a global key-value store. Use it for data that many locations read often and that changes rarely.

### CPU limit as a performance budget

The Workers Free plan allows 10 ms of CPU time per request. Waiting for I/O (fetch, KV, D1) does not count. We use this limit as a target for high performance: if a page renders in less than 10 ms of CPU time, it is fast and cheap on any plan.
