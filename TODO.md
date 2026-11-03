# TODO

## Decide which agent skills to keep in rules

[rules/STACK.md](rules/STACK.md) links about 30 skills from skills.sh. Many come from community authors, not from the project that owns the library. Keep only skills that fit this stack.

Goal, in order of preference:

1. A custom skill made for this stack (for example: Astro + EmDash on Cloudflare Workers, Material 3, D1).
2. The official skill from the vendor that owns the library or service.
3. A community skill only when no option above exists and the skill is current and correct.

Steps:

- [ ] List every `skills:` and `tools:` link in `rules/STACK.md`, `rules/CMS.md`, `rules/COMPONENTS.md`, and `rules/SETUP.md`.
- [ ] For each skill, check the owner on GitHub: is it the vendor's own organization? Record the result.
- [ ] For each community skill, search for an official one (`https://skills.sh/api/search?q=<name>`, the vendor's GitHub organization, and the vendor docs).
- [ ] Read each skill you keep. Check that it matches the versions and rules in `rules/`. Drop it if it conflicts.
- [ ] Decide which gaps need a custom skill for this stack, and plan where it lives.
- [ ] Update `rules/STACK.md` and the topic files. Update the skills rule in [rules/AGENTS.md](rules/AGENTS.md) if the order of preference changes.

First split, to verify (owner only, not checked for quality):

- Likely official: `cloudflare/skills`, `cloudflare/kumo`, `emdash-cms/*`, `better-auth/skills`, `stripe/ai`, `resend/react-email`, `redocly/redocly-cli`, `shadcn-ui/ui`, `fulldotdev/ui`, `microsoft/playwright-cli`, `getsentry/sentry-for-ai`, `effect-ts/skills`, `vercel-labs/skills`, `millionco/react-doctor`, `github/awesome-copilot` (Dependabot).
- Not from the library owner: `wshobson/agents` (TypeScript), `pproenca/dot-skills` (Zod), `mindrally/skills` (Kysely), `astrolicious/agent-skills` (Astro), `vercel-labs/agent-skills` (React, web design), `tanstack-skills/tanstack-skills` (TanStack Query), `lombiq/tailwind-agent-skills` (Tailwind CSS), `hamen/material-3-skill` (Material 3), `addyosmani/*` (web quality, security), `coreyhaines31/marketingskills` (SEO), `antfu/skills` (Vitest), `currents-dev/playwright-best-practices-skill`, `brianlovin/agent-config` (Knip), `getsentry/skills` (security review).
- Unknown owner: `armitage-labs/creem-skills` (check if Armitage Labs runs Creem).
