# DEPS

Packages and updates. CI → [DEPLOY](DEPLOY.md). Workers runtime → [ARCH](ARCH.md).

## Install

### [pnpm](STACK.md#pnpm)

- pnpm only ([SETUP](SETUP.md)); no npm/Yarn/Bun; only `pnpm-lock.yaml` in the repository. Commit it with each `package.json` change. → [WHY](../WHY.md#why-pnpm)
- Exact versions in `package.json`, with `pnpm-lock.yaml`. No `create-emdash`: a project does not use it. New package: let pnpm write the version; never edit it by hand.
- CI: `pnpm install --frozen-lockfile`, not `pnpm install`.
- Fix a peer dependency conflict; do not hide it. `emdash-better-auth` needs React ≥ 19.2.6.
- Settings in `pnpm-workspace.yaml` (pnpm reads only auth, registry, TLS, and proxy settings from `.npmrc`).
- Build scripts: `allowBuilds` in `pnpm-workspace.yaml` lists each allowed package (`esbuild`, `workerd`). An install fails on a new package with a build script: read the script, then add the package with `true` or `false`.
- Each package that code, a config, or `tsconfig.json` names is a direct dependency (`@types/node`). pnpm does not hoist the others to the top of `node_modules`; no `shamefullyHoist`, no `nodeLinker: hoisted`.
- Node.js: newest LTS; major in `.nvmrc` (`24`); move up once the next major reaches LTS on the [Node.js release schedule](https://github.com/nodejs/release#release-schedule). No non-LTS. Astro ≥ 7.4.2 needs Node.js ≥ 22.23.4.
- pnpm ≥ 12; `setup.mjs` and `update.mjs` stop on an older version. No Corepack.
- No `packageManager` or `devEngines.packageManager` in `package.json`: a pin writes `pnpm-lock.yaml` as two YAML documents, the GitHub dependency graph cannot read them, and Dependabot alerts and security updates stop. CI pins the version in `pnpm/action-setup`. → [WHY](../WHY.md#why-pnpm)
- CI Node.js: `pnpm/action-setup` first, then `actions/setup-node` with `node-version-file` or `node-version` from the same value as local, `cache: pnpm`.
- `pnpm outdated`; `pnpm ls <package>`.

## Update

### [Dependabot](STACK.md#dependabot) version updates

- Dependabot for pnpm and GitHub Actions; no Renovate. → [WHY](../WHY.md#why-dependabot-and-not-renovate)
- `.github/dependabot.yml`, `version: 2`; entries `package-ecosystem: "npm"` (the Dependabot value for pnpm) and `"github-actions"`, both `directory: "/"`.
- Each `schedule`: `interval: "weekly"`, `day: "monday"`, `time: "02:00"`, IANA `timezone` (`"Europe/Prague"`).
- Enable Dependabot alerts and security updates in repository settings.
- GitHub Actions pinned to full commit SHA with version comment: `uses: actions/checkout@<sha> # v5.0.0`. → [DEPLOY](DEPLOY.md) (CI)
- Monthly: `pnpm update` in a PR, merge after CI (stays in semver ranges, leaves `package.json`).
- Validate: `uvx check-jsonschema --builtin-schema vendor.dependabot .github/dependabot.yml`.

### Dependabot groups

- Package group `astro`: `patterns: ["astro", "@astrojs/*", "wrangler", "@emdash-cms/*"]`. Merge by hand after the Compatibility checks.
- Package `ignore`: `emdash`, `@emdash-cms/cloudflare`. → [UPDATE](UPDATE.md) (EmDash update)
- Package group `dev-dependencies`: `dependency-type: "development"`, `update-types: ["minor", "patch"]`.

### Dependabot automerge

- Workflow `.github/workflows/dependabot-automerge.yml` (no automerge option in `dependabot.yml`).
- On `pull_request`, `permissions: { contents: write, pull-requests: write }`, only if `github.event.pull_request.user.login == 'dependabot[bot]'`.
- `dependabot/fetch-metadata` v3, pinned to a commit SHA.
- `gh pr merge --auto --squash "$PR_URL"` with `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` only for `dependency-group == 'dev-dependencies'`, or a single patch of a production package (`dependency-type == 'direct:production'` and `update-type == 'version-update:semver-patch'`).
- No automerge when `previous-version` starts with `0.`, `update-type` is `version-update:semver-major`, or `dependency-group` is `astro`; review changelog, merge by hand.
- CI is a required status check for `main`; enable "Allow auto-merge".

## Supply chain

### Dependabot cooldown

- `"npm"` entry: `cooldown: { default-days: 3 }` (security updates skip it). No longer cooldown for frequent releasers → group.

### pnpm minimumReleaseAge

- `pnpm-workspace.yaml` in repository root (committed): `minimumReleaseAge: 4320` (minutes, so 3 days); equal to `cooldown.default-days`.
- New `emdash` releases wait 3 days (no exclude list). → [UPDATE](UPDATE.md) (EmDash update)

### pnpm audit

- CI: `pnpm audit --prod --audit-level high`; `pnpm audit signatures`.
- `overrides: { zod: "catalog:" }` and `catalog: { zod: <version> }` in `pnpm-workspace.yaml`, `"zod": "catalog:"` in `package.json`: `emdash` 1.4.0 pins `zod` 4.5.4 ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), fixed in 4.6.6). The catalog holds the one `zod` version for the project and its dependencies. Remove all three once `emdash` pins `zod` ≥ 4.6.6. → [WHY](../WHY.md#why-zod-has-a-pnpm-override)
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
