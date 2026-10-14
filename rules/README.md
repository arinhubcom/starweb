# README

This folder has the rules for AI agents that build with Starweb. Start with [STACK.md](STACK.md). It lists the tools and links to the topic file for each tool.

## Stack

| File | Contents |
| --- | --- |
| [STACK.md](STACK.md) | The tools of the stack, with a link to the topic file for each tool. |
| [SETUP.md](SETUP.md) | Steps to set up a new project, in order: EmDash Cloudflare template, Dependabot and Node.js, Wrangler, TypeScript, Effect and Zod, Astro config, UI, CSP and security headers, auth, apps, Sentry, ESLint, Prettier, Knip, Vitest, Storybook, Playwright, agent skills, checks, and the first dev deploy and release. |
| [ARCH.md](ARCH.md) | Architecture: Effect, Zod and the `decode` helper, Cloudflare Workers, background work (Queues with a dead letter queue), Astro, TanStack, micro frontends, and app admin pages. |
| [SAAS.md](SAAS.md) | Rules for a small SaaS app in one Astro project and one Worker: multiple apps, data, plugins, building blocks, limits, and billing. |

## Backend and data

| File | Contents |
| --- | --- |
| [CMS.md](CMS.md) | EmDash as the CMS: setup, content types, content queries, Portable Text, drafts and preview, scheduled publishing, menus, taxonomies, EmDash migrations, WordPress import, and plugins. |
| [API.md](API.md) | OpenAPI as the contract for all interfaces, one purpose for each field, zod-openapi, serving the OpenAPI document, API routes, errors (RFC 9457), API keys with the tenant mapping, CORS, rate limits, and webhooks. |
| [DATA.md](DATA.md) | D1 limits (100 parameters, 100 KB), Kysely queries, D1 migrations, seed data, and backups with export. |
| [AUTH.md](AUTH.md) | Site user login with emdash-better-auth, email provider setup, users, organizations, role checks, and the last login method plugin. |
| [PAYMENTS.md](PAYMENTS.md) | Payment providers: Stripe billing, Creem for EU sales with webhook idempotency, x402 agent payments, and premium content (plan per organization, `premium` flag per user). |
| [EMAIL.md](EMAIL.md) | Transactional email with React Email and emailcn, and auth emails versus app emails. |

## Frontend and design

| File | Contents |
| --- | --- |
| [DESIGN.md](DESIGN.md) | Where each UI system applies (Tailwind CSS, Base UI, Kumo) and Tailwind CSS styling. |
| [COMPONENTS.md](COMPONENTS.md) | Astro components, the theme `is:inline` script and its CSP hash, Fulldev UI, React components, Astro islands, shadcn/ui, and Base UI. |
| [MATERIAL.md](MATERIAL.md) | Material Design 3 layout, spacing, targets, states, motion, color from a seed color, and component sizes, with MD3 Expressive values. |
| [MEDIA.md](MEDIA.md) | Astro images (Image, Picture, LCP priority, remote images), the Cloudflare adapter image service, the Cloudflare Images binding, EmDash media on R2, user uploads, video, Astro fonts, and SVG icons. |
| [SEO.md](SEO.md) | Site URL and trailing slash, title and meta description, canonical URLs, EmDash SEO fields, `EmDashHead` on all public pages with a canonical URL for custom pages, Open Graph, sitemaps, robots.txt, noindex, JSON-LD, 404 and 410 pages, redirects, and llms.txt. |
| [I18N.md](I18N.md) | Astro i18n routing and `astro:i18n` links, hreflang and x-default, the `lang` attribute, EmDash content translation, Paraglide JS UI strings with the middleware for on-demand and prerendered pages, `Intl` dates and numbers, and RTL. |
| [UI-UX.md](UI-UX.md) | How the UI behaves: WCAG 2.2 AA accessibility, loading, empty, and error states, forms, toasts, form results without an island (session flash message), motion, navigation, and theme in `localStorage`. |

## Quality and operations

| File | Contents |
| --- | --- |
| [QUALITY.md](QUALITY.md) | TypeScript strict flags, `astro check`, ESLint with `eslint-plugin-astro` and `typescript-eslint`, Prettier, Knip for unused code with entry globs, `package.json` scripts, and the full PR check order. |
| [TESTING.md](TESTING.md) | Vitest, the Cloudflare Vitest plugin, Istanbul coverage with 80 % thresholds, per-app D1 migrations in tests, Storybook with Storybook Astro, ARIA snapshots, screenshot tests, Playwright end-to-end tests, axe, payment test mode, email capture, and CI. |
| [PERF.md](PERF.md) | Core Web Vitals targets and field measurement, CPU time budget for Workers, D1 location hint and Targeted Placement, Astro route caching, and the Cache API. |
| [SECURITY.md](SECURITY.md) | Secrets, security headers (the CSP module, HSTS, `_headers`, middleware), CSRF, input validation, XSS, SQL injection, open redirects, SSRF, auth checks, the dev-bypass check in production, Turnstile and WAF rate limits, and security.txt. |
| [PRIVACY.md](PRIVACY.md) | Cloudflare Web Analytics, cookie consent (ePrivacy Article 5(3)) with Turnstile, the privacy policy page, data minimization, user data access, export, and delete (GDPR), the processors and the transfer to the United States in the policy, and data residency. |
| [OBSERVABILITY.md](OBSERVABILITY.md) | Workers Logs, structured logs without personal data, `wrangler tail`, Effect logging and spans, Sentry for Cloudflare and Astro (it wraps the `src/worker.ts` handler), release names and source maps, CSP and privacy policy entries for Sentry, alerts, and a health endpoint. |
| [DEPS.md](DEPS.md) | npm and `package-lock.json`, `npm ci`, Dependabot (groups, schedule, ignore, automerge workflow, cooldown), `npm audit`, rules for a new package, version sync of Astro, Wrangler, and EmDash, and `compatibility_date`. |
| [DEV.md](DEV.md) | Local dev with `astro dev`, the remote Images binding, and build tests with `astro preview`. |
| [DEPLOY.md](DEPLOY.md) | Environments (dev, stage, prod) with the `env.production` key list, gradual deployments, version URLs, migration order, EmDash core migrations in CI, shared dev database migrations, D1 Time Travel, rollback, secrets, GitHub Actions (PR previews, dev deploy on push to `main`, stage approval, token permissions), and Previews. |

## Writing

| File | Contents |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Rules for agents that add or change a rule in this folder. `CLAUDE.md` imports it for Claude Code. |
| [WRITING.md](WRITING.md) | Rules for docs (Google developer documentation style guide) and UI text (Material Design 3 content design, Mailchimp voice and tone). |
