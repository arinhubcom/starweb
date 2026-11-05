// Measure the performance score of the production site with the PageSpeed
// Insights API. Run with: pnpm run pagespeed [url...]
// Needs network access and PAGESPEED_API_KEY. See Performance in rules/PERF.md.
import { SITE } from "../src/lib/site.ts";
import {
  TARGET_SCORE,
  median,
  parsePageSpeed,
  type PageSpeedResult,
} from "./lib/perf.ts";

const API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const STRATEGIES = ["mobile", "desktop"] as const;
const RUNS = 3;
const TIMEOUT_MS = 120_000;

type Strategy = (typeof STRATEGIES)[number];

interface Row {
  url: string;
  strategy: Strategy;
  score: number;
  runs: number;
  lcpMs: number;
  tbtMs: number;
  cls: number;
}

const parseUrls = (args: readonly string[]): string[] =>
  (args.length > 0 ? args : [SITE]).map((arg) => {
    let parsed: URL;
    try {
      parsed = new URL(arg);
    } catch {
      throw new Error(`Not a valid URL: ${arg}`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`The URL must use http or https: ${arg}`);
    }
    return parsed.href;
  });

// The request URL holds the key, so no error message includes it.
const runOnce = async (
  url: string,
  strategy: Strategy,
  key: string,
): Promise<PageSpeedResult> => {
  const query = new URLSearchParams({
    url,
    strategy,
    category: "performance",
    key,
  });
  const response = await fetch(`${API}?${query}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    const message = (await response.text().catch(() => ""))
      .replaceAll(key, "[redacted]")
      .slice(0, 500);
    throw new Error(
      `PageSpeed request for ${url} (${strategy}) failed: ${response.status} ${message}`,
    );
  }
  return parsePageSpeed(await response.json());
};

// One run after the other: parallel runs would all miss the cache.
const runInSequence = async (
  remaining: number,
  url: string,
  strategy: Strategy,
  key: string,
): Promise<PageSpeedResult[]> => {
  if (remaining === 0) return [];
  const first = await runOnce(url, strategy, key);
  return [first, ...(await runInSequence(remaining - 1, url, strategy, key))];
};

const measure = async (
  url: string,
  strategy: Strategy,
  key: string,
): Promise<Row> => {
  const results = await runInSequence(RUNS, url, strategy, key);
  return {
    url,
    strategy,
    score: median(results.map((result) => result.score)),
    runs: results.length,
    lcpMs: median(results.map((result) => result.lcpMs)),
    tbtMs: median(results.map((result) => result.tbtMs)),
    cls: median(results.map((result) => result.cls)),
  };
};

const main = async () => {
  const key = process.env.PAGESPEED_API_KEY;
  if (!key) {
    console.error(
      "PAGESPEED_API_KEY is not set. Create a Google API key with the PageSpeed Insights API enabled, then set the variable.",
    );
    process.exit(1);
  }
  const urls = parseUrls(process.argv.slice(2));
  const rows = await Promise.all(
    urls.flatMap((url) =>
      STRATEGIES.map((strategy) => measure(url, strategy, key)),
    ),
  );
  console.table(
    rows.map((row) => ({
      url: row.url,
      strategy: row.strategy,
      "median score": row.score,
      runs: row.runs,
      "median LCP (ms)": Math.round(row.lcpMs),
      "median TBT (ms)": Math.round(row.tbtMs),
      "median CLS": Number(row.cls.toFixed(3)),
    })),
  );
  const low = rows.filter((row) => row.score < TARGET_SCORE);
  if (low.length > 0) {
    console.error(
      low
        .map(
          (row) =>
            `${row.url} (${row.strategy}): median score ${row.score}, below ${TARGET_SCORE}`,
        )
        .join("\n"),
    );
    process.exit(1);
  }
};

try {
  await main();
} catch (error) {
  console.error(
    `The PageSpeed check failed.\n${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exit(1);
}
