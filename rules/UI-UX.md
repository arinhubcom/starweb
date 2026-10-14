# UI-UX

Rules for how the UI behaves and how users finish a task. They apply to the site and the app. For the look, follow [MATERIAL.md](MATERIAL.md) and [DESIGN.md](DESIGN.md). For components, follow [COMPONENTS.md](COMPONENTS.md). For UI text, follow [WRITING.md](WRITING.md). EmDash admin pages follow Kumo (see [DESIGN.md](DESIGN.md)).

## Accessibility

### [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2&levels=a,aa)

- Meet WCAG 2.2 level AA on each page. Read [WHY.md](../WHY.md#why-wcag-22-aa).
- Give text a contrast of at least 4.5:1, and large text 3:1 (1.4.3). Give the borders, icons, and states that identify a control at least 3:1 against the colors next to them (1.4.11). Check each theme token pair in light and dark mode.
- Make each action work with the keyboard alone (2.1.1). Do not trap focus: the user must be able to leave each component with the keyboard (2.1.2). A modal dialog keeps focus inside until it closes (see WAI-ARIA APG).
- Keep the focus order the same as the visual order (2.4.3). Do not set a positive `tabindex`.
- Show a focus ring on each focusable element with `focus-visible:`, for example `focus-visible:outline-3 focus-visible:outline-offset-2` (see [MATERIAL.md](MATERIAL.md#states)). Do not remove the outline with `outline-none` unless you add a `focus-visible:` style in the same class list (2.4.7).
- Keep the focused element visible. Add `scroll-padding-top` and `scroll-padding-bottom` to `<html>` with the height of a sticky header or bottom bar, so they do not cover it (2.4.11).
- Make each page work at 320px width without horizontal scroll (1.4.10). Scroll only tables and code blocks horizontally, inside their own container.
- Let content that appears on hover or focus, such as a tooltip, close with Escape and stay open while the pointer is over it (1.4.13). Do not put the only way to an action in a tooltip or a hover state.
- Give each drag action a single-pointer alternative, for example buttons to move an item up and down (2.5.7).
- Put the visible label text at the start of the accessible name (2.5.3). Do not set an `aria-label` that differs from the visible label.

### [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/)

- Use native HTML elements first: `<button>`, `<a href>`, `<input>`, `<select>`, `<dialog>`, `<details>`. Do not put `onClick` on a `<div>` or `<span>`.
- Build dialogs, menus, tabs, comboboxes, and other composite widgets with Base UI (see [COMPONENTS.md](COMPONENTS.md)). Do not write focus traps, roving `tabindex`, or keyboard handlers for them yourself.
- Move focus into a dialog when it opens, close it with Escape, and return focus to the element that opened it. Base UI does this. Use `initialFocus` and `finalFocus` on `Dialog.Popup` only when the default target is wrong, for example when the trigger no longer exists after a delete.
- Add one `<main>` per page, and `<nav>` with an `aria-label` for each navigation. Add a "Skip to main content" link as the first focusable element in the base layout (WCAG 2.4.1).

## States

### [Cumulative Layout Shift](https://web.dev/articles/optimize-cls)

- Give each view that loads data four states: loading, empty, error, and success. Do not show a blank area.
- Show a skeleton with the size of the final content while data loads. Do not show a full-page spinner.
- Set `width` and `height` on each `<img>` and `<video>`, or reserve the space with `aspect-ratio`. Reserve space for late content with `min-height`. Keep CLS at 0.1 or less. For images, follow the rules in [MEDIA.md](MEDIA.md).
- Animate only `transform` and `opacity`. Do not animate `width`, `height`, `top`, or `margin`: they move the layout.
- Show an empty state that says why the view is empty and gives the next action, for example a **Create project** button. Follow the rules in [WRITING.md](WRITING.md) for the text.
- Show an error state that says what failed and gives a way out, for example a **Try again** button. Keep the rest of the page usable.
- Render the error and empty states on the server when the page has no island. Use the TanStack Query states (`isPending`, `isError`) only in islands (see [ARCH.md](ARCH.md)).

## Forms

### [Astro Actions](https://docs.astro.build/en/guides/actions/)

- Validate on the server with the Zod schema of the action, also when the island validates on the client. Do not trust client validation alone.
- Show each field error next to its field: read `error.fields` after `isInputError(error)`. Connect the message to the input with `aria-describedby`, and set `aria-invalid="true"` on the input (WCAG 3.3.1).
- Say how to fix the error, for example the expected format, unless that weakens security (WCAG 3.3.3). Follow the rules in [WRITING.md](WRITING.md) for the text.
- Move focus to the first field with an error after a failed submit. On a long form, also show a summary of the errors at the top, with a link to each field.
- Show the error when the user leaves a field (`blur`) or submits. Do not show errors while the user types for the first time.
- Keep the values that the user entered after a failed submit. Astro clears the inputs on submit, so render the values from the submitted data, or add `transition:persist` to each input with view transitions.
- Redirect after a successful submit with `Astro.redirect()` (POST, redirect, GET), so a reload does not send the form again.
- Show the result of a form without an island on the page after the redirect, as a status message in an element with `role="status"`: a toast needs an island.
- Pass the message with an [Astro session](https://docs.astro.build/en/guides/sessions/). Set it in the action handler: `context.session?.set("flash", message, { ttl: 60 })`. Read it in the page after the redirect: `await Astro.session?.get("flash")`, then clear it with `Astro.session?.set("flash", null)`. Use it only on a per-user page, and call `Astro.cache.set(false)` on that page (see [PERF.md](PERF.md) (Cache)). The Cloudflare adapter stores sessions in the `SESSION` KV binding.
- Do not read the session on a public page that the CDN caches. Redirect to a fixed confirmation URL instead, for example `/contact/thanks`.
- Disable the submit button and show progress while the form sends, so it cannot be sent twice. Keep the button label, for example **Save**: do not replace it with **Saving…**, because buttons have no ellipsis (see [WRITING.md](WRITING.md)). Show progress with a spinner, or with a text such as "Saving…" in an element with `role="status"`.

### [WCAG 2.2 input](https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2&levels=a,aa#input-assistance)

- Give each input a visible `<label>`. Do not use the placeholder as the label (3.3.2).
- Set `autocomplete` on inputs about the user, for example `email`, `name`, `tel`, and `current-password` (1.3.5).
- Do not ask for data again that the user already entered in the same flow. Fill it in, or let the user pick it (3.3.7).
- Allow paste and password managers in login and code fields. Do not ask the user to solve a puzzle or remember a code from another screen without a paste or copy option (3.3.8).
- Do not submit a form or change the page when the user changes a field, such as a select. Wait for a button press (3.2.2).
- Let the user review and confirm, or undo, each submit that has a legal or financial effect or deletes data (3.3.4).

## Feedback

### [Base UI Toast](https://base-ui.com/react/components/toast)

- Confirm a finished action with a toast, for example "Project deleted". Do not show a dialog to confirm a success.
- Offer **Undo** in the toast for a delete that you can undo: pass `actionProps` to `add()`, and render `<Toast.Action />`. Keep the deleted data restorable, for example with a soft delete, so **Undo** works as long as the toast is open.
- Set `timeout: 0` on a toast that has an action, and give it a close button. Let a toast without an action close after the default 5000 ms. Read [WHY.md](../WHY.md#why-toasts-with-an-action-do-not-close-on-their-own).
- Set `priority: "high"` only for errors that block the user. Keep `priority: "low"` for confirmations.
- Show a dialog before an action that you cannot undo, for example deleting an account. Name the action on the confirm button, for example **Delete account**, not **OK**.
- Show the result of a background change as a status message, for example "3 results" or "Saved", in an element with `role="status"`, so screen readers read it without a focus change (WCAG 4.1.3).

## Motion

### [Tailwind CSS reduced motion](https://tailwindcss.com/docs/hover-focus-and-other-states#prefers-reduced-motion)

- Put each movement animation behind `motion-safe:`, for example `motion-safe:transition motion-safe:hover:-translate-y-0.5`. Use `motion-reduce:` only to turn off one animation, for example `motion-reduce:hidden` on a spinner that has a text alternative.
- Keep fades and color changes for users with reduced motion. Turn off movement, scale, parallax, and auto-playing animation for them.
- Do not use animation to show information that is not also in text, such as a state change.
- Use the MD3 easing curves and durations, for example `duration-200 ease-standard`, or the animations that the installed components bring. Follow the rules in [MATERIAL.md](MATERIAL.md#motion).

## Navigation

### [Astro routing](https://docs.astro.build/en/guides/routing/)

- Put the view state that a user can share or reload in the URL: filters, sort, search, page number, and the selected tab. Read it with `Astro.url.searchParams` on the server. In a TanStack Router SPA, use search params with `validateSearch`.
- Use `<a href>` for navigation and `<button>` for actions. Do not navigate with a button and `onClick`.
- Keep the back button working: each view that the user sees as a page has its own URL. Do not replace history entries for normal navigation.
- Mark the current page in the navigation with `aria-current="page"`.
- Open links in the same tab. Open a new tab only for external links in a flow that the user must not leave, such as a checkout, and say so in the link text or an icon label.

## Theme

### [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

- Follow the system color scheme by default. Offer a theme setting with three options: light, dark, and system.
- Store the theme choice in `localStorage` under the key `theme` (`light`, `dark`, or `system`). Do not store it in a cookie or render `.dark` on the server: the CDN caches public pages (see [PERF.md](PERF.md) (Cache)), so a cached page would carry the theme of another user, and the server cannot know the system setting.
- Set the `.dark` class on `<html>` before the first paint, with the one blocking inline script in `<head>` of the base layout. The script reads `theme` and falls back to `matchMedia("(prefers-color-scheme: dark)")` when the value is `system` or missing. Follow the rules in [DESIGN.md](DESIGN.md) for the dark variant and in [COMPONENTS.md](COMPONENTS.md) (Astro components) for the script.
- Update `localStorage` and the `.dark` class together when the user picks an option. For `system`, also listen to the `change` event of the `matchMedia` query.
- Check the contrast rules in Accessibility in both themes.
