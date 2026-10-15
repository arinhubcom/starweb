# DATA

## Database

### [D1](https://developers.cloudflare.com/d1/)

- Do not use interactive transactions (`db.transaction()`) on D1. kysely-d1 does not support them, and on workerd the error can hang the Worker. Use the D1 `batch()` API for statements that must run together, or design each write to be safe alone.
- Keep each compound SELECT (`UNION`, `UNION ALL`, `INTERSECT`, `EXCEPT`) at 5 terms or fewer. D1 rejects a sixth term with "too many terms in compound SELECT". Split larger queries.
- Send independent reads of one request in one D1 `batch()` call when latency matters. Do not batch queries of different requests together.
- Bind at most 100 parameters in one query. This limit hits `where in` lists and multi-row inserts (rows times columns). Split the values into chunks, and send the chunks in one `batch()` call.
- Keep each SQL statement under 100,000 bytes (100 KB). The query limits apply to each statement inside a `batch()` call. The D1 docs give no limit for the number of statements in a batch.

## Queries

### [Kysely](https://kysely.dev)

- Connect Kysely to D1 with the [kysely-d1](https://github.com/aidenwallis/kysely-d1) dialect: `new Kysely<Database>({ dialect: new D1Dialect({ database: env.APP1_DB }) })`.
- Write the `Database` interface (one type per table) in one file. Update it in the same commit as the migration that changes the schema.
- Put the queries for each table in one repository module in `src/apps/<app>/db/`, for example `src/apps/app1/db/project.ts`. Follow the rules in [ARCH.md](ARCH.md) (Apps). Do not write queries in routes or components.
- Put a `limit` on every list query. Follow the rules in [API.md](API.md) (Pagination).
- Do not run a query for each row of a result (N+1). Load related rows with a join or with one `where in` query, in chunks of 100 values or fewer.
- Use the query builder for all queries. Use the `sql` template tag only for SQL the builder cannot express. Do not build SQL from strings.

## Migrations

### [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)

- Write schema changes as SQL files and apply them with `wrangler d1 migrations apply`.
- Do not use the Kysely `Migrator` for app databases. Keep one migration system: SQL files and `wrangler d1 migrations apply`.
- Make migrations forward-only. Do not edit a migration after it ran in production. Add a new one.

## Seed data

### [Local development](https://developers.cloudflare.com/d1/best-practices/local-development/)

- Load seed data into the local database with `npx wrangler d1 execute <db> --local --file=src/apps/<app>/db/seed.sql`. Run it after `npx wrangler d1 migrations apply <db> --local`.
- Use fake data only in seed files, as PRIVACY.md requires. Do not copy rows or exports from a remote database into a seed file. Never run a seed file with `--remote`.

## Backups

### [Export and import](https://developers.cloudflare.com/d1/best-practices/import-export-data/)

- Export the remote database before each risky change (a destructive migration or a bulk update): `npx wrangler d1 export <db> --remote --output=<file>.sql`. Time Travel keeps only 7 days (Workers Free) or 30 days (Workers Paid), so also export on a schedule.
- Run the scheduled export from CI, outside peak hours: a running export blocks other requests to the database.
- Do not keep an export in git. It holds personal data. Store it in private storage with restricted access, outside the repository, and write exports to the `backups/` folder, which `.gitignore` excludes. Delete old exports by the retention rules in [PRIVACY.md](PRIVACY.md).
- Do not rely on `d1 export` for a database with virtual tables, such as FTS5 tables: D1 cannot export them. Drop the virtual tables and recreate them after the export, or use Time Travel.

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
