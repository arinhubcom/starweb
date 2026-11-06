# EMAIL

This file covers the emails that your app sends. Read it before you add a transactional email.

## Send an app email

- Send all email only through [Cloudflare Email Service](STACK.md#cloudflare-email-service). Use no other provider and no SMTP.
- Use one email module for app emails. It calls `send()` on the same `send_email` binding (`EMAIL`) and sender domain as the EmDash email provider.
- For the binding setup, see [AUTH](AUTH.md#send-auth-email). For the API, see the [Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/).
- Do not send auth emails (verification, password reset, magic link, invites) from app code. emdash-better-auth sends them through the EmDash email provider.
- Send app emails from a [Queues](STACK.md#queues) consumer, not in the request, so that retries work.

## Write an email template

- Write transactional emails as [React Email](STACK.md#react-email) components.
- Start templates from [emailcn](STACK.md#emailcn) components and blocks, in the React Email variant.
- Install a block with `pnpm dlx shadcn@latest add @emailcn/react-email/block-onboarding-default`. Do not copy it by hand.
- The installed block is your code. Edit it to match the brand.
