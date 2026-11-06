# DEPLOY

This file covers how to deploy the site to Cloudflare: environments, CI, migrations, releases, secrets, rollbacks, and separate Workers. Read it before you change a Wrangler config or a deploy workflow.

## Choose the CLI

- Use [Wrangler](STACK.md#wrangler) for deploys, rollbacks, secrets, and D1.
- Do not use the `cf` CLI while it is in beta. See [WHY](../WHY.md#why-wrangler-and-not-cf).

## Set up the environments

### Environments and URLs

- Use three environments and a PR preview:

  | Environment | Worker | Deployed when | Command | URL |
  |---|---|---|---|---|
  | PR preview | dev Worker, version without traffic | Each push to a PR | `wrangler versions upload --env="" --preview-alias pr-<number>` | `pr-<number>-<worker>.<subdomain>.workers.dev` |
  | dev | `<worker>` | Each push to `main` | `wrangler deploy --env=""` | `<worker>.<subdomain>.workers.dev` |
  | stage | `<worker>-production`, version without traffic | Each release tag `<worker>-YYYY-MM-DD-rN` | `wrangler versions upload --env production --tag <worker>-YYYY-MM-DD-rN --preview-alias stage` | `stage-<worker>-production.<subdomain>.workers.dev` |
  | prod | `<worker>-production` | After stage is tested | `wrangler versions deploy --env production` | Custom domain |

- Do not add a separate stage Worker. Stage is a version of the prod Worker without traffic. See [WHY](../WHY.md#why-three-environments).

### Wrangler config

- Put the dev config at the top level of `wrangler.jsonc`. Put the prod config in `env.production`.
- Add `--env=""` for dev or `--env production` for prod to every Wrangler command, including `d1 migrations apply` and `secret put`.
- Write `--env=""` as one token. `wrangler-action` drops a separate `""`.
- Use a separate D1 database, KV namespace, and R2 bucket for each environment, with the same binding names.
- Never let dev or PR previews use prod data.
- Repeat these keys in `env.production`, because it does not inherit them: `d1_databases`, `r2_buckets`, `kv_namespaces`, `version_metadata`, `images`, `ratelimits`, `ai`, `queues`, `workflows`, `durable_objects`, `services`, `vars`, `secrets`, `define`.
- Do not repeat these keys in `env.production`, because it inherits them: `compatibility_date`, `compatibility_flags`, `observability`, `placement`, `triggers`, `assets`.
- Add the `SESSION` KV namespace to `kv_namespaces` in `env.production` too. It is the [Astro](STACK.md#astro) `sessionKVBindingName` default.
- Do not set `session: false`. [EmDash](STACK.md#emdash) stores admin logins in Astro sessions.
- Give prod its own `routes` with a custom domain.
- Keep dev on `workers.dev` with one Worker. For more Workers, see [DEPLOY](DEPLOY.md#separate-workers).
- Set `"preview_urls": true` in `env.production`. With `routes`, `workers_dev` defaults to `false`, so stage has no URL without it.
- Protect the stage URL with Cloudflare Access. See [DEPLOY](DEPLOY.md#test-the-stage-version).
- Stage uses prod bindings. Apply prod migrations before the stage upload. See [DEPLOY](DEPLOY.md#migrate-the-databases).

## Set secrets

- Set a prod secret with `wrangler versions secret put`, then run `wrangler versions deploy`.
- Never use `wrangler secret put` in prod.
- For the token that goes in each place, and for `pnpm run set-secrets`, see [TOKENS](TOKENS.md).
- Set a new secret before the version that reads it deploys.
- Set or change a prod secret before the stage upload, or use `wrangler versions upload --secrets-file <file>`, so that the tagged version has it.
- `versions secret put` changes the latest uploaded version and creates a new one.
- If you change a secret after the stage upload, deploy the version that `versions secret put` created, not the tagged one.
- Get that version ID from `wrangler versions list --env production`.

## Set up CI

### Workflows and tokens

- Use [GitHub Actions](STACK.md#github-actions) with `cloudflare/wrangler-action@v4` pinned to a commit SHA.
- Pass the token as `apiToken` from the secret `CLOUDFLARE_API_TOKEN`.
- Do not also use Workers Builds. It deploys twice. See [WHY](../WHY.md#why-github-actions-and-not-workers-builds).
- Create the token from the **Edit Cloudflare Workers** template.
- Set **Account Resources** to the one account. Set **Zone Resources** to the one zone of the routes.
- Add D1 Edit to the token for migrations and `emdash migrate`.
- Add Queues Edit only if the app uses Queues.
- Add no other permission.
- Use two tokens, each a secret of a GitHub environment: `dev` for PR previews and the dev deploy, and `production` for stage and promotion.
- Do not store a deploy token as a repository secret. See [TOKENS](TOKENS.md).

### GitHub environments

- Limit the environment `dev` to branch `main` and `refs/pull/*/merge`. A `pull_request` run has that `GITHUB_REF`.
- Limit the environment `production` to the tag pattern `<worker>-[0-9]*` and branch `main`.
- Stage runs with `GITHUB_REF` `refs/tags/<tag>`. Promotion runs with `refs/heads/main`.
- For a private repository, use GitHub Pro or Team. GitHub Free has no environments. See [GITHUB](GITHUB.md#choose-a-plan).

### PR preview workflow

- Trigger on `pull_request` with the default types. Use `environment: dev`.
- Run `wrangler versions upload --env="" --preview-alias pr-${{ github.event.pull_request.number }}`.
- Do not use `pull_request_target`. Forks get no preview.
- Before the upload, run `pnpm run build`, `pnpm exec emdash migrate`, and `wrangler d1 migrations apply <db> --remote --env=""`.
- Never edit a migration that a preview applied. Add a new migration.
- Post one sticky PR comment with the preview URL, using `marocchino/sticky-pull-request-comment`.
- Build the alias URL yourself. `deployment-url` is the versioned URL. See [wrangler-action#384](https://github.com/cloudflare/wrangler-action/issues/384).
- Give the token job `contents: read` only. Give the comment job `pull-requests: write`. No job has both.
- Set `concurrency` per PR with `cancel-in-progress: false` and `group: cf-preview-${{ github.event.pull_request.number }}`.

### Dev deploy workflow

- Trigger on `push` with `branches: [main]`. Use `environment: dev` and check out `${{ github.sha }}`.
- Run `pnpm run build`, `pnpm exec emdash migrate`, `wrangler d1 migrations apply <db> --remote --env=""`, and `wrangler deploy --env=""`.
- Do not trigger on `pull_request` `closed`.
- Set `concurrency` with `cancel-in-progress: false`.

### Stage workflow

- Trigger on `push` with `tags: ["<worker>-[0-9]*"]`. Use `environment: production`.
- Run `pnpm run build`, `pnpm exec emdash migrate`, and `wrangler d1 migrations apply <db> --remote --env production`.
- Then run `wrangler versions upload --env production --tag ${{ github.ref_name }} --preview-alias stage`.

### Promotion workflow

- Trigger on `workflow_dispatch`. Use `environment: production`.
- Find the version by its tag.
- Run `wrangler versions deploy <version-id>@10% <old-version-id>@90% --env production -y`.
- Then follow the steps in [Release to production](#release-to-production).

## Migrate the databases

### D1 migrations

- Release in this order: `emdash migrate`, then `wrangler d1 migrations apply <db> --remote` for each app database, then `wrangler versions upload`, then `wrangler versions deploy`.
- Write each migration so that it works with the new version and the running version. Add first, and remove in a later release.
- Apply this rule to PR migrations too. The preview applies them to the shared dev database.
- Keep PR migrations independent of other open PRs.
- If two PRs use the same migration number, keep both files with different names. D1 records migrations by file name.
- If a PR closes without a merge, run `wrangler d1 time-travel restore <db> --timestamp=<time before its first preview run> --env=""`.
- Then push to each other open PR, so that its preview applies its migrations again. Or add a revert migration on `main`.
- Do not rename or drop in one release. Add the new column, copy data, switch code, and drop the old column in a later release.

### EmDash core migrations

- Run `emdash migrate` in CI against the remote D1 database of the environment, after `pnpm run build`. The build writes `.emdash/migrations.json`.
- Run `pnpm exec emdash migrate --account-id "$CLOUDFLARE_ACCOUNT_ID" --d1 "$D1_DATABASE_ID" --expected-target-fingerprint "$EMDASH_TARGET_FINGERPRINT"`.
- Use a `CLOUDFLARE_API_TOKEN` with D1 Edit. A non-interactive apply fails without the fingerprint.
- After the deploy, run `pnpm exec emdash migrate --check`. It exits non-zero on pending or unknown migrations.
- To run it locally, use `pnpm exec emdash migrate --wrangler-config wrangler.jsonc --wrangler-env production` with `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. Check the printed target.
- CI uses the explicit `--account-id` and `--d1` form.
- Get the fingerprint once for each database. Run `pnpm exec emdash migrate --status --account-id <id> --d1 <database>` locally and check the account and database.
- Store the fingerprint as the variable `EMDASH_TARGET_FINGERPRINT` of the GitHub environment, `dev` or `production`.
- Change the fingerprint only after you review a changed target.
- Run one `emdash migrate` for each database at a time. A second run waits 10 seconds for the lock, then fails.
- Never cancel a running `emdash migrate`. The lock stays held.
- If the lock is stuck, run `pnpm exec emdash migrate --status` and confirm that no job runs. Then run `pnpm exec emdash migrate --take-over-lock <id>`.

### D1 Time Travel

- Before a risky migration, run `wrangler d1 time-travel info <db>` and save the bookmark.
- `wrangler d1 time-travel restore <db> --bookmark=<bookmark>` overwrites the database in place. Save the bookmark that it prints, so that you can undo it.
- Time Travel keeps 7 days of history on Free and 30 days on Paid.

## Release to production

### Tag a release

- Name the tag `<worker>-YYYY-MM-DD-rN`, for example `mysite-2026-10-14-r1`.
- Use the top-level `name` in `wrangler.jsonc` as `<worker>`, not `<worker>-production`.
- Restart `rN` at `r1` each day. Do not use semver. See [WHY](../WHY.md#why-date-based-release-tags).
- Create an annotated tag on `main`: `git tag -a mysite-2026-10-14-r1 -m "<summary>"`.
- Push it with `git push origin mysite-2026-10-14-r1`. The push uploads stage in CI.
- Do not add a `deploy` script that runs `wrangler deploy` for prod.
- Use the same tag in `wrangler versions upload --tag`. Promotion finds the version by tag.

### Test the stage version

- Test the version on `wrangler versions upload --env production --preview-alias stage` before it gets traffic.
- Write the alias with lowercase letters, numbers, and dashes. Start it with a letter.
- Keep `<alias>-<worker>` at 63 characters or fewer.
- Protect version URLs with Cloudflare Access, or set `preview_urls: false`.
- For a Worker with [Durable Objects](STACK.md#durable-objects) or only a custom domain, use a preview instead of version URLs. See [DEPLOY](DEPLOY.md#previews).

### Gradual deployments

- Release prod with `wrangler versions upload`, then `wrangler versions deploy`.
- Never use `wrangler deploy` for prod.
- Raise traffic in steps of 10 %, 50 %, and 100 %.
- Check errors and logs before each step.
- To pin a user to one version, use the `Cloudflare-Workers-Version-Key` header. Set it with a Transform Rule that reads the session cookie.
- That rule needs a route on your own zone, not `workers.dev`.
- Before you change a Durable Object, read [WHY](../WHY.md#why-two-step-releases).

### Version metadata

- Add `env.CF_VERSION_METADATA.id` to every log line and error report.

### Checks

- Run `pnpm run check` before each release. See [QUALITY](QUALITY.md).
- Test locally with `astro build` and `astro preview`. See [DEV](DEV.md).

## Roll back

- Run `wrangler rollback [<version-id>]`. It works for the last 100 versions only.
- A rollback does not touch D1, KV, or R2. Restore D1 with Time Travel.
- Never delete a KV namespace, R2 bucket, or queue that an older version binds. It blocks a rollback to that version.

## Previews

- For a Worker with Durable Objects, use `wrangler preview --name pr-<number>` instead of version URLs.
- When the PR closes, run `wrangler preview delete --name pr-<number> --skip-confirmation`.
- Use Wrangler 4.135.0 or newer.
- Bind each D1 database in the `previews` block to a dev database, with the same binding name. Never use a prod database.
- Apply the dev migrations before you create a preview.
- Set preview secrets with `pnpm exec wrangler preview base-config secret put <NAME>`.
- Protect preview URLs with Cloudflare Access.

## Separate Workers

This section covers moving an app to its own Worker. Read [ARCH](ARCH.md#add-a-micro-frontend-as-an-astro-integration) first.

### Routes

- Give the app Worker its own Astro project and `wrangler.jsonc`, in `workers/app1/`. Use the same environments as the web Worker.
- Set the prod route to `"routes": [{ "pattern": "example.com/app1/*", "zone_name": "example.com" }]`. The web Worker keeps `example.com/*`.
- Put both dev Workers on one dev hostname: `dev.example.com/*` and `dev.example.com/app1/*`. Use a proxied DNS record.
- Do not use `workers.dev` for this. The login cookie does not cross hosts.
- Test the app login flow on dev only. PR previews and stage have their own `workers.dev` host.

### Static assets on a path

- Set `base: "/app1"` in the `astro.config` of the app Worker.
- Prefix links and asset URLs with `import.meta.env.BASE_URL`.
- Put the build output under `app1/` in the assets directory, for example `app1/_astro/`. See [WHY](../WHY.md#why-separate-workers-share-one-hostname).

### Secrets across Workers

- Use the same `BETTER_AUTH_SECRET` in both Workers, in every environment.
- Bind the database that holds the [Better Auth](STACK.md#better-auth) sessions in the app Worker too.
- Migrate each database from one workflow only.
- Run `migrations/app1/` from the app Worker workflow. Run the EmDash migrations from the web Worker workflow.

### Workflows

- Use one workflow file per Worker for PR preview, dev deploy, and stage.
- Filter each with `paths: ["workers/app1/**", "src/shared/**"]`, which includes the shared code.
- Tag the app Worker `app1-YYYY-MM-DD-rN`. Run stage on `tags: ["app1-[0-9]*"]`.
- Promote and roll back each Worker alone.
- Keep the contract with the other Worker compatible with its previous version. The contract covers the cookie name, session data, and links.
