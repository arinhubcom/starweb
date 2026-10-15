// Helpers that setup.mjs and update.mjs share.
import { spawnSync } from "node:child_process";
import {
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const STATE_FILE = ".starweb.json";
export const REPO_DOCS = [
  "AGENTS.md",
  "CLAUDE.md",
  "GEMINI.md",
  "WHY.md",
  "rules",
];
export const TEMPLATE_FILES = "template/files";
// Tools that template/package.json pins but the project does not install:
// a project devDependency that no code uses would fail Knip.
export const PIN_ONLY_TOOLS = ["create-emdash", "shadcn"];
const EMDASH_RULE =
  "- Follow the rules in [EMDASH.md](EMDASH.md) for the EmDash template.";

export const fail = (message) => {
  console.error(`Error: ${message}`);
  process.exit(1);
};

export const step = (message) => console.log(`\n==> ${message}`);

export const readText = (path) => readFileSync(path, "utf8");

export const readJson = (path) => JSON.parse(readText(path));

export const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

export function sortKeys(object) {
  return Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b)),
  );
}

export function listFiles(root, base = root) {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory()
      ? listFiles(path, base)
      : [path.slice(base.length + 1)];
  });
}

export function substitute(text, values) {
  return text
    .replaceAll("__NAME__", values.name)
    .replaceAll("__SITE__", values.site);
}

// Add the EMDASH.md rule to the end of the "## Rules" list of AGENTS.md.
export function withEmdashRule(agents) {
  const rulesStart = agents.indexOf("## Rules");
  const rulesEnd = agents.indexOf("\n\n", rulesStart + "## Rules\n\n".length);
  if (rulesStart === -1 || rulesEnd === -1) {
    throw new Error(
      "Starweb AGENTS.md has no ## Rules list. Update scripts/setup.mjs.",
    );
  }
  return `${agents.slice(0, rulesEnd)}\n${EMDASH_RULE}${agents.slice(rulesEnd)}`;
}

// Run git in the Starweb clone. Return null when the command fails.
export function gitOut(args, cwd = repoRoot) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return result.status === 0 ? result.stdout : null;
}

// Return the full SHA of HEAD, and fail when the folder is not a git clone.
export function starwebHead() {
  const top = gitOut(["rev-parse", "--show-toplevel"]);
  const sha = gitOut(["rev-parse", "HEAD"]);
  const isClone =
    top !== null &&
    sha !== null &&
    realpathSync(top.trim()) === realpathSync(repoRoot);
  if (!isClone) {
    fail(
      `${repoRoot} is not a git clone of Starweb. Clone the repository (for example into ~/starweb) and keep the folder: update.mjs needs it later.`,
    );
  }
  return sha.trim();
}
