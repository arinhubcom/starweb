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

## 🛠️ DX

- Built for AI agents: rules in `AGENTS.md` and `rules/`, EmDash agent skills, CLI, and MCP server.
- TypeScript in strict mode, with types generated for bindings (`wrangler types`) and content (`npx emdash types`).
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
