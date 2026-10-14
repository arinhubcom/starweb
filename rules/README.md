# README

This folder has the rules for AI agents that build with Starweb. Start with [STACK.md](STACK.md). It lists the tools and links to the topic file for each tool.

## Stack

| File | Contents |
| --- | --- |
| [STACK.md](STACK.md) | The tools of the stack, with a link to the topic file for each tool. |
| [SETUP.md](SETUP.md) | Steps to set up a new project, in order: EmDash Cloudflare template, Wrangler, TypeScript, Effect and Zod, UI, cache, auth, agent skills, checks, and the first deploy. |
| [ARCH.md](ARCH.md) | Architecture: Effect, Zod, Cloudflare Workers, background work, Astro, TanStack, micro frontends, and app admin pages. |
| [SAAS.md](SAAS.md) | Rules for a small SaaS app in one Astro project and one Worker: multiple apps, data, plugins, building blocks, limits, and billing. |

## Backend and data

| File | Contents |
| --- | --- |
| [CMS.md](CMS.md) | EmDash as the CMS: setup, content types, content queries, and plugins. |
| [API.md](API.md) | OpenAPI as the contract for all interfaces, one purpose for each field, zod-openapi, API routes, errors (RFC 9457), API keys, CORS, rate limits, and webhooks. |
| [DATA.md](DATA.md) | D1 limits, Kysely queries, and D1 migrations. |
| [AUTH.md](AUTH.md) | Site user login with emdash-better-auth, users, organizations, role checks, and the last login method plugin. |
| [PAYMENTS.md](PAYMENTS.md) | Payment providers: Stripe billing, Creem for EU sales, x402 agent payments, and premium content. |
| [EMAIL.md](EMAIL.md) | Transactional email with React Email and emailcn. |

## Frontend and design

| File | Contents |
| --- | --- |
| [DESIGN.md](DESIGN.md) | Where each UI system applies (Tailwind CSS, Base UI, Kumo) and Tailwind CSS styling. |
| [COMPONENTS.md](COMPONENTS.md) | Astro components, Fulldev UI, React components, Astro islands, shadcn/ui, and Base UI. |
| [MATERIAL.md](MATERIAL.md) | Material Design 3 layout, spacing, targets, states, motion, and component sizes, with MD3 Expressive values. |
| [UI-UX.md](UI-UX.md) | How the UI behaves: WCAG 2.2 AA accessibility, loading, empty, and error states, forms, toasts, motion, navigation, and theme. |

## Quality and operations

| File | Contents |
| --- | --- |
| [QUALITY.md](QUALITY.md) | TypeScript strict mode and `astro check`. |
| [PERF.md](PERF.md) | CPU time budget for Workers, Astro route caching, and the Cache API. |
| [SECURITY.md](SECURITY.md) | Secrets for Cloudflare Workers. |
| [DEV.md](DEV.md) | Local dev with `astro dev`, and build tests with `astro preview`. |
| [DEPLOY.md](DEPLOY.md) | Environments (dev, stage, prod), gradual deployments, version URLs, migration order, D1 Time Travel, rollback, secrets, GitHub Actions (PR previews, dev deploy on merge), and Previews. |

## Writing

| File | Contents |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Rules for agents that add or change a rule in this folder. `CLAUDE.md` imports it for Claude Code. |
| [WRITING.md](WRITING.md) | Rules for docs (Google developer documentation style guide) and UI text (Material Design 3 content design, Mailchimp voice and tone). |

## Empty files

These files have only a heading and no rules:

- [TESTING.md](TESTING.md)
