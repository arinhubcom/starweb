// Tests for check-why.mjs. Run: node --test scripts/check-why.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findBrokenLinks,
  findVersionProblems,
  slugify,
} from "./check-why.mjs";

const pins = { astro: "7.4.4", emdash: "1.4.0", vitest: "5.0.5" };

test("slugify follows GitHub heading anchors", () => {
  assert.equal(slugify("Why limits have 10 % headroom"), "why-limits-have-10--headroom");
  assert.equal(slugify("Why `@cloudflare/vitest-plugin`"), "why-cloudflarevitest-plugin");
  assert.equal(slugify("[Astro](https://docs.astro.build/)"), "astro");
  assert.equal(slugify("Why WCAG 2.2 AA"), "why-wcag-22-aa");
});

const docs = {
  "WHY.md": "# Why\n\n## Known\n\n[deps](rules/DEPS.md#pins)\n[bad](rules/GONE.md)\n",
  "rules/DEPS.md": "### Pins\n\n[ok](../WHY.md#known)\n[bad](../WHY.md#missing)\n",
};

test("findBrokenLinks reports a missing anchor and a missing file", () => {
  assert.deepEqual(findBrokenLinks(docs), [
    "WHY.md:6: rules/GONE.md",
    "rules/DEPS.md:4: ../WHY.md#missing",
  ]);
});

test("findBrokenLinks ignores links in inline code and code fences", () => {
  const files = {
    "a.md": "`[x](FILE.md)` text\n\n```\n[y](gone.md)\n```\n[z](https://example.com/a.md)\n",
  };
  assert.deepEqual(findBrokenLinks(files), []);
});

test("findBrokenLinks ignores a heading in a code fence as a target", () => {
  const files = { "a.md": "```\n# Fake\n```\n[x](#fake)\n" };
  assert.deepEqual(findBrokenLinks(files), ["a.md:4: #fake"]);
});

test("findBrokenLinks numbers repeated headings like GitHub", () => {
  const files = { "a.md": "## Why\n\n## Why\n\n[x](#why-1)\n[y](#why-2)\n" };
  assert.deepEqual(findBrokenLinks(files), ["a.md:6: #why-2"]);
});

test("findBrokenLinks ignores indented and tilde code fences", () => {
  const files = { "a.md": "  ```\n[x](gone.md)\n  ```\n~~~\n# Fake\n~~~\n[y](#fake)\n" };
  assert.deepEqual(findBrokenLinks(files), ["a.md:7: #fake"]);
});

test("findBrokenLinks accepts an encoded anchor and a closing heading mark", () => {
  const files = { "a.md": "# Café\n\n# Foo #\n\n[x](#caf%C3%A9)\n[y](#foo)\n" };
  assert.deepEqual(findBrokenLinks(files), []);
});

test("a current test note passes", () => {
  const why = "- Tested on 2026-11-04 with Astro 7.4.4 and EmDash 1.4.0: it works.\n";
  assert.deepEqual(findVersionProblems(why, pins), { errors: [], warnings: [] });
});

test("a test note with another major version is an error", () => {
  const why = "- Tested on 2026-10-14 in Vitest 4.1.11 browser mode: it works.\n";
  assert.deepEqual(findVersionProblems(why, pins), {
    errors: ["WHY.md:1: Vitest 4.1.11, template pins 5.0.5"],
    warnings: [],
  });
});

test("a test note with another minor version is a warning", () => {
  const why = "- Tested on 2026-10-14 with `astro` 7.3 and EmDash 1.4.1: it works.\n";
  assert.deepEqual(findVersionProblems(why, pins), {
    errors: [],
    warnings: ["WHY.md:1: astro 7.3, template pins 7.4.4"],
  });
});

test("a test note with a version and no date is an error", () => {
  const why = "- It does not hash scripts (tested with Astro 7.4.4), so add a hash.\n";
  assert.deepEqual(findVersionProblems(why, pins), {
    errors: ["WHY.md:1: test note names a version but no YYYY-MM-DD date"],
    warnings: [],
  });
});

test("a package the template does not pin is skipped", () => {
  const why = "- Tested on 2026-11-04 with Playwright 1.64.1: it works.\n";
  assert.deepEqual(findVersionProblems(why, pins), { errors: [], warnings: [] });
});

test("a line without a test note is skipped", () => {
  const why = "- On Vitest 4.1.11, npm hoisted old copies.\n- The tested rules help.\n";
  assert.deepEqual(findVersionProblems(why, pins), { errors: [], warnings: [] });
});
