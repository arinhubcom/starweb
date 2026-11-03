# EMAIL

## Transactional email

### [React Email](STACK.md#react-email)

- Transactional emails as React Email components.
- Send all email only through [Cloudflare Email Service](STACK.md#cloudflare-email-service). No other provider or SMTP.
- One email module for app emails: `send()` on the same `send_email` binding (`EMAIL`) and sender domain as the EmDash email provider. Binding setup → [AUTH](AUTH.md) (Email). Docs: [Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/).
- No auth emails (verification, password reset, magic link, invites) from app code; emdash-better-auth sends them via the EmDash email provider.
- App emails (not auth) sent from a [Queues](STACK.md#queues) consumer, not in the request (retries).

### [emailcn](STACK.md#emailcn)

- Start templates from emailcn components and blocks, React Email variant.
- `npx shadcn@latest add @emailcn/react-email/block-onboarding-default`; no hand copy. Your code after install; edit to the brand.
