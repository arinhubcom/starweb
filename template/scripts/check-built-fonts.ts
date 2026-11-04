// Fail the build when a font family has no file. When a provider cannot reach
// its API, `astro build` only warns, and the site ships without the font.
// See Fonts in rules/MEDIA.md.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fonts } from "../src/lib/fonts.ts";
import { findFamiliesWithoutFile } from "./lib/check-fonts.ts";

const SERVER_DIR = "dist/server";

const readServerCode = () =>
  readdirSync(SERVER_DIR, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".mjs"))
    .map((file) => readFileSync(join(SERVER_DIR, file), "utf8"))
    .join("\n");

const missing = findFamiliesWithoutFile(
  fonts.map((family) => family.name),
  readServerCode(),
);

if (missing.length > 0) {
  console.error(
    `No font file for: ${missing.join(", ")}. Check the network and the [assets] warnings in the build output.`,
  );
  process.exit(1);
}
