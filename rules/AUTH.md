# AUTH

## Setup

### [emdash-better-auth](STACK.md#emdash-better-auth)

- Site-user login (members, customers). `authProviders: [betterAuthProvider()]` in `emdash()`; `betterAuthSettingsPlugin()` in `plugins` (admin settings page).
- `BETTER_AUTH_SECRET` = Worker secret, value from `openssl rand -base64 32`. Local: `.env` only; no `.dev.vars` (Wrangler then ignores `.env`). Production → [DEPLOY](DEPLOY.md) (Secrets).
- Set Astro `site:` (or `BETTER_AUTH_URL`) when more than one host answers (custom domain + `*.workers.dev`).
- Email verification is on by default. Before go-live: an email provider (→ Email), or **Require email verification** off on the settings page. Without a provider, sign-up cannot finish, and password reset and email login do not work.
- No `login.astro`, `signup.astro`, `/api/auth/*` routes (the plugin adds them).
- EmDash passkey login stays at `/_emdash/admin/login`; no redirect to [Better Auth](STACK.md#better-auth).
- Organizations and [Stripe](STACK.md#stripe) billing: enable in plugin settings.

## Users

### [EmDash](STACK.md#emdash) authentication

- `Astro.locals.user` in app pages and routes.
- Protected app page: `requireUser(Astro)` from `emdash-better-auth/route`; return its response when not `null` (redirects to `/auth/sign-in`). Then check `locals.user.role` for role-limited pages.
- Protected API route: check `locals.user` + `role` first; `401`/`403` problem details, no redirect. → [API](API.md) (Auth)
- No `locals.user` branching in cached public pages; `Astro.cache.set(false)` on user-dependent pages. → [PERF](PERF.md) (Cache)
- Customer signup, organizations, billing → emdash-better-auth.

## Email

### [Cloudflare Email Service](STACK.md#cloudflare-email-service) via EmDash

- Auth emails (verification, reset, magic link, invites) go through the EmDash email provider pipeline; never from app code.
- Only the `cloudflareEmail` provider plugin; no other email provider plugins. `astro dev` uses a console provider (logs emails and links to the terminal).
- Production: `send_email` binding `EMAIL` in `wrangler.jsonc`; verify the sender domain in Cloudflare Email Sending; From address on that domain. [Deploy to Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)
- `import { cloudflareEmail } from "@emdash-cms/cloudflare/plugins"`; `cloudflareEmail({ from: { email, name } })` in `emdash()` `plugins`; `replyTo` for reply address.
- Admin **Settings** > **Email**: select provider when several; **Send test email** to catch bad credentials.
- SPF, DKIM, DMARC for the sending domain in Cloudflare Email Service (not EmDash settings).
- Base URL (`site:` or `BETTER_AUTH_URL`) so email links use the right host.

## Organizations

### emdash-better-auth organizations

- Enable "Organizations (+ teams)" on the Better Auth admin settings page.
- `requireUser(Astro)` first (see Users), then read the organization.
- Active org: `auth.api.getSession()` → `session.activeOrganizationId`; `auth` from `createAuthForRequest()` (`emdash-better-auth/route`) inside `withEmDashRuntime()` (`emdash/middleware`). Not `getAuthUser()` (user only).
- Wrap in one helper `getActiveOrgId(Astro)`; `createAuthForRequest()` is undocumented. Replace it when [emdash-better-auth#23](https://github.com/theweekendprojects/emdash-better-auth/issues/23) ships a public helper.
- Call once per request (each call builds a Better Auth instance and reads the session).
- Empty `activeOrganizationId` → redirect to `/organization`.

### Better Auth organization plugin

- Server-side role checks with `auth.api.hasPermission()`. No `authClient.organization.checkRolePermission()` for access checks (client).

## Login

### Better Auth Last Login Method

- Only when running Better Auth directly; emdash-better-auth cannot load it ([#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)).
- `lastLoginMethod()` (`better-auth/plugins`) in server `plugins`; `lastLoginMethodClient()` (`better-auth/client/plugins`) in `createAuthClient()` `plugins`.
- `authClient.getLastUsedLoginMethod()` marks the last method on the login page ("Last used" badge); `isLastUsedLoginMethod("<method>")` checks one.
- `authClient.clearLastUsedLoginMethod()` on sign-out on shared devices.

## Open issues

### [emdash-better-auth issues](https://github.com/theweekendprojects/emdash-better-auth/issues)

- Check before working around a plugin limit. When an issue closes, update the rules that link to it.
- [#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22) Server-side plugins: no Better Auth plugins (Polar, Creem, Last Login Method) in emdash-better-auth. Use Stripe billing.
- [#23](https://github.com/theweekendprojects/emdash-better-auth/issues/23) Session helper: `getActiveOrgId()` (see Organizations).
- [#24](https://github.com/theweekendprojects/emdash-better-auth/issues/24) Precompiled auth CSS: plugin scans `node_modules` via relative `@source`. Check auth page styles after each install.
- [#25](https://github.com/theweekendprojects/emdash-better-auth/issues/25) Headless mode: keep built-in HeroUI auth pages. After the fix: Better Auth UI shadcn/ui variant or `@better-auth-ui/react` + own Tailwind components.
- [#26](https://github.com/theweekendprojects/emdash-better-auth/issues/26) Dependabot and minor pins: expect Better Auth UI 1.7.19 and Better Auth `^1.7.2` in the plugin.
