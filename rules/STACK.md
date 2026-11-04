# STACK

Registry of every name in `rules/`. Each entry: scope, topic files, sources. Load sources in this order: `llms` > `context7` > `docs` > `github`. Install `skills` with `pnpm dlx skills add <owner>/<repo> --skill <name>`.

Context7 URLs take `?tokens=<n>`; raise it for a deep lookup.

## Language

### Node.js

Active LTS, for tooling and CI. → [DEPS](DEPS.md), [SETUP](SETUP.md)

- llms: https://nodejs.org/llms.txt
- docs: https://nodejs.org/en/about/previous-releases
- context7: https://context7.com/websites/nodejs_api/llms.txt?tokens=10000
- github: https://github.com/nodejs/node

### TypeScript

Strict. → [QUALITY](QUALITY.md)

- docs: https://www.typescriptlang.org/docs/
- context7: https://context7.com/websites/typescriptlang/llms.txt?tokens=10000
- github: https://github.com/microsoft/TypeScript
- skills: https://skills.sh/wshobson/agents/typescript-advanced-types

### Effect

Typed errors, async, DI. → [ARCH](ARCH.md), [OBSERVABILITY](OBSERVABILITY.md)

- docs: https://effect.website/docs/
- context7: https://context7.com/effect-ts/website/llms.txt?tokens=10000
- github: https://github.com/Effect-TS/effect
- skills: https://skills.sh/effect-ts/skills/effect-ts

### Zod

All schemas, `decode` helper. → [ARCH](ARCH.md), [API](API.md), [SECURITY](SECURITY.md)

- llms: https://zod.dev/llms.txt · https://zod.dev/llms-full.txt
- context7: https://context7.com/llmstxt/zod_dev_llms-full_txt/llms.txt?tokens=10000
- github: https://github.com/colinhacks/zod
- skills: https://skills.sh/pproenca/dot-skills/zod

## Cloudflare

### Cloudflare

Platform index. All products below.

- llms: https://developers.cloudflare.com/llms.txt
- context7: https://context7.com/cloudflare/cloudflare-docs/llms.txt?tokens=10000
- github: https://github.com/cloudflare/cloudflare-docs
- skills: https://skills.sh/cloudflare/skills/cloudflare · https://skills.sh/cloudflare/skills/workers-best-practices

### Workers

Runtime for site and apps. → [ARCH](ARCH.md), [PERF](PERF.md), [CLOUDFLARE](CLOUDFLARE.md), [SECURITY](SECURITY.md), [DEV](DEV.md), [DEPLOY](DEPLOY.md), [OBSERVABILITY](OBSERVABILITY.md)

- llms: https://developers.cloudflare.com/workers/llms.txt · https://developers.cloudflare.com/workers/llms-full.txt
- context7: https://context7.com/llmstxt/developers_cloudflare_workers_llms-full_txt/llms.txt?tokens=10000
- github: https://github.com/cloudflare/workers-sdk
- skills: https://skills.sh/cloudflare/skills/workers-best-practices

### Workers platform APIs

Cron Triggers, Rate Limiting binding, Cache API, Workers Logs, Analytics Engine. → [SAAS](SAAS.md), [ARCH](ARCH.md), [API](API.md), [SECURITY](SECURITY.md), [PERF](PERF.md), [OBSERVABILITY](OBSERVABILITY.md)

- docs: https://developers.cloudflare.com/workers/configuration/cron-triggers/ · https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/ · https://developers.cloudflare.com/workers/runtime-apis/cache/ · https://developers.cloudflare.com/workers/observability/logs/workers-logs/ · https://developers.cloudflare.com/analytics/analytics-engine/
- llms: https://developers.cloudflare.com/workers/llms-full.txt

### Workers KV

→ [PERF](PERF.md)

- llms: https://developers.cloudflare.com/kv/llms.txt · https://developers.cloudflare.com/kv/llms-full.txt
- context7: https://context7.com/llmstxt/developers_cloudflare_kv_llms_txt/llms.txt?tokens=10000

### Cloudflare Access

Protects version URLs and previews. → [DEPLOY](DEPLOY.md)

- llms: https://developers.cloudflare.com/cloudflare-one/llms.txt
- docs: https://developers.cloudflare.com/cloudflare-one/policies/access/

### Wrangler

CLI, environments, D1 migrations, secrets. → [SETUP](SETUP.md), [DEPLOY](DEPLOY.md), [DATA](DATA.md)

- docs: https://developers.cloudflare.com/workers/wrangler/
- context7: https://context7.com/cloudflare/workers-sdk/llms.txt?tokens=10000 · https://context7.com/cloudflare/wrangler-action/llms.txt?tokens=10000
- github: https://github.com/cloudflare/workers-sdk · https://github.com/cloudflare/wrangler-action
- skills: https://skills.sh/cloudflare/skills/wrangler

### D1

SQLite database, one per app. → [DATA](DATA.md), [SAAS](SAAS.md), [DEPLOY](DEPLOY.md), [PRIVACY](PRIVACY.md)

- llms: https://developers.cloudflare.com/d1/llms.txt · https://developers.cloudflare.com/d1/llms-full.txt
- context7: https://context7.com/llmstxt/developers_cloudflare_d1_llms-full_txt/llms.txt?tokens=10000

### R2

Media and user uploads. → [MEDIA](MEDIA.md), [SAAS](SAAS.md)

- llms: https://developers.cloudflare.com/r2/llms.txt · https://developers.cloudflare.com/r2/llms-full.txt
- context7: https://context7.com/websites/developers_cloudflare_r2/llms.txt?tokens=10000

### Queues

Background work with a dead letter queue, app email. → [ARCH](ARCH.md), [EMAIL](EMAIL.md)

- llms: https://developers.cloudflare.com/queues/llms.txt · https://developers.cloudflare.com/queues/llms-full.txt
- context7: https://context7.com/websites/developers_cloudflare_queues/llms.txt?tokens=10000

### Workflows

Durable multi-step background work. → [ARCH](ARCH.md)

- llms: https://developers.cloudflare.com/workflows/llms.txt · https://developers.cloudflare.com/workflows/llms-full.txt
- context7: https://context7.com/llmstxt/developers_cloudflare_workflows_llms-full_txt/llms.txt?tokens=10000
- github: https://github.com/cloudflare/workflows-starter

### Durable Objects

Per-entity state, real time. → [SAAS](SAAS.md)

- llms: https://developers.cloudflare.com/durable-objects/llms.txt · https://developers.cloudflare.com/durable-objects/llms-full.txt
- context7: https://context7.com/websites/developers_cloudflare_durable-objects/llms.txt?tokens=10000
- skills: https://skills.sh/cloudflare/skills/durable-objects

### PartyServer

Real time on Durable Objects. → [SAAS](SAAS.md)

- context7: https://context7.com/cloudflare/partykit/llms.txt?tokens=10000
- github: https://github.com/cloudflare/partykit

### Cloudflare Images

Images binding. → [MEDIA](MEDIA.md), [DEV](DEV.md)

- llms: https://developers.cloudflare.com/images/llms.txt · https://developers.cloudflare.com/images/llms-full.txt
- context7: https://context7.com/llmstxt/developers_cloudflare_images_llms-full_txt/llms.txt?tokens=10000

### Cloudflare Email Service

The only email transport. → [EMAIL](EMAIL.md), [AUTH](AUTH.md)

- llms: https://developers.cloudflare.com/email-service/llms.txt · https://developers.cloudflare.com/email-service/llms-full.txt
- context7: https://context7.com/websites/developers_cloudflare_email-service/llms.txt?tokens=10000
- skills: https://skills.sh/cloudflare/skills/cloudflare-email-service

### Turnstile

Bot protection, consent-free. → [SECURITY](SECURITY.md), [PRIVACY](PRIVACY.md)

- llms: https://developers.cloudflare.com/turnstile/llms.txt · https://developers.cloudflare.com/turnstile/llms-full.txt
- context7: https://context7.com/websites/developers_cloudflare_turnstile/llms.txt?tokens=10000
- skills: https://skills.sh/cloudflare/skills/turnstile-spin

### WAF

Rate limiting rules. → [SECURITY](SECURITY.md)

- llms: https://developers.cloudflare.com/waf/llms.txt · https://developers.cloudflare.com/waf/llms-full.txt
- context7: https://context7.com/websites/developers_cloudflare_waf/llms.txt?tokens=10000

### Web Analytics

Cookieless analytics. → [PRIVACY](PRIVACY.md), [PERF](PERF.md)

- llms: https://developers.cloudflare.com/web-analytics/llms.txt · https://developers.cloudflare.com/web-analytics/llms-full.txt
- context7: https://context7.com/websites/developers_cloudflare_analytics/llms.txt?tokens=10000

### Flagship

Feature flags. → [SAAS](SAAS.md)

- llms: https://developers.cloudflare.com/flagship/llms.txt · https://developers.cloudflare.com/flagship/llms-full.txt
- github: https://github.com/cloudflare/flagship

### Web performance

Core Web Vitals, field data. → [PERF](PERF.md)

- docs: https://web.dev/articles/vitals
- context7: https://context7.com/googlechrome/web-vitals/llms.txt?tokens=10000
- github: https://github.com/GoogleChrome/web-vitals
- skills: https://skills.sh/cloudflare/skills/web-perf · https://skills.sh/addyosmani/web-quality-skills/core-web-vitals

## Data

### Kysely

Query builder on D1 via kysely-d1. No ORM. → [DATA](DATA.md), [SAAS](SAAS.md), [SECURITY](SECURITY.md)

- llms: https://kysely.dev/llms.txt · https://kysely.dev/llms-full.txt
- context7: https://context7.com/websites/kysely_dev/llms.txt?tokens=10000 · https://context7.com/aidenwallis/kysely-d1/llms.txt?tokens=10000
- github: https://github.com/kysely-org/kysely · https://github.com/aidenwallis/kysely-d1
- skills: https://skills.sh/mindrally/skills/kysely

## CMS and auth

### EmDash

CMS, plugins, SEO fields, i18n, media. Reference for Kysely on D1. → [CMS](CMS.md), [SAAS](SAAS.md), [SETUP](SETUP.md), [SEO](SEO.md), [I18N](I18N.md), [MEDIA](MEDIA.md)

- llms: https://docs.emdashcms.com/llms.txt
- context7: https://context7.com/emdash-cms/emdash/llms.txt?tokens=10000
- github: https://github.com/emdash-cms/emdash
- skills: https://skills.sh/emdash-cms/emdash/building-emdash-site · https://skills.sh/emdash-cms/emdash/emdash-cli · https://skills.sh/emdash-cms/skills/upgrading-emdash

### PolyStella

AI translation of EmDash content (`@cloudflare/polystella-emdash` plugin, Workers AI). Not for UI strings. → [I18N](I18N.md), [SETUP](SETUP.md)

- context7: https://context7.com/cloudflare/polystella/llms.txt?tokens=10000
- github: https://github.com/cloudflare/polystella
- skills: https://skills.sh/cloudflare/polystella/polystella-consumer

### emdash-better-auth

Site user login, organizations, Stripe billing, access. → [AUTH](AUTH.md), [PAYMENTS](PAYMENTS.md)

- github: https://github.com/theweekendprojects/emdash-better-auth

### Better Auth

Engine under emdash-better-auth: plugins, organizations, delete user. → [AUTH](AUTH.md), [PRIVACY](PRIVACY.md)

- llms: https://better-auth.com/llms.txt
- context7: https://context7.com/websites/better-auth/llms.txt?tokens=10000
- github: https://github.com/better-auth/better-auth
- skills: https://skills.sh/better-auth/skills/better-auth-best-practices · https://skills.sh/better-auth/skills/better-auth-security-best-practices · https://skills.sh/better-auth/skills/organization-best-practices

## API

### OpenAPI

3.1 contract, generated from Zod. → [API](API.md)

- docs: https://spec.openapis.org/oas/v3.1.1.html
- context7: https://context7.com/oai/openapi-specification/llms.txt?tokens=10000
- github: https://github.com/OAI/OpenAPI-Specification

### zod-openapi

Zod to OpenAPI. → [API](API.md)

- context7: https://context7.com/samchungy/zod-openapi/llms.txt?tokens=10000
- github: https://github.com/samchungy/zod-openapi

### Redocly CLI

Lint and bundle the OpenAPI document. → [API](API.md)

- llms: https://redocly.com/llms.txt · https://redocly.com/llms-full.txt
- context7: https://context7.com/redocly/redocly-cli/llms.txt?tokens=10000
- github: https://github.com/Redocly/redocly-cli
- skills: https://skills.sh/redocly/redocly-cli/redocly-cli

### oasdiff

Breaking-change check. → [API](API.md)

- llms: https://www.oasdiff.com/llms.txt
- context7: https://context7.com/oasdiff/oasdiff/llms.txt?tokens=10000
- github: https://github.com/oasdiff/oasdiff

### openapi-fetch

Typed client. → [API](API.md)

- docs: https://openapi-ts.dev/openapi-fetch/
- context7: https://context7.com/openapi-ts/openapi-typescript/llms.txt?tokens=10000
- github: https://github.com/openapi-ts/openapi-typescript

### Standard Webhooks

Outgoing webhooks. → [API](API.md), [SAAS](SAAS.md)

- docs: https://www.standardwebhooks.com/
- context7: https://context7.com/standard-webhooks/standard-webhooks/llms.txt?tokens=10000
- github: https://github.com/standard-webhooks/standard-webhooks

### RFC 9457

Problem Details errors. → [API](API.md)

- docs: https://www.rfc-editor.org/rfc/rfc9457

## Payments

### Stripe

Billing outside EU sales. → [PAYMENTS](PAYMENTS.md)

- llms: https://docs.stripe.com/llms.txt
- context7: https://context7.com/websites/stripe/llms.txt?tokens=10000
- github: https://github.com/stripe/stripe-node
- skills: https://skills.sh/stripe/ai/stripe-best-practices

### Creem

EU sales (merchant of record). → [PAYMENTS](PAYMENTS.md)

- llms: https://docs.creem.io/llms.txt · https://docs.creem.io/llms-full.txt
- context7: https://context7.com/websites/creem_io/llms.txt?tokens=10000
- github: https://github.com/armitage-labs/creem
- skills: https://skills.sh/armitage-labs/creem-skills/creem

### x402

Agent payments. → [PAYMENTS](PAYMENTS.md)

- llms: https://www.x402.org/llms.txt
- context7: https://context7.com/coinbase/x402/llms.txt?tokens=10000
- github: https://github.com/coinbase/x402

## Frontend

### Astro

Framework: islands, actions, endpoints, i18n, images, fonts, CSP, sessions, Cloudflare adapter. → [ARCH](ARCH.md), [COMPONENTS](COMPONENTS.md), [PERF](PERF.md), [QUALITY](QUALITY.md), [SEO](SEO.md), [MEDIA](MEDIA.md), [I18N](I18N.md), [UI-UX](UI-UX.md), [SECURITY](SECURITY.md), [DEV](DEV.md)

- docs: https://docs.astro.build/
- context7: https://context7.com/websites/astro_build_en/llms.txt?tokens=10000 · https://context7.com/llmstxt/astro_build_llms-full_txt/llms.txt?tokens=10000
- github: https://github.com/withastro/astro · https://github.com/withastro/docs
- docs (Cloudflare adapter): https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- github (Cloudflare adapter): https://github.com/withastro/astro/tree/main/packages/integrations/cloudflare
- mcp: https://mcp.docs.astro.build/mcp
- skills: https://skills.sh/astrolicious/agent-skills/astro

### React

Islands only. React 19. → [COMPONENTS](COMPONENTS.md), [ARCH](ARCH.md)

- llms: https://react.dev/llms.txt
- context7: https://context7.com/reactjs/react.dev/llms.txt?tokens=10000
- github: https://github.com/reactjs/react.dev
- skills: https://www.skills.sh/vercel-labs/agent-skills/vercel-react-best-practices · https://skills.sh/vercel-labs/agent-skills/vercel-composition-patterns
- tools: https://www.react.doctor/llms.txt · https://skills.sh/millionco/react-doctor/react-doctor

### TanStack

Query, Form, Table in highly interactive islands only. → [ARCH](ARCH.md)

- llms: https://tanstack.com/llms.txt · https://tanstack.com/llms-full.txt
- context7: https://context7.com/tanstack/query/llms.txt?tokens=10000
- github: https://github.com/TanStack/query
- skills: https://skills.sh/tanstack-skills/tanstack-skills/tanstack-query

## Design

### Tailwind CSS

v4 styles. → [DESIGN](DESIGN.md), [UI-UX](UI-UX.md)

- docs: https://tailwindcss.com/docs
- context7: https://context7.com/tailwindlabs/tailwindcss.com/llms.txt?tokens=10000
- github: https://github.com/tailwindlabs/tailwindcss
- skills: https://skills.sh/lombiq/tailwind-agent-skills/tailwind-4-docs

### Tailwind Variants

`tv()` variants and slots, built-in class merge. Replaces `class-variance-authority`. → [DESIGN](DESIGN.md), [COMPONENTS](COMPONENTS.md), [MATERIAL](MATERIAL.md)

- llms: https://www.tailwind-variants.org/llms.txt · https://www.tailwind-variants.org/llms-full.txt
- context7: https://context7.com/websites/tailwind-variants/llms.txt?tokens=10000
- github: https://github.com/heroui-inc/tailwind-variants
- mcp: https://www.tailwind-variants.org/api/mcp

### Material Symbols

Icon font for all icons, through the Astro Google Icons font provider. → [MEDIA](MEDIA.md)

- docs: https://developers.google.com/fonts/docs/material_symbols
- github: https://github.com/google/material-design-icons
- tools: https://fonts.google.com/icons

### Fulldev UI

`.astro` components and blocks via the shadcn CLI. → [COMPONENTS](COMPONENTS.md), [SETUP](SETUP.md)

- llms: https://ui.full.dev/llms.txt · https://ui.full.dev/llms-full.txt
- context7: https://context7.com/websites/ui_full_dev/llms.txt?tokens=10000
- github: https://github.com/fulldotdev/ui
- skills: https://skills.sh/fulldotdev/ui/fulldev-ui

### shadcn/ui

React island components on Base UI, style `base-vega`. → [COMPONENTS](COMPONENTS.md)

- llms: https://ui.shadcn.com/llms.txt
- context7: https://context7.com/shadcn-ui/ui/llms.txt?tokens=10000
- github: https://github.com/shadcn-ui/ui
- skills: https://skills.sh/shadcn-ui/ui/shadcn

### Base UI

Headless primitives for islands. No Radix. → [COMPONENTS](COMPONENTS.md), [DESIGN](DESIGN.md), [UI-UX](UI-UX.md)

- llms: https://base-ui.com/llms.txt · https://base-ui.com/llms-full.txt
- context7: https://context7.com/mui/base-ui/llms.txt?tokens=10000
- github: https://github.com/mui/base-ui

### Kumo

Admin pages of native EmDash plugins only. → [DESIGN](DESIGN.md), [ARCH](ARCH.md)

- llms: https://kumo-ui.com/llms.txt
- context7: https://context7.com/cloudflare/kumo/llms.txt?tokens=10000
- github: https://github.com/cloudflare/kumo
- skills: https://skills.sh/cloudflare/kumo/kumo-design

### Material Design 3

Layout, spacing, states, motion, color, sizes, MD3 Expressive. → [MATERIAL](MATERIAL.md), [WRITING](WRITING.md)

- docs: https://m3.material.io/
- context7: https://context7.com/websites/m3_material_io/llms.txt?tokens=10000 · https://context7.com/material-components/material-web/llms.txt?tokens=10000
- github: https://github.com/material-components/material-web · https://github.com/material-foundation/material-color-utilities
- skills: https://skills.sh/hamen/material-3-skill/material-3

### WCAG 2.2

AA for behavior, states, forms, theme. → [UI-UX](UI-UX.md), [TESTING](TESTING.md)

- docs: https://www.w3.org/TR/WCAG22/ · https://www.w3.org/WAI/ARIA/apg/
- context7: https://context7.com/websites/w3_wai_wcag22/llms.txt?tokens=10000 · https://context7.com/w3c/aria-practices/llms.txt?tokens=10000
- github: https://github.com/w3c/wcag · https://github.com/w3c/aria-practices
- skills: https://skills.sh/addyosmani/web-quality-skills/accessibility · https://skills.sh/vercel-labs/agent-skills/web-design-guidelines

### MDN

Web platform reference: HTML, `Intl`, `dir`, `prefers-color-scheme`, `console`, `<video>`. → [I18N](I18N.md), [UI-UX](UI-UX.md), [MEDIA](MEDIA.md)

- docs: https://developer.mozilla.org/
- context7: https://context7.com/mdn/content/llms.txt?tokens=10000
- github: https://github.com/mdn/content

## Site

### Paraglide JS

UI strings; `inlang check` (`@inlang/cli`) for missing translations and variables. → [I18N](I18N.md), [SAAS](SAAS.md)

- llms: https://paraglidejs.com/llms.txt
- context7: https://context7.com/opral/paraglide-js/llms.txt?tokens=10000
- github: https://github.com/opral/paraglide-js

### Google Search Central

Titles, descriptions, canonical, sitemaps, robots, hreflang, structured data. → [SEO](SEO.md), [I18N](I18N.md)

- docs: https://developers.google.com/search/docs
- context7: https://context7.com/websites/developers_google_search/llms.txt?tokens=10000
- skills: https://skills.sh/coreyhaines31/marketingskills/seo-audit

### Schema.org

JSON-LD. → [SEO](SEO.md)

- docs: https://schema.org/
- context7: https://context7.com/websites/schema/llms.txt?tokens=10000
- github: https://github.com/schemaorg/schemaorg

### Open Graph

→ [SEO](SEO.md)

- docs: https://ogp.me/

### llms.txt

→ [SEO](SEO.md)

- llms: https://llmstxt.org/llms.txt
- github: https://github.com/AnswerDotAI/llms-txt

## Testing

### Vitest

Unit, integration, component tests. → [TESTING](TESTING.md)

- llms: https://vitest.dev/llms.txt · https://vitest.dev/llms-full.txt
- context7: https://context7.com/vitest-dev/vitest/llms.txt?tokens=10000
- github: https://github.com/vitest-dev/vitest
- skills: https://skills.sh/antfu/skills/vitest

### Cloudflare Vitest plugin

`@cloudflare/vitest-pool-workers`. → [TESTING](TESTING.md)

- docs: https://developers.cloudflare.com/workers/testing/vitest-integration/
- github: https://github.com/cloudflare/workers-sdk/tree/main/packages/vitest-plugin

### Storybook

Stories for `.astro` and React. → [TESTING](TESTING.md), [SETUP](SETUP.md)

- llms: https://storybook.js.org/llms.txt · https://storybook.js.org/llms-full.txt
- context7: https://context7.com/storybookjs/storybook/llms.txt?tokens=10000
- github: https://github.com/storybookjs/storybook

### Storybook Astro

`@storybook-astro/framework`. → [TESTING](TESTING.md)

- github: https://github.com/storybook-astro/storybook-astro

### Playwright

End-to-end, screenshots, ARIA snapshots. → [TESTING](TESTING.md), [SETUP](SETUP.md)

- docs: https://playwright.dev/docs/intro
- context7: https://context7.com/websites/playwright_dev/llms.txt?tokens=10000
- github: https://github.com/microsoft/playwright
- skills: https://skills.sh/microsoft/playwright-cli/playwright-cli · https://skills.sh/currents-dev/playwright-best-practices-skill/playwright-best-practices

### axe

`@axe-core/playwright`. → [TESTING](TESTING.md)

- docs: https://playwright.dev/docs/accessibility-testing
- context7: https://context7.com/dequelabs/axe-core-npm/llms.txt?tokens=10000
- github: https://github.com/dequelabs/axe-core-npm

## Email

### React Email

Transactional templates. → [EMAIL](EMAIL.md), [SAAS](SAAS.md)

- llms: https://react.email/llms.txt · https://react.email/llms-full.txt
- context7: https://context7.com/resend/react-email/llms.txt?tokens=10000
- github: https://github.com/resend/react-email
- skills: https://skills.sh/resend/react-email/react-email

### emailcn

React Email blocks via the shadcn `@emailcn` registry. → [EMAIL](EMAIL.md)

- docs: https://emailcn.run/docs
- context7: https://context7.com/shadcn-labs/emailcn/llms.txt?tokens=10000

## Quality

### Oxlint

The only linter, with `oxlint-tsgolint`, `oxlint-plugin-react-doctor`, and `@e18e/eslint-plugin`. → [QUALITY](QUALITY.md)

- llms: https://oxc.rs/llms.txt · https://oxc.rs/llms-full.txt
- context7: https://context7.com/websites/oxc_rs_guide_usage/llms.txt?tokens=10000
- github: https://github.com/oxc-project/oxc · https://github.com/millionco/react-doctor · https://github.com/e18e/eslint-plugin

### Oxfmt

Formatter. → [QUALITY](QUALITY.md)

- docs: https://oxc.rs/docs/guide/usage/formatter
- llms: https://oxc.rs/llms.txt · https://oxc.rs/llms-full.txt
- context7: https://context7.com/websites/oxc_rs_guide_usage/llms.txt?tokens=10000
- github: https://github.com/oxc-project/oxc

### Knip

Unused files, exports, dependencies. → [QUALITY](QUALITY.md)

- docs: https://knip.dev/
- context7: https://context7.com/websites/knip_dev/llms.txt?tokens=10000
- github: https://github.com/webpro-nl/knip
- skills: https://skills.sh/brianlovin/agent-config/knip

### Size Limit

Per-island client JavaScript limit (`.size-limit.mjs`, `@size-limit/file`). → [PERF](PERF.md), [QUALITY](QUALITY.md)

- github: https://github.com/ai/size-limit
- docs: https://raw.githubusercontent.com/ai/size-limit/main/README.md

### es-module-lexer

Static import discovery in built chunks for the per-page limit (`es-module-lexer/js`). → [PERF](PERF.md)

- github: https://github.com/guybedford/es-module-lexer
- docs: https://raw.githubusercontent.com/guybedford/es-module-lexer/main/README.md

### parse5

HTML parsing for the per-page limit (scripts, preloads, islands). → [PERF](PERF.md)

- docs: https://parse5.js.org/
- context7: https://context7.com/inikulin/parse5/llms.txt?tokens=10000
- github: https://github.com/inikulin/parse5

## Operations

### Sentry

Errors, releases, source maps, alerts, uptime. → [OBSERVABILITY](OBSERVABILITY.md), [SETUP](SETUP.md)

- llms: https://docs.sentry.io/llms.txt
- context7: https://context7.com/getsentry/sentry-javascript/llms.txt?tokens=10000 · https://context7.com/getsentry/sentry-docs/llms.txt?tokens=10000
- github: https://github.com/getsentry/sentry-javascript
- skills: https://skills.sh/getsentry/sentry-for-ai/sentry-cloudflare-sdk

### OpenTelemetry

Trace export from Workers. → [OBSERVABILITY](OBSERVABILITY.md)

- llms: https://opentelemetry.io/llms.txt
- context7: https://context7.com/open-telemetry/opentelemetry-js/llms.txt?tokens=10000
- github: https://github.com/open-telemetry/opentelemetry-js

### GitHub Actions

CI, deploys, PR previews. → [DEPLOY](DEPLOY.md), [QUALITY](QUALITY.md), [TESTING](TESTING.md)

- llms: https://docs.github.com/llms.txt
- context7: https://context7.com/websites/github_en_actions/llms.txt?tokens=10000
- github: https://github.com/actions/toolkit

### Dependabot

Version updates, groups, cooldown, automerge. → [DEPS](DEPS.md)

- llms: https://docs.github.com/llms.txt
- context7: https://context7.com/github/docs/llms.txt?tokens=10000 · https://context7.com/dependabot/dependabot-core/llms.txt?tokens=10000
- github: https://github.com/dependabot/dependabot-core
- skills: https://skills.sh/github/awesome-copilot/dependabot

### pnpm

`pnpm install --frozen-lockfile`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `allowBuilds`, `minimumReleaseAge`, `audit`, `pnpm/action-setup`. → [DEPS](DEPS.md), [QUALITY](QUALITY.md)

- docs: https://pnpm.io/
- context7: https://context7.com/pnpm/pnpm/llms.txt?tokens=10000
- github: https://github.com/pnpm/pnpm · https://github.com/pnpm/action-setup

### skills CLI

Agent skills. → [SETUP](SETUP.md)

- docs: https://skills.sh/
- github: https://github.com/vercel-labs/skills
- skills: https://skills.sh/vercel-labs/skills/find-skills

## Security and privacy

### OWASP Cheat Sheets

CSRF, XSS, SSRF, open redirects. → [SECURITY](SECURITY.md)

- docs: https://cheatsheetseries.owasp.org/
- context7: https://context7.com/owasp/cheatsheetseries/llms.txt?tokens=10000
- github: https://github.com/OWASP/CheatSheetSeries
- skills: https://skills.sh/addyosmani/agent-skills/security-and-hardening · https://skills.sh/getsentry/skills/security-review

### security.txt

RFC 9116. → [SECURITY](SECURITY.md)

- docs: https://www.rfc-editor.org/rfc/rfc9116

### GDPR and ePrivacy

GDPR Articles 5, 12, 13, 15, 17, 20; ePrivacy Article 5(3); EDPB Guidelines 2/2023. → [PRIVACY](PRIVACY.md)

- docs: https://gdpr-info.eu/ · https://eur-lex.europa.eu/eli/dir/2002/58/oj · https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2023/guidelines-22023-technical-scope-art-53-eprivacy_en

## Writing

### Google developer documentation style guide

Docs, rules, comments, commits. → [WRITING](WRITING.md)

- docs: https://developers.google.com/style
- context7: https://context7.com/websites/developers_google_style/llms.txt?tokens=10000

### Mailchimp content style guide

Voice and tone only. → [WRITING](WRITING.md)

- docs: https://styleguide.mailchimp.com/voice-and-tone/
- github: https://github.com/mailchimp/content-style-guide
