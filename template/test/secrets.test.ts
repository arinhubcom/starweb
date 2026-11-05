import { describe, expect, it } from "vitest";
import {
  SECRETS,
  assertTargetFits,
  describeEntries,
  failureHint,
  parseSecrets,
  planCommands,
  redact,
} from "../scripts/lib/secrets";

const HOSTILE = [
  "a=b=c",
  "$(touch x)",
  "`id`",
  'say "hi"',
  "x # not a comment",
  "two  spaces",
  "pässwörd-日本語-🔑",
];

const messageOf = (run: () => unknown): string => {
  try {
    run();
  } catch (error) {
    return String(error);
  }
  throw new Error("Expected the call to throw.");
};

describe("SECRETS", () => {
  it("sends each name to the worker or to GitHub", () => {
    expect(SECRETS.BETTER_AUTH_SECRET).toBe("worker");
    expect(SECRETS.EMDASH_ENCRYPTION_KEY).toBe("worker");
    expect(SECRETS.STRIPE_SECRET_KEY).toBe("worker");
    expect(SECRETS.STRIPE_WEBHOOK_SECRET).toBe("worker");
    expect(SECRETS.SENTRY_DSN).toBe("worker");
    expect(SECRETS.CLOUDFLARE_API_TOKEN).toBe("environment");
    expect(SECRETS.SENTRY_AUTH_TOKEN).toBe("environment");
    expect(SECRETS.PAGESPEED_API_KEY).toBe("production");
    expect(SECRETS.CLOUDFLARE_OBSERVABILITY_TOKEN).toBe("production");
  });
});

describe("parseSecrets", () => {
  it("keeps every value byte for byte", () => {
    for (const value of HOSTILE) {
      expect(parseSecrets(`BETTER_AUTH_SECRET=${value}`)).toEqual([
        { name: "BETTER_AUTH_SECRET", value },
      ]);
    }
  });

  it("takes everything after the first equals sign", () => {
    expect(parseSecrets("SENTRY_DSN=a=b==")).toEqual([
      { name: "SENTRY_DSN", value: "a=b==" },
    ]);
  });

  it("skips blank lines and full-line comments", () => {
    expect(parseSecrets("\n# note\n  # indented\nSENTRY_DSN=x\n\n")).toEqual([
      { name: "SENTRY_DSN", value: "x" },
    ]);
  });

  it("removes one pair of matching quotes", () => {
    expect(parseSecrets(`SENTRY_DSN="a b"`)[0]?.value).toBe("a b");
    expect(parseSecrets(`SENTRY_DSN='a b'`)[0]?.value).toBe("a b");
    expect(parseSecrets(`SENTRY_DSN=""a""`)[0]?.value).toBe('"a"');
    expect(parseSecrets(`SENTRY_DSN="a'`)[0]?.value).toBe(`"a'`);
  });

  it("accepts CRLF line endings without keeping the carriage return", () => {
    expect(parseSecrets("SENTRY_DSN=one\r\nSTRIPE_SECRET_KEY=two\r\n")).toEqual(
      [
        { name: "SENTRY_DSN", value: "one" },
        { name: "STRIPE_SECRET_KEY", value: "two" },
      ],
    );
  });

  it("does not put a secret in a no-equals error", () => {
    const secret = "TOPSECRET-value";
    const message = messageOf(() => parseSecrets(`SENTRY_DSN=x\n${secret}`));
    expect(message).toMatch(/line 2/i);
    expect(message).not.toContain(secret);
  });

  it("does not put a value in an invalid-name error", () => {
    const secret = "TOPSECRET";
    for (const text of [
      `sentry_dsn=${secret}`,
      `1A=${secret}`,
      ` A=${secret}`,
    ]) {
      const message = messageOf(() => parseSecrets(text));
      expect(message).toMatch(/line 1/i);
      expect(message).not.toContain(secret);
    }
  });

  it("rejects an empty value, also an empty quoted one", () => {
    expect(() => parseSecrets("SENTRY_DSN=")).toThrow(/empty/i);
    expect(() => parseSecrets('SENTRY_DSN=""')).toThrow(/empty/i);
  });

  it("rejects a duplicate name without the values", () => {
    const message = messageOf(() =>
      parseSecrets("SENTRY_DSN=first-v\nSENTRY_DSN=second-v"),
    );
    expect(message).toContain("SENTRY_DSN");
    expect(message).not.toContain("first-v");
    expect(message).not.toContain("second-v");
  });

  it("rejects an unknown name without the value", () => {
    const message = messageOf(() => parseSecrets("NOT_A_SECRET=hunter2"));
    expect(message).toContain("NOT_A_SECRET");
    expect(message).not.toContain("hunter2");
  });

  it("rejects input with no entries", () => {
    expect(() => parseSecrets("")).toThrow(/no secrets/i);
    expect(() => parseSecrets("# only a comment\n\n")).toThrow(/no secrets/i);
  });
});

describe("planCommands", () => {
  const entries = [
    { name: "BETTER_AUTH_SECRET", value: "a$(touch x)" },
    { name: "STRIPE_SECRET_KEY", value: 'b="c"' },
    { name: "CLOUDFLARE_API_TOKEN", value: "tok`id`" },
  ];

  it("sends worker secrets in one command with --env= for dev", () => {
    const plan = planCommands(entries, "dev");
    expect(plan).toHaveLength(2);
    const [worker, github] = plan;
    expect(worker?.command).toBe("pnpm");
    expect(worker?.args).toEqual([
      "exec",
      "wrangler",
      "versions",
      "secret",
      "bulk",
      "--env=",
    ]);
    expect(github?.command).toBe("gh");
    expect(github?.args).toEqual([
      "secret",
      "set",
      "CLOUDFLARE_API_TOKEN",
      "--env",
      "dev",
    ]);
    expect(github?.input).toBe("tok`id`");
  });

  it("targets production with --env=production and the production environment", () => {
    const [worker, github] = planCommands(entries, "production");
    expect(worker?.args.at(-1)).toBe("--env=production");
    expect(github?.args).toEqual([
      "secret",
      "set",
      "CLOUDFLARE_API_TOKEN",
      "--env",
      "production",
    ]);
  });

  it("sends a production check token to the production environment", () => {
    const [github] = planCommands(
      [{ name: "PAGESPEED_API_KEY", value: "key" }],
      "production",
    );
    expect(github?.args).toEqual([
      "secret",
      "set",
      "PAGESPEED_API_KEY",
      "--env",
      "production",
    ]);
  });

  it("refuses a production check token for dev, and does not print its value", () => {
    const tokens = [{ name: "PAGESPEED_API_KEY", value: "hunter2" }];
    const check = (target: "dev" | "production") => () => {
      assertTargetFits(tokens, target);
    };
    expect(check("dev")).toThrow(/PAGESPEED_API_KEY/);
    expect(check("dev")).not.toThrow(/hunter2/);
    expect(check("production")).not.toThrow();
  });

  it("accepts a deploy token for dev", () => {
    expect(() => {
      assertTargetFits([{ name: "CLOUDFLARE_API_TOKEN", value: "t" }], "dev");
    }).not.toThrow();
  });

  it("keeps hostile values byte for byte in the JSON input", () => {
    const hostile = HOSTILE.map((value) => ({
      name: "SENTRY_DSN",
      value,
    }));
    for (const entry of hostile) {
      const [worker] = planCommands([entry], "dev");
      expect(JSON.parse(worker?.input ?? "")).toEqual({
        SENTRY_DSN: entry.value,
      });
    }
  });

  it("never puts a value in args or labels", () => {
    for (const target of ["dev", "production"] as const) {
      const text = JSON.stringify(
        planCommands(entries, target).map(({ args, label }) => [args, label]),
      );
      for (const { value } of entries) {
        expect(text).not.toContain(JSON.stringify(value).slice(1, -1));
      }
    }
  });

  it("leaves out the wrangler command with no worker secrets", () => {
    const plan = planCommands(entries.slice(2), "dev");
    expect(plan).toHaveLength(1);
    expect(plan[0]?.command).toBe("gh");
  });

  it("gives one gh command per github secret", () => {
    const plan = planCommands(
      [
        { name: "CLOUDFLARE_API_TOKEN", value: "x" },
        { name: "SENTRY_AUTH_TOKEN", value: "y" },
      ],
      "production",
    );
    expect(plan.map((step) => step.args[2])).toEqual([
      "CLOUDFLARE_API_TOKEN",
      "SENTRY_AUTH_TOKEN",
    ]);
  });
});

describe("describeEntries", () => {
  it("lists each name and destination without values", () => {
    const lines = describeEntries(
      [
        { name: "SENTRY_DSN", value: "MARKER" },
        { name: "SENTRY_AUTH_TOKEN", value: "MARKER" },
      ],
      "production",
    );
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("SENTRY_DSN");
    expect(lines[0]).toMatch(/worker/i);
    expect(lines[1]).toContain("SENTRY_AUTH_TOKEN");
    expect(lines[1]).toMatch(/github/i);
    expect(lines.join("")).not.toContain("MARKER");
  });
});

describe("redact", () => {
  it("replaces each value", () => {
    expect(redact("a secret-1 and secret-2", ["secret-1", "secret-2"])).toBe(
      "a [redacted] and [redacted]",
    );
  });

  it("replaces the longest value first when values overlap", () => {
    expect(redact("token-abc-long", ["token-abc", "token-abc-long"])).toBe(
      "[redacted]",
    );
  });

  it("ignores empty values", () => {
    expect(redact("text", [""])).toBe("text");
  });
});

describe("failureHint", () => {
  it("suggests uploading a version for error 10222", () => {
    expect(failureHint("error code: 10222")).toMatch(/upload/i);
    expect(failureHint("There are currently no uploaded versions")).toMatch(
      /upload/i,
    );
  });

  it("returns nothing for other output", () => {
    expect(failureHint("network down")).toBeUndefined();
  });
});
