#!/usr/bin/env node
// Checks that WHY.md stays in step with rules/ and template/package.json.
// Errors: a broken link or anchor, a test note with no date, a test note with
// another major version than the template pin. Warning: another minor version.
// It cannot tell whether a reason is true or missing: see rules/AGENTS.md.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT_DOCS = ["AGENTS.md", "GEMINI.md", "README.md", "TODO.md", "WHY.md"];
const PACKAGE_BY_NAME = {
  Astro: "astro",
  EmDash: "emdash",
  React: "react",
  TypeScript: "typescript",
  Vitest: "vitest",
  Wrangler: "wrangler",
  Zod: "zod",
};
const NAMED_VERSION =
  /(?<!Storybook )\b(Astro|EmDash|React|TypeScript|Vitest|Wrangler|Zod)\s+v?(\d+(?:\.\d+)*)/g;
const PACKAGE_VERSION = /`(@?[\w./-]+)`\s+v?(\d+(?:\.\d+)*)/g;

export const slugify = (heading) =>
  heading
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replaceAll("`", "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_\- ]/gu, "")
    .replaceAll(" ", "-");

// Lines outside code fences, as [lineNumber, text] pairs.
const proseLines = (text) => {
  let inFence = false;
  return text.split("\n").flatMap((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return [];
    }
    return inFence ? [] : [[index + 1, line]];
  });
};

const anchorsOf = (text) => {
  const seen = new Map();
  return new Set(
    proseLines(text).flatMap(([, line]) => {
      const heading = line.match(/^#{1,6} (.+)/);
      if (!heading) return [];
      const slug = slugify(heading[1].replace(/\s+#+\s*$/, ""));
      const count = seen.get(slug) ?? 0;
      seen.set(slug, count + 1);
      return [count === 0 ? slug : `${slug}-${count}`];
    }),
  );
};

const isBrokenTarget = (from, target, files) => {
  const [path, anchor] = target.split("#");
  if (path && !path.endsWith(".md")) return false;
  const targetFile = path ? normalize(posix.join(posix.dirname(from), path)) : from;
  if (!(targetFile in files)) return true;
  return Boolean(anchor) && !anchorsOf(files[targetFile]).has(decodeURIComponent(anchor));
};

// files: { "repo/relative/path.md": "text" }.
export const findBrokenLinks = (files) =>
  Object.entries(files).flatMap(([from, text]) =>
    proseLines(text).flatMap(([number, line]) =>
      [...line.replace(/`[^`]*`/g, "").matchAll(/\]\(([^)\s]+)\)/g)]
        .map((match) => match[1])
        .filter((target) => !/^[a-z]+:/.test(target))
        .filter((target) => isBrokenTarget(from, target, files))
        .map((target) => `${from}:${number}: ${target}`),
    ),
  );

const versionsIn = (line, pins) => [
  ...[...line.matchAll(NAMED_VERSION)].map(([, name, version]) => ({
    label: name,
    pin: pins[PACKAGE_BY_NAME[name]],
    version,
  })),
  ...[...line.matchAll(PACKAGE_VERSION)].map(([, name, version]) => ({
    label: name,
    pin: pins[name],
    version,
  })),
];

const compareToPin = (number, { label, pin, version }) => {
  if (!pin) return {};
  const [major, minor] = version.split(".");
  const [pinMajor, pinMinor] = pin.split(".");
  const message = `WHY.md:${number}: ${label} ${version}, template pins ${pin}`;
  if (major !== pinMajor) return { error: message };
  return minor !== undefined && minor !== pinMinor ? { warning: message } : {};
};

// A test note is a line with the word "tested" and a version number.
export const findVersionProblems = (why, pins) => {
  const notes = proseLines(why).filter(
    ([, line]) => /\btested\b/i.test(line) && /\b\d+\.\d+/.test(line),
  );
  const undated = notes
    .filter(([, line]) => !/\b\d{4}-\d{2}-\d{2}\b/.test(line))
    .map(([number]) => `WHY.md:${number}: test note names a version but no YYYY-MM-DD date`);
  const compared = notes.flatMap(([number, line]) =>
    versionsIn(line, pins).map((found) => compareToPin(number, found)),
  );
  return {
    errors: [...undated, ...compared.flatMap(({ error }) => (error ? [error] : []))],
    warnings: compared.flatMap(({ warning }) => (warning ? [warning] : [])),
  };
};

const readDocs = () => {
  const ruleDocs = readdirSync(join(repoRoot, "rules"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => `rules/${name}`);
  return Object.fromEntries(
    [...ROOT_DOCS, ...ruleDocs].map((path) => [path, readFileSync(join(repoRoot, path), "utf8")]),
  );
};

const readPins = () => {
  const manifest = JSON.parse(readFileSync(join(repoRoot, "template/package.json"), "utf8"));
  return { ...manifest.dependencies, ...manifest.devDependencies };
};

const main = () => {
  const docs = readDocs();
  const brokenLinks = findBrokenLinks(docs);
  const { errors, warnings } = findVersionProblems(docs["WHY.md"], readPins());
  const allErrors = [...brokenLinks.map((link) => `Broken link: ${link}`), ...errors];
  warnings.forEach((warning) => console.log(`::warning::${warning}`));
  allErrors.forEach((error) => console.error(`::error::${error}`));
  console.log(`check-why: ${allErrors.length} errors, ${warnings.length} warnings`);
  process.exitCode = allErrors.length > 0 ? 1 : 0;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
