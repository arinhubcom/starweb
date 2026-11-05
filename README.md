# ✨ Starweb

**[Star it](https://github.com/arinhubcom/starweb). [Fork it](https://github.com/arinhubcom/starweb/fork). [Change it](#-change-starweb).**

Starweb is a template for AI agents. Use it to build websites and web apps.
It is built on [Astro](https://astro.build) and
[Cloudflare Workers](https://workers.cloudflare.com), with [EmDash](https://docs.emdashcms.com/) as the CMS. Read [why we chose this stack](WHY.md).

## 🏁 Quick start

To set up a new project, give this prompt to your AI agent (Claude Code, Codex, Gemini CLI, or another agent):

```text
Set up a new Starweb project named my-site. Clone https://github.com/arinhubcom/starweb into a folder outside the project, for example ~/starweb, and keep it: setup.mjs reads it, and update.mjs needs it later. Do not use a temporary folder. Read AGENTS.md and rules/SETUP.md there. Ask me which optional parts to add. Run scripts/setup.mjs on the new project folder, then do the remaining steps in rules/SETUP.md in order. After each step, check the result. If a step fails, stop and report the error.
```

Replace `my-site` with your project name.

The steps are in [rules/SETUP.md](rules/SETUP.md). The agent first asks which [optional parts](#optional-parts) to add. The [template/](template/) folder holds the `create-emdash` output with the Starweb changes in place, Fulldev UI, `package.json`, the lockfile, and the tested configs. The new project takes it over: the script [scripts/setup.mjs](scripts/setup.mjs) copies the folder to the project root and writes a new encryption key. The rules hold decisions, not install commands. Each EmDash update runs `create-emdash` again: [scripts/update-starter.mjs](scripts/update-starter.mjs) merges the new output into `template/`, and [starter/](starter/) keeps the last output as the merge base. See the steps in [rules/UPDATE.md](rules/UPDATE.md#emdash-update). CI tests the template every week. Read [why](WHY.md#why-a-template-setupmjs-and-ci).

### Optional parts

The template holds what every project uses. The agent asks which of these parts you want, and it adds only those. You can add a part later.

- Sandboxed plugins (Workers paid plan).
- Queues for background work.
- Many languages: Astro i18n routing, Paraglide JS, and PolyStella.
- Customer login with emdash-better-auth: 2FA, organizations, and more.
- Email with Cloudflare Email Service: email verification, password reset, and app email.
- Apps with their own D1 database.
- An OpenAPI contract for an app.
- Stripe billing, or Creem for EU consumer sales.
- Sentry for errors and uptime.
- Storybook for components.
- Playwright and axe for end-to-end and accessibility tests.

Some parts need others: for example, Stripe billing needs customer login. The template also turns on scheduled publishing, and the agent asks whether to keep it.

## 🔄 Update a project

When Starweb has new rules or a better template, ask your AI agent in the project to update Starweb. The `starweb-update` skill finds your Starweb clone, pulls it, and follows the newest steps.

The steps are in [rules/UPDATE.md](rules/UPDATE.md). The script [scripts/update.mjs](scripts/update.mjs) merges the new rules and template files with your changes, and lists the rules that changed.

## 🔧 Change Starweb

To change your fork, give your AI agent one sentence that says what must be true when it finishes. For example, use this prompt with the [`/goal` command in Claude Code](https://code.claude.com/docs/en/goal):

```text
/goal Use Svelte instead of React for islands, update rules/ and template/, and make the Template CI workflow pass.
```

## 🏗️ Architecture

The diagram shows the main parts of a Starweb project and the main advantage of each part. All diagrams in this README use the same colors: orange for Cloudflare, blue for data and caches, green for pages and apps, gray for people and tools, purple for services outside Cloudflare, and yellow for checks.

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
        Apps["Your apps and API routes<br/>Optional login, 2FA,<br/>organizations, and Stripe billing"]
    end

    Worker -->|"Bindings"| Data["Built-in data services<br/>D1, R2, KV, Queues,<br/>Durable Objects,<br/>and Workers AI"]
    Worker -.->|"Fallback"| Node["Node.js<br/>Astro and EmDash<br/>also run here"]

    classDef cloudflare fill:#fde8d0,stroke:#c2570c,color:#1f1f1f
    classDef data fill:#dbeafe,stroke:#1d4ed8,color:#1f1f1f
    classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
    classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
    classDef external fill:#ede9fe,stroke:#6d28d9,color:#1f1f1f
    classDef check fill:#fef3c7,stroke:#b45309,color:#1f1f1f
    class Agent,Template,People neutral
    class CDN,Runtime cloudflare
    class Astro,EmDash,Apps app
    class Data data
    class Node external
    style Worker fill:transparent,stroke:#8b949e
```

### Platform services

The diagram shows the services that a deployed Starweb project uses on Cloudflare and outside it. Solid lines lead to services that every project uses. Dashed lines lead to services that you add when you need them. The deploy steps are in [rules/DEPLOY.md](rules/DEPLOY.md).

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb platform services
    accDescr: GitHub holds the code and runs CI, which uses Wrangler to apply database migrations and deploy to Cloudflare Workers. Visitors, app users, and editors reach the Cloudflare network, which returns cache hits and sends other requests to the Worker. The Worker always uses D1, R2, KV, Images, the Rate Limiting binding, Cron Triggers, and Workers Logs. You can add more Cloudflare services for background work, AI, email, and analytics. You can also add Sentry for errors, and Stripe or Creem for payments.

    People["Visitors, app users,<br/>and editors"] --> Network

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

    GitHub["GitHub"] -->|"Wrangler: migrations,<br/>versions, and deployments"| Worker
    Worker -.->|"Errors and uptime"| Sentry["Sentry"]
    Worker <-.->|"Billing and webhooks"| Payments["Stripe or Creem"]

    classDef cloudflare fill:#fde8d0,stroke:#c2570c,color:#1f1f1f
    classDef data fill:#dbeafe,stroke:#1d4ed8,color:#1f1f1f
    classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
    classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
    classDef external fill:#ede9fe,stroke:#6d28d9,color:#1f1f1f
    classDef check fill:#fef3c7,stroke:#b45309,color:#1f1f1f
    class People,GitHub neutral
    class Network,Worker,Platform,Background,Extras cloudflare
    class Storage data
    class Sentry,Payments external
    style Cloudflare fill:transparent,stroke:#8b949e
```

## 🚀 Features

- Rules and instructions in `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `rules/`.
- Built on Astro.
- Runs on Cloudflare Workers.
- Content managed with EmDash CMS.
- One prompt sets up a new project, and `update.mjs` merges new rules and template files with your changes.
- CI tests the template every week.
- Editors build forms and read submissions with the Forms plugin, and Field Kit gives better inputs for `json` fields.
- Security by default: CSP, security headers, `security.txt`, and Turnstile and rate limits on forms.
- Privacy by default: a privacy page to complete, and cookieless Web Analytics.
- Design rules: Fulldev UI, a Material Design 3 theme from one brand color, and WCAG 2.2 level AA.
- JavaScript size limits for each island and each page fail the pull request when you go over them.
- [Optional parts](#optional-parts) that you add when you need them: login, payments, apps, many languages, and more.

The diagram groups the main features. Solid lines show what every project gets from the template. The dashed line shows what you add during setup when you need it: read [rules/SETUP.md](rules/SETUP.md).

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb features
    accDescr: One Starweb project gives five groups of features: tools for AI agents, a website with a CMS, the Cloudflare platform, security and privacy, and quality checks. A sixth group holds what you add when you need it: login, payments, apps, many languages, and an API contract.

    Project["One Starweb project"]
    Project --> Agents["For AI agents<br/>Rules in AGENTS.md and rules/<br/>Setup and update scripts<br/>EmDash skills, CLI, and MCP server"]
    Project --> Site["Website and CMS<br/>Astro and EmDash admin panel<br/>Form builder and Field Kit<br/>Fulldev UI and a Material theme"]
    Project --> Platform["Cloudflare platform<br/>Workers and Workers Cache<br/>D1, R2, and KV<br/>Gradual deployments and rollback"]
    Agents ~~~ Trust
    Site ~~~ Quality
    Platform ~~~ Optional
    Project --> Trust["Security and privacy<br/>CSP and security headers<br/>Turnstile and rate limits on forms<br/>security.txt and a privacy page"]
    Project --> Quality["Quality checks<br/>Format, types, lint, and tests<br/>JavaScript size limits<br/>Template tested every week"]
    Project -.-> Optional["Add when you need it<br/>Login, 2FA, and organizations<br/>Stripe or Creem<br/>Apps with their own D1 database<br/>Many languages and OpenAPI"]

    classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
    classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
    classDef cloudflare fill:#fde8d0,stroke:#c2570c,color:#1f1f1f
    classDef check fill:#fef3c7,stroke:#b45309,color:#1f1f1f
    class Project,Agents neutral
    class Site,Trust,Optional app
    class Platform cloudflare
    class Quality check
```

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
    accDescr: A browser request first reaches static assets or Workers Cache, and neither runs the Worker. Other requests run the Worker, which has a target of 10 ms of CPU time. The Worker reads the Cache API, Workers KV, and D1. It returns Astro pages with zero JavaScript by default and islands only for interactive parts. Three groups of checks guard the targets. Pull requests check JavaScript size and fonts, and a separate Lighthouse CI workflow gives a warning only. Each release has a Lighthouse score target of 100, checked with pnpm run lighthouse. A daily workflow checks the PageSpeed Insights score and the Worker CPU time in production. Core Web Vitals field data stays something you read.

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
        PR["Each pull request, in CI<br/>pnpm run size: 10 kB brotli per island,<br/>limit per page in page-js-limits.json<br/>Fonts in the build<br/>Lighthouse CI: warning only"]
        PR --> Release["Before each release<br/>pnpm run lighthouse:<br/>mobile score 100"]
        Release --> Prod["In production, daily workflow<br/>pnpm run pagespeed: score 100<br/>pnpm run worker-cpu: P95 CPU ≤ 10 ms<br/>Field data at P75, read by hand:<br/>LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1"]
    end

    Page ~~~ Checks

    classDef cloudflare fill:#fde8d0,stroke:#c2570c,color:#1f1f1f
    classDef data fill:#dbeafe,stroke:#1d4ed8,color:#1f1f1f
    classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
    classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
    classDef external fill:#ede9fe,stroke:#6d28d9,color:#1f1f1f
    classDef check fill:#fef3c7,stroke:#b45309,color:#1f1f1f
    class Browser neutral
    class Static,Worker cloudflare
    class Cache1,Cache2,Cache3,D1 data
    class Html,Islands app
    class PR,Release,Prod check
    style Edge fill:transparent,stroke:#8b949e
    style Page fill:transparent,stroke:#8b949e
    style Checks fill:transparent,stroke:#8b949e
```

CI blocks a pull request only for the JavaScript and font checks. Lighthouse CI runs in its own workflow and only warns. A daily workflow runs `pnpm run pagespeed` and `pnpm run worker-cpu` against production and fails when a target is missed. It does not block a build. You run `pnpm run lighthouse` before a release, and you read the field data. Field data decides.

## 🛠️ DX

- Built for AI agents: rules in `AGENTS.md` and `rules/`, EmDash agent skills, CLI, and MCP server.
- TypeScript in strict mode, with types generated for bindings (`wrangler types`) and content (`pnpm exec emdash types`).
- Effect for typed errors and Zod for validation.
- `astro dev` and `astro preview` run the same runtime (workerd) on your machine.
- Safe releases with gradual deployments and instant rollback.

The diagram shows the path of a change from your machine to production. Solid lines show the default workflow, and the dashed line shows the tests that you add when you need them. Read [rules/DEPLOY.md](rules/DEPLOY.md), [rules/QUALITY.md](rules/QUALITY.md), and [rules/TESTING.md](rules/TESTING.md).

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb developer workflow
    accDescr: An AI agent or a developer works on the local machine with astro dev and astro preview, which run the same workerd runtime as production. pnpm run check runs the format, type, lint, unused code, and test checks. You can add Storybook and Playwright. GitHub Actions then builds the pull request, checks JavaScript size, audits dependencies, and uploads a preview. A push to main deploys dev. A release tag uploads a stage version without traffic. Prod gets the tested version in gradual steps, and you can roll it back.

    subgraph Local["Your machine"]
        Agent["AI agent or developer<br/>Rules, skills, CLI, and MCP server"] --> Run["astro dev and astro preview<br/>Same workerd runtime as production<br/>Generated types for bindings and content"]
        Run --> Check["pnpm run check<br/>Oxfmt, astro check, Oxlint,<br/>Knip, and Vitest"]
    end

    subgraph Cloud["Cloudflare environments"]
        direction LR
        Preview["PR preview<br/>Each pull request"] --> Dev["Dev<br/>Each push to main"]
        Dev --> Stage["Stage<br/>Release tag,<br/>no traffic"]
        Stage --> Prod["Prod<br/>10, 50, and 100 %<br/>Instant rollback"]
    end

    Check --> Build["GitHub Actions on each pull request<br/>pnpm run check, build, and size<br/>pnpm audit"]
    Build --> Cloud
    Check -.-> Tests["Storybook and Playwright<br/>Component, end-to-end,<br/>and accessibility tests"]

    classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
    classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
    classDef check fill:#fef3c7,stroke:#b45309,color:#1f1f1f
    classDef cloudflare fill:#fde8d0,stroke:#c2570c,color:#1f1f1f
    class Agent neutral
    class Run app
    class Check,Build,Tests check
    class Preview,Dev,Stage,Prod cloudflare
    style Local fill:transparent,stroke:#8b949e
    style Cloud fill:transparent,stroke:#8b949e
```

## 🎨 UX

- Fast first load: HTML is rendered on the server and served from the CDN.
- Good SEO: server-rendered HTML and built-in EmDash SEO features.
- Editors get a full admin panel: visual schema builder, media library, menus, drafts, revisions, scheduled publishing, and preview.
- Multilingual content with Astro i18n routing.

The diagram shows what each group of people gets. Solid lines show the default rules and features, and the dashed line shows what you add when you need it. Read [rules/UI-UX.md](rules/UI-UX.md), [rules/MATERIAL.md](rules/MATERIAL.md), and [rules/I18N.md](rules/I18N.md).

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb user experience
    accDescr: Visitors and app users get a fast first load, pages that search engines can read, an accessible interface, a consistent look in light and dark themes, and forms that work without an island. Editors get a full admin panel. You can add many languages.

    subgraph Public["Public pages and apps"]
        Fast["Fast first load<br/>HTML rendered on the server<br/>and served from the CDN"]
        Found["Easy to find<br/>Server-rendered HTML<br/>EmDash SEO features"]
        Access["Usable by everyone<br/>WCAG 2.2 level AA<br/>Keyboard access and 320 px width"]
        Fast ~~~ Look["Consistent look<br/>Material Design 3 tokens<br/>Light and dark themes"]
        Found ~~~ Forms["Simple forms<br/>Native HTML form and Astro Actions<br/>No island only to submit"]
    end

    Visitors["Visitors and app users"] --> Public
    Public -.-> Languages["Many languages<br/>Astro i18n routing and Paraglide JS<br/>PolyStella content translation"]
    Editors["Editors"] --> Admin["Full admin panel<br/>Visual schema builder, media, and menus<br/>Drafts, revisions, and preview<br/>Scheduled publishing and a form builder"]

    classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
    classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
    class Visitors,Editors neutral
    class Fast,Found,Access,Look,Forms,Languages,Admin app
    style Public fill:transparent,stroke:#8b949e
```

## 🔐 Auth

- Optional customer login uses the [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth) plugin, powered by [Better Auth](https://www.better-auth.com/).
- Email and password, social login, passwordless login, and passkeys.
- Two-factor authentication (2FA).
- Organizations for teams and multi-tenant apps.
- OIDC provider: other apps can log in with your users.
- Stripe billing and audit logging.
- Prebuilt themed UI and an admin settings page.
- No database migrations needed.

Customer login is optional, and the template does not include it. Setup asks if you want it, then adds emdash-better-auth, and the diagram shows the result. Solid lines show the login setup, and dashed lines show the options that you add when you need them. Without email, you turn off email verification, and password reset and email login do not work. Read [rules/AUTH.md](rules/AUTH.md).

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb login
    accDescr: Customers sign in through emdash-better-auth with email and password, social login, passwordless login, or passkeys, and they can use 2FA. It can send email through Cloudflare Email Service, and it stores users and organizations in the EmDash D1 database. Each app route checks the user on the server, and app data is filtered by the active organization. You can add organizations, Stripe billing, and an OIDC provider. Editors and administrators sign in separately with EmDash passkey login.

    Customers["Customers"] --> Plugin["emdash-better-auth<br/>Email and password, social login,<br/>passwordless login, passkeys, and 2FA<br/>Prebuilt pages at /auth"]
    Staff["Editors and administrators"] --> Passkey["EmDash passkey login<br/>/_emdash/admin/login"]
    Plugin -.-> Mail["Cloudflare Email Service<br/>Verification, reset, and invites"]
    Plugin --> Guard["Server checks on each app route<br/>Pages: requireUser<br/>API routes: 401 or 403<br/>Roles: auth.api.hasPermission"]
    Plugin --> Users["EmDash database<br/>Users and organizations"]
    Passkey --> Users
    Guard --> AppData["App database<br/>tenant_id from the session,<br/>never from the body or URL"]
    Plugin -.-> Extras["Turn on in plugin settings<br/>Organizations and teams<br/>Stripe billing and audit logging<br/>OIDC provider"]

    classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
    classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
    classDef cloudflare fill:#fde8d0,stroke:#c2570c,color:#1f1f1f
    classDef check fill:#fef3c7,stroke:#b45309,color:#1f1f1f
    classDef data fill:#dbeafe,stroke:#1d4ed8,color:#1f1f1f
    class Customers,Staff neutral
    class Plugin,Passkey,Extras app
    class Mail cloudflare
    class Guard check
    class Users,AppData data
```

## 🛡️ Security

- **New packages wait 3 days:** pnpm installs only package versions older than 3 days (`minimumReleaseAge: 4320`), and Dependabot waits 3 days before a version update. Dependabot security updates do not wait.
- **Package checks in CI:** `pnpm audit --prod --audit-level high` and `pnpm audit signatures` run on each pull request.
- **Pinned versions:** exact versions in `package.json`, and GitHub Actions pinned to a commit SHA.
- **Browser protection:** a Content Security Policy and security headers on each response, and `security.txt` for vulnerability reports.
- **Request protection:** an `Origin` check for mutating requests, rate limits on forms, and Zod validation of input.
- **`production` environment:** production deploys run in the GitHub environment `production`, only from `main` or a release tag. A private repository needs GitHub Pro or Team for this.
- **Cloudflare tokens:** the production token is a secret of the `production` environment, and a second token, a secret of the `dev` environment, handles PR previews and dev deploys. Each token has only the permissions it needs, for one account and one zone. Forks get no token.

Read the details in [rules/SECURITY.md](rules/SECURITY.md), [rules/DEPS.md](rules/DEPS.md#supply-chain), and [rules/DEPLOY.md](rules/DEPLOY.md#ci).

## 💳 Payments

- Stripe subscriptions through emdash-better-auth.
- Other Better Auth payment plugins (Polar, Creem, and more) wait for [emdash-better-auth#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22).
- Premium content and a paywall: members-only and premium entries.

The diagram shows which provider fits your sales, and how a payment reaches content access. Solid lines show the two main paths, and dashed lines show the other options.

```mermaid
%%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
flowchart TD
    accTitle: Starweb payment options
    accDescr: The choice depends on who you sell to. Without EU consumer sales, use Stripe billing through emdash-better-auth. For EU consumer sales, use Creem as the merchant of record, with its SDK and a webhook route that verifies the signature, stores the event ID, and sends the work to a Queue. Stripe Managed Payments is another merchant of record when you need Stripe features, and x402 is for experiments only. Stripe and Creem set a plan per organization. Billing code sets the premium flag for each member, and each content entry is public, for members, or premium.

    Start["Who do you sell to?"]
    Start -->|"No EU consumer sales"| Stripe["Stripe billing<br/>Through emdash-better-auth<br/>Not a merchant of record"]
    Start -->|"EU consumer sales"| Creem["Creem<br/>Merchant of record: VAT, invoices,<br/>refunds, and chargebacks<br/>SDK in a server route"]
    Start -.->|"EU sales with Stripe features"| Managed["Stripe Managed Payments<br/>Merchant of record, costs more"]
    Start -.->|"Agents, experiments only"| X402["x402<br/>Test network, no mainnet"]
    Creem --> Hook["Webhook route<br/>Verify the signature, store the event ID,<br/>and send the work to a Queue"]
    Stripe --> Plan["Plan per organization<br/>Checked on the server before each create"]
    Hook --> Plan
    Plan --> Premium["premium flag per member<br/>Billing code sets and clears it"]
    Premium --> Access["Access per content entry<br/>Public, members, or premium<br/>Paywall page for other readers"]

    classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
    classDef external fill:#ede9fe,stroke:#6d28d9,color:#1f1f1f
    classDef cloudflare fill:#fde8d0,stroke:#c2570c,color:#1f1f1f
    classDef data fill:#dbeafe,stroke:#1d4ed8,color:#1f1f1f
    classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
    class Start neutral
    class Stripe,Creem,Managed,X402 external
    class Hook cloudflare
    class Plan data
    class Premium,Access app
```

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

    classDef cloudflare fill:#fde8d0,stroke:#c2570c,color:#1f1f1f
    classDef data fill:#dbeafe,stroke:#1d4ed8,color:#1f1f1f
    classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
    classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
    classDef external fill:#ede9fe,stroke:#6d28d9,color:#1f1f1f
    classDef check fill:#fef3c7,stroke:#b45309,color:#1f1f1f
    class People neutral
    class Domain,Blocks,Split cloudflare
    class Core,App1,App2 app
    class CoreDb,App1Db,App2Db data
    class Stripe external
    style Worker fill:transparent,stroke:#8b949e
    style Data fill:transparent,stroke:#8b949e
```

Apps share code only from `src/lib/`, `src/layouts/`, and `src/components/ui/`. An app does not import from another app or read its database: it calls the other app's API route or sends a Queue message.

Each D1 database counts toward the account limit of your plan, and EmDash uses 1. Move to the Paid plan before you launch to paying customers.

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

## 📄 License

Starweb is available under the [MIT License](LICENSE). A new project keeps this notice in `rules/LICENSE`. You choose the license for your own project.
