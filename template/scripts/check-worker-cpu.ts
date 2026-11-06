// Measure the CPU and wall time of a production Worker over the last 24 hours
// with the Workers Observability Telemetry API.
// Run with: pnpm run worker-cpu <worker-name>
// Needs network access, CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_OBSERVABILITY_TOKEN.
// See Keep the Worker fast in rules/PERF.md.
import {
  MIN_REQUESTS,
  buildOutcomesQuery,
  buildSlowestUrlsQuery,
  buildTotalsQuery,
  findCpuProblems,
  parseOutcomes,
  parseSlowestUrls,
  parseTotals,
  slowestPaths,
  type TelemetryQuery,
} from "./lib/perf.ts";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 60_000;
const URL_ROWS = 100;
const SLOWEST_SHOWN = 10;
const WORKER_NAME = /^[a-z0-9][a-z0-9-]*$/;

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is not set. Set the variable and run again.`);
    process.exit(1);
  }
  return value;
};

// The token goes only in the header, so no error message includes it.
const query = async (
  accountId: string,
  token: string,
  body: TelemetryQuery,
): Promise<unknown> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/workers/observability/telemetry/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!response.ok) {
    const message = (await response.text().catch(() => "")).slice(0, 500);
    throw new Error(`Telemetry request failed: ${response.status} ${message}`);
  }
  return response.json();
};

const format = (value: number | null) =>
  value === null ? "no data" : `${value.toFixed(2)} ms`;

const main = async () => {
  const worker = process.argv[2];
  if (!worker || !WORKER_NAME.test(worker)) {
    console.error("Usage: pnpm run worker-cpu <worker-name> (a-z, 0-9, -)");
    process.exit(1);
  }
  const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID");
  const token = requireEnv("CLOUDFLARE_OBSERVABILITY_TOKEN");
  const to = Date.now();
  const timeframe = { from: to - WINDOW_MS, to };
  const run = (body: TelemetryQuery) => query(accountId, token, body);

  const [totalsJson, outcomesJson, urlsJson] = await Promise.all([
    run(buildTotalsQuery(worker, timeframe, `totals-${to}`)),
    run(buildOutcomesQuery(worker, timeframe, `outcomes-${to}`)),
    run(buildSlowestUrlsQuery(worker, timeframe, `urls-${to}`, URL_ROWS)),
  ]);
  const totals = parseTotals(totalsJson);
  const outcomes = parseOutcomes(outcomesJson);

  console.info(`Worker ${worker}, last 24 hours`);
  console.info(`Requests that ran the Worker: ${totals.requests}`);
  console.info(`CPU median: ${format(totals.medianCpuMs)}`);
  console.info(`CPU P95: ${format(totals.p95CpuMs)}`);
  console.info(`CPU P99: ${format(totals.p99CpuMs)}`);
  console.info(`Wall time P95: ${format(totals.p95WallMs)}`);
  console.info(
    `Outcomes: ${outcomes.map((item) => `${item.outcome}=${item.count}`).join(", ") || "none"}`,
  );
  console.info("Slowest pathnames by P95 CPU (diagnostic only):");
  for (const row of slowestPaths(parseSlowestUrls(urlsJson), SLOWEST_SHOWN)) {
    console.info(`  ${row.value.toFixed(2)} ms  ${row.path}`);
  }

  if (totals.requests < MIN_REQUESTS) {
    console.info(
      `Not enough requests (${totals.requests} of ${MIN_REQUESTS}) to judge P95 CPU.`,
    );
  }
  const problems = findCpuProblems(totals, outcomes);
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exit(1);
  }
};

try {
  await main();
} catch (error) {
  console.error(
    `The Worker CPU check failed.\n${error instanceof Error ? error.message : "Unknown error"}`,
  );
  process.exit(1);
}
