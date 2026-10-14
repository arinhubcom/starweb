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

### Limits

- D1 has a size limit per database (10 GB). Large apps must split data across many databases.
- Workers have limits on memory (128 MB per isolate) and CPU time. Heavy or long jobs need Queues, Workflows, or another service.
- Complex relational queries and reports are harder on D1 (SQLite) than on PostgreSQL.
- Strong ties to Cloudflare. The Node.js fallback exists, but you lose the edge services (KV, R2, Queues, Durable Objects).

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

## [Kysely](https://kysely.dev)

### Why

- Type-safe SQL: the query builder checks table and column names and result types in TypeScript.
- Thin layer over SQL, not an ORM. An agent writes SQL well, and there is no ORM abstraction that leaks. See [this note by Peter Steinberger](https://x.com/steipete/status/2005692454553673900): "ORMs are more for humans than agents."
- Abstractions made for human comfort can move simple code "out-of-distribution" for AI models ([source](https://x.com/ptr/status/2005691037306740766)). SQL and a thin typed query builder stay close to what models know well.
- EmDash also uses Kysely, so the project uses one query tool.
- Works on D1 with the kysely-d1 dialect.

### Alternatives

- **Drizzle ORM:** an ORM with its own schema language and migrations. More abstraction for agents to work around.
- **Raw D1 API (`env.DB.prepare()`):** no type safety for tables and results.

## [Tailwind CSS](https://tailwindcss.com)

### Why

- It is the most used styling system, so agents write it well and many examples exist.
- Utility classes keep styles in the markup of `.astro` components and React islands. One system for both, with no extra build step for `.astro` files.
- Astro supports it officially: `npx astro add tailwind` sets up the `@tailwindcss/vite` plugin.
- Design tokens are CSS theme variables (`@theme`), so `.astro` files, islands, and plain CSS read the same values.
- emdash-better-auth already needs Tailwind for its auth pages, so the project has one styling system, not two.
- It fits the ecosystem: Base UI docs show Tailwind examples, and the Better Auth UI shadcn/ui variant and Fulldev UI use Tailwind v4.

### Alternatives

- **StyleX:** typed styles in TypeScript and atomic CSS at build time. But `.astro` files are not a documented StyleX target, and emdash-better-auth would still need Tailwind, so the project would have two styling systems.
- **Astro scoped styles only:** no utility classes and no shared tokens for React islands.

### Auth UI

- emdash-better-auth renders its auth pages with [Better Auth UI](https://github.com/better-auth-ui/better-auth-ui) in the HeroUI variant. It uses Tailwind, but the HeroUI look and theme differ from the rest of the site.
- Better Auth UI also has a shadcn/ui variant (Tailwind components copied into the project) and a headless package, `@better-auth-ui/react`. Both let the auth pages use the site theme.
- This needs a plugin option to turn off the built-in pages ([emdash-better-auth#25](https://github.com/theweekendprojects/emdash-better-auth/issues/25)). Until then, the HeroUI pages stay.

## [Fulldev UI](https://ui.full.dev)

### Why

- Plain Astro components with no client JavaScript. This keeps the "zero JavaScript by default" goal.
- Built for content sites: 100+ components and blocks (sections, hero, features, pricing, FAQ) for marketing sites and landing pages.
- shadcn compatible: install with the shadcn CLI and own the code after install. The `base-*` styles match shadcn/ui on Base UI, so `.astro` components and React islands share one theme.
- Tailwind v4, the same styling system as the rest of the site.
- Agent skill for coding agents (`fulldev-ui`). MIT license.

### Risks

- A smaller project than shadcn/ui (about 600 GitHub stars).
- The init step writes the shadcn theme into the global stylesheet. Keep custom tokens in the same place.

## [Base UI](https://base-ui.com)

### Why

- Unstyled and accessible: Base UI handles focus, keyboard, and ARIA, and adds no CSS. Tailwind gives all the styles.
- Its styling hooks (`className` and `style` as functions of state, data attributes, CSS variables) work with any styling engine. Tailwind data variants (`data-checked:`) style the states directly.
- The `render` prop lets a Base UI part use your own components.
- It comes from the creators of Radix, Material UI, and Floating UI ([About](https://base-ui.com/react/overview/about)).

### Alternatives

- **Radix UI:** similar headless primitives. Base UI is the newer library from the same people.
- **shadcn/ui:** Base UI or Radix with Tailwind, copied into the project. A good source of examples for your own wrappers.
- **HeroUI:** a styled library with its own look. Harder to match the site theme.

## [Material Design 3](https://m3.material.io/foundations/layout/layout-overview)

### Why

- Tailwind CSS gives a spacing scale, but no rules for when to use which value. MD3 gives tested rules for margins, panes, navigation, touch targets, and component sizes at each breakpoint.
- The MD3 spacing system is on an 8dp scale, and Tailwind steps are 4px. Each MD3 token maps to one Tailwind step, so we need no new utilities.
- The MD3 breakpoints (600, 840, 1200, 1600) apply to Android and the web. Agents get one clear layout per breakpoint instead of free choices.
- The 48x48 target is bigger than the WCAG 2.2 target sizes (24x24px for AA in 2.5.8, 44x44px for AAA in 2.5.5), so it passes both.
- At Google I/O 2026 (May 19, 2026), Material added the Expressive layout scaffold and the new 8dp spacing system. The breakpoints page lists five breakpoints, with large and extra-large for desktop ([What's new at I/O 2026](https://m3.material.io/blog/whats-new-at-io26)).

### What we do not take

- We do not take the MD3 look (color roles, shapes, motion). The look comes from the Fulldev UI theme.
- MD3 spacing tokens are only implemented in Jetpack Compose, not for the web. We map them to Tailwind steps by hand.
- The Fulldev UI and shadcn button sizes (for example `h-9`) are not MD3 sizes. We change them after install.

## Payments

### Why a Merchant of Record for the EU

- Digital services sold to EU consumers carry VAT by the country of the customer. A normal payment processor (Stripe) leaves VAT registration and OSS returns to you. Stripe Tax calculates the tax but does not file it.
- A Merchant of Record sells in your name: it collects and pays VAT, issues invoices, and handles refunds and chargebacks.

### Why Creem

- Fees (pricing pages, checked on 2026-10-12):

| Service | Fee per transaction | Monthly fee |
| --- | --- | --- |
| [Creem](https://www.creem.io/pricing) | 3.9% + $0.40, no international card fees | none |
| [Polar](https://polar.sh/resources/pricing) | Starter 5% + $0.50, Pro 3.8% + $0.40 | Starter none, Pro $20 |
| [Dodo Payments](https://dodopayments.com/pricing) | 4% + $0.40 | none |
| [Stripe Managed Payments](https://stripe.com/managed-payments) | 3.5% on top of standard Stripe fees (EEA cards 1.5% + CZK 6.50) | none |
| Stripe (not an MoR) | EEA cards 1.5% + CZK 6.50, plus your own VAT work | none |

- Creem is the cheapest MoR without a monthly fee. For a $50 order: Creem $2.35, Stripe Managed Payments about $2.77 with an EEA card.
- Creem is an EU company (Armitage Labs OÜ, Estonia).
- Creem has a TypeScript SDK, signed webhooks, and an official Better Auth plugin.

### Risks

- emdash-better-auth cannot load the Creem Better Auth plugin yet ([#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)), so the first setup uses the SDK and webhooks.
- The Creem fixed fee ($0.40) is higher than Stripe. For very small orders (under about $10), Stripe Managed Payments can cost the same or less.
- Creem is younger and smaller than Stripe.

### x402

- Stripe supports x402: payments in USDC go to a Stripe deposit address and are recorded as PaymentIntents. This is a preview API, mainnet needs the Coinbase CDP facilitator, and stablecoin payments are open by default only to US businesses.
- No MoR in the table supports x402. Treat x402 as an extra channel for agents, not as the main billing.

## SaaS

### Why one D1 database for a small SaaS

- Durable Object rows read and written cost the same as D1, but a Durable Object also bills duration (128 MB of memory) while it is active and cannot hibernate.
- Each call from the Worker to a Durable Object is a billed request, on top of the Worker request.
- Reports across all tenants are hard: you must call every Durable Object, or copy data to a second database.
- Schema changes must run in each Durable Object, not once.
- One D1 database with `tenant_id` is cheaper and simpler while tenants are small.

### When to use one Durable Object per tenant

- Real-time collaboration with WebSockets.
- Much data per tenant (a SQLite-backed Durable Object stores up to 10 GB on Workers Paid, 1 GB on Free).
- Strict data isolation is a requirement, for example in B2B contracts.

### Why one project and one domain

- A small app does not need a second Worker. One deploy, one domain, and one session cookie are simpler.
- Astro pages and API routes run next to EmDash and use the same Cloudflare bindings.
- EmDash gives the site, admin panel, users, roles, and media. emdash-better-auth adds signup, organizations, and Stripe billing.

### What EmDash does not give for a SaaS

- No multi-tenancy: only global roles, no per-organization data scoping. Issue [emdash-cms/emdash#52](https://github.com/emdash-cms/emdash/issues/52) asked for it and was closed without a feature.
- Content types fit editorial content (drafts, revisions, slugs), not high-volume app data.
- No documented public API to write content from app code on the server.
- Every request runs EmDash middleware, unless the `outer` option skips it.
- Plugin API routes need admin permissions by default, so they do not fit customer traffic.

### Why a separate D1 database for app data

- No name conflicts with EmDash tables (`ec_`, `_emdash_`, `_plugin_`, `media`, `options`, and more).
- EmDash migrations and app migrations do not touch each other. An EmDash upgrade cannot change app data.
- Each database has its own 10 GB limit.
- D1 Time Travel restores a full database. You can restore the app without a restore of the site content, and the other way.
- The app can later move to its own Worker with no data move.
- Cost: no joins, transactions, or foreign keys across the two databases. Users and organizations stay in the EmDash database, so the app keeps only their IDs and cleans up its own data.

### Why these building blocks

- EmDash and emdash-better-auth give the site, login, organizations, and billing. A SaaS also needs an app admin, data cleanup, plan limits, email, and monitoring.
- Each block uses a Cloudflare service or a library that runs on Workers, so the app stays on one platform.
- A native EmDash plugin puts the app admin next to the content admin, with the same login and roles.
- Analytics Engine stores many small events cheaply. One D1 row per event costs writes and storage.
- Presigned URLs send large uploads straight to R2, so they do not use Worker CPU time or memory.
- A test that checks tenant isolation catches the most costly SaaS bug: one customer sees the data of another.

### When to split the app into a separate Worker

- The app needs Better Auth plugins that emdash-better-auth cannot load yet ([emdash-better-auth#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)).
- The app grows large, and EmDash upgrades or middleware start to slow it down.
