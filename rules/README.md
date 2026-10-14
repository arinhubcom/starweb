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
| [MATERIAL.md](MATERIAL.md) | Material Design 3 layout, spacing, targets, states, motion, color from a seed color, and component sizes, with MD3 Expressive values. |
| [MEDIA.md](MEDIA.md) | Astro images (Image, Picture, LCP priority, remote images), the Cloudflare adapter image service, the Cloudflare Images binding, EmDash media on R2, user uploads, video, Astro fonts, and SVG icons. |
| [SEO.md](SEO.md) | Site URL and trailing slash, title and meta description, canonical URLs, EmDash SEO fields, Open Graph, sitemaps, robots.txt, noindex, JSON-LD, 404 and 410 pages, redirects, and llms.txt. |
| [I18N.md](I18N.md) | Astro i18n routing and `astro:i18n` links, hreflang and x-default, the `lang` attribute, EmDash content translation, Paraglide JS UI strings, `Intl` dates and numbers, and RTL. |
| [UI-UX.md](UI-UX.md) | How the UI behaves: WCAG 2.2 AA accessibility, loading, empty, and error states, forms, toasts, motion, navigation, and theme. |

## Quality and operations

| File | Contents |
| --- | --- |
| [QUALITY.md](QUALITY.md) | TypeScript strict flags, `astro check`, ESLint with `eslint-plugin-astro` and `typescript-eslint`, Prettier, Knip for unused code, `package.json` scripts, and the order of checks. |
| [TESTING.md](TESTING.md) | Vitest, the Cloudflare Vitest plugin, Storybook with Storybook Astro, ARIA snapshots, screenshot tests, Playwright end-to-end tests, axe, and CI. |
| [PERF.md](PERF.md) | CPU time budget for Workers, Astro route caching, and the Cache API. |
| [SECURITY.md](SECURITY.md) | Secrets, security headers (Astro CSP, HSTS, `_headers`, middleware), CSRF, input validation, XSS, SQL injection, auth checks, Turnstile and WAF rate limits, and security.txt. |
| [PRIVACY.md](PRIVACY.md) | Cloudflare Web Analytics, cookie consent (ePrivacy Article 5(3)), the privacy policy page, data minimization, user data access, export, and delete (GDPR), and D1 jurisdiction. |
| [OBSERVABILITY.md](OBSERVABILITY.md) | Workers Logs, structured logs without personal data, `wrangler tail`, Effect logging and spans, Sentry for Cloudflare and Astro, release names and source maps, alerts, and a health endpoint. |
| [DEPS.md](DEPS.md) | npm and `package-lock.json`, `npm ci`, Dependabot (groups, schedule, ignore, automerge workflow, cooldown), `npm audit`, rules for a new package, version sync of Astro, Wrangler, and EmDash, and `compatibility_date`. |
| [DEV.md](DEV.md) | Local dev with `astro dev`, and build tests with `astro preview`. |
| [DEPLOY.md](DEPLOY.md) | Environments (dev, stage, prod), gradual deployments, version URLs, migration order, D1 Time Travel, rollback, secrets, GitHub Actions (PR previews, dev deploy on merge), and Previews. |

## Writing

| File | Contents |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Rules for agents that add or change a rule in this folder. `CLAUDE.md` imports it for Claude Code. |
| [WRITING.md](WRITING.md) | Rules for docs (Google developer documentation style guide) and UI text (Material Design 3 content design, Mailchimp voice and tone). |
