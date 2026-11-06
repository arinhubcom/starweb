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
- `rules/` is copied to each project, so a rule never names the Starweb template: `package.json`, not `template/package.json`.
- The exceptions are a path in the Starweb clone that a step in [SETUP](SETUP.md) or [UPDATE](UPDATE.md) reads, and this file.

## WHY.md

- A decision is a chosen or forbidden tool, a limit, a number, or a version pin.
- When a commit adds, changes, or removes a decision in `rules/`, update its reason in [WHY.md](../WHY.md) in the same commit.
- Remove a reason when its decision goes.
- A decision a reader would question needs a reason in `WHY.md`.
- If you cannot verify the reason, ask the user. Do not invent one.
- A test note in `WHY.md` has the form `Tested on YYYY-MM-DD with <name> <version>`.
- When a template pin changes, run the test again and update the note. Or keep the old date and version.
- Before a commit that touches `rules/`, `WHY.md`, or `template/package.json`, run `node scripts/check-why.mjs`. CI runs it too.
- The script fails on a broken link or anchor, an undated test note, or another major version than the template pin.
- The script warns on another minor version.
- The script cannot find a false or missing reason. After a large change to `rules/`, compare `WHY.md` with `rules/` section by section.

## Verification

- Verify each rule in the official docs or on GitHub before you add it.
- If the docs do not fully answer it, or it depends on tool output, a config, or an error, test it in a temporary folder outside the repository.
- In that folder, install the package, run a short script, and check the result.
- Do not add test packages to the repository.
- Do not add a rule you cannot verify. Say what you could not verify.

## Sources

- Context7: use `https://context7.com/<library-id>/llms.txt?tokens=10000`.
- Find the Context7 ID with `https://context7.com/api/v1/search?query=<name>`. Prefer a `verified` ID with the higher `benchmarkScore`.
- Context7 rate-limits `llms.txt` checks (429). Verify a Context7 ID through the search API instead.
- `llms.txt`: try `<docs-origin>/llms.txt` and `/llms-full.txt`.
- Add an `llms.txt` URL only if it returns 200 with `text/plain` or `text/markdown`.
- Skills: find a skill with `https://skills.sh/api/search?q=<name>`. Prefer the vendor's own skill, then the most installed one.
- Link a skill as `https://skills.sh/<owner>/<repo>/<skill>`.
- Check every URL before you add it. Do not add a URL that fails.

## Change the template in Starweb

This section is for the Starweb repository, not for a project. A project does not change `template/`.

### What the folders hold

- `template/` holds the `create-emdash` output (`cloudflare:starter`) with the Starweb changes in place.
- `template/` also holds `package.json` and the configs, formatted with Oxfmt.
- A new project takes over the folder. `scripts/setup.mjs` copies it to the project root.
- Do not add a `files/` subfolder. Do not run `create-emdash` in a project.
- Do not put `.env` or `worker-configuration.d.ts` in `template/`. `setup.mjs` writes a new key to `.env` for each project.
- `template/pnpm-lock.yaml` must match `template/package.json`, because `setup.mjs` runs `pnpm install --frozen-lockfile`.
- After a change to `template/package.json`, run `pnpm install --lockfile-only` in `template/`.
- `starter/` holds the last `create-emdash` output. It is the merge base. Do not edit it by hand.
- `starter/` has the shape of `template/`: renamed and formatted, without the files above, the lockfile, and `pnpm-workspace.yaml`.
- For an EmDash update, see [UPDATE](UPDATE.md#emdash-update).
- `.github/workflows/starter-check.yml` runs `node scripts/update-starter.mjs --check` every Monday.
- It opens or updates one issue when `create-emdash` gives other files than `starter/`, or when a newer version is ready to pin.

### Keep the template, the rules, and the docs in step

- Do not put install commands in `rules/` (`pnpm add`, `pnpm remove`, `pnpm exec astro add`).
- Put a package that every project needs in `template/package.json`, and its config in `template/`.
- A rule for an optional feature names the packages only.
- Change a rule and the file in `template/` or `scripts/setup.mjs` that implements it in the same commit.
- A new decision in `template/` that a reader would question needs its reason in `WHY.md` or a comment in the file.
- Put a decision that applies to every project in `template/` or `scripts/setup.mjs`, not in `rules/`, if a file, config value, package, script, or CI step can implement it.
- If a file cannot implement it, write it as a step in [SETUP](SETUP.md) that a real project can run.
- A conditional rule, such as "If the project uses X", needs a [SETUP](SETUP.md) step.
- A step never names a file that neither the template nor the step creates.
- Keep [SETUP](SETUP.md) and [UPDATE](UPDATE.md) current, in the same commit as the change.
- If a change to `template/`, `scripts/`, CI, or a rule changes what a new project needs, update SETUP.
- If a change to `template/`, `scripts/`, CI, or a rule changes what an existing project must do, update UPDATE.
- A step never names a command, flag, file, or `update.mjs` output label that no longer exists.
- `template/.agents/skills/` holds the starter skills and `starweb-update`.
- Claude Code reads only `.claude/skills`. Keep the symbolic link `.claude/skills` that points to `../.agents/skills`.
- `starweb-update` points to `rules/UPDATE.md` in the clone. The skill holds no steps.
- A new template file or behavior gets a check in `scripts/test-template.sh`.

### Pin versions

- Use exact versions in `template/package.json`, with no `^` or `~`.
- A `catalog:` entry has its exact version in `template/pnpm-workspace.yaml`.

### Test before a commit

- Before a commit that touches `template/`, `scripts/`, or a rule they implement, run `bash scripts/test-template.sh <tmp-dir>`. Use a new folder outside the repository.
- `--quick` stops after the checks. Use it for iteration only.
- Before each template test, check every package in `template/package.json` for a newer version with `pnpm view <package> time`.
- Pin the newest version that is older than 3 days and within the peer ranges and the [DEPS](DEPS.md) ignore list. Then test with it.

### Read the release notes

- Read the release notes of each version that a change passes when a Dependabot pull request or a pin change brings one of these:
  - A new minor or major of `@astrojs/cloudflare`, `wrangler`, `tailwindcss`, `zod`, `effect`, `typescript-eslint`, `oxlint`, `oxfmt`, `@e18e/eslint-plugin`, `vitest`, or `knip`.
  - Any new version of `oxlint-plugin-react-doctor`.
- The sources are in [STACK](STACK.md).
- For each new feature that fits the stack, deprecation, or fixed workaround, update the rules, `WHY.md`, and `template/` in the same pull request.
- For `oxlint-plugin-react-doctor`, also compare the rules. See [QUALITY](QUALITY.md#change-the-react-doctor-rules).
- For a new `astro` minor or major, read its post in the [Astro blog feed](https://astro.build/rss.xml).
- Read `Astro X.Y` for each minor the pin passes, plus the monthly "What's new in Astro" posts since the old pin.
- For each new feature, deprecation, or fixed workaround, update the rules, `WHY.md`, and `template/` in the same commit as the version bump.

### Test setup with an agent

- Before a push that changes the steps in [SETUP](SETUP.md), `scripts/setup.mjs`, or the Quick start prompt in `README.md`, test setup with an agent. See [WHY](../WHY.md#why-an-agent-tests-setup).
  - Start a new sub-agent with no context from your session. Its task is the Quick start prompt, copied from `README.md`.
  - If the change is not pushed, change only the clone URL in the prompt to the path of the local repository.
  - Change the project and clone folders in the prompt to new folders outside the repository.
  - Tell the sub-agent the answer to the optional parts question, only after it reports the question.
  - The sub-agent runs no step that needs a Cloudflare account (login, deploy), unless you give it a test account.
  - The test is done when the sub-agent asked the question before step 2, and ran the steps of the parts you picked.
  - The test is also done when `pnpm run check`, `pnpm run build`, and `pnpm run size` pass in the new project.
  - The sub-agent reports each step that it misread or could not follow. Fix the step, and run the test again.

### Test the update script

- Also run `bash scripts/test-update.sh <tmp-dir>` in another new folder when the change touches one of these:
  - `scripts/update.mjs`, `scripts/update-starter.mjs`, `scripts/setup.mjs`, or `scripts/lib.mjs`.
  - `.starweb.json`.
  - The files `update.mjs` merges.
- The script edits lines 2, 3, 4, 7, 10, and 13 of `rules/DEV.md`. Keep that file at 13 or more lines.
