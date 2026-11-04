import { globSync } from "node:fs";
import { basename } from "node:path";

// Client JavaScript limit per island: the island's own chunk, brotli.
// Everything the page loads is limited in page-js-limits.json.
const DEFAULT_LIMIT = "10 kB";

// Island name (file name without extension) -> limit. Example: Counter: "15 kB".
const LIMIT_OVERRIDES = {};

const patterns = ["src/components/islands/*.tsx", "src/apps/*/islands/*.tsx"];

const names = globSync(patterns)
  .map((file) => basename(file, ".tsx"))
  .filter((name) => !/\.(stories|test)$/.test(name))
  .sort();

export default [...new Set(names)].map((name) => ({
  name,
  path: `dist/client/_astro/${name}.*.js`,
  limit: LIMIT_OVERRIDES[name] ?? DEFAULT_LIMIT,
}));
