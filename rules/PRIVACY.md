# PRIVACY

This file holds technical rules, not legal advice. Read it before you add analytics, a cookie, a personal data field, or an account feature. See also [SAAS](SAAS.md), [AUTH](AUTH.md#use-organizations), [OBSERVABILITY](OBSERVABILITY.md#write-logs), and [SECURITY](SECURITY.md).

## Add analytics

- Use [Web Analytics](STACK.md#web-analytics) as the only analytics tool by default.
- For a proxied site, use the automatic setup: add the site and select the hostname.
- For a site that is not proxied (`workers.dev`), add the manual JS snippet before `</body>` in the base layout in `src/layouts/`.
- With the automatic setup, do not send `Cache-Control: public, no-transform` on pages. It blocks injection. Drop `no-transform` or use the snippet.
- Choose "Enable with JS Snippet installation", not "Enable, excluding EU visitor data", unless EU data is unwanted.
- Set `"spa": false` in `data-cf-beacon` only to stop tracking SPA route changes. The default is on.
- In `security.csp`, add `https://static.cloudflareinsights.com/beacon.min.js` to `scriptDirective.resources`. Include the script's query string if it has one.
- For the manual snippet, add `cloudflareinsights.com` to the single `connect-src` entry.
- Keep `'self'` in `connect-src` for both. See [SECURITY](SECURITY.md#change-the-csp).
- Put no personal data in URLs or query strings.
- Add no other analytics or tracker (Google Analytics, session recorder) before a consent banner exists. See [Handle cookies and consent](#handle-cookies-and-consent).

## Handle cookies and consent

### Follow the ePrivacy Directive

- Follow the [GDPR and ePrivacy](STACK.md#gdpr-and-eprivacy) rules in [ePrivacy Directive Article 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02002L0058-20091219).
- Ask for consent before you store or read anything on the device. Exceptions: transmission only, or a service the user explicitly requested.
- Set no non-essential cookie, third-party script, pixel, font, embed, or tracker before consent.
- Load maps and videos only after a click.
- Let withdrawing consent be as easy as giving it ([GDPR Article 7(3)](https://gdpr-info.eu/art-7-gdpr/)). Add a footer link that reopens the consent choice.
- List each cookie and `localStorage` key (purpose and lifetime) in one place on the privacy policy page.

### Allow Turnstile without a banner

- [Turnstile](STACK.md#turnstile) is the only third-party script allowed without a banner. See [SECURITY](SECURITY.md#add-turnstile).
- Load it only on pages with a protected form, not before the user opens one.
- The basis is the [Turnstile Privacy Addendum](https://www.cloudflare.com/turnstile-privacy-policy/): strictly necessary bot detection, with Cloudflare as processor.
- Name Turnstile in the privacy policy.
- Have a data protection adviser confirm this. The EDPB guidelines do not analyze the exemptions.

### Check every device technique

- Follow the [EDPB Guidelines 2/2023 on Article 5(3)](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en).
- Check Article 5(3) for every device read or store technique, not only cookies.
- The guidelines do not analyze the exemptions (paragraph 56). Check each exemption for your case.

## Write the privacy policy

- Follow [GDPR Article 13](https://gdpr-info.eu/art-13-gdpr/).
- Link `/privacy` on each sign-up form.
- List each other processor by name (Article 13(1)(e)): Stripe, the email provider, and Sentry as used.
- State the US transfer for each other processor, with its safeguard (Article 13(1)(f)), on the policy page.
- When you add a processor, cookie, or personal data field, update the policy in the same pull request.
- When you add a processor, also re-check the safeguards.

## Minimize data

- Follow [GDPR Article 5](https://gdpr-info.eu/art-5-gdpr/).
- Store only the fields a feature needs (5(1)(c)). Add no field, column, or event property "for later".
- Set a retention period for each personal-data table (5(1)(e)).
- Delete data after the period with the cleanup job. See [SAAS](SAAS.md#clean-up-deleted-users-and-organizations).
- Put no personal data in logs, analytics events, error reports, fixtures, or screenshots. Use IDs.
- Use fake data in tests and dev databases. Never import production data.

## Handle user rights

### Build the account features

- Follow [GDPR Articles 12, 15, 17, and 20](https://gdpr-info.eu/art-12-gdpr/).
- In account settings, let the user view data (15), export data (20), and delete the account (17).
- Export JSON (CSV for tabular data) through the app repository modules. Filter by `tenant_id` and by `user_id` from the session. See [SAAS](SAAS.md).
- Cover every store: app databases, [R2](STACK.md#r2) objects under `tenant_id/`, and the [EmDash](STACK.md#emdash) user record.
- When you add a personal data store, add it to export and delete in the same pull request.
- Answer a user rights request within one month, without undue delay.
- Handle the request in an automatic flow, with no manual work.
- Cascade a delete to app data: set `deleted_at`, then hard delete after the grace period. See [SAAS](SAAS.md#clean-up-deleted-users-and-organizations).
- After the grace period, keep nothing except legally required data (invoices), and only the required fields.
- Verify identity with the signed-in session. A delete also needs a fresh sign-in or an email confirmation.

### Use Better Auth delete user

- Set `user.deleteUser.enabled: true` in [Better Auth](STACK.md#better-auth) only if [emdash-better-auth](STACK.md#emdash-better-auth) exposes the Better Auth `user` options. It is off by default and hard-deletes. See [AUTH](AUTH.md#check-the-plugin-issues).
- Otherwise, delete app data as in [SAAS](SAAS.md#clean-up-deleted-users-and-organizations).
- Call `authClient.deleteUser()` on the client.
- Pass `password` if the user has one. Otherwise the session must be fresh (`session.freshAge`, default 1 day).
- Set `freshAge` to `0` only with email confirmation.
- Use `sendDeleteAccountVerification` for email confirmation and for OAuth users without a password.
- Pass the user, `url`, and `token` to the email template. See [EMAIL](EMAIL.md).
- In `afterDelete`, delete app data or queue it for the cleanup job.
- In `beforeDelete`, throw `APIError` to block the delete, for example for the last owner of an organization.

## Choose the data location

- Use no jurisdiction. Do not pass `--jurisdiction` to `wrangler d1 create` or `wrangler r2 bucket create`, and do not set `jurisdiction` in `r2_buckets`. See [WHY](../WHY.md#why-no-d1-jurisdiction).
- Place the [D1](STACK.md#d1) primary with a location hint. See [PERF](PERF.md#choose-the-placement).
- Never claim in the policy that data stays in the EU or in one region. State the US transfer.

## Handle logs

- If request URLs can hold personal data, set `"observability": { "logs": { "invocation_logs": false } }` for [Workers](STACK.md#workers) Logs.
- For sampling, fields, and retention, see [OBSERVABILITY](OBSERVABILITY.md).
- Account for retention when you answer a delete request.
