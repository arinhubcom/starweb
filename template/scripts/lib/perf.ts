// Pure helpers for the production performance checks: PageSpeed Insights
// results and Workers Observability queries. No I/O. See Performance in
// rules/PERF.md.

export const TARGET_SCORE = 100;
export const CPU_BUDGET_MS = 10;
// Below this many requests, P95 is noise: report it, do not fail.
export const MIN_REQUESTS = 20;

const UNKNOWN_PATH = "(invalid URL)";
const OUTCOME_KEY = "$workers.outcome";
const URL_KEY = "$workers.event.request.url";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const median = (values: readonly number[]): number => {
  if (values.length === 0) {
    throw new Error("Cannot take the median of an empty list");
  }
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const low = sorted[middle - 1] ?? 0;
  const high = sorted[middle] ?? 0;
  return sorted.length % 2 === 0 ? (low + high) / 2 : high;
};

// PageSpeed Insights

export interface PageSpeedResult {
  score: number;
  lcpMs: number;
  tbtMs: number;
  cls: number;
}

const auditValue = (audits: Record<string, unknown>, id: string): number => {
  const audit = audits[id];
  if (!isRecord(audit) || !isNumber(audit.numericValue)) {
    throw new Error(`PageSpeed response has no numeric value for ${id}`);
  }
  return audit.numericValue;
};

export const parsePageSpeed = (json: unknown): PageSpeedResult => {
  const result = isRecord(json) ? json.lighthouseResult : undefined;
  if (!isRecord(result)) {
    throw new Error("PageSpeed response has no lighthouseResult");
  }
  const categories = result.categories;
  const performance = isRecord(categories) ? categories.performance : undefined;
  const score = isRecord(performance) ? performance.score : undefined;
  if (!isNumber(score) || score < 0 || score > 1) {
    throw new Error(
      "PageSpeed response has no performance score (the run failed)",
    );
  }
  const audits = result.audits;
  if (!isRecord(audits)) throw new Error("PageSpeed response has no audits");
  return {
    score: Math.round(score * 100),
    lcpMs: auditValue(audits, "largest-contentful-paint"),
    tbtMs: auditValue(audits, "total-blocking-time"),
    cls: auditValue(audits, "cumulative-layout-shift"),
  };
};

// Workers Observability queries

export interface TimeWindow {
  from: number;
  to: number;
}

interface Calculation {
  operator: "count" | "median" | "p95" | "p99";
  key?: string;
  keyType?: "number";
  alias: string;
}

export interface TelemetryQuery {
  queryId: string;
  timeframe: TimeWindow;
  view: "calculations";
  parameters: {
    datasets: string[];
    filters: {
      key: string;
      operation: "eq";
      type: "string";
      value: string;
    }[];
    calculations: Calculation[];
    groupBys: { type: "string"; value: string }[];
    limit?: number;
  };
}

const metric = (
  operator: "median" | "p95" | "p99",
  key: "$workers.cpuTimeMs" | "$workers.wallTimeMs",
  alias: string,
): Calculation => ({ operator, key, keyType: "number", alias });

const COUNT: Calculation = { operator: "count", alias: "n" };

const baseQuery = (
  worker: string,
  timeframe: TimeWindow,
  queryId: string,
  calculations: Calculation[],
  groupBy: string | undefined,
  limit?: number,
): TelemetryQuery => ({
  queryId,
  timeframe,
  view: "calculations",
  parameters: {
    datasets: ["cloudflare-workers"],
    filters: [
      {
        key: "$workers.scriptName",
        operation: "eq",
        type: "string",
        value: worker,
      },
      {
        key: "$workers.eventType",
        operation: "eq",
        type: "string",
        value: "fetch",
      },
    ],
    calculations,
    groupBys: groupBy ? [{ type: "string", value: groupBy }] : [],
    ...(limit === undefined ? {} : { limit }),
  },
});

export const buildTotalsQuery = (
  worker: string,
  timeframe: TimeWindow,
  queryId: string,
): TelemetryQuery =>
  baseQuery(
    worker,
    timeframe,
    queryId,
    [
      COUNT,
      metric("median", "$workers.cpuTimeMs", "medianCpu"),
      metric("p95", "$workers.cpuTimeMs", "p95Cpu"),
      metric("p99", "$workers.cpuTimeMs", "p99Cpu"),
      metric("p95", "$workers.wallTimeMs", "p95Wall"),
    ],
    undefined,
  );

export const buildOutcomesQuery = (
  worker: string,
  timeframe: TimeWindow,
  queryId: string,
): TelemetryQuery =>
  baseQuery(worker, timeframe, queryId, [COUNT], OUTCOME_KEY);

// Group by URL, not by `$workers.event.request.path`: the path returned no rows.
export const buildSlowestUrlsQuery = (
  worker: string,
  timeframe: TimeWindow,
  queryId: string,
  limit: number,
): TelemetryQuery =>
  baseQuery(
    worker,
    timeframe,
    queryId,
    [metric("p95", "$workers.cpuTimeMs", "p95Cpu")],
    URL_KEY,
    limit,
  );

interface Aggregate {
  value: number;
  groups: { key: string; value: string }[];
}

const errorMessages = (json: Record<string, unknown>): string => {
  const errors = Array.isArray(json.errors) ? json.errors : [];
  const messages = errors.flatMap((error) =>
    isRecord(error) && typeof error.message === "string" ? [error.message] : [],
  );
  return messages.length > 0 ? messages.join("; ") : "no error message";
};

const parseGroups = (value: unknown): Aggregate["groups"] =>
  Array.isArray(value)
    ? value.flatMap((group) =>
        isRecord(group) &&
        typeof group.key === "string" &&
        typeof group.value === "string"
          ? [{ key: group.key, value: group.value }]
          : [],
      )
    : [];

const parseAggregates = (value: unknown): Aggregate[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        isRecord(item) && isNumber(item.value)
          ? [{ value: item.value, groups: parseGroups(item.groups) }]
          : [],
      )
    : [];

// The aggregates of each calculation, by alias.
const parseCalculations = (json: unknown): Map<string, Aggregate[]> => {
  if (!isRecord(json)) throw new Error("Telemetry response is not an object");
  if (json.success !== true) {
    throw new Error(`Telemetry query failed: ${errorMessages(json)}`);
  }
  const result = json.result;
  const calculations = isRecord(result) ? result.calculations : undefined;
  if (!Array.isArray(calculations)) {
    throw new Error("Telemetry response has no calculations");
  }
  return new Map(
    calculations.flatMap((calculation) =>
      isRecord(calculation) && typeof calculation.alias === "string"
        ? [
            [
              calculation.alias,
              parseAggregates(calculation.aggregates),
            ] as const,
          ]
        : [],
    ),
  );
};

export interface Totals {
  requests: number;
  medianCpuMs: number | null;
  p95CpuMs: number | null;
  p99CpuMs: number | null;
  p95WallMs: number | null;
}

export const parseTotals = (json: unknown): Totals => {
  const calculations = parseCalculations(json);
  const first = (alias: string) => calculations.get(alias)?.[0]?.value ?? null;
  return {
    requests: first("n") ?? 0,
    medianCpuMs: first("medianCpu"),
    p95CpuMs: first("p95Cpu"),
    p99CpuMs: first("p99Cpu"),
    p95WallMs: first("p95Wall"),
  };
};

export interface OutcomeCount {
  outcome: string;
  count: number;
}

const groupValue = (aggregate: Aggregate, key: string): string | undefined =>
  aggregate.groups.find((group) => group.key === key)?.value;

export const parseOutcomes = (json: unknown): OutcomeCount[] =>
  (parseCalculations(json).get("n") ?? []).flatMap((aggregate) => {
    const outcome = groupValue(aggregate, OUTCOME_KEY);
    return outcome === undefined ? [] : [{ outcome, count: aggregate.value }];
  });

export interface UrlValue {
  url: string;
  value: number;
}

export const parseSlowestUrls = (json: unknown): UrlValue[] =>
  (parseCalculations(json).get("p95Cpu") ?? []).flatMap((aggregate) => {
    const url = groupValue(aggregate, URL_KEY);
    return url === undefined ? [] : [{ url, value: aggregate.value }];
  });

export const findCpuProblems = (
  totals: Totals,
  outcomes: readonly OutcomeCount[],
): string[] => {
  const overBudget =
    totals.requests >= MIN_REQUESTS &&
    totals.p95CpuMs !== null &&
    totals.p95CpuMs > CPU_BUDGET_MS
      ? [
          `P95 CPU time is ${totals.p95CpuMs} ms, above the ${CPU_BUDGET_MS} ms budget`,
        ]
      : [];
  const exceeded = outcomes
    .filter((item) => item.outcome === "exceededCpu" && item.count > 0)
    .map((item) => `${item.count} requests ended with exceededCpu`);
  return [...overBudget, ...exceeded];
};

// Actions logs can be public: print the path only, never host or query string.
export const toPathname = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return UNKNOWN_PATH;
  }
};

export interface PathValue {
  path: string;
  value: number;
}

export const slowestPaths = (
  rows: readonly UrlValue[],
  limit: number,
): PathValue[] => {
  const merged = rows.reduce((acc, row) => {
    const path = toPathname(row.url);
    return new Map(acc).set(
      path,
      Math.max(acc.get(path) ?? row.value, row.value),
    );
  }, new Map<string, number>());
  return Array.from(merged, ([path, value]) => ({ path, value }))
    .toSorted((a, b) => b.value - a.value)
    .slice(0, limit);
};
