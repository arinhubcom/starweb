# DEPLOY

## CLI

### [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

- Use Wrangler for deploy, rollback, secrets, and D1. Do not use the [`cf`](https://github.com/cloudflare/cf) CLI while it is in beta. Read [WHY.md](../WHY.md#why-wrangler-and-not-cf).

## Releases

### [Gradual deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/gradual-deployments/)

- Release to production in two steps: `wrangler versions upload`, then `wrangler versions deploy`. Do not use `wrangler deploy` for production: it sends all traffic to the new version at once.
- Raise the traffic share of the new version in steps, for example 10 %, 50 %, and 100 %. Check the errors and logs of the new version before each step.
- Set the `Cloudflare-Workers-Version-Key` header to keep one user on one version during a split, for example with a Transform Rule that reads the session cookie. Transform Rules need a route on your own zone, not `workers.dev`.
- Read [WHY.md](../WHY.md#why-two-step-releases) before you deploy a change to a Durable Object: only one version of each Durable Object runs at a time.

### [Version metadata](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/)

- Add the `version_metadata` binding `CF_VERSION_METADATA` to the Wrangler config. Add `env.CF_VERSION_METADATA.id` to each log line and error report, so you know which version caused an error.

### [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)

- Test a new version on its version URL before it gets traffic: `wrangler versions upload --preview-alias staging` gives `staging-<worker>.<subdomain>.workers.dev`.
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

### [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)

- Connect the Git repository to Workers Builds, and set `main` as the production branch.
- Set the deploy command to `npx wrangler versions upload`. Do not keep the default `npx wrangler deploy`: it sends all traffic to each push. Run the migrations in the deploy command before the upload.
- Keep the Preview command `npx wrangler preview` for other branches.

### [Previews](https://developers.cloudflare.com/workers/previews/)

- Use Wrangler 4.135.0 or later. Previews need it.
- Bind each D1 database in the `previews` block of the Wrangler config to a staging database, with the same binding name. Do not let a Preview use a production database: Previews get their own D1 only when you bind one.
- Apply the migrations to the staging databases before you create a Preview.
- Set Preview secrets with `npx wrangler preview base-config secret put <NAME>`.
- Protect Preview URLs with Cloudflare Access. They are public by default.

## Checks

### [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

- Run `astro check` before each release. Follow the rules in [QUALITY.md](QUALITY.md).
- Test the release locally with `wrangler dev`. Follow the rules in [DEV.md](DEV.md).
