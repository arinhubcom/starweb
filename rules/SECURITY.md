# SECURITY

## Secrets

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

- Keep secrets out of code and `wrangler.jsonc`. Use `wrangler secret put`, and the `.env` file for local dev. Do not add a `.dev.vars` file: when it exists, Wrangler ignores `.env`. For production releases, follow the rules in [DEPLOY.md](DEPLOY.md) (Secrets).
