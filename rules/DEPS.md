# DEPS

This file covers packages and updates: how to install, add, and update a package. Read it before you add a package or merge an update. For CI, see [DEPLOY](DEPLOY.md). For the Workers runtime, see [ARCH](ARCH.md).

## Install packages

### pnpm

- Use [pnpm](STACK.md#pnpm) only. See [SETUP](SETUP.md).
- Do not use npm, Yarn, or Bun.
- Keep only `pnpm-lock.yaml` in the repository. Commit it with each `package.json` change. See [WHY](../WHY.md#why-pnpm).
- Do not use `create-emdash` in a project.
- To add a package, let pnpm write the version. Never edit the version by hand.
- Fix a peer dependency conflict. Do not hide it.
- `emdash-better-auth` needs React 19.2.6 or newer.
- Do not put settings in `.npmrc` except auth, registry, TLS, and proxy. pnpm reads only those from it.
- If an install fails on a new package with a build script, read the script. Then add the package to `allowBuilds` with `true` or `false`.
- Make each package that code, a config, or `tsconfig.json` names a direct dependency, for example `@types/node`. pnpm does not hoist the others to the top of `node_modules`.
- Do not use `shamefullyHoist` or `nodeLinker: hoisted`.
- Use the newest Node.js LTS. Move up once the next major reaches LTS on the [Node.js release schedule](https://github.com/nodejs/release#release-schedule).
- Do not use a non-LTS Node.js.
- Astro 7.4.2 or newer needs Node.js 22.23.4 or newer.
- Do not use Corepack.
- Do not set `packageManager` or `devEngines.packageManager` in `package.json`.
- Reason: a pin writes `pnpm-lock.yaml` as two YAML documents. The GitHub dependency graph cannot read them, and Dependabot alerts and security updates stop. See [WHY](../WHY.md#why-pnpm).
- To see outdated packages, run `pnpm outdated`. To see where a package is used, run `pnpm ls <package>`.

## Add a package

### Check the package

- Search the code and `package.json` first.
- Add a package only when the platform, Astro, EmDash, or an installed package cannot do the job.
- Check the package is maintained: a release in the last 12 months, and answers to open issues on npmjs.com and GitHub.

### Check the Workers runtime

- Check `node:` imports against the [Node.js API list](https://developers.cloudflare.com/workers/runtime-apis/nodejs/) of [Workers](STACK.md#workers).
- Do not add a package that needs `node:child_process`, `node:vm`, `node:dgram`, or `node:worker_threads`. These are importable but do not work. Use a Web API or a binding.
- Do not add the `nodejs_compat` flag to make a package work. With `compatibility_date` of `2026-08-04` or later, Node.js APIs are on by default. See [ARCH](ARCH.md).
- Run `pnpm run build` and `pnpm run preview`, which runs workerd. `pnpm run dev` alone is not enough.
- Measure the size before and after with `pnpm exec wrangler deploy --outdir bundled/ --dry-run`.
- The limit is 64 MiB uncompressed. The startup limit is 1 second.

### Place the package

- Put the package in `devDependencies` if only the build, tests, or scripts use it.
- Put it in `dependencies` if the Worker bundle needs it.
- If a package is unused, remove it and commit the lockfile.

## Update packages

### Dependabot

- Use [Dependabot](STACK.md#dependabot) for pnpm and GitHub Actions. Do not use Renovate. See [WHY](../WHY.md#why-dependabot-and-not-renovate).
- Enable Dependabot alerts and security updates in the repository settings.
- Pin GitHub Actions to a full commit SHA with a version comment, for example `uses: actions/checkout@<sha> # v5.0.0`. See [DEPLOY](DEPLOY.md#workflows-and-tokens).
- Every month, run `pnpm update` in a PR and merge it after CI. It stays in semver ranges and leaves `package.json` as it is.
- Validate the Dependabot config with `uvx check-jsonschema --builtin-schema vendor.dependabot .github/dependabot.yml`.
- Merge the `astro` group by hand after the checks in [DEPS](DEPS.md#astro-cloudflare-and-emdash).
- If `dependabot-automerge.yml` skips a PR, review the changelog and merge by hand.
- Make CI a required status check for `main`. Enable "Allow auto-merge".

### Supply chain

- Do not set a longer Dependabot cooldown for packages that release often. Put them in a group.
- For EmDash updates, see [UPDATE](UPDATE.md#emdash-update).
- For a full review, run `pnpm audit` without `--prod`. Fix by update or with `pnpm audit --fix update`.
- `pnpm audit --fix` without a method adds overrides to `pnpm-workspace.yaml`. Review them.

### Astro, Cloudflare, and EmDash

- Upgrade with `pnpm dlx @astrojs/upgrade`. It upgrades `astro` and the official integrations together. Never upgrade `astro` alone.
- Keep `astro`, `@astrojs/cloudflare`, `wrangler`, and `emdash` within their peer ranges.
- `@astrojs/cloudflare` needs a matching `astro` and `wrangler`.
- `emdash` and `@emdash-cms/cloudflare` need `astro`. `@emdash-cms/cloudflare` also needs `wrangler` and `@astrojs/cloudflare`.
- `@emdash-cms/plugin-forms` and `@emdash-cms/plugin-field-kit` pin the peer `@cloudflare/kumo` to one exact version. It must match the version that `emdash` uses.
- Before you upgrade, run `pnpm view <package>@<version> peerDependencies` for the package and its dependents.
- If the range excludes the new version, upgrade the others first.
- After the upgrade, run `pnpm exec wrangler types`, `pnpm exec astro check`, `pnpm run build`, and `pnpm run preview`.
- Fix all errors before the merge.

### Compatibility date

- Update `compatibility_date` in `wrangler.jsonc` deliberately, not with each [Wrangler](STACK.md#wrangler) update. See [ARCH](ARCH.md).
- Keep `compatibility_date` at `2026-08-04` or later.
- Before you raise it, read the [compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/) that the date enables.
- Run the checks in the previous section, and test the preview.
- Deploy to dev first.
