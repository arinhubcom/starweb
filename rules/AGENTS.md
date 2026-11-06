# AGENTS

Rules for editing `rules/`. Also follow [AGENTS.md](../AGENTS.md) at the repository root.

`rules/` is written for a person or an agent who works in a project. A person must be able to read each rule without help. Do not explain what the docs of a tool explain. Put long reasons and alternatives in [WHY.md](../WHY.md).

## How to write a rule

### Follow the work in a project

- Start each file with one sentence that says what the file covers and when to read it.
- Name each `##` section after a task or a situation, for example `## Add a database table` or `## Release to production`.
- Put the sections in the order that the work happens.
- Use `###` only to split a long task into smaller parts.
- Use a numbered list when the order matters. Use bullets for the other rules.
- Use a table to look up values, not to hold rules.

### Keep each rule small

- Write one decision or one action per bullet.
- If a rule has two decisions, split it into two bullets.
- Write a complete sentence of about 25 words or fewer.
- Add a short reason only when someone would otherwise "fix" the rule back. Put a longer reason in [WHY.md](../WHY.md).
- Put a condition first: `If the app sends email, add ...`.
- Write a forbidden option and its replacement in one bullet: `Use Kysely, not Drizzle or Prisma.`
- Write out what you mean. Do not use arrows, `=`, or abbreviations in place of words.
- Link to another rule with a full sentence: `See [DEPLOY](DEPLOY.md#ci).`

### Explain a config in the config

- Keep a config value, list, script, package, pin, and CI step only in its file. Do not describe them in a rule.
- Explain a config value in a comment next to the value. Say why the value is there and what breaks when you change it.
- If a file cannot hold comments, such as `package.json`, put the reason in [WHY.md](../WHY.md).
- A rule keeps what a file cannot show: how to write new code, an optional feature with no template file, a forbidden option, and an account step.
- A rule can name the file that holds a decision, so that the reader knows where to look.

### Keep the decisions

- Keep every project decision that the template does not hold: chosen tool, forbidden tool, exact path, file name, command, binding, limit, number, and order.
- When you move a decision out of a rule, move it to a comment in the file or to [WHY.md](../WHY.md) in the same commit.

### Links and names

- Use one registry: [STACK.md](STACK.md). Each name gets one `###` entry: a one-line scope, the topic files, then the sources (`llms`, `context7`, `docs`, `github`, `mcp`, `skills`, `tools`), as bare URLs.
- Link each name to its registry entry once in each topic file, at first use: `[Kysely](STACK.md#kysely)`. Do not repeat source URLs in topic files.
- Use a deep link in a topic file only when the registry sources cannot find the page by name, such as a specific GitHub file, a legal text, or a GitHub issue.
- `rules/` is copied to each project, so a rule never names the Starweb template: `package.json`, not `template/package.json`. Exceptions: a path in the Starweb clone that a step in [SETUP](SETUP.md) or [UPDATE](UPDATE.md) reads, and this file.

## WHY.md

- A commit that adds, changes, or removes a decision in `rules/` (chosen or forbidden tool, limit, number, version pin) updates its reason in [WHY.md](../WHY.md) in the same commit. Remove a reason when its decision goes.
- A decision a reader would question needs a reason in `WHY.md`. If you cannot verify the reason, ask the user. Do not invent one.
- A test note in `WHY.md` has the form `Tested on YYYY-MM-DD with <name> <version>`. When a template pin changes, run the test again and update the note, or keep the old date and version.
- Before a commit that touches `rules/`, `WHY.md`, or `template/package.json`: `node scripts/check-why.mjs`. CI runs it too. It fails on a broken link or anchor, an undated test note, or another major version than the template pin. It warns on another minor version.
- The script cannot find a false or missing reason. After a large change to `rules/`, compare `WHY.md` with `rules/` section by section.

## Verification

- Verify each rule in the official docs or on GitHub before you add it.
- When the docs do not fully answer it, or it depends on tool output, a config, or an error: install the package in a temporary folder outside the repository, run a short script, check the result. No test packages in the repository.
- A rule you cannot verify is not added. Say what you could not verify.

## Sources

- Context7: `https://context7.com/<library-id>/llms.txt?tokens=10000`. Find the ID with `https://context7.com/api/v1/search?query=<name>`. Prefer a `verified` ID with the higher `benchmarkScore`.
- `llms.txt`: try `<docs-origin>/llms.txt` and `/llms-full.txt`. Add only a URL that returns 200 with `text/plain` or `text/markdown`.
- Skills: find with `https://skills.sh/api/search?q=<name>`. Prefer the vendor's own skill, then the most installed one. Link `https://skills.sh/<owner>/<repo>/<skill>`.
- Check every URL before you add it. A URL that fails is not added.
- Context7 rate-limits `llms.txt` checks (429); verify a Context7 ID through the search API instead.

## Template

- `template/` holds the `create-emdash` output (`cloudflare:starter`) with the Starweb changes in place, `package.json`, and the configs, formatted with Oxfmt. A new project takes over the folder: `scripts/setup.mjs` copies it to the project root. No `files/` subfolder, no `create-emdash` run in a project.
- Not in `template/`: `.env` (`setup.mjs` writes a new key per project), `worker-configuration.d.ts`.
- `template/pnpm-lock.yaml` matches `template/package.json` (`setup.mjs` runs `pnpm install --frozen-lockfile`). After a change to `template/package.json`: `pnpm install --lockfile-only` in `template/`.
- `starter/` holds the last `create-emdash` output, shaped like `template/` (renamed, formatted, without the files above, the lockfile, and `pnpm-workspace.yaml`): the merge base. No hand edits.
- EmDash update → [UPDATE](UPDATE.md) (EmDash update). `.github/workflows/starter-check.yml` runs `node scripts/update-starter.mjs --check` every Monday, and opens or updates one issue when `create-emdash` gives other files than `starter/` or a newer version is ready to pin.
- No install commands in `rules/` (`pnpm add`, `pnpm remove`, `pnpm exec astro add`). A package every project needs goes in `template/package.json`, its config in `template/`. A rule for an optional feature names the packages only.
- A rule and the file in `template/` or `scripts/setup.mjs` that implements it change in the same commit.
- A new decision in `template/` that a reader would question needs its reason in `WHY.md` or a comment in the file.
- Each decision that applies to every project and that a file, config value, package, script, or CI step can implement goes in `template/` or `scripts/setup.mjs`, not in `rules/`, or in a step in [SETUP](SETUP.md) that a real project can run. Conditional rules ("uses X →") need a [SETUP](SETUP.md) step. A step never names a file that neither the template nor the step creates.
- Keep [SETUP](SETUP.md) and [UPDATE](UPDATE.md) current, in the same commit as the change: a change to `template/`, `scripts/`, CI, or a rule that changes what a new project needs updates SETUP; one that changes what an existing project must do updates UPDATE. A step never names a command, flag, file, or `update.mjs` output label that no longer exists.
- `template/.agents/skills/` holds the starter skills and `starweb-update`. Claude Code reads only `.claude/skills`, so keep the symbolic link `.claude/skills` → `../.agents/skills`. `starweb-update` points to `rules/UPDATE.md` in the clone; no steps in the skill.
- A new template file or behavior gets a check in `scripts/test-template.sh`.
- Exact versions in `template/package.json`, no `^` or `~`. A `catalog:` entry has its exact version in `template/pnpm-workspace.yaml`.
- Before a commit that touches `template/`, `scripts/`, or a rule they implement: `bash scripts/test-template.sh <tmp-dir>` (new folder outside the repository). `--quick` stops after the checks, for iteration only.
- Before each template test, check every package in `template/package.json` for a newer version (`pnpm view <package> time`); pin the newest that is older than 3 days and within peer ranges and the [DEPS](DEPS.md) ignore list, then test with it.
- New minor or major of `@astrojs/cloudflare`, `wrangler`, `tailwindcss`, `zod`, `effect`, `typescript-eslint`, `oxlint`, `oxfmt`, `@e18e/eslint-plugin`, `vitest`, `knip`, and any new version of `oxlint-plugin-react-doctor`, in a Dependabot pull request or a pin change: read the release notes of each version it passes (sources in [STACK](STACK.md)). Update the rules, `WHY.md`, and `template/` for each new feature that fits the stack, deprecation, or fixed workaround, in the same pull request. `oxlint-plugin-react-doctor`: also compare the rules. → [QUALITY](QUALITY.md) (React Doctor rules)
- New `astro` minor or major: read its post in the [Astro blog feed](https://astro.build/rss.xml) (`Astro X.Y` for each minor it passes, plus the monthly "What's new in Astro" posts since the old pin). Update the rules, `WHY.md`, and `template/` for each new feature, deprecation, or fixed workaround in the same commit as the version bump.
- Before a push that changes the steps in [SETUP](SETUP.md), `scripts/setup.mjs`, or the Quick start prompt in `README.md`: test setup with an agent. → [WHY](../WHY.md#why-an-agent-tests-setup)
  - New sub-agent with no context from your session. Its task is the Quick start prompt, copied from `README.md`.
  - Change in the prompt only: the clone URL = path of the local repository when the change is not pushed, and the project and clone folders = new folders outside the repository.
  - Tell the sub-agent the answer to the optional parts question, only after it reports the question. It runs no step that needs a Cloudflare account (login, deploy), unless you give it a test account.
  - Done when: it asked the question before step 2, it ran the steps of the parts you picked, and `pnpm run check`, `pnpm run build`, and `pnpm run size` pass in the new project.
  - It reports each step that it misread or could not follow. Fix the step, and run the test again.
- Also `bash scripts/test-update.sh <tmp-dir>` (another new folder) when the change touches `scripts/update.mjs`, `scripts/update-starter.mjs`, `scripts/setup.mjs`, `scripts/lib.mjs`, `.starweb.json`, or the files `update.mjs` merges. It edits lines 7, 10, and 13 of `rules/DEV.md`; keep that file at 13 or more lines.
