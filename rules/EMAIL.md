# EMAIL

## Transactional email

### [React Email](https://react.email)

- Write transactional emails with React Email components.
- Send email through one email module. Use the email provider that EmDash uses ([Cloudflare Email Service](https://developers.cloudflare.com/email-service/) or [Resend](https://resend.com)), so auth and app emails share one setup.
- Send emails from a Queue consumer, not in the request. A Queue retries failed sends.

### [emailcn](https://emailcn.run/docs)

- Start email templates from emailcn components and blocks. Use the React Email variant, so they match the React Email rule above.
- Install them with the shadcn CLI and the `@emailcn` registry, for example `npx shadcn@latest add @emailcn/react-email/block-onboarding-default`. Do not copy the code by hand.
- Edit the installed components in your project to match the brand. They are your code after install, not a package.
