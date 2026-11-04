#!/usr/bin/env node
// Move template/ to a new create-emdash output: run create-emdash, and merge
// the difference to starter/ (the last output) into template/ with a three-way
// merge. Run it for each EmDash update. create-emdash downloads its template
// from the main branch of emdash-cms/templates, so an older version gives the
// same output as a new one: only the snapshot in starter/ can be the base.
// Usage: node scripts/update-starter.mjs <version>
//        node scripts/update-starter.mjs --check
// --check changes nothing. It exits with 3 when create-emdash gives other
// files than starter/, or when a newer EmDash version is ready to pin.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  NPM_LOCK,
  TEMPLATE_DIR,
  TEMPLATE_LOCK,
  TEMPLATE_PACKAGE,
  fail,
  gitOut,
  planFile,
  readJson,
  readText,
  repoRoot,
  step,
  writeJson,
} from "./lib.mjs";

const templateDir = join(repoRoot, TEMPLATE_DIR);
const STARTER_DIR = "starter";
const starterDir = join(repoRoot, STARTER_DIR);
const TEMPLATE_NAME = "cloudflare:starter";
// create-emdash is pinned in the root package.json, because a project does not
// use it. The others are pinned with it in template/package.json.
const CREATE_PACKAGE = "create-emdash";
const TEMPLATE_PINNED = ["emdash", "@emdash-cms/cloudflare"];
const EMDASH_PACKAGES = [CREATE_PACKAGE, ...TEMPLATE_PINNED];
const rootPackagePath = join(repoRoot, TEMPLATE_PACKAGE);
const FORMAT_PACKAGES = ["oxfmt", "@astrojs/compiler-rs"];
const FORMAT_CONFIG = ".oxfmtrc.json";
// Starter output that does not belong in the repository: secrets and lockfiles,
// generated types, pnpm settings (the template has its own), and a symbolic link
// that the template already has.
const NOT_KEPT = [
  ".claude",
  ".env",
  NPM_LOCK,
  TEMPLATE_LOCK,
  "pnpm-workspace.yaml",
  "worker-configuration.d.ts",
];
const NOT_WALKED = new Set([".git", "node_modules"]);
const CHECK_FOUND_CHANGES = 3;
const MIN_RELEASE_AGE_MS = 3 * 24 * 60 * 60 * 1000;
// The rules of Starweb use AGENTS.md, so the template keeps the EmDash text here.
const RENAMED = new Map([["AGENTS.md", "EMDASH.md"]]);

function run(cwd, command, args) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `Command failed: ${command} ${args.join(" ")}\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout;
}

function parseArgs(argv) {
  const [arg] = argv;
  if (argv.length === 1 && arg === "--check") return { check: true };
  if (argv.length !== 1 || !/^\d+\.\d+\.\d+$/.test(arg)) {
    fail(
      "Usage: update-starter.mjs <version>, for example 1.5.0, or update-starter.mjs --check.",
    );
  }
  return { check: false, version: arg };
}

function assertCleanTemplate() {
  const status = gitOut([
    "status",
    "--porcelain",
    "--",
    TEMPLATE_PACKAGE,
    TEMPLATE_DIR,
    STARTER_DIR,
  ]);
  if (status === null || status !== "") {
    fail(
      "package.json, template/, or starter/ has uncommitted changes. Commit them first: this script changes them.",
    );
  }
}

// Files of a folder, relative to it, without symbolic links.
function walk(root, base = root) {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    if (NOT_WALKED.has(name)) return [];
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) return [];
    return stat.isDirectory() ? walk(path, base) : [path.slice(base.length + 1)];
  });
}

function installFormatter(workDir) {
  const { devDependencies, dependencies } = readJson(
    join(templateDir, TEMPLATE_PACKAGE),
  );
  const pins = { ...dependencies, ...devDependencies };
  writeJson(join(workDir, "package.json"), { private: true });
  run(workDir, "pnpm", [
    "add",
    "--ignore-scripts",
    ...FORMAT_PACKAGES.map((name) => `${name}@${pins[name]}`),
  ]);
}

// Run create-emdash, and shape the output as the template holds it: renamed,
// without the excluded files, and formatted with the template's Oxfmt config.
function createStarter(workDir, version) {
  const parent = join(workDir, `v${version}`);
  const project = join(parent, "app");
  mkdirSync(parent);
  run(parent, "pnpm", [
    "create",
    `emdash@${version}`,
    "app",
    "--template",
    TEMPLATE_NAME,
    "--yes",
    "--no-install",
  ]);
  for (const name of NOT_KEPT) {
    rmSync(join(project, name), { recursive: true, force: true });
  }
  for (const [from, to] of RENAMED) {
    if (existsSync(join(project, from))) {
      renameSync(join(project, from), join(project, to));
    }
  }
  // The starter has no src/styles/global.css, so drop the stylesheet option.
  const { sortTailwindcss, ...config } = readJson(
    join(templateDir, FORMAT_CONFIG),
  );
  const { stylesheet, ...sortOptions } = sortTailwindcss;
  writeJson(join(project, FORMAT_CONFIG), {
    ...config,
    sortTailwindcss: sortOptions,
  });
  run(project, join(workDir, "node_modules/.bin/oxfmt"), []);
  rmSync(join(project, FORMAT_CONFIG));
  return project;
}

const readIfExists = (path) => (existsSync(path) ? readText(path) : null);

function mergeStarter(oldDir, newDir) {
  const paths = new Set(
    [...walk(oldDir), ...walk(newDir)].filter(
      (relative) => relative !== TEMPLATE_PACKAGE,
    ),
  );
  const report = { updated: [], added: [], merged: [], conflict: [], review: [] };
  for (const relative of [...paths].toSorted((a, b) => a.localeCompare(b))) {
    const target = join(templateDir, relative);
    const base = readIfExists(join(oldDir, relative));
    const theirs = readIfExists(join(newDir, relative));
    const ours = readIfExists(target);
    const { action, text } = planFile({ base, theirs, ours });
    if (action === "skip") continue;
    if (action === "deleted") {
      if (ours === base) rmSync(target);
      else report.review.push(`${relative} (the new starter deleted it)`);
    } else if (action === "kept") {
      report.review.push(`${relative} (the template deleted it)`);
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, text);
      report[action].push(relative);
    }
  }
  return report;
}

function diffMap(label, before = {}, after = {}) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => before[key] !== after[key])
    .map(
      (key) =>
        `${label} ${key}: ${before[key] ?? "(none)"} -> ${after[key] ?? "(none)"}`,
    );
}

// The template pins other versions than the starter, so package.json is not in
// the merge: pin the EmDash packages, refresh the lockfile, and list the starter
// changes to review.
function updatePackageJson(version, oldPackage, newPackage) {
  const path = join(templateDir, TEMPLATE_PACKAGE);
  const pkg = readJson(path);
  const pin = (section) =>
    Object.fromEntries(
      Object.entries(section).map(([name, pinned]) => [
        name,
        TEMPLATE_PINNED.includes(name) ? version : pinned,
      ]),
    );
  writeJson(path, {
    ...pkg,
    dependencies: pin(pkg.dependencies),
    devDependencies: pin(pkg.devDependencies),
  });
  const root = readJson(rootPackagePath);
  writeJson(rootPackagePath, {
    ...root,
    devDependencies: { ...root.devDependencies, [CREATE_PACKAGE]: version },
  });
  run(templateDir, "pnpm", [
    "install",
    "--lockfile-only",
    "--no-frozen-lockfile",
    "--ignore-scripts",
  ]);
  return ["scripts", "dependencies", "devDependencies"].flatMap((section) =>
    diffMap(section, oldPackage[section], newPackage[section]),
  );
}

function printReport(report, packageChanges) {
  const groups = [
    ["Updated", report.updated],
    ["Added", report.added],
    ["Merged", report.merged],
    ["Conflicts", report.conflict],
    ["Review by hand", report.review],
    ["Starter package.json changes to review", packageChanges],
  ];
  console.log("\nSummary\n");
  for (const [title, items] of groups) {
    console.log(`${title}: ${items.length}`);
    for (const item of items) console.log(`  ${item}`);
  }
}

// Stable versions that are old enough to pin, for one package.
function allowedVersions(name) {
  const times = JSON.parse(run(repoRoot, "pnpm", ["view", name, "time", "--json"]));
  const newestDate = Date.now() - MIN_RELEASE_AGE_MS;
  return Object.entries(times)
    .filter(
      ([version, time]) =>
        /^\d+\.\d+\.\d+$/.test(version) && Date.parse(time) < newestDate,
    )
    .map(([version]) => version);
}

// The newest version that all EmDash packages have, old enough to pin.
function newestAllowedVersion() {
  const [first, ...others] = EMDASH_PACKAGES.map(allowedVersions);
  return first
    .filter((version) => others.every((list) => list.includes(version)))
    .toSorted((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
}

function changedFiles(oldDir, newDir) {
  return [...new Set([...walk(oldDir), ...walk(newDir)])]
    .filter(
      (relative) =>
        readIfExists(join(oldDir, relative)) !==
        readIfExists(join(newDir, relative)),
    )
    .toSorted((a, b) => a.localeCompare(b));
}

function check() {
  const pinned = readJson(rootPackagePath).devDependencies[CREATE_PACKAGE];
  const newest = newestAllowedVersion();
  const workDir = mkdtempSync(join(tmpdir(), "starweb-starter-"));
  try {
    step("Install Oxfmt with the template's versions");
    installFormatter(workDir);
    step(`Run create-emdash ${pinned}`);
    const changed = changedFiles(starterDir, createStarter(workDir, pinned));
    const hasNewer = newest !== undefined && newest !== pinned;
    console.log(`\nPinned EmDash version: ${pinned}`);
    console.log(`Newest version ready to pin: ${newest ?? "(none)"}`);
    console.log(`Starter files that differ from starter/: ${changed.length}`);
    for (const file of changed) console.log(`  ${file}`);
    if (hasNewer || changed.length > 0) process.exitCode = CHECK_FOUND_CHANGES;
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function main() {
  const { check: checkOnly, version } = parseArgs(process.argv.slice(2));
  if (checkOnly) {
    check();
    return;
  }
  assertCleanTemplate();
  const workDir = mkdtempSync(join(tmpdir(), "starweb-starter-"));
  try {
    step("Install Oxfmt with the template's versions");
    installFormatter(workDir);
    step(`Run create-emdash ${version}`);
    const newDir = createStarter(workDir, version);
    step("Merge the starter changes into template/");
    const oldPackage = readJson(join(starterDir, TEMPLATE_PACKAGE));
    const newPackage = readJson(join(newDir, TEMPLATE_PACKAGE));
    const report = mergeStarter(starterDir, newDir);
    const packageChanges = updatePackageJson(version, oldPackage, newPackage);
    step("Replace starter/ with the new output");
    rmSync(starterDir, { recursive: true, force: true });
    cpSync(newDir, starterDir, { recursive: true });
    printReport(report, packageChanges);
    if (report.conflict.length > 0) {
      console.error(
        "\nConflicts: resolve the markers (project, base, starweb) in template/.",
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      "\nNext: review the changes, then run scripts/test-template.sh.",
    );
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

try {
  main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
