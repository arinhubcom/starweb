# GEMINI

## Model selection

Set the `Model` parameter of `invoke_subagent` to choose the model tier of a sub-agent. You cannot choose a model by name, only a tier.

### flash_lite

Use a sub-agent with `Model: "flash_lite"` to:

- Write commit messages, PR text, and issue text.
- Run tests, build, and lint.
- Search the code.
- Write and update text, docs, and rules. Write summaries.
- Do other mechanical work that has a clear task and needs no deep reasoning.

### flash

Use a sub-agent with `Model: "flash"` to:

- Implement a task that has a clear plan or spec.
- Write tests.
- Review code.

### pro

Use a sub-agent with `Model: "pro"` to:

- Plan tasks and design the architecture.
- Debug hard problems that have no clear cause.
- Review security.
- Plan and split large changes.

### inherit

Use a sub-agent with `Model: "inherit"` only when:

- `pro` could not solve the task.
- A wrong decision is very costly or hard to undo.

`inherit` uses the model of the main session. Start the session with a strong model for this, for example `agy --model claude-opus-4-6-thinking`.

### Escalation

Model order, from weakest to strongest: `flash_lite`, `flash`, `pro`, `inherit`.

---

@AGENTS.md
