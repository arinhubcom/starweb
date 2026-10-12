# DATA

## Database

### [D1](https://developers.cloudflare.com/d1/)

- Do not use interactive transactions (`db.transaction()`) on D1. kysely-d1 does not support them, and on workerd the error can hang the Worker. Use the D1 `batch()` API for statements that must run together, or design each write to be safe alone.
- Keep each compound SELECT (`UNION`, `UNION ALL`, `INTERSECT`, `EXCEPT`) at 5 terms or fewer. D1 rejects a sixth term with "too many terms in compound SELECT". Split larger queries.
- Send independent reads of one request in one D1 `batch()` call when latency matters. Do not batch queries of different requests together.

## Queries

### [Kysely](https://kysely.dev)

- Connect Kysely to D1 with the [kysely-d1](https://github.com/aidenwallis/kysely-d1) dialect: `new Kysely<Database>({ dialect: new D1Dialect({ database: env.APP_DB }) })`.
- Write the `Database` interface (one type per table) in one file. Update it in the same commit as the migration that changes the schema.
- Put the queries for each table in one repository module, for example `src/db/repositories/project.ts`. Do not write queries in routes or components.
- Use the query builder for all queries. Use the `sql` template tag only for SQL the builder cannot express. Do not build SQL from strings.

## Migrations

### [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)

- Write schema changes as SQL files and apply them with `wrangler d1 migrations apply`.
- If you use the Kysely `Migrator`, import each migration file statically in a custom `MigrationProvider`. Do not use `FileMigrationProvider` in the Worker: it needs a file system.
- Make migrations forward-only. Do not edit a migration after it ran in production. Add a new one.

## Reference

### [EmDash source](https://github.com/emdash-cms/emdash)

- Learn from EmDash before you write data code. It uses Kysely on D1 in production.
- Read these files:
  - D1 dialect, migration lock, and compound SELECT limit: [`cloudflare/src/db/d1-dialect.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/cloudflare/src/db/d1-dialect.ts)
  - Batching SELECTs into one D1 round trip: [`cloudflare/src/db/coalescing-d1.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/cloudflare/src/db/coalescing-d1.ts)
  - Transaction fallback for D1: [`core/src/database/transaction.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/transaction.ts)
  - Migrator with static imports: [`core/src/database/migrations/runner.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/migrations/runner.ts)
  - `Database` interface: [`core/src/database/types.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/types.ts)
  - Repository modules: [`core/src/database/repositories/`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/repositories)
- Do not import from `emdash/internal/*` in app code. Copy the pattern instead: internal modules are not public API.
