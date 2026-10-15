# API

## Contract

### [OpenAPI](https://spec.openapis.org/oas/v3.1.1.html)

- Use one OpenAPI document per app as the contract for every interface of the app: API routes, React islands, external clients, agents, and MCP tools. Do not define a request or response shape outside the contract.
- Write OpenAPI 3.1 (`openapi: "3.1.1"`). Do not use 3.2 yet: zod-openapi, openapi-typescript, and openapi-fetch do not document 3.2 support.
- Give each operation a unique `operationId`, a `summary`, and a `description`.
- Publish the document at `/app1/api/openapi.json`, so that agents and external clients can read it. Serve it from an API route, `src/apps/app1/api/openapi.ts`, that imports the generated JSON and returns it with `Response.json()`. Inject it in `integration.ts` like every app route: `injectRoute({ pattern: "/app1/api/openapi.json", entrypoint: new URL("./api/openapi.ts", import.meta.url) })`. The pattern sets the URL, so the file name needs no `.json`. The operations live under `/app1/api/v1/`. The `/app1/api/...` prefix in [ARCH.md](ARCH.md) (Apps) covers both.

### [Parameters and properties](https://spec.openapis.org/oas/v3.1.1.html#schema-object)

- Give each parameter and each schema property one purpose. Its name says what it holds, and it holds only that. For example, `image` holds the path to an image file, such as `/media/cover.jpg`. It does not also hold a URL, a base64 string, or an image object.
- Add a new field with its own name for each other form of the same thing, for example `imageUrl` for an absolute URL and `imageAlt` for the alt text. Do not let the value of a field or of another field change what a field means.
- Use one name for one thing in the whole contract, for example `organizationId` in every operation. Do not use two names for the same thing, or one name for two things.
- Do not use generic names such as `data`, `value`, `info`, or `params`. Name the thing that the field holds.
- Do not accept free-form objects as input. Define each property, and use `z.strictObject()` for request bodies, so that unknown keys fail validation.
- Give each parameter and property a `description` that names its purpose, and an `example`.
- Set the narrowest type: `format` (`uri`, `date-time`, `email`, `uuid`), `pattern`, `enum`, `minimum`, `maximum`, and `maxLength`. Use `enum` for a closed list of values. Do not use a plain string for it.
- Use camelCase for JSON properties and query parameters.

### [zod-openapi](https://github.com/samchungy/zod-openapi)

- Write the contract as Zod schemas in `src/apps/app1/api/schemas.ts`. Validate requests in the API routes with the same schemas. Do not write the OpenAPI document by hand.
- Set `description` and `example` with `.meta({ description, example })`. Set `id` in `.meta()` only on schemas that you reuse: it moves the schema to `components` with a `$ref`, and a duplicate `id` throws an error.
- Declare parameters with `requestParams: { path, query, header, cookie }`, with one `z.object()` for each location.
- Build the document with `createDocument()` in a Node script, `scripts/openapi.ts`, and write it to `src/apps/app1/api/openapi.json`. Run it with `npx tsx scripts/openapi.ts`. Do not import `createDocument()` in Worker code.
- Declare the operations (`paths`, with `requestParams`, `requestBody`, and `responses`) in `scripts/openapi.ts`. Import the schemas from `src/apps/app1/api/schemas.ts`. Do not declare operations in `schemas.ts`.
- Commit the generated file. In CI, generate it again and fail when `git diff --exit-code` shows a change.

### [Redocly CLI](https://redocly.com/docs/cli/)

- Lint the document in CI with `redocly lint`. Extend `recommended` in `redocly.yaml`, and set `parameter-description`, `operation-description`, and `operation-operationId` to `error`. The `recommended` set turns the first two off.
- Check property descriptions in code review. `parameter-description` checks only parameters.

### [oasdiff](https://github.com/oasdiff/oasdiff)

- Check each PR for breaking changes with `oasdiff breaking`, with the document on `main` as the base. Use `oasdiff/oasdiff-action`, pinned to a commit SHA, and fail the check on a breaking change.
- Do not make a breaking change to a published operation. Add a new field or operation, mark the old one `deprecated: true`, and remove it only when no client uses it.
- Put a set of breaking changes under a new version prefix, for example `/app1/api/v2/`.

## Clients

### [openapi-fetch](https://openapi-ts.dev/openapi-fetch/)

- Generate types from the contract with [openapi-typescript](https://openapi-ts.dev/introduction): `npx openapi-typescript src/apps/app1/api/openapi.json -o src/apps/app1/api/openapi.d.ts`.
- Call the API from React islands with `createClient<paths>({ baseUrl })` from `openapi-fetch`. Use it in the TanStack Query `queryFn`. Do not write `fetch` calls with hand-written types.
- Build MCP tools and agent tools from the same Zod schemas as the operations. Do not write a second schema for an agent.

## Routes

### [Astro endpoints](https://docs.astro.build/en/guides/endpoints/)

- Use Astro Actions for forms and mutations from the pages of the app. Use API routes for the operations in the contract: calls from islands, external clients, agents, and webhooks. Follow the rules in [ARCH.md](ARCH.md) (Astro).
- Put API routes under the app prefix, for example `/app1/api/v1/`. Follow the rules in [ARCH.md](ARCH.md) (Apps).
- Export one handler for each method, typed with `satisfies APIRoute`. Add an `ALL` handler that returns `405` with an `Allow` header. Without it, Astro returns `404` for a request with another method.
- Validate the path parameters, query, headers, and body with the contract schemas before any other work. Return `400` with the invalid fields when the input does not match.
- Return only the status codes and response shapes that the contract defines for the operation.

### [Pagination](https://google.aip.dev/158)

- Use cursor pagination for lists: a `cursor` and a `limit` query parameter, and a `nextCursor` property in the response. Set a maximum for `limit` in the schema. Do not use page numbers or offsets: rows can move between pages.

### [Idempotency](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)

- Accept an `Idempotency-Key` header on `POST` operations that create a resource or start a payment. Store the key with the response, and return the stored response when the same key comes again. The header is an IETF draft, not an RFC yet.

## Errors

### [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html)

- Return each error as problem details: `Content-Type: application/problem+json` with `type`, `title`, `status`, and `detail`. Do not use another error shape.
- Put field errors in an `errors` extension member, with one item for each field: `pointer` (for example `#/email`) and `detail`. Use `#/` for an error about the whole body.
- Define each error `type` URI and its status in the contract, as a reused response in `components`.
- Map each typed Effect error to one status and `type` in one module, for example `src/lib/api/errors.ts`.
- Do not put stack traces, SQL, or internal IDs in `detail`. Log them on the server.

## Auth

### [EmDash authentication](https://docs.emdashcms.com/guides/authentication/)

- Check `locals.user` and its role at the start of each protected API route. Return `401` or `403` as problem details. Do not redirect to sign-in from an API route. Follow the rules in [AUTH.md](AUTH.md).
- Filter each query by `tenant_id`. Follow the rules in [SAAS.md](SAAS.md) (Data).

### [API keys](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#api-keys)

- Do not add `@better-auth/api-key` to emdash-better-auth. It cannot load server-side Better Auth plugins yet ([#22](https://github.com/theweekendprojects/emdash-better-auth/issues/22)), and its own API keys page is for staff only.
- Store API keys for customers in the app database as a SHA-256 hash (`crypto.subtle.digest("SHA-256", ...)`). Do not store the key. Show the key once, when it is created.
- Store these columns in the key row: `tenant_id`, the `user_id` of the creator, a name, scopes, `created_at`, `last_used_at`, and `revoked_at`. Reject a key with a `revoked_at` value.
- Take `tenant_id` for an API key request from the key row. Never take it from the path, query, header, or body. Follow the rules in [SAAS.md](SAAS.md) (Data).
- Limit requests for each key. Follow the rules in this file (Limits).
- Accept API keys only in the `Authorization: Bearer <key>` header. Do not accept them in the query string.

## Security

### [Astro security](https://docs.astro.build/en/reference/configuration-reference/#securitycheckorigin)

- Do not rely on `security.checkOrigin`: the EmDash integration sets it to `false`. Check the `Origin` header in the app middleware, for all unsafe methods and all content types, and return `403` on a cross-origin request. Follow the rules in [SECURITY.md](SECURITY.md) (CSRF).
- Return `415` for a `POST`, `PUT`, `PATCH`, or `DELETE` request that has a body, to a route that uses the session cookie, when its `Content-Type` media type (without parameters) is not `application/json`, so `application/json; charset=utf-8` passes. Do not check requests without a body, such as most `DELETE` requests. A cross-site page cannot send JSON without a CORS preflight, so the browser blocks it, and the origin check in the app middleware covers the other content types.
- Set CORS headers in the app middleware, only for a list of allowed origins, and answer `OPTIONS`. Astro has no CORS option. Do not send `Access-Control-Allow-Origin: *` on routes that use cookies.

## Limits

### [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

- Limit requests for each API key or user with `const { success } = await env.API_LIMITER.limit({ key })`. Set `simple: { limit, period }` in `ratelimits` in `wrangler.jsonc`. `period` is `10` or `60` seconds.
- Return `429` with a `Retry-After` header when `success` is `false`.
- Do not use the binding for exact quotas. It counts for each Cloudflare location and is eventually consistent. Follow the rules in [SAAS.md](SAAS.md) (Plan limits).

## Webhooks

### [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)

- Read the body of an incoming webhook with `await request.text()`, and verify the `webhook-signature` header on that raw text before you parse it. A parsed and serialized body does not match the signature.
- Reject a webhook when `webhook-timestamp` is more than 5 minutes from now.
- Use `webhook-id` as an idempotency key. Do not process the same ID twice.
- Return `2xx` fast, and do the work in a Queue consumer. Follow the rules in [ARCH.md](ARCH.md) (Background work).
- Follow the rules in [PAYMENTS.md](PAYMENTS.md) for payment provider webhooks, and in [SAAS.md](SAAS.md) (Outgoing webhooks) for webhooks that you send.
