import { globSync } from "node:fs";
import { basename } from "node:path";

// Client JavaScript limit per island: the island's own chunk, brotli.
// Everything the page loads is limited in page-js-limits.json.
const DEFAULT_LIMIT = "10 kB";

// Island name (file name without extension) -> limit. Example: Counter: "15 kB".
const LIMIT_OVERRIDES = {};

// Check that these patterns match real files. With no match the list is empty,
// and `pnpm run size` skips the island check and passes (`size-limit` itself
// fails on an empty config).
const patterns = ["src/components/islands/*.tsx", "src/apps/*/islands/*.tsx"];

const NOT_AN_ISLAND = /\.(stories|test)$/;

const names = globSync(patterns)
  .map((file) => basename(file, ".tsx"))
  .filter((name) => !NOT_AN_ISLAND.test(name))
  .toSorted();

export default Array.from(new Set(names), (name) => ({
  name,
  path: `dist/client/_astro/${name}.*.js`,
  limit: LIMIT_OVERRIDES[name] ?? DEFAULT_LIMIT,
}));
