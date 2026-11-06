# ARCH

Read this file when you write code, add background work, build pages, or add an app to a project.

## Write code

### Use [Effect](STACK.md#effect)

- Use Effect for typed errors, async work, and dependency injection.
- Do not use Effect Schema.
- Use the Effect 4 name `Effect.catch`, not `Effect.catchAll` from Effect 3.

### Use [Zod](STACK.md#zod)

- Write all schemas and validation in Zod.
- Compile schemas at build time with [zod-compiler](https://github.com/gajus/zod-compiler).
- Do not call `z.compile()`. Workers block `new Function()`, so it silently falls back to the slow runtime parser.
- In Effect code, use `decode` from `src/lib/effect/decode.ts`.
- Do not call `schema.parse()` in Effect code, because it throws.

## Write Worker code

### Use [Workers](STACK.md#workers)

- Read bindings (KV, D1, R2) from `env`.
- Do not call a Cloudflare service over public HTTP when it has a binding.
- Do not keep request state in globals.
- Use `ctx.waitUntil()` for work after the response. In Astro, use `Astro.locals.cfContext.waitUntil()`.
- Use Web APIs, not Node.js APIs. Do not add the `nodejs_compat` flag.
- Generate binding types with `wrangler types`. Never write them by hand.

### Run background work

Pick the smallest tool that works.

- Use `waitUntil()` for small work after the response, such as logs.
- Use [Queues](STACK.md#queues) for single jobs, such as email and webhooks.
- Use Cron Triggers (`scheduled()`) for schedules.
- Use [Workflows](STACK.md#workflows) for multi-step work that runs from minutes to weeks.
- Do not use Vercel Workflow DevKit or TanStack Workflow. They have no stable Cloudflare adapter.
- Export Workflows, Durable Objects, and `queue()` from `src/worker.ts`.
- Do not use `handle()` from `@astrojs/cloudflare/handler`. The EmDash handler also publishes scheduled entries and purges cache tags.

### Add a queue consumer

- Configure each consumer in `queues.consumers` in `wrangler.jsonc`.
- Set `queue`, `max_batch_size` (10), `max_retries` (3), and `dead_letter_queue`.
- Without a dead letter queue, Queues deletes messages after `max_retries`.
- Give the dead letter queue its own consumer. Otherwise Queues deletes its messages after 4 days.
- Write the handler as `queue(batch, env, ctx)`.
- Call `message.ack()` for each success and `message.retry()` for each failure.
- Never throw per message. A throw retries the whole batch.
- Make consumers idempotent, because delivery is at-least-once.
- Use a unique ID per message as the insert primary key or as the upstream idempotency key.
- Repeat `queues.producers` and `queues.consumers` in `env.production`, because the environment does not inherit them. See [DEPLOY](DEPLOY.md#wrangler-config).

### Add a Workflow

- Write a Workflow as a class that extends `WorkflowEntrypoint` from `cloudflare:workers`.
- Register it in `workflows` with `name`, `binding`, and `class_name`.
- Start it with `env.MY_WORKFLOW.create({ id, params })`.
- Run one side effect in each `step.do()`, and make it idempotent.
- Use fixed step names. Do not use timestamps or random values.
- Keep no state outside steps. Pass data as step return values.
- Use `await` on every step.
- Use a unique instance ID, such as the order ID. It has at most 100 characters: letters, digits, `-`, and `_`.
- Handle `create()` throwing on a duplicate ID.

## Build pages with [Astro](STACK.md#astro)

- Set `export const prerender = true` on static pages.
- Ship minimal client JavaScript. Choose the first option that works, in this order:
  1. Static `.astro` HTML and CSS.
  2. Native HTML: `<details>`, `popover` with `popovertarget`, or `<form>` with an Action.
  3. A component `<script>`.
  4. A server island.
  5. A React island.
- Use `.astro` components by default. Use islands only for interactivity. See [COMPONENTS](COMPONENTS.md).
- Write forms as `<form method="POST" action={actions.name}>` and read the result with `Astro.getActionResult()`.
- Do not add an island only to submit a form. The page must render on demand.
- Use server islands (`server:defer`) for slow or per-user parts, such as an avatar or a cart count. Do not fetch them on the client.
- Use the lowest hydration directive: `client:visible`, `client:idle`, or `client:media` before `client:load`.
- Use `client:only` only when server rendering is impossible.
- Use content collections for Markdown and MDX. Do not render Markdown per request.
- Use Actions for forms and mutations, with Zod input.
- Read bindings and secrets with `import { env } from "cloudflare:workers"`.
- Do not use `process.env` or `Astro.locals.runtime`.
- Show images with the `astro:assets` `<Image />` component. Keep the default `imageService`.

### Use [TanStack](STACK.md#tanstack) in islands

- Use TanStack only in highly interactive [React](STACK.md#react) islands, such as dashboards.
- Do not use TanStack on content pages or for simple forms. Use Actions for forms.
- Do not use TanStack Start.
- Islands share no React context. Import one `QueryClient` from a shared module in each island.
- Do not add a `QueryClientProvider` with a new client in each island.
- Use Router only for an SPA.
- Mount the SPA in one `client:only="react"` island at the app catch-all `src/apps/app1/pages/[...path].astro`.
- The integration injects the catch-all at `/app1/[...path]`.
- Between Astro pages, use `<ClientRouter />`.
- Use Query for fetching and caching.
- Use DB (beta) only when Query is not enough, for example for live queries or optimistic writes on local collections.
- Use Form with Zod schemas passed straight into `validators` (Standard Schema).
- Use Table for headless tables, and Virtual for long lists.
- Use Store for state shared across islands.
- Use Pacer to debounce, throttle, or rate-limit, such as search as you type.
- Use Hotkeys (alpha) only for apps that need shortcuts, such as a command palette.
- Use Charts for dashboard charts (SVG, server-rendered).
- Use AI for streaming chat and tool calls. Use `@tanstack/ai-cloudflare` for Workers AI.
- Use Markdown and Highlight only for runtime Markdown, such as streamed AI output.
- For site content, use collections and Astro build-time highlighting.

## Add an app

### Add a micro frontend as an Astro integration

- Build each app as a vertical micro frontend in one folder, `src/apps/app1/`.
- The folder owns the pages, API routes, middleware, actions, components, islands, repositories, and `Database` interface.
- Use this layout: `integration.ts`, `pages/`, `api/`, `middleware.ts`, `actions.ts`, `components/`, `islands/`, and `db/`.
- Put migrations in `migrations/app1/`. See [SAAS](SAAS.md#give-each-app-a-d1-database).
- Write a local Astro integration in `src/apps/app1/integration.ts`, and add it as `integrations: [emdash(), app1()]`.
- To remove an app, delete its folder, its `astro.config` line, and its bindings.
- Inject routes with `injectRoute()` in the `astro:config:setup` hook.
- Make the entrypoint relative to the integration file, for example: `injectRoute({ pattern: "/app1/[...path]", entrypoint: new URL("./pages/[...path].astro", import.meta.url) })`.
- Inject API route files the same way, with the full pattern: `injectRoute({ pattern: "/app1/api/v1/items", entrypoint: new URL("./api/items.ts", import.meta.url) })`.
- Export `GET`, `POST`, and the other method handlers from API route files.
- Do not put app pages in `src/pages/`. That folder is for the site: marketing and CMS content.
- Start every route with the app prefix: pages at `/app1/...` and API routes at `/app1/api/...`.
- Add middleware with `addMiddleware({ entrypoint: new URL("./middleware.ts", import.meta.url), order: "pre" })`.
- Middleware runs on every request. Call `next()` at once when `context.url.pathname` lacks the prefix.
- Type middleware as `MiddlewareHandler` with `import type { MiddlewareHandler } from "astro"`.
- Do not use `defineMiddleware` from `astro:middleware`, because Vitest cannot import it.
- Write actions in `src/apps/app1/actions.ts` as one object: `export const app1 = { create, update }`.
- In `src/actions/index.ts`, write `export const server = { app1 }`. Call `actions.app1.create`.
- Use relative imports inside an app. Use `@/` only for shared code.
- Do not import from another app folder. Share code through `src/lib/`, `src/layouts/`, or `src/components/ui/`.
- Never read the database binding of another app. Call its API route or send a Queue message.
- Use a shared base layout from `src/layouts/`, so that header, theme, and login match.
- Do not share island state between apps. Give each app its own stores.
- For an independent deploy, use a separate Astro project and Worker on the same domain, with a Workers route such as `example.com/app1/*`.
- The most specific route wins, and the login cookie keeps working.
- Read [WHY.md](../WHY.md#when-to-split-the-app-into-a-separate-worker) first. See [DEPLOY](DEPLOY.md#separate-workers).

### Add an app admin as an [EmDash](STACK.md#emdash) native plugin

- Build the admin as a native EmDash plugin in the app folder `src/apps/app1/admin/`, with `descriptor.ts`, `plugin.ts`, and `pages.tsx`.
- Do not publish a separate npm package.
- Build the UI with [Kumo](STACK.md#kumo). See [DESIGN](DESIGN.md).
- Register the plugin as `integrations: [emdash({ plugins: [app1Admin()] }), app1()]`.
- Put the factory in `descriptor.ts`. It is the only file that `astro.config` imports.
- The factory returns `id`, `version`, `format: "native"`, `entrypoint`, and `adminEntry`.
- In `plugin.ts`, write `export function createPlugin() { return definePlugin({ ... }) }` with `routes` and `admin.pages`.
- Use the named export, because EmDash imports `{ createPlugin }`.
- Write `entrypoint` and `adminEntry` as project-root paths: `"/src/apps/app1/admin/plugin.ts"` and `"/src/apps/app1/admin/pages.tsx"`.
- Do not use `import.meta.url` for them. `new URL` throws "Invalid URL string" in the Worker, EmDash fails, and `/_emdash` routes return 404.
- Define the admin entry path as one constant in `descriptor.ts`. Use it for both `adminEntry` and `admin.entry`, which must match.
- Name the plugin `<app>-admin`, for example `app1-admin`.
- Admin pages are at `/_emdash/admin/plugins/app1-admin/<path>`. Routes are at `/_emdash/api/plugins/app1-admin/<route>`.
- Add one sidebar group per app: `pages: [{ path: "/items", label: "Items", group: "App1" }]`.
- Load repositories in route handlers with `await import("../db/items")`.
- Do not use `Astro.locals` in route handlers. They get the plugin context.
- Set `permission` on each route. The default is `plugins:manage`, which means administrators only.
- Call routes from admin pages with `apiFetch()` from `emdash/plugin-utils`.
- Use plugin routes for staff only. Put customer routes in `/app1/api/...`.
- Test admin pages locally after you log in through `/_emdash/api/auth/dev-bypass`.
