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
- **HeroUI:** a styled library with its own look. Harder to match the site theme.

## [shadcn/ui](https://ui.shadcn.com)

### Why

- Ready-made Base UI wrappers with Tailwind classes. Agents install them with the shadcn CLI instead of writing focus, keyboard, and ARIA styles by hand.
- The shadcn/ui [changelog](https://ui.shadcn.com/docs/changelog) has a July 2026 entry, "Base UI as the Default". The `base-vega` components import `@base-ui/react`.
- The Fulldev init writes `"style": "base-vega"` to `components.json`, so `.astro` components and React islands share one theme and one CLI.
- You own the code after install, as with Fulldev UI.

### Risks

- shadcn/ui components are React. In `.astro` pages each one is an island with client JavaScript, so we use them only for interactive parts.
- shadcn/ui also has `radix-*` styles that import `radix-ui`. The style cannot change after init, so a project set up with a Radix style must start again.
- Component sizes (for example `h-9`) are not MD3 sizes. We change them after install.

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

## [Mailchimp voice and tone](https://styleguide.mailchimp.com/voice-and-tone/)

### Why

- MD3 content design gives rules for words, grammar, and punctuation, but few rules for how the tone changes with the user's situation. The Mailchimp guide separates a fixed voice from a tone that changes with the reader's state of mind.
- The guide is public under a Creative Commons Attribution-NonCommercial 4.0 license.

### What we do not take

- We do not take the Mailchimp brand voice: offbeat, dry humor, and "we" for the company. MD3 does not allow "we" for the product, and humor is hard to translate.
- We do not take the other parts of the guide (grammar, web elements, word list). MD3 and the Google developer documentation style guide cover them, and a third guide would add conflicts.

## Style guide for UI text

### Why the Google guide fills the gaps in MD3

- MD3 content design covers the main UI text rules, but not all topics. MD3 says that Google generally follows AP Style, and it links to AP Style only for hyphens.
- The AP Stylebook is paid. An agent cannot read or verify its rules, so a rule that says "follow AP Style" cannot be checked.
- The Google developer documentation style guide is free, current, and from Google, like MD3. We already use it for docs, so agents follow one guide for both.
- AP Style differs from our rules on some points: it does not use the serial comma, it writes times as "1 p.m.", and it abbreviates months ("Aug. 25"). We keep AP Style only for hyphens, as MD3 does.

## [Conversation mining](https://uxwritinghub.com/leveraging-conversation-mining-for-ux-writing-research/)

### Why

- MD3 and the Mailchimp guide say how to write, but not which words users know. Conversation mining, a UX writing research method named by the UX Writing Hub in 2018, finds the words, phrases, and terms that users use in real conversations.
- UI text in the users' words is easier to understand and to find in search. Negative conversations also show pain points that users do not report.
- A glossary keeps one term for one thing. This is our own rule, not part of the method.

### What we do not take

- The method also suggests copying slang and hashtags into the UI. We take only the words for things and actions: slang and idioms break the MD3 Global writing rules and are hard to translate.

## UI and UX

### Why UI-UX.md is about behavior

- The other frontend files answer one question each: MATERIAL.md and DESIGN.md say how the UI looks, COMPONENTS.md says what it is built from, and WRITING.md says what it says. UI-UX.md says how it behaves and how a user finishes a task.
- Each rule then has one place. For a form, an agent finds the validation flow in UI-UX.md, the error text in WRITING.md, and the field size in MATERIAL.md.

### Why WCAG 2.2 AA

- Level AA is the level that accessibility laws and standards usually ask for. WCAG 2.2 keeps the 2.0 and 2.1 success criteria, except the removed 4.1.1 Parsing, and adds 9 new ones, so a 2.2 AA site also meets the 2.1 AA rules that older standards name ([What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)).
- Level AAA is not a goal for whole sites, so we take single AAA rules only where they cost little.
- Base UI handles focus, keyboard, and ARIA for composite widgets, and native HTML handles the rest. Most AA rules then come down to contrast, focus styles, labels, and error messages, which this file covers.
- The 48x48px MD3 target (see MATERIAL.md) already passes the AA target size of 24x24px (2.5.8).

### Why toasts with an action do not close on their own

- WCAG 2.2.1 (Timing Adjustable, level A) asks that the user can turn off, adjust, or extend a time limit. A toast with **Undo** that closes after 5 seconds is a time limit on the undo.
- The Base UI docs do not say that the toast timer pauses on hover or focus. `timeout: 0` keeps the toast open until the user closes it, so the undo has no time limit.
- A toast without an action only confirms a result. When it closes, the user loses nothing.

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

### Why micro frontends per app

- Each app is one vertical slice: its pages, API, data, and UI are in one folder. An agent can work on one app and read only that folder and the shared code.
- Apps cannot break each other: they do not import from each other and do not share tables.
- An app is easy to add or remove: one folder, one line in `astro.config`, and its bindings.
- We compose the apps at build time, with Astro integrations (`injectRoute`, `addMiddleware`). All apps run in one Worker, so a request has no extra hop, and all apps share one login, one layout, and one design system.
- Runtime composition (each app in its own Worker, joined by routes or service bindings) gives separate deploys, but each Worker needs its own copy of the auth and layout code. We keep it as the next step, not the start.
- The admin of an app is a native EmDash plugin in the same folder. It runs in the same Worker, so it can use the app repositories and bindings. Staff manage app data in the EmDash admin, with no second admin panel.
- Tested on 2026-10-14 with Astro 7.3 and `@astrojs/cloudflare`: injected pages, catch-all routes, app middleware, and grouped actions work in `wrangler dev`.
- Tested on 2026-10-14 with EmDash 1.2.0: a native plugin in `src/apps/app1/admin/` shows an admin page in the EmDash sidebar and reads `APP1_DB` through the app repository, in `astro dev` and in the production build with `wrangler dev`.

### When to split the app into a separate Worker

- The app needs Better Auth plugins that emdash-better-auth cannot load yet ([emdash-better-auth#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)).
- The app grows large, and EmDash upgrades or middleware start to slow it down.

## API

### Why OpenAPI is the contract

- One document describes each operation for every interface: API routes, React islands, external clients, agents, and MCP tools. Each interface reads the same shapes, so they cannot drift apart.
- Agents and external clients can read the contract at `/app1/api/openapi.json` and call the API with no other docs.
- Tools check the contract in CI: Redocly CLI lints it, and oasdiff finds breaking changes in a PR.

### Why each field has one purpose

- An agent or a client reads the name and the `description` and knows what to send. When `image` can be a path, a URL, or base64, each client must guess, and each server must detect the form.
- A field with one purpose has one narrow type, so the schema can validate it (`format`, `pattern`, `enum`).
- A new form of the same thing is a new field, which is not a breaking change. Changing the meaning of an existing field breaks clients without a type error.

### Why Zod is the source and not a hand-written YAML

- The stack uses Zod for all validation. When the API routes validate with the same schemas that generate the document, the contract and the code cannot differ.
- [zod-openapi](https://github.com/samchungy/zod-openapi) supports Zod 4 and reads the native `.meta()`, so schemas need no extra wrapper. Its only dependency is Zod, and it uses no `eval` or `new Function`.
- Alternative: [@asteasolutions/zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi) also supports Zod 4, has more downloads, and outputs OpenAPI 3.0, 3.1, and 3.2. It needs an `OpenAPIRegistry` and `extendZodWithOpenApi`. Use it when you must output OpenAPI 3.0 or 3.2.

### Why OpenAPI 3.1 and not 3.2

- OpenAPI 3.2.1 is the latest version (2026-09-10). zod-openapi documents only 3.1 output, and openapi-typescript documents 3.0 and 3.1.
- OpenAPI 3.1 uses JSON Schema 2020-12, the default target of `z.toJSONSchema()`.
- Check again when zod-openapi and openapi-typescript document 3.2.

### Why RFC 9457 problem details

- It is the IETF standard for HTTP API errors, and it replaces RFC 7807. Clients and tools know the `application/problem+json` shape.
- Extension members, such as `errors`, carry field errors without a second error format.

### Why API keys are not a Better Auth plugin

- The API key plugin is now the separate package `@better-auth/api-key`. emdash-better-auth cannot load server-side Better Auth plugins yet ([#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)).
- The API keys feature of emdash-better-auth is for staff, not for customers.

### Why JSON-only mutations

- Astro `security.checkOrigin` blocks cross-site form submissions. It does not check requests with `Content-Type: application/json`, because a browser sends a CORS preflight for them first.
- When API routes that use the session cookie accept only JSON, a cross-site page cannot send a mutation without a preflight, and the preflight fails without a CORS allow rule for that origin.

## Deploy

### Why two-step releases

- `wrangler versions upload` creates a version without traffic. `wrangler versions deploy` then splits traffic between two versions, so a bad release reaches only a small share of users.
- `wrangler rollback` moves traffic back to an older version without a new build.
- During a split, two versions of the code run at the same time and read the same D1 schema. A rollback does not undo a migration. So each migration must work with the new code and the old code (expand first, contract later).
- Durable Objects do not split this way: only one version of each Durable Object runs at a time. A Durable Object class change also blocks rollback.
- `wrangler secret put` creates a version and deploys it at once, so it skips the split. `wrangler versions secret put` keeps the secret inside the gradual release.

### Why Previews use staging databases

- A Preview gets its own variables, secrets, and Durable Object namespace, but it uses the same D1 database as production unless you bind a different one. A branch with a new migration could change production data.
- Version URLs use the bindings of their version, so they also read production data. Use them only for versions that are ready for production.

### Why three environments

- Dev is its own Worker with its own D1, KV, and R2. PRs and merges can change it freely, and it never touches prod data.
- Stage is not a separate Worker. Versions belong to one Worker, so a version uploaded to a stage Worker cannot be promoted to prod. A stage Worker forces a new build for prod, and then prod does not run the build that you tested. As a version of the prod Worker, stage reads prod data, so apply only migrations that work with the running prod code.
- Prod is the stage version after `wrangler versions deploy`. It gets traffic in steps (see Why two-step releases).
- This setup follows the Cloudflare deploy of the trendaro-fe project, which runs it in production.
- The Cloudflare docs do not say whether an alias moves to the newest upload when you reuse it. In trendaro-fe, `pr-<number>` serves the latest push of the PR. Check this on your first PR.

### Why date-based release tags

- A web app has no users who depend on a version number, so semver major, minor, and patch carry no meaning. A date shows how old a release is, which helps during a rollback and in logs.
- `rN` lets you release more than once a day without a time in the tag.
- The prefix is the Worker name, so each tag says which Worker it deploys. A generic prefix such as `web-` stops being clear when an app moves to its own Worker. That Worker then gets tags with its own name and its own tag trigger, for example `app1-*`, with no new rule.
- The tag trigger is `<worker>-[0-9]*`, not `<worker>-*`. Without `[0-9]`, the trigger `mysite-*` also matches the tags of a Worker named `mysite-app1`, and one tag would upload stage of both Workers.
- The trendaro-fe project uses the same format, for example `trendaro-2026-10-08-r2`.

### Why separate Workers share one hostname

- A path route such as `example.com/app1/*` keeps the app on the same host as the web Worker. The browser sends the same login cookie to both, so the user signs in once.
- Better Auth stores sessions in the database by default, and sets the session token as a signed cookie with `setSignedCookie` ([`cookies/index.ts`](https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/cookies/index.ts)). The app Worker needs the same secret and the same database to read the session.
- On `workers.dev`, each Worker has its own host, and a cookie does not cross hosts. So dev uses a route on a dev hostname, and the login is tested there, not on version URLs.
- A Worker on a path looks up static assets with the full path, so the files must be in an `app1/` folder in the assets directory. The Astro `base` option sets the URLs, and the Astro docs do not say that it also moves the output files. This setup has not been tested yet. Check the build output of the first split app.

### Why GitHub Actions and not Workers Builds

- GitHub Actions runs the full flow in one place: PR preview, dev deploy on merge, stage on a release tag, and a prod promotion that a GitHub environment can protect with required reviewers.
- Each step is a workflow file in the repository, so you can review and change it in a PR.
- With both connected, each push deploys twice.

### Why Wrangler and not cf

[`cf`](https://github.com/cloudflare/cf) is the new Cloudflare CLI for the whole Cloudflare API, built for agents. It gives JSON output, command search, a `cloudflare.config.ts` config, and Vite as the dev server. We do not use it yet:

- It is an open beta. The repository started on 2026-09-21, and the latest release on 2026-10-14 is `1.0.0-beta.17`.
- It has no rollback command. You must create a deployment by hand ([cf#106](https://github.com/cloudflare/cf/issues/106)).
- Secret commands are not safe yet. `secrets update` replaces all secrets, not one ([cf#96](https://github.com/cloudflare/cf/issues/96)), and `secrets bulk` can deploy an empty version to 100 % with no error ([cf#201](https://github.com/cloudflare/cf/issues/201)).
- D1 has gaps: there is no `d1 export` ([cf#199](https://github.com/cloudflare/cf/issues/199)), and `d1 migrations apply --local` does not exit in a non-TTY pipe ([cf#64](https://github.com/cloudflare/cf/issues/64)).
- CI support is not complete: `cf previews deploy` does not give Workers Builds the Preview URL ([cf#185](https://github.com/cloudflare/cf/issues/185)), and there is no GitHub Action ([cf#138](https://github.com/cloudflare/cf/issues/138)).
- It has no replacement for `wrangler tail` ([cf#68](https://github.com/cloudflare/cf/issues/68)).
- Check again when `cf` reaches 1.0 and these issues are closed.
