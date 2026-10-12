# AUTH

## Setup

### [emdash-better-auth](https://github.com/theweekendprojects/emdash-better-auth)

- Use it for login of site users (members, customers). Add `authProviders: [betterAuthProvider()]` to `emdash()`. Add `betterAuthSettingsPlugin()` to `plugins` for the admin settings page.
- It needs `@astrojs/react` and `@tailwindcss/vite` (Vite plugin) in `astro.config`. Without Tailwind the auth pages have no styles.
- Set `BETTER_AUTH_SECRET` with `wrangler secret put`. Do not use `.env` for it: `.env` is build-time only.
- Set Astro `site:` (or `BETTER_AUTH_URL`) when the site answers on more than one host, for example a custom domain and `*.workers.dev`.
- Set up an email provider. Email verification is on by default, so sign-up fails without email.
- Do not create `login.astro`, `signup.astro`, or `/api/auth/*` routes. The plugin adds them.
- Keep the EmDash passkey login at `/_emdash/admin/login`. Do not redirect it to Better Auth.
- Turn on organizations and Stripe billing in the plugin settings for SaaS features.

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
- [#23](https://github.com/theweekendprojects/emdash-better-auth/issues/23) Session helper: read `activeOrganizationId` with the `getActiveOrgId()` helper from [SAAS.md](SAAS.md) until a public helper exists.
- [#24](https://github.com/theweekendprojects/emdash-better-auth/issues/24) Precompiled auth CSS: the plugin scans `node_modules` with a relative `@source` path. Check the auth page styles after each install until it is fixed.
- [#25](https://github.com/theweekendprojects/emdash-better-auth/issues/25) Headless mode: keep the built-in HeroUI auth pages until it is fixed. Then build the auth pages with the Better Auth UI shadcn/ui variant or `@better-auth-ui/react` and your own Tailwind components.
- [#26](https://github.com/theweekendprojects/emdash-better-auth/issues/26) Dependabot and minor pins: expect Better Auth UI 1.7.19 and Better Auth `^1.7.2` in the plugin until it is fixed.
