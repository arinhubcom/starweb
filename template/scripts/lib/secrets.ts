// Parse secrets from stdin and plan the commands that send them. Pure: no I/O.
// See rules/TOKENS.md.

type Destination = "worker" | "environment" | "production";
export type Target = "dev" | "production";

// A project adds its own names here and to the table in rules/TOKENS.md. All
// tokens that CI reads live in GitHub environments, not in repository secrets.
export const SECRETS: Readonly<Record<string, Destination>> = {
  BETTER_AUTH_SECRET: "worker",
  EMDASH_ENCRYPTION_KEY: "worker",
  STRIPE_SECRET_KEY: "worker",
  STRIPE_WEBHOOK_SECRET: "worker",
  SENTRY_DSN: "worker",
  CLOUDFLARE_API_TOKEN: "environment",
  SENTRY_AUTH_TOKEN: "environment",
  PAGESPEED_API_KEY: "production",
  CLOUDFLARE_OBSERVABILITY_TOKEN: "production",
};

export interface SecretEntry {
  readonly name: string;
  readonly value: string;
}

export interface Command {
  readonly command: string;
  readonly args: readonly string[];
  readonly input: string;
  readonly label: string;
}

const NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;
const LINE_BREAK = /\r?\n/;
const REDACTED = "[redacted]";

const stripQuotes = (value: string): string => {
  const first = value[0];
  const isQuoted =
    value.length >= 2 &&
    (first === '"' || first === "'") &&
    value.endsWith(first);
  return isQuoted ? value.slice(1, -1) : value;
};

// Errors name only the line number or the secret name, never a value or a raw
// line: a malformed line can hold a secret.
const parseLine = (line: string, number: number): SecretEntry => {
  const index = line.indexOf("=");
  if (index === -1) {
    throw new Error(`Line ${number} has no "=" between name and value.`);
  }
  const name = line.slice(0, index);
  if (!NAME_PATTERN.test(name)) {
    throw new Error(`Line ${number} has an invalid secret name.`);
  }
  if (!Object.hasOwn(SECRETS, name)) {
    throw new Error(
      `Line ${number}: unknown secret ${name}. Add it to SECRETS in scripts/lib/secrets.ts.`,
    );
  }
  const value = stripQuotes(line.slice(index + 1));
  if (value === "") {
    throw new Error(`Line ${number}: the value of ${name} is empty.`);
  }
  return { name, value };
};

const assertUnique = (entries: readonly SecretEntry[]): void => {
  const seen = new Set<string>();
  for (const { name } of entries) {
    if (seen.has(name)) throw new Error(`Secret ${name} appears twice.`);
    seen.add(name);
  }
};

export const parseSecrets = (text: string): readonly SecretEntry[] => {
  const entries = text
    .split(LINE_BREAK)
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(
      ({ line }) => line.trim() !== "" && !line.trimStart().startsWith("#"),
    )
    .map(({ line, number }) => parseLine(line, number));
  if (entries.length === 0) throw new Error("The input has no secrets.");
  assertUnique(entries);
  return entries;
};

const destinationOf = (name: string): Destination => SECRETS[name] ?? "worker";

const environmentOf = (name: string, target: Target): Target =>
  destinationOf(name) === "production" ? "production" : target;

const describeDestination = (name: string, target: Target): string => {
  if (destinationOf(name) === "worker") return `Worker secret (${target})`;
  return `GitHub secret of the environment ${environmentOf(name, target)}`;
};

// A production-only token in the dev environment is one that nothing reads.
// `PAGESPEED_API_KEY` and `CLOUDFLARE_OBSERVABILITY_TOKEN` go with
// `set-secrets production` only. `set-secrets dev` refuses them.
export const assertTargetFits = (
  entries: readonly SecretEntry[],
  target: Target,
): void => {
  const misplaced = entries.find(
    ({ name }) => destinationOf(name) === "production" && target !== "production",
  );
  if (misplaced) {
    throw new Error(
      `Secret ${misplaced.name} belongs to the environment production. Run set-secrets production.`,
    );
  }
};

export const describeEntries = (
  entries: readonly SecretEntry[],
  target: Target,
): readonly string[] =>
  entries.map(({ name }) => `${name} -> ${describeDestination(name, target)}`);

const workerCommand = (
  entries: readonly SecretEntry[],
  target: Target,
): Command => ({
  command: "pnpm",
  args: [
    "exec",
    "wrangler",
    "versions",
    "secret",
    "bulk",
    target === "production" ? "--env=production" : "--env=",
  ],
  input: JSON.stringify(
    Object.fromEntries(entries.map(({ name, value }) => [name, value])),
  ),
  label: `Worker secrets (${target}): ${entries.map(({ name }) => name).join(", ")}`,
});

const githubCommand = (entry: SecretEntry, target: Target): Command => ({
  command: "gh",
  args: ["secret", "set", entry.name, "--env", environmentOf(entry.name, target)],
  input: entry.value,
  label: `${entry.name}: ${describeDestination(entry.name, target)}`,
});

export const planCommands = (
  entries: readonly SecretEntry[],
  target: Target,
): readonly Command[] => {
  const worker = entries.filter(({ name }) => destinationOf(name) === "worker");
  const github = entries.filter(({ name }) => destinationOf(name) !== "worker");
  return [
    ...(worker.length > 0 ? [workerCommand(worker, target)] : []),
    ...github.map((entry) => githubCommand(entry, target)),
  ];
};

export const redact = (text: string, values: readonly string[]): string =>
  values
    .filter((value) => value !== "")
    .toSorted((a, b) => b.length - a.length)
    .reduce((result, value) => result.split(value).join(REDACTED), text);

// Error 10222: Cloudflare needs an uploaded version before it accepts Worker
// secrets. Without one, the command fails.
export const failureHint = (output: string): string | undefined =>
  output.includes("10222") || output.includes("no uploaded versions")
    ? "The Worker has no uploaded version. Upload a version first (wrangler versions upload), then run this command again."
    : undefined;
