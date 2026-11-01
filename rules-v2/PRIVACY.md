# PRIVACY

Technical rules, not legal advice. → [SAAS](SAAS.md), [AUTH](AUTH.md) (users, tenants), [OBSERVABILITY](OBSERVABILITY.md) (logs, errors), [SECURITY](SECURITY.md).

## Analytics

### [Web Analytics](STACK.md#web-analytics)

- Only analytics tool by default.
- Proxied site: automatic setup (add site, select hostname). Not proxied (`workers.dev`): manual JS snippet before `</body>` in the base layout in `src/layouts/`.
- Automatic setup: no `Cache-Control: public, no-transform` on pages (blocks injection) → drop `no-transform` or use the snippet.
- Choose "Enable with JS Snippet installation", not "Enable, excluding EU visitor data" (unless EU data is unwanted).
- `"spa": false` in `data-cf-beacon` only to stop tracking SPA route changes (default on).
- CSP (`security.csp`): `https://static.cloudflareinsights.com/beacon.min.js` in `scriptDirective.resources` (include the script's query string if any). Manual snippet: add `cloudflareinsights.com` to the single `connect-src` entry. Keep `'self'` in `connect-src` for both. → [SECURITY](SECURITY.md) (Headers)
- No personal data in URLs or query strings.
- No other analytics or tracker (Google Analytics, session recorder) before a consent banner exists. → Cookies

## Cookies

### [GDPR and ePrivacy](STACK.md#gdpr-and-eprivacy): [ePrivacy Directive Article 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02002L0058-20091219)

- Consent before storing or reading anything on the device, unless strictly needed (transmission only, or a service the user explicitly requested).
- No non-essential cookie, third-party script, pixel, font, embed, or tracker before consent. Maps and videos load only after a click.
- [Turnstile](STACK.md#turnstile) (→ [SECURITY](SECURITY.md) (Abuse)) is the only third-party script allowed without a banner: load it only on pages with a protected form, not before the user opens one. Basis: [Turnstile Privacy Addendum](https://www.cloudflare.com/turnstile-privacy-policy/) (strictly necessary bot detection, Cloudflare is processor). Name Turnstile in the privacy policy. Have a data protection adviser confirm: the EDPB guidelines do not analyze the exemptions.
- Withdrawing consent as easy as giving it ([GDPR Article 7(3)](https://gdpr-info.eu/art-7-gdpr/)): footer link reopening the consent choice.
- List each cookie and `localStorage` key (purpose, lifetime) in one place on the privacy policy page.

### [EDPB Guidelines 2/2023 on Article 5(3)](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en)

- Check Article 5(3) for every device read/store technique, not only cookies. The guidelines do not analyze the exemptions (paragraph 56): check each for your case.

## Privacy policy

### [GDPR Article 13](https://gdpr-info.eu/art-13-gdpr/)

- Page at `/privacy`, linked in the base layout footer and on each sign-up form.
- Content per Article 13: controller contact, purposes, recipients, retention, user rights incl. complaint to a supervisory authority.
- List each processor by name (Article 13(1)(e)): Cloudflare (hosting, D1, R2, logs, Turnstile on pages with a protected form), plus Stripe, the email provider, Sentry as used.
- US transfer per processor with safeguard (Article 13(1)(f)). Cloudflare: [EU-U.S. Data Privacy Framework](https://www.cloudflare.com/privacypolicy/) certification and EU Standard Contractual Clauses in the [Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/); link both. In the policy page, no separate page.
- State how a user requests access, export, deletion; one contact email.
- New processor, cookie, or personal data field → update the policy (and re-check safeguards) in the same PR.

## Data minimization

### [GDPR Article 5](https://gdpr-info.eu/art-5-gdpr/)

- Only fields a feature needs (5(1)(c)); no field, column, or event property "for later".
- Retention period per personal-data table (5(1)(e)); delete after it with the cleanup job. → [SAAS](SAAS.md) (Cleanup)
- No personal data in logs, analytics events, error reports, fixtures, screenshots → IDs.
- Fake data in tests and dev databases; no production import.

## User rights

### [GDPR Articles 12, 15, 17, 20](https://gdpr-info.eu/art-12-gdpr/)

- Account settings: view (15), export (20), delete account (17).
- Export JSON (CSV for tabular) via the app repository modules, filtered by `tenant_id` and `user_id` from the session. → [SAAS](SAAS.md)
- Cover every store: app databases, [R2](STACK.md#r2) objects under `tenant_id/`, the [EmDash](STACK.md#emdash) user record. New personal data store → add to export and delete in the same PR.
- Answer within one month, no undue delay; automatic flow, no manual work.
- Delete cascades to app data: `deleted_at`, then hard delete after the grace period. → [SAAS](SAAS.md) (Cleanup)
- Keep nothing after the grace period except legally required data (invoices), only the required fields.
- Verify identity: signed-in session; delete also needs a fresh sign-in or email confirmation.

### [Better Auth](STACK.md#better-auth) delete user

- `user.deleteUser.enabled: true` (off by default; hard-deletes) only if [emdash-better-auth](STACK.md#emdash-better-auth) exposes Better Auth `user` options. → [AUTH](AUTH.md) (Open issues). Else delete app data per [SAAS](SAAS.md) (Cleanup).
- Client `authClient.deleteUser()`; pass `password` if the user has one, else session must be fresh (`session.freshAge`, default 1 day). `freshAge` `0` only with email confirmation.
- `sendDeleteAccountVerification` for email confirmation and OAuth users without a password; pass user, `url`, `token` to the email template. → [EMAIL](EMAIL.md)
- `afterDelete`: delete app data or queue it for the cleanup job. `beforeDelete`: throw `APIError` to block (for example last owner of an organization).

## Data residency

### [D1](STACK.md#d1) data location

- No jurisdiction: no `--jurisdiction` on `wrangler d1 create` / `wrangler r2 bucket create`, no `jurisdiction` in `r2_buckets`. → [WHY](../WHY.md#why-no-d1-jurisdiction)
- D1 primary via location hint. → [PERF](PERF.md) (Placement)
- Policy never claims data stays in the EU or one region; state the US transfer.

## Logs

### [Workers](STACK.md#workers) Logs

- `"observability": { "logs": { "invocation_logs": false } }` when request URLs can hold personal data.
- Sampling, fields, retention → [OBSERVABILITY](OBSERVABILITY.md). Account for retention when answering a delete request.
