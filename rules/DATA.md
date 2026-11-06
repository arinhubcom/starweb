# DATA

Read this file when you write database code, add a migration, seed data, or back up the D1 database of an app.

## Read EmDash source first

- Read the [EmDash](STACK.md#emdash) source before you write data code. It runs Kysely on D1 in production.
- For the D1 dialect, migration lock, and compound SELECT limit, read [`d1-dialect.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/cloudflare/src/db/d1-dialect.ts).
- For SELECT coalescing into one round trip, read [`coalescing-d1.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/cloudflare/src/db/coalescing-d1.ts).
- For the transaction fallback, read [`transaction.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/transaction.ts).
- For a migrator with static imports, read [`runner.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/migrations/runner.ts).
- For the `Database` interface, read [`types.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/types.ts).
- For repositories, read [`repositories/`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/repositories).
- Do not import from `emdash/internal/*`. Copy the pattern.

## Write queries

### Use [Kysely](STACK.md#kysely)

- Use the kysely-d1 dialect: `D1Dialect({ database: env.APP1_DB })`.
- Keep the `Database` interface, with one type per table, in one file. Update it in the commit of the migration.
- Use the repository pattern: one module per table in `src/apps/<app>/db/`, such as `src/apps/app1/db/project.ts`.
- Write no queries in routes or components. See [ARCH](ARCH.md#add-a-micro-frontend-as-an-astro-integration).
- Set a `limit` on every list query. See [API](API.md#paginate-lists).
- Avoid N+1 queries. Use a join, or `where in` in chunks of at most 100.
- Use the query builder for all SQL. Use the `sql` tag only where the builder cannot express the query.
- Never build SQL from strings.

### Stay within [D1](STACK.md#d1) limits

- Do not use interactive transactions (`db.transaction()`). kysely-d1 lacks them, and workerd can hang. Use `batch()`, or make each write safe alone.
- Use at most 5 terms in a compound SELECT (`UNION`, `INTERSECT`, `EXCEPT`).
- Send independent reads of one request in one `batch()`. Never batch across requests.
- Bind at most 100 parameters per statement. A `where in` or a multi-row insert uses rows times columns.
- If a statement needs more than 100 parameters, chunk it and send the chunks in one `batch()`.
- Keep each statement under 100 KB, also inside `batch()`.

## Add a migration

- Write migrations as SQL files, and apply them with `wrangler d1 migrations apply`.
- Do not use the Kysely `Migrator` for app databases.
- Write forward-only migrations.
- Never edit a migration that ran in production. Add a new one.

## Seed data for local development

- Apply migrations with `pnpm exec wrangler d1 migrations apply <db> --local`.
- Then seed with `pnpm exec wrangler d1 execute <db> --local --file=src/apps/<app>/db/seed.sql`.
- Use fake data only. Never copy remote rows into a seed.
- Never seed with `--remote`. See [PRIVACY](PRIVACY.md).

## Back up the database

### Export and import D1

- Before a risky change, such as a destructive migration or a bulk update, run `pnpm exec wrangler d1 export <db> --remote --output=<file>.sql`.
- Also export on a schedule from CI, off-peak, because an export blocks the database.
- Time Travel keeps only 7 days on Free and 30 days on Paid.
- Do not commit exports to git. Write them to `backups/`, which is gitignored.
- Store exports in private, restricted storage. Delete them by the retention rules in [PRIVACY](PRIVACY.md).
- `d1 export` fails with virtual tables (FTS5). Drop and recreate them around the export, or use Time Travel.
