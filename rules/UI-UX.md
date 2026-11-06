# UI-UX

Behavior and task completion, site and app. Look → [MATERIAL](MATERIAL.md), [DESIGN](DESIGN.md). Components → [COMPONENTS](COMPONENTS.md). UI text → [WRITING](WRITING.md). EmDash admin pages follow Kumo → [DESIGN](DESIGN.md).

## Accessibility

### [WCAG 2.2](STACK.md#wcag-22)

- Level AA on each page → [WHY](../WHY.md#why-wcag-22-aa).
- Contrast 4.5:1 text, 3:1 large text (1.4.3); 3:1 for borders, icons, states that identify a control (1.4.11). Check every theme token pair in light and dark.
- Keyboard-only operable (2.1.1); no focus trap, every component leavable (2.1.2); modal dialog keeps focus until closed.
- Focus order = visual order (2.4.3); no positive `tabindex`.
- Focus ring via `focus-visible:` (`focus-visible:outline-3 focus-visible:outline-offset-2`, → [MATERIAL](MATERIAL.md#states)). No `outline-none` without a `focus-visible:` style in the same class list (2.4.7).
- `scroll-padding-top` and `scroll-padding-bottom` on `<html>` equal to sticky header or bottom bar height (2.4.11).
- 320px width without horizontal scroll (1.4.10); only tables and code blocks scroll horizontally, in their own container.
- Hover or focus content (tooltip): Escape closes, stays open under the pointer (1.4.13). No action reachable only via tooltip or hover.
- Single-pointer alternative for each drag (buttons to move up and down) (2.5.7).
- Visible label text at the start of the accessible name (2.5.3); no differing `aria-label`.

### WAI-ARIA APG

- Native elements first: `<button>`, `<a href>`, `<input>`, `<select>`, `<dialog>`, `<details>`. No `onClick` on `<div>` or `<span>`.
- Dialogs, menus, tabs, comboboxes, composite widgets: [Base UI](STACK.md#base-ui) → [COMPONENTS](COMPONENTS.md). No own focus traps, roving `tabindex`, key handlers.
- Dialog: focus in on open, Escape closes, focus returns to the opener (Base UI default). `initialFocus`/`finalFocus` on `Dialog.Popup` only when the default is wrong (trigger gone after delete).
- One `<main>` per page; `<nav>` with `aria-label` per navigation; "Skip to main content" link as first focusable element in the base layout (2.4.1).

## States

### [Web performance](STACK.md#web-performance) CLS

- Views that load data: loading, empty, error, success. No blank area.
- Skeleton at final content size; no full-page spinner.
- `width` and `height` on each `<img>` and `<video>` or `aspect-ratio`; `min-height` for late content; CLS 0.1 or less → [MEDIA](MEDIA.md).
- Animate only `transform` and `opacity`.
- Empty state: why empty plus next action (**Create project**). Error state: what failed plus way out (**Try again**), rest of page usable. Text → [WRITING](WRITING.md).
- No island on the page: render error and empty states on the server. [TanStack](STACK.md#tanstack) Query states (`isPending`, `isError`) only in islands → [ARCH](ARCH.md).

## Forms

### [Astro](STACK.md#astro) Actions

- Server validation with the action's [Zod](STACK.md#zod) schema, also when the island validates.
- Field errors next to the field: `error.fields` after `isInputError(error)`; `aria-describedby` to the message, `aria-invalid="true"` on the input (3.3.1).
- Say how to fix (expected format) unless that weakens security (3.3.3) → [WRITING](WRITING.md).
- After a failed submit focus the first error field; long forms also an error summary at the top with links to fields.
- Show errors on `blur` or submit, not while typing the first time.
- Keep entered values after a failed submit (Astro clears inputs): render from submitted data, or `transition:persist` on inputs with view transitions.
- Success: `Astro.redirect()` (POST, redirect, GET). Action handlers cannot redirect: in the page `return Astro.redirect(Astro.url.pathname)` when `Astro.getActionResult(actions.x)?.data` is set, before reading the flash.
- Form without an island: result as status message in `role="status"` after the redirect (a toast needs an island).
- Message via [Astro session](https://docs.astro.build/en/guides/sessions/): handler `context.session?.set("flash", message, { ttl: 60 })`; page `await Astro.session?.get("flash")`, then `Astro.session?.set("flash", null)`. Per-user pages only, with `Astro.cache.set(false)` → [PERF](PERF.md) (Cache). Cloudflare adapter: `SESSION` KV binding.
- Public CDN-cached pages: no session read; redirect to a fixed URL (`/contact/thanks`).
- Disable submit and show progress while sending. Keep the label (**Save**), no **Saving…** (buttons have no ellipsis → [WRITING](WRITING.md)); progress via spinner or "Saving…" in `role="status"`.

### WCAG 2.2 input

- Visible `<label>`; placeholder is not a label (3.3.2).
- `autocomplete` on user inputs: `email`, `name`, `tel`, `current-password` (1.3.5).
- No re-asking data entered in the same flow; fill or let the user pick (3.3.7).
- Allow paste and password managers in login and code fields; no puzzle or cross-screen code memory without paste or copy (3.3.8).
- No submit or page change on field change (select); wait for a button (3.2.2).
- Review, confirm, or undo for each submit with legal or financial effect or data deletion (3.3.4).

## Feedback

### [Base UI](STACK.md#base-ui) Toast

- Toast confirms a finished action ("Project deleted"); no success dialog.
- Undoable delete: **Undo** via `actionProps` in `add()` plus `<Toast.Action />`; data restorable (soft delete) while the toast is open.
- Toast with an action: `timeout: 0` plus close button → [WHY](../WHY.md#why-toasts-with-an-action-do-not-close-on-their-own). Without an action: default 5000 ms.
- `priority: "high"` only for blocking errors; `"low"` for confirmations.
- Irreversible action (delete account): dialog first; confirm button names the action (**Delete account**), not **OK**.
- Background change result ("3 results", "Saved"): `role="status"` (4.1.3).

## Motion

### [Tailwind CSS](STACK.md#tailwind-css) reduced motion

- Movement animations behind `motion-safe:` (`motion-safe:transition motion-safe:hover:-translate-y-0.5`). `motion-reduce:` only to switch off one animation (`motion-reduce:hidden` on a spinner with text alternative).
- Reduced motion keeps fades and color changes; drops movement, scale, parallax, auto-play.
- No information only in animation (state change).
- MD3 easing and durations (`duration-200 ease-standard`) or installed component animations → [MATERIAL](MATERIAL.md#motion).

## Navigation

### Astro routing

- Shareable or reloadable view state in the URL: filters, sort, search, page, selected tab. Server: `Astro.url.searchParams`; TanStack Router SPA: search params with `validateSearch`.
- `<a href>` navigates, `<button>` acts; no button plus `onClick` navigation.
- Each page-like view has its own URL; no history replace for normal navigation.
- `aria-current="page"` on the current nav item.
- Same-tab links; new tab only for external links in a flow the user must not leave (checkout), stated in link text or icon label.

## Theme

### [MDN](STACK.md#mdn) `prefers-color-scheme`

- Default follows the system. Theme setting: light, dark, system.
- `localStorage` key `theme` (`light`, `dark`, `system`). No cookie, no server-rendered `.dark` (CDN caches public pages → [PERF](PERF.md) (Cache); server cannot know the system setting).
- `.dark` on `<html>` before first paint: the one blocking inline script in `<head>` of the base layout; reads `theme`, falls back to `matchMedia("(prefers-color-scheme: dark)")` for `system` or missing → [COMPONENTS](COMPONENTS.md) (Astro components).
- On pick, update `localStorage` and `.dark` together; for `system` also listen to the query's `change` event.
- Contrast rules (Accessibility) hold in both themes.
