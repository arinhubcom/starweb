# AGENTS

## Rules

- All text must be in English only. The only exception is i18n translation files.
- Write exclusively in Globish combined with Simplified Technical English (STE).

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
