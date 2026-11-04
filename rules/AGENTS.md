# AGENTS

Rules for editing `rules/`. Also follow [AGENTS.md](../AGENTS.md) at the project root.

`rules/` is written for an agent that knows the stack. Name the lib, tool, API, pattern, or spec. Do not explain what its docs explain. Put reasons and alternatives in [WHY.md](../WHY.md).

## Format

- One registry: [STACK.md](STACK.md). Each name gets one `###` entry: a one-line scope, the topic files, then the sources (`llms`, `context7`, `docs`, `github`, `mcp`, `skills`, `tools`), as bare URLs.
- Topic files link each name to its registry entry once, at first use: `[Kysely](STACK.md#kysely)`. Do not repeat source URLs in topic files.
- Use a deep link in a topic file only when the registry sources cannot find the page by name (a specific GitHub file, a legal text, a GitHub issue).
- `##` per area, `###` per name. One rule per bullet, a fragment is fine: `No \`forwardRef\`; \`ref\` is a prop.`
- Keep every project decision: chosen tool, forbidden tool, exact path, file name, command, binding, version pin, limit, number, order. Drop the reason unless the agent would otherwise "fix" the rule back.
- Write the forbidden option and its replacement in one bullet: `No Drizzle/Prisma → Kysely.`
- Cross-reference with `→ [FILE](FILE.md)`.

## Verification

- Verify each rule in the official docs or on GitHub before you add it.
- When the docs do not fully answer it, or it depends on tool output, a config, or an error: install the package in a temporary folder outside the project, run a short script, check the result. No test packages in the project.
- A rule you cannot verify is not added. Say what you could not verify.

## Sources

- Context7: `https://context7.com/<library-id>/llms.txt?tokens=10000`. Find the ID with `https://context7.com/api/v1/search?query=<name>`. Prefer a `verified` ID with the higher `benchmarkScore`.
- `llms.txt`: try `<docs-origin>/llms.txt` and `/llms-full.txt`. Add only a URL that returns 200 with `text/plain` or `text/markdown`.
- Skills: find with `https://skills.sh/api/search?q=<name>`. Prefer the vendor's own skill, then the most installed one. Link `https://skills.sh/<owner>/<repo>/<skill>`.
- Check every URL before you add it. A URL that fails is not added.
- Context7 rate-limits `llms.txt` checks (429); verify a Context7 ID through the search API instead.

## Template

- `template/` holds the `create-emdash` output (`cloudflare:starter`) with the Starweb changes in place, `package.json`, and the configs, formatted with Prettier. A new project takes over the folder: `scripts/setup.mjs` copies it to the project root. No `files/` subfolder, no `create-emdash` run in a project.
- Not in `template/`: `.env` (`setup.mjs` writes a new key per project), lockfile, `pnpm-workspace.yaml`, `worker-configuration.d.ts`.
- `starter/` holds the last `create-emdash` output, shaped like `template/` (renamed, formatted, without the files above): the merge base. No hand edits.
- EmDash update: `node scripts/update-starter.mjs <version>` runs `create-emdash` again, merges the difference to `starter/` into `template/`, replaces `starter/`, and pins `create-emdash`, `emdash`, `@emdash-cms/cloudflare`. Resolve the conflicts, review the listed `package.json` changes, then test. No version bump of these packages by hand or by Dependabot.
- No install commands in `rules/` (`npm i`, `npm rm`, `npx astro add`). A package every project needs goes in `template/package.json`, its config in `template/`. A rule for an optional feature names the packages only.
- A rule and the file in `template/` or `scripts/setup.mjs` that implements it change in the same commit.
- No edit to `template/` without the rule that describes it; change the rule first.
- Keep the template current with `rules/`: each rule that applies to every project and that a file, config value, package, script, or CI step can implement has that implementation in `template/` or `scripts/setup.mjs`, or a step in [SETUP](SETUP.md) that a real project can run. Conditional rules ("uses X →") need a [SETUP](SETUP.md) step. A step never names a file that neither the template nor the step creates.
- A new template file or behavior gets a check in `scripts/test-template.sh`.
- Exact versions in `template/package.json`, no `^` or `~`.
- Before a commit that touches `template/`, `scripts/`, or a rule they implement: `bash scripts/test-template.sh <tmp-dir>` (new folder outside the repository).
- Before each template test, check every package in `template/package.json` for a newer version (`npm view <package> time`); pin the newest that is older than 3 days and within peer ranges and the [DEPS](DEPS.md) ignore list, then test with it.
- New `astro` minor or major: read its post in the [Astro blog feed](https://astro.build/rss.xml) (`Astro X.Y` for each minor it passes, plus the monthly "What's new in Astro" posts since the old pin). Update the rules, `WHY.md`, and `template/` for each new feature, deprecation, or fixed workaround in the same commit as the version bump.
- Also `bash scripts/test-update.sh <tmp-dir>` (another new folder) when the change touches `scripts/update.mjs`, `scripts/update-starter.mjs`, `scripts/setup.mjs`, `scripts/lib.mjs`, `.starweb.json`, or the files `update.mjs` merges. It edits lines 7, 10, and 13 of `rules/DEV.md`; keep that file at 13 or more lines.
