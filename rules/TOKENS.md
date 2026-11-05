# TOKENS

Where each token belongs. → [DEPLOY](DEPLOY.md) (Secrets, CI), [AUTH](AUTH.md), [PAYMENTS](PAYMENTS.md), [OBSERVABILITY](OBSERVABILITY.md), [SETUP](SETUP.md) (steps 28, 31, 32, 37).

## Tokens

### Token table

| Name | Read by | Lives in | Set with | Every project |
| --- | --- | --- | --- | --- |
| `BETTER_AUTH_SECRET` | Worker | Worker secret; locally `.env` | `set-secrets` (Worker) | Yes |
| `EMDASH_ENCRYPTION_KEY` | Worker | Worker secret; locally `.env`; password manager backup (→ [SETUP](SETUP.md) step 28) | `set-secrets` (Worker) | Yes |
| `CLOUDFLARE_API_TOKEN` | GitHub Actions (`wrangler-action`) | Two tokens, each a secret of a GitHub environment: `dev` (PR previews, dev deploy) and `production` (stage, promotion) | `set-secrets dev`, `set-secrets production` | Yes |
| `PAGESPEED_API_KEY` | `perf.yml` | Secret of the GitHub environment `production` | `set-secrets production` | Only with production checks (→ [SETUP](SETUP.md) step 37) |
| `CLOUDFLARE_OBSERVABILITY_TOKEN` | `perf.yml` | Secret of the GitHub environment `production` | `set-secrets production` | Only with production checks (→ [SETUP](SETUP.md) step 37) |
| `SENTRY_AUTH_TOKEN` | Build (source map upload) | Secret of each GitHub environment that builds; locally `.env.sentry-build-plugin` | `set-secrets` (GitHub) | Only with [Sentry](STACK.md#sentry) |
| `SENTRY_DSN` | Worker | Worker secret or var | `set-secrets` (Worker) | Only with Sentry |
| `STRIPE_SECRET_KEY` | Worker | Worker secret | `set-secrets` (Worker) | Only with [Stripe](STACK.md#stripe) |
| `STRIPE_WEBHOOK_SECRET` | Worker | Worker secret | `set-secrets` (Worker) | Only with Stripe |

## Rules

### [GitHub CLI](STACK.md#github-cli) and [Wrangler](STACK.md#wrangler) script

- A password manager is the source of truth. Which one is your choice. `<source> | pnpm run set-secrets <dev|production>` sends the values. → [WHY](../WHY.md#why-a-secrets-script-reads-stdin)
- `scripts/set-secrets.ts` reads `KEY=VALUE` lines from stdin; `--dry-run` lists names and destinations and sends nothing. It is not in `pnpm run check`.
- `pnpm run set-secrets` needs `gh auth login` and `wrangler login` first.
- Worker secrets go in one `wrangler versions secret bulk` call (`--env=` for dev, `--env=production`). It creates a version and does not deploy it; `wrangler versions deploy` releases it. → [DEPLOY](DEPLOY.md) (Secrets)
- `set-secrets` needs an uploaded version for Worker secrets, or Cloudflare fails with error 10222. No version yet → `wrangler versions upload --secrets-file <file>` for the first one. → [DEPLOY](DEPLOY.md) (Secrets)
- Environment secrets: `gh secret set NAME --env <dev|production>` with the value on stdin. Create the environments first (→ [SETUP](SETUP.md) step 31).
- All tokens that CI reads live in GitHub environments; no repository secrets. Production checks (→ [GITHUB](GITHUB.md)): `set-secrets production` only; `set-secrets dev` refuses them.
- No Cloudflare Secrets Store for these tokens. → [WHY](../WHY.md#why-no-secrets-store-for-setup-tokens)
- A new secret goes in `SECRETS` in `scripts/lib/secrets.ts` and in the table above.
