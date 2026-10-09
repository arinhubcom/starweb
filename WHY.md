# Why this stack

This page explains why Starweb uses Astro, Cloudflare Workers, and EmDash, and why not the alternatives.

## [Astro](https://docs.astro.build/)

### Why

- Hybrid rendering: SSR by default, prerender static pages where it helps.
- Fast pages: Astro sends zero JavaScript to the browser by default.
- Astro components: simple `.astro` files with HTML, scoped CSS, and server-only code. They render to plain HTML.
- Islands architecture: add interactive parts only where you need them.
- Use any UI framework: React, Vue, Svelte, Solid, or none.
- Content first: built-in Markdown, MDX, and type-safe content collections.
- Official Cloudflare adapter: deploy to Cloudflare Workers.
- Good SEO: HTML is rendered on the server.

## [Cloudflare Workers](https://developers.cloudflare.com/workers/)

### Why

- Code runs at the edge in many locations, with V8 isolates and no slow cold starts.
- One platform for compute, data, and cache: KV, D1, R2, Queues, Durable Objects, Workers AI, and Workers Cache.
- Workers Cache can return cached SSR responses without running the Worker.
- Static assets: the Astro build output is served from the same Worker.
- Low cost: a generous free plan, then pay for use.
- Safe releases: gradual deployments split traffic between versions, and rollback is instant.
- Local dev: `wrangler dev` runs the same runtime (workerd) on your machine.
- Built-in security: DDoS protection and HTTPS by default.

### Alternatives

- **AWS Lambda:** cold starts, runs in one region by default, and needs more setup (API Gateway, IAM, CloudFront).
- **Google Cloud (Cloud Run, Cloud Functions):** container-based, so cold starts are possible, and it runs in regions, not at the edge. It needs more setup (IAM, load balancer, Cloud CDN).
- **Vercel / Netlify:** good DX, but higher cost at scale, and edge functions have fewer built-in data services.

### Caching

Cloudflare gives three cache layers:

1. **CDN cache (main layer):** the Cloudflare edge caches full responses, including SSR pages. Astro route caching (`Astro.cache.set()` with the `cacheCloudflare()` provider) sets the cache rules. A cache hit does not run the Worker, so it is the fastest and cheapest path.
2. **Cache API:** the Worker reads and writes responses with `caches.default`. The data stays in one data center. Use it for fine control in code.
3. **Workers KV:** a global key-value store. Use it for data that many locations read often and that changes rarely.

### CPU limit as a performance budget

The Workers Free plan allows 10 ms of CPU time per request. Waiting for I/O (fetch, KV, D1) does not count. We use this limit as a target for high performance: if a page renders in less than 10 ms of CPU time, it is fast and cheap on any plan.

## [EmDash](https://docs.emdashcms.com/)

### Why

- Astro-native: EmDash is an Astro integration. One project gives the site, admin panel, REST API, auth, and media library.
- Runs on the same stack: Cloudflare Workers, D1 for data, and R2 for media. No separate CMS hosting.
- Live content: editors publish without a rebuild. Queries return a `cacheHint` for Astro route caching, so pages stay in the CDN cache.
- Sandboxed plugins: each plugin runs in its own Worker isolate with only the capabilities it declares.
- Structured content: rich text is Portable Text (JSON), not HTML, so it can render to web, email, or an API.
- Built for agents: agent skills, a CLI, and a built-in MCP server.
- Passkey-first auth with roles (Administrator, Editor, Author, Contributor).
- WordPress import for posts, pages, media, and taxonomies.

### Alternatives

- **WordPress:** PHP next to JavaScript, many cache layers for good speed, and plugins with full access to the database and files.
- **Headless SaaS CMS (Contentful, Sanity):** a separate service with its own cost, limits, and API calls on each request.
- **Markdown in Git (Astro content collections):** good for developers, but editors cannot publish without Git and a rebuild.
