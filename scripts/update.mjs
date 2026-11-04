#!/usr/bin/env node
// Bring Starweb changes into a project that setup.mjs created, with a
// three-way merge: base (Starweb at the recorded commit), theirs (Starweb
// HEAD), and ours (the project file).
// Usage: node <starweb>/scripts/update.mjs <project-dir> [--dry-run]
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  PIN_ONLY_TOOLS,
  REPO_DOCS,
  STATE_FILE,
  TEMPLATE_DIR,
  TEMPLATE_PACKAGE,
  assertNpm,
  fail,
  gitOut,
  planFile,
  readJson,
  readText,
  repoRoot,
  sortKeys,
  starwebHead,
  step,
  substitute,
  withEmdashRule,
  writeJson,
} from "./lib.mjs";

const DEP_SECTIONS = ["dependencies", "devDependencies", "overrides"];

function parseArgs(argv) {
  const options = { dir: undefined, dryRun: false };
  for (const arg of argv) {
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg.startsWith("--")) fail(`Unknown option ${arg}.`);
    else options.dir = arg;
  }
  if (!options.dir) fail("Usage: update.mjs <project-dir> [--dry-run]");
  return { ...options, dir: resolve(options.dir) };
}

function readState(dir) {
  const path = join(dir, STATE_FILE);
  if (!existsSync(path)) {
    fail(
      `${path} not found. Run this script on a project that setup.mjs created.`,
    );
  }
  const state = readJson(path);
  if (!state.commit || !state.name || !state.site) {
    fail(`${path} needs the keys commit, name, and site.`);
  }
  return state;
}

function assertCommit(commit) {
  if (gitOut(["cat-file", "-e", `${commit}^{commit}`]) === null) {
    fail(
      `The Starweb clone at ${repoRoot} does not have the commit ${commit}. Run "git -C ${repoRoot} fetch" and "git -C ${repoRoot} pull", then try again.`,
    );
  }
}

const LEGACY_TEMPLATE_PREFIX = `${TEMPLATE_DIR}/files/`;
const SYMLINK_MODE = "120000 ";
// The template holds this file since it holds the create-emdash output.
const STARTER_MARKER = "EMDASH.md";

const showAt = (commit, path) => gitOut(["show", `${commit}:${path}`]);

// Map each project path to its Starweb-owned path at a commit, without symbolic
// links. A project can point to a commit from before the template files moved
// out of template/files.
function ownedPaths(commit) {
  const names = (
    gitOut(["ls-tree", "-r", "-z", commit, "--", ...REPO_DOCS, TEMPLATE_DIR]) ??
    ""
  )
    .split("\0")
    .filter((line) => line !== "" && !line.startsWith(SYMLINK_MODE))
    .map((line) => line.slice(line.indexOf("\t") + 1));
  const prefix = names.some((name) => name.startsWith(LEGACY_TEMPLATE_PREFIX))
    ? LEGACY_TEMPLATE_PREFIX
    : `${TEMPLATE_DIR}/`;
  const entries = names.flatMap((source) => {
    if (!source.startsWith(`${TEMPLATE_DIR}/`)) return [[source, source]];
    const target = source.startsWith(prefix) ? source.slice(prefix.length) : "";
    return target === "" || target === TEMPLATE_PACKAGE
      ? []
      : [[target, source]];
  });
  return new Map(entries);
}

// Read a Starweb file at a commit, as setup.mjs wrote it into the project.
function starwebText(commit, source, target, values) {
  if (source === undefined) return null;
  const text = showAt(commit, source);
  if (text === null) return null;
  if (source.startsWith(`${TEMPLATE_DIR}/`)) return substitute(text, values);
  return target === "AGENTS.md" ? withEmdashRule(text) : text;
}

function planFiles(dir, state, head) {
  const baseSources = ownedPaths(state.commit);
  const headSources = ownedPaths(head);
  const targets = new Set([...baseSources.keys(), ...headSources.keys()]);
  // A project from a commit without the starter files owns its copies of them.
  const baseHasStarter = baseSources.has(STARTER_MARKER);
  return [...targets]
    .toSorted((a, b) => a.localeCompare(b))
    .map((target) => {
      const projectPath = join(dir, target);
      const ours = existsSync(projectPath) ? readText(projectPath) : null;
      const base = starwebText(
        state.commit,
        baseSources.get(target),
        target,
        state,
      );
      const theirs = starwebText(head, headSources.get(target), target, state);
      if (!baseHasStarter && base === null && ours !== null) {
        return { path: target, action: "skip" };
      }
      return { path: target, ...planFile({ base, theirs, ours }) };
    });
}

// Plan the changes of one package.json map (scripts or a dependency section).
function planMap(label, base, theirs, project, skip = []) {
  const next = { ...project };
  const changes = [];
  const kept = [];
  const gone = [];
  for (const [key, version] of Object.entries(theirs)) {
    if (skip.includes(key) || base[key] === version) continue;
    if (project[key] === version) continue;
    if (project[key] === base[key]) {
      next[key] = version;
      changes.push(
        `${label} ${key}: ${project[key] ?? "(none)"} -> ${version}`,
      );
    } else {
      kept.push(
        `${label} ${key}: project ${project[key] ?? "(none)"}, Starweb ${version}`,
      );
    }
  }
  for (const key of Object.keys(base)) {
    if (!skip.includes(key) && !(key in theirs)) gone.push(`${label} ${key}`);
  }
  return { next, changes, kept, gone };
}

function planPackageJson(dir, state, head) {
  const projectPath = join(dir, "package.json");
  const project = readJson(projectPath);
  const base = JSON.parse(
    showAt(state.commit, "template/package.json") ?? "{}",
  );
  const theirs = JSON.parse(showAt(head, "template/package.json") ?? "{}");
  const sections = [
    ["scripts", "script"],
    ...DEP_SECTIONS.map((s) => [s, "package"]),
  ];
  const result = { next: { ...project }, changes: [], kept: [], gone: [] };
  for (const [section, label] of sections) {
    const plan = planMap(
      label,
      base[section] ?? {},
      theirs[section] ?? {},
      project[section] ?? {},
      PIN_ONLY_TOOLS,
    );
    if (section in project || Object.keys(plan.next).length > 0) {
      result.next[section] =
        section === "scripts" ? plan.next : sortKeys(plan.next);
    }
    for (const key of ["changes", "kept", "gone"])
      result[key].push(...plan[key]);
  }
  const depsChanged = result.changes.some((line) =>
    line.startsWith("package "),
  );
  return { ...result, projectPath, depsChanged };
}

function applyFiles(dir, plans) {
  for (const { path, action, text } of plans) {
    if (text === undefined || action === "skip" || action === "kept") continue;
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
}

function listPaths(plans, ...actions) {
  return plans.filter((p) => actions.includes(p.action)).map((p) => p.path);
}

function changedRules(commit, head) {
  return (gitOut(["diff", "--name-only", commit, head, "--", "rules"]) ?? "")
    .split("\n")
    .filter(Boolean);
}

function printReview(commit, head) {
  if (commit === head) return;
  const range = `${commit.slice(0, 7)}..${head.slice(0, 7)}`;
  console.log(
    `\nRead the Starweb changes, then apply them to the project code (rules/UPDATE.md):
  git -C ${repoRoot} log --oneline ${range}
  git -C ${repoRoot} diff ${range} -- rules/ template/ WHY.md`,
  );
}

function printSummary(plans, pkg, dryRun, rules) {
  const groups = [
    ["Rules changed", rules],
    ["Updated", listPaths(plans, "updated")],
    ["Added", listPaths(plans, "added")],
    ["Merged", listPaths(plans, "merged")],
    ["Conflicts", listPaths(plans, "conflict")],
    ["Kept (the project deleted the file)", listPaths(plans, "kept")],
    ["Package changes", pkg.changes],
    ["Kept (project version differs)", pkg.kept],
    [
      "Deleted upstream (not deleted here)",
      [...listPaths(plans, "deleted"), ...pkg.gone],
    ],
  ];
  console.log(dryRun ? "\nDry run: no file changed.\n" : "\nSummary\n");
  for (const [title, items] of groups) {
    console.log(`${title}: ${items.length}`);
    for (const item of items) console.log(`  ${item}`);
  }
}

function installIfNeeded(dir, pkg) {
  if (!pkg.depsChanged) return;
  step("Run npm install");
  const result = spawnSync("npm", ["install"], { cwd: dir, stdio: "inherit" });
  if (result.status !== 0) throw new Error("npm install failed.");
}

function main() {
  const { dir, dryRun } = parseArgs(process.argv.slice(2));
  const state = readState(dir);
  if (!dryRun) assertNpm();
  assertCommit(state.commit);
  const head = starwebHead();
  step(
    `Plan the update from ${state.commit.slice(0, 7)} to ${head.slice(0, 7)}`,
  );
  const plans = planFiles(dir, state, head);
  const pkg = planPackageJson(dir, state, head);
  printSummary(plans, pkg, dryRun, changedRules(state.commit, head));
  printReview(state.commit, head);
  if (dryRun) return;
  applyFiles(dir, plans);
  if (pkg.changes.length > 0) writeJson(pkg.projectPath, pkg.next);
  installIfNeeded(dir, pkg);
  if (plans.some((p) => p.action === "conflict")) {
    console.error(
      `\nConflicts: resolve the markers (project, base, starweb), then set "commit" in ${STATE_FILE} to ${head}.`,
    );
    process.exitCode = 1;
    return;
  }
  writeJson(join(dir, STATE_FILE), { ...state, commit: head });
  console.log(`\nUpdated ${STATE_FILE} to ${head}.`);
}

try {
  main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
