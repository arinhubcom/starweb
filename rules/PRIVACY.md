# PRIVACY

Technical rules for personal data, cookies, analytics, and logs. These rules are not legal advice. For user data and tenants, follow [SAAS.md](SAAS.md) and [AUTH.md](AUTH.md). For logs and errors, follow [OBSERVABILITY.md](OBSERVABILITY.md). For security, follow [SECURITY.md](SECURITY.md).

## Analytics

### [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/)

- Use Cloudflare Web Analytics as the only analytics tool by default.
- Use the automatic setup when the site is proxied through Cloudflare: add the site on the Web Analytics page and select the hostname.
- Use the manual JS snippet for sites that are not proxied, such as a `workers.dev` host. Add the snippet before the closing `</body>` tag in the base layout in `src/layouts/`.
- Do not send `Cache-Control: public, no-transform` on pages when you use the automatic setup. It blocks the beacon injection. Remove `no-transform` or use the manual snippet.
- Do not set the automatic setup to "Enable, excluding EU visitor data" unless you want no data from EU visitors. Choose "Enable with JS Snippet installation" to control the snippet in code.
- Set `"spa": false` in the `data-cf-beacon` attribute of a manual snippet only when you do not want route changes of single page apps tracked. Tracking is on by default.
- Allow the beacon in the CSP when `security.csp` is on (see [SECURITY.md](SECURITY.md) (Headers)): add `https://static.cloudflareinsights.com/beacon.min.js` to `csp.scriptDirective.resources` (keep `'self'` in the list), and add `"connect-src 'self'"` to `csp.directives` for the automatic setup or `"connect-src cloudflareinsights.com"` for the manual snippet. Include the query string of the script URL in the entry when it has one.
- Do not put personal data in URLs or query strings. Web Analytics does not log query strings, but other logs and tools do.
- Add no other analytics or tracking script, such as Google Analytics or a session recorder, before you add a consent banner (see Cookies).

## Cookies

### [ePrivacy Directive, Article 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02002L0058-20091219)

- Ask for consent before you store information on, or read information from, the device of a user, unless it is strictly needed. The directive exempts storage that only carries out a transmission, and storage that is needed for a service the user explicitly requested.
- Do not set a non-essential cookie, and do not load a third-party script, pixel, font, embed, or tracker, before the user gives consent. Load embeds such as maps and videos only after a click.
- Make withdrawing consent as easy as giving it ([GDPR Article 7(3)](https://gdpr-info.eu/art-7-gdpr/)): put a link in the footer that reopens the consent choice.
- List each cookie and `localStorage` key that the site sets, with its purpose and lifetime, in one place on the privacy policy page.

### [EDPB Guidelines 2/2023 on Article 5(3)](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en)

- Check Article 5(3) for each technique that reads or stores data on the device of a user, not only for cookies. Read the guidelines for the scope.

## Privacy policy

### [GDPR Article 13](https://gdpr-info.eu/art-13-gdpr/)

- Add a privacy policy page at `/privacy` and link it in the footer of the base layout and on each sign-up form.
- Follow [GDPR Article 13](https://gdpr-info.eu/art-13-gdpr/) for the policy content: the contact of the controller, the purposes, the recipients (such as Cloudflare, Stripe, and the email provider), the retention period, and the rights of the user, including the right to complain to a supervisory authority.
- List each processor that receives personal data in the policy, by name: Cloudflare (hosting, D1, R2, logs), and the others that the app uses, such as Stripe, the email provider, and Sentry (GDPR Article 13(1)(e)).
- State the transfer of personal data to the United States for each processor that stores or processes data there, with its safeguard (GDPR Article 13(1)(f)). For Cloudflare, name the certification under the [EU-U.S. Data Privacy Framework](https://www.cloudflare.com/privacypolicy/) and the EU Standard Contractual Clauses in the [Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/), and link both. Put this in the privacy policy page. Do not add a separate page for it.
- Check the safeguards of each processor again when you add one, and update the policy in the same pull request.
- Name in the policy how a user requests access, export, and deletion, and give one contact email.
- Update the policy in the same pull request that adds a new processor, a new cookie, or a new personal data field.

## Data minimization

### [GDPR Article 5](https://gdpr-info.eu/art-5-gdpr/)

- Collect only the fields that a feature needs (Article 5(1)(c)). Do not add a form field, column, or event property "for later".
- Keep personal data no longer than needed (Article 5(1)(e)). Set a retention period for each table that holds personal data, and delete rows after it with the cleanup job in [SAAS.md](SAAS.md) (Cleanup).
- Do not copy personal data to logs, analytics events, error reports, test fixtures, or screenshots. Use ids instead.
- Use fake data in tests and in dev databases. Do not import production data.

## User rights

### [GDPR Articles 12, 15, 17, and 20](https://gdpr-info.eu/art-12-gdpr/)

- Give each signed-in user a way to see their data (Article 15), export it (Article 20), and delete their account (Article 17), in the account settings of the app.
- Export in a structured, commonly used, machine-readable format: use JSON, or CSV for tabular data. Build the export from the app repository modules, and filter by `tenant_id` and `user_id` from the session (see [SAAS.md](SAAS.md)).
- Include data from all places that hold it: the app databases, R2 objects under the `tenant_id/` prefix, and the EmDash user record. Add each new store of personal data to the export and the delete in the same pull request.
- Answer each request without undue delay and within one month. Make the account settings flow automatic so that no manual work is needed.
- Make the delete cascade to app data. Follow [SAAS.md](SAAS.md) (Cleanup): mark rows with `deleted_at`, then delete them for good after the grace period.
- Do not keep personal data after the grace period ends, except data that a law requires you to keep, such as invoices. Keep only the fields that the law requires.
- Check the identity of the person before you export or delete: require a signed-in session, and a fresh sign-in or an email confirmation for delete.

### [Better Auth delete user](https://better-auth.com/docs/concepts/users-accounts#delete-user)

- Use the Better Auth `user.deleteUser` option when you run Better Auth directly. It is off by default: set `user.deleteUser.enabled` to `true`. It hard-deletes the user from the database. Set it only if emdash-better-auth exposes the Better Auth `user` options. Check [AUTH.md](AUTH.md) (Open issues) first. If it does not, delete the app data as in [SAAS.md](SAAS.md) (Cleanup).
- Call `authClient.deleteUser()` from the client. Pass `password` when the user has one. Without a password, the session must be fresh (`session.freshAge`, one day by default). Do not set `freshAge` to `0` unless you confirm the delete by email.
- Set `sendDeleteAccountVerification` to confirm the delete by email, and for users that sign in with OAuth and have no password. Send the user, `url`, and `token` it receives to your email template (see [EMAIL.md](EMAIL.md)).
- Delete the app data of the user in `afterDelete`, or queue it there for the cleanup job. Throw an `APIError` in `beforeDelete` to stop a delete that must not happen, for example the last owner of an organization.

## Data residency

### [D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/)

- Create D1 databases and R2 buckets without a jurisdiction. Do not pass `--jurisdiction` to `wrangler d1 create` or `wrangler r2 bucket create`, and do not set `jurisdiction` in `r2_buckets`. Read [WHY.md](../WHY.md#why-no-d1-jurisdiction).
- Set the location of the D1 primary with a location hint, as in [PERF.md](PERF.md) (Placement).
- Do not claim in the policy that data stays in the EU or in one region. State the transfer to the United States, as in Privacy policy.

## Logs

### [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)

- Set `"observability": { "logs": { "invocation_logs": false } }` in `wrangler.jsonc` when request URLs can hold personal data.
- Follow the rules in [OBSERVABILITY.md](OBSERVABILITY.md) for sampling, the fields to log, and retention. Keep the retention in mind when you answer a delete request.
