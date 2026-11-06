# MATERIAL

This file covers the [Material Design 3](STACK.md#material-design-3) (MD3) Expressive values for layout, spacing, states, motion, color, and component sizes. Read it before you size or style a component.

- Radius comes from the [Fulldev UI](STACK.md#fulldev-ui) theme.
- For fonts and icons, see [MEDIA](MEDIA.md).
- For colors, see [Set the colors](#set-the-colors).

## Find a value

- Use the Expressive value, not the baseline value. The navigation bar is 64px, not 80px.
- Read the Expressive specs in the androidx Compose [`material3/tokens`](https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens) folder, such as `NavigationRailCollapsedTokens.kt`.
- Read the changes for each component under "M3 Expressive styles" in the [MDC-Android docs](https://github.com/material-components/material-components-android/tree/master/docs/components).
- For web values, including `linear()` springs, read material-web [`labs/gb`](https://github.com/material-components/material-web/tree/main/labs/gb).
- Do not use `tokens/versions/latest` of material-web, because it holds the baseline. The exception is a value that did not change, such as the state layer opacities.
- Do not use Flutter as a source. See [flutter#168813](https://github.com/flutter/flutter/issues/168813).
- m3.material.io is a JavaScript app. Read it in a browser with `agent-browser`, because a fetch returns nothing.

## Lay out a page

- 1dp is 1 CSS pixel. One Tailwind step (`--spacing: 0.25rem`) is 4px.
- Compact is below 600px and has no prefix.
- Use `medium:`, `expanded:`, `large:`, and `xlarge:` for page layout.
- Keep the default `sm:` and `md:` prefixes, because Fulldev UI uses them.
- Use the page margin `px-4 medium:px-6` and the pane gap `gap-6`.
- Use 1 pane on compact and medium, 2 panes on expanded and large, and at most 3 panes on xlarge.
- On medium, use 2 panes only for low-density content such as settings, with `grid-cols-2`.
- Size the fixed pane `w-90` (360px) on expanded, and `large:w-103` (412px) on large and xlarge. The other pane fills the rest.
- On compact, use a bottom navigation bar.
- From medium, use a navigation rail at the leading edge.
- Use the expanded rail (with labels) only on large and xlarge.
- Limit body text to 40-60 characters per line: `max-w-[60ch]`.
- Align leading elements (thumbnails, avatars, icons) on one line.

## Space elements

- Use only MD3 spacing tokens. The scale is 8px, where `space100` is 8px.

  | MD3 token | px | Tailwind |
  |---|---|---|
  | space0, 25, 50, 75 | 0, 2, 4, 6 | `0`, `0.5`, `1`, `1.5` |
  | space100, 125, 150, 175 | 8, 10, 12, 14 | `2`, `2.5`, `3`, `3.5` |
  | space200, 250, 300 | 16, 20, 24 | `4`, `5`, `6` |
  | space400, 450, 500 | 32, 36, 40 | `8`, `9`, `10` |
  | space600, 700, 800, 900 | 48, 56, 64, 72 | `12`, `14`, `16`, `18` |

- Default to multiples of 8px (even steps).
- Use 2, 4, 6, 10, 12, and 14px only inside components, such as between an icon and its label.
- Do not use other steps or arbitrary values such as `p-[13px]`.
- For a new value, add a `--spacing-*` token by the multiplier pattern. `space225` is 18px.
- Put padding and gap on the parent: `p-*`, and `gap-*` with flex or grid.
- Do not put margins on children (`mt-*`, `space-y-*`), except outside the parent padding or in page layout.
- Use logical sides: `ps-*`, `pe-*`, `ms-*`, `me-*`.
- Leave at least 8px between interactive targets.
- Keep the spacing unchanged at 200% text scale.

## Size touch targets

- Make each touch target at least 48x48px (`min-h-12 min-w-12`), even if the visible control is smaller.
- Extend the target with padding or a transparent `::after`.
- Use density 0 by default.
- Offer denser variants only as an opt-in user setting. Each step (-1, -2, -3) removes 4px of height or vertical padding.
- Do not make dense targets smaller than 48px by default.
- Do not use density in menus, dialogs, or snackbars.
- Keep the font size constant across densities.

## Style states

- Show a state with a state layer: an overlay in the content color (`currentColor`) over the container. Never change the container color.
- Use these opacities: hover 8%, focus 10%, pressed 10%, dragged 16%.
- Add the state layer once, in the `tv()` `base` of every component. See [COMPONENTS](COMPONENTS.md).
- On an installed component, remove its own hover color, such as `hover:bg-primary/90`.
- Use 38% opacity for disabled (`disabled:opacity-38`) and no state layer. For Base UI, use `data-disabled:opacity-38`.
- Replace the [shadcn/ui](STACK.md#shadcnui) `disabled:opacity-50`.
- Draw the focus ring with a 3px width and a 2px offset, in the theme color `outline-ring`.
- Use `src/components/ui/button/button-variants.ts` for the exact classes.

## Animate

- Use only these `duration-*` values, in ms.
  - Short: 50, 100, 150, 200.
  - Medium: 250, 300, 350, 400.
  - Long: 450, 500, 550, 600.
  - Extra long: 700, 800, 900, 1000.
- Enter with `ease-emphasized-decelerate`. Exit with `ease-emphasized-accelerate`.
- For the `transform` of a small component such as a switch handle, use `ease-spring-fast-spatial duration-350`.
- Use longer durations for full-screen transitions.
- For opacity and color, use `ease-standard`. Never use the spring, because it overshoots.
- For reduced motion, see [UI-UX](UI-UX.md#respect-reduced-motion).

## Set the colors

- Generate the colors from one seed with [material-color-utilities](https://github.com/material-foundation/material-color-utilities) (`@material/material-color-utilities`). Do not hand-pick theme colors.
- Build the light scheme (`isDark` is `false`) for `:root` and the dark scheme (`isDark` is `true`) for `.dark`.
- Use `SchemeFidelity` only when the exact brand color must show: the seed lands in `primaryContainer`, and only the 2021 spec supports it.
- Do not use `SchemeExpressive`, because it shifts hues.
- Run `scripts/theme.ts` with `pnpm exec tsx`, not with plain `node`.
- If a registry item adds color variables to `global.css`, remove them.
- Use the colors as MD3 does:
  - Dialog: `bg-surface-container-high`.
  - Highlight: `bg-primary-container text-on-primary-container`.
  - Destructive button: `bg-destructive text-on-error`.

## Size a component

### Buttons

- Define the `size` variants of the Fulldev UI and [Base UI](STACK.md#base-ui) buttons in `src/components/ui/button/button-variants.ts`. See [DESIGN](DESIGN.md).
- After install, use the same values in `src/components/ui/react/button.tsx`.

### Text fields

- Use `h-14 px-4`, icons `size-6`, and the icon-to-input gap `gap-4`.
- Put supporting text 4px below the field with 16px sides: `pt-1 px-4`.

### Lists

- Use item height `min-h-14` (56px) for 1 line, `min-h-18` (72px) for 2 lines, and `min-h-22` (88px) for 3 lines.
- Use `px-4 py-2.5 gap-3` on an item.
- Use leading icons `size-5` (20px), avatars `size-10` (40px), and images `size-14` (56px).

### Menus

- Use `min-w-28` (112px) and `py-2` on the menu.
- Use `min-h-12 px-4 py-2 gap-3` on an item, and icons `size-5`.
- Do not use 44px items. That is the Expressive segmented item, which is below the 48px target.

### Chips

- Use `h-8 px-4`, and `ps-2` on the leading icon.
- Use icon `size-4.5` (18px).
- Use a gap of 8px (`gap-2`) between icon and label and between chips.
- Reach the 48px target with `relative after:absolute after:inset-x-0 after:-inset-y-2`.
- Use `gap-y-4` between rows.

### Dialogs

- Make the width 280-560px, with at least 24px from the edges: `min-w-70 max-w-[min(560px,calc(100%-3rem))]`.
- Use `p-6` and icons `size-6`.

### Selection controls

- Use checkbox `size-4.5` (18px), radio `size-5` (20px), and switch track `w-13 h-8` (52x32px).
- Use a state layer `size-10` (40px) with a 48x48px target.

### Navigation bar

- Use the bottom bar `h-16` (64px, Expressive).
- Use the active indicator `w-14 h-8` (56x32px), icons `size-6`, and the icon-label gap `gap-1`.

### Navigation rail

- Use the collapsed rail `w-24` (96px, Expressive).
- Use items `h-16` (64px) with the indicator `w-14 h-8` (56x32px).
- Leave 44px above the first item (`pt-11`) and 40px between the header (FAB) and the items (`mb-10`).
- Use the expanded rail `min-w-55 max-w-90` (220-360px).
- Do not use a navigation drawer. It is deprecated in Expressive; use the expanded rail.
