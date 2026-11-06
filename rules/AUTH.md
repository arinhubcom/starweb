# AUTH

This file covers login, site users, auth email, and organizations. Read it before you add sign-in, a protected page, or an organization feature.

## Set up login

- Use [emdash-better-auth](STACK.md#emdash-better-auth) for site-user login (members and customers).
- Add `authProviders: [betterAuthProvider()]` to `emdash()`.
- Add `betterAuthSettingsPlugin()` to `plugins`. It adds the admin settings page.
- Set `BETTER_AUTH_SECRET` as a Worker secret. Create the value with `openssl rand -base64 32`.
- Locally, keep `BETTER_AUTH_SECRET` in `.env` only. Do not create `.dev.vars`: Wrangler then ignores `.env`.
- For production, see [DEPLOY](DEPLOY.md#set-secrets).
- If more than one host answers (custom domain and `*.workers.dev`), set the Astro `site` option or `BETTER_AUTH_URL`.
- Email verification is on by default. Before go-live, set up an email provider, or turn off **Require email verification** on the settings page.
- Without an email provider, sign-up cannot finish, and password reset and email login do not work.
- Do not add `login.astro`, `signup.astro`, or `/api/auth/*` routes. The plugin adds them.
- EmDash passkey login stays at `/_emdash/admin/login`. Do not redirect it to [Better Auth](STACK.md#better-auth).
- To use organizations and [Stripe](STACK.md#stripe) billing, enable them in the plugin settings.

## Protect a page or route

- Read the signed-in user from `Astro.locals.user` in app pages and routes of [EmDash](STACK.md#emdash).
- In a protected app page, call `requireUser(Astro)` from `emdash-better-auth/route`.
- If `requireUser(Astro)` returns a response that is not `null`, return it. It redirects to `/auth/sign-in`.
- For a role-limited page, then check `locals.user.role`.
- In a protected API route, check `locals.user` and the role first.
- Return `401` or `403` problem details from an API route. Do not redirect. See [API](API.md#protect-a-route).
- Do not branch on `locals.user` in cached public pages.
- On a page that depends on the user, call `Astro.cache.set(false)`. See [PERF](PERF.md#use-astro-route-caching).
- Leave customer signup, organizations, and billing to emdash-better-auth.

## Send auth email

- Send auth emails (verification, reset, magic link, invites) through the EmDash email provider pipeline. Never send them from app code.
- Use only the `cloudflareEmail` provider plugin. Add no other email provider plugin.
- `astro dev` uses a console provider. It logs emails and links to the terminal.
- In production, add a `send_email` binding named `EMAIL` in `wrangler.jsonc`.
- Verify the sender domain in Cloudflare Email Sending, and use a From address on that domain. See [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/).
- Import the provider with `import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins"`.
- Add `cloudflareEmail({ from: { email, name } })` to the `plugins` of `emdash()`. Set `replyTo` for a reply address.
- In the admin, open **Settings** > **Email**. Select the provider when there are several.
- Use **Send test email** to catch bad credentials.
- Set SPF, DKIM, and DMARC for the sending domain in [Cloudflare Email Service](STACK.md#cloudflare-email-service), not in the EmDash settings.
- Set a base URL (`site` or `BETTER_AUTH_URL`) so that email links use the right host.

## Use organizations

- Enable "Organizations (+ teams)" on the Better Auth admin settings page.
- Call `requireUser(Astro)` first. See [Protect a page or route](#protect-a-page-or-route). Then read the organization.
- Read the active organization from `session.activeOrganizationId` of `auth.api.getSession()`.
- Get `auth` from `createAuthForRequest()` (`emdash-better-auth/route`), inside `withEmDashRuntime()` (`emdash/middleware`).
- Do not use `getAuthUser()` for this. It returns the user only.
- Wrap the call in one helper, `getActiveOrgId(Astro)`. `createAuthForRequest()` is undocumented.
- Replace the helper when [emdash-better-auth#23](https://github.com/theweekendprojects/emdash-better-auth/issues/23) ships a public helper.
- Call the helper once per request. Each call builds a Better Auth instance and reads the session.
- If `activeOrganizationId` is empty, redirect to `/organization`.
- Check roles on the server with `auth.api.hasPermission()`.
- Do not use `authClient.organization.checkRolePermission()` for access checks. It runs on the client.

## Show the last login method

- Use the Better Auth Last Login Method plugin only when you run Better Auth directly. emdash-better-auth cannot load it ([#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)).
- Add `lastLoginMethod()` from `better-auth/plugins` to the server `plugins`.
- Add `lastLoginMethodClient()` from `better-auth/client/plugins` to the `plugins` of `createAuthClient()`.
- Call `authClient.getLastUsedLoginMethod()` to mark the last method on the login page with a "Last used" badge.
- Call `isLastUsedLoginMethod("<method>")` to check one method.
- On shared devices, call `authClient.clearLastUsedLoginMethod()` at sign-out.

## Check the plugin issues

- Check the [emdash-better-auth issues](https://github.com/theweekendprojects/emdash-better-auth/issues) before you work around a plugin limit.
- When an issue closes, update the rules that link to it.
- [#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22), server-side plugins: emdash-better-auth has no Better Auth plugins (Polar, Creem, Last Login Method). Use Stripe billing.
- [#23](https://github.com/theweekendprojects/emdash-better-auth/issues/23), session helper: `getActiveOrgId()`. See [Use organizations](#use-organizations).
- [#24](https://github.com/theweekendprojects/emdash-better-auth/issues/24), precompiled auth CSS: the plugin scans `node_modules` through a relative `@source`. Check the auth page styles after each install.
- [#25](https://github.com/theweekendprojects/emdash-better-auth/issues/25), headless mode: keep the built-in HeroUI auth pages.
- After the #25 fix, use the Better Auth UI shadcn/ui variant, or `@better-auth-ui/react` with your own Tailwind components.
- [#26](https://github.com/theweekendprojects/emdash-better-auth/issues/26), Dependabot and minor pins: expect Better Auth UI 1.7.19 and Better Auth `^1.7.2` in the plugin.
