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
- Send as little JavaScript to the browser as possible. Astro renders components to HTML and CSS and removes client JavaScript by default. Keep it that way, and add JavaScript only for a part that must be interactive.
- Pick the first option that works, in this order: static `.astro` HTML and CSS, native HTML (`<details>`, `popover` with `popovertarget`, a `<form>` with an Astro Action), a `<script>` in the component, a server island, and a React island last.
- Write UI as `.astro` components by default. Use a UI framework island only when the part must be interactive. Follow the rules in [COMPONENTS.md](COMPONENTS.md).
- Submit forms with `<form method="POST" action={actions.name}>` and read the result with `Astro.getActionResult()`. Do not add an island only to send a form. The page must render on demand (no `prerender`).
- Use a server island (`server:defer`) for slow or per-user parts of a page, such as an avatar or a cart count. Do not fetch them with client JavaScript.
- Pick the lowest hydration directive that works: `client:visible`, `client:idle`, or `client:media` before `client:load`. Use `client:only` only when the component cannot render on the server.
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

### App admin: [EmDash native plugins](https://docs.emdashcms.com/plugins/creating-native-plugins/react-admin/)

- Build the admin of each app as a native EmDash plugin in the app folder: `src/apps/app1/admin/` with `descriptor.ts`, `plugin.ts`, and `pages.tsx`. Do not make a separate npm package.
- Register it in the EmDash integration, next to the app integration: `integrations: [emdash({ plugins: [app1Admin()] }), app1()]`.
- Put the descriptor factory in `descriptor.ts` and import only that file in `astro.config`. Return `id`, `version`, `format: "native"`, `entrypoint`, and `adminEntry`.
- Put the runtime in `plugin.ts`: `export default function createPlugin() { return definePlugin({ ... }) }` with `routes` and `admin.pages`.
- Set `entrypoint` and `adminEntry` as paths from the project root: `"/src/apps/app1/admin/plugin.ts"` and `"/src/apps/app1/admin/pages.tsx"`. Do not build them with `import.meta.url`: `plugin.ts` runs in the Worker, where `new URL(..., import.meta.url)` throws "Invalid URL string", EmDash does not start, and all `/_emdash` routes return 404.
- Export the admin entry path as a constant from `descriptor.ts`, and use it for both `adminEntry` and `admin.entry`. The two values must be the same.
- Name the plugin `<app>-admin`, for example `app1-admin`. Its pages are at `/_emdash/admin/plugins/app1-admin/<path>` and its routes at `/_emdash/api/plugins/app1-admin/<route>`.
- Put all pages of an app in one sidebar group with the app name: `pages: [{ path: "/items", label: "Items", group: "App1" }]`.
- Import the app repositories in the route handler with `await import("../db/items")`. Do not use `Astro.locals` in handlers: they get the plugin context.
- Set a `permission` on each route. The default `plugins:manage` allows only administrators. Call the routes from admin pages with `apiFetch()` from `emdash/plugin-utils`.
- Use plugin routes only for staff. Keep the routes for customers in the app (`/app1/api/...`).
- Test admin pages locally after you log in with `/_emdash/api/auth/dev-bypass`.
