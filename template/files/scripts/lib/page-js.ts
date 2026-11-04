import { parse as lex } from "es-module-lexer/js";
import { parse, type DefaultTreeAdapterMap } from "parse5";

type Node = DefaultTreeAdapterMap["node"];
type Element = DefaultTreeAdapterMap["element"];

interface InlineScript {
  readonly code: string;
  readonly module: boolean;
}

export interface PageScripts {
  readonly urls: readonly string[];
  readonly inline: readonly InlineScript[];
}

interface FileSize {
  readonly name: string;
  readonly bytes: number;
}

export interface PageJs {
  readonly files: readonly FileSize[];
  readonly total: number;
}

export type Load = (url: string) => Promise<string>;
export type Size = (code: string) => number;

const JS_TYPES = new Set([
  "",
  "module",
  "text/javascript",
  "application/javascript",
]);
const ISLAND_URL_ATTRIBUTES = [
  "component-url",
  "renderer-url",
  "before-hydration-url",
];

function isElement(node: Node): node is Element {
  return "tagName" in node;
}

function childrenOf(node: Node): readonly Node[] {
  if ("content" in node) return node.content.childNodes;
  return "childNodes" in node ? node.childNodes : [];
}

function elementsIn(node: Node): readonly Element[] {
  const own = isElement(node) ? [node] : [];
  return [...own, ...childrenOf(node).flatMap(elementsIn)];
}

function attr(element: Element, name: string): string | undefined {
  return element.attrs.find((a) => a.name === name)?.value;
}

function textOf(element: Element): string {
  return element.childNodes
    .map((child) => ("value" in child ? child.value : ""))
    .join("");
}

function typeOf(script: Element): string {
  return (attr(script, "type") ?? "").trim().toLowerCase();
}

function isJavaScript(script: Element): boolean {
  return JS_TYPES.has(typeOf(script));
}

function urlsOf(element: Element): readonly string[] {
  const values = (names: readonly string[]) =>
    names.flatMap((name) => attr(element, name) ?? []);
  if (element.tagName === "astro-island") return values(ISLAND_URL_ATTRIBUTES);
  if (element.tagName === "script") {
    return isJavaScript(element) ? values(["src"]) : [];
  }
  const isPreload = attr(element, "rel")?.toLowerCase() === "modulepreload";
  return element.tagName === "link" && isPreload ? values(["href"]) : [];
}

function inlineOf(element: Element): readonly InlineScript[] {
  if (element.tagName !== "script" || attr(element, "src") !== undefined) {
    return [];
  }
  if (!isJavaScript(element)) return [];
  return [{ code: textOf(element), module: typeOf(element) === "module" }];
}

/** Finds the script URLs and inline scripts that a page loads. */
export function findPageScripts(html: string): PageScripts {
  const elements = elementsIn(parse(html));
  return {
    urls: elements.flatMap(urlsOf),
    inline: elements.flatMap(inlineOf),
  };
}

/** Returns the specifiers of static imports and re-exports. */
export function findStaticImports(code: string): readonly string[] {
  const [imports] = lex(code);
  return imports.flatMap((i) =>
    i.type === "static" || i.type === "reexport-star" ? [i.specifier] : [],
  );
}

function resolveUrl(specifier: string, importer: string): string {
  const url = new URL(specifier, importer);
  url.hash = "";
  return url.href;
}

function displayName(url: string): string {
  const { pathname, search } = new URL(url);
  return `${pathname}${search}`;
}

interface Walk {
  readonly files: readonly FileSize[];
  readonly seen: ReadonlySet<string>;
}

async function visit(
  url: string,
  load: Load,
  size: Size,
  walk: Walk,
): Promise<Walk> {
  if (walk.seen.has(url)) return walk;
  const seen = new Set([...walk.seen, url]);
  const code = await load(url);
  const next: Walk = {
    ...walk,
    seen,
    files: [...walk.files, { name: displayName(url), bytes: size(code) }],
  };
  return visitAll(
    findStaticImports(code).map((s) => resolveUrl(s, url)),
    load,
    size,
    next,
  );
}

async function visitAll(
  urls: readonly string[],
  load: Load,
  size: Size,
  start: Walk,
): Promise<Walk> {
  let walk = start;
  for (const url of urls) {
    walk = await visit(url, load, size, walk);
  }
  return walk;
}

/**
 * Measures the JavaScript that a page loads: its scripts, preloads, islands,
 * and inline scripts, plus the static import closure of each. Dynamic
 * `import()` is lazy and does not count.
 */
export async function measurePageJs(
  html: string,
  pageUrl: string,
  load: Load,
  size: Size,
): Promise<PageJs> {
  const page = findPageScripts(html);
  const inlineFiles = page.inline.map((script, index) => ({
    name: `inline #${String(index + 1)}`,
    bytes: size(script.code),
  }));
  const inlineImports = page.inline
    .filter((script) => script.module)
    .flatMap((script) => findStaticImports(script.code));
  const entries = [...page.urls, ...inlineImports].map((u) =>
    resolveUrl(u, pageUrl),
  );
  const walk = await visitAll(entries, load, size, {
    files: inlineFiles,
    seen: new Set(),
  });
  return {
    files: walk.files,
    total: walk.files.reduce((sum, file) => sum + file.bytes, 0),
  };
}
