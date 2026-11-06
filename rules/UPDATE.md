# UPDATE

This file holds ordered procedures for a project that exists. If the project is new, see [SETUP](SETUP.md).

In this file, `<starweb>` is the kept Starweb clone, for example `~/starweb`. `<project>` is the project folder.

## Starweb update

New rules and files reach a project through [update.mjs](https://github.com/arinhubcom/starweb/blob/main/scripts/update.mjs), which uses `.starweb.json`.

- The script merges files. It does not change project code. The steps under Apply do that.
- The `starweb-update` skill in `.agents/skills/` points here. Keep the steps in this file, not in the skill.

### Prepare

1. Prepare the project folder.
   - Check that `git status` in `<project>` prints nothing. If it does, commit first.
   - Create a new branch for the update.
   - To undo the update, delete the branch.
2. Run `git -C <starweb> pull`.
   - If there is no clone, clone Starweb again. It needs the commit in `.starweb.json`.
3. Install the Node.js major in `<starweb>/template/.nvmrc`.
   - Check that `pnpm --version` is 12 or higher. See the [installation](https://pnpm.io/installation) guide.
   - See [DEPS](DEPS.md#install-packages).
4. Run `node <starweb>/scripts/update.mjs <project> --dry-run`, and read the plan. It changes nothing.
   - The plan lists the changed rules.
   - It prints the `git log` and `git diff` commands for the Apply steps.
   - Keep these commands, because the update moves the commit in `.starweb.json`.

### Merge

5. Run `node <starweb>/scripts/update.mjs <project>`.
   - It merges agent files, `rules/`, and the other Starweb files.
   - It updates unchanged `package.json` versions and scripts.
   - It runs `pnpm install`.
   - If the project has `package-lock.json`, it moves the project to pnpm. `pnpm import` keeps the resolved versions.
   - The script removes `package-lock.json`.
6. If the script reports conflicts, resolve them.
   - The markers are `<<<<<<< project`, `||||||| base`, and `>>>>>>> starweb`.
   - Then set `commit` in `.starweb.json` to the commit that the script prints.
7. Handle `Deleted upstream`. Starweb removed the file or the package, and the script keeps it.
   - Remove it unless project code uses it.
   - A replaced tool shows up here. Remove its config, package, scripts, and editor settings.
   - After the move to pnpm, delete `min-release-age` from `.npmrc`. Delete the file too when it holds nothing else.
   - After the move to pnpm, delete `overrides` from `package.json`, then run `pnpm install`.
   - If code names a package that only npm hoisted, `pnpm run check` fails. Add the package as a direct dependency.
8. Handle `Kept (project version differs)`.
   - Take the Starweb value, unless the project has a reason to hold it back.
   - Write the reason in the project `AGENTS.md`.
9. Handle `Kept (the project deleted the file)`. Add the file back only if a changed rule needs it.
10. Regenerate the generated files. `update.mjs` does not change them.
    - If `wrangler.jsonc` changed, run `pnpm exec wrangler types`.
    - If `scripts/theme.ts` changed, run `pnpm exec tsx scripts/theme.ts`.

### Apply

11. Read the printed `git log` and `git diff`.
    - Read `rules/` for decisions.
    - Read `template/` for code.
    - Read `WHY.md` for reasons.
12. For each changed rule, find the project code it covers, and change the code that breaks it.
    - Apply a conditional rule, such as "If the project uses X", only if the project uses X.
    - If the project does not follow a rule on purpose, write the reason in the project `AGENTS.md`.
13. For each `template/` change in a file that the project moved, split, or replaced, make the same change there. The merge cannot see it.
14. Run the new or changed [SETUP](SETUP.md) steps that fit the project, such as bindings, secrets, repository settings, and workflows.
    - If a new binding or variable is in `wrangler.jsonc`, add it to `env.production` too. See [DEPLOY](DEPLOY.md).
    - If `.github/workflows/perf.yml` is new, run SETUP step 37.
      - Set the secrets `PAGESPEED_API_KEY` and `CLOUDFLARE_OBSERVABILITY_TOKEN` in the environment `production`.
      - Set the repository variable `PRODUCTION_WORKER`. Without it, the jobs are skipped.
    - If those two secrets are repository secrets, or `CLOUDFLARE_ACCOUNT_ID` is a repository variable that only `perf.yml` uses, move the secrets. Then delete the repository copies.
    - If `scripts/set-secrets.ts` is new, [TOKENS](TOKENS.md) lists the tokens to set with `pnpm run set-secrets`.
    - Add project secrets to `SECRETS` in `scripts/lib/secrets.ts`.
    - The dev `CLOUDFLARE_API_TOKEN` moves from a repository secret to the GitHub environment `dev`.
      - Add `environment: dev` to the PR preview and dev deploy jobs.
      - Set the token in the environment `dev`.
      - Delete the repository secret.
    - See [DEPLOY](DEPLOY.md#set-up-ci).
15. If [STACK](STACK.md) has a new skill for a part the project uses, install it. See [SETUP](SETUP.md#agent-skills).

### Finish

16. Check that `pnpm run check`, `pnpm run build`, `pnpm run size`, and `pnpm run preview` all pass. See [QUALITY](QUALITY.md#order-the-steps-of-a-pull-request-workflow).
17. Commit, with `.starweb.json` and the lockfile. Merge the branch.
18. Deploy through the release pipeline. See [DEPLOY](DEPLOY.md).

### Older projects

Some projects have a `.starweb.json` commit that is older than the Starweb commit that added the `create-emdash` output.

- Such a project keeps its starter files. `update.mjs` has no base to merge them.
- If the starter files are missing, add the footer link to `/privacy` in `src/layouts/Base.astro`.
- Add `public/.well-known/security.txt` to `.gitignore`.
- Run `pnpm exec tsx scripts/theme.ts`.

## EmDash update

`emdash`, `@emdash-cms/cloudflare`, and the starter files move through Starweb.

- Do not bump these packages by hand or with Dependabot. `ignore` in `dependabot.yml` also stops its security updates.
- If a security alert names these packages, follow these steps.
- If Starweb has no fix yet, use the `upgrading-emdash` skill.

### Starweb repository

1. Pick the newest version that is older than 3 days and that `create-emdash`, `emdash`, and `@emdash-cms/cloudflare` all have.
   - `node scripts/update-starter.mjs --check` prints it.
   - The 3-day wait is set in `minimumReleaseAge` in `pnpm-workspace.yaml` and in `cooldown` in `.github/dependabot.yml`.
2. Run `node scripts/update-starter.mjs <version>`, with `template/` and `starter/` committed.
   - It runs `create-emdash`.
   - It merges the difference to `starter/` into `template/`.
   - It replaces `starter/`.
   - It pins `create-emdash` in the root `package.json`, and the other two packages in `template/package.json`.
   - It refreshes `template/pnpm-lock.yaml`.
3. Resolve the conflicts in `template/`. The markers are `<<<<<<< project`, `||||||| base`, and `>>>>>>> starweb`.
   - Handle each line under `Review by hand` and `Starter package.json changes to review`.
   - The script changes no other `package.json` line.
4. Read each version since the old pin in the [EmDash changelog](https://github.com/emdash-cms/emdash/blob/main/packages/core/CHANGELOG.md).
   - Update `template/`, `rules/`, and `WHY.md` for each change that affects them.
   - See [AGENTS](AGENTS.md#change-the-template-in-starweb).
5. Check that the tests and the peer check pass.
   - `bash scripts/test-template.sh <tmp-dir>` passes.
   - `bash scripts/test-update.sh <tmp-dir>` passes.
   - `pnpm peers check` in the generated project has no new line for `@emdash-cms/plugin-forms` or `@emdash-cms/plugin-field-kit`.
   - See [DEPS](DEPS.md#astro-cloudflare-and-emdash).
6. Commit `template/`, `starter/`, and the rule changes together.

### Project

1. Read each version since the project's pin in the [EmDash changelog](https://github.com/emdash-cms/emdash/blob/main/packages/core/CHANGELOG.md).
2. Run the steps in Starweb update. `update.mjs` moves the pins and merges the starter files.
3. Apply the changelog entries that affect project code.
4. If the changelog lists new core migrations, back up first. They run in the release pipeline. See [DEPLOY](DEPLOY.md#emdash-core-migrations).

### `upgrading-emdash` skill

Use this skill when a project needs an EmDash version that Starweb does not pin yet, for example for a security fix. Otherwise, follow Project.

1. Run `pnpm dlx upgrade-emdash@latest --dry-run`, and read the plan.
   - Then run the same command without `--dry-run`.
   - Do not use `npx`.
   - The command takes an npm tag, not a version.
2. Read `.emdash/UPGRADE.md`, and follow the skill for each entry.
3. Check the result.
   - `pnpm run check`, `pnpm run build`, and `pnpm run size` exit with 0.
   - `pnpm peers check` has no new line for `@emdash-cms/plugin-forms` or `@emdash-cms/plugin-field-kit`.
   - See [DEPS](DEPS.md#astro-cloudflare-and-emdash).
4. If the changelog lists new core migrations, back up first. They run in the release pipeline. See [DEPLOY](DEPLOY.md#emdash-core-migrations).
5. Write the version and the reason in the project `AGENTS.md`.
   - At the next Starweb update, the output shows `Kept (project version differs)`.
   - Keep the project version until the Starweb pin reaches it.
   - Then take the Starweb value and remove the note.
