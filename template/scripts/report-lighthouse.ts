// Print the Lighthouse CI scores of a pull request. Run with:
// pnpm run lighthouse (after pnpm run build). See Performance in rules/PERF.md.
// In GitHub Actions a low score is a warning annotation and the exit code is 0,
// so that the check never holds up a pull request. Elsewhere it exits with 1.
import { appendFileSync, readFileSync } from "node:fs";
import {
  TARGET_SCORE,
  parseLighthouseManifest,
  type LighthouseRun,
} from "./lib/perf.ts";

const MANIFEST = ".lighthouseci/out/manifest.json";

const readRuns = (): LighthouseRun[] => {
  let text: string;
  try {
    text = readFileSync(MANIFEST, "utf8");
  } catch {
    throw new Error(
      `Cannot read ${MANIFEST}. Run lhci collect and lhci upload first.`,
    );
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${MANIFEST} is not valid JSON`);
  }
  return parseLighthouseManifest(json);
};

const summaryTable = (runs: readonly LighthouseRun[]): string =>
  [
    "### Lighthouse (median of 3 runs, mobile, performance)",
    "",
    "| URL | Score | Target |",
    "| --- | --- | --- |",
    ...runs.map((run) => `| ${run.url} | ${run.score} | ${TARGET_SCORE} |`),
    "",
  ].join("\n");

const main = () => {
  const runs = readRuns();
  console.table(
    runs.map((run) => ({ url: run.url, "median score": run.score })),
  );
  const inActions = process.env.GITHUB_ACTIONS === "true";
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (inActions && summaryFile) {
    appendFileSync(summaryFile, summaryTable(runs));
  }
  const low = runs.filter((run) => run.score < TARGET_SCORE);
  if (low.length === 0) return;
  const lines = low.map(
    (run) => `${run.url}: median score ${run.score}, below ${TARGET_SCORE}`,
  );
  if (inActions) {
    // An annotation holds one line, so each URL gets its own.
    for (const line of lines) {
      console.log(`::warning title=Lighthouse::${line}`);
    }
    return;
  }
  console.error(lines.join("\n"));
  process.exit(1);
};

try {
  main();
} catch (error) {
  console.error(
    `The Lighthouse report failed.\n${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exit(1);
}
