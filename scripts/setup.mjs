#!/usr/bin/env node
// Set up a create-emdash Cloudflare starter project as a Starweb project.
// Usage: node <starweb>/scripts/setup.mjs <project-dir> --name <name> [--site <url>]
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { starterPatches } from "./setup-patches.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templateDir = join(repoRoot, "template");
const DEFAULT_SITE = "https://example.com";
const REPO_DOCS = ["AGENTS.md", "CLAUDE.md", "GEMINI.md", "WHY.md", "rules"];
const GITIGNORE_LINES = [
  "test-results/",
  "coverage/",
  "backups/",
  "public/_headers",
];
const EMDASH_RULE =
  "- Follow the rules in [EMDASH.md](EMDASH.md) for the EmDash template.";

const fail = (message) => {
  console.error(`Error: ${message}`);
  process.exit(1);
};

const step = (message) => console.log(`\n==> ${message}`);

const readText = (path) => readFileSync(path, "utf8");

const readJson = (path) => JSON.parse(readText(path));

const writeJson = (path, value) =>
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

function parseArgs(argv) {
  const options = { dir: undefined, name: undefined, site: DEFAULT_SITE };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--name") options.name = argv[(i += 1)];
    else if (arg === "--site") options.site = argv[(i += 1)];
    else if (arg.startsWith("--")) fail(`Unknown option ${arg}.`);
    else options.dir = arg;
  }
  const usage = "Usage: setup.mjs <project-dir> --name <name> [--site <url>]";
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

function assertStarter(dir) {
  const packagePath = join(dir, "package.json");
  if (!existsSync(packagePath)) fail(`${dir} has no package.json.`);
  if (existsSync(join(dir, "EMDASH.md"))) {
    fail(
      "EMDASH.md exists: this project was already set up. Use a fresh starter.",
    );
  }
  const pkg = readJson(packagePath);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (!deps.emdash || !deps["@emdash-cms/cloudflare"]) {
    fail(
      "This is not the create-emdash Cloudflare starter (emdash or @emdash-cms/cloudflare is missing).",
    );
  }
}

function replaceExact(dir, file, from, to) {
  const path = join(dir, file);
  const text = readText(path);
  if (!text.includes(from)) {
    throw new Error(
      `Starter changed: ${file} no longer contains ${JSON.stringify(from)}. Update scripts/setup.mjs.`,
    );
  }
  writeFileSync(
    path,
    text.replace(from, () => to),
  );
}

function applyStarterPatches(dir) {
  for (const { file, edits } of starterPatches) {
    if (!existsSync(join(dir, file))) {
      throw new Error(
        `Starter changed: ${file} no longer exists. Update scripts/setup.mjs.`,
      );
    }
    for (const [from, to] of edits) replaceExact(dir, file, from, to);
  }
}

function prepareAgentFiles(dir) {
  renameSync(join(dir, "AGENTS.md"), join(dir, "EMDASH.md"));
  rmSync(join(dir, "pnpm-workspace.yaml"), { force: true });
  for (const entry of REPO_DOCS) {
    cpSync(join(repoRoot, entry), join(dir, entry), { recursive: true });
  }
  const agentsPath = join(dir, "AGENTS.md");
  const agents = readText(agentsPath);
  const rulesStart = agents.indexOf("## Rules");
  const rulesEnd = agents.indexOf("\n\n", rulesStart + "## Rules\n\n".length);
  if (rulesStart === -1 || rulesEnd === -1) {
    throw new Error(
      "Starweb AGENTS.md has no ## Rules list. Update scripts/setup.mjs.",
    );
  }
  writeFileSync(
    agentsPath,
    `${agents.slice(0, rulesEnd)}\n${EMDASH_RULE}${agents.slice(rulesEnd)}`,
  );
}

function listFiles(root, base = root) {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory()
      ? listFiles(path, base)
      : [path.slice(base.length + 1)];
  });
}

function copyOverlay(dir, values) {
  const filesDir = join(templateDir, "files");
  for (const relative of listFiles(filesDir)) {
    const target = join(dir, relative);
    mkdirSync(dirname(target), { recursive: true });
    const text = readText(join(filesDir, relative))
      .replaceAll("__NAME__", values.name)
      .replaceAll("__SITE__", values.site);
    writeFileSync(target, text);
  }
}

function sortKeys(object) {
  return Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function mergePackageJson(dir, name) {
  const projectPath = join(dir, "package.json");
  const project = readJson(projectPath);
  const template = readJson(join(templateDir, "package.json"));
  const { deploy: _deploy, ...starterScripts } = project.scripts ?? {};
  const { "create-emdash": _pinned, ...templateDevDeps } =
    template.devDependencies;
  writeJson(projectPath, {
    ...project,
    name,
    scripts: { ...starterScripts, ...template.scripts },
    dependencies: sortKeys({
      ...project.dependencies,
      ...template.dependencies,
    }),
    devDependencies: sortKeys({
      ...project.devDependencies,
      ...templateDevDeps,
    }),
  });
}

function updateGitignore(dir) {
  const path = join(dir, ".gitignore");
  const current = existsSync(path) ? readText(path) : "";
  const known = new Set(current.split("\n"));
  const missing = GITIGNORE_LINES.filter((line) => !known.has(line));
  if (missing.length === 0) return;
  const separator = current === "" || current.endsWith("\n") ? "" : "\n";
  writeFileSync(
    path,
    `${current}${separator}\n# Starweb\n${missing.join("\n")}\n`,
  );
}

function run(dir, command, args) {
  console.log(`$ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, { cwd: dir, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function installAndFormat(dir) {
  // The starter lockfile can pin versions that are younger than the
  // min-release-age of the new .npmrc, so install from a clean state.
  rmSync(join(dir, "node_modules"), { recursive: true, force: true });
  rmSync(join(dir, "package-lock.json"), { force: true });
  run(dir, "npm", ["install"]);
  run(dir, "npx", ["wrangler", "types"]);
  run(dir, "npx", ["prettier", ".", "--write", "--log-level", "warn"]);
  if (!existsSync(join(dir, ".git"))) run(dir, "git", ["init", "--quiet"]);
}

function printNextSteps() {
  console.log(`
Setup done. Next steps (see rules/SETUP.md):
  1. Run "npm run check" and "npm run build". Both must pass.
  2. Set "site" in astro.config.mjs to the final public URL, if you used the default.
  3. Create the D1 database with a location hint, set its database_id, and log in with "npx wrangler login".
  4. Add the optional parts that SETUP.md lists: Fulldev UI, i18n, auth, apps, Sentry, Storybook, Playwright, and the deploy workflows.
  5. Start "npm run dev", open /_emdash/admin/, and complete the setup wizard.
  6. Commit the project.`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  assertStarter(options.dir);
  const steps = [
    [
      "Rename AGENTS.md and copy the Starweb rules",
      () => prepareAgentFiles(options.dir),
    ],
    ["Copy the template files", () => copyOverlay(options.dir, options)],
    ["Patch the starter files", () => applyStarterPatches(options.dir)],
    ["Merge package.json", () => mergePackageJson(options.dir, options.name)],
    ["Update .gitignore", () => updateGitignore(options.dir)],
    [
      "Install, generate types, and format",
      () => installAndFormat(options.dir),
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
