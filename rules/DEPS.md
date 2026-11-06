# DEPS

Packages and updates. CI → [DEPLOY](DEPLOY.md). Workers runtime → [ARCH](ARCH.md).

## Install

### [pnpm](STACK.md#pnpm)

- pnpm only ([SETUP](SETUP.md)); no npm/Yarn/Bun; only `pnpm-lock.yaml` in the repository. Commit it with each `package.json` change. → [WHY](../WHY.md#why-pnpm)
- No `create-emdash`: a project does not use it. New package: let pnpm write the version; never edit it by hand.
- Fix a peer dependency conflict; do not hide it. `emdash-better-auth` needs React ≥ 19.2.6.
- No settings in `.npmrc` except auth, registry, TLS, and proxy: pnpm reads only those from it.
- An install fails on a new package with a build script: read the script, then add the package to `allowBuilds` with `true` or `false`.
- Each package that code, a config, or `tsconfig.json` names is a direct dependency (`@types/node`). pnpm does not hoist the others to the top of `node_modules`; no `shamefullyHoist`, no `nodeLinker: hoisted`.
- Node.js: newest LTS; move up once the next major reaches LTS on the [Node.js release schedule](https://github.com/nodejs/release#release-schedule). No non-LTS. Astro ≥ 7.4.2 needs Node.js ≥ 22.23.4.
- No Corepack.
- No `packageManager` or `devEngines.packageManager` in `package.json`: a pin writes `pnpm-lock.yaml` as two YAML documents, the GitHub dependency graph cannot read them, and Dependabot alerts and security updates stop. → [WHY](../WHY.md#why-pnpm)
- `pnpm outdated`; `pnpm ls <package>`.

## Update

### [Dependabot](STACK.md#dependabot) version updates

- Dependabot for pnpm and GitHub Actions; no Renovate. → [WHY](../WHY.md#why-dependabot-and-not-renovate)
- Enable Dependabot alerts and security updates in repository settings.
- GitHub Actions pinned to full commit SHA with version comment: `uses: actions/checkout@<sha> # v5.0.0`. → [DEPLOY](DEPLOY.md) (CI)
- Monthly: `pnpm update` in a PR, merge after CI (stays in semver ranges, leaves `package.json`).
- Validate: `uvx check-jsonschema --builtin-schema vendor.dependabot .github/dependabot.yml`.

### Dependabot groups

- Merge the `astro` group by hand after the Compatibility checks.

### Dependabot automerge

- A PR that `dependabot-automerge.yml` skips: review the changelog, merge by hand.
- CI is a required status check for `main`; enable "Allow auto-merge".

## Supply chain

### Dependabot cooldown

- No longer cooldown for frequent releasers → group.

### pnpm minimumReleaseAge

- `minimumReleaseAge` (minutes) equals `cooldown.default-days`.
- New `emdash` releases wait 3 days (no exclude list). → [UPDATE](UPDATE.md) (EmDash update)

### pnpm audit

- Full review: `pnpm audit` without `--prod`; fix by update or `pnpm audit --fix update`. `--fix` without a method adds overrides to `pnpm-workspace.yaml`: review them.

## Add a package

### [Workers](STACK.md#workers) runtime

- Search code and `package.json` first; add only when platform, Astro, EmDash, or an installed package cannot do it.
- Check `node:` imports against the [Node.js API list](https://developers.cloudflare.com/workers/runtime-apis/nodejs/). No package needing `node:child_process`, `node:vm`, `node:dgram`, `node:worker_threads` (importable, non-working) → Web API or binding.
- No `nodejs_compat` flag to make a package work; with `compatibility_date` ≥ `2026-08-04` Node.js APIs are default. → [ARCH](ARCH.md)
- Run `pnpm run build` and `pnpm run preview` (workerd); `pnpm run dev` alone is not enough.
- Size before/after: `pnpm exec wrangler deploy --outdir bundled/ --dry-run`. Limit 64 MiB uncompressed; startup limit 1 second.
- Maintained: release in last 12 months, open issues answered (npmjs.com, GitHub).
- `devDependencies` if only build/tests/scripts use it; `dependencies` if the Worker bundle needs it.
- Unused package → remove it, commit the lockfile.

## Compatibility

### Astro, Cloudflare, and EmDash

- `pnpm dlx @astrojs/upgrade` upgrades `astro` and official integrations together; never `astro` alone.
- `astro`, `@astrojs/cloudflare`, `wrangler`, `emdash` within peer ranges: `@astrojs/cloudflare` needs matching `astro` and `wrangler`; `emdash` and `@emdash-cms/cloudflare` need `astro`; `@emdash-cms/cloudflare` also needs `wrangler` and `@astrojs/cloudflare`.
- `@emdash-cms/plugin-forms` and `@emdash-cms/plugin-field-kit` pin the peer `@cloudflare/kumo` to one exact version: it must match the version that `emdash` uses.
- Before upgrading: `pnpm view <package>@<version> peerDependencies` for it and its dependents; upgrade others first if the range excludes it.
- After: `pnpm exec wrangler types`, `pnpm exec astro check`, `pnpm run build`, `pnpm run preview`; fix all errors before merge.

### [Wrangler](STACK.md#wrangler) compatibility date

- Update `compatibility_date` in `wrangler.jsonc` deliberately, not per Wrangler update; stay ≥ `2026-08-04`. → [ARCH](ARCH.md)
- Before raising: read the [compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/) the date enables, run the checks above, test preview, deploy to dev first.
