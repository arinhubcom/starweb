# PAYMENTS

## Providers

### [emdash-better-auth](STACK.md#emdash-better-auth) Stripe billing

- [Stripe](STACK.md#stripe) billing only without EU consumer sales (not a merchant of record). EU → EU sales.
- Secrets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`; never in source.
- Per plan: `STRIPE_PRICE_<PLAN>_MONTH`, `STRIPE_PRICE_<PLAN>_YEAR`.
- Enable "Stripe billing" in the [Better Auth](STACK.md#better-auth) admin settings page.
- No Polar, Creem, Autumn, Dodo Payments, Chargebee, Commet Better Auth plugins: no server plugin extension point. Track [emdash-better-auth#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22).

## EU sales

### [Creem](STACK.md#creem)

- Merchant of record for EU customers (VAT, invoices, refunds, chargebacks). No self-merchant unless VAT-registered with OSS returns.
- Until #22 is fixed, no Better Auth plugin:
  - Checkouts: [`creem`](https://docs.creem.io/code/sdks/typescript) TypeScript SDK in a server route; API key in a Wrangler secret.
  - [Webhooks](https://docs.creem.io/code/webhooks) in an Astro API route: verify `creem-signature` (HMAC-SHA256 of the raw body with the webhook secret) before reading the payload.
  - Set plan per organization from events; then `premium` per member of an organization with an active plan (→ Premium content).
  - Store event `id` (`evt_...`) in the app database with a unique constraint; skip duplicates (retries up to 5 times in 24 h until HTTP `200`).
  - In the route: verify, store the ID, enqueue to a [Queue](STACK.md#queues), return `200`; work in the consumer → [API](API.md) (Webhooks), [ARCH](ARCH.md) (Background work).
- After #22, or with Better Auth run directly: [Creem Better Auth plugin](https://docs.creem.io/code/sdks/better-auth).
- [Stripe Managed Payments](https://docs.stripe.com/payments/managed-payments) (also MoR, supports Czech businesses, costs more) only when Stripe features are needed.

## Agent payments

### [x402](STACK.md#x402)

- `@emdash-cms/x402` for experiments only: Stripe sandbox, Base Sepolia, `https://x402.org/facilitator`.
- No mainnet: Stripe x402 needs Coinbase CDP facilitator with API keys, `@emdash-cms/x402` accepts only `facilitatorUrl`; Stripe stablecoin outside the US needs an access request.

## Premium content

### emdash-better-auth access

- `betterAuthAccess()` in `integrations` of `astro.config`, after `emdash()`.
- Per entry "who can read this": public, `members`, `premium`.
  - Signed out: redirect `/auth/sign-in?redirect=<page>`.
  - Signed in, not premium, `premium` entry: `403` paywall page (title, teaser, "Upgrade" button).
  - Premium: reads. Staff (role ≥ 20): reads everything.
- `filterEntries` in the theme to hide protected entries from HTML lists (else titles show).
- `gateEntry(Astro, entry)` before render only when the integration cannot be used.
- Plan per organization, `premium` per user.
- Set `premium` from billing code via the admin API for each member of an organization with an active plan (a Stripe payment does not set it). Clear for all members when the plan ends, for one member on leaving; set for a new member of an active-plan organization.
