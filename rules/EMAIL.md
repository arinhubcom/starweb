# EMAIL

## Transactional email

### [React Email](https://react.email)

- Write transactional emails with React Email components.
- Send app emails through one email module. Use the same provider and sender domain as the EmDash email provider ([Cloudflare Email Service](https://developers.cloudflare.com/email-service/) or [Resend](https://resend.com)), so auth and app emails share one setup. Set up the provider as in [AUTH.md](AUTH.md) (Email).
- Do not send auth emails (verification, password reset, magic link, invites) from app code. emdash-better-auth sends them through the EmDash email provider.
- Send app emails from a Queue consumer, not in the request. A Queue retries failed sends. This rule covers app emails only, not auth emails.

### [emailcn](https://emailcn.run/docs)

- Start email templates from emailcn components and blocks. Use the React Email variant, so they match the React Email rule above.
- Install them with the shadcn CLI and the `@emailcn` registry, for example `npx shadcn@latest add @emailcn/react-email/block-onboarding-default`. Do not copy the code by hand.
- Edit the installed components in your project to match the brand. They are your code after install, not a package.
