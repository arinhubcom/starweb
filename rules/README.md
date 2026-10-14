# README

This folder has the rules for AI agents that build with Starweb. Start with [STACK.md](STACK.md). It lists the tools and links to the topic file for each tool.

## Stack

| File | Contents |
| --- | --- |
| [STACK.md](STACK.md) | The tools of the stack, with a link to the topic file for each tool. |
| [ARCH.md](ARCH.md) | Architecture: Effect, Zod, Cloudflare Workers, background work, Astro, TanStack, micro frontends, and app admin pages. |
| [SAAS.md](SAAS.md) | Rules for a small SaaS app in one Astro project and one Worker: multiple apps, data, plugins, building blocks, limits, and billing. |

## Backend and data

| File | Contents |
| --- | --- |
| [CMS.md](CMS.md) | EmDash as the CMS: setup, content types, content queries, and plugins. |
| [DATA.md](DATA.md) | D1 limits, Kysely queries, and D1 migrations. |
| [AUTH.md](AUTH.md) | Site user login with emdash-better-auth, users, organizations, role checks, and the last login method plugin. |
| [PAYMENTS.md](PAYMENTS.md) | Payment providers: Stripe billing, Creem for EU sales, x402 agent payments, and premium content. |
| [EMAIL.md](EMAIL.md) | Transactional email with React Email and emailcn. |

## Frontend and design

| File | Contents |
| --- | --- |
| [DESIGN.md](DESIGN.md) | Where each UI system applies (Tailwind CSS, Base UI, Kumo) and Tailwind CSS styling. |
| [COMPONENTS.md](COMPONENTS.md) | Astro components, Fulldev UI, React components, Astro islands, shadcn/ui, and Base UI. |
| [MD.md](MD.md) | Material Design 3 layout, spacing, targets, and component sizes. |

## Quality and operations

| File | Contents |
| --- | --- |
| [QUALITY.md](QUALITY.md) | TypeScript strict mode and `astro check`. |
| [PERF.md](PERF.md) | CPU time budget for Workers, Astro route caching, and the Cache API. |
| [SECURITY.md](SECURITY.md) | Secrets for Cloudflare Workers. |
| [DEV.md](DEV.md) | Local dev with `wrangler dev`. |
| [DEPLOY.md](DEPLOY.md) | Environments (dev, stage, prod), gradual deployments, version URLs, migration order, D1 Time Travel, rollback, secrets, GitHub Actions (PR previews, dev deploy on merge), and Previews. |

## Writing

| File | Contents |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Rules for agents that add or change a rule in this folder. `CLAUDE.md` imports it for Claude Code. |
| [WRITING.md](WRITING.md) | Rules for docs (Google developer documentation style guide) and UI text (Material Design 3 content design, Mailchimp voice and tone). |

## Empty files

These files have only a heading and no rules:

- [API.md](API.md)
- [SETUP.md](SETUP.md)
- [TESTING.md](TESTING.md)
- [UI-UX.md](UI-UX.md)
