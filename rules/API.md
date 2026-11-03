# API

## Contract

### [OpenAPI](STACK.md#openapi)

- One document per app = contract for every interface (API routes, islands, external clients, agents, MCP tools). No request or response shape outside it.
- 3.1 (`openapi: "3.1.1"`). No 3.2 yet: zod-openapi, openapi-typescript, [openapi-fetch](STACK.md#openapi-fetch) lack support.
- Each operation: unique `operationId`, `summary`, `description`.
- Publish at `/app1/api/openapi.json` from `src/apps/app1/api/openapi.ts` (imports generated JSON, returns `Response.json()`), injected in `integration.ts` with `injectRoute({ pattern: "/app1/api/openapi.json", entrypoint: new URL("./api/openapi.ts", import.meta.url) })`. Operations live under `/app1/api/v1/`. → [ARCH](ARCH.md) (Apps)

### Parameters and properties

- One name, one purpose: `image` = path (`/media/cover.jpg`), never also URL, base64, or object. Other forms get their own field (`imageUrl`, `imageAlt`). A field's meaning never depends on another field's value.
- One name per thing across the contract (`organizationId` everywhere); no two names for one thing, no one name for two things.
- No generic names (`data`, `value`, `info`, `params`).
- No free-form object input. `z.strictObject()` for request bodies.
- Each parameter and property: `description` (purpose) and `example`.
- Narrowest type: `format` (`uri`, `date-time`, `email`, `uuid`), `pattern`, `enum` for closed lists, `minimum`, `maximum`, `maxLength`.
- camelCase for JSON properties and query parameters.

### [zod-openapi](STACK.md#zod-openapi)

- Contract = [Zod](STACK.md#zod) schemas in `src/apps/app1/api/schemas.ts`, also used to validate requests. No hand-written OpenAPI.
- `.meta({ description, example })`. `id` in `.meta()` only on reused schemas (moves to `components` as `$ref`; duplicate `id` throws).
- Parameters: `requestParams: { path, query, header, cookie }`, one `z.object()` per location.
- `createDocument()` in Node script `scripts/openapi.ts` → `src/apps/app1/api/openapi.json`. Run `npx tsx scripts/openapi.ts`. Never import `createDocument()` in Worker code.
- Operations (`paths`, `requestParams`, `requestBody`, `responses`) in `scripts/openapi.ts`, importing from `schemas.ts`. None in `schemas.ts`.
- Commit the generated file. CI regenerates and fails on `git diff --exit-code`.

### [Redocly CLI](STACK.md#redocly-cli)

- CI: `redocly lint`. `redocly.yaml` extends `recommended`; `parameter-description`, `operation-description`, `operation-operationId` = `error`.
- Property descriptions: code review (`parameter-description` covers parameters only).

### [oasdiff](STACK.md#oasdiff)

- Each PR: `oasdiff breaking` against `main`'s document. `oasdiff/oasdiff-action` pinned to a commit SHA; fail on breaking.
- No breaking change to a published operation → add field or operation, mark old `deprecated: true`, remove when unused.
- Batched breaking changes → new prefix (`/app1/api/v2/`).

## Clients

### [openapi-fetch](STACK.md#openapi-fetch)

- Types: `npx openapi-typescript src/apps/app1/api/openapi.json -o src/apps/app1/api/openapi.d.ts`.
- Islands: `createClient<paths>({ baseUrl })` in the [TanStack](STACK.md#tanstack) Query `queryFn`. No hand-typed `fetch`.
- MCP and agent tools built from the same Zod schemas. No second schema.

## Routes

### [Astro](STACK.md#astro) endpoints

- Actions: forms and mutations from app pages. API routes: contract operations (islands, external clients, agents, webhooks). → [ARCH](ARCH.md) (Astro)
- Under the app prefix `/app1/api/v1/`. → [ARCH](ARCH.md) (Apps)
- One handler per method, `satisfies APIRoute`. Add `ALL` returning `405` + `Allow` (otherwise `404`).
- Validate path, query, headers, body with contract schemas first; `400` with invalid fields.
- Return only the statuses and shapes the contract defines.

### Pagination

- Cursor ([AIP-158](https://google.aip.dev/158)): `cursor` + `limit` params, `nextCursor` in response, max `limit` in schema. No page numbers or offsets.

### Idempotency

- `Idempotency-Key` header on `POST` that creates a resource or starts a payment. Store key + response; replay on repeat. [IETF draft](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/), not an RFC.

## Errors

### [RFC 9457](STACK.md#rfc-9457)

- Every error: `application/problem+json` with `type`, `title`, `status`, `detail`. No other shape.
- Field errors: `errors` extension, items `{ pointer: "#/email", detail }`; `#/` = whole body.
- Each error `type` URI and status defined in the contract as a reused `components` response.
- Typed [Effect](STACK.md#effect) error → status + `type` in one module, `src/lib/api/errors.ts`.
- No stack traces, SQL, or internal IDs in `detail`; log them.

## Auth

### [EmDash](STACK.md#emdash) authentication

- Start of each protected API route: check `locals.user` and role; `401`/`403` problem details, no redirect. → [AUTH](AUTH.md)
- Filter each query by `tenant_id`. → [SAAS](SAAS.md) (Data)

### API keys

- No `@better-auth/api-key` in [emdash-better-auth](STACK.md#emdash-better-auth): cannot load server-side plugins ([#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)); its API keys page is staff only.
- Customer keys in the app database as SHA-256 hash (`crypto.subtle.digest`). Show the key once.
- Row: `tenant_id`, creator `user_id`, name, scopes, `created_at`, `last_used_at`, `revoked_at`. Reject when `revoked_at` is set.
- `tenant_id` comes from the key row, never from path, query, header, or body. → [SAAS](SAAS.md) (Data)
- Rate limit per key (Limits).
- Only `Authorization: Bearer <key>`; never the query string.

## Security

### Astro security

- Do not rely on `security.checkOrigin`: the EmDash integration sets `false`. Check `Origin` in app middleware for all unsafe methods and content types; `403` cross-origin. → [SECURITY](SECURITY.md) (CSRF)
- `415` for `POST`/`PUT`/`PATCH`/`DELETE` with a body to a session-cookie route when the `Content-Type` media type (parameters stripped, so `application/json; charset=utf-8` passes) is not `application/json`. Skip bodiless requests. The middleware origin check covers other content types.
- CORS in app middleware (Astro has none): allowlist of origins, answer `OPTIONS`. No `Access-Control-Allow-Origin: *` on cookie routes.

## Limits

### Rate Limiting binding ([Workers](STACK.md#workers))

- `const { success } = await env.API_LIMITER.limit({ key })` per API key or user. `ratelimits` in `wrangler.jsonc`: `simple: { limit, period }`, `period` 10 or 60 s.
- `429` + `Retry-After` when `success` is `false`.
- Not for exact quotas (per-location, eventually consistent). → [SAAS](SAAS.md) (Plan limits)

## Webhooks

### [Standard Webhooks](STACK.md#standard-webhooks)

- Incoming: `await request.text()`, verify `webhook-signature` on the raw text before parsing.
- Reject `webhook-timestamp` more than 5 minutes from now.
- `webhook-id` = idempotency key; never process an ID twice.
- Return `2xx` fast; work in a [Queues](STACK.md#queues) consumer. → [ARCH](ARCH.md) (Background work)
- Payment providers → [PAYMENTS](PAYMENTS.md). Outgoing → [SAAS](SAAS.md) (Outgoing webhooks).
