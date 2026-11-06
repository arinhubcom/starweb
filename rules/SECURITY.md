# SECURITY

This file covers secrets, headers, input handling, and abuse protection. Read it before you add a route, a form, a redirect, or a header.

## Keep secrets out of code

- Put no secrets in code or in `wrangler.jsonc`.
- Locally, keep secrets in `.env`. Do not create `.dev.vars`: Wrangler then ignores `.env`.
- In production, set secrets with `wrangler versions secret put` on [Workers](STACK.md#workers). See [DEPLOY](DEPLOY.md#set-secrets).

## Set the security headers

### Change the CSP

- Keep all CSP sources in `src/lib/security/csp.ts`. Put no CSP value anywhere else.
- Each feature (Turnstile, Web Analytics, Sentry) adds its sources to that file.
- For extra sources, use `csp.directives`, `csp.scriptDirective`, or `csp.styleDirective` in the [Astro](STACK.md#astro) config.
- For one page, use `Astro.csp.insertDirective()`, `insertScriptResource()`, or `insertStyleResource()`.
- Where the site embeds its own pages, set `frameAncestors` to `'self'`.
- Astro writes an HTTP header on on-demand pages and a `<meta http-equiv="content-security-policy">` tag on prerendered pages.
- Test the CSP with `astro build` and `astro preview`. There is no CSP in `astro dev`.
- Check the header with `curl -I`. Check the `<meta>` tag with `curl`.
- Prove enforcement with a `securitypolicyviolation` listener. The console may not show violations.

### Set other headers

- `public/_headers` covers static assets, not Worker responses.
- For header values, follow the [MDN](STACK.md#mdn) HTTP headers reference.

## Protect against CSRF

- Do not rely on `security.checkOrigin` in Astro. EmDash sets it to `false`, and user config cannot enable it.
- EmDash checks `Origin` only under `/_emdash/`.
- Require JSON for mutating API calls. See [API](API.md#apply-astro-security-rules).

## Validate input

- Validate all input at the boundary first with [Zod](STACK.md#zod).
- Validate bodies, query, headers, path params, form data, and webhook payloads.
- Also validate data that you read from KV, a Queue, or an external API.
- For validation in the app, see [ARCH](ARCH.md#use-zod) and [API](API.md#add-a-route).
- Set `maxLength` on strings, and limits on arrays and numbers.
- Use `z.strictObject()` for bodies. See [API](API.md#name-parameters-and-properties).
- Revalidate on the server in every Astro Action. Never trust the island. See [UI-UX](UI-UX.md#handle-input-and-errors).

## Prevent XSS

- Print user data with `{value}`. It is escaped.
- Use `set:html` only for trusted or sanitized HTML.
- For plain text, use `set:text` or `{value}`.
- Do not build HTML strings from user data. Pass the data to a component.
- Keep `security.csp` on. See [Set the security headers](#set-the-security-headers).

## Write SQL

- Use [Kysely](STACK.md#kysely). Never pass user input to `sql.raw()`, `sql.lit()`, `sql.id()`, `sql.ref()`, or `sql.table()`. They do not check or escape it.
- To pick a column or table, use a fixed list in code and validate the input with `z.enum()`.
- Do not join SQL strings with user data.

## Handle redirects

- Accept only an own-origin path in a `redirect` or return URL parameter.
- For redirects, follow the [OWASP Cheat Sheets](STACK.md#owasp-cheat-sheets) Unvalidated Redirects and Forwards sheet.
- The value must start with `/`, not `//` or `/\`.
- The value must satisfy `new URL(value, origin).origin === origin`.
- If the check fails, redirect to the fixed default `/`.
- Redirect to the parsed `pathname` and `search`, not to the raw value.
- Do not redirect to an external target from user input.
- For external targets, use a server-side map from a fixed key to a URL.
- Or parse the scheme, host, and port, and compare them against an explicit allow list.

## Check auth

- At the start of every non-public page, Action, and API route, check `locals.user` and the role. See [AUTH](AUTH.md#protect-a-page-or-route) and [API](API.md#protect-a-route).
- Filter every query by `tenant_id`. See [SAAS](SAAS.md#separate-tenants).
- After each production deploy, send `GET /_emdash/api/auth/dev-bypass` and `GET /_emdash/api/setup/dev-bypass`.
- Both must return `403` and set no session cookie. They are allowed only when `import.meta.env.DEV` is true.
- Use local login only. See [ARCH](ARCH.md).
- Do not run a dev server against production data.

## Protect against abuse

### Limit the rate

- Rate-limit sign-in, sign-up, password reset, and form routes. See [API](API.md#limit-requests).
- For EmDash Forms, see [CMS](CMS.md#add-emdash-forms).
- In the [WAF](STACK.md#waf), add rate limiting rules (dashboard or IaC) for targeted routes such as `/_emdash/admin/login`.

### Add Turnstile

- Add [Turnstile](STACK.md#turnstile) to each public form that sends email or creates data (contact, sign-up).
- Load `https://challenges.cloudflare.com/turnstile/v0/api.js` from that URL. Use no proxy and no cache.
- Load the script only on pages with a protected form, not in the base layout.
- Put `<div class="cf-turnstile" data-sitekey="...">` inside the `<form>`. It adds `cf-turnstile-response`.
- On the server, send `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret` and `response`.
- Reject the request on `success: false`. The widget alone is not trust.
- Verify each token once, within 5 minutes. Otherwise the result is `timeout-or-duplicate`.
- Keep the secret key as a Worker secret, never in client code. See [DEPLOY](DEPLOY.md#set-secrets).
- [EmDash Forms](STACK.md#emdash-forms) reads only its encrypted plugin setting. See [CMS](CMS.md#add-emdash-forms).

### Fetch user-given URLs

- This covers webhook targets and remote images. Follow the OWASP SSRF guidance.
- Parse the URL with `new URL()`. Require `protocol === "https:"` and no userinfo.
- Match `hostname` exactly, with case, against an allow list.
- Use no deny list and no prefix or suffix match.
- Set `redirect: "error"` on that `fetch`. The default `follow` goes to any host.
- Keep the allow list in code or config, never from user input.

## Update dependencies

- For audits and updates, see [DEPS](DEPS.md).

## Publish a disclosure contact

- Serve [security.txt](STACK.md#securitytxt) as `text/plain; charset=utf-8` over HTTPS.
- Add `Policy` when a disclosure policy exists.
