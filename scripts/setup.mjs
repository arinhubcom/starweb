#!/usr/bin/env node
// Create a Starweb project from the template/ folder.
// Usage: node <starweb>/scripts/setup.mjs <project-dir> --name <name> [--site <url>] [--fresh-lock]
// --fresh-lock resolves the dependencies again and skips the template lockfile:
// the weekly CI run uses it to find a change in a transitive dependency.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  REPO_DOCS,
  assertPnpm,
  STATE_FILE,
  TEMPLATE_DIR,
  TEMPLATE_LOCK,
  TEMPLATE_PACKAGE,
  fail,
  gitOut,
  readJson,
  readText,
  repoRoot,
  starwebHead,
  step,
  substitute,
  withEmdashRule,
  writeJson,
} from "./lib.mjs";

const templateDir = join(repoRoot, TEMPLATE_DIR);
const DEFAULT_SITE = "https://example.com";

function parseArgs(argv) {
  const options = {
    dir: undefined,
    name: undefined,
    site: DEFAULT_SITE,
    freshLock: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--name") options.name = argv[(i += 1)];
    else if (arg === "--site") options.site = argv[(i += 1)];
    else if (arg === "--fresh-lock") options.freshLock = true;
    else if (arg.startsWith("--")) fail(`Unknown option ${arg}.`);
    else options.dir = arg;
  }
  const usage =
    "Usage: setup.mjs <project-dir> --name <name> [--site <url>] [--fresh-lock]";
  if (!options.dir || !options.name) fail(usage);
  if (!/^[a-z][a-z0-9-]{0,62}$/.test(options.name)) {
    fail(
      "--name must be lowercase letters, digits, and hyphens, and start with a letter.",
    );
  }
  try {
    options.site = new URL(options.site).origin;
  } catch {
    fail("--site must be a full URL, for example https://example.com.");
  }
  return { ...options, dir: resolve(options.dir) };
}

function assertEmptyTarget(dir) {
  if (existsSync(dir) && readdirSync(dir).length > 0) {
    fail(`${dir} is not empty. Use a new folder.`);
  }
}

// List the template files that git tracks or would track, so that ignored
// files such as node_modules or .env never reach a project.
function templateFiles() {
  const names = gitOut(
    ["ls-files", "-co", "--exclude-standard", "-z", "--", "."],
    templateDir,
  );
  if (names === null) fail(`Cannot list the files of ${templateDir}.`);
  return names
    .split("\0")
    .filter((name) => name !== "")
    .filter((name) => ![TEMPLATE_PACKAGE, TEMPLATE_LOCK].includes(name))
    .filter((name) => existsSync(join(templateDir, name)));
}

function copyTemplate(dir, values) {
  for (const relative of templateFiles()) {
    const source = join(templateDir, relative);
    const target = join(dir, relative);
    mkdirSync(dirname(target), { recursive: true });
    if (lstatSync(source).isSymbolicLink()) {
      symlinkSync(readlinkSync(source), target);
    } else {
      writeFileSync(target, substitute(readText(source), values));
    }
  }
}

function copyRepoDocs(dir) {
  for (const entry of REPO_DOCS) {
    cpSync(join(repoRoot, entry), join(dir, entry), { recursive: true });
  }
  const agentsPath = join(dir, "AGENTS.md");
  writeFileSync(agentsPath, withEmdashRule(readText(agentsPath)));
}

// The template differs from a project only in the name.
function writePackageFiles(dir, { name, freshLock }) {
  const template = readJson(join(templateDir, TEMPLATE_PACKAGE));
  writeJson(join(dir, TEMPLATE_PACKAGE), { ...template, name });
  if (freshLock) return;
  cpSync(join(templateDir, TEMPLATE_LOCK), join(dir, TEMPLATE_LOCK));
}

// Each project gets its own key, in the format of create-emdash. The file is
// not in the template: a shared key would decrypt the secrets of other projects.
function writeEncryptionKey(dir) {
  const key = `emdash_enc_v1_${randomBytes(32).toString("base64url")}`;
  writeFileSync(join(dir, ".env"), `EMDASH_ENCRYPTION_KEY=${key}\n`, {
    mode: 0o600,
  });
}

function run(dir, command, args) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, { cwd: dir, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function installAndFormat(dir, freshLock) {
  run(dir, "pnpm", [
    "install",
    freshLock ? "--no-frozen-lockfile" : "--frozen-lockfile",
  ]);
  run(dir, "pnpm", ["exec", "wrangler", "types"]);
  run(dir, "pnpm", ["exec", "tsx", "scripts/theme.ts"]);
  run(dir, "pnpm", ["exec", "prettier", ".", "--write", "--log-level", "warn"]);
  run(dir, "git", ["init", "--quiet"]);
}

function writeState(dir, values, commit) {
  writeJson(join(dir, STATE_FILE), {
    commit,
    name: values.name,
    site: values.site,
  });
}

function printNextSteps() {
  console.log(`
Setup done. Next steps (see rules/SETUP.md):
  1. Run "pnpm run check" and "pnpm run build". Both must pass.
  2. Set SITE, CONTROLLER, and the contact addresses in src/lib/site.ts, and replace each [Add marker in src/pages/privacy.astro.
  3. Create the D1 database with a location hint, set its database_id, and log in with "pnpm exec wrangler login".
  4. Add the optional parts that SETUP.md lists: i18n, auth, apps, Sentry, Storybook, Playwright, and the deploy workflows.
  5. Start "pnpm run dev", open /_emdash/admin/, and complete the setup wizard.
  6. Commit the project.`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  assertEmptyTarget(options.dir);
  assertPnpm();
  const commit = starwebHead();
  const steps = [
    ["Copy the template", () => copyTemplate(options.dir, options)],
    ["Copy the Starweb rules", () => copyRepoDocs(options.dir)],
    ["Write .starweb.json", () => writeState(options.dir, options, commit)],
    ["Write package.json", () => writePackageFiles(options.dir, options)],
    ["Write the encryption key", () => writeEncryptionKey(options.dir)],
    [
      "Install, generate types, and format",
      () => installAndFormat(options.dir, options.freshLock),
    ],
  ];
  for (const [label, action] of steps) {
    step(label);
    action();
  }
  printNextSteps();
}

try {
  main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
