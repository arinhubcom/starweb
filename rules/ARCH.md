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
