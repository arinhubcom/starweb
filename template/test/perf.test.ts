import { describe, expect, it } from "vitest";
import {
  CPU_BUDGET_MS,
  MIN_REQUESTS,
  TARGET_SCORE,
  buildOutcomesQuery,
  buildSlowestUrlsQuery,
  buildTotalsQuery,
  findCpuProblems,
  median,
  parseOutcomes,
  parsePageSpeed,
  parseSlowestUrls,
  parseTotals,
  slowestPaths,
  toPathname,
} from "../scripts/lib/perf";

const WINDOW = { from: 1000, to: 2000 };

const pageSpeed = (score: unknown) => ({
  lighthouseResult: {
    categories: { performance: { score } },
    audits: {
      "largest-contentful-paint": { numericValue: 1800 },
      "total-blocking-time": { numericValue: 50 },
      "cumulative-layout-shift": { numericValue: 0.01 },
    },
  },
});

const aggregate = (alias: string, value: number) => ({
  alias,
  calculation: alias,
  aggregates: [{ value, count: 1, groups: [] }],
});

const totalsResponse = (requests: number, p95Cpu: number) => ({
  success: true,
  errors: [],
  result: {
    calculations: [
      aggregate("n", requests),
      aggregate("medianCpu", 1),
      aggregate("p95Cpu", p95Cpu),
      aggregate("p99Cpu", 12),
      aggregate("p95Wall", 40),
    ],
  },
});

const emptyCount = {
  success: true,
  errors: [],
  result: {
    calculations: [{ alias: "n", calculation: "count", aggregates: [] }],
  },
};

describe("constants", () => {
  it("holds the documented targets", () => {
    expect(TARGET_SCORE).toBe(100);
    expect(CPU_BUDGET_MS).toBe(10);
    expect(MIN_REQUESTS).toBe(20);
  });
});

describe("median", () => {
  it("takes the middle of an odd list", () => {
    expect(median([100, 90, 95])).toBe(95);
  });
  it("averages the middle two of an even list", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it("does not change its input", () => {
    const input = [3, 1, 2];
    median(input);
    expect(input).toEqual([3, 1, 2]);
  });
  it("throws on an empty list", () => {
    expect(() => median([])).toThrow(/empty/);
  });
});

describe("parsePageSpeed", () => {
  it("returns the score from 0 to 100 and the metrics", () => {
    expect(parsePageSpeed(pageSpeed(0.97))).toEqual({
      score: 97,
      lcpMs: 1800,
      tbtMs: 50,
      cls: 0.01,
    });
  });
  it("throws on a null score", () => {
    expect(() => parsePageSpeed(pageSpeed(null))).toThrow(/score/);
  });
  it("throws when an audit is missing", () => {
    const json = pageSpeed(1);
    const audits: Record<string, unknown> = json.lighthouseResult.audits;
    delete audits["total-blocking-time"];
    expect(() => parsePageSpeed(json)).toThrow(/total-blocking-time/);
  });
  it.each([null, "x", 5, [], {}, { lighthouseResult: 1 }])(
    "throws on non-matching input %j",
    (input) => {
      expect(() => parsePageSpeed(input)).toThrow(/PageSpeed/);
    },
  );
  it("throws on a score outside 0 to 1", () => {
    expect(() => parsePageSpeed(pageSpeed(2))).toThrow(/score/);
  });
});

describe("query builders", () => {
  it("filters the totals by worker and fetch events", () => {
    const body = buildTotalsQuery("site-production", WINDOW, "q1");
    expect(body.queryId).toBe("q1");
    expect(body.timeframe).toEqual(WINDOW);
    expect(body.view).toBe("calculations");
    expect(body.parameters.datasets).toEqual(["cloudflare-workers"]);
    expect(body.parameters.filters).toEqual([
      {
        key: "$workers.scriptName",
        operation: "eq",
        type: "string",
        value: "site-production",
      },
      {
        key: "$workers.eventType",
        operation: "eq",
        type: "string",
        value: "fetch",
      },
    ]);
    const operators = body.parameters.calculations.map((c) => c.operator);
    expect(operators).toEqual(["count", "median", "p95", "p99", "p95"]);
    expect(body.parameters.groupBys).toEqual([]);
  });
  it("groups outcomes", () => {
    const body = buildOutcomesQuery("w", WINDOW, "q2");
    expect(body.parameters.groupBys).toEqual([
      { type: "string", value: "$workers.outcome" },
    ]);
  });
  it("groups by URL with a limit and never by path or orderBy", () => {
    const body = buildSlowestUrlsQuery("w", WINDOW, "q3", 100);
    expect(body.parameters.groupBys).toEqual([
      { type: "string", value: "$workers.event.request.url" },
    ]);
    expect(body.parameters.limit).toBe(100);
    expect(JSON.stringify(body)).not.toContain("request.path");
    expect(JSON.stringify(body)).not.toContain("orderBy");
  });
});

describe("parseTotals", () => {
  it("reads the aliases", () => {
    expect(parseTotals(totalsResponse(50, 8))).toEqual({
      requests: 50,
      medianCpuMs: 1,
      p95CpuMs: 8,
      p99CpuMs: 12,
      p95WallMs: 40,
    });
  });
  it("returns zero requests for empty aggregates", () => {
    expect(parseTotals(emptyCount)).toEqual({
      requests: 0,
      medianCpuMs: null,
      p95CpuMs: null,
      p99CpuMs: null,
      p95WallMs: null,
    });
  });
  it("throws with the API messages when success is false", () => {
    expect(() =>
      parseTotals({ success: false, errors: [{ message: "bad token" }] }),
    ).toThrow(/bad token/);
  });
  it.each([null, "x", [], { success: true }])("throws on %j", (input) => {
    expect(() => parseTotals(input)).toThrow(/Telemetry/);
  });
});

describe("parseOutcomes", () => {
  it("reads one row per outcome", () => {
    const json = {
      success: true,
      errors: [],
      result: {
        calculations: [
          {
            alias: "n",
            calculation: "count",
            aggregates: [
              {
                value: 9,
                count: 9,
                groups: [{ key: "$workers.outcome", value: "ok" }],
              },
              {
                value: 2,
                count: 2,
                groups: [{ key: "$workers.outcome", value: "exceededCpu" }],
              },
            ],
          },
        ],
      },
    };
    expect(parseOutcomes(json)).toEqual([
      { outcome: "ok", count: 9 },
      { outcome: "exceededCpu", count: 2 },
    ]);
  });
  it("returns an empty list for empty aggregates", () => {
    expect(parseOutcomes(emptyCount)).toEqual([]);
  });
  it("throws when success is false", () => {
    expect(() =>
      parseOutcomes({ success: false, errors: [{ message: "nope" }] }),
    ).toThrow(/nope/);
  });
});

describe("parseSlowestUrls", () => {
  it("reads URL and value", () => {
    const json = {
      success: true,
      errors: [],
      result: {
        calculations: [
          {
            alias: "p95Cpu",
            calculation: "p95",
            aggregates: [
              {
                value: 7,
                count: 3,
                groups: [
                  {
                    key: "$workers.event.request.url",
                    value: "https://a.test/x",
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    expect(parseSlowestUrls(json)).toEqual([
      { url: "https://a.test/x", value: 7 },
    ]);
  });
  it("throws when success is false", () => {
    expect(() => parseSlowestUrls({ success: false, errors: [] })).toThrow(
      /no error message/,
    );
  });
});

const totals = (requests: number, p95CpuMs: number) => ({
  requests,
  medianCpuMs: 1,
  p95CpuMs,
  p99CpuMs: 1,
  p95WallMs: 1,
});

describe("findCpuProblems", () => {
  it("accepts exactly 10 ms", () => {
    expect(findCpuProblems(totals(100, 10), [])).toEqual([]);
  });
  it("reports P95 above the budget", () => {
    expect(findCpuProblems(totals(100, 10.1), [])).toHaveLength(1);
  });
  it("checks P95 at exactly MIN_REQUESTS", () => {
    expect(findCpuProblems(totals(MIN_REQUESTS, 50), [])).toHaveLength(1);
  });
  it("skips P95 below MIN_REQUESTS", () => {
    expect(findCpuProblems(totals(MIN_REQUESTS - 1, 50), [])).toEqual([]);
  });
  it("skips P95 when there is no value", () => {
    expect(findCpuProblems({ ...totals(100, 0), p95CpuMs: null }, [])).toEqual(
      [],
    );
  });
  it("reports exceededCpu even with few requests", () => {
    const problems = findCpuProblems(totals(1, 1), [
      { outcome: "exceededCpu", count: 2 },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("exceededCpu");
  });
  it("ignores other outcomes", () => {
    expect(
      findCpuProblems(totals(100, 1), [
        { outcome: "ok", count: 99 },
        { outcome: "canceled", count: 1 },
      ]),
    ).toEqual([]);
  });
});

describe("toPathname", () => {
  it("removes host and query string", () => {
    expect(toPathname("https://a.test/posts/x?token=SECRET#frag")).toBe(
      "/posts/x",
    );
  });
  it("does not leak the input when the URL is invalid", () => {
    expect(toPathname("not a url?token=SECRET")).not.toContain("SECRET");
  });
  it("keeps the root path and drops a secret query", () => {
    expect(toPathname("https://a.test/?k=SECRET")).toBe("/");
  });
});

describe("slowestPaths", () => {
  it("merges equal pathnames by the highest value and sorts descending", () => {
    const rows = [
      { url: "https://a.test/a?x=1", value: 3 },
      { url: "https://a.test/a?x=2", value: 9 },
      { url: "https://a.test/b", value: 5 },
    ];
    expect(slowestPaths(rows, 10)).toEqual([
      { path: "/a", value: 9 },
      { path: "/b", value: 5 },
    ]);
  });
  it("applies the limit", () => {
    const rows = [
      { url: "https://a.test/a", value: 1 },
      { url: "https://a.test/b", value: 2 },
    ];
    expect(slowestPaths(rows, 1)).toEqual([{ path: "/b", value: 2 }]);
  });
  it("returns an empty list for no rows", () => {
    expect(slowestPaths([], 10)).toEqual([]);
  });
});
