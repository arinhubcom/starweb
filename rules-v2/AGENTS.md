# AGENTS

Rules for editing `rules-v2/`. Also follow [AGENTS.md](../AGENTS.md) at the project root.

`rules-v2/` holds the same rules as [`rules/`](../rules/README.md), written for an agent that knows the stack. Name the lib, tool, API, pattern, or spec. Do not explain what its docs explain.

## Format

- One registry: [STACK.md](STACK.md). Each name gets one `###` entry: a one-line scope, the topic files, then the sources (`llms`, `context7`, `docs`, `github`, `mcp`, `skills`, `tools`), as bare URLs.
- Topic files link each name to its registry entry once, at first use: `[Kysely](STACK.md#kysely)`. Do not repeat source URLs in topic files.
- Use a deep link in a topic file only when the registry sources cannot find the page by name (a specific GitHub file, a legal text, a GitHub issue).
- `##` per area, `###` per name. One rule per bullet, a fragment is fine: `No \`forwardRef\`; \`ref\` is a prop.`
- Keep every project decision: chosen tool, forbidden tool, exact path, file name, command, binding, version pin, limit, number, order. Drop the reason unless the agent would otherwise "fix" the rule back.
- Write the forbidden option and its replacement in one bullet: `No Drizzle/Prisma → Kysely.`
- Cross-reference with `→ [FILE](FILE.md)`.

## Sources

- Context7: `https://context7.com/<library-id>/llms.txt?tokens=10000`. Find the ID with `https://context7.com/api/v1/search?query=<name>`. Prefer a `verified` ID with the higher `benchmarkScore`.
- `llms.txt`: try `<docs-origin>/llms.txt` and `/llms-full.txt`. Add only a URL that returns 200 with `text/plain` or `text/markdown`.
- Skills: find with `https://skills.sh/api/search?q=<name>`. Prefer the vendor's own skill, then the most installed one. Link `https://skills.sh/<owner>/<repo>/<skill>`.
- Check every URL before you add it. A URL that fails is not added.

## Sync with `rules/`

- A rule changes in `rules/` → change it in `rules-v2/` in the same commit, and the reverse.
- The template rules in [rules/AGENTS.md](../rules/AGENTS.md) (Template rules) apply here too.
