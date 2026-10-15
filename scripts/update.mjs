#!/usr/bin/env node
// Bring Starweb changes into a project that setup.mjs created, with a
// three-way merge: base (Starweb at the recorded commit), theirs (Starweb
// HEAD), and ours (the project file).
// Usage: node <starweb>/scripts/update.mjs <project-dir> [--dry-run]
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  PIN_ONLY_TOOLS,
  REPO_DOCS,
  STATE_FILE,
  TEMPLATE_FILES,
  assertNpm,
  fail,
  gitOut,
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

const MAX_CONFLICTS = 127;
const DEP_SECTIONS = ["dependencies", "devDependencies"];

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

const showAt = (commit, path) => gitOut(["show", `${commit}:${path}`]);

// Map each Starweb-owned path at a commit to its path in the project.
function ownedPaths(commit) {
  const names = gitOut([
    "ls-tree",
    "-r",
    "--name-only",
    commit,
    "--",
    ...REPO_DOCS,
    TEMPLATE_FILES,
  ]);
  const prefix = `${TEMPLATE_FILES}/`;
  return (names ?? "")
    .split("\n")
    .filter(Boolean)
    .map((source) => ({
      source,
      target: source.startsWith(prefix) ? source.slice(prefix.length) : source,
    }));
}

// Read a Starweb file at a commit, as setup.mjs wrote it into the project.
function starwebText(commit, source, target, values) {
  const text = showAt(commit, source);
  if (text === null) return null;
  if (source.startsWith(`${TEMPLATE_FILES}/`)) return substitute(text, values);
  return target === "AGENTS.md" ? withEmdashRule(text) : text;
}

function mergeThreeWay(ours, base, theirs) {
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
function planFile({ base, theirs, ours }) {
  if (theirs === base) return { action: "skip" };
  if (theirs === null) return { action: ours === null ? "skip" : "deleted" };
  if (ours === null)
    return { action: base === null ? "added" : "kept", text: theirs };
  if (ours === theirs) return { action: "skip" };
  if (ours === base) return { action: "updated", text: theirs };
  const merged = mergeThreeWay(ours, base ?? "", theirs);
  return { action: merged.conflict ? "conflict" : "merged", text: merged.text };
}

function planFiles(dir, state, head) {
  const targets = new Map();
  for (const commit of [state.commit, head]) {
    for (const { source, target } of ownedPaths(commit)) {
      targets.set(target, { source, target });
    }
  }
  return [...targets.values()]
    .sort((a, b) => a.target.localeCompare(b.target))
    .map(({ source, target }) => {
      const projectPath = join(dir, target);
      const ours = existsSync(projectPath) ? readText(projectPath) : null;
      const base = starwebText(state.commit, source, target, state);
      const theirs = starwebText(head, source, target, state);
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
    result.next[section] =
      section === "scripts" ? plan.next : sortKeys(plan.next);
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

function printSummary(plans, pkg, dryRun) {
  const groups = [
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
  printSummary(plans, pkg, dryRun);
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
