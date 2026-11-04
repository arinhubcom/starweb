import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { brotliCompressSync } from "node:zlib";
import { preview } from "astro";
import { z } from "zod";
import { measurePageJs, type PageJs } from "./lib/page-js";

const LIMITS_FILE = "page-js-limits.json";
const SIZE_LIMIT_CONFIG = ".size-limit.mjs";
const RETRY_TIMEOUT_MS = 60_000;
const RETRY_DELAY_MS = 1_000;
const RESERVED_PORTS = { from: 4501, to: 4599 };

const limitsSchema = z
  .record(
    z.string().startsWith("/", "A path must start with /"),
    z.number().int().nonnegative(),
  )
  .refine((limits) => Object.keys(limits).length > 0, {
    message: "Add at least one page",
  });

const encoder = new TextEncoder();

function brotliSize(code: string): number {
  return brotliCompressSync(encoder.encode(code)).length;
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

const TRAILING_SLASH = /\/$/;

function normalize(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(TRAILING_SLASH, "") : pathname;
}

async function islandEntryCount(): Promise<number> {
  const href = pathToFileURL(resolve(SIZE_LIMIT_CONFIG)).href;
  const config = (await import(href)) as { default: unknown };
  if (!Array.isArray(config.default)) {
    throw new Error(`${SIZE_LIMIT_CONFIG} must export an array.`);
  }
  return config.default.length;
}

async function checkIslands(): Promise<boolean> {
  if ((await islandEntryCount()) === 0) {
    console.log("No islands found. Skipping the island size check.");
    return true;
  }
  const bin = resolve("node_modules/.bin/size-limit");
  return spawnSync(bin, { stdio: "inherit" }).status === 0;
}

function readLimits(): Record<string, number> {
  const raw: unknown = JSON.parse(readFileSync(LIMITS_FILE, "utf8"));
  const parsed = limitsSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `${LIMITS_FILE} is not valid: ${z.prettifyError(parsed.error)}`,
    );
  }
  return parsed.data;
}

function isReserved(port: number): boolean {
  return port >= RESERVED_PORTS.from && port <= RESERVED_PORTS.to;
}

async function listenOnce(): Promise<number> {
  const server = createServer();
  await new Promise<void>((ready, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", ready);
  });
  const address = server.address();
  await new Promise<void>((done) => {
    server.close(() => {
      done();
    });
  });
  if (address === null || typeof address === "string") {
    throw new Error("Could not find a free port.");
  }
  return address.port;
}

async function freePort(): Promise<number> {
  const port = await listenOnce();
  return isReserved(port) ? freePort() : port;
}

interface Fetched {
  readonly url: string;
  readonly html: string;
}

async function fetchOnce(
  base: string,
  path: string,
): Promise<Fetched | string> {
  const response = await fetch(new URL(path, base), { redirect: "follow" });
  if (response.status >= 500) return `status ${String(response.status)}`;
  const finalPath = normalize(new URL(response.url).pathname);
  if (response.status !== 200 || finalPath !== normalize(path)) {
    throw new Error(
      `${path}: expected status 200 at ${path}, got ${String(response.status)} at ${finalPath}. ` +
        "The page may redirect to a login page or not exist.",
    );
  }
  return { url: response.url, html: await response.text() };
}

async function fetchPage(base: string, path: string): Promise<Fetched> {
  const deadline = Date.now() + RETRY_TIMEOUT_MS;
  for (;;) {
    const outcome = await fetchOnce(base, path).catch((error: unknown) => {
      if (error instanceof Error && error.message.startsWith(`${path}:`)) {
        throw error;
      }
      return error instanceof Error ? error.message : String(error);
    });
    if (typeof outcome !== "string") return outcome;
    if (Date.now() > deadline) {
      throw new Error(`${path}: no good response in 60 s (${outcome}).`);
    }
    await sleep(RETRY_DELAY_MS);
  }
}

async function loadScript(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Could not load ${url}: status ${String(response.status)}.`,
    );
  }
  return response.text();
}

function printPage(path: string, limit: number, result: PageJs): void {
  const status = result.total > limit ? "OVER" : "ok";
  console.log(
    `\n${path}  ${String(result.total)} / ${String(limit)} B brotli  ${status}`,
  );
  for (const file of result.files) {
    console.log(`  ${String(file.bytes).padStart(8)} B  ${file.name}`);
  }
}

async function checkPage(
  base: string,
  path: string,
  limit: number,
): Promise<boolean> {
  const page = await fetchPage(base, path);
  const result = await measurePageJs(
    page.html,
    page.url,
    loadScript,
    brotliSize,
  );
  printPage(path, limit, result);
  return result.total <= limit;
}

async function checkPages(): Promise<boolean> {
  const limits = Object.entries(readLimits());
  const server = await preview({
    root: ".",
    server: { port: await freePort(), host: "127.0.0.1" },
    logLevel: "warn",
  });
  try {
    const base = `http://${server.host ?? "127.0.0.1"}:${String(server.port)}`;
    const results: boolean[] = [];
    for (const [path, limit] of limits) {
      results.push(await checkPage(base, path, limit));
    }
    return results.every(Boolean);
  } finally {
    await server.stop();
  }
}

async function main(): Promise<boolean> {
  const islandsOk = await checkIslands();
  const pagesOk = await checkPages();
  if (!islandsOk) console.error("\nAn island failed its size check.");
  if (!pagesOk) console.error("\nA page is over its limit.");
  return islandsOk && pagesOk;
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
