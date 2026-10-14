# DEPS

Rules for the packages of a project and how to keep them up to date. For the CI workflows, follow [DEPLOY.md](DEPLOY.md). For the Workers runtime, follow [ARCH.md](ARCH.md).

## Install

### [npm](https://docs.npmjs.com/cli/v11/commands/npm-ci)

- Use npm as the package manager, as in [SETUP.md](SETUP.md). Do not mix it with pnpm, Yarn, or Bun: keep only `package-lock.json` in the repository.
- Commit `package-lock.json` with each change to `package.json`.
- Add a package with `npm i <package>` or `npm i -D <package>`. Do not edit the versions in `package.json` by hand.
- Install in CI with `npm ci`, not `npm install`. `npm ci` fails when `package.json` and `package-lock.json` do not match, and it never changes the lockfile.
- Do not use `--legacy-peer-deps`. Fix the peer dependency conflict instead, for example by upgrading the package that reports it.
- Set the Node.js version in CI from the same value as local development. Use `actions/setup-node` with `node-version-file` or `node-version`, and `cache: npm`.
- Use `npm outdated` to list packages with newer versions. Use `npm ls <package>` to see which version is installed and who requires it.

## Update

### [Renovate](https://docs.renovatebot.com/)

- Use Renovate to update packages and GitHub Actions. Do not also turn on Dependabot version updates. Install the Renovate GitHub App on the repository, and merge its "Configure Renovate" PR. Read [WHY.md](../WHY.md#why-renovate-and-not-dependabot).
- Keep the configuration in `renovate.json` in the repository root. Add `"$schema": "https://docs.renovatebot.com/renovate-schema.json"`.
- Extend `config:recommended`. It turns on the Dependency Dashboard and groups monorepo packages.
- Extend `helpers:pinGitHubActionDigests` to pin GitHub Actions to a commit SHA, as in [DEPLOY.md](DEPLOY.md) (CI).
- Extend `:pinDevDependencies` to pin the versions of `devDependencies`. Keep the semver ranges of `dependencies`.
- Set `lockFileMaintenance` to `{ "enabled": true, "automerge": true }` to refresh `package-lock.json` every week.
- Set `timezone` to an IANA time zone, and `schedule` to a cron window of at least 4 hours, for example `["* 0-4 * * 1"]`. Use `*` for the minutes: Renovate does not support minute values in cron schedules.
- Check the config with `npx -p renovate renovate-config-validator renovate.json`.

### [Renovate allowedVersions](https://docs.renovatebot.com/configuration-options/#packagerulesallowedversions)

- Hold back the test packages that Storybook Astro does not support yet: add `{ "matchPackageNames": ["vitest", "@vitest/*"], "allowedVersions": "<5.0.0" }` and `{ "matchPackageNames": ["@astrojs/react"], "allowedVersions": "<7.0.0" }` to `packageRules`. Follow the rules in [TESTING.md](TESTING.md).
- Remove an `allowedVersions` entry when `@storybook-astro/framework` supports the new major version in its peer dependencies.

### [Renovate groups](https://docs.renovatebot.com/configuration-options/#groupname)

- Group the packages that must have matching versions in one `packageRules` entry: set `matchPackageNames` to `["astro", "@astrojs/*", "wrangler", "emdash", "@emdash-cms/*"]` and `groupName` to one name. All updates with the same `groupName` go in one branch and one PR.
- Put the group rule last in `packageRules`. Later rules override earlier rules, so the group rule keeps `"automerge": false` for these packages. Merge the group by hand after you run the checks in Compatibility.

### [Renovate automerge](https://docs.renovatebot.com/configuration-options/#automerge)

- Automerge `patch` updates of `dependencies`: set `matchDepTypes` to `["dependencies"]`, `matchUpdateTypes` to `["patch"]`, and `matchCurrentVersion` to `"!/^0/"`.
- Automerge `minor` and `patch` updates of `devDependencies` the same way, with `matchDepTypes` set to `["devDependencies"]`.
- Set `matchCurrentVersion` to `"!/^0/"` on each automerge rule.
- Do not automerge `major` updates. Review the changelog and merge them by hand.
- Make CI a required status check for `main`, and turn on "Allow auto-merge" in the repository settings. Renovate automerges only after the required checks pass.

## Supply chain

### [Renovate minimumReleaseAge](https://docs.renovatebot.com/key-concepts/minimum-release-age/)

- Extend `security:minimumReleaseAgeNpm`. It sets `minimumReleaseAge` to `3 days` for npm packages, so Renovate waits before it opens a PR for a new version.
- Keep `internalChecksFilter` at its default, `strict`, and turn on the Dependency Dashboard to see the PRs that Renovate holds back.
- Do not set `minimumReleaseAge` to slow down a package that releases often. Use a `schedule` in a `packageRules` entry for that package.

### [npm min-release-age](https://docs.npmjs.com/cli/v11/using-npm/config#min-release-age)

- Set `min-release-age=3` in the `.npmrc` file in the repository root. npm then installs only versions that are more than 3 days old, also for `npm i` on a developer machine. Commit `.npmrc`.
- Keep the value of `min-release-age` the same as `minimumReleaseAge` in `renovate.json`.

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
