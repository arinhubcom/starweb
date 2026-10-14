# PAYMENTS

## Providers

### [emdash-better-auth Stripe billing](https://github.com/theweekendprojects/emdash-better-auth#readme)

- Use Stripe billing from emdash-better-auth only when you do not sell to EU consumers. It is the only provider that works out of the box, but it is not a Merchant of Record. For EU sales, see EU sales below.
- Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` as secrets. Do not put them in source code.
- Set one `STRIPE_PRICE_<PLAN>_MONTH` and `STRIPE_PRICE_<PLAN>_YEAR` per plan.
- Turn on "Stripe billing" in the Better Auth admin settings page.

### [Better Auth payment plugins](https://better-auth.com/docs/plugins/stripe)

- Do not add Polar, Creem, Autumn, Dodo Payments, Chargebee, or Commet plugins directly. emdash-better-auth has no server plugin extension point yet. For Creem, use the SDK and webhooks (see EU sales). Track [emdash-better-auth#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22).

## EU sales

### [Creem](https://docs.creem.io)

- Use a Merchant of Record (MoR) for sales to EU customers. Do not sell as the merchant yourself unless you register for VAT and file OSS returns.
- Use Creem as the MoR. It handles VAT, invoices, refunds, and chargebacks.
- Until [emdash-better-auth#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22) is fixed, connect Creem without the Better Auth plugin:
  - Create checkouts with the [`creem`](https://docs.creem.io/code/sdks/typescript) TypeScript SDK in a server route. Keep the API key in a Wrangler secret.
  - Receive [webhooks](https://docs.creem.io/code/webhooks) in an Astro API route. Verify the `creem-signature` header (HMAC-SHA256 of the raw body with the webhook secret) before you read the payload.
  - Set the plan per organization from the webhook events. Then set the `premium` flag for each member of an organization with an active plan (see Premium content).
  - Store the `id` of each event (`evt_...`) in the app database, with a unique constraint. Skip an event that you already stored: Creem can deliver the same event more than once. It retries up to 5 times in 24 hours until it gets an HTTP `200`.
  - Verify the signature and store the event ID in the route, then send the event to a Queue and return `200`. Do the work in the Queue consumer. Follow the rules in [API.md](API.md) (Webhooks) and [ARCH.md](ARCH.md) (Background work).
- Use the [Creem Better Auth plugin](https://docs.creem.io/code/sdks/better-auth) when you run Better Auth directly, or after #22 is fixed.
- Use [Stripe Managed Payments](https://docs.stripe.com/payments/managed-payments) only when you need Stripe features. It is also an MoR and supports Czech businesses, but costs more.

## Agent payments

### [x402](https://docs.emdashcms.com/guides/x402-payments/)

- Use `@emdash-cms/x402` only for experiments with agent payments. Test with a Stripe sandbox, Base Sepolia, and `https://x402.org/facilitator`.
- Do not use x402 on mainnet yet. Stripe x402 needs the Coinbase CDP facilitator with API keys, and `@emdash-cms/x402` accepts only `facilitatorUrl`. Stripe stablecoin payments outside the US also need an access request.

## Premium content

### [emdash-better-auth access](https://github.com/theweekendprojects/emdash-better-auth#readme)

- Add `betterAuthAccess()` to `integrations` in `astro.config`, after `emdash()`.
- Set "who can read this" on each entry: public, `members`, or `premium`.
- Expect these results:
  - Signed out: redirect to `/auth/sign-in?redirect=<page>`.
  - Signed in, not premium, on a `premium` entry: `403` paywall page with the title, a teaser, and an "Upgrade" button.
  - Premium user: can read the entry.
  - Staff (role 20 and higher): can read everything.
- Call `filterEntries` in the theme to hide protected entries from HTML lists. Without it, lists still show their titles.
- Use `gateEntry(Astro, entry)` before render only when you cannot use the integration.
- Store the plan per organization and the `premium` flag per user.
- Set the `premium` flag from your billing code through the admin API, for each member of an organization with an active plan. A Stripe payment does not set it.
- Clear the `premium` flag for all members when the plan ends, and for one member when that member leaves the organization. Set it for a new member when the organization has an active plan.
