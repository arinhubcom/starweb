# DEPLOY

## CLI

### [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

- Use Wrangler for deploy, rollback, secrets, and D1. Do not use the [`cf`](https://github.com/cloudflare/cf) CLI while it is in beta. Read [WHY.md](../WHY.md#why-wrangler-and-not-cf).

## Environments

### [Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/)

- Use three environments: dev, stage, and prod. Add a PR preview for each pull request:

  | Environment | Worker | Deployed when | Command | URL |
  |---|---|---|---|---|
  | PR preview | dev Worker, version without traffic | Each push to a PR | `wrangler versions upload --env="" --preview-alias pr-<number>` | `pr-<number>-<worker>.<subdomain>.workers.dev` |
  | dev | `<worker>` | Each PR merge to `main` | `wrangler deploy --env=""` | `<worker>.<subdomain>.workers.dev` |
  | stage | `<worker>-production`, version without traffic | Each release tag `<worker>-YYYY-MM-DD-rN` | `wrangler versions upload --env production --tag <worker>-YYYY-MM-DD-rN --preview-alias stage` | `stage-<worker>-production.<subdomain>.workers.dev` |
  | prod | `<worker>-production` | After you test stage | `wrangler versions deploy --env production` | Your custom domain |

- Put the dev config at the top level of `wrangler.jsonc`, and the prod config in `env.production`. Wrangler names the prod Worker `<worker>-production`.
- Pass `--env=""` for dev and `--env production` for prod in each Wrangler command, also `wrangler d1 migrations apply` and `wrangler secret put`. Write `--env=""` as one token: `wrangler-action` drops a separate empty `""`.
- Do not create a separate stage Worker. Stage is a version of the prod Worker that has no traffic, so prod runs the same build that you tested. Read [WHY.md](../WHY.md#why-three-environments).
- Bind a separate D1 database, KV namespace, and R2 bucket in each environment, with the same binding names. Bindings and `vars` are not inherited by environments, so define them again in `env.production`. Do not let dev or PR previews use prod data. Create each D1 database and R2 bucket with the EU jurisdiction, as in [PRIVACY.md](PRIVACY.md) (Data residency).
- Give the prod environment its own `routes` with your custom domain. Keep dev on `workers.dev` while you have one Worker. For more than one Worker, follow Separate Workers.
- Set `"preview_urls": true` in `env.production`. With `routes`, `workers_dev` defaults to `false`, version URLs follow it, and stage then has no URL. Protect the stage URL with Cloudflare Access (see Version URLs).
- Expect stage to use the prod bindings: it is a version of the prod Worker. Apply the prod migrations before you upload stage. Follow the order in Migrations.

## Releases

### [Git tags](https://git-scm.com/docs/git-tag)

- Name each release tag `<worker>-YYYY-MM-DD-rN`, where `<worker>` is the top-level `name` in `wrangler.jsonc`, not `<worker>-production`. For example, the Worker `mysite` gets `mysite-2026-10-14-r1`. Start `rN` at `r1` each day, and raise it for each further release on that day. Do not use semver tags such as `v1.2.3`. Read [WHY.md](../WHY.md#why-date-based-release-tags).
- Create an annotated tag on `main` and push it: `git tag -a mysite-2026-10-14-r1 -m "<summary>"`, then `git push origin mysite-2026-10-14-r1`. The push uploads stage (see CI).
- Pass the same tag to `wrangler versions upload --tag`, so you can find the version by its tag when you promote it to prod.

### [Gradual deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/)

- Release to production in two steps: `wrangler versions upload`, then `wrangler versions deploy`. Do not use `wrangler deploy` for production: it sends all traffic to the new version at once.
- Raise the traffic share of the new version in steps, for example 10 %, 50 %, and 100 %. Check the errors and logs of the new version before each step.
- Set the `Cloudflare-Workers-Version-Key` header to keep one user on one version during a split, for example with a Transform Rule that reads the session cookie. Transform Rules need a route on your own zone, not `workers.dev`.
- Read [WHY.md](../WHY.md#why-two-step-releases) before you deploy a change to a Durable Object: only one version of each Durable Object runs at a time.

### [Version metadata](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/)

- Add the `version_metadata` binding `CF_VERSION_METADATA` to the Wrangler config. Add `env.CF_VERSION_METADATA.id` to each log line and error report, so you know which version caused an error.

### [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)

- Test a new version on its version URL before it gets traffic: `wrangler versions upload --env production --preview-alias stage` gives `stage-<worker>-production.<subdomain>.workers.dev`.
- Use only lowercase letters, numbers, and dashes in an alias, and start it with a letter. Keep `<alias>-<worker>` at 63 characters or fewer.
- Protect version URLs with Cloudflare Access, or set `preview_urls` to `false`. Version URLs are public when they are on.
- Use Previews (see CI) to test a Worker that has Durable Objects or runs only on a custom domain. Version URLs work only on `workers.dev` and are not made for Workers with Durable Objects.

## Migrations

### [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)

- Run a release in this order: `emdash migrate`, then `wrangler d1 migrations apply <db> --remote` for each app database, then `wrangler versions upload`, then `wrangler versions deploy`.
- Make each migration work with both the new version and the version that runs now. Add tables and columns first. Remove them in a later release, after no deployed version uses them.
- Do not rename or drop a column in one release. Add the new column, copy the data, switch the code, and drop the old column in a later release.

### [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)

- Run `wrangler d1 time-travel info <db>` before a risky migration, and save the bookmark.
- Restore a database with `wrangler d1 time-travel restore <db> --bookmark=<bookmark>`. The restore overwrites the database in place. Save the bookmark that the restore prints, so you can undo it.
- Restore within the retention period: 7 days on the Workers Free plan and 30 days on the Workers Paid plan.

## Rollback

### [Rollbacks](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/rollbacks/)

- Roll back code with `wrangler rollback`, or `wrangler rollback <version-id>`. You can roll back only to one of the last 100 versions.
- Do not expect a rollback to undo data. A rollback does not change D1, KV, or R2. Restore D1 data with Time Travel.
- Do not delete a KV namespace, R2 bucket, or queue that an older version still binds to. The rollback to that version is blocked. Delete it only after you no longer need to roll back to that version.

## Secrets

### [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

- Set a production secret with `wrangler versions secret put`, then deploy it with `wrangler versions deploy`. Do not use `wrangler secret put` in production: it creates a version and deploys it at once, outside the gradual deployment.
- Set a new secret before you deploy the version that reads it.

## CI

### [GitHub Actions](https://github.com/cloudflare/wrangler-action)

- Deploy from GitHub Actions with `cloudflare/wrangler-action@v4`, pinned to a commit SHA. Store the API token as the `CLOUDFLARE_API_TOKEN` secret and pass it as `apiToken`. Do not also connect the repository to Workers Builds: each push then deploys twice. Read [WHY.md](../WHY.md#why-github-actions-and-not-workers-builds).
- Create the PR preview on the `pull_request` event. Its default types `opened`, `synchronize`, and `reopened` run it on each push to the PR. Run `wrangler versions upload --env="" --preview-alias pr-${{ github.event.pull_request.number }}`.
- Do not use `pull_request_target` for previews: it runs the PR code with your secrets. PRs from forks get no secrets on `pull_request`, so they get no preview.
- Apply the PR migrations to the dev database before the upload: `wrangler d1 migrations apply <db> --remote --env=""`. Do not edit a migration after a preview applied it. D1 does not apply a migration again, so add a new migration.
- Post the preview URL as one PR comment that each push updates, for example with [`marocchino/sticky-pull-request-comment`](https://github.com/marocchino/sticky-pull-request-comment). Build the alias URL yourself: the action output `deployment-url` gives the versioned URL, not the alias URL ([wrangler-action#384](https://github.com/cloudflare/wrangler-action/issues/384)).
- Give the job that holds the Cloudflare token only `contents: read`. Post the comment from a second job with `pull-requests: write`, so no job has both.
- Set `concurrency` per PR with `cancel-in-progress: true`, for example `group: cf-preview-${{ github.event.pull_request.number }}`, so fast pushes do not race.
- Deploy dev when a PR merges: run on `pull_request` with `types: [closed]` and `if: github.event.pull_request.merged == true`. Check out `${{ github.event.pull_request.merge_commit_sha }}`, apply the migrations to the dev database, then run `wrangler deploy --env=""`.
- Set `concurrency` for the dev deploy with `cancel-in-progress: false`, so merges deploy in order and no migration stops halfway.
- Upload stage on a release tag (`push` with `tags: ["<worker>-[0-9]*"]`, for example `tags: ["mysite-[0-9]*"]`): apply the prod migrations, then run `wrangler versions upload --env production --tag ${{ github.ref_name }} --preview-alias stage`.
- Promote stage to prod from a `workflow_dispatch` workflow that uses a GitHub environment named `production` with required reviewers. Find the version by its tag, and deploy it in steps with `wrangler versions deploy <version-id>@10% <old-version-id>@90% --env production -y`. Follow the rules in Releases.

### [Previews](https://developers.cloudflare.com/workers/previews/)

- Use Previews instead of version URLs for PR previews when the Worker has Durable Objects: version URLs do not work for it. Run `wrangler preview --name pr-<number>`.
- Delete the Preview when the PR closes: `wrangler preview delete --name pr-<number> --skip-confirmation`.
- Use Wrangler 4.135.0 or later. Previews need it.
- Bind each D1 database in the `previews` block of the Wrangler config to a staging database, with the same binding name. Do not let a Preview use a production database: Previews get their own D1 only when you bind one.
- Apply the migrations to the staging databases before you create a Preview.
- Set Preview secrets with `npx wrangler preview base-config secret put <NAME>`.
- Protect Preview URLs with Cloudflare Access. They are public by default.

## Separate Workers

These rules apply when you move an app to its own Worker. Follow the rules in [ARCH.md](ARCH.md) (Apps) first.

### [Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)

- Give the app Worker its own Astro project and `wrangler.jsonc`, for example in `workers/app1/`. Use the same environments as the web Worker: dev at the top level and prod in `env.production`.
- Add the app path as a prod route of the app Worker: `"routes": [{ "pattern": "example.com/app1/*", "zone_name": "example.com" }]`. Keep `example.com/*` on the web Worker. The most specific route wins.
- Give both dev Workers a route on one dev hostname, for example `dev.example.com/*` for the web Worker and `dev.example.com/app1/*` for the app Worker. Do not keep them on `workers.dev`: each Worker gets its own host there, and the login cookie does not reach the other Worker. Add a proxied DNS record for the dev hostname.
- Test the login flow of the app on dev. Its PR previews and stage run on their own `workers.dev` host, where the login cookie of the web Worker does not exist.

### [Static assets on a path](https://developers.cloudflare.com/workers/static-assets/routing/advanced/serving-a-subdirectory/)

- Set `base: "/app1"` in the `astro.config` of the app Worker. Prefix each link and asset URL with `import.meta.env.BASE_URL`.
- Check that the build puts the static files under `app1/` in the assets directory, for example `app1/_astro/`. A Worker on `example.com/app1/*` looks up each asset with its full path, so it does not serve files from the root of the assets directory. Read [WHY.md](../WHY.md#why-separate-workers-share-one-hostname).

### [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

- Set the same `BETTER_AUTH_SECRET` in both Workers, in each environment. Bind the database that stores the Better Auth sessions in the app Worker too, so it can read the login session that the web Worker creates.
- Apply the migrations of each database from one workflow only: `migrations/app1/` from the app Worker workflow, and the EmDash migrations from the web Worker workflow.

### [GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)

- Add one workflow file per Worker for the PR preview, the dev deploy, and stage. Filter each by `paths`, for example `paths: ["workers/app1/**", "src/shared/**"]`, so a PR builds only the Workers that it changes. Include the paths of the shared code.
- Name the release tags of the app Worker with its own Worker name, for example `app1-YYYY-MM-DD-rN` for the Worker `app1`, and trigger its stage upload on `tags: ["app1-[0-9]*"]`.
- Promote and roll back each Worker on its own. Keep the contract between the Workers compatible with the previous version of the other Worker: the cookie name, the session data, and the links between them.

## Checks

### [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

- Run `astro check` before each release. Follow the rules in [QUALITY.md](QUALITY.md).
- Test the release locally with `astro build` and `astro preview`. Follow the rules in [DEV.md](DEV.md).
