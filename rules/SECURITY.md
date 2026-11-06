# SECURITY

## Secrets

### [Workers](STACK.md#workers)

- No secrets in code or `wrangler.jsonc`. Local: `.env`; no `.dev.vars` (Wrangler then ignores `.env`). Production: `wrangler versions secret put` → [DEPLOY](DEPLOY.md) (Secrets).

## Headers

### [Astro](STACK.md#astro) CSP

- Extra sources: `csp.directives`, `csp.scriptDirective`, `csp.styleDirective`, or per page `Astro.csp.insertDirective()`, `insertScriptResource()`, `insertStyleResource()`.
- All CSP sources live in `src/lib/security/csp.ts`; no CSP value anywhere else. Each feature (Turnstile, Web Analytics, Sentry) adds its sources there. `frameAncestors` is `'self'` where the site embeds its own pages.
- One entry per directive in `directives`, all sources in it. Keep `'self'` in `connect-src` and in `scriptDirective.resources` (Astro replaces its defaults with this list).
- Output: HTTP header on on-demand pages, `<meta http-equiv="content-security-policy">` on prerendered pages.
- Test with `astro build` + `astro preview` (no CSP in `astro dev`). Check the header with `curl -I`, the `<meta>` with `curl`. Prove enforcement with a `securitypolicyviolation` listener; the console may not show violations.

### [Workers](STACK.md#workers) headers

- `public/_headers` covers static assets, not Worker responses. Limits: 100 rules, 2,000 characters per line.

### [MDN](STACK.md#mdn) HTTP headers

- `Strict-Transport-Security`: `preload` only after [HSTS preload list](https://hstspreload.org/) submission.
- `Permissions-Policy`: allow a feature only for the needing origin (`geolocation=(self)`).
- `frame-ancestors` (CSP), not `X-Frame-Options` alone.

## CSRF

### Astro security

- No reliance on `security.checkOrigin`: EmDash sets it `false`, user config cannot enable it. EmDash checks `Origin` only under `/_emdash/`.
- JSON required for mutating API calls → [API](API.md) (Security).

## Input

### [Zod](STACK.md#zod)

- Validate all input at the boundary first: bodies, query, headers, path params, form data, webhook payloads, data read from KV, a Queue, or an external API → [ARCH](ARCH.md) (Zod), [API](API.md) (Routes).
- `maxLength` on strings, limits on arrays and numbers; `z.strictObject()` for bodies → [API](API.md) (Parameters and properties).
- Revalidate on the server in every Astro Action; never trust the island → [UI-UX](UI-UX.md) (Forms).

## XSS

### Astro templates

- Print user data with `{value}` (escaped).
- `set:html` only for trusted or sanitized HTML; `set:text` or `{value}` for plain text.
- No HTML strings from user data; pass data to a component.
- Keep `security.csp` on → Headers.

## SQL

### [Kysely](STACK.md#kysely)

- No `sql.raw()`, `sql.lit()`, `sql.id()`, `sql.ref()`, `sql.table()` with user input (unchecked, unescaped). Pick column or table from a fixed list in code, validate with `z.enum()`.
- No SQL strings joined with user data.

## Redirects

### [OWASP Cheat Sheets](STACK.md#owasp-cheat-sheets) Unvalidated Redirects and Forwards

- `redirect` or return URL parameter: own-origin path only. Value starts with `/`, not `//` or `/\`, and `new URL(value, origin).origin === origin`. Else redirect to a fixed default (`/`). Redirect to the parsed `pathname` + `search`, not the raw value.
- No external redirect from user input. External targets: server-side map from fixed key to URL, or parsed scheme/host/port against an explicit allow list.

## Auth

### [EmDash](STACK.md#emdash) authentication

- Check `locals.user` and role at the start of every non-public page, Action, and API route → [AUTH](AUTH.md) (Users), [API](API.md) (Auth).
- Filter every query by `tenant_id` → [SAAS](SAAS.md) (Data).
- After each production deploy: `GET /_emdash/api/auth/dev-bypass` and `GET /_emdash/api/setup/dev-bypass` return `403` and set no session cookie (allowed only when `import.meta.env.DEV`). Local login only → [ARCH](ARCH.md). No dev server against production data.

## Abuse

### Rate Limiting binding

- Rate-limit sign-in, sign-up, password reset, and form routes → [API](API.md) (Limits). EmDash Forms → [CMS](CMS.md#emdash-forms).

### [Turnstile](STACK.md#turnstile)

- On each public form that sends email or creates data (contact, sign-up). Load `https://challenges.cloudflare.com/turnstile/v0/api.js` from that URL; no proxy, no cache; only on pages with a protected form, not the base layout.
- `<div class="cf-turnstile" data-sitekey="...">` inside `<form>` (adds `cf-turnstile-response`).
- Server: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` with `secret` + `response`; reject on `success: false`. Widget alone is not trust.
- One verification per token, within 5 minutes (`timeout-or-duplicate`).
- Secret key = Worker secret, never client code → [DEPLOY](DEPLOY.md) (Secrets). [EmDash Forms](STACK.md#emdash-forms) reads only its encrypted plugin setting → [CMS](CMS.md#emdash-forms).

### OWASP SSRF

- Fetch of user-given URLs (webhook targets, remote images): `new URL()`, `protocol === "https:"`, no userinfo, `hostname` exact case-sensitive match against an allow list. No deny list, no prefix/suffix match.
- `redirect: "error"` on that `fetch` (default `follow` goes to any host).
- Allow list in code or config, never from user input.

### [WAF](STACK.md#waf)

- Rate limiting rules (dashboard or IaC) for targeted routes such as `/_emdash/admin/login`.

## Dependencies

- Audits and updates → [DEPS](DEPS.md).

## Disclosure

### [security.txt](STACK.md#securitytxt)

- Served as `text/plain; charset=utf-8` over HTTPS. Deploy at least once in 364 days, or the file expires.
- `Policy` when a disclosure policy exists.
