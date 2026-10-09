# Tech Stack Rules

## Language

### TypeScript

- Use TypeScript in strict mode. Extend `astro/tsconfigs/strict` (or `strictest`) in `tsconfig.json`.

### [Effect](https://effect.website)

- Use Effect for typed errors, async code, and dependency injection. Do not use Effect Schema.

### [Zod](https://zod.dev)

- Compile schemas at build time with [zod-compiler](https://github.com/gajus/zod-compiler) (Vite plugin in `astro.config`). Do not use `z.compile()`: it uses `new Function()`, which Cloudflare Workers do not allow.
- Use Zod for all schemas and validation. In Effect code, use the `decode` helper to turn Zod results into typed errors.

## Backend

### Cloudflare Workers

- Keep CPU time per request below 10 ms. Do heavy work at build time, not per request.
- Set `Cache-Control` on every SSR response that can be shared. Use `private` or `no-store` for per-user responses.
- Use bindings (KV, D1, R2) from the `env` object. Do not call Cloudflare services over public HTTP when a binding exists.
- Keep secrets out of code and `wrangler.jsonc`. Use `wrangler secret put`, and `.dev.vars` for local dev.
- Do not keep request state in global variables. An isolate serves many requests.
- Use `ctx.waitUntil()` for work after the response, such as logs or analytics.
- Use Web APIs (`fetch`, `Request`, `Response`, Web Crypto). Use Node.js APIs only with the `nodejs_compat` flag.
- Generate binding types with `wrangler types`. Do not write them by hand.
- Test locally with `wrangler dev` before you deploy.

## Frontend
