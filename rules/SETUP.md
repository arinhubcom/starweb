# SETUP

Set up a new Starweb project with these steps, in order. Later steps depend on earlier ones. Each step links to the rules for its topic.

## Project

### [create-emdash](https://github.com/emdash-cms/emdash/tree/main/packages/create-emdash)

1. Check that `node --version` is 22.16.0 or later.
2. Create the project from the EmDash Cloudflare starter template: `npm create emdash@latest my-site -- --template cloudflare:starter --install --yes`. Replace `my-site` with the project name. Add `--sandboxed-plugins` only when the site uses sandboxed plugins: it needs a Workers paid plan. Do not use the `node` platform. Follow the rules in [CMS.md](CMS.md).
3. Rename the `AGENTS.md` file of the template to `EMDASH.md`.
4. Copy `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `WHY.md`, and the `rules/` folder from the [Starweb repository](https://github.com/arinhubcom/starweb) to the project root.
5. Add `- Follow the rules in [EMDASH.md](EMDASH.md) for the EmDash template.` to the `## Rules` list in `AGENTS.md`.
6. Run `git init`. Keep the `.gitignore` of the template: it ignores `.env` and `.dev.vars`.

## Cloudflare

### [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

7. Log in to Cloudflare with `npx wrangler login`.
8. Set `compatibility_date` in `wrangler.jsonc` to `2026-08-04` or later, and remove `nodejs_compat` from `compatibility_flags`. The template sets an older date. Follow the rules in [ARCH.md](ARCH.md).
9. Keep the binding names `DB` and `MEDIA`, and the `src/worker.ts` entrypoint from the template. The EmDash adapters need them. Follow the rules in [SAAS.md](SAAS.md) (Architecture).
10. Add the `CF_VERSION_METADATA` version metadata binding. Follow the rules in [DEPLOY.md](DEPLOY.md) (Releases).
11. Keep local secrets in the `.env` file that `create-emdash` writes with `EMDASH_ENCRYPTION_KEY`. Do not add a `.dev.vars` file: when it exists, Wrangler ignores `.env`. Follow the rules in [SECURITY.md](SECURITY.md).

## TypeScript

### [TypeScript](https://www.typescriptlang.org/tsconfig/)

12. Change `extends` in `tsconfig.json` from `astro/tsconfigs/base` to `astro/tsconfigs/strict`. Follow the rules in [QUALITY.md](QUALITY.md).
13. Add the `@/*` path alias to `compilerOptions` in `tsconfig.json`. Follow the rules in [COMPONENTS.md](COMPONENTS.md).

### [Effect](https://effect.website) and [Zod](https://zod.dev)

14. Install Effect and Zod with `npm i effect zod zod-compiler`. Add `zodCompiler()` from `zod-compiler/vite` to `vite.plugins` in `astro.config.mjs`. Follow the rules in [ARCH.md](ARCH.md) (Code).

## UI

### [Tailwind CSS](https://tailwindcss.com/docs)

15. Install Tailwind CSS with `npx astro add tailwind`. Follow the rules in [DESIGN.md](DESIGN.md).
16. Install Prettier with `npm i -D prettier prettier-plugin-astro prettier-plugin-tailwindcss`. Put `prettier-plugin-tailwindcss` last in `plugins` in `.prettierrc`. Follow the rules in [DESIGN.md](DESIGN.md).
17. Set up Fulldev UI with `shadcn init`, then install `@base-ui/react` and `lucide-react`. Follow the rules in [COMPONENTS.md](COMPONENTS.md).
18. Add the Material Design 3 breakpoints to `src/styles/global.css`. Follow the rules in [MATERIAL.md](MATERIAL.md).
19. Update the base layout `src/layouts/Base.astro`: import `src/styles/global.css`, add `class="@container"` to `<body>`, render the `.dark` class on `<html>` from the theme cookie, and add the "Skip to main content" link and one `<main>`. Follow the rules in [DESIGN.md](DESIGN.md), [COMPONENTS.md](COMPONENTS.md), and [UI-UX.md](UI-UX.md).

## Cache

### [Astro route caching](https://docs.astro.build/en/guides/caching/)

20. Set `cache: { provider: cacheCloudflare() }` in `astro.config.mjs`. Follow the rules in [PERF.md](PERF.md) (Cache).

## Auth

### [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth)

21. Add emdash-better-auth, an email provider, and `BETTER_AUTH_SECRET`, if the site has user login. Follow the rules in [AUTH.md](AUTH.md).

## Agent skills

### [skills CLI](https://github.com/vercel-labs/skills)

22. Install the agent skills that [CMS.md](CMS.md) and [COMPONENTS.md](COMPONENTS.md) list.

## Checks

### [Astro](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

23. Generate the binding types with `npx wrangler types`.
24. Run `npx astro check`. Install each missing package that it reports, until it has no errors. Follow the rules in [QUALITY.md](QUALITY.md).
25. Start the dev server with `npm run dev`. Open `http://localhost:4321/_emdash/admin/` and complete the setup wizard.
26. Build with `npm run build`, and test the built Worker in workerd with `npm run preview`.
27. Commit the project.

## Deploy

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

28. Back up `EMDASH_ENCRYPTION_KEY` from `.env` in a password manager. Do not commit `.env`: EmDash cannot decrypt plugin secrets without the key.
29. Add the `env.production` block to `wrangler.jsonc` with its own D1 database, R2 bucket, `routes`, and `"preview_urls": true`. Follow the rules in [DEPLOY.md](DEPLOY.md) (Environments).
30. Set `EMDASH_SITE_URL` to the production URL in `env.production.vars` before you complete the admin setup on prod. Do not set it at the top level: without it, dev and local dev keep the address that the setup runs on.
31. Set the production secrets (`EMDASH_ENCRYPTION_KEY` and `BETTER_AUTH_SECRET`) and the CI workflows. Follow the rules in [DEPLOY.md](DEPLOY.md) (Secrets, CI).
