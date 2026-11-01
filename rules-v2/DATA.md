# DATA

## Database

### [D1](STACK.md#d1)

- No interactive transactions (`db.transaction()`): kysely-d1 lacks them, workerd can hang → `batch()`, or make each write safe alone.
- Compound SELECT (`UNION`, `INTERSECT`, `EXCEPT`): ≤ 5 terms.
- Independent reads of one request → one `batch()`. Never batch across requests.
- ≤ 100 bound parameters per statement (`where in`, multi-row insert = rows × columns) → chunk, send chunks in one `batch()`.
- ≤ 100 KB per statement, also inside `batch()`.

## Queries

### [Kysely](STACK.md#kysely)

- Dialect: kysely-d1 `D1Dialect({ database: env.APP1_DB })`.
- `Database` interface (one type per table) in one file; update it in the migration's commit.
- Repository pattern: one module per table in `src/apps/<app>/db/` (`src/apps/app1/db/project.ts`). No queries in routes or components. → [ARCH](ARCH.md) (Apps)
- `limit` on every list query. → [API](API.md) (Pagination)
- No N+1 → join, or `where in` in chunks of ≤ 100.
- Query builder for all SQL; `sql` tag only where the builder cannot express it. No string-built SQL.

## Migrations

### D1 migrations

- SQL files + `wrangler d1 migrations apply`. No Kysely `Migrator` for app databases.
- Forward-only. Never edit a migration that ran in production; add a new one.

## Seed data

### D1 local development

- `npx wrangler d1 migrations apply <db> --local`, then `npx wrangler d1 execute <db> --local --file=src/apps/<app>/db/seed.sql`.
- Fake data only. Never copy remote rows into a seed. Never seed with `--remote`. → [PRIVACY](PRIVACY.md)

## Backups

### D1 export and import

- Before a risky change (destructive migration, bulk update): `npx wrangler d1 export <db> --remote --output=<file>.sql`.
- Also export on a schedule from CI, off-peak (export blocks the database). Time Travel keeps only 7 days (Free) or 30 days (Paid).
- No exports in git: write to `backups/` (gitignored), store in private restricted storage, delete by [PRIVACY](PRIVACY.md) retention.
- `d1 export` fails with virtual tables (FTS5) → drop and recreate them around the export, or use Time Travel.

## Reference

### [EmDash](STACK.md#emdash) source

- Read before writing data code; it runs Kysely on D1 in production:
  - D1 dialect, migration lock, compound SELECT limit: [`packages/cloudflare/src/db/d1-dialect.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/cloudflare/src/db/d1-dialect.ts)
  - SELECT coalescing into one round trip: [`packages/cloudflare/src/db/coalescing-d1.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/cloudflare/src/db/coalescing-d1.ts)
  - Transaction fallback: [`packages/core/src/database/transaction.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/transaction.ts)
  - Migrator with static imports: [`packages/core/src/database/migrations/runner.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/migrations/runner.ts)
  - `Database` interface: [`packages/core/src/database/types.ts`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/types.ts)
  - Repositories: [`packages/core/src/database/repositories/`](https://github.com/emdash-cms/emdash/blob/main/packages/core/src/database/repositories)
- No imports from `emdash/internal/*`; copy the pattern.
