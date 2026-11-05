# ✨ Starweb

Starweb is a template for AI agents. Use it to build websites and web apps.
It is built on [Astro](https://astro.build) and
[Cloudflare Workers](https://workers.cloudflare.com), with [EmDash](https://docs.emdashcms.com/) as the CMS. Read [why we chose this stack](WHY.md).

## 🏁 Quick start

To set up a new project, give this prompt to your AI agent (Claude Code, Codex, Gemini CLI, or another agent):

```text
Set up a new Starweb project named my-site. Clone https://github.com/arinhubcom/starweb into a folder outside the project, for example ~/starweb, and keep it: setup.mjs reads it, and update.mjs needs it later. Do not use a temporary folder. Read AGENTS.md and rules/SETUP.md there. Run scripts/setup.mjs on the new project folder, then do the remaining steps in rules/SETUP.md in order. After each step, check the result. If a step fails, stop and report the error.
```

Replace `my-site` with your project name.

The steps are in [rules/SETUP.md](rules/SETUP.md). The [template/](template/) folder holds the `create-emdash` output with the Starweb changes in place, Fulldev UI, `package.json`, the lockfile, and the tested configs. The new project takes it over: the script [scripts/setup.mjs](scripts/setup.mjs) copies the folder to the project root and writes a new encryption key. The rules hold decisions, not install commands. Each EmDash update runs `create-emdash` again: [scripts/update-starter.mjs](scripts/update-starter.mjs) merges the new output into `template/`, and [starter/](starter/) keeps the last output as the merge base. See the steps in [rules/UPDATE.md](rules/UPDATE.md#emdash-update). CI tests the template every week. Read [why](WHY.md#why-a-template-setupmjs-and-ci).

## 🔄 Update a project

When Starweb has new rules or a better template, ask your AI agent in the project to update Starweb. The `starweb-update` skill finds your Starweb clone, pulls it, and follows the newest steps.

The steps are in [rules/UPDATE.md](rules/UPDATE.md). The script [scripts/update.mjs](scripts/update.mjs) merges the new rules and template files with your changes, and lists the rules that changed.

## 🏗️ Architecture

The diagram shows the main parts of a Starweb project and the main advantage of each part.

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb architecture and its main advantages
    accDescr: An AI agent uses the Starweb template to build and deploy one Cloudflare Worker. Requests from people go to the Cloudflare CDN. A cache hit returns without running the Worker. Other requests run the Worker, which holds Astro, EmDash CMS, and your apps. The Worker uses built-in data services through bindings. Astro and EmDash can also run on Node.js.

    Agent["AI agent"] -->|"Reads the rules<br/>and runs setup"| Template["Starweb template<br/>Rules for agents<br/>CI tests the files every week"]
    Template -->|"Gradual deployments<br/>and instant rollback"| Worker

    People["Visitors, app users,<br/>and editors"] --> CDN["Cloudflare CDN<br/>A cache hit does not<br/>run the Worker"]
    CDN -->|"Cache miss or<br/>dynamic request"| Worker

    subgraph Worker["One Cloudflare Worker"]
        Runtime["Workers runtime<br/>No slow cold starts<br/>Free plan to start"]
        Astro["Astro<br/>Zero JavaScript by default<br/>Islands for interactive parts"]
        EmDash["EmDash CMS<br/>Admin panel, live content,<br/>sandboxed plugins,<br/>and MCP server"]
        Apps["Your apps and API routes<br/>Login, 2FA, organizations,<br/>and Stripe billing"]
    end

    Worker -->|"Bindings"| Data["Built-in data services<br/>D1, R2, KV, Queues,<br/>Durable Objects,<br/>and Workers AI"]
    Worker -.->|"Fallback"| Node["Node.js<br/>Astro and EmDash<br/>also run here"]
```

### Platform services

The diagram shows the services that a deployed Starweb project uses on Cloudflare, on GitHub, and outside both. Solid lines lead to services that every project uses. Dashed lines lead to services that you add when you need them. The steps are in [rules/DEPLOY.md](rules/DEPLOY.md).

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb platform services
    accDescr: You and your AI agent push commits, pull requests, and release tags to a GitHub repository. Dependabot opens pull requests with dependency updates. The repository starts GitHub Actions, which uses Wrangler to apply database migrations and deploy to Cloudflare Workers. Visitors, app users, and editors reach the Cloudflare network, which returns cache hits and sends other requests to the Worker. The Worker always uses D1, R2, KV, Images, the Rate Limiting binding, Cron Triggers, and Workers Logs. You can add more Cloudflare services for background work, AI, email, and analytics. You can also add Sentry for errors, and Stripe or Creem for payments.

    Team["You and your AI agent"] -->|"Commits, pull requests,<br/>and release tags"| Repo
    People["Visitors, app users,<br/>and editors"] --> Network

    subgraph GitHub["GitHub"]
        Dependabot["Dependabot<br/>Weekly dependency updates"] -->|"Pull requests"| Repo["Repository<br/>Environments and secrets"]
        Repo -->|"Starts"| Actions["GitHub Actions<br/>Checks, PR previews,<br/>and releases"]
    end

    subgraph Cloudflare["Cloudflare"]
        Network["Cloudflare network<br/>Custom domain and WAF<br/>Workers Cache returns cache hits<br/>Access protects stage and preview URLs"]
        Network -->|"Cache miss or<br/>dynamic request"| Worker["Workers<br/>Astro, EmDash, and your apps<br/>Targeted Placement"]
        Worker --> Storage["Storage<br/>D1: content and app data<br/>R2: media<br/>KV: sessions"]
        Worker --> Platform["Platform<br/>Images: image transformations<br/>Rate Limiting binding: forms<br/>Cron Triggers: schedules<br/>Workers Logs: logs"]
        Storage ~~~ Background
        Platform ~~~ Extras
        Worker -.-> Background["Background work and state<br/>Queues and Workflows<br/>Durable Objects: real time<br/>Worker Loader: sandboxed plugins"]
        Worker -.-> Extras["More services<br/>Workers AI: translation and chat<br/>Email Service: login and app email<br/>Turnstile: bot protection<br/>Web Analytics: cookieless analytics<br/>Analytics Engine: usage events<br/>Flagship: feature flags"]
    end

    Actions -->|"Wrangler: migrations,<br/>versions, and deployments"| Worker
    Worker -.->|"Errors and uptime"| Sentry["Sentry"]
    Worker <-.->|"Billing and webhooks"| Payments["Stripe or Creem"]
```

## 🚀 Features

- Rules and instructions in `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `rules/`.
- Built on Astro.
- Runs on Cloudflare Workers.
- Content managed with EmDash CMS.

## ⚡ Performance

- SSR at the edge on Cloudflare Workers, with no slow cold starts.
- CDN cache through Astro route caching: a cache hit does not run the Worker.
- Zero JavaScript by default. Islands hydrate only the interactive parts.
- Zod schemas are compiled at build time.
- Performance budget: less than 10 ms of CPU time per request.

The diagram shows how a request gets through the page and cache layers, and which checks guard the targets. Read the details in [rules/PERF.md](rules/PERF.md).

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb performance layers and checks
    accDescr: A browser request first reaches static assets or Workers Cache, and neither runs the Worker. Other requests run the Worker, which has a target of 10 ms of CPU time. The Worker reads the Cache API, Workers KV, and D1. It returns Astro pages with zero JavaScript by default and islands only for interactive parts. Three groups of checks guard the targets. Pull requests check JavaScript size and fonts. Each release has a Lighthouse score target of 100. Production uses PageSpeed Insights, Core Web Vitals field data, and CPU time in Workers Logs.

    Browser["Browser"] -->|"Prerendered pages<br/>and /_astro files"| Static
    Browser --> Cache1

    subgraph Edge["Cloudflare"]
        Static["Static assets<br/>Do not run the Worker<br/>Immutable browser cache for /_astro"]
        Cache1["Cache 1: Workers Cache<br/>Full responses, also SSR pages<br/>A cache hit does not run the Worker"]
        Cache1 -->|"Cache miss or<br/>per-user page"| Worker["Worker<br/>Target: 10 ms of CPU per request<br/>Waiting for I/O does not count<br/>Plugins share the budget"]
        Worker --> Cache2["Cache 2: Cache API<br/>Slow upstream data<br/>One data center"]
        Worker --> Cache3["Cache 3: Workers KV<br/>Small, rarely changing data<br/>Global"]
        Worker --> D1["D1<br/>Targeted Placement<br/>keeps the Worker near it"]
    end

    Worker -->|"HTML"| Page

    subgraph Page["Astro page in the browser"]
        Html["Static HTML and CSS<br/>Zero JavaScript by default"]
        Html ~~~ Islands["Islands only for interactive parts<br/>client:visible, client:idle, or client:media<br/>before client:load"]
    end

    subgraph Checks["Checks that guard the targets"]
        PR["Each pull request, in CI<br/>pnpm run size: 10 kB brotli per island,<br/>limit per page in page-js-limits.json<br/>Fonts in the build"]
        PR --> Release["Before each release, by hand<br/>Lighthouse performance score 100,<br/>mobile and desktop"]
        Release --> Prod["In production<br/>PageSpeed Insights score 100<br/>Field data at P75: LCP ≤ 2.5 s,<br/>INP ≤ 200 ms, CLS ≤ 0.1<br/>Workers Logs: $workers.cpuTimeMs"]
    end

    Page ~~~ Checks
```

CI blocks a pull request only for the JavaScript and font checks. The other checks do not fail a build, so you run them and read the results. Field data decides.

## 🛠️ DX

- Built for AI agents: rules in `AGENTS.md` and `rules/`, EmDash agent skills, CLI, and MCP server.
- TypeScript in strict mode, with types generated for bindings (`wrangler types`) and content (`pnpm exec emdash types`).
- Effect for typed errors and Zod for validation.
- `astro dev` and `astro preview` run the same runtime (workerd) on your machine.
- Safe releases with gradual deployments and instant rollback.

## 🎨 UX

- Fast first load: HTML is rendered on the server and served from the CDN.
- Good SEO: server-rendered HTML and built-in EmDash SEO features.
- Editors get a full admin panel: visual schema builder, media library, menus, drafts, revisions, scheduled publishing, and preview.
- Multilingual content with Astro i18n routing.

## 🔐 Auth

- Auth uses the [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth) plugin, powered by [Better Auth](https://www.better-auth.com/).
- Email and password, social login, passwordless login, and passkeys.
- Two-factor authentication (2FA).
- Organizations for teams and multi-tenant apps.
- OIDC provider: other apps can log in with your users.
- Stripe billing and audit logging.
- Prebuilt themed UI and an admin settings page.
- No database migrations needed.

## 💳 Payments

- Stripe subscriptions through emdash-better-auth.
- Other Better Auth payment plugins (Polar, Creem, and more) wait for [emdash-better-auth#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22).
- Premium content and a paywall: members-only and premium entries.

Read the details in [rules/PAYMENTS.md](rules/PAYMENTS.md).

## 💡 Use cases

The CMS gives auth, i18n, custom content types, sandboxed plugins, agent integration, and payments. This makes Starweb a good base for:

- **Marketing sites and landing pages** that editors update without a developer.
- **Blogs, magazines, and docs** with search, taxonomies, RSS, and many languages.
- **Portfolios and company sites.**
- **SaaS apps:** users and roles, custom content types as app data, plugins for custom logic, and API routes on the same Worker.
- **Paid content and APIs for agents:** pay per request with x402.
- **WordPress migration:** import posts, pages, media, and taxonomies.

### SaaS

The diagram shows how the site, the admin panel, and many apps share one Worker and one login, while each app keeps its own folder, routes, and database. The template has no apps yet: you add them with the steps in [rules/SAAS.md](rules/SAAS.md) and [rules/ARCH.md](rules/ARCH.md#apps). Solid lines show the default setup, and dashed lines show what you add when you need it.

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb SaaS and multi-app architecture
    accDescr: People reach one domain, and one Worker serves all paths. The site, login, and admin panel share one part of the Worker and use the EmDash D1 database, which holds content, users, and organizations. Login connects to Stripe for billing. Each app has its own prefix, folder, and D1 database with a tenant_id column, and it checks login, plan, and tenant on each route. Admin pages for an app are native EmDash plugins that read the app database through the app repositories. You can add more services, and you can move an app to its own Worker on the same domain.

    People["Visitors, customers, and staff"] --> Domain["One domain: example.com"]
    Domain -->|"/, /auth, and<br/>/_emdash/admin"| Core
    Domain -->|"/app1"| App1
    Domain -->|"/app2"| App2

    subgraph Worker["One Worker, one Astro project"]
        Core["Site, login, and admin<br/>Site pages in src/pages<br/>emdash-better-auth: one login,<br/>2FA, and organizations for all apps<br/>EmDash admin panel"]
        App1["App 1: src/apps/app1<br/>Pages, API routes, and islands<br/>Added as an Astro integration<br/>Checks login, plan, and tenant"]
        App2["App 2: src/apps/app2<br/>Pages, API routes, and islands<br/>Added as an Astro integration<br/>Checks login, plan, and tenant"]
    end

    subgraph Data["D1 databases"]
        CoreDb["EmDash database<br/>Content, users,<br/>and organizations"]
        App1Db["APP1_DB<br/>One database for all tenants<br/>tenant_id on each tenant table"]
        App2Db["APP2_DB<br/>One database for all tenants<br/>tenant_id on each tenant table"]
    end

    Core --> CoreDb
    App1 --> App1Db
    App2 --> App2Db
    Core -.->|"App admin: native<br/>EmDash plugin"| App1Db
    Core <-.->|"Plan per organization"| Stripe["Stripe"]
    App1 -.-> Blocks["Add when an app needs them<br/>R2: files per tenant<br/>Queues: email and webhooks<br/>Workflows: long cleanup<br/>Durable Objects: real time<br/>Rate Limiting and Analytics Engine: plans<br/>Flagship: feature flags"]
    App2 -.->|"Independent deploy"| Split["Separate Worker on the same domain<br/>Route: example.com/app2/*<br/>The login cookie still works"]
```

Apps share code only from `src/lib/`, `src/layouts/`, and `src/components/ui/`. An app does not import from another app or read its database: it calls the other app's API route or sends a Queue message.

Each D1 database counts toward the account limit. The Free plan has 10 databases per account, and EmDash uses 1, so you can run up to 9 apps. Move to the Paid plan before you launch to paying customers.

#### Advantages

- One Worker serves the marketing site, the admin panel, the app, and the API routes.
- The emdash-better-auth plugin gives login, 2FA, organizations, and Stripe billing. You do not build them from zero.
- App data lives in its own D1 database, queried with Kysely. EmDash content stays separate.
- Multi-app support: run many apps on one domain, for example `/app1` and `/app2`. Each app has its own D1 database and migrations, and all apps share one login and the same organizations. See [rules/SAAS.md](rules/SAAS.md).
- Modular back end: each EmDash plugin adds its own API routes, hooks, storage, and admin pages.
- Sandboxed plugins add custom logic with only the capabilities they declare.
- Built-in data services: KV, D1, R2, Queues, Durable Objects, and Workers AI.
- Low start cost: the free plan covers early users, then you pay for use.
- Safe releases with gradual deployments and instant rollback.

#### Disadvantages

- EmDash is a CMS, not a SaaS framework. You build an admin for app data, cleanup when a user or organization is deleted, and plan limits yourself.
- EmDash has no multi-tenancy. emdash-better-auth solves part of it: organizations, members, and invites. You scope app data per organization with a `tenant_id` column in the app database and a filter in each query.
- emdash-better-auth cannot load other Better Auth plugins yet, so Stripe is the only payment provider ([#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)).
- App code has no public API to read the active organization yet ([#23](https://github.com/theweekendprojects/emdash-better-auth/issues/23)).
- Users and organizations live in the EmDash database, so app databases cannot join them.
- EmDash and emdash-better-auth are young, so they have fewer plugins, examples, and community answers than mature tools.

Read the Cloudflare platform limits in [WHY.md](WHY.md#limits).

## 🤔 Why

- **Astro:** SSR with zero JavaScript by default, islands for interactive parts, and content collections.
- **Cloudflare Workers:** edge compute with no slow cold starts, built-in data services, and a CDN cache that serves SSR pages without running the Worker.
- **Generous free plan:** 100,000 Worker requests per day, and requests for static assets are free. You can start without cost.
- **EmDash:** an Astro-native CMS on the same stack (D1 + R2), with live content, sandboxed plugins, a modular back end built from plugins, and tools for agents.
- **No lock-in:** Astro and EmDash can also run on Node.js as a fallback. Astro uses the `@astrojs/node` adapter, and EmDash runs on Node.js 22.16 or later with SQLite, PostgreSQL, or libSQL, and local or S3-compatible storage.
- **One backer:** Cloudflare funds the development of Astro and EmDash, so all three parts are built to work together.

Read the full reasons and alternatives in [WHY.md](WHY.md).
