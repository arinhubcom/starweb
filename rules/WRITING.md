# WRITING

This file covers how to write docs, rules, code comments, commit messages, and UI text. Read it before you write any text.

## Write docs

- Follow the [Google developer documentation style guide](STACK.md#google-developer-documentation-style-guide) for docs, rules, code comments, and commit messages.
- For UI text, follow the UI text rules first.
- Where `AGENTS.md` and `rules/` differ from the style guide, they win.
- Check spelling and term use against the word list: https://developers.google.com/style/word-list
- Use a friendly, conversational voice. Do not be flippant.
- Write for global readers: simple, consistent text with no slang, jargon, clichés, figurative language, or culture-specific references.
- Do not announce future features or changes.
- Address the reader as "you". Do not use "we" in instructions.
- Use the active voice and the present tense. Use "will" only for a later action, such as the next backup.
- Use American spelling and punctuation.
- Put the condition before the instruction: "To install the package, run `pnpm add`."
- Use sentence case for titles and headings.
- Use numbered lists for ordered steps, bulleted lists for the rest, and description lists for pairs.
- Use the serial (Oxford) comma.
- Use code font for code, file names, commands, and API names, such as `astro.config`, `pnpm add`, and `injectRoute()`.
- Use bold for UI elements: Click **Save**.
- Write unambiguous dates: 2026-10-14 or October 14, 2026. Do not write 10/14/26.
- Write link text that reads alone. Do not use "click here", "this document", or "this article".
- Add alt text to every image, so that people with disabilities can use it.
- Use vector or high-resolution images, such as SVG.

## Write UI text

### Follow content design

- Follow [Material Design 3](STACK.md#material-design-3) content design for all UI text: labels, buttons, menus, headings, dialogs, errors, emails, and alt text.
- Where MD3 has gaps, follow the Google style guide.
- Where they conflict, MD3 wins.

### Follow UX writing practices

- Say what happens on an action and how to undo it.
- Use neutral, direct words. Do not write alarming or condescending warnings.
- Do not misrepresent consequences. Do not steer the decision, for example when the user cancels a subscription.
- Write specific, scannable titles. Use headings and subheads to prioritize and group.
- Use sentence case for all UI text: titles, headings, labels, menu items, navigation, app bars, and buttons.
- Capitalize only product and brand names. Do not use all caps.
- Spell out words. Write "for example" and "and more", not "e.g." and "etc."

### Choose words

- Use "you" and "your".
- Do not mix "me" and "my" with "you" and "your" on one screen.
- Do not use "we", "our", or "I" for the product.
- Use "I" and "my" only where the user agrees, such as "I agree to the terms of service".

### Use the words of your users

- Before you write UI text for a feature, find the words of users: support requests, feedback, reviews, forums, and social media.
- Set a goal first, such as the feature name or the words for one problem.
- Use positive conversations for new text and negative conversations for pain points.
- Use the words of users for things and actions in labels, buttons, headings, and search.
- Do not use slang, idioms, or hashtags. See [Write for a global audience](#write-for-a-global-audience).
- Keep a glossary of the chosen terms.
- Use the same term for the same thing everywhere.

### Set voice and tone

- Follow the [Mailchimp content style guide](STACK.md#mailchimp-content-style-guide) for voice and tone only. MD3 wins elsewhere, for example on "we".
- Use one voice in all UI text, from the home page to system alerts: plain, warm, and human.
- Vary only the tone, matched to the state of mind of the user, such as relieved or confused.
- Put clarity before fun.
- Use humor only when it is natural. If you are unsure, use none.
- Write what the user can do, not what the user cannot do.
- Do not use hype, over-promises, upsell, or emotional tricks.
- Explain hard concepts in plain words. Do not be condescending.

### Use grammar and punctuation

- Do not end a single sentence with a period in labels, tooltips, bulleted lists, dialog body, and link text.
- Use periods when there is more than one sentence.
- Use contractions, such as "don't" and "can't". Use "do not" only for emphasis in a caution.
- Use the serial comma, except before "&".
- Use commas in numbers from 1,000 to 1 million. Do not use them in years, street addresses, and similar IDs.
- Use "M" for rounded millions, such as 2M downloads.
- Do not use colons in headings. Use a colon before a list in body text.
- Use exclamation points only for celebrations and greetings. Do not use them in empty states or for common tasks.
- Use an ellipsis only for an action in progress, with no space before it. Do not use it in buttons or menu items.
- Use parentheses only to define terms and acronyms. Do not use them for side notes.
- Use "&" only in headlines, table and column headers, navigation labels, and buttons when space is short. Use "and" in sentences.
- Do not use em dashes.
- Use an en dash without spaces for ranges, such as 9 AM–5 PM.
- Do not put spaces around hyphens.
- If you are unsure about a compound hyphen, use [AP Style](https://www.apstylebook.com) for that only.
- Use bold for emphasis.
- Use italics only for one word or a name, never for a sentence.

### Write for a global audience

- Use global examples. Do not use the holidays, places, or companies of one country.
- Write short, simple sentences.
- Plan space for translations, which are about 1.5 times longer.
- Do not use abbreviations, except common time abbreviations.
- Repeat the noun instead of an unclear "it".
- Do not start a sentence with "this" or "that" without a noun.
- Do not use idioms, colloquial phrases, or jargon.
- Do not use "please", "sorry", or "thank you", especially in errors.
- Use "please" only for an inconvenient request.
- Add a translator description to each message that has a local reference (name, place, currency, temperature, date format) or an abbreviation.

### Write alt text

- Describe the meaning and context, not the details.
- Use 140 characters or fewer.
- Do not start with "image of".
- Use `alt=""` for decorative images.
