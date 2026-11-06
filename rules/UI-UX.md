# UI-UX

This file covers behavior and task completion on the site and in apps: accessibility, states, forms, feedback, motion, navigation, and theme. Read it before you build a page or a flow.

- For the look, see [MATERIAL](MATERIAL.md) and [DESIGN](DESIGN.md).
- For components, see [COMPONENTS](COMPONENTS.md).
- For UI text, see [WRITING](WRITING.md).
- EmDash admin pages follow Kumo. See [DESIGN](DESIGN.md).

## Meet the accessibility requirements

### Meet WCAG 2.2

- Meet [WCAG 2.2](STACK.md#wcag-22) level AA on each page. See [WHY](../WHY.md#why-wcag-22-aa).
- Use a contrast of 4.5:1 for text and 3:1 for large text (1.4.3).
- Use a contrast of 3:1 for borders, icons, and states that identify a control (1.4.11).
- Check every theme token pair in light and dark.
- Make everything operable with the keyboard alone (2.1.1).
- Do not create a focus trap. Every component must be leavable (2.1.2). A modal dialog keeps focus until it closes.
- Make the focus order match the visual order (2.4.3). Do not use a positive `tabindex`.
- Show the focus ring with `focus-visible:`. See [MATERIAL](MATERIAL.md#style-states).
- Do not use `outline-none` without a `focus-visible:` style in the same class list (2.4.7).
- Set `scroll-padding-top` and `scroll-padding-bottom` on `<html>` equal to the height of the sticky header or bottom bar (2.4.11).
- Keep the page usable at 320px width without horizontal scroll (1.4.10).
- Let only tables and code blocks scroll horizontally, in their own container.
- For hover or focus content such as a tooltip, let Escape close it and keep it open under the pointer (1.4.13).
- Do not make an action reachable only through a tooltip or hover.
- Give each drag a single-pointer alternative, such as buttons to move up and down (2.5.7).
- Start the accessible name with the visible label text (2.5.3). Do not use an `aria-label` that differs.

### Use native elements and WAI-ARIA APG

- Use native elements first: `<button>`, `<a href>`, `<input>`, `<select>`, `<dialog>`, `<details>`.
- Do not put `onClick` on a `<div>` or `<span>`.
- For dialogs, menus, tabs, comboboxes, and other composite widgets, use [Base UI](STACK.md#base-ui). See [COMPONENTS](COMPONENTS.md).
- Do not write your own focus traps, roving `tabindex`, or key handlers.
- In a dialog, focus moves in on open, Escape closes it, and focus returns to the opener. This is the Base UI default.
- Set `initialFocus` or `finalFocus` on `Dialog.Popup` only when the default is wrong, for example when the trigger is gone after a delete.
- Use one `<main>` per page.
- Give each `<nav>` an `aria-label`.

## Show loading, empty, and error states

- Give each view that loads data a loading, an empty, an error, and a success state. Do not leave a blank area.
- Use a skeleton at the final content size. Do not use a full-page spinner.
- Set `width` and `height` on each `<img>` and `<video>`, or use `aspect-ratio`. See [Web performance](STACK.md#web-performance) and [MEDIA](MEDIA.md).
- Use `min-height` for content that arrives late. Keep CLS at 0.1 or less.
- Animate only `transform` and `opacity`.
- In an empty state, say why it is empty and give the next action (**Create project**).
- In an error state, say what failed and give a way out (**Try again**). The rest of the page stays usable.
- For the text, see [WRITING](WRITING.md).
- If the page has no island, render the error and empty states on the server.
- Use [TanStack](STACK.md#tanstack) Query states (`isPending`, `isError`) only in islands. See [ARCH](ARCH.md).

## Build a form

### Handle input and errors

- Validate on the server with the [Zod](STACK.md#zod) schema of the [Astro](STACK.md#astro) action, also when the island validates.
- Show field errors next to the field, from `error.fields` after `isInputError(error)`.
- Link the message with `aria-describedby` and set `aria-invalid="true"` on the input (3.3.1).
- Say how to fix the error, such as the expected format, unless that weakens security (3.3.3). See [WRITING](WRITING.md).
- After a failed submit, focus the first error field.
- In a long form, also show an error summary at the top with links to the fields.
- Show errors on `blur` or on submit, not while the user types for the first time.
- Keep the entered values after a failed submit, because Astro clears inputs.
- To keep them, render from the submitted data, or use `transition:persist` on inputs with view transitions.

### Finish a submit

- After success, use `Astro.redirect()` (POST, redirect, GET).
- Action handlers cannot redirect. In the page, `return Astro.redirect(Astro.url.pathname)` when `Astro.getActionResult(actions.x)?.data` is set, before you read the flash.
- For a form without an island, show the result as a status message in `role="status"` after the redirect. A toast needs an island.
- Pass the message through the [Astro session](https://docs.astro.build/en/guides/sessions/).
- In the handler, call `context.session?.set("flash", message, { ttl: 60 })`.
- In the page, call `await Astro.session?.get("flash")`, then `Astro.session?.set("flash", null)`.
- Read the session only on per-user pages, with `Astro.cache.set(false)`. See [PERF](PERF.md#use-astro-route-caching).
- The Cloudflare adapter uses the `SESSION` KV binding.
- On public pages cached by the CDN, do not read the session. Redirect to a fixed URL such as `/contact/thanks`.
- While sending, disable submit and show progress.
- Keep the button label (**Save**). Do not change it to **Saving…**, because buttons have no ellipsis. See [WRITING](WRITING.md).
- Show progress with a spinner, or with "Saving…" in `role="status"`.

### Follow the WCAG 2.2 input criteria

- Use a visible `<label>`. A placeholder is not a label (3.3.2).
- Set `autocomplete` on user inputs: `email`, `name`, `tel`, `current-password` (1.3.5).
- Do not ask for data again that the user entered in the same flow. Fill it in or let the user pick (3.3.7).
- Allow paste and password managers in login and code fields (3.3.8).
- Do not require a puzzle or a code that the user must remember across screens without paste or copy (3.3.8).
- Do not submit or change the page on a field change such as a select. Wait for a button (3.2.2).
- Offer review, confirm, or undo for each submit with legal or financial effect, and for data deletion (3.3.4).

## Give feedback

- Use a toast to confirm a finished action, such as "Project deleted". Do not use a success dialog.
- For an undoable delete, add **Undo** with `actionProps` in `add()` and `<Toast.Action />` from the Base UI toast.
- Keep the data restorable (soft delete) while the toast is open.
- Give a toast with an action `timeout: 0` and a close button. See [WHY](../WHY.md#why-toasts-with-an-action-do-not-close-on-their-own).
- A toast without an action uses the default of 5000 ms.
- Use `priority: "high"` only for blocking errors. Use `"low"` for confirmations.
- For an irreversible action such as deleting an account, show a dialog first.
- Name the action on the confirm button (**Delete account**), not **OK**.
- Announce the result of a background change, such as "3 results" or "Saved", in `role="status"` (4.1.3).

## Respect reduced motion

- Put movement animations behind `motion-safe:`, as in `motion-safe:transition motion-safe:hover:-translate-y-0.5`. Use [Tailwind CSS](STACK.md#tailwind-css) variants.
- Use `motion-reduce:` only to switch off one animation, such as `motion-reduce:hidden` on a spinner that has a text alternative.
- Under reduced motion, keep fades and color changes.
- Under reduced motion, drop movement, scale, parallax, and auto-play.
- Do not show information only in an animation, such as a state change.
- For MD3 easing and durations (`duration-200 ease-standard`) and installed component animations, see [MATERIAL](MATERIAL.md#animate).

## Build navigation

- Put shareable or reloadable view state in the URL: filters, sort, search, page, and selected tab.
- On the server, read it from `Astro.url.searchParams`. In a TanStack Router SPA, use search params with `validateSearch`.
- Use `<a href>` to navigate and `<button>` to act. Do not navigate with a button and `onClick`.
- Give each page-like view its own URL. Do not replace history for normal navigation.
- Set `aria-current="page"` on the current navigation item.
- Open links in the same tab.
- Open a new tab only for an external link in a flow the user must not leave, such as checkout. State this in the link text or icon label.

## Support light and dark themes

- Follow the system by default, using [`prefers-color-scheme`](STACK.md#mdn). Offer a theme setting with light, dark, and system.
- When the user picks a theme, update `localStorage` and `.dark` together.
- For `system`, also listen to the `change` event of the media query.
- Do not use a cookie. Do not render `.dark` on the server. The CDN caches public pages, and the server cannot know the system setting. See [PERF](PERF.md#cache-pages).
- Keep the contrast rules from [Meet WCAG 2.2](#meet-wcag-22) in both themes.
