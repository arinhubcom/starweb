# AUTH

## Setup

### [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth)

- Use it for login of site users (members, customers). Add `authProviders: [betterAuthProvider()]` to `emdash()`. Add `betterAuthSettingsPlugin()` to `plugins` for the admin settings page.
- It needs `@astrojs/react` and `@tailwindcss/vite` (Vite plugin) in `astro.config`. Without Tailwind the auth pages have no styles.
- Set `BETTER_AUTH_SECRET` as a Worker secret. Create the value with `openssl rand -base64 32`. For local development, put it in `.env`: Wrangler and the Cloudflare Vite plugin read `.env` in local dev. Do not also create a `.dev.vars` file: when it exists, Wrangler ignores `.env`. For production, follow [DEPLOY.md](DEPLOY.md) (Secrets).
- Set Astro `site:` (or `BETTER_AUTH_URL`) when the site answers on more than one host, for example a custom domain and `*.workers.dev`.
- Set up an email provider before you go live. Email verification is on by default, so a new user cannot sign in without the emailed link. Follow the steps in Email.
- Do not create `login.astro`, `signup.astro`, or `/api/auth/*` routes. The plugin adds them.
- Keep the EmDash passkey login at `/_emdash/admin/login`. Do not redirect it to Better Auth.
- Turn on organizations and Stripe billing in the plugin settings for SaaS features.

## Users

### [EmDash authentication](https://docs.emdashcms.com/guides/authentication/)

- Read the user from `Astro.locals.user` in app pages and routes.
- Guard each protected app page with `requireUser(Astro)` from `emdash-better-auth/route`. Return its response when it is not `null`: it redirects to `/auth/sign-in`. Check `locals.user.role` after it for role-limited pages.
- Check `locals.user` and its `role` at the start of each protected API route. Return `401` or `403` as problem details, and do not redirect. Follow [API.md](API.md) (Auth).
- Do not branch on `locals.user` in cached public pages. Call `Astro.cache.set(false)` on pages that depend on the user (see [PERF.md](PERF.md) (Cache)).
- Use emdash-better-auth for customer signup, organizations, and billing.

## Email

### [EmDash email setup](https://docs.emdashcms.com/guides/email/)

- Send auth emails (verification, password reset, magic link, invites) through the EmDash email provider. The plugin hands each link to the EmDash email pipeline. Do not send them from app code.
- Use only the Cloudflare email provider plugin (`cloudflareEmail`). Do not install other email provider plugins. In `astro dev`, EmDash uses a console provider: it sends nothing and logs each email, with its link, to the terminal.
- Add a `send_email` binding named `EMAIL` to `wrangler.jsonc` for production. Verify the sender domain in Cloudflare Email Sending, and use a From address on that domain. See [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/).
- Import `cloudflareEmail` from `@emdash-cms/cloudflare/plugins` and add `cloudflareEmail({ from: { email, name } })` to `plugins` in `emdash()`. Use `replyTo` for a reply address.
- Open **Settings**, then **Email** in the admin. Select the provider when more than one is installed, and click **Send test email** to catch bad credentials.
- Set up SPF, DKIM, and DMARC for the sending domain in Cloudflare Email Service. They are not EmDash settings.
- Set the base URL (`site:` or `BETTER_AUTH_URL`) so the links in the emails use the right host (see Setup).

## Organizations

### [emdash-better-auth organizations](https://github.com/theweekendprojects/emdash-better-auth#readme)

- Turn on "Organizations (+ teams)" in the Better Auth admin settings page.
- Use `requireUser(Astro)` as the login guard on app pages (see Users) before you read the organization.
- Read the active organization with `auth.api.getSession()` and `session.activeOrganizationId`. Get `auth` from `createAuthForRequest()` in `emdash-better-auth/route`, inside `withEmDashRuntime()` from `emdash/middleware`. Do not use `getAuthUser()`: it returns only the user.
- Put this code in one helper, for example `getActiveOrgId(Astro)`. `createAuthForRequest()` is not a documented API. Replace the helper when [emdash-better-auth#23](https://github.com/theweekendprojects/emdash-better-auth/issues/23) adds a public one.
- Call the helper once per request. Each call builds a Better Auth instance and reads the session from storage.
- Redirect to `/organization` when `activeOrganizationId` is empty.

### [Better Auth organization plugin](https://better-auth.com/docs/plugins/organization)

- Check roles on the server with `auth.api.hasPermission()`. Do not use `authClient.organization.checkRolePermission()` for access checks: it runs on the client.

## Login

### [Better Auth Last Login Method](https://better-auth.com/docs/plugins/last-login-method)

- Use this plugin only when you run Better Auth directly. emdash-better-auth cannot load it yet ([#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)).
- Add `lastLoginMethod()` from `better-auth/plugins` to `plugins` in the server auth config.
- Add `lastLoginMethodClient()` from `better-auth/client/plugins` to `plugins` in `createAuthClient()`.
- Use `authClient.getLastUsedLoginMethod()` to mark the last used method on the login page, for example with a "Last used" badge.
- Use `authClient.isLastUsedLoginMethod("<method>")` to check one method.
- Call `authClient.clearLastUsedLoginMethod()` on sign-out when the device is shared.

## Open issues

### [emdash-better-auth issues](https://github.com/theweekendprojects/emdash-better-auth/issues)

- Check these issues before you work around a plugin limit. When an issue is closed, update the rules that link to it.
- [#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22) Server-side Better Auth plugins: do not add Better Auth plugins (Polar, Creem, Last Login Method) to emdash-better-auth until it is fixed. Use Stripe billing.
- [#23](https://github.com/theweekendprojects/emdash-better-auth/issues/23) Session helper: read `activeOrganizationId` with the `getActiveOrgId()` helper (see Organizations) until a public helper exists.
- [#24](https://github.com/theweekendprojects/emdash-better-auth/issues/24) Precompiled auth CSS: the plugin scans `node_modules` with a relative `@source` path. Check the auth page styles after each install until it is fixed.
- [#25](https://github.com/theweekendprojects/emdash-better-auth/issues/25) Headless mode: keep the built-in HeroUI auth pages until it is fixed. Then build the auth pages with the Better Auth UI shadcn/ui variant or `@better-auth-ui/react` and your own Tailwind components.
- [#26](https://github.com/theweekendprojects/emdash-better-auth/issues/26) Dependabot and minor pins: expect Better Auth UI 1.7.19 and Better Auth `^1.7.2` in the plugin until it is fixed.
