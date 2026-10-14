# AGENTS

## Rules

- All text must be in English only. The only exception is i18n translation files.
- Follow the [Google developer documentation style guide](https://developers.google.com/style) for docs, rules, code comments, and commit messages.
- Follow the [Material Design 3 content design](https://m3.material.io/foundations/content-design/overview) rules for UI text. Follow the [Mailchimp voice and tone](https://styleguide.mailchimp.com/voice-and-tone/) rules only for voice and tone.
- Follow the rules in [rules/WRITING.md](rules/WRITING.md) for both.
- Verify each technical claim and architecture decision in the official docs or the project's GitHub repository before you write it. Do not write from memory. If you cannot verify a claim, say so.

## Writing rules

Follow these steps when you add or change a rule in `rules/`:

- Put each rule in the file for its topic, under an `##` area and a `###` heading for the tool. Put the link to the official docs in the `###` heading.
- Keep `rules/STACK.md` short. For each tool, write only which tool to use and a Markdown link to the topic file, for example `Follow the rules in [DATA.md](DATA.md).` Put the details in the topic file.
- Write one rule per bullet. Start with a verb, for example "Use", "Set", or "Do not".
- Keep each rule short and specific. Name the exact API, file, or command.
- When a rule forbids something, give the correct way in the same bullet.
- Write rules only. Put the reasons and alternatives in `WHY.md`.
- Verify each rule in the official docs or on GitHub before you add it.

## Sub-agents

### Task

- These rules apply at every level.
- Give each sub-agent one small task.

### Input and output

Give each sub-agent a clear input and output:

- Input: the goal, the files, and the plan it needs.
- Limits: what it must not change (other files, commits, pushes), unless that is the task.
- Done when: a clear check (for example: tests pass, lint has no errors).
- Output: the exact result to return (for example: a list of changed files, a pass or fail summary, or the text to use).

### Parallel work

- Run independent tasks in parallel sub-agents. Do not run tasks that change the same files in parallel.

### Escalation

- If a sub-agent fails, try once more with the next stronger model.
- If the main agent already runs on the chosen model, do the work directly.
- For any other task, the main agent decides or does it directly.

### Problems and results

- If a sub-agent is blocked or not sure, it reports the problem. It does not guess.
- If a sub-agent cannot escalate, it reports to its parent agent.
- Check the sub-agent result before you use it.
