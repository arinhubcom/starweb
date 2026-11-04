// Helpers that setup.mjs and update.mjs share.
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
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
// A new project takes over this folder. setup.mjs and update.mjs handle its
// package.json and lockfile on their own, and copy all other files.
export const TEMPLATE_DIR = "template";
export const TEMPLATE_PACKAGE = "package.json";
export const TEMPLATE_LOCK = "pnpm-lock.yaml";
// The lockfile of a project or commit from before the move to pnpm.
export const NPM_LOCK = "package-lock.json";
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

// Stop when pnpm is older than 12, the oldest major that the template test ran
// with. pnpm-workspace.yaml and the lockfile have only been tested with it.
export function assertPnpm() {
  const result = spawnSync("pnpm", ["--version"], { encoding: "utf8" });
  const version = result.status === 0 ? result.stdout.trim() : "none";
  if (Number.parseInt(version, 10) >= 12) return;
  fail(
    `pnpm 12 or later is required (found ${version}). See https://pnpm.io/installation.`,
  );
}

const MAX_CONFLICTS = 127;

export function mergeThreeWay(ours, base, theirs) {
  const dir = mkdtempSync(join(tmpdir(), "starweb-merge-"));
  try {
    const paths = [ours, base, theirs].map((text, i) => {
      const path = join(dir, ["ours", "base", "theirs"][i]);
      writeFileSync(path, text);
      return path;
    });
    const result = spawnSync(
      "git",
      [
        "merge-file",
        "-p",
        "--diff3",
        "-L",
        "project",
        "-L",
        "base",
        "-L",
        "starweb",
        ...paths,
      ],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    );
    if (result.status === null || result.status > MAX_CONFLICTS) {
      throw new Error(`git merge-file failed: ${result.stderr}`);
    }
    return { text: result.stdout, conflict: result.status > 0 };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Decide what to do with one file. Return { action, text? }.
export function planFile({ base, theirs, ours }) {
  if (theirs === base) return { action: "skip" };
  if (theirs === null) return { action: ours === null ? "skip" : "deleted" };
  if (ours === null)
    return { action: base === null ? "added" : "kept", text: theirs };
  if (ours === theirs) return { action: "skip" };
  if (ours === base) return { action: "updated", text: theirs };
  const merged = mergeThreeWay(ours, base ?? "", theirs);
  return { action: merged.conflict ? "conflict" : "merged", text: merged.text };
}
