# CLAUDE

## Model selection

### Haiku

Use a sub-agent with `model: "haiku"` to:

- Write commit messages, PR text, and issue text.
- Run tests, build, and lint.
- Search the code.
- Write and update text, docs, and rules. Write summaries.
- Do other mechanical work that has a clear task and needs no deep reasoning.

### Sonnet

Use a sub-agent with `model: "sonnet"` to:

- Implement a task that has a clear plan or spec.
- Write tests.
- Review code.

### Opus

Use a sub-agent with `model: "opus"` to:

- Plan tasks and design the architecture.
- Debug hard problems that have no clear cause.
- Review security.
- Plan and split large changes.

### Fable

Use a sub-agent with `model: "fable"` only when:

- Opus could not solve the task.
- A wrong decision is very costly or hard to undo.

### Escalation

Model order, from weakest to strongest: haiku, sonnet, opus, fable.

## Sub-agent nesting

- Sub-agents can start their own sub-agents, up to 3 levels below the main agent. A sub-agent at level 3 cannot start more.

---

@AGENTS.md
