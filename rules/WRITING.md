# WRITING

## Docs

### [Google developer documentation style guide](STACK.md#google-developer-documentation-style-guide)

- Applies to docs, rules, code comments, commit messages. UI text: UI text rules first. `AGENTS.md` and `rules/` win where they differ.
- Word list for spelling and term use: https://developers.google.com/style/word-list
- Friendly, conversational voice; not flippant.
- Global readers: simple, consistent text; no slang, jargon, clichés, figurative language, culture-specific references.
- No announcements of future features or changes.
- "You"; no "we" in instructions. Active voice. Present tense; "will" only for a later action (next backup). American spelling and punctuation.
- Condition before instruction: "To install the package, run `pnpm add`."
- Sentence case for titles and headings.
- Numbered lists for ordered steps, bulleted for others, description lists for pairs.
- Serial (Oxford) comma.
- Code font: code, file names, commands, API names (`astro.config`, `pnpm add`, `injectRoute()`). UI elements bold: Click **Save**.
- Unambiguous dates: 2026-10-14 or October 14, 2026; not 10/14/26.
- Link text readable alone; no "click here", "this document", "this article".
- Alt text on every image; vector or high-resolution images (SVG). Accessible to people with disabilities.

## UI text

### [Material Design 3](STACK.md#material-design-3) content design

- MD3 content design for all UI text: labels, buttons, menus, headings, dialogs, errors, emails, alt text. Gaps → Google style guide. Conflicts → MD3.

### UX writing best practices

- Say what happens on an action and how to undo it. Neutral, direct words; no alarming or condescending warnings.
- No misrepresented consequences, no steering the decision (cancel subscription).
- Specific, scannable titles; headings and subheads prioritize and group.
- Sentence case for all UI text (titles, headings, labels, menu items, navigation, app bars, buttons); capitalize only product and brand names. No all caps.
- Spelled-out words; no "e.g.", "etc." → "for example", "and more".

### Word choice

- "You" and "your". No "me"/"my" mixed with "you"/"your" on one screen.
- No "we", "our", "I" for the product. "I"/"my" only where the user agrees ("I agree to the terms of service").

### Conversation mining

- Before writing UI text for a feature, find users' words: support requests, feedback, reviews, forums, social media.
- Set a goal first (feature name, one problem's words). Positive conversations for new text, negative for pain points.
- Use users' words for things and actions in labels, buttons, headings, search; no slang, idioms, hashtags → Global writing.
- Glossary of chosen terms; same term for the same thing everywhere.

### [Mailchimp content style guide](STACK.md#mailchimp-content-style-guide) voice and tone

- Voice and tone only; MD3 wins elsewhere (for example "we").
- One voice in all UI text, home page to system alerts: plain, warm, human. Vary only tone, matched to the user's state of mind (relieved, confused).
- Clarity before fun; humor only when natural; unsure → none.
- Positive: what the user can do, not cannot.
- No hype, over-promises, upsell, emotional tricks.
- Hard concepts in plain words, no condescension.

### Grammar and punctuation

- No period on a single sentence in labels, tooltips, bulleted lists, dialog body, link text; periods when more than one sentence.
- Contractions ("don't", "can't"); "do not" only for emphasis in a caution.
- Serial comma, except before "&".
- Commas in numbers 1,000 to 1 million; none in years, street addresses, similar IDs. "M" for rounded millions (2M downloads).
- No colons in headings; colon before a list in body text.
- Exclamation points only for celebrations and greetings; not empty states or common tasks.
- Ellipsis only for action in progress, no space before; none in buttons or menu items.
- Parentheses only to define terms and acronyms, not side notes.
- "&" only in headlines, table and column headers, navigation labels, buttons when space is short; "and" in sentences.
- No em dashes. En dash without spaces for ranges (9 AM–5 PM). No spaces around hyphens.
- Unsure about a compound hyphen: [AP Style](https://www.apstylebook.com), for that only.
- Bold for emphasis; italics only for one word or a name, never a sentence.

### Global writing

- Global examples; no one country's holidays, places, companies.
- Short, simple sentences; plan space for translations (about 1.5 times longer).
- No abbreviations except common time abbreviations.
- Repeat the noun instead of an unclear "it"; no sentence start with "this"/"that" without a noun.
- No idioms, colloquial phrases, jargon.
- No "please", "sorry", "thank you", especially in errors; "please" only for an inconvenient request.
- Translator description on each message with a local reference (name, place, currency, temperature, date format) or abbreviation.

### Alt text

- Meaning and context, not details. 140 characters or less. No "image of" start. `alt=""` for decorative images.
