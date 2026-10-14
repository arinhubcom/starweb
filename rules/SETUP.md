# SETUP

Set up a new Starweb project with these steps, in order. Later steps depend on earlier ones. Each step links to the rules for its topic.

## Project

### [create-emdash](https://github.com/emdash-cms/emdash/tree/main/packages/create-emdash)

1. Check that `node --version` is 22.16.0 or later.
2. Create the project from the EmDash Cloudflare starter template: `npm create emdash@latest my-site -- --template cloudflare:starter --install --yes`. Replace `my-site` with the project name. Do not use the `node` platform. Follow the rules in [CMS.md](CMS.md).
3. Rename the `AGENTS.md` file of the template to `EMDASH.md`.
4. Copy `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `WHY.md`, and the `rules/` folder from the [Starweb repository](https://github.com/arinhubcom/starweb) to the project root.
5. Add `- Follow the rules in [EMDASH.md](EMDASH.md) for the EmDash template.` to the `## Rules` list in `AGENTS.md`.

## Cloudflare

### [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

6. Log in to Cloudflare with `npx wrangler login`.
7. Set `compatibility_date` in `wrangler.jsonc` to `2026-08-04` or later, and remove `nodejs_compat` from `compatibility_flags`. The template sets an older date. Follow the rules in [ARCH.md](ARCH.md).
8. Keep the binding names `DB` and `MEDIA` from the template. The EmDash adapters need them.
9. Uncomment the `LOADER` Worker Loader binding only when the site uses sandboxed plugins. It needs a Workers paid plan.
10. Set `EMDASH_SITE_URL` to the URL of each environment in `vars` in `wrangler.jsonc` before you complete the admin setup there. Without it, passkeys from the setup work only on the `workers.dev` address. Follow the rules in [DEPLOY.md](DEPLOY.md) (Environments).
11. Keep local secrets in the `.env` file that `create-emdash` writes with `EMDASH_ENCRYPTION_KEY`. Do not add a `.dev.vars` file: when it exists, Wrangler ignores `.env`. Follow the rules in [SECURITY.md](SECURITY.md).

## TypeScript

### [TypeScript](https://www.typescriptlang.org/tsconfig/)

12. Change `extends` in `tsconfig.json` from `astro/tsconfigs/base` to `astro/tsconfigs/strict`. Follow the rules in [QUALITY.md](QUALITY.md).
13. Add the `@/*` path alias to `compilerOptions` in `tsconfig.json`. Follow the rules in [COMPONENTS.md](COMPONENTS.md).

## UI

### [Tailwind CSS](https://tailwindcss.com/docs)

14. Install Tailwind CSS with `npx astro add tailwind`. Follow the rules in [DESIGN.md](DESIGN.md).
15. Set up Fulldev UI with `shadcn init`, then install `@base-ui/react` and `lucide-react`. Follow the rules in [COMPONENTS.md](COMPONENTS.md).
16. Add the Material Design 3 breakpoints to `src/styles/global.css`. Follow the rules in [MATERIAL.md](MATERIAL.md).

## Auth

### [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth)

17. Add emdash-better-auth and set `BETTER_AUTH_SECRET`, if the site has user login. Follow the rules in [AUTH.md](AUTH.md).

## Agent skills

### [skills CLI](https://github.com/vercel-labs/skills)

18. Install the agent skills that [CMS.md](CMS.md) and [COMPONENTS.md](COMPONENTS.md) list.

## Checks

### [Astro](https://docs.astro.build/en/reference/cli-reference/#astro-check)

19. Generate the binding types with `npx wrangler types`.
20. Run `npx astro check`. Install each missing package that it reports, until it has no errors. Follow the rules in [QUALITY.md](QUALITY.md).
21. Start the dev server with `npm run dev`. Open `http://localhost:4321/_emdash/admin/` and complete the setup wizard.
22. Test the Worker locally before the first deploy. Follow the rules in [DEV.md](DEV.md).

## Deploy

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

23. Back up `EMDASH_ENCRYPTION_KEY` from `.env` in a password manager. Do not commit `.env`: EmDash cannot decrypt plugin secrets without the key.
24. Set up the environments, the production secrets (`EMDASH_ENCRYPTION_KEY` and `BETTER_AUTH_SECRET`), and CI. Follow the rules in [DEPLOY.md](DEPLOY.md).
