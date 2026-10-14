# SECURITY

## Secrets

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

- Keep secrets out of code and `wrangler.jsonc`. Use `wrangler secret put`, and the `.env` file for local dev. Do not add a `.dev.vars` file: when it exists, Wrangler ignores `.env`. For production releases, follow the rules in [DEPLOY.md](DEPLOY.md) (Secrets).

## Headers

### [Astro Content Security Policy](https://docs.astro.build/en/reference/configuration-reference/#securitycsp)

- Set `security: { csp: true }` in `astro.config`. It is a stable option since Astro 6, not an experimental flag. Add other sources with `csp.directives`, `csp.scriptDirective`, and `csp.styleDirective`, or per page with `Astro.csp.insertDirective()`, `insertScriptResource()`, and `insertStyleResource()`.
- Test the policy with `astro build` and `astro preview`. CSP does not work in `astro dev`.
- Do not expect an HTTP header from `security.csp`. Astro writes the policy as a `<meta http-equiv="content-security-policy">` element. Send `frame-ancestors` as a header (see Workers headers below): browsers ignore it in a `<meta>` element.

### [Workers headers](https://developers.cloudflare.com/workers/static-assets/headers/)

- Set the security headers for pages and API routes that the Worker renders in the app middleware. Copy the response before you change it: `const original = await next(); const response = new Response(original.body, original)`, then `response.headers.set(name, value)`. Return the copy.
- Set the same headers for prerendered pages and other static assets in `public/_headers`. The file applies only to static asset responses, not to responses from Worker code. Keep it to 100 rules and 2,000 characters per line.
- Define the header values once, in one module, for example `src/lib/security/headers.ts`. Use it in the middleware and when you write `_headers`. Do not copy the values by hand.

### [HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers)

- Set `Strict-Transport-Security: max-age=31536000; includeSubDomains` on HTTPS responses. Add `preload` only after you submit the domain to the [HSTS preload list](https://hstspreload.org/). Browsers ignore the header on HTTP.
- Set `X-Content-Type-Options: nosniff` on all responses.
- Set `Referrer-Policy: strict-origin-when-cross-origin` on all responses.
- Set `Permissions-Policy` with an empty allowlist for each feature that the site does not use, for example `camera=(), microphone=(), geolocation=()`. Allow a feature only for the origin that needs it, for example `geolocation=(self)`.
- Set `Content-Security-Policy: frame-ancestors 'none'` on all responses, or `'self'` where the site embeds its own pages. Do not use `X-Frame-Options` alone.

## CSRF

### [Astro security](https://docs.astro.build/en/reference/configuration-reference/#securitycheckorigin)

- Keep `security.checkOrigin` on and require JSON for mutating API calls. Follow the rules in [API.md](API.md) (Security).

## Input

### [Zod](https://zod.dev)

- Validate all input at the boundary with a Zod schema before any other work: request bodies, query strings, headers, path parameters, form data, webhook payloads, and data that you read from KV, a Queue, or an external API. Follow the rules in [ARCH.md](ARCH.md) (Zod) and [API.md](API.md) (Routes).
- Set `maxLength` on strings and limits on arrays and numbers. Use `z.strictObject()` for request bodies, as in [API.md](API.md) (Parameters and properties).
- Validate again on the server in every Astro Action. Do not trust the validation in an island. Follow the rules in [UI-UX.md](UI-UX.md) (Forms).

## XSS

### [Astro templates](https://docs.astro.build/en/reference/directives-reference/#sethtml)

- Print user data with `{value}` in `.astro` files. Astro escapes template expressions.
- Use `set:html` only with HTML from a trusted source or HTML that you sanitize first. It does not escape its value. Use `set:text` or `{value}` for plain text.
- Do not build HTML strings from user data. Pass the data to a component.
- Keep `security.csp` on, so that the browser blocks an injected script. Follow the rules in Headers.

## SQL

### [Kysely](https://kysely-org.github.io/kysely-apidoc/interfaces/Sql.html)

- Pass user values to the query builder methods, for example `.where("id", "=", id)`, or as `${value}` substitutions in the `sql` template tag. Kysely sends them to the database as parameters.
- Do not pass user input to `sql.raw()`, `sql.lit()`, `sql.id()`, `sql.ref()`, or `sql.table()`. Kysely does not check or escape it. Pick the column or table from a fixed list of names in code, and validate the input against that list with `z.enum()`.
- Do not build a SQL string by joining text with user data.

## Auth

### [EmDash authentication](https://docs.emdashcms.com/guides/authentication/)

- Check `locals.user` and its role at the start of every page, Astro Action, and API route that is not public. Follow the rules in [AUTH.md](AUTH.md) (Users) and [API.md](API.md) (Auth).
- Filter every query by `tenant_id`. Follow the rules in [SAAS.md](SAAS.md) (Data).

## Abuse

### [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

- Limit requests to sign-in, sign-up, password reset, and form routes with the Rate Limiting binding. Follow the rules in [API.md](API.md) (Limits).

### [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)

- Add Turnstile to each public form that sends email or creates data, for example contact and sign-up. Load `https://challenges.cloudflare.com/turnstile/v0/api.js` from that URL. Do not proxy or cache it.
- Allow Turnstile in the CSP: add `https://challenges.cloudflare.com` to `csp.scriptDirective.resources` (keep `'self'` in the list) and `"frame-src https://challenges.cloudflare.com"` to `csp.directives`. Follow the rules in Headers.
- Add `<div class="cf-turnstile" data-sitekey="...">` inside the `<form>`. The widget adds the `cf-turnstile-response` field to the submit.
- Verify the token on the server with a `POST` to `https://challenges.cloudflare.com/turnstile/v0/siteverify`, with `secret` and `response`. Reject the request when `success` is `false`. Do not trust the widget alone.
- Verify each token once, within 5 minutes. A used or expired token fails with `timeout-or-duplicate`.
- Store the Turnstile secret key as a Worker secret. Do not put it in client code. For production, follow the rules in [DEPLOY.md](DEPLOY.md) (Secrets).

### [Cloudflare WAF](https://developers.cloudflare.com/waf/)

- Add [rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/) in the Cloudflare dashboard or in IaC for routes that attackers target, such as `/_emdash/admin/login`.

## Dependencies

### [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit)

- Follow the rules in [DEPS.md](DEPS.md) for dependency audits and updates.

## Disclosure

### [security.txt](https://www.rfc-editor.org/rfc/rfc9116)

- Serve `/.well-known/security.txt` over HTTPS as `text/plain; charset=utf-8`. Add it as `public/.well-known/security.txt`.
- Set the `Contact` field (a `mailto:` or `https:` URI) and one `Expires` field. Set `Expires` less than one year ahead, and renew it before it passes.
- Add `Canonical` with the full URL of the file. Add `Policy` when you publish a disclosure policy.
