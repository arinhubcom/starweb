import { describe, expect, it } from "vitest";
import {
  findPageScripts,
  findStaticImports,
  measurePageJs,
} from "../scripts/lib/page-js";

const PAGE = "http://127.0.0.1:4000/blog/";

// One byte per character keeps the expected numbers readable.
const size = (code: string) => code.length;

function loaderFor(files: Record<string, string>) {
  const calls: string[] = [];
  const load = (url: string): Promise<string> => {
    calls.push(url);
    const code = files[new URL(url).pathname];
    return code === undefined
      ? Promise.reject(new Error(`404 ${url}`))
      : Promise.resolve(code);
  };
  return { load, calls };
}

describe("findPageScripts", () => {
  it("finds external scripts, modulepreload links, and island URLs", () => {
    const html = `<link rel="modulepreload" href="/_astro/a.js">
      <script type="module" src="/_astro/b.js"></script>
      <astro-island component-url="/_astro/c.js" renderer-url="/_astro/d.js" before-hydration-url="/_astro/e.js"></astro-island>`;
    expect(findPageScripts(html).urls).toEqual([
      "/_astro/a.js",
      "/_astro/b.js",
      "/_astro/c.js",
      "/_astro/d.js",
      "/_astro/e.js",
    ]);
  });

  it("ignores a script inside an HTML comment", () => {
    const html = `<!-- <script src="/_astro/old.js"></script> --><p>x</p>`;
    expect(findPageScripts(html).urls).toEqual([]);
  });

  it("reads single-quoted and unquoted attributes", () => {
    const html = `<script src='/a.js'></script><script src=/b.js></script>`;
    expect(findPageScripts(html).urls).toEqual(["/a.js", "/b.js"]);
  });

  it("ignores src on a script type that does not run", () => {
    const html = `<script type="text/plain" src="/a.js"></script>`;
    expect(findPageScripts(html).urls).toEqual([]);
  });

  it("does not treat data-src as src", () => {
    const html = `<script data-src="/a.js"></script><img data-src="/b.js">`;
    const found = findPageScripts(html);
    expect(found.urls).toEqual([]);
    expect(found.inline).toHaveLength(1);
  });

  it("ignores component-url on an element that is not astro-island", () => {
    const html = `<div component-url="/a.js"></div><p>component-url="/b.js"</p>`;
    expect(findPageScripts(html).urls).toEqual([]);
  });

  it("ignores links that are not modulepreload", () => {
    const html = `<link rel="stylesheet" href="/a.css"><link rel="preload" href="/b.js" as="script">`;
    expect(findPageScripts(html).urls).toEqual([]);
  });

  it("excludes data blocks such as ld+json and speculationrules", () => {
    const html = `<script type="application/ld+json">{"a":1}</script>
      <script type="speculationrules">{"prefetch":[]}</script>
      <script type="importmap">{"imports":{}}</script>`;
    const found = findPageScripts(html);
    expect(found.inline).toEqual([]);
    expect(found.urls).toEqual([]);
  });

  it("keeps inline scripts with a JavaScript type", () => {
    const html = `<script>a()</script><script type="">b()</script>
      <script type="module">import "/m.js"</script>
      <script type="text/javascript">c()</script>
      <script type="application/javascript">d()</script>`;
    expect(findPageScripts(html).inline).toEqual([
      { code: "a()", module: false },
      { code: "b()", module: false },
      { code: 'import "/m.js"', module: true },
      { code: "c()", module: false },
      { code: "d()", module: false },
    ]);
  });

  it("does not count the text of a script that has a src", () => {
    const html = `<script src="/a.js">ignored()</script>`;
    expect(findPageScripts(html).inline).toEqual([]);
  });
});

describe("findStaticImports", () => {
  it("returns static imports and re-exports", () => {
    const code = `import a from "./a.js";import"./b.js";export*from"./c.js";export{x}from'./d.js';`;
    expect(findStaticImports(code)).toEqual([
      "./a.js",
      "./b.js",
      "./c.js",
      "./d.js",
    ]);
  });

  it("does not return dynamic imports", () => {
    expect(findStaticImports(`const m = () => import("./lazy.js");`)).toEqual(
      [],
    );
  });

  it("does not return import-like text in strings and comments", () => {
    const code = `const s = 'import x from "./x.js"'; // import y from "./y.js"
      const t = \`from "./z.js"\`; /* export * from "./w.js" */`;
    expect(findStaticImports(code)).toEqual([]);
  });
});

describe("measurePageJs", () => {
  it("sums the entry files and the static import closure", async () => {
    const { load } = loaderFor({
      "/_astro/a.js": `import "./b.js";aaaa`,
      "/_astro/b.js": `bb`,
    });
    const html = `<script type="module" src="/_astro/a.js"></script>`;
    const result = await measurePageJs(html, PAGE, load, size);
    expect(result.files).toEqual([
      { name: "/_astro/a.js", bytes: 20 },
      { name: "/_astro/b.js", bytes: 2 },
    ]);
    expect(result.total).toBe(22);
  });

  it("counts inline scripts by their own size", async () => {
    const { load } = loaderFor({});
    const result = await measurePageJs(
      `<script>abcde</script>`,
      PAGE,
      load,
      size,
    );
    expect(result.files).toEqual([{ name: "inline #1", bytes: 5 }]);
    expect(result.total).toBe(5);
  });

  it("follows static imports of an inline module script", async () => {
    const { load } = loaderFor({ "/m.js": "mm" });
    const html = `<script type="module">import "/m.js"</script>`;
    const result = await measurePageJs(html, PAGE, load, size);
    expect(result.files.map((f) => f.name)).toEqual(["inline #1", "/m.js"]);
  });

  it("does not follow a dynamic import", async () => {
    const { load, calls } = loaderFor({
      "/a.js": `export const f = () => import("./lazy.js");`,
      "/lazy.js": "big",
    });
    await measurePageJs(`<script src="/a.js"></script>`, PAGE, load, size);
    expect(calls).toEqual(["http://127.0.0.1:4000/a.js"]);
  });

  it("does not treat a string that looks like an import as an import", async () => {
    const { load, calls } = loaderFor({
      "/a.js": `const s = 'import x from "./x.js"';`,
    });
    await measurePageJs(`<script src="/a.js"></script>`, PAGE, load, size);
    expect(calls).toHaveLength(1);
  });

  it("stops at an import cycle", async () => {
    const { load, calls } = loaderFor({
      "/a.js": `import "./b.js";`,
      "/b.js": `import "./a.js";`,
    });
    const result = await measurePageJs(
      `<script src="/a.js"></script>`,
      PAGE,
      load,
      size,
    );
    expect(calls).toHaveLength(2);
    expect(result.files).toHaveLength(2);
  });

  it("counts a file once when several files import it", async () => {
    const { load, calls } = loaderFor({
      "/a.js": `import "./shared.js";`,
      "/b.js": `import "/shared.js";`,
      "/shared.js": "ss",
    });
    const html = `<script src="/a.js"></script><link rel="modulepreload" href="/b.js"><script src="/a.js"></script>`;
    const result = await measurePageJs(html, PAGE, load, size);
    expect(calls.filter((url) => url.endsWith("/shared.js"))).toHaveLength(1);
    expect(result.files.map((f) => f.name).toSorted()).toEqual([
      "/a.js",
      "/b.js",
      "/shared.js",
    ]);
  });

  it("resolves relative imports against the importing file", async () => {
    const { load } = loaderFor({
      "/_astro/a.js": `import "../lib/c.js";`,
      "/lib/c.js": "cc",
    });
    const result = await measurePageJs(
      `<script src="/_astro/a.js"></script>`,
      PAGE,
      load,
      size,
    );
    expect(result.files.map((f) => f.name)).toContain("/lib/c.js");
  });

  it("counts a script from another origin", async () => {
    const { load, calls } = loaderFor({ "/api.js": "12345" });
    const html = `<script src="https://challenges.example/api.js"></script>`;
    const result = await measurePageJs(html, PAGE, load, size);
    expect(calls).toEqual(["https://challenges.example/api.js"]);
    expect(result.total).toBe(5);
  });

  it("rejects when a script fails to load", async () => {
    const { load } = loaderFor({});
    await expect(
      measurePageJs(`<script src="/missing.js"></script>`, PAGE, load, size),
    ).rejects.toThrow("404");
  });

  it("returns zero for a page without scripts", async () => {
    const { load } = loaderFor({});
    const result = await measurePageJs("<p>hi</p>", PAGE, load, size);
    expect(result).toEqual({ files: [], total: 0 });
  });
});
