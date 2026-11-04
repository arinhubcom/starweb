# DEPS

Packages and updates. CI → [DEPLOY](DEPLOY.md). Workers runtime → [ARCH](ARCH.md).

## Install

### [npm](STACK.md#npm)

- npm only ([SETUP](SETUP.md)); no pnpm/Yarn/Bun; only `package-lock.json` in the repository. Commit it with each `package.json` change.
- Package that every project needs: exact version in `template/package.json`. Project package: let npm write the version; never edit it by hand.
- CI: `npm ci`, not `npm install`.
- No `--legacy-peer-deps`; fix the conflict. `emdash-better-auth` needs React ≥ 19.2.6: template pins 19.3.1.
- No `pnpm-workspace.yaml` (else `shadcn init` uses pnpm, writes `pnpm-lock.yaml`).
- Node.js: newest LTS; major in `.nvmrc` (`24`); move up once the next major reaches LTS on the [Node.js release schedule](https://github.com/nodejs/release#release-schedule). No non-LTS. Astro ≥ 7.4.2 needs Node.js ≥ 22.23.4.
- npm ≥ 11; npm 10 fails with `Cannot read properties of null (reading 'edgesOut')`. Node.js 24 ships npm 11.
- CI Node.js: `actions/setup-node` with `node-version-file` or `node-version` from the same value as local, `cache: npm`.
- `npm outdated`; `npm ls <package>`.

## Update

### [Dependabot](STACK.md#dependabot) version updates

- Dependabot for npm and GitHub Actions; no Renovate. → [WHY](../WHY.md#why-dependabot-and-not-renovate)
- `.github/dependabot.yml`, `version: 2`; entries `package-ecosystem: "npm"` and `"github-actions"`, both `directory: "/"`.
- Each `schedule`: `interval: "weekly"`, `day: "monday"`, `time: "02:00"`, IANA `timezone` (`"Europe/Prague"`).
- Enable Dependabot alerts and security updates in repository settings.
- GitHub Actions pinned to full commit SHA with version comment: `uses: actions/checkout@<sha> # v5.0.0`. → [DEPLOY](DEPLOY.md) (CI)
- Monthly: `npm update` in a PR, merge after CI (stays in semver ranges, leaves `package.json`).
- Validate: `uvx check-jsonschema --builtin-schema vendor.dependabot .github/dependabot.yml`.

### Dependabot groups

- npm group `astro`: `patterns: ["astro", "@astrojs/*", "wrangler", "@emdash-cms/*"]`. Merge by hand after the Compatibility checks.
- npm `ignore`: `emdash`, `@emdash-cms/cloudflare`. → [SETUP](SETUP.md) (EmDash update)
- npm group `dev-dependencies`: `dependency-type: "development"`, `update-types: ["minor", "patch"]`.

### Dependabot automerge

- Workflow `.github/workflows/dependabot-automerge.yml` (no automerge option in `dependabot.yml`).
- On `pull_request`, `permissions: { contents: write, pull-requests: write }`, only if `github.event.pull_request.user.login == 'dependabot[bot]'`.
- `dependabot/fetch-metadata` v3, pinned to a commit SHA.
- `gh pr merge --auto --squash "$PR_URL"` with `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` only for `dependency-group == 'dev-dependencies'`, or a single patch of a production package (`dependency-type == 'direct:production'` and `update-type == 'version-update:semver-patch'`).
- No automerge when `previous-version` starts with `0.`, `update-type` is `version-update:semver-major`, or `dependency-group` is `astro`; review changelog, merge by hand.
- CI is a required status check for `main`; enable "Allow auto-merge".

## Supply chain

### Dependabot cooldown

- npm entry: `cooldown: { default-days: 3 }` (security updates skip it). No longer cooldown for frequent releasers → group.

### npm min-release-age

- `.npmrc` in repository root (committed): `min-release-age=3`; equal to `cooldown.default-days`.
- New `emdash` releases wait 3 days (no exclude list). → [SETUP](SETUP.md) (EmDash update)

### npm audit

- CI: `npm audit --omit=dev --audit-level=high`; `npm audit signatures`.
- `"overrides": { "zod": "$zod" }` in `template/package.json`: `emdash` 1.4.0 pins `zod` 4.5.4 ([GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), fixed in 4.6.6). `$zod` follows the direct dependency, so a `zod` update cannot fail with `EOVERRIDE`. Remove it once `emdash` pins `zod` ≥ 4.6.6. → [WHY](../WHY.md#why-zod-has-an-npm-override)
- Full review: `npm audit` without `--omit=dev`; fix by update or `npm audit fix`. No `npm audit fix --force` without review (allows major bumps).

## Add a package

### [Workers](STACK.md#workers) runtime

- Search code and `package.json` first; add only when platform, Astro, EmDash, or an installed package cannot do it.
- Check `node:` imports against the [Node.js API list](https://developers.cloudflare.com/workers/runtime-apis/nodejs/). No package needing `node:child_process`, `node:vm`, `node:dgram`, `node:worker_threads` (importable, non-working) → Web API or binding.
- No `nodejs_compat` flag to make a package work; with `compatibility_date` ≥ `2026-08-04` Node.js APIs are default. → [ARCH](ARCH.md)
- Run `npm run build` and `npm run preview` (workerd); `npm run dev` alone is not enough.
- Size before/after: `npx wrangler deploy --outdir bundled/ --dry-run`. Limit 64 MiB uncompressed; startup limit 1 second.
- Maintained: release in last 12 months, open issues answered (npmjs.com, GitHub).
- `devDependencies` if only build/tests/scripts use it; `dependencies` if the Worker bundle needs it.
- Unused package → remove it, commit the lockfile.

## Compatibility

### Astro, Cloudflare, and EmDash

- `npx @astrojs/upgrade` upgrades `astro` and official integrations together; never `astro` alone.
- `astro`, `@astrojs/cloudflare`, `wrangler`, `emdash` within peer ranges: `@astrojs/cloudflare` needs matching `astro` and `wrangler`; `emdash` and `@emdash-cms/cloudflare` need `astro`; `@emdash-cms/cloudflare` also needs `wrangler` and `@astrojs/cloudflare`.
- Before upgrading: `npm view <package>@<version> peerDependencies` for it and its dependents; upgrade others first if the range excludes it.
- After: `npx wrangler types`, `npx astro check`, `npm run build`, `npm run preview`; fix all errors before merge.

### [Wrangler](STACK.md#wrangler) compatibility date

- Update `compatibility_date` in `wrangler.jsonc` deliberately, not per Wrangler update; stay ≥ `2026-08-04`. → [ARCH](ARCH.md)
- Before raising: read the [compatibility flags](https://developers.cloudflare.com/workers/configuration/compatibility-flags/) the date enables, run the checks above, test preview, deploy to dev first.
