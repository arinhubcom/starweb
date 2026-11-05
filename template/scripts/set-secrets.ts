// Send secrets from stdin to GitHub and to the Worker. Run with:
//   <source> | pnpm run set-secrets <dev|production> [--dry-run]
// The password manager stays your choice. See rules/TOKENS.md.
import { spawn } from "node:child_process";
import {
  describeEntries,
  failureHint,
  parseSecrets,
  planCommands,
  redact,
  type Command,
  type SecretEntry,
  type Target,
} from "./lib/secrets.ts";

const USAGE =
  "Usage: <source> | pnpm run set-secrets <dev|production> [--dry-run]";

interface Result {
  readonly code: number | null;
  readonly output: string;
}

const parseTarget = (value: string | undefined): Target | undefined =>
  value === "dev" || value === "production" ? value : undefined;

const readStdin = async (): Promise<string> => {
  process.stdin.setEncoding("utf8");
  let text = "";
  for await (const chunk of process.stdin) text += String(chunk);
  return text;
};

const run = (step: Command): Promise<Result> =>
  new Promise((resolve, reject) => {
    const child = spawn(step.command, [...step.args], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const parts: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => {
      parts.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      parts.push(chunk);
    });
    child.on("error", (error) => {
      reject(
        new Error(
          `Could not start ${step.command}. Install it and log in first. (${error.message})`,
        ),
      );
    });
    child.on("close", (code) => {
      resolve({ code, output: Buffer.concat(parts).toString("utf8") });
    });
    // A command that exits early closes the pipe; the exit code reports it.
    child.stdin.on("error", () => undefined);
    child.stdin.end(step.input);
  });

const printProductionNote = (plan: readonly Command[]) => {
  if (!plan.some((step) => step.command === "pnpm")) return;
  console.info(
    "The Worker command only created a version. Release it with `wrangler versions deploy --env production` (rules/DEPLOY.md, Secrets).",
  );
};

const send = async (
  plan: readonly Command[],
  target: Target,
  values: readonly string[],
): Promise<number> => {
  const done: string[] = [];
  for (const [index, step] of plan.entries()) {
    console.info(`Sending: ${step.label}`);
    const { code, output } = await run(step);
    if (code !== 0) {
      console.error(redact(output, values).trim());
      console.error(`Failed: ${step.label}`);
      if (done.length > 0) console.error(`Done:\n  ${done.join("\n  ")}`);
      const notRun = plan.slice(index + 1).map((next) => next.label);
      if (notRun.length > 0) console.error(`Not run:\n  ${notRun.join("\n  ")}`);
      const hint = failureHint(output);
      if (hint) console.error(hint);
      console.error("Run the command again: the commands overwrite.");
      return 1;
    }
    done.push(step.label);
  }
  if (target === "production") printProductionNote(plan);
  return 0;
};

const main = async (): Promise<number> => {
  const args = process.argv.slice(2);
  const target = parseTarget(args[0]);
  const flags = args.slice(1);
  const isDryRun = flags.includes("--dry-run");
  if (!target || flags.some((flag) => flag !== "--dry-run")) {
    console.error(USAGE);
    return 1;
  }
  if (process.stdin.isTTY) {
    console.error(`Stdin is a terminal. Pipe the secrets in.\n${USAGE}`);
    return 1;
  }
  const entries: readonly SecretEntry[] = parseSecrets(await readStdin());
  if (isDryRun) {
    console.info(describeEntries(entries, target).join("\n"));
    console.info("Dry run: nothing was sent.");
    return 0;
  }
  return send(
    planCommands(entries, target),
    target,
    entries.map(({ value }) => value),
  );
};

try {
  process.exitCode = await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unknown error.");
  process.exitCode = 1;
}
