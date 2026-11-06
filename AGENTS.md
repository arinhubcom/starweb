# AGENTS

## Rules

- All text must be in English only. The only exception is i18n translation files.
- Follow the [Google developer documentation style guide](https://developers.google.com/style) for docs, rules, code comments, and commit messages.
- Follow the [Material Design 3 content design](https://m3.material.io/foundations/content-design/overview) rules for UI text. Follow the [Mailchimp voice and tone](https://styleguide.mailchimp.com/voice-and-tone/) rules only for voice and tone.
- Follow the rules in [rules/WRITING.md](rules/WRITING.md) for both.
- Verify each technical claim and architecture decision in the official docs or the GitHub repository of the tool before you write it. Do not write from memory. If you cannot verify a claim, say so.
- In the rules and docs, a project is a new, separate repository that gets a copy of `rules/` and the contents of `template/`, and other parts of Starweb when it needs them. The Starweb repository is not a project: project steps and checks run in the new repository. A qualified name, such as Astro project, keeps its own meaning.

## Writing rules

- Follow the rules in [rules/AGENTS.md](rules/AGENTS.md) when you add or change a rule in `rules/`.

## Mermaid diagrams

Follow these rules when you add or change a Mermaid diagram in a Markdown file.

### Content

- Show only services, tools, and flows that the code, `rules/`, or the official docs confirm.
- Use solid lines for what every project uses. Use dashed lines for what you add when you need it. Say this in the text above the diagram.
- Add `accTitle` and `accDescr` to each diagram. Update `accDescr` when the diagram changes, so that it tells the same story.
- Do not use color as the only way to show a meaning. Each node needs a label that says what it is.

### Layout

- Start each diagram with this line:

  ```text
  %%{init: {"htmlLabels": false, "flowchart": {"htmlLabels": false, "wrappingWidth": 600, "padding": 20}}}%%
  ```

- Keep the diagram narrow, because a wide diagram scales down and its text gets small. Group related items in one node, and stack nodes with invisible links (`~~~`).
- Do not draw many links between nodes in one `subgraph`. Move details such as shared code or rules into the text below the diagram.

### Colors

- Use this palette in each diagram, and give each color only this meaning. Mermaid cannot share definitions between diagrams, so repeat the lines that the diagram uses:

  ```text
  classDef cloudflare fill:#fde8d0,stroke:#c2570c,color:#1f1f1f
  classDef data fill:#dbeafe,stroke:#1d4ed8,color:#1f1f1f
  classDef app fill:#dcfce7,stroke:#15803d,color:#1f1f1f
  classDef neutral fill:#e5e7eb,stroke:#4b5563,color:#1f1f1f
  classDef external fill:#ede9fe,stroke:#6d28d9,color:#1f1f1f
  classDef check fill:#fef3c7,stroke:#b45309,color:#1f1f1f
  ```

  | Class | Color | Use |
  | --- | --- | --- |
  | `cloudflare` | Orange | Cloudflare network, Workers, and platform services |
  | `data` | Blue | Databases, storage, and caches |
  | `app` | Green | Pages, islands, CMS, and apps |
  | `neutral` | Gray | People and tools, such as GitHub |
  | `external` | Purple | Services and runtimes outside Cloudflare |
  | `check` | Yellow | Checks and measurements |

- Assign classes at the end of the diagram: `class Worker,Network cloudflare`.
- Keep the `color` value in each `classDef`. Without it, the theme can set a text color that is hard to read on the fill.
- Keep each `subgraph` neutral, so that it does not compete with the nodes: `style <id> fill:transparent,stroke:#8b949e`.
- Explain the colors once in each document, above the first diagram.

### Check

- Before you commit, render each changed diagram with the light and dark Mermaid themes. Check that it renders with no errors and that all text is readable.

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
