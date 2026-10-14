# Architecture

## Code

### [Effect](https://effect.website)

- Use Effect for typed errors, async code, and dependency injection. Do not use Effect Schema.

### [Zod](https://zod.dev)

- Compile schemas at build time with [zod-compiler](https://github.com/gajus/zod-compiler) (Vite plugin in `astro.config`). Do not use `z.compile()`: it uses `new Function()`, which Cloudflare Workers do not allow.
- Use Zod for all schemas and validation. In Effect code, use the `decode` helper to turn Zod results into typed errors.

## Backend

### [Cloudflare Workers](https://developers.cloudflare.com/workers/)

- Use bindings (KV, D1, R2) from the `env` object. Do not call Cloudflare services over public HTTP when a binding exists.
- Do not keep request state in global variables. An isolate serves many requests.
- Use `ctx.waitUntil()` for work after the response, such as logs or analytics. In Astro code, use `Astro.locals.cfContext.waitUntil()`.
- Prefer Web APIs (`fetch`, `Request`, `Response`, Web Crypto) over Node.js APIs. Set `compatibility_date` to `2026-08-04` or later: Node.js APIs are then on by default, so do not add the `nodejs_compat` flag.
- Generate binding types with `wrangler types`. Do not write them by hand.

### Background work

- Pick the smallest tool that works:
  - `waitUntil()` for small work after the response, such as logs.
  - [Queues](https://developers.cloudflare.com/queues/) for single jobs, such as emails or webhooks. They retry and support a dead letter queue.
  - Cron Triggers (`scheduled()`) for jobs on a schedule.
  - [Workflows](https://developers.cloudflare.com/workflows/) for processes with many steps that can run for minutes, days, or weeks.
- Do not use Vercel Workflow DevKit or TanStack Workflow. They have no stable Cloudflare adapter.
- Export Workflows, Durable Objects, and the `queue()` and `scheduled()` handlers from a custom entrypoint, for example `src/worker.ts`. Set `"main": "./src/worker.ts"` in `wrangler.jsonc`. Send Astro requests to `handle(request, env, ctx)` from `@astrojs/cloudflare/handler`.
- Write each workflow as a class that extends `WorkflowEntrypoint` from `cloudflare:workers`. Add it to the `workflows` array in `wrangler.jsonc` (`name`, `binding`, `class_name`). Start it from Astro with `env.MY_WORKFLOW.create({ id, params })`.
- Follow the [rules of Workflows](https://developers.cloudflare.com/workflows/build/rules-of-workflows/):
  - Put each side effect in its own `step.do()`, and make it idempotent: a step can run more than once.
  - Give steps fixed names. Do not put timestamps or random values in them.
  - Do not keep state outside of steps. Pass data to the next step as the return value of a step.
  - `await` every step.
  - Use a unique instance ID, such as an order ID (up to 100 characters: letters, digits, `-`, `_`). `create()` throws an error when the ID is already in use, so handle that error.

## Frontend

### [Astro](https://docs.astro.build/)

- Use `output: "server"` with the `@astrojs/cloudflare` adapter. Add `export const prerender = true` to pages that do not change per request.
- Write UI as `.astro` components by default. Use a UI framework island only when the part must be interactive.
- Pick the lowest hydration directive that works: `client:visible` or `client:idle` before `client:load`.
- Use content collections for Markdown and MDX content. Do not render Markdown per request.
- Use Astro Actions for forms and mutations. Validate input with Zod.
- Read Cloudflare bindings and secrets with `import { env } from "cloudflare:workers"`. Do not use `process.env` or the removed `Astro.locals.runtime` API.
- Use `astro:assets` (`<Image />`) for images. Keep the adapter default `imageService: "cloudflare-binding"`.

### [TanStack](https://tanstack.com)

- Use TanStack libraries only in highly interactive React islands, such as app dashboards. Do not use them on content pages or for simple forms: use Astro Actions there. Do not use TanStack Start: Astro is the framework.
- Islands do not share React context. Do not wrap each island in its own `QueryClientProvider` with a new client. Create one `QueryClient` in a shared module and import it in each island.
- Router: use it only for a client-side app (SPA) inside one `client:only="react"` island, served by a catch-all Astro route such as `src/pages/app/[...path].astro`. For navigation between Astro pages, use Astro `<ClientRouter />`.
- Query: use it for data fetching and caching in islands. Use DB (beta) only when Query is not enough, for example for live queries and optimistic writes on local collections.
- Form: pass Zod schemas to `validators` directly. It supports Standard Schema, so no adapter is needed.
- Table: it is headless, so write the markup and styles yourself. Use Virtual for long lists and tables.
- Store: use it for state that more than one island shares. It is framework agnostic.
- Pacer: use it to debounce, throttle, or rate-limit calls, for example search as you type.
- Hotkeys (alpha): use it only for apps that need keyboard shortcuts, such as a command palette.
- Charts: use it for charts in dashboards. It renders SVG and supports server rendering.
- AI: use it for streaming chat and tool calls. Use the `@tanstack/ai-cloudflare` adapter for Workers AI.
- Markdown and Highlight: use them only for Markdown that arrives at runtime, such as streamed AI output. For site content, use content collections and Astro code highlighting at build time.

## Apps

### Micro frontends: [Astro integrations](https://docs.astro.build/en/reference/integrations-reference/)

- Build each app as a vertical micro frontend: one folder, for example `src/apps/app1/`, that owns all of the app: pages, API routes, middleware, actions, components, islands, repositories, and the `Database` interface.
- Use this layout in each app folder: `integration.ts`, `pages/`, `api/`, `middleware.ts`, `actions.ts`, `components/`, `islands/`, `db/`. Keep the migrations in `migrations/app1/`. Follow the rules in [SAAS.md](SAAS.md) (Multiple apps).
- Register each app as a local Astro integration in `src/apps/app1/integration.ts`, and add it to `integrations` in `astro.config`: `integrations: [emdash(), app1()]`. To remove an app, remove its folder, its line in `astro.config`, and its bindings.
- Add the app routes with `injectRoute()` in the `astro:config:setup` hook. Pass the entrypoint as a URL relative to the integration file: `injectRoute({ pattern: "/app1/[...path]", entrypoint: new URL("./pages/[...path].astro", import.meta.url) })`.
- Do not put app pages in `src/pages/`. Keep `src/pages/` for the site: marketing pages and CMS content.
- Start every route of an app with its prefix: pages at `/app1/...` and API routes at `/app1/api/...`.
- Add app middleware with `addMiddleware({ entrypoint: new URL("./middleware.ts", import.meta.url), order: "pre" })`. It runs on every request, so return `next()` at once when `context.url.pathname` does not start with the app prefix.
- Define app actions in `src/apps/app1/actions.ts` as one object (`export const app1 = { create, update }`). Add it to `src/actions/index.ts` as a group: `export const server = { app1 }`. Call it as `actions.app1.create`.
- Use relative imports inside an app. Use `@/` imports only for shared code.
- Do not import from another app folder. Share code only through `src/lib/`, `src/layouts/`, and `src/components/ui/`.
- Do not read the database binding of another app. To use its data, call its API route or send a message to a Queue.
- Use the shared base layout from `src/layouts/` in all apps, so all apps have the same header, theme, and login.
- Do not share island state between apps. Each app has its own stores.
- When an app must deploy on its own, move its folder to a separate Astro project and Worker. Keep the same domain and add a Workers route for the path, for example `example.com/app1/*`: the most specific route wins, and the login cookie still works. Read [WHY.md](../WHY.md#when-to-split-the-app-into-a-separate-worker) first.
