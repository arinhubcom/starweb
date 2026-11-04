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

## Finish the template

The rule in [rules/AGENTS.md](rules/AGENTS.md) (Template) requires an implementation or a [rules/SETUP.md](rules/SETUP.md) step for each rule. `scripts/test-template.sh` covers the setup, the checks, the build, and the preview. It does not cover the items below.

Gaps in the rules and the steps:

- [ ] Add a step to [rules/SETUP.md](rules/SETUP.md) for the repository settings in [rules/DEPS.md](rules/DEPS.md): Dependabot alerts, security updates, and **Allow auto-merge**. No step covers them yet.
- [ ] Check every rule in `rules/` against the new Template rule. One review found the gaps that are now fixed, but it did not check each rule line by line.

Steps that no test has run:

- [ ] Run a real deploy on Cloudflare (steps 31 and 32). Confirm that the deploy creates the `SESSION` KV namespace from the binding without an ID, and that `env.production` works with it.
- [ ] Run `pnpm run dev` and the admin setup wizard (step 20), and `pnpm exec emdash doctor` (step 22) on a generated project.
- [ ] Run the optional steps 8-18 on a generated project, and confirm that `pnpm run check` and `pnpm run build` still pass.

Possible template additions:

- [ ] Decide whether the template ships the workflows that step 30 lists (Dependabot automerge, PR preview, dev deploy, stage upload, promotion, and D1 export), in place of a manual step.

Dependency updates:

- [ ] Move to TypeScript 7 when its 7.1 release is stable. Replace `astro check` then with `tsc` and `@astrojs/ts-content-mapper`, and keep `tsc` out of `node_modules/emdash/src`: `astro check` does not support TypeScript 7. See [WHY.md](WHY.md#why-astro-check-stays-on-typescript-6). The template stays on 6.0.3 until then.

## Follow the issues opened in other repositories

Check these upstream issues and discussions. When one closes or changes, update the rule or decision that links to it, and then remove it from this list.

- [ ] `emdash` 1.4.0 pins the vulnerable `zod` 4.5.4 ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)). When a new `emdash` pins `zod` 4.6.6 or later, remove the `overrides` from `template/package.json` and the rule in [rules/DEPS.md](rules/DEPS.md).
- [ ] [emdash-cms/emdash#4658](https://github.com/emdash-cms/emdash/issues/4658): `emdash/ui` and `emdash/ui/search` make `tsc` type-check the package source. Open. Linked from [WHY.md](WHY.md).
- [ ] [emdash-cms/emdash#4661](https://github.com/emdash-cms/emdash/issues/4661): `emdash/ui` re-exports types that `astro-portabletext` does not export, so they are lost without an error. Open. Linked from [WHY.md](WHY.md).
- [ ] [cloudflare/polystella#66](https://github.com/cloudflare/polystella/issues/66): support Paraglide JS message files (inlang message format) in the catalog CLI. Open. Linked from [WHY.md](WHY.md).
- [ ] [heroui-inc/tailwind-variants#321](https://github.com/heroui-inc/tailwind-variants/discussions/321): share one class merge engine with shadcn/ui `cn` (discussion). Open. Linked from [WHY.md](WHY.md).
- [ ] [theweekendprojects/emdash-better-auth#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22): extension point for server-side Better Auth plugins (payment providers like Polar, Creem). Open. Linked from [rules/API.md](rules/API.md).
- [ ] [theweekendprojects/emdash-better-auth#23](https://github.com/theweekendprojects/emdash-better-auth/issues/23): expose the session (`activeOrganizationId`) to app code with a `getAuthSession()` helper. Open. Linked from [rules/AUTH.md](rules/AUTH.md).
- [ ] [theweekendprojects/emdash-better-auth#24](https://github.com/theweekendprojects/emdash-better-auth/issues/24): ship precompiled auth CSS so sites do not need Tailwind CSS. Open. Linked from [rules/AUTH.md](rules/AUTH.md).
- [ ] [theweekendprojects/emdash-better-auth#25](https://github.com/theweekendprojects/emdash-better-auth/issues/25): turn off the built-in UI pages and bring your own auth UI (headless mode). Open. Linked from [rules/AUTH.md](rules/AUTH.md).
- [ ] [theweekendprojects/emdash-better-auth#26](https://github.com/theweekendprojects/emdash-better-auth/issues/26): keep Better Auth and Better Auth UI up to date (Dependabot, minor pins). Open. Linked from [rules/AUTH.md](rules/AUTH.md).
