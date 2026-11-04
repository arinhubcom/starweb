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

## WHY.md

- A commit that adds, changes, or removes a decision in `rules/` (chosen or forbidden tool, limit, number, version pin) updates its reason in [WHY.md](../WHY.md) in the same commit. Remove a reason when its decision goes.
- A decision a reader would question needs a reason in `WHY.md`. If you cannot verify the reason, ask the user. Do not invent one.
- A test note in `WHY.md` has the form `Tested on YYYY-MM-DD with <name> <version>`. When a template pin changes, run the test again and update the note, or keep the old date and version.
- Before a commit that touches `rules/`, `WHY.md`, or `template/package.json`: `node scripts/check-why.mjs`. CI runs it too. It fails on a broken link or anchor, an undated test note, or another major version than the template pin. It warns on another minor version.
- The script cannot find a false or missing reason. After a large change to `rules/`, compare `WHY.md` with `rules/` section by section.

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

- A rule and the file in `template/files/` or `scripts/setup.mjs` that implements it change in the same commit.
- No edit to `template/files/` without the rule that describes it; change the rule first.
- Keep the template current with `rules/`: each rule that applies to every project and that a file, config value, package, script, or CI step can implement has that implementation in `template/` or `scripts/setup.mjs`, or a step in [SETUP](SETUP.md) that a real project can run. Conditional rules ("uses X →") need a [SETUP](SETUP.md) step. A step never names a file that neither the template nor the step creates.
- A new template file or behavior gets a check in `scripts/test-template.sh`.
- Exact versions in `template/package.json`, no `^` or `~`.
- Before a commit that touches `template/`, `scripts/`, or a rule they implement: `bash scripts/test-template.sh <tmp-dir>` (new folder outside the repository).
- Before each template test, check every package in `template/package.json` for a newer version (`npm view <package> time`); pin the newest that is older than 3 days and within peer ranges and the [DEPS](DEPS.md) ignore list, then test with it.
- New `astro` minor or major: read its post in the [Astro blog feed](https://astro.build/rss.xml) (`Astro X.Y` for each minor it passes, plus the monthly "What's new in Astro" posts since the old pin). Update the rules, `WHY.md`, and `template/files/` for each new feature, deprecation, or fixed workaround in the same commit as the version bump.
- Also `bash scripts/test-update.sh <tmp-dir>` (another new folder) when the change touches `scripts/update.mjs`, `scripts/setup.mjs`, `scripts/lib.mjs`, `.starweb.json`, or the files `update.mjs` merges. It edits lines 7, 10, and 13 of `rules/DEV.md`; keep that file at 13 or more lines.
