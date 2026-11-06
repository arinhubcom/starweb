# API

Read this file when you design, build, secure, or change an HTTP API, its contract, or its webhooks in an app.

## Define the contract

### Use [OpenAPI](STACK.md#openapi)

- Keep one OpenAPI document per app. It is the contract for every interface: API routes, islands, external clients, agents, and MCP tools.
- Define no request or response shape outside the document.
- Use OpenAPI 3.1 (`openapi: "3.1.1"`).
- Do not use 3.2 yet, because zod-openapi, openapi-typescript, and [openapi-fetch](STACK.md#openapi-fetch) do not support it.
- Give each operation a unique `operationId`, a `summary`, and a `description`.
- Publish the document at `/app1/api/openapi.json`.
- Serve it from `src/apps/app1/api/openapi.ts`, which imports the generated JSON and returns `Response.json()`.
- Inject the route in `integration.ts`: `injectRoute({ pattern: "/app1/api/openapi.json", entrypoint: new URL("./api/openapi.ts", import.meta.url) })`.
- Put operations under `/app1/api/v1/`. See [ARCH](ARCH.md#add-a-micro-frontend-as-an-astro-integration).

### Name parameters and properties

- Give one name one purpose. For example, `image` is a path such as `/media/cover.jpg`. It is never also a URL, base64, or an object.
- Give other forms their own field, such as `imageUrl` and `imageAlt`.
- Never let the meaning of a field depend on the value of another field.
- Use one name per thing across the contract, such as `organizationId` everywhere. Do not use two names for one thing or one name for two things.
- Do not use generic names such as `data`, `value`, `info`, or `params`.
- Do not accept free-form object input. Use `z.strictObject()` for request bodies.
- Give each parameter and property a `description` of its purpose and an `example`.
- Use the narrowest type: `format` (`uri`, `date-time`, `email`, `uuid`), `pattern`, `enum` for closed lists, `minimum`, `maximum`, and `maxLength`.
- Use camelCase for JSON properties and query parameters.

### Generate the document with [zod-openapi](STACK.md#zod-openapi)

- Write the contract as [Zod](STACK.md#zod) schemas in `src/apps/app1/api/schemas.ts`. Use the same schemas to validate requests.
- Do not write OpenAPI by hand.
- Add `.meta({ description, example })` to schemas.
- Set `id` in `.meta()` only on reused schemas. It moves the schema to `components` as a `$ref`, and a duplicate `id` throws.
- Describe parameters with `requestParams: { path, query, header, cookie }`, with one `z.object()` per location.
- Call `createDocument()` in the Node script `scripts/openapi.ts`. It writes `src/apps/app1/api/openapi.json`.
- Run the script with `pnpm exec tsx scripts/openapi.ts`.
- Never import `createDocument()` in Worker code.
- Write the operations (`paths`, `requestParams`, `requestBody`, `responses`) in `scripts/openapi.ts`, importing from `schemas.ts`. Put none in `schemas.ts`.
- Commit the generated file. CI regenerates it and fails on `git diff --exit-code`.

### Lint the document with [Redocly CLI](STACK.md#redocly-cli)

- Run `redocly lint` in CI.
- Make `redocly.yaml` extend `recommended`, and set `parameter-description`, `operation-description`, and `operation-operationId` to `error`.
- Check property descriptions in code review, because `parameter-description` covers parameters only.

### Detect breaking changes with [oasdiff](STACK.md#oasdiff)

- In each pull request, run `oasdiff breaking` against the document on `main`. Fail on a breaking change.
- Pin `oasdiff/oasdiff-action` to a commit SHA.
- Never break a published operation. Add a field or an operation, mark the old one `deprecated: true`, and remove it when nobody uses it.
- For batched breaking changes, use a new prefix such as `/app1/api/v2/`.

## Write clients

### Use [openapi-fetch](STACK.md#openapi-fetch)

- Generate types with `pnpm exec openapi-typescript src/apps/app1/api/openapi.json -o src/apps/app1/api/openapi.d.ts`.
- In islands, call `createClient<paths>({ baseUrl })` in the [TanStack](STACK.md#tanstack) Query `queryFn`.
- Do not write a hand-typed `fetch`.
- Build MCP and agent tools from the same Zod schemas. Do not write a second schema.

## Add a route

### Use [Astro](STACK.md#astro) endpoints

- Use Actions for forms and mutations from app pages. Use API routes for contract operations: islands, external clients, agents, and webhooks. See [ARCH](ARCH.md#build-pages-with-astro).
- Put API routes under the app prefix `/app1/api/v1/`. See [ARCH](ARCH.md#add-a-micro-frontend-as-an-astro-integration).
- Write one handler per method, with `satisfies APIRoute`.
- Add an `ALL` handler that returns `405` with an `Allow` header. Otherwise Astro returns `404`.
- Validate path, query, headers, and body with the contract schemas first. Return `400` with the invalid fields.
- Return only the statuses and shapes that the contract defines.

### Paginate lists

- Use cursor pagination ([AIP-158](https://google.aip.dev/158)): the `cursor` and `limit` parameters, and `nextCursor` in the response.
- Set the maximum `limit` in the schema.
- Do not use page numbers or offsets.

### Make creates idempotent

- Accept an `Idempotency-Key` header on a `POST` that creates a resource or starts a payment.
- Store the key and the response, and replay the response on a repeat.
- The header follows an [IETF draft](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/), not an RFC.

## Return errors

### Use [RFC 9457](STACK.md#rfc-9457)

- Return every error as `application/problem+json` with `type`, `title`, `status`, and `detail`. Use no other shape.
- Return field errors in an `errors` extension. Each item is `{ pointer: "#/email", detail }`, and `#/` means the whole body.
- Define each error `type` URI and status in the contract as a reused `components` response.
- Map each typed [Effect](STACK.md#effect) error to a status and a `type` in one module, `src/lib/api/errors.ts`.
- Never put stack traces, SQL, or internal IDs in `detail`. Log them.

## Protect a route

### Check [EmDash](STACK.md#emdash) authentication

- At the start of each protected API route, check `locals.user` and the role.
- Return `401` or `403` as problem details. Do not redirect. See [AUTH](AUTH.md).
- Filter each query by `tenant_id`. See [SAAS](SAAS.md#separate-tenants).

### Issue API keys

- Do not use `@better-auth/api-key` in [emdash-better-auth](STACK.md#emdash-better-auth).
- The reason: it cannot load server-side plugins ([#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)), and its API keys page is for staff only.
- Store customer keys in the app database as a SHA-256 hash (`crypto.subtle.digest`).
- Show the key once.
- Store these fields in each row: `tenant_id`, the creator `user_id`, name, scopes, `created_at`, `last_used_at`, and `revoked_at`.
- Reject a key when `revoked_at` is set.
- Take `tenant_id` from the key row, never from the path, query, header, or body. See [SAAS](SAAS.md#separate-tenants).
- Rate limit per key. See [limits](#limit-requests).
- Accept the key only as `Authorization: Bearer <key>`. Never accept it in the query string.

### Apply Astro security rules

- Do not rely on `security.checkOrigin`, because the EmDash integration sets it to `false`.
- Check `Origin` in app middleware for all unsafe methods and content types, and return `403` for a cross-origin request. See [SECURITY](SECURITY.md#protect-against-csrf).
- Return `415` when all of these are true: the method is `POST`, `PUT`, `PATCH`, or `DELETE`; the request has a body; the route uses a session cookie; and the `Content-Type` media type is not `application/json`.
- Strip the parameters before you compare, so `application/json; charset=utf-8` passes.
- Skip bodiless requests. The middleware origin check covers other content types.
- Write CORS in app middleware, because Astro has none. Use an allowlist of origins and answer `OPTIONS`.
- Never send `Access-Control-Allow-Origin: *` on cookie routes.

## Limit requests

### Use the Rate Limiting binding ([Workers](STACK.md#workers))

- Call `const { success } = await env.API_LIMITER.limit({ key })` per API key or user.
- Configure `ratelimits` in `wrangler.jsonc` with `simple: { limit, period }`. The `period` is 10 or 60 seconds.
- Return `429` with `Retry-After` when `success` is `false`.
- Do not use the binding for exact quotas, because it is per location and eventually consistent. See [SAAS](SAAS.md#enforce-plan-limits).

## Receive webhooks

### Use [Standard Webhooks](STACK.md#standard-webhooks)

- For incoming webhooks, read the body with `await request.text()`.
- Verify `webhook-signature` on the raw text before you parse it.
- Reject a `webhook-timestamp` that is more than 5 minutes from now.
- Treat `webhook-id` as the idempotency key. Never process an ID twice.
- Return `2xx` fast, and do the work in a [Queues](STACK.md#queues) consumer. See [ARCH](ARCH.md#add-a-queue-consumer).
- For payment providers, see [PAYMENTS](PAYMENTS.md). For outgoing webhooks, see [SAAS](SAAS.md#send-outgoing-webhooks-with-standard-webhooks).
