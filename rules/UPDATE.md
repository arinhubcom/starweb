# UPDATE

Ordered procedures for a project that exists. `<starweb>` = the kept Starweb clone (for example `~/starweb`), `<project>` = the project folder. New project → [SETUP](SETUP.md).

## Starweb update

New rules and files reach a project through [update.mjs](https://github.com/arinhubcom/starweb/blob/main/scripts/update.mjs), which uses `.starweb.json`. It merges files. It does not change project code: the steps under Apply do that.

The `starweb-update` skill in `.agents/skills/` points here. Keep the steps in this file, not in the skill.

### Prepare

1. `git status` in `<project>` is empty; commit first. New branch for the update. To undo the update, delete the branch.
2. `git -C <starweb> pull`. No clone → clone Starweb again; it needs the commit in `.starweb.json`.
3. Node.js major in `<starweb>/template/.nvmrc`; `pnpm --version` ≥ 12 ([installation](https://pnpm.io/installation)). → [DEPS](DEPS.md) (Install)
4. `node <starweb>/scripts/update.mjs <project> --dry-run`; read the plan (changes nothing). It lists the changed rules and prints the `git log` and `git diff` commands for the Apply steps. Keep them: the update moves the commit in `.starweb.json`.

### Merge

5. `node <starweb>/scripts/update.mjs <project>`: merges agent files, `rules/`, and the other Starweb files; updates unchanged `package.json` versions and scripts; `pnpm install`. A project with `package-lock.json` moves to pnpm: `pnpm import` keeps the resolved versions, and the script removes `package-lock.json`.
6. Resolve conflicts (markers `7. `Deleted upstream`: Starweb removed the file or the package; the script keeps it. Remove it unless project code uses it. A replaced tool shows up here: remove its config, package, scripts, and editor settings. After the move to pnpm: delete `min-release-age` from `.npmrc` (the file too when it holds nothing else) and `overrides` from `package.json`, then run `pnpm install`. A package that code names and only npm hoisted fails `pnpm run check`: add it as a direct dependency.
8. `Kept (project version differs)`: take the Starweb value unless the project has a reason to hold it back; write the reason in the project `AGENTS.md`.
9. `Kept (the project deleted the file)`: add it back only if a changed rule needs it.
10. `wrangler.jsonc` changed → `pnpm exec wrangler types`. `scripts/theme.ts` changed → `pnpm exec tsx scripts/theme.ts`. `update.mjs` does not change generated files.

### Apply

11. Read the printed `git log` and `git diff`: `rules/` for decisions, `template/` for code, `WHY.md` for reasons.
12. Each changed rule: find the project code it covers, and change the code that breaks it. Conditional rules ("uses X →") only if the project uses X. A rule the project does not follow on purpose → write the reason in the project `AGENTS.md`.
13. Each `template/` change in a file that the project moved, split, or replaced: make the same change there. The merge cannot see it.
14. New or changed [SETUP](SETUP.md) steps: run the ones that fit the project (bindings, secrets, repository settings, workflows). New binding or variable in `wrangler.jsonc` → `env.production` too. → [DEPLOY](DEPLOY.md) `.github/workflows/perf.yml` is new → SETUP step 37: the secrets `PAGESPEED_API_KEY` and `CLOUDFLARE_OBSERVABILITY_TOKEN` in the environment `production`, and the repository variable `PRODUCTION_WORKER`. Without `PRODUCTION_WORKER`, the jobs are skipped. Those two secrets as repository secrets, or a repository variable `CLOUDFLARE_ACCOUNT_ID` used only by `perf.yml` → move the secrets, then delete the repository copies. New `scripts/set-secrets.ts`: [TOKENS](TOKENS.md) lists the tokens to set with `pnpm run set-secrets`; add project secrets to `SECRETS` in `scripts/lib/secrets.ts`. The dev `CLOUDFLARE_API_TOKEN` moves from a repository secret to the GitHub environment `dev`: add `environment: dev` to the PR preview and dev deploy jobs, set the token there, then delete the repository secret. → [DEPLOY](DEPLOY.md#ci)
15. New skill in [STACK](STACK.md) for a part the project uses → install it. → [SETUP](SETUP.md) (Agent skills)

### Finish

16. `pnpm run check`, `pnpm run build`, `pnpm run size`, `pnpm run preview` all pass. → [QUALITY](QUALITY.md) (Order)
17. Commit, with `.starweb.json` and the lockfile. Merge the branch.
18. Deploy through the release pipeline. → [DEPLOY](DEPLOY.md)

### Older projects

A project whose `.starweb.json` commit is older than the Starweb commit that added the `create-emdash` output keeps its starter files: `update.mjs` has no base to merge them. If they are missing, add the footer link to `/privacy` in `src/layouts/Base.astro`, add `public/.well-known/security.txt` to `.gitignore`, and run `pnpm exec tsx scripts/theme.ts`.

## EmDash update

`emdash`, `@emdash-cms/cloudflare`, and the starter files move only through Starweb. No bump by hand or by Dependabot (`ignore` in `dependabot.yml` also stops its security updates). No `upgrade-emdash` and no `upgrading-emdash` skill: it takes an npm tag, not a version, so it skips the pin and `minimumReleaseAge`. A security alert for these packages → these steps.

### Starweb repository

1. Pick the newest version older than 3 days that `create-emdash`, `emdash`, and `@emdash-cms/cloudflare` all have: `node scripts/update-starter.mjs --check` prints it. → [DEPS](DEPS.md) (pnpm minimumReleaseAge)
2. `node scripts/update-starter.mjs <version>`, with `template/` and `starter/` committed. It runs `create-emdash`, merges the difference to `starter/` into `template/`, replaces `starter/`, pins `create-emdash` in the root `package.json` and the other two packages in `template/package.json`, and refreshes `template/pnpm-lock.yaml`.
3. Resolve the conflicts in `template/` (markers `<<<<<<< project`, `||||||| base`, `>>>>>>> starweb`). Handle each line under `Review by hand` and `Starter package.json changes to review`; the script changes no other `package.json` line.
4. Read each version since the old pin in the [EmDash changelog](https://github.com/emdash-cms/emdash/blob/main/packages/core/CHANGELOG.md). Update `template/`, `rules/`, and `WHY.md` for each change that affects them. → [AGENTS](AGENTS.md) (Template)
5. `bash scripts/test-template.sh <tmp-dir>` and `bash scripts/test-update.sh <tmp-dir>` pass. `pnpm peers check` in the generated project has no new line for `@emdash-cms/plugin-forms` or `@emdash-cms/plugin-field-kit` → [DEPS](DEPS.md) (Astro, Cloudflare, and EmDash).
6. Commit `template/`, `starter/`, and the rule changes together.

### Project

1. Read each version since the project's pin in the [EmDash changelog](https://github.com/emdash-cms/emdash/blob/main/packages/core/CHANGELOG.md).
2. The steps in Starweb update. `update.mjs` moves the pins and merges the starter files.
3. Apply the changelog entries that affect project code.
4. New core migrations in the changelog → back up first; they run in the release pipeline. → [DEPLOY](DEPLOY.md) (EmDash core migrations)
