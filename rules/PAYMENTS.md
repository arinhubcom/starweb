# PAYMENTS

This file covers billing, EU sales, and premium content. Read it before you add a paid plan or gate content.

## Choose a billing provider

- Use [emdash-better-auth](STACK.md#emdash-better-auth) [Stripe](STACK.md#stripe) billing only without EU consumer sales. Stripe is not a merchant of record.
- For EU consumer sales, see [Sell to EU customers](#sell-to-eu-customers).
- Set the secrets `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. Never put them in source.
- For each plan, set `STRIPE_PRICE_<PLAN>_MONTH` and `STRIPE_PRICE_<PLAN>_YEAR`.
- Enable "Stripe billing" on the [Better Auth](STACK.md#better-auth) admin settings page.
- Do not use the Polar, Creem, Autumn, Dodo Payments, Chargebee, or Commet Better Auth plugins. emdash-better-auth has no server plugin extension point.
- Track [emdash-better-auth#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22).

## Sell to EU customers

- Use [Creem](STACK.md#creem) as merchant of record for EU customers. It handles VAT, invoices, refunds, and chargebacks.
- Do not act as your own merchant unless you are VAT-registered with OSS returns.
- Until #22 is fixed, do not use a Better Auth plugin. Use the SDK and webhook steps below.
- Create checkouts with the [`creem`](https://docs.creem.io/code/sdks/typescript) TypeScript SDK in a server route. Keep the API key in a Wrangler secret.
- Receive [webhooks](https://docs.creem.io/code/webhooks) in an Astro API route.
- Verify `creem-signature` before you read the payload. It is an HMAC-SHA256 of the raw body with the webhook secret.
- Set the plan per organization from events. Then set `premium` for each member of an organization with an active plan. See [Premium content](#gate-premium-content).
- Store the event `id` (`evt_...`) in the app database with a unique constraint, and skip duplicates.
- Creem retries an event up to 5 times in 24 hours until it gets HTTP `200`.
- In the route, verify the signature, store the ID, enqueue to a [Queue](STACK.md#queues), and return `200`.
- Do the work in the consumer. See [API](API.md#receive-webhooks) and [ARCH](ARCH.md#add-a-queue-consumer).
- After #22 is fixed, or with Better Auth run directly, use the [Creem Better Auth plugin](https://docs.creem.io/code/sdks/better-auth).
- Use [Stripe Managed Payments](https://docs.stripe.com/payments/managed-payments) only when you need Stripe features. It is also a merchant of record and supports Czech businesses, but costs more.

## Try agent payments

- Use [x402](STACK.md#x402) with `@emdash-cms/x402` for experiments only: Stripe sandbox, Base Sepolia, and `https://x402.org/facilitator`.
- Do not use mainnet. Stripe x402 needs the Coinbase CDP facilitator with API keys, and `@emdash-cms/x402` accepts only `facilitatorUrl`.
- Stripe stablecoin outside the US needs an access request.

## Gate premium content

- Add `betterAuthAccess()` to `integrations` in `astro.config`, after `emdash()`.
- Set "who can read this" per entry: public, `members`, or `premium`.
- If the visitor is signed out, redirect to `/auth/sign-in?redirect=<page>`.
- If the visitor is signed in but not premium, and the entry is `premium`, show a `403` paywall page with a title, a teaser, and an "Upgrade" button.
- Premium users read the entry. Staff (role of 20 or higher) read everything.
- Use `filterEntries` in the theme to hide protected entries from HTML lists. Otherwise the titles show.
- Use `gateEntry(Astro, entry)` before render only when you cannot use the integration.
- Set the plan per organization and `premium` per user.
- Set `premium` from billing code through the admin API for each member of an organization with an active plan. A Stripe payment does not set it.
- Clear `premium` for all members when the plan ends, and for one member when they leave.
- Set `premium` for a new member of an organization with an active plan.
