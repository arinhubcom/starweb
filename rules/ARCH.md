# ARCH

## Code

### [Effect](STACK.md#effect)

- Typed errors, async, DI. No Effect Schema.
- Effect 4 names: `Effect.catch`, not `Effect.catchAll` (Effect 3).

### [Zod](STACK.md#zod)

- All schemas and validation in Zod.
- Compile at build time with [zod-compiler](https://github.com/gajus/zod-compiler): Vite plugin in `astro.config`, default import `import zodCompiler from "zod-compiler/vite"`. No `z.compile()` (`new Function()` is blocked on Workers, silently falls back to the slow runtime parser).
- Effect code: `decode(schema, input): Effect<Output, ValidationError>` in `src/lib/effect/decode.ts`. No `schema.parse()` (throws).
- Same file: `class ValidationError extends Data.TaggedError("ValidationError")<{ error: z.ZodError }> {}`. `decode` uses `safeParse`: `Effect.succeed(result.data)` or `Effect.fail(new ValidationError({ error: result.error }))`.

## Backend

### [Workers](STACK.md#workers)

- Bindings (KV, D1, R2) from `env`; no public HTTP to a Cloudflare service that has a binding.
- No request state in globals.
- `ctx.waitUntil()` for post-response work; in Astro `Astro.locals.cfContext.waitUntil()`.
- Web APIs over Node.js APIs. `compatibility_date` ≥ `2026-08-04` (Node.js APIs on by default); no `nodejs_compat` flag.
- Binding types: `wrangler types`, never by hand.

### Background work

- Smallest tool that works:
  - `waitUntil()`: small post-response work (logs).
  - [Queues](STACK.md#queues): single jobs (email, webhooks).
  - Cron Triggers (`scheduled()`): schedules.
  - [Workflows](STACK.md#workflows): multi-step, minutes to weeks.
- Consumer in `queues.consumers` (`wrangler.jsonc`): `queue`, `max_batch_size` (10), `max_retries` (3), `dead_letter_queue`. Without a DLQ, messages are deleted after `max_retries`. DLQ needs its own consumer (deleted after 4 days otherwise).
- `queue(batch, env, ctx)`: `message.ack()` per success, `message.retry()` per failure. Never throw per message (retries the whole batch).
- Idempotent consumers (at-least-once): unique ID per message as insert primary key or upstream idempotency key.
- Repeat `queues.producers` and `queues.consumers` in `env.production` (not inherited). → [DEPLOY](DEPLOY.md) (Environments)
- No Vercel Workflow DevKit or TanStack Workflow (no stable Cloudflare adapter).
- Export Workflows, Durable Objects, `queue()` from custom entrypoint `src/worker.ts` (EmDash template; `"main": "./src/worker.ts"`).
- Keep `...handler` from `@emdash-cms/cloudflare/worker` and `scheduled: createScheduledHandler()`. No `handle()` from `@astrojs/cloudflare/handler` (EmDash handler also publishes scheduled entries and purges cache tags).
- Workflow = class extending `WorkflowEntrypoint` (`cloudflare:workers`); register in `workflows` (`name`, `binding`, `class_name`); start with `env.MY_WORKFLOW.create({ id, params })`.
- Workflows rules:
  - One side effect per `step.do()`, idempotent.
  - Fixed step names (no timestamps or random values).
  - No state outside steps; pass data as step return values.
  - `await` every step.
  - Unique instance ID (order ID; ≤ 100 chars: letters, digits, `-`, `_`); handle `create()` throwing on a duplicate.

## Frontend

### [Astro](STACK.md#astro)

- `output: "server"` + `@astrojs/cloudflare`. `export const prerender = true` on static pages.
- Minimal client JS. Order: static `.astro` HTML/CSS → native HTML (`<details>`, `popover`/`popovertarget`, `<form>` + Action) → component `<script>` → server island → React island.
- `.astro` components by default; islands only for interactivity. → [COMPONENTS](COMPONENTS.md)
- Forms: `<form method="POST" action={actions.name}>` + `Astro.getActionResult()`. No island just to submit. Page must render on demand.
- Server islands (`server:defer`) for slow or per-user parts (avatar, cart count); no client fetch.
- Lowest hydration directive: `client:visible`, `client:idle`, `client:media` before `client:load`. `client:only` only when SSR is impossible.
- Content collections for Markdown and MDX; no per-request Markdown rendering.
- Actions for forms and mutations, Zod input.
- Bindings and secrets: `import { env } from "cloudflare:workers"`. No `process.env`, no `Astro.locals.runtime`.
- Images: `astro:assets` `<Image />`, keep `imageService: "cloudflare-binding"`.

### [TanStack](STACK.md#tanstack)

- Only in highly interactive [React](STACK.md#react) islands (dashboards). Not on content pages or simple forms (Actions). No TanStack Start.
- Islands share no React context: one `QueryClient` in a shared module imported by each island; no per-island `QueryClientProvider` with a new client.
- Router: only for an SPA in one `client:only="react"` island at the app catch-all `src/apps/app1/pages/[...path].astro` (injected at `/app1/[...path]`, see Apps). Between Astro pages: `<ClientRouter />`.
- Query: fetching and caching. DB (beta) only when Query is not enough (live queries, optimistic writes on local collections).
- Form: Zod schemas straight into `validators` (Standard Schema).
- Table: headless; Virtual for long lists.
- Store: state shared across islands.
- Pacer: debounce, throttle, rate-limit (search as you type).
- Hotkeys (alpha): only for apps needing shortcuts (command palette).
- Charts: dashboard charts (SVG, SSR).
- AI: streaming chat and tool calls; `@tanstack/ai-cloudflare` for Workers AI.
- Markdown and Highlight: only runtime Markdown (streamed AI output). Site content: collections + Astro build-time highlighting.

## Apps

### Micro frontends: Astro integrations

- Vertical micro frontend per app: one folder `src/apps/app1/` owns pages, API routes, middleware, actions, components, islands, repositories, `Database` interface.
- Layout: `integration.ts`, `pages/`, `api/`, `middleware.ts`, `actions.ts`, `components/`, `islands/`, `db/`. Migrations in `migrations/app1/`. → [SAAS](SAAS.md) (Multiple apps)
- Local Astro integration `src/apps/app1/integration.ts`, in `integrations: [emdash(), app1()]`. Removing an app = folder + `astro.config` line + bindings.
- Routes: `injectRoute()` in `astro:config:setup`, entrypoint relative: `injectRoute({ pattern: "/app1/[...path]", entrypoint: new URL("./pages/[...path].astro", import.meta.url) })`.
- API route files likewise, full pattern: `injectRoute({ pattern: "/app1/api/v1/items", entrypoint: new URL("./api/items.ts", import.meta.url) })`; export `GET`, `POST`, etc.
- No app pages in `src/pages/` (site only: marketing, CMS content).
- Every route starts with the prefix: pages `/app1/...`, API `/app1/api/...`.
- Middleware: `addMiddleware({ entrypoint: new URL("./middleware.ts", import.meta.url), order: "pre" })`. Runs on every request → `next()` at once when `context.url.pathname` lacks the prefix. Type `MiddlewareHandler` (`import type { MiddlewareHandler } from "astro"`); no `defineMiddleware` from `astro:middleware` (Vitest cannot import it).
- Actions: `src/apps/app1/actions.ts` as one object (`export const app1 = { create, update }`); in `src/actions/index.ts`: `export const server = { app1 }`; call `actions.app1.create`.
- Relative imports inside an app; `@/` only for shared code.
- No imports from another app folder. Share via `src/lib/`, `src/layouts/`, `src/components/ui/`.
- Never read another app's database binding → its API route or a Queue message.
- Shared base layout from `src/layouts/` (same header, theme, login).
- No island state shared between apps; own stores.
- Independent deploy → separate Astro project + Worker, same domain, Workers route (`example.com/app1/*`; most specific wins, login cookie works). Read [WHY.md](../WHY.md#when-to-split-the-app-into-a-separate-worker) first. → [DEPLOY](DEPLOY.md) (Separate Workers)

### App admin: [EmDash](STACK.md#emdash) native plugins

- Admin = native EmDash plugin in the app folder `src/apps/app1/admin/`: `descriptor.ts`, `plugin.ts`, `pages.tsx`. No separate npm package. UI: [Kumo](STACK.md#kumo). → [DESIGN](DESIGN.md)
- Register: `integrations: [emdash({ plugins: [app1Admin()] }), app1()]`.
- `descriptor.ts` holds the factory (only file imported in `astro.config`): returns `id`, `version`, `format: "native"`, `entrypoint`, `adminEntry`.
- `plugin.ts`: `export function createPlugin() { return definePlugin({ ... }) }` (named export; EmDash imports `{ createPlugin }`) with `routes` and `admin.pages`.
- `entrypoint`/`adminEntry` = project-root paths: `"/src/apps/app1/admin/plugin.ts"`, `"/src/apps/app1/admin/pages.tsx"`. No `import.meta.url` (`new URL` throws "Invalid URL string" in the Worker; EmDash fails, `/_emdash` routes 404).
- Admin entry path as one constant in `descriptor.ts`, used for both `adminEntry` and `admin.entry` (must match).
- Name `<app>-admin` (`app1-admin`). Pages `/_emdash/admin/plugins/app1-admin/<path>`, routes `/_emdash/api/plugins/app1-admin/<route>`.
- One sidebar group per app: `pages: [{ path: "/items", label: "Items", group: "App1" }]`.
- Repositories in route handlers via `await import("../db/items")`. No `Astro.locals` (handlers get the plugin context).
- `permission` on each route (default `plugins:manage` = administrators only). Admin pages call routes with `apiFetch()` from `emdash/plugin-utils`.
- Plugin routes for staff only; customer routes in `/app1/api/...`.
- Test admin pages locally after login via `/_emdash/api/auth/dev-bypass`.
