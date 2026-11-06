// Runs before each test file. Per app database, in `beforeEach()`:
// `applyD1Migrations(env.APP1_DB, env.APP1_TEST_MIGRATIONS)` from
// "cloudflare:test". Never on `env.DB`: `emdash migrate` owns it.
export {};
