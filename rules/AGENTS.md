# AGENTS

These rules apply when you add or change a rule in this folder. Also follow the rules in [AGENTS.md](../AGENTS.md) at the project root.

## Writing rules

- Put each rule in the file for its topic, under an `##` area and a `###` heading for the tool. Put the link to the official docs in the `###` heading.
- Keep `STACK.md` short. For each tool, write only which tool to use and a Markdown link to the topic file, for example `Follow the rules in [DATA.md](DATA.md).` Put the details in the topic file.
- Write one rule per bullet. Start with a verb, for example "Use", "Set", or "Do not".
- Keep each rule short and specific. Name the exact API, file, or command.
- When a rule forbids something, give the correct way in the same bullet.
- Write rules only. Put the reasons and alternatives in [WHY.md](../WHY.md).
- Verify each rule in the official docs or on GitHub before you add it.
- Also test a rule locally when the docs do not fully answer it, or when it depends on what a tool does, such as its output, a config, or an error. Install the package in a temporary folder outside the project, run a short script or command, and check the result. Do not install test packages in the project.
- When you cannot verify a rule in the docs or with a local test, do not add it. Say what you could not verify.

## Template rules

- Change the file in `template/files/` or `scripts/setup.mjs` that implements a rule in the same commit as the rule.
- Do not edit a file in `template/files/` without the rule that describes it. Add or change the rule first.
- Keep every version in `template/package.json` exact, with no `^` or `~`.
- Run `bash scripts/test-template.sh <tmp-dir>` before you commit a change to `template/`, `scripts/`, or a rule that they implement. Use a new folder outside the repository for `<tmp-dir>`.
