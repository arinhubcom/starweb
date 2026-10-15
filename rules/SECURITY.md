# SECURITY

## Secrets

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

- Keep secrets out of code and `wrangler.jsonc`. Use the `.env` file for local dev. Do not add a `.dev.vars` file: when it exists, Wrangler ignores `.env`. For production, set secrets with `wrangler versions secret put`: follow the rules in [DEPLOY.md](DEPLOY.md) (Secrets).

## Headers

### [Astro Content Security Policy](https://docs.astro.build/en/reference/configuration-reference/#securitycsp)

- Set `security: { csp: true }` in `astro.config`. It is a stable option since Astro 6, not an experimental flag. Add other sources with `csp.directives`, `csp.scriptDirective`, and `csp.styleDirective`, or per page with `Astro.csp.insertDirective()`, `insertScriptResource()`, and `insertStyleResource()`.
- Define all CSP sources in one module, `src/lib/security/csp.ts`. Export `scriptDirective` (`resources` and `hashes`), `directives`, and `frameAncestors` (`"frame-ancestors 'none'"`, or `'self'` where the site embeds its own pages) from it, and pass them to `security.csp` in `astro.config`. Each feature (Turnstile, Web Analytics, Sentry) adds its sources to this module, and the theme script adds its hash to `scriptDirective.hashes` (see [COMPONENTS.md](COMPONENTS.md) (Astro components)). Do not add a CSP value in any other file.
- Add `frameAncestors` to `directives`. Astro sends it in the header of on-demand pages. Browsers ignore `frame-ancestors` in a `<meta>` element, so prerendered pages get it from `public/_headers` (see Workers headers).
- Write each directive once in `directives`, for example one `connect-src` entry that lists all sources, such as `"connect-src 'self' https://example.com"`. Always keep `'self'` in `connect-src`: without it the browser blocks the same-origin `fetch` calls of islands. Keep `'self'` in `scriptDirective.resources` too: Astro replaces its default sources with this list.
- Expect the policy in an HTTP header on on-demand pages and in a `<meta http-equiv="content-security-policy">` element on prerendered pages.
- Test the policy with `astro build` and `astro preview`. CSP does not work in `astro dev`. Check the header of an on-demand page with `curl -I`, and the `<meta>` element of a prerendered page with `curl`. Prove that the browser enforces the policy with a `securitypolicyviolation` event listener: the browser console may not show violations.

### [Workers headers](https://developers.cloudflare.com/workers/static-assets/headers/)

- Set the security headers for pages and API routes that the Worker renders in the app middleware, except `Content-Security-Policy`. Do not set `Content-Security-Policy` in the middleware: `set` replaces the policy that Astro sends, and the page loses its `script-src`. Copy the response before you change it: `const original = await next(); const response = new Response(original.body, original)`, then `response.headers.set(name, value)`. Return the copy.
- Set the same headers for prerendered pages and other static assets in `public/_headers`, and add `Content-Security-Policy: frame-ancestors 'none'` there. The file applies only to static asset responses, not to responses from Worker code. Keep it to 100 rules and 2,000 characters per line.
- Define the header values once, in one module, for example `src/lib/security/headers.ts` (without `Content-Security-Policy`). Use it in the middleware. Do not copy the values by hand.
- Write `public/_headers` with `scripts/write-headers.ts`: import `securityHeaders` from `headers.ts` and `frameAncestors` from the CSP module, and write the file with `writeFileSync`. A static file cannot import a module. Install `tsx` (`npm i -D tsx`), and run the script before the build: `"build": "tsx scripts/write-headers.ts && astro build"`. Do not edit `_headers` by hand.

### [HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers)

- Set `Strict-Transport-Security: max-age=31536000; includeSubDomains` on HTTPS responses. Add `preload` only after you submit the domain to the [HSTS preload list](https://hstspreload.org/). Browsers ignore the header on HTTP.
- Set `X-Content-Type-Options: nosniff` on all responses.
- Set `Referrer-Policy: strict-origin-when-cross-origin` on all responses.
- Set `Permissions-Policy` with an empty allowlist for each feature that the site does not use, for example `camera=(), microphone=(), geolocation=()`. Allow a feature only for the origin that needs it, for example `geolocation=(self)`.
- Send `frame-ancestors 'none'` on all responses, or `'self'` where the site embeds its own pages: in `csp.directives` for on-demand pages, and in `public/_headers` for prerendered pages (see Headers). Do not use `X-Frame-Options` alone.

## CSRF

### [Astro security](https://docs.astro.build/en/reference/configuration-reference/#securitycheckorigin)

- Do not rely on `security.checkOrigin`. The EmDash integration sets it to `false`, and the user config cannot turn it on. EmDash checks the `Origin` header itself only on its own routes under `/_emdash/`.
- Check the origin in the app middleware (`src/middleware.ts`). For a `POST`, `PUT`, `PATCH`, or `DELETE` request, return `403` when an `Origin` header is present and is not equal to `context.url.origin`. This includes `Origin: null`. Allow a request without `Origin`: it does not come from a cross-site browser page.
- Apply the check to every route outside `/_emdash/`: API routes, Astro Actions (`/_actions/...`), and form posts. Skip `/_emdash/`: EmDash checks those routes, and its OAuth endpoints are cross-origin by design.
- Require JSON for mutating API calls. Follow the rules in [API.md](API.md) (Security).

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

## Redirects

### [OWASP Unvalidated Redirects and Forwards](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)

- Accept a `redirect` or return URL parameter only as a path on your own origin. Accept the value only when it starts with `/` and not with `//` or `/\`, and when `new URL(value, origin).origin` equals your origin. Otherwise redirect to a fixed default, for example `/`. Redirect to the parsed `pathname` and `search`, not to the raw value.
- Do not redirect to an external URL from user input. When you need external destinations, map a fixed key to the URL on the server, or compare the parsed scheme, host, and port with an explicit allow list.

## Auth

### [EmDash authentication](https://docs.emdashcms.com/guides/authentication/)

- Check `locals.user` and its role at the start of every page, Astro Action, and API route that is not public. Follow the rules in [AUTH.md](AUTH.md) (Users) and [API.md](API.md) (Auth).
- Filter every query by `tenant_id`. Follow the rules in [SAAS.md](SAAS.md) (Data).
- Check after each production deploy that `GET /_emdash/api/auth/dev-bypass` and `GET /_emdash/api/setup/dev-bypass` return status `403` and set no session cookie. EmDash allows these routes only when `import.meta.env.DEV` is true, so they must work only in `astro dev`. Use them only for local login (see [ARCH.md](ARCH.md)). Do not run a dev server against production data.

## Abuse

### [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

- Limit requests to sign-in, sign-up, password reset, and form routes with the Rate Limiting binding. Follow the rules in [API.md](API.md) (Limits).

### [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)

- Add Turnstile to each public form that sends email or creates data, for example contact and sign-up. Load `https://challenges.cloudflare.com/turnstile/v0/api.js` from that URL. Do not proxy or cache it.
- Allow Turnstile in the CSP: in the CSP module (see Headers), add `https://challenges.cloudflare.com` to `scriptDirective.resources` and to the single `frame-src` entry of `directives`. Keep `'self'` in `scriptDirective.resources` and in `connect-src`.
- Load the Turnstile script only on pages that have a protected form. Do not add it to the base layout. Name Cloudflare Turnstile and its purpose (bot protection) in the privacy policy, as in [PRIVACY.md](PRIVACY.md) (Cookies).
- Add `<div class="cf-turnstile" data-sitekey="...">` inside the `<form>`. The widget adds the `cf-turnstile-response` field to the submit.
- Verify the token on the server with a `POST` to `https://challenges.cloudflare.com/turnstile/v0/siteverify`, with `secret` and `response`. Reject the request when `success` is `false`. Do not trust the widget alone.
- Verify each token once, within 5 minutes. A used or expired token fails with `timeout-or-duplicate`.
- Store the Turnstile secret key as a Worker secret. Do not put it in client code. For production, follow the rules in [DEPLOY.md](DEPLOY.md) (Secrets).

### [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)

- Fetch a URL from user input (for example webhook targets and remote images) only after you validate it: parse it with `new URL()`, require `protocol === "https:"`, reject userinfo, and compare `hostname` with a host allow list by exact, case-sensitive match. Do not use a deny list or a prefix or suffix match.
- Set `redirect: "error"` on the `fetch` call to a user-given URL, so that the Worker does not follow a redirect to a host outside the allow list. With the default `follow`, `fetch` follows redirects to any host.
- Store the allow list in code or config. Do not read it from user input.

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
