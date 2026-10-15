# DEPS

Rules for the packages of a project and how to keep them up to date. For the CI workflows, follow [DEPLOY.md](DEPLOY.md). For the Workers runtime, follow [ARCH.md](ARCH.md).

## Install

### [npm](https://docs.npmjs.com/cli/v11/commands/npm-ci)

- Use npm as the package manager, as in [SETUP.md](SETUP.md). Do not mix it with pnpm, Yarn, or Bun: keep only `package-lock.json` in the repository.
- Commit `package-lock.json` with each change to `package.json`.
- Add a package with `npm i <package>` or `npm i -D <package>`. Do not edit the versions in `package.json` by hand.
- Install in CI with `npm ci`, not `npm install`. `npm ci` fails when `package.json` and `package-lock.json` do not match, and it never changes the lockfile.
- Do not use `--legacy-peer-deps`. Fix the peer dependency conflict instead, for example by upgrading the package that reports it. Upgrade the pinned peer when the conflict is with a pin from the starter: `emdash-better-auth` needs React 19.2.6 or later, and the starter pins 19.2.4. The template pins React 19.3.0, so run `npm i emdash-better-auth`. Without the template, run `npm i react@^19.2.6 react-dom@^19.2.6 emdash-better-auth`.
- Delete `pnpm-workspace.yaml` from the starter. Its presence makes `shadcn init` use pnpm and write `pnpm-lock.yaml`. `setup.mjs` does it.
- Delete the starter `package-lock.json` and `node_modules`, and run `npm install` again, after you add `min-release-age`. The starter lockfile can pin versions that are younger than the 3-day limit, and `npm install` then stops. `setup.mjs` does it and writes a new `package-lock.json`.
- Set the Node.js version in CI from the same value as local development. Use `actions/setup-node` with `node-version-file` or `node-version`, and `cache: npm`.
- Use `npm outdated` to list packages with newer versions. Use `npm ls <package>` to see which version is installed and who requires it.

## Update

### [Dependabot version updates](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference)

- Use Dependabot version updates for npm packages and GitHub Actions. Do not use Renovate. Read [WHY.md](../WHY.md#why-dependabot-and-not-renovate).
- Keep the configuration in `.github/dependabot.yml` with `version: 2`. Add one entry under `updates` with `package-ecosystem: "npm"` and one with `package-ecosystem: "github-actions"`, both with `directory: "/"`.
- Set `schedule` in each entry to `interval: "weekly"`, `day: "monday"`, `time: "02:00"`, and `timezone` to an IANA time zone, for example `"Europe/Prague"`.
- Turn on Dependabot alerts and Dependabot security updates in the repository settings. Security updates open PRs for vulnerable packages outside the schedule.
- Pin each GitHub Action to a full commit SHA, with the version in a comment, for example `uses: actions/checkout@<sha> # v5.0.0`, as in [DEPLOY.md](DEPLOY.md) (CI). Dependabot updates the SHA and the comment. It does not pin a tag for you.
- Refresh `package-lock.json` once a month: run `npm update` in a PR, and merge it after CI passes. It updates the installed packages within their semver ranges and does not change `package.json`.
- Check the config with `uvx check-jsonschema --builtin-schema vendor.dependabot .github/dependabot.yml`.

### [Dependabot groups](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#groups--)

- Group the packages that must have matching versions: in the npm entry, add a group named `astro` under `groups` with `patterns: ["astro", "@astrojs/*", "wrangler", "emdash", "@emdash-cms/*"]`. Dependabot opens one PR for all of them.
- Group the other `minor` and `patch` updates of `devDependencies` in a second group named `dev-dependencies` with `dependency-type: "development"` and `update-types: ["minor", "patch"]`, so they come in one PR.
- Merge the `astro` group by hand after you run the checks in Compatibility.

### [Dependabot ignore](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#ignore--)

- Hold back the test packages that Storybook Astro does not support yet: in the npm entry, add `ignore` items with `dependency-name: "vitest"` and `dependency-name: "@vitest/*"`, both with `versions: [">=5.0.0"]`, and `dependency-name: "@astrojs/react"` with `versions: [">=7.0.0"]`. Follow the rules in [TESTING.md](TESTING.md).
- Remove an `ignore` item when `@storybook-astro/framework` supports the new major version in its peer dependencies.

### [Dependabot automerge](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/automate-dependabot-with-actions)

- Automerge with a workflow, `.github/workflows/dependabot-automerge.yml`. Dependabot has no automerge option in `dependabot.yml`.
- Run the workflow on `pull_request` with `permissions: { contents: write, pull-requests: write }`, and only when `github.event.pull_request.user.login == 'dependabot[bot]'`.
- Read the update with `dependabot/fetch-metadata` (v3), pinned to a commit SHA.
- Run `gh pr merge --auto --squash "$PR_URL"` with `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` only for the `dev-dependencies` group (`dependency-group == 'dev-dependencies'`) or for a single `patch` update of a production package (`dependency-type == 'direct:production'` and `update-type == 'version-update:semver-patch'`).
- Do not automerge an update when `previous-version` starts with `0.`, when `update-type` is `version-update:semver-major`, or when `dependency-group` is `astro`. Review the changelog and merge it by hand.
- Make CI a required status check for `main`, and turn on "Allow auto-merge" in the repository settings. `gh pr merge --auto` merges only after the required checks pass.

## Supply chain

### [Dependabot cooldown](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#cooldown--)

- Set `cooldown: { default-days: 3 }` in the npm entry, so Dependabot waits 3 days before it opens a PR for a new version. Security updates do not wait.
- Do not set a longer cooldown to slow down a package that releases often. Put that package in a group instead.

### [npm min-release-age](https://docs.npmjs.com/cli/v11/using-npm/config#min-release-age)

- Set `min-release-age=3` in the `.npmrc` file in the repository root. npm then installs only versions that are more than 3 days old, also for `npm i` on a developer machine. Commit `.npmrc`.
- Keep the value of `min-release-age` the same as `cooldown.default-days` in `.github/dependabot.yml`.
- Expect a new `emdash` release to wait 3 days: `min-release-age` has no exclude list. Install the newest version that is older than 3 days.

### [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit)

- Run `npm audit --omit=dev --audit-level=high` in CI. It fails the job on a `high` or `critical` vulnerability in a package that is part of the Worker.
- Run `npm audit signatures` in CI to verify the registry signatures and provenance of installed packages.
- Run `npm audit` without `--omit=dev` when you review the full list. Fix findings with a normal update or with `npm audit fix`.
- Do not use `npm audit fix --force` without review: it allows SemVer-major changes. Update the package by hand instead.

## Add a package

### [Workers runtime](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)

- Search the code and `package.json` first. Add a package only when the platform, Astro, EmDash, or an installed package cannot do the job.
- Check that the package runs on Workers. Read its imports of `node:` modules against the [Node.js API list](https://developers.cloudflare.com/workers/runtime-apis/nodejs/). Do not add a package that needs `node:child_process`, `node:vm`, `node:dgram`, or `node:worker_threads`: Workers can import them but they do not work. Use a Web API or a Workers binding instead.
- Do not add the `nodejs_compat` flag to make a package work. With `compatibility_date` set to `2026-08-04` or later, Node.js APIs are on by default. Follow the rules in [ARCH.md](ARCH.md).
- Run `npm run build` and `npm run preview` after you add the package. Preview runs the built Worker in workerd. Do not trust `npm run dev` alone for this check.
- Check the size of the Worker before and after: run `npx wrangler deploy --outdir bundled/ --dry-run`. The limit is 64 MiB uncompressed, but a larger bundle also increases startup time, and the startup limit is 1 second.
- Check that the package is maintained: it has a release in the last 12 months and its open issues get answers. Read the package page on [npmjs.com](https://www.npmjs.com/) and its GitHub repository.
- Put a package in `devDependencies` when only the build, tests, or scripts use it. Put it in `dependencies` when the Worker bundle needs it.
- Remove a package you no longer use with `npm uninstall <package>`, and commit the lockfile.

## Compatibility

### [Astro, Cloudflare, and EmDash](https://docs.astro.build/en/guides/upgrade-to/v6/)

- Upgrade `astro` and the official Astro integrations together with `npx @astrojs/upgrade`. Do not upgrade `astro` alone.
- Keep `astro`, `@astrojs/cloudflare`, `wrangler`, and `emdash` in ranges that the peer dependencies allow. `@astrojs/cloudflare` requires matching `astro` and `wrangler` ranges. `emdash` and `@emdash-cms/cloudflare` require an `astro` range. `@emdash-cms/cloudflare` also requires `wrangler` and `@astrojs/cloudflare` ranges.
- Before you upgrade one of these packages, run `npm view <package>@<version> peerDependencies` for it and for the packages that depend on it. Upgrade the others first if the range does not allow the new version.
- After an upgrade, run `npx wrangler types`, `npx astro check`, `npm run build`, and `npm run preview`. Fix all errors before you merge.

### [Compatibility date](https://developers.cloudflare.com/workers/configuration/compatibility-dates/)

- Update `compatibility_date` in `wrangler.jsonc` on purpose, not on each Wrangler update. Keep it at `2026-08-04` or later, as in [ARCH.md](ARCH.md).
- Before you raise it, read the [compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/) that the new date turns on. Then run the checks above, test the preview Worker, and deploy to dev first.
