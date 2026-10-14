# WRITING

## Docs

### [Google developer documentation style guide](https://developers.google.com/style)

- Follow the Google developer documentation style guide for docs, rules, code comments, and commit messages. Do not use it for UI text: see UI text below.
- Follow the project rules in `AGENTS.md` and `rules/` when they differ from the guide. Follow the guide for everything that the project rules do not cover.
- Check the [word list](https://developers.google.com/style/word-list) for the spelling and use of terms.

### [Voice and tone](https://developers.google.com/style/tone)

- Use a friendly, conversational voice. Do not be flippant.
- Write for readers around the world with different levels of English. Write simple and consistent text. Do not use slang, jargon, clichés, figurative language, or culturally specific references.
- Do not announce future features or changes in docs.

### [Highlights](https://developers.google.com/style/highlights)

- Address the reader as "you". Do not use "we" for instructions.
- Use active voice, so it is clear who does each action.
- Use present tense for general behavior. Use future tense ("will") only for an action that happens later, for example during the next backup.
- Use standard American spelling and punctuation.
- State a condition before the instruction that it applies to: "To install the package, run `npm i`."

### [Formatting and organization](https://developers.google.com/style/highlights#formatting-punctuation-and-organization)

- Use sentence case for document titles and headings: "Write rules", not "Write Rules".
- Use numbered lists for steps in order. Use bulleted lists for other lists. Use description lists for pairs of related items.
- Use the serial (Oxford) comma: "pages, routes, and actions".
- Put code, file names, commands, and API names in code font: `astro.config`, `npm i`, `injectRoute()`.
- Put UI elements in bold: Click **Save**.
- Use unambiguous dates, for example 2026-10-14 or October 14, 2026. Do not use 10/14/26.

### [Link text](https://developers.google.com/style/link-text)

- Write link text that makes sense without the text around it. Do not use "click here", "this document", or "this article".
- Give each image in docs alt text.
- Use high-resolution or vector images, such as SVG, when you can.
- Write so that people with disabilities can use the docs.

## UI text

### [Material Design 3 content design](https://m3.material.io/foundations/content-design/overview)

- Follow the MD3 content design rules for all text in the UI: labels, buttons, menus, headings, dialogs, errors, emails, and alt text. Follow [AP Style](https://www.apstylebook.com) for everything that MD3 does not cover.

### [UX writing best practices](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices)

- Tell users what happens when they take an action and how they can undo it. Use neutral, direct words. Do not use alarming or condescending warnings.
- Use specific titles and headings that users can scan.
- Use sentence case for all UI text: titles, headings, labels, menu items, navigation, app bars, and buttons. Capitalize only product and brand names.
- Do not use all caps.
- Spell out words. Do not use Latin abbreviations such as "e.g." and "etc.": write "for example" and "and more".

### [Word choice](https://m3.material.io/foundations/content-design/style-guide/word-choice)

- Address the user as "you" and "your".
- Do not mix "me" or "my" with "you" or "your" on one screen.
- Do not use "we", "our", or "I" to speak for the product. Use "I" or "my" only where the user agrees to something, for example "I agree to the terms of service".

### [Grammar and punctuation](https://m3.material.io/foundations/content-design/style-guide/grammar-and-punctuation)

- Do not end a single sentence with a period in labels, tooltips, bulleted lists, dialog body text, and link text. Use periods when the text has more than one sentence.
- Use contractions ("don't", "can't"). Use "do not" only when you need more emphasis for a caution.
- Use the serial comma, except before "&".
- Use commas in numbers from 1,000 to 1 million. Do not use them in years, street addresses, and similar IDs. Use "M" for rounded millions, for example "2M downloads".
- Do not use colons in headings. Use a colon before a list in body text.
- Use exclamation points only for celebrations and greetings. Do not use them for empty states and common tasks.
- Use an ellipsis only for an action in progress, with no space before it. Do not put an ellipsis in buttons or menu items.
- Use parentheses only to define terms and acronyms. Do not use them for side notes.
- Use "&" only in headlines, table and column headers, navigation labels, and buttons when space is short. Write "and" in sentences.
- Do not use em dashes. Use an en dash with no spaces for ranges, for example "9 AM–5 PM". Do not put spaces around hyphens.
- Use bold for emphasis. Use italics only for one word or a name, never for a sentence.

### [Global writing](https://m3.material.io/foundations/content-design/global-writing/word-choice)

- Use global examples. Do not refer to one country's holidays, places, or companies.
- Write short, simple sentences. Plan for space: translated text is on average 1.5 times longer than English.
- Do not use abbreviations, except common time abbreviations.
- Repeat the noun instead of "it" when the noun is not clear. Do not start a sentence with "this" or "that" unless the noun follows.
- Do not use idioms, colloquial phrases, and technical jargon.
- Do not use "please", "sorry", and "thank you", especially in error messages. Use "please" only when you ask the user to do something inconvenient.
- Add a description for translators to each message that has a local reference (name, place, currency, temperature, date format) or an abbreviation.

### [Alt text](https://m3.material.io/foundations/content-design/alt-text)

- Describe the meaning and context of an image, not its details.
- Keep alt text to 140 characters or less.
- Do not start alt text with "image of": screen readers already say "image".
- Set `alt=""` on decorative images, which give no information.
