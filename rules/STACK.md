# Tech Stack Rules

## Language

### [TypeScript](https://www.typescriptlang.org/)

- Use TypeScript in strict mode. Follow the rules in [QUALITY.md](QUALITY.md).

### [Effect](https://effect.website)

- Use Effect for typed errors, async code, and dependency injection. Follow the rules in [ARCH.md](ARCH.md).

### [Zod](https://zod.dev)

- Use Zod for all schemas and validation. Follow the rules in [ARCH.md](ARCH.md).

## Backend

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

- Use Cloudflare Workers to run the site and the app. Follow the rules in [ARCH.md](ARCH.md), [PERF.md](PERF.md), [SECURITY.md](SECURITY.md), [DEV.md](DEV.md), and [DEPLOY.md](DEPLOY.md).

### [OpenAPI](https://spec.openapis.org/oas/v3.1.1.html)

- Use OpenAPI 3.1, generated from Zod schemas, as the contract for each app API. Follow the rules in [API.md](API.md).

### Background work

- Use `waitUntil()`, Queues, Cron Triggers, or Workflows for background work. Follow the rules in [ARCH.md](ARCH.md).

## Data

### [Kysely](https://kysely.dev)

- Use Kysely for SQL queries on D1. Do not use an ORM such as Drizzle or Prisma. Follow the rules in [DATA.md](DATA.md).

## Frontend

### [Astro](https://docs.astro.build/)

- Use Astro as the framework. Build pages with as little client JavaScript as possible. Follow the rules in [ARCH.md](ARCH.md), [PERF.md](PERF.md), and [QUALITY.md](QUALITY.md).

### [TanStack](https://tanstack.com)

- Use TanStack libraries only in highly interactive React islands. Follow the rules in [ARCH.md](ARCH.md).

## Design

### [Tailwind CSS](https://tailwindcss.com)

- Use Tailwind CSS v4 for styles. Follow the rules in [DESIGN.md](DESIGN.md).

### [Fulldev UI](https://ui.full.dev)

- Use Fulldev UI for `.astro` components and page blocks. Follow the rules in [COMPONENTS.md](COMPONENTS.md).

### [Base UI](https://base-ui.com)

- Use Base UI for interactive components, styled with Tailwind CSS. Follow the rules in [COMPONENTS.md](COMPONENTS.md).

### [shadcn/ui](https://ui.shadcn.com)

- Use shadcn/ui components on Base UI for React islands. Follow the rules in [COMPONENTS.md](COMPONENTS.md).

### [Material Design 3](https://m3.material.io/foundations/layout/layout-overview)

- Use Material Design 3 for layout, spacing, states, motion, color, and component sizes. Follow the rules in [MATERIAL.md](MATERIAL.md).

## Site

### [Astro i18n](https://docs.astro.build/en/guides/internationalization/)

- Use Astro i18n routing and Paraglide JS for translated pages. Follow the rules in [I18N.md](I18N.md).

### [Astro images](https://docs.astro.build/en/guides/images/)

- Use `astro:assets` for images and the Astro fonts API for fonts. Follow the rules in [MEDIA.md](MEDIA.md).

### [EmDash SEO](https://docs.emdashcms.com/guides/seo/)

- Use the EmDash SEO fields and `@astrojs/sitemap` for SEO. Follow the rules in [SEO.md](SEO.md).

## Testing

### [Vitest](https://vitest.dev)

- Use Vitest for unit, integration, and component tests. Follow the rules in [TESTING.md](TESTING.md).

### [Storybook](https://storybook.js.org)

- Use Storybook with Storybook Astro for `.astro` components and React islands. Follow the rules in [TESTING.md](TESTING.md).

### [Playwright](https://playwright.dev)

- Use Playwright for end-to-end, screenshot, and accessibility tests of pages. Follow the rules in [TESTING.md](TESTING.md).

## Email

### [React Email](https://react.email)

- Use React Email for transactional emails. Follow the rules in [EMAIL.md](EMAIL.md).

## CMS

### [EmDash](https://docs.emdashcms.com/)

- Use EmDash as the CMS. Follow the rules in [CMS.md](CMS.md).

### [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth)

- Use emdash-better-auth for login of site users. Follow the rules in [AUTH.md](AUTH.md).

## Quality

### [ESLint](https://eslint.org/docs/latest/use/configure/configuration-files)

- Use ESLint, Prettier, and Knip. Follow the rules in [QUALITY.md](QUALITY.md).

## Operations

### [Sentry](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)

- Use Workers Logs and Sentry for logs and errors. Follow the rules in [OBSERVABILITY.md](OBSERVABILITY.md).

### [Dependabot](https://docs.github.com/en/code-security/dependabot)

- Use Dependabot for dependency updates. Follow the rules in [DEPS.md](DEPS.md).

### [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/)

- Use Cloudflare Web Analytics for analytics. Follow the rules in [PRIVACY.md](PRIVACY.md).
