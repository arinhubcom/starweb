# DEPLOY

## CLI

### [Wrangler](STACK.md#wrangler)

- Deploy, rollback, secrets, D1 → Wrangler. No `cf` CLI while in beta. → [WHY](../WHY.md#why-wrangler-and-not-cf)

## Environments

### Wrangler environments

- Three environments plus PR preview:

  | Environment | Worker | Deployed when | Command | URL |
  |---|---|---|---|---|
  | PR preview | dev Worker, version without traffic | Each push to a PR | `wrangler versions upload --env="" --preview-alias pr-<number>` | `pr-<number>-<worker>.<subdomain>.workers.dev` |
  | dev | `<worker>` | Each push to `main` | `wrangler deploy --env=""` | `<worker>.<subdomain>.workers.dev` |
  | stage | `<worker>-production`, version without traffic | Each release tag `<worker>-YYYY-MM-DD-rN` | `wrangler versions upload --env production --tag <worker>-YYYY-MM-DD-rN --preview-alias stage` | `stage-<worker>-production.<subdomain>.workers.dev` |
  | prod | `<worker>-production` | After stage is tested | `wrangler versions deploy --env production` | Custom domain |

- Dev config at top level of `wrangler.jsonc`; prod in `env.production`.
- Every Wrangler command (also `d1 migrations apply`, `secret put`) gets `--env=""` (dev) or `--env production`. `--env=""` as one token: `wrangler-action` drops a separate `""`.
- No separate stage Worker: stage is a no-traffic version of the prod Worker. → [WHY](../WHY.md#why-three-environments)
- Separate D1, KV, R2 per environment, same binding names. Dev and PR previews never use prod data.
- Repeat in `env.production` (not inherited): `d1_databases`, `r2_buckets`, `kv_namespaces`, `version_metadata`, `images`, `ratelimits`, `ai`, `queues`, `workflows`, `durable_objects`, `services`, `vars`, `secrets`, `define`. Do not repeat (inherited): `compatibility_date`, `compatibility_flags`, `observability`, `placement`, `triggers`, `assets`.
- `SESSION` KV namespace in `kv_namespaces` in `env.production` and at top level ([Astro](STACK.md#astro) `sessionKVBindingName` default); the template sets the top-level one. No `session: false`: [EmDash](STACK.md#emdash) stores admin logins in Astro sessions.
- Prod gets its own `routes` (custom domain). Dev stays on `workers.dev` with one Worker; more Workers → Separate Workers.
- `"preview_urls": true` in `env.production` (with `routes`, `workers_dev` defaults to `false`, so stage has no URL). Protect the stage URL with Cloudflare Access (Version URLs).
- Stage uses prod bindings: apply prod migrations before the stage upload (Migrations).

## Releases

### Git tags

- Tag `<worker>-YYYY-MM-DD-rN`; `<worker>` = top-level `name` in `wrangler.jsonc`, not `<worker>-production`. Example `mysite-2026-10-14-r1`. `rN` restarts at `r1` each day. No semver. → [WHY](../WHY.md#why-date-based-release-tags)
- Annotated tag on `main`: `git tag -a mysite-2026-10-14-r1 -m "<summary>"`, `git push origin mysite-2026-10-14-r1`. The push uploads stage (CI).
- Remove the template `deploy` script `astro build && wrangler deploy`, or replace it with `astro build` + `wrangler versions upload`. Never release prod with `wrangler deploy`.
- Same tag in `wrangler versions upload --tag`: promotion finds the version by tag.

### Gradual deployments

- Prod = `wrangler versions upload`, then `wrangler versions deploy`. Never `wrangler deploy` for prod.
- Raise traffic in steps (10 %, 50 %, 100 %); check errors and logs before each step.
- `Cloudflare-Workers-Version-Key` header pins a user to one version (Transform Rule reading the session cookie; needs a route on your own zone, not `workers.dev`).
- Durable Object change → read [WHY](../WHY.md#why-two-step-releases) first.

### Version metadata

- Binding `CF_VERSION_METADATA` (`version_metadata`). `env.CF_VERSION_METADATA.id` in every log line and error report.

### Version URLs

- Test the version on `wrangler versions upload --env production --preview-alias stage` before traffic.
- Alias: lowercase letters, numbers, dashes; starts with a letter; `<alias>-<worker>` ≤ 63 characters.
- Protect version URLs with Cloudflare Access, or `preview_urls: false`.
- Workers with [Durable Objects](STACK.md#durable-objects) or custom-domain-only → Previews (CI), not version URLs.

## Migrations

### [D1](STACK.md#d1) migrations

- Release order: `emdash migrate` → `wrangler d1 migrations apply <db> --remote` per app database → `wrangler versions upload` → `wrangler versions deploy`.
- Every migration works with the new and the running version: add first, remove in a later release. Applies to PR migrations too (the preview applies them to the shared dev database).
- PR migrations independent of other open PRs. Same migration number in two PRs → keep both files with different names (D1 records by file name).
- PR closed without merge → `wrangler d1 time-travel restore <db> --timestamp=<time before its first preview run> --env=""`, then push to each other open PR so its preview re-applies. Or a revert migration on `main`.
- No rename or drop in one release: add the new column, copy data, switch code, drop the old column later.

### [EmDash](STACK.md#emdash) core migrations

- `emdash migrate` in CI against the remote D1 database of the environment, after `pnpm run build` (writes `.emdash/migrations.json`; keep it in `.gitignore`).
- `pnpm exec emdash migrate --account-id "$CLOUDFLARE_ACCOUNT_ID" --d1 "$D1_DATABASE_ID" --expected-target-fingerprint "$EMDASH_TARGET_FINGERPRINT"`, `CLOUDFLARE_API_TOKEN` with D1 Edit. Non-interactive apply fails without the fingerprint.
- After deploy: `pnpm exec emdash migrate --check` (non-zero on pending or unknown migrations).
- Local: `pnpm exec emdash migrate --wrangler-config wrangler.jsonc --wrangler-env production` with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`; check the printed target. CI uses the explicit `--account-id`/`--d1` form.
- Fingerprint once per database: `pnpm exec emdash migrate --status --account-id <id> --d1 <database>` locally, check account and database, store as variable `EMDASH_TARGET_FINGERPRINT` of the GitHub environment (dev or `production`). Change only after reviewing a changed target.
- One `emdash migrate` per database at a time (second run waits 10 s for the lock, then fails). Never cancel a running one (lock stays held).
- Stuck lock: `pnpm exec emdash migrate --status`, confirm no job runs, `pnpm exec emdash migrate --take-over-lock <id>`.

### D1 Time Travel

- Before a risky migration: `wrangler d1 time-travel info <db>`, save the bookmark.
- `wrangler d1 time-travel restore <db> --bookmark=<bookmark>` overwrites in place; save the bookmark it prints (undo).
- Retention: 7 days (Free), 30 days (Paid).

## Rollback

### Rollbacks

- `wrangler rollback [<version-id>]`; only the last 100 versions.
- Rollback does not touch D1, KV, R2 → restore D1 with Time Travel.
- Never delete a KV namespace, R2 bucket, or queue an older version binds (blocks rollback to it).

## Secrets

### Secrets

- Prod: `wrangler versions secret put` then `wrangler versions deploy`. Never `wrangler secret put` in prod.
- New secret before the version that reads it deploys.
- Set or change a prod secret before the stage upload, or `wrangler versions upload --secrets-file <file>`, so the tagged version has it. (`versions secret put` changes the latest uploaded version and creates a new one.)
- Secret change after the stage upload → deploy the version `versions secret put` created (ID from `wrangler versions list --env production`), not the tagged one.

## CI

### [GitHub Actions](STACK.md#github-actions)

- `cloudflare/wrangler-action@v4` pinned to a commit SHA; token in secret `CLOUDFLARE_API_TOKEN` as `apiToken`. Not also Workers Builds (double deploy). → [WHY](../WHY.md#why-github-actions-and-not-workers-builds)
- Token from the **Edit Cloudflare Workers** template; **Account Resources** = the one account, **Zone Resources** = the one zone of the routes. Add D1 Edit (migrations, `emdash migrate`); Queues Edit only with Queues. Nothing else.
- Two tokens: repository secret (PR previews, dev deploy); secret of GitHub environment `production` (stage, promotion).
- PR preview: `pull_request` (default types), `wrangler versions upload --env="" --preview-alias pr-${{ github.event.pull_request.number }}`. No `pull_request_target`; forks get no preview.
- Before the upload: `pnpm run build`, `pnpm exec emdash migrate`, `wrangler d1 migrations apply <db> --remote --env=""`. Never edit a migration a preview applied → new migration.
- One sticky PR comment with the preview URL (`marocchino/sticky-pull-request-comment`). Build the alias URL yourself: `deployment-url` is the versioned URL ([wrangler-action#384](https://github.com/cloudflare/wrangler-action/issues/384)).
- Token job: `contents: read` only. Comment job: `pull-requests: write`. No job has both.
- `concurrency` per PR, `cancel-in-progress: false`: `group: cf-preview-${{ github.event.pull_request.number }}`.
- Dev deploy: `push` with `branches: [main]`, checkout `${{ github.sha }}`; `pnpm run build`, `pnpm exec emdash migrate`, `wrangler d1 migrations apply <db> --remote --env=""`, `wrangler deploy --env=""`. Not `pull_request` `closed`.
- Dev deploy `concurrency` with `cancel-in-progress: false`.
- Stage: `push` with `tags: ["<worker>-[0-9]*"]`, `environment: production`; `pnpm run build`, `pnpm exec emdash migrate`, `wrangler d1 migrations apply <db> --remote --env production`, `wrangler versions upload --env production --tag ${{ github.ref_name }} --preview-alias stage`.
- Environment `production`: deploy only from tag pattern `<worker>-[0-9]*` and branch `main` (`GITHUB_REF`: `refs/tags/<tag>` for stage, `refs/heads/main` for promotion).
- Private repository: GitHub Pro or Team (GitHub Free has no environments). → [GITHUB](GITHUB.md#plans)
- Promotion: `workflow_dispatch`, environment `production`; find the version by tag, `wrangler versions deploy <version-id>@10% <old-version-id>@90% --env production -y`, then Releases steps.

### Previews

- Worker with Durable Objects → `wrangler preview --name pr-<number>` instead of version URLs. On PR close: `wrangler preview delete --name pr-<number> --skip-confirmation`.
- Wrangler ≥ 4.135.0.
- Bind each D1 in the `previews` block to a dev database, same binding name. Never a prod database.
- Dev migrations applied before creating a Preview.
- Secrets: `pnpm exec wrangler preview base-config secret put <NAME>`.
- Protect Preview URLs with Cloudflare Access.

## Separate Workers

Moving an app to its own Worker. → [ARCH](ARCH.md) (Apps) first.

### Routes

- App Worker: own Astro project and `wrangler.jsonc` (`workers/app1/`), same environments as the web Worker.
- Prod route: `"routes": [{ "pattern": "example.com/app1/*", "zone_name": "example.com" }]`; web Worker keeps `example.com/*`.
- Both dev Workers on one dev hostname (`dev.example.com/*`, `dev.example.com/app1/*`), proxied DNS record; not `workers.dev` (login cookie does not cross hosts).
- Test the app login flow on dev only (PR previews and stage have their own `workers.dev` host).

### Static assets on a path

- `base: "/app1"` in the app Worker `astro.config`; prefix links and asset URLs with `import.meta.env.BASE_URL`.
- Build output under `app1/` in the assets directory (`app1/_astro/`). → [WHY](../WHY.md#why-separate-workers-share-one-hostname)

### Secrets across Workers

- Same `BETTER_AUTH_SECRET` in both Workers, every environment. App Worker also binds the database holding the [Better Auth](STACK.md#better-auth) sessions.
- Each database migrated from one workflow only: `migrations/app1/` from the app Worker workflow, EmDash migrations from the web Worker workflow.

### Workflows

- One workflow file per Worker (PR preview, dev deploy, stage), filtered by `paths: ["workers/app1/**", "src/shared/**"]` including shared code.
- App Worker tags `app1-YYYY-MM-DD-rN`, stage on `tags: ["app1-[0-9]*"]`.
- Promote and roll back each Worker alone; keep the contract with the other Worker (cookie name, session data, links) compatible with its previous version.

## Checks

- `pnpm run check` (includes `pnpm run typecheck`) before each release. → [QUALITY](QUALITY.md)
- Test locally with `astro build` and `astro preview`. → [DEV](DEV.md)
