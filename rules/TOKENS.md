# TOKENS

This file covers where each token belongs and how to send it. Read it before you add, rotate, or set a token. See also [DEPLOY](DEPLOY.md#set-secrets), [DEPLOY](DEPLOY.md#set-up-ci), [AUTH](AUTH.md), [PAYMENTS](PAYMENTS.md), [OBSERVABILITY](OBSERVABILITY.md), and [SETUP](SETUP.md) steps 28, 31, 32, and 37.

## Find where a token belongs

| Name | Read by | Lives in | Set with | Every project |
| --- | --- | --- | --- | --- |
| `BETTER_AUTH_SECRET` | Worker | Worker secret; locally `.env` | `set-secrets` (Worker) | Yes |
| `EMDASH_ENCRYPTION_KEY` | Worker | Worker secret; locally `.env`; password manager backup (see [SETUP](SETUP.md) step 28) | `set-secrets` (Worker) | Yes |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions (`wrangler-action`) | Two tokens, each a secret of a GitHub environment: `dev` (PR previews, dev deploy) and `production` (stage, promotion) | `set-secrets dev`, `set-secrets production` | Yes |
| `PAGESPEED_API_KEY` | `perf.yml` | Secret of the GitHub environment `production` | `set-secrets production` | Only with production checks (see [SETUP](SETUP.md) step 37) |
| `CLOUDFLARE_OBSERVABILITY_TOKEN` | `perf.yml` | Secret of the GitHub environment `production` | `set-secrets production` | Only with production checks (see [SETUP](SETUP.md) step 37) |
| `SENTRY_AUTH_TOKEN` | Build (source map upload) | Secret of each GitHub environment that builds; locally `.env.sentry-build-plugin` | `set-secrets` (GitHub) | Only with [Sentry](STACK.md#sentry) |
| `SENTRY_DSN` | Worker | Worker secret or var | `set-secrets` (Worker) | Only with Sentry |
| `STRIPE_SECRET_KEY` | Worker | Worker secret | `set-secrets` (Worker) | Only with [Stripe](STACK.md#stripe) |
| `STRIPE_WEBHOOK_SECRET` | Worker | Worker secret | `set-secrets` (Worker) | Only with Stripe |

## Send secrets

- Use a password manager as the source of truth. Which one is your choice.
- Send the values with `<source> | pnpm run set-secrets <dev|production>`. See [WHY](../WHY.md#why-a-secrets-script-reads-stdin).
- Run `gh auth login` and `wrangler login` before `pnpm run set-secrets`.
- Use [GitHub CLI](STACK.md#github-cli) and [Wrangler](STACK.md#wrangler) through `scripts/set-secrets.ts`.
- The Worker command creates a version and does not deploy it. `wrangler versions deploy` releases it. See [DEPLOY](DEPLOY.md#set-secrets).
- If the Worker has no uploaded version, Cloudflare fails with error 10222. Create the first version with `wrangler versions upload --secrets-file <file>`. See [DEPLOY](DEPLOY.md#set-secrets).
- Create the GitHub environments before you send environment secrets. See [SETUP](SETUP.md) step 31.

## Store a token

- Keep all tokens that CI reads in GitHub environments. Use no repository secrets.
- Send the production check tokens with `set-secrets production` only. See [GITHUB](GITHUB.md).
- Do not use Cloudflare Secrets Store for these tokens. See [WHY](../WHY.md#why-no-secrets-store-for-setup-tokens).

## Add a new secret

- Add the name to `SECRETS` in `scripts/lib/secrets.ts`.
- Add the name to the table above.
