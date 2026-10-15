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
- Local dev: `astro dev` and `astro preview` run the same runtime (workerd) on your machine.
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
- MD3 state layers and the focus indicator set only an opacity and a size, not a color. They work with the Fulldev UI theme and give all components one hover, focus, pressed, and disabled style. The values come from the `md.sys.state` tokens in [material-web](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-state.scss).
- MD3 motion sets timing, not a look. One set of easing curves and durations makes all animations feel the same, and it is the set that the MD3 components use.
- We follow MD3 Expressive where it changes a size, because the button sizes (XS to XL) are already Expressive. The `latest` tokens in material-web are still baseline MD3, so the Expressive values come from the generated Jetpack Compose tokens ([androidx `material3/tokens`](https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens)) and the "M3 Expressive styles" sections of the [MDC-Android docs](https://github.com/material-components/material-components-android/tree/master/docs/components). Flutter does not implement MD3 Expressive ([flutter#168813](https://github.com/flutter/flutter/issues/168813)).
- MD3 dynamic color builds the whole light and dark theme from one seed color. [material-color-utilities](https://github.com/material-foundation/material-color-utilities) picks the tones in the HCT color space, so each role pair, such as `primary` and `onPrimary`, has a planned contrast. A theme picked by hand has no such system.
- We use `SchemeTonalSpot`, which the library calls "the default Material You theme on Android 12 and 13", with the 2025 spec. The library describes `SchemeExpressive` as "intentionally detached from the source color", so a brand color would not stay the brand color.
- The mapping to shadcn/ui variables comes from the MD3 component tokens in material-web, for example a menu container is `surface-container`, a dialog is `surface-container-high`, and the focus indicator is `secondary`. [material-shadcn](https://github.com/sazzad-sat/material-shadcn) maps MD3 roles to shadcn/ui in a similar way. We did not take its `--accent`, `--input`, and chart mappings: they use fixed palette tones, not MD3 roles, or its source and output disagree.
- CSS has no spring easing. The fast spatial spring comes as a `linear()` curve from the experimental Expressive web components in material-web ([`labs/gb`](https://github.com/material-components/material-web/tree/main/labs/gb)). We found no official web curve for the default and slow springs, so we use the duration and easing tokens for longer animations.
- The 48x48 target is bigger than the WCAG 2.2 target sizes (24x24px for AA in 2.5.8, 44x44px for AAA in 2.5.5), so it passes both.
- At Google I/O 2026 (May 19, 2026), Material added the Expressive layout scaffold and the new 8dp spacing system. The breakpoints page lists five breakpoints, with large and extra-large for desktop ([What's new at I/O 2026](https://m3.material.io/blog/whats-new-at-io26)).

### Why menu items are 48px and chip rows have 16px between them

- The Expressive segmented menu item is 44px, but the Targets rule needs a 48px target, and stacked items cannot extend their targets into each other. The Compose standard menu item is 48dp (`MenuListItemContainerHeight`).
- MDC chips are 32dp with a 48dp minimum touch target. Rows need 16px between them so the hit areas do not overlap.

### What we do not take

- We do not take the MD3 type and shapes. The fonts and the radius come from the Fulldev UI theme.
- We do not take the MD3 color role names in components. The roles fill the shadcn/ui variables, so Fulldev UI and shadcn/ui components work without changes.
- We do not take the MD3 Expressive shape morph (a corner that changes on press or select). It changes the radius, which the theme owns.
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

### Why the theme lives in `localStorage`

- The CDN caches public pages, so a cookie-based server render would serve the theme of one user to others. The server also cannot know `prefers-color-scheme`.
- A blocking script in `<head>` sets `.dark` before the first paint, so there is no flash of the wrong theme.

### Why the theme script has a CSP hash

- Astro's CSP hashes only the scripts that it processes. It does not hash `is:inline` scripts (tested with Astro 7.3.8), so the one allowed inline script needs its hash in `csp.scriptDirective.hashes`.

### Why a session flash message

- A toast needs an island. A session survives the POST, redirect, GET cycle on the server.
- A cached public page must not read the session, or it would show the message of one visitor to another.

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

### Why the plan is per organization and `premium` is per user

- Billing belongs to the organization, so the plan is stored for the organization.
- The content gate checks the user, so the `premium` flag is per user. Billing code syncs the flag to the members.

### Why Creem webhooks need an event ID guard

- Creem signs the payload but gives no timestamp for replay checks, and it retries the same event (up to 5 times in 24 hours).
- The `evt_` ID is the only duplicate guard, so store it with a unique constraint.

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

### Why no D1 jurisdiction

- GDPR does not require storage in the EU. It allows a transfer to the United States under an adequacy decision (Article 45) or with safeguards such as Standard Contractual Clauses (Article 46).
- Cloudflare is certified under the EU-U.S. Data Privacy Framework, and its DPA includes the EU Standard Contractual Clauses.
- A database without a jurisdiction needs only a location hint, and the Worker can run near it with Targeted Placement.

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

- The EmDash integration sets Astro `security.checkOrigin` to `false`, and the user config cannot turn it on. Nothing checks cross-site form posts to app routes and Actions unless the app middleware does. The middleware compares `Origin` with `context.url.origin` for all unsafe methods (tested: cross-origin `text/plain` and form posts get `403`).
- A browser sends a CORS preflight for a JSON request, so JSON-only mutations add a second layer.
- When API routes that use the session cookie accept only JSON, a cross-site page cannot send a mutation without a preflight, and the preflight fails without a CORS allow rule for that origin.

### Why API keys take the tenant from the key row

- The key row is the only trusted source of the tenant. A `tenant_id` from the request would let one customer read the data of another customer.

### Why the media type check is not a strict string match

- `Content-Type` often carries `; charset=utf-8`, so a strict string match rejects valid JSON.
- A `DELETE` without a body has no media type to check.

## Deploy

### Why two-step releases

- `wrangler versions upload` creates a version without traffic. `wrangler versions deploy` then splits traffic between two versions, so a bad release reaches only a small share of users.
- `wrangler rollback` moves traffic back to an older version without a new build.
- During a split, two versions of the code run at the same time and read the same D1 schema. A rollback does not undo a migration. So each migration must work with the new code and the old code (expand first, contract later).
- Durable Objects do not split this way: only one version of each Durable Object runs at a time. A Durable Object class change also blocks rollback.
- `wrangler secret put` creates a version and deploys it at once, so it skips the split. `wrangler versions secret put` keeps the secret inside the gradual release.

### Why Previews use the dev databases

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

- GitHub Actions runs the full flow in one place: PR preview, dev deploy on each push to `main`, stage on a release tag, and a prod promotion that a GitHub environment can protect with required reviewers.
- Each step is a workflow file in the repository, so you can review and change it in a PR.
- With both connected, each push deploys twice.

### Why the CI deploy flow is built this way

- The dev deploy runs on `push` to `main`, not on a `pull_request` `closed` event. GitHub passes no secrets to runs that a fork triggers, and a direct push to `main` would not run the old trigger.
- PR previews and the dev deploy use `cancel-in-progress: false`. A cancelled `emdash migrate` leaves the D1 migration lock held. A newer pending run replaces an older pending run, which is safe because each run applies all pending migrations of its commit.
- Stage runs in the `production` GitHub environment, because the tag push applies migrations to the production database before any promotion approval.
- There are two Cloudflare tokens, and only approved jobs can read the production token. Cloudflare tokens cannot be scoped to one Worker, so the separation is by approval, not by resource.
- `wrangler versions secret put` changes the latest uploaded version. A secret change after the stage upload creates a version that the release tag does not point to.

### Why Wrangler and not cf

[`cf`](https://github.com/cloudflare/cf) is the new Cloudflare CLI for the whole Cloudflare API, built for agents. It gives JSON output, command search, a `cloudflare.config.ts` config, and Vite as the dev server. We do not use it yet:

- It is an open beta. The repository started on 2026-09-21, and the latest release on 2026-10-14 is `1.0.0-beta.17`.
- It has no rollback command. You must create a deployment by hand ([cf#106](https://github.com/cloudflare/cf/issues/106)).
- Secret commands are not safe yet. `secrets update` replaces all secrets, not one ([cf#96](https://github.com/cloudflare/cf/issues/96)), and `secrets bulk` can deploy an empty version to 100 % with no error ([cf#201](https://github.com/cloudflare/cf/issues/201)).
- D1 has gaps: there is no `d1 export` ([cf#199](https://github.com/cloudflare/cf/issues/199)), and `d1 migrations apply --local` does not exit in a non-TTY pipe ([cf#64](https://github.com/cloudflare/cf/issues/64)).
- CI support is not complete: `cf previews deploy` does not give Workers Builds the Preview URL ([cf#185](https://github.com/cloudflare/cf/issues/185)), and there is no GitHub Action ([cf#138](https://github.com/cloudflare/cf/issues/138)).
- It has no replacement for `wrangler tail` ([cf#68](https://github.com/cloudflare/cf/issues/68)).
- Check again when `cf` reaches 1.0 and these issues are closed.

## Testing

### Why ARIA snapshots and not DOM snapshots

- A DOM snapshot stores the full markup with all Tailwind classes. A change of one class, for example `px-4` to `px-5`, fails the test, and the reviewer must read the markup to find out whether anything that a user sees has changed.
- An ARIA snapshot stores only the accessibility tree: roles, names, and states. It fails when a label, a role, or a heading level changes, which DOM snapshots miss.
- trendaro-fe (qset v4) uses `toMatchSnapshot()` on the DOM of each story, through `composeStories()` in jsdom.
- In Vitest, ARIA snapshots are experimental (Vitest 4.1.4+, per the docs). In Playwright, they are stable.
- In Vitest, ARIA snapshots work only in browser mode. Tested on 2026-10-14: in happy-dom, `toMatchAriaSnapshot()` fails with `Invalid Chai property` in Vitest 4.1.11 and 5.0.4. The matcher lives in `@vitest/browser` (`packages/browser/src/client/tester/aria.ts`).
- Tested on 2026-10-14 in Vitest 4.1.11 browser mode: a React story rendered with `composeStories()` from `@storybook/react` and `await Story.run()` gives `- button "Increment": "1"`, so the `play` function runs first. In a `play` function, `expect` from `storybook/test` has no ARIA matchers (`Invalid Chai property`).
- Astro stories cannot use Vitest ARIA snapshots: `renderStory()` needs the Vitest config of Storybook Astro, which fails in browser mode (`Module "module" has been externalized for browser compatibility`). Astro components use `screen.getByRole()` queries in happy-dom, and pages use Playwright ARIA snapshots.

### Why one tool for screenshots

- Vitest `toMatchScreenshot()` needs browser mode, and Astro stories cannot render in browser mode (see above). It would cover only React islands.
- Playwright takes screenshots of every story in the built Storybook (`iframe.html?id=<story-id>&viewMode=story`) and of full pages on `astro preview`. Tested on 2026-10-14 with Playwright 1.64.1 and Storybook Astro 1.12.0: an Astro story and a React story both give stable baselines.
- One tool gives one baseline format, one update command, and one CI workflow.

### Why baselines come only from CI

- Screenshots depend on the OS, the browser build, the GPU, and the fonts. The Playwright docs say: "For consistent screenshots, run tests in the same environment where the baseline screenshots were generated."
- trendaro-fe (qset v4) creates baselines on a local machine and compares them on `ubuntu-latest`. It needs a tolerance of `maxDiffPixelRatio: 0.03` to absorb the difference. Such a tolerance also hides small real changes.
- A manual CI workflow that runs `playwright test --update-snapshots` gives baselines that match CI, so the tolerance can stay low.

### Why PNG baselines in git

- Git LFS on GitHub Free includes 10 GiB of storage and 10 GiB of bandwidth a month, and each Git LFS download in GitHub Actions uses bandwidth. Without a payment method, GitHub turns off Git LFS until the next month when you go over, and CI then gets pointer files instead of images.
- trendaro-fe stores its screenshots in Git LFS and has a build check that fails when a fixture is still a Git LFS pointer.
- Lossless WebP does not help with Playwright. Tested on 2026-10-14 with Playwright 1.64.1 (`type: 'webp'`): 20 qset v4 screenshots at 1280 x 720 took 2.35 MB as WebP and 2.62 MB as PNG (10 % less). Two small story screenshots took 14 KB each as WebP and 1 to 2 KB as PNG.
- The size depends on the pixel area. A screenshot of `#storybook-root` instead of the full viewport was about half the size in the same test (991 B instead of 1,998 B).
- GitHub blocks files over 100 MiB and recommends repositories under 1 GB. Small PNG files of components stay far below these limits.
- `.snap` files are text, so they also stay in git, and the PR shows a readable diff.

### Why Storybook Astro

- Storybook does not support Astro officially. Astro is not on the list of supported frameworks.
- [`@storybook-astro/framework`](https://github.com/storybook-astro/storybook-astro) is a community framework. Version 1.12.0 supports Astro 5, 6, and 7 and Storybook 10. It renders `.astro` components with the Astro Container API and renders React islands next to them, so one Storybook covers the whole UI.
- Portable stories (`composeStories()`, `renderStory()`) let tests reuse the states from the stories, as qset v4 does with `composeStories()` for React.
- The Storybook Test addon works with Astro since version 1.11.0 ([PR #174](https://github.com/storybook-astro/storybook-astro/pull/174), released on 2026-08-27). The project roadmap still lists it as unreleased.

### Storybook Astro, tested locally

Tested on 2026-10-14 in a temporary project with Astro 7.3.8, `@astrojs/cloudflare` 14.3.4, `@astrojs/react` 6.0.6, React 19.3.1, Storybook 10.6.2, `@storybook-astro/framework` 1.12.0, Vitest 4.1.11, and Playwright 1.64.1:

- `storybook build` and `storybook dev --smoke-test` work with the Cloudflare adapter in `astro.config.mjs`. The build prints a non-fatal `Failed to create the dev server app: transport was disconnected` error.
- `@astrojs/react` 7.x fails to install with `ERESOLVE`: the peer range of the framework is `^4.2.3 || ^5.0.0 || ^6.0.0`.
- `storybook build` fails without `@storybook/react` (`failed to resolve import "@storybook/react/entry-preview"`). The README install line does not list it.
- A React story needs `parameters: { renderer: 'react' }`. The docs show `renderer: '@storybook/react'`, which fails with `Renderer '@storybook/react' not found. Available renderers: react`.
- `renderStory()` renders only Astro components. A React story fails with `Story meta.component must be an Astro component factory`.
- In browser mode, npm hoisted the 3.2.4 copies of `@vitest/expect`, `@vitest/spy`, `@vitest/utils`, and `@vitest/pretty-format` that Storybook depends on, and the tests failed with missing exports (`createDOMElementFilter`, `ChaiStyleAssertions`). Installing them at the Vitest version fixed it.
- `@storybook/addon-vitest` ran the Card smoke test and the Counter `play` function in Chromium. A wrong expected value made the `play` function fail, so the test really runs.
- Upstream issues from this test: [#191](https://github.com/storybook-astro/storybook-astro/issues/191) (docs: renderer value, install line, fonts note, roadmap status), [#192](https://github.com/storybook-astro/storybook-astro/issues/192) (`@astrojs/react` 7), and [#193](https://github.com/storybook-astro/storybook-astro/issues/193) (Vitest 5). When one is fixed, update the matching rule in [TESTING.md](rules/TESTING.md) or [DEPS.md](rules/DEPS.md).

### Risks of Storybook Astro

- The project is in active development, and its APIs can change between releases.
- Its peer dependencies block Vitest 5 (`vitest ^4.1.0`) and `@astrojs/react` 7.
- In static builds, Controls do not change the args of Astro stories.
- `npm create storybook` does not detect Astro, so the setup is manual.
- `renderMode: 'server'` needs a Node.js server. Static mode needs no server.
- Function args do not work in Astro stories, and `astro:assets` imports do not resolve in stories.
- `@testing-library/user-event` is not reliable in happy-dom, so interaction tests run in a real browser.
- The Astro Container API does not run `<script>` tags, so client scripts need Playwright.
- The npm package `storybook-astro` is a different project.

### Astro fonts in Storybook

Storybook Astro does not serve fonts the same way as the site. This is from the source of `vitePluginAstroFonts.ts` in version 1.12.0, and from the roadmap:

- It reads the font families from `fonts` in `astro.config.*` and calls each provider (Google, Bunny, Fontsource, local) to get `@font-face` data.
- It writes `@font-face` rules with the remote URLs that the provider returns. It does not copy the font files into the Storybook build, as `astro build` does.
- It does not add preload links, and it does not create the Capsize fallback metrics. Before the font loads, the fallback font has different sizes from the site font, so the layout can shift.
- The runtime API is a stub: `fontData` is `{}`, and `experimental_getFontFileURL()` returns `undefined`.
- When a provider fails, it logs a warning and skips the family. The story then renders with the fallback font, and no test fails.

What this means for tests:

- A screenshot test of a story needs network access to the font provider. trendaro-fe blocks all external requests in screenshot tests, so its screenshots never use the web font.
- A story screenshot can differ from the real page. Take screenshots of full pages with Playwright against `astro preview`, which serves the built font files.

### Why Vitest 4.1 and not Vitest 5

- `@storybook-astro/framework` 1.12.0 accepts only `vitest ^4.1.0`. `@cloudflare/vitest-plugin` 1.4.2 and `@storybook/addon-vitest` 10.6.2 also accept Vitest 5.
- `@effect/vitest` 4.x needs Vitest 5 (`>=5.0.0 <6.0.0`), so it cannot run next to Storybook Astro. Until Storybook Astro supports Vitest 5, tests run Effect code with `Effect.runPromise()`.

### Why `@cloudflare/vitest-plugin`

- `@cloudflare/vitest-pool-workers` is deprecated on npm: "has been renamed to @cloudflare/vitest-plugin. This package will not receive future updates."
- The plugin runs tests in workerd with real D1, KV, and R2 bindings from the Wrangler config.
- Storage is isolated per test file, not per test. `reset()` from `cloudflare:test` deletes all data from all bindings.
- The D1 setup follows the [`d1` fixture](https://github.com/cloudflare/workers-sdk/tree/main/fixtures/vitest-plugin-examples/d1) in `workers-sdk`: `readD1Migrations()` in the config, and `applyD1Migrations()` in a setup file. It applies only migrations that are not applied yet, so the setup file can run more than once.

### Why tests use `wrangler.test.jsonc`

- With the project `wrangler.jsonc`, `main` is `src/worker.ts`. The plugin loads it with the Astro handler and fails with `Cannot find package 'virtual:astro-cloudflare:config'`. A copy without `main` and `triggers` loads only the bindings.
- `reset()` drops the tables too, so tests apply the migrations in `beforeEach()`.

### Why Istanbul coverage and not V8

- The Workers Vitest plugin runs tests in workerd, which does not expose V8 coverage. The Cloudflare docs list V8 coverage as a known issue and say to use Istanbul.
- Coverage thresholds apply only when coverage runs, so the `test` script passes `--coverage`.

### Why the manual workflow also runs `vitest -u`

- Vitest writes no new snapshots when `CI` is set, and a missing snapshot fails the run.
- Only a manual `vitest run -u` creates the ARIA `.snap` files, in the same workflow that updates the Playwright baselines.

### Why Knip entry globs are not an ignore list

- Pages, middleware, and admin plugin files are registered by path or URL (`injectRoute()`, `addMiddleware()`, `adminEntry`), so no import reaches them.
- An entry glob says that the file is used and still lets Knip report unused exports and dependencies. An ignore list hides the file from Knip.

### Why the signup end-to-end test runs against `astro dev`

- The EmDash console email provider and `/_emdash/api/dev/emails` exist only in `astro dev`.
- A production build has no email capture, so `astro preview` cannot read the verification link.

### What Starweb takes from qset v4

trendaro-fe (qset v4) has four test tiers for each widget: unit tests, DOM snapshots, end-to-end tests, and screenshots. All of them use the stories as the source of states. Starweb keeps this idea and changes these things:

- ARIA snapshots and role queries instead of DOM snapshots.
- Baselines from CI instead of from a local machine.
- Baselines in git instead of Git LFS.
- Storybook Astro, so stories also cover `.astro` components.

## Dependencies

### Why Dependabot and not Renovate

Dependabot is part of GitHub, so there is no third-party app to install and trust. The Renovate GitHub App needs read and write access to code, pull requests, issues, checks, commit statuses, and workflows, per the [Renovate permissions docs](https://docs.renovatebot.com/security-and-permissions/).

Dependabot covers what the rules in [DEPS.md](rules/DEPS.md) need:

- **Wait for new releases:** `cooldown` delays version updates. The default is 3 days, even without the option. Security updates do not wait.
- **Hold back a version:** `ignore` with `dependency-name` and `versions`. `dependency-name` accepts `*`.
- **Groups:** `groups` with `patterns` (with `*`), `dependency-type`, and `update-types`. One group gives one PR.
- **GitHub Actions:** Dependabot updates actions that are pinned to a commit SHA, and the version comment after it. This is in `version_commenter.rb` in [dependabot-core](https://github.com/dependabot/dependabot-core/tree/main/github_actions/lib/dependabot/github_actions/file_updater/workflow_updater). It does not change a tag to a SHA, so you pin each action once by hand.
- **Security updates:** Dependabot opens PRs for vulnerable packages outside the schedule.

What Dependabot does not have, and what the rules do instead:

- **No automerge option.** A GitHub Actions workflow reads the PR with `dependabot/fetch-metadata` and runs `gh pr merge --auto`, as in the [Dependabot automerge guide](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automate-dependabot-with-actions). The workflow is one more file to maintain, and it runs with write permissions.
- **No lockfile maintenance.** Renovate `lockFileMaintenance` deletes the lockfile and runs npm again. Dependabot `versioning-strategy: lockfile-only` only skips updates that need a change in `package.json`. The rules use a monthly `npm update` PR instead.
- **No Dependency Dashboard.** The open Dependabot PRs show the pending updates, but not the updates that `cooldown` holds back. Per the [Renovate bot comparison](https://docs.renovatebot.com/bot-comparison/), Dependabot has no similar feature.
- **No preset monorepo groups.** Renovate `config:recommended` includes `group:monorepos`. With Dependabot, you write each group, for example the `astro` group.
- **One schedule per ecosystem.** Renovate can set a schedule for one package. Dependabot sets `schedule` per entry in `updates`.

Checked on 2026-10-15 in the [Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference) and the `fetch-metadata` README (v3.1.0). A `dependabot.yml` with `cooldown`, two groups, and three `ignore` items passes `check-jsonschema --builtin-schema vendor.dependabot`, and the check rejects a misspelled `cooldown` key.

### Why Dependabot holds back Vitest 5 and `@astrojs/react` 7

- `@storybook-astro/framework` 1.12.0 accepts only `vitest ^4.1.0` and `@astrojs/react ^4.2.3 || ^5.0.0 || ^6.0.0`. Read [Why Vitest 4.1 and not Vitest 5](#why-vitest-41-and-not-vitest-5).
- Without `ignore`, Dependabot opens major update PRs for these packages, and `@astrojs/react` 7 would arrive in the `astro` group PR. A local install of `@astrojs/react` 7 next to Storybook Astro failed with `ERESOLVE`.
- Upstream issues: [#192](https://github.com/storybook-astro/storybook-astro/issues/192) (`@astrojs/react` 7) and [#193](https://github.com/storybook-astro/storybook-astro/issues/193) (Vitest 5). Remove the `ignore` items when they are fixed.

## Architecture

### Why `decode` returns a typed error

- `decode` returns a typed `ValidationError` instead of throwing, so Effect code keeps validation failures in the error channel.

### Why `z.compile()` is not used

- `z.compile()` does not fail on Workers. `new Function()` throws `EvalError` in workerd, and Zod catches it and falls back to the runtime parser. The code works but is slower, so the problem is silent. `zod-compiler` generates the code at build time.

### Why Queues need a dead letter queue and per-message `ack()`

- Without a dead letter queue, messages that reach `max_retries` are deleted for good.
- Queues deliver at least once, so consumers must be idempotent.
- Throwing in a batch handler retries the whole batch, so use per-message `ack()` and `retry()`.
- Queue bindings are not inherited by `env.production`.

## Data

### Why one migration system

- Two systems (SQL files and the Kysely `Migrator`) can disagree about which migrations ran. `wrangler d1 migrations apply` is the one that CI and DEPLOY.md use.

### Why D1 queries stay small

- D1 allows 100 bound parameters per query and 100 KB per statement. A `where in` list or a multi-row insert fails above that, so code must split it.
- Per-row queries (N+1) add one round trip each.

### Why export D1 as well as use Time Travel

- Time Travel keeps 7 days (Free) or 30 days (Paid). Exports give a longer history and a copy that you control.
- Exports hold personal data, so they stay out of git.
- A running export blocks other requests, so run it off-peak.

## Security

### Why one CSP module

- Each feature that adds its own CSP directive can overwrite the others. Astro's `scriptDirective.resources` replaces the defaults and drops `'self'` unless you list it.
- A `connect-src` without `'self'` blocks the same-origin `fetch` calls of islands.
- One module with each directive once avoids both problems.

### Why the middleware does not set the CSP header

- Astro 7 sends the `security.csp` policy as an HTTP header on pages that the Worker renders, and as a `<meta>` element on prerendered pages.
- A `headers.set("Content-Security-Policy", ...)` in the middleware replaces the Astro header, and the page loses its `script-src` policy (observed in a test).
- Browsers ignore `frame-ancestors` in a `<meta>` element. So on-demand pages get it from `csp.directives`, and prerendered pages get it from `public/_headers`.
- `_headers` is a static file and cannot import `headers.ts`, so `scripts/write-headers.ts` writes it before the build.
- Test: use `curl -I` for the header and a `securitypolicyviolation` listener to prove that the browser enforces it. The browser console may not show violations.

### Why check the dev-bypass routes in production

- EmDash allows the dev-bypass routes only when `import.meta.env.DEV` is true. They create an admin user and a session.
- A build that ships the dev flag would give admin access without a passkey. A post-deploy 403 check catches that.

### Why Turnstile loads only on form pages

- Turnstile is a third-party script, and PRIVACY.md forbids those before consent. Limiting it to pages with a protected form keeps the exception small.
- The legal basis is the Cloudflare Turnstile Privacy Addendum, not EDPB guidance.

### Why `.env` locally and Worker secrets in production

- Wrangler and the Cloudflare Vite plugin load `.env` into the Worker `env` in local development, but only when no `.dev.vars` file exists.
- The emdash-better-auth README says that `.env` is not available to the deployed Worker, so production needs a real Worker secret. Set it with `wrangler versions secret put` (see DEPLOY.md).

## Observability

### Why Sentry wraps `src/worker.ts`

- The Sentry Astro guide points `main` at `sentry.server.config.ts` with the plain Astro handler. That drops the scheduled publishing and cache purge of EmDash, and the Workflow, Durable Object, and queue exports.
- `withSentry` instruments the handler object that you pass (`fetch`, `scheduled`, `email`, `queue`, `tail`), so one wrapper in `src/worker.ts` covers all of them.

### Why only client source maps are deleted

- Wrangler finds server source maps only through their `sourceMappingURL` comments. When `sourcemap` is not set, the `sentry()` integration builds `hidden` maps, which have no comment, so Wrangler finds none.
- The default deletion of `sentry()` also removes the maps in `dist/server`, which Wrangler needs when it uploads the version. So the build sets `sourcemap: true`, and Sentry deletes only the maps in `dist/client`, which would otherwise be public.

### Why a build without the Sentry token loses client maps

- The deletion of `./dist/client/**/*.map` runs even when the upload is skipped (no `SENTRY_AUTH_TOKEN`). The client files keep their `sourceMappingURL` comment, so DevTools reports missing maps.
- Wrangler does not warn when a server file has no `sourceMappingURL`: it uploads no map. So the rules ask for a check that `dist/server/entry.mjs` ends with `//# sourceMappingURL=entry.mjs.map`.
- The browser cannot read `env.SENTRY_DSN`, so the client config reads `PUBLIC_SENTRY_DSN` from `.env` at build time.

## Quality

### Why `exactOptionalPropertyTypes` stays on

- The flag catches real mismatches with the EmDash types: `cursor` and `currentLocale` must be absent, not `undefined`. So fix the starter code and keep the flag.

### Why Prettier has no `useTabs`

- The starter is not formatted with Prettier (line width and other rules), so `useTabs` alone leaves 9 of 11 starter files failing (tested). One `prettier . --write` after setup is simpler.

### Why Knip has named exceptions

- Installed components export their full API, and the rules install some packages before any code uses them. Named `ignoreIssues`, `ignore`, and `ignoreDependencies` entries keep real unused code visible.

### Why `strictTypeChecked` is scoped to `.ts` files

- The type-checked preset sets the typescript-eslint parser. Unscoped, it replaces the Astro parser and fails on every `.astro` file with `Parsing error: Expression expected`.

## Email

### Why auth emails do not use the Queue

- emdash-better-auth passes each email to the EmDash email pipeline, which sends it through the active provider plugin.
- App emails use your own module and a Queue, so failed sends retry.

## Setup

### Why a template, setup.mjs, and CI

- A list of 60 manual steps gave a different result each time: an agent could skip a step, change a version, or copy a config with a mistake. Files in `template/files/` are the same each time and carry the config that a test project proved.
- `template/package.json` pins every version, including the `create-emdash` version. So the starter and the added packages are the ones that were tested together, and not the newest ones of the day.
- `template/package.json` also pins `shadcn`, so that `shadcn init` runs at a tested version and not at `@latest`. `setup.mjs` does not add `shadcn` (or `create-emdash`) to the project: a devDependency that no code uses fails Knip before Fulldev UI is installed. The init adds `shadcn` to the project.
- `scripts/setup.mjs` does the mechanical part: it copies the files, patches the starter files, merges the pinned versions, and installs. The manual steps in [SETUP.md](rules/SETUP.md) keep only the work that needs a decision or an account: Cloudflare, optional features, and deploy.
- The patches of starter files use exact string replacements. When a new starter version changes a patched text, `setup.mjs` stops with `Starter changed` and names the file, so the change fails loudly and does not leave a half-patched project. A fuzzy match could patch the wrong place without a sign.
- The starter lockfile can pin versions that are younger than `min-release-age`, so `setup.mjs` deletes it and installs again with the new `.npmrc`.
- CI runs `scripts/test-template.sh` on each change to `template/`, `scripts/`, or `rules/`, and every Monday. The script creates the pinned starter, runs `setup.mjs`, and runs `npm run check`, `npm run build`, and `npm run preview` with checks of the responses. The weekly run finds a change in the starter or in a registry package that no commit in this repository caused.
- Dependabot groups the whole template in one group, `stack`, in the Starweb repository. One PR updates the set, and one CI run tests the set together. Separate PRs would test each package alone, and a pair that must match (for example `astro` and `@astrojs/cloudflare`) could fail in both.
- The project `dependabot.yml` in `template/files/` uses the groups from [DEPS.md](rules/DEPS.md), because a project has its own review flow.

### Why update.mjs uses a three-way merge

- A project changes its copies of the Starweb files: it edits `rules/`, adds lines to `AGENTS.md`, and changes the template files. A plain copy of the new Starweb files would erase these changes.
- A base from the commit that `.starweb.json` records separates the Starweb changes (base to the new Starweb version) from the project changes (base to the project file). `git merge-file` applies both, and marks a conflict only when both changed the same lines.
- A file that the project did not change gets the new Starweb version. A file that Starweb did not change stays as it is.
- The script only reports a file that Starweb deleted. The project may still use it, and a wrong delete loses work.
- The script keeps a package version or a script that the project changed, and reports it. The project may hold a version back for a reason.
- The starter files that `setup.mjs` patched are not in the merge. They belong to the project after setup.

## Performance

### Why field data over lab data

- web.dev says: "Only field measurement can accurately capture the complete picture."
- Lighthouse cannot measure INP, because no real user interacts with the page.

## Internationalization

### Why branch on `isPrerendered`

- `setLocale()` with the `globalVariable` strategy sets one variable per isolate. Concurrent on-demand requests share it, so a request can render in the locale of another request. The Paraglide docs warn about cross-request issues with `globalVariable`.
- `paraglideMiddleware()` isolates each request with AsyncLocalStorage, which Workers support.

### Why `prefixDefaultLocale` stays `false`

- A test showed that `prefixDefaultLocale: true` does not break `/_emdash/admin` (302 to the setup, then 200). `false` stays the default because it gives shorter URLs for the default locale.

### Why `next()` takes no argument

- The request in the callback has the locale prefix removed. Astro treats `next(request)` as a rewrite, so the locale folders in `src/pages/` would be skipped.

## SEO

### Why custom pages pass a canonical URL

- `<EmDashHead>` writes `rel="canonical"` and `og:url` only when the page context or the entry gives a canonical URL.
- Without it, custom pages have neither, and a hand-written link next to it would duplicate it.
