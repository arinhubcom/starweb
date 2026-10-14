# MATERIAL

Material Design 3 (MD3) rules for layout, spacing, states, and component sizes.

## Layout

### [Material Design 3 layout](https://m3.material.io/foundations/layout/layout-overview)

- Use the Material Design 3 (MD3) rules for layout, spacing, and component sizes. Keep the look (colors, fonts, radius) from the Fulldev UI theme.
- Read 1dp as 1 CSS pixel. One Tailwind spacing step (`--spacing: 0.25rem`) is 4px.
- Add the MD3 breakpoints to the `@theme` block in `global.css`: `--breakpoint-medium: 37.5rem;` (600px), `--breakpoint-expanded: 52.5rem;` (840px), `--breakpoint-large: 75rem;` (1200px), `--breakpoint-xlarge: 100rem;` (1600px). Below 600px is compact, with no prefix.
- Use `medium:`, `expanded:`, `large:`, and `xlarge:` for page layout. Do not remove the Tailwind default breakpoints (`sm:`, `md:`, and so on): Fulldev UI components use them.
- Set the page margin to 16px on compact and 24px from medium up: `px-4 medium:px-6`.
- Put 24px between panes: `gap-6`.
- Use 1 pane on compact and medium, 2 panes on expanded and large, and up to 3 panes on xlarge. Never use more than 3 panes.
- Use 2 panes on medium only for low-density content, such as settings, with 50% width each (`grid-cols-2`).
- Make a fixed pane 360px wide on expanded (`w-90`) and 412px on large and xlarge (`large:w-103`). Let the other pane fill the rest.
- Put the navigation in a bottom navigation bar on compact, and in a navigation rail at the leading edge from medium up. Show the expanded rail (with labels) only on large and xlarge.
- Keep body text between 40 and 60 characters per line: `max-w-[60ch]`.
- Align leading elements (thumbnails, avatars, icons) in lists and cards on one line.

## Spacing

### [Material Design 3 spacing](https://m3.material.io/m3/pages/spacing/overview)

- Use only MD3 spacing tokens. They are on an 8px scale (`space100` = 8px). Map them to Tailwind steps:

  | MD3 token | px | Tailwind step |
  |---|---|---|
  | space0, 25, 50, 75 | 0, 2, 4, 6 | `0`, `0.5`, `1`, `1.5` |
  | space100, 125, 150, 175 | 8, 10, 12, 14 | `2`, `2.5`, `3`, `3.5` |
  | space200, 250, 300 | 16, 20, 24 | `4`, `5`, `6` |
  | space400, 450, 500 | 32, 36, 40 | `8`, `9`, `10` |
  | space600, 700, 800, 900 | 48, 56, 64, 72 | `12`, `14`, `16`, `18` |

- Use multiples of 8px (even steps) by default. Use 2, 4, 6, 10, 12, and 14px only inside components, for example between an icon and its label.
- Do not use other steps or arbitrary values such as `p-[13px]`. When you need a new value, add a token with the multiplier pattern (`space225` = 18px) as a `--spacing-*` theme variable.
- Put padding and gaps on the parent: `p-*`, `gap-*` with `flex` or `grid`. Do not put margins on children (`mt-*`, `space-y-*`). Use margins only for space outside the parent's padding, or in the page layout.
- Use logical sides for leading and trailing space (`ps-*`, `pe-*`, `ms-*`, `me-*`), so the layout works in right-to-left languages.
- Use 8px or more between interactive targets.
- Keep the same spacing when text scales up to 200%. Do not shrink padding when the font gets bigger.

## Targets

### [Material Design 3 targets and density](https://m3.material.io/foundations/layout/grids-spacing/density)

- Make each touch target at least 48x48px (`min-h-12 min-w-12`), also when the icon or the visible control is smaller. Extend the hit area with padding or a transparent `::after` element.
- Use density 0 (the MD3 default) for all components. Make denser variants opt-in only, through a user setting: each density step (-1, -2, -3) removes 4px of height or vertical padding.
- Do not make dense components with targets smaller than 48x48px by default. Do not use density in menus, dialogs, and snackbars.
- Keep the font size the same in all density steps.

## States

### [Material Design 3 interaction states](https://m3.material.io/foundations/interaction/states/overview)

- Show hover, focus, and pressed states with a state layer: an overlay in the content color on top of the container. Do not change the container color. Take the color from the theme (`currentColor`) and only the opacity from MD3.
- Use these state layer opacities: hover 8%, focus 10%, pressed 10%, and dragged 16%. Draw the layer with a `::before` element, for example `relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10`.
- Add the state layer once, in the base class of the component variants (`cva()`). When you add it to an installed component, remove the component's own hover color (for example `hover:bg-primary/90`), so the two do not stack.
- Show a disabled control at 38% opacity: `disabled:opacity-38`, or `data-disabled:opacity-38` for Base UI. Change the `disabled:opacity-50` that shadcn/ui components use. Do not show a state layer on a disabled control.
- Make the focus indicator 3px thick with a 2px offset: `focus-visible:outline-3 focus-visible:outline-offset-2`. Take the outline color from the theme, for example `outline-ring`.

## Components

### [Material Design 3 buttons](https://m3.material.io/components/buttons/specs)

- Set button sizes to the MD3 values. Change the `size` variants of Fulldev UI and Base UI buttons (see [DESIGN.md](DESIGN.md)) in `src/components/ui/button/button-variants.ts` and `src/components/ui/react/button.tsx` after install:

  | MD3 size | Height | Leading and trailing padding | Icon | Icon-label gap | Tailwind |
  |---|---|---|---|---|---|
  | XS | 32px | 16px | 20px | 8px | `h-8 px-4 gap-2 [&_svg]:size-5` |
  | S (default) | 40px | 16px | 20px | 8px | `h-10 px-4 gap-2 [&_svg]:size-5` |
  | M | 56px | 24px | 24px | 8px | `h-14 px-6 gap-2 [&_svg]:size-6` |
  | L | 96px | 48px | 32px | 12px | `h-24 px-12 gap-3 [&_svg]:size-8` |
  | XL | 136px | 64px | 40px | 16px | `h-34 px-16 gap-4 [&_svg]:size-10` |

- Give XS and S buttons and icon buttons a 48x48px target. See [Targets](#targets).

### [Material Design 3 icon buttons](https://m3.material.io/components/icon-buttons/specs)

- Set icon button sizes to the MD3 values. Use the same size names as the buttons:

  | MD3 size | Container | Icon | Tailwind |
  |---|---|---|---|
  | XS | 32px | 20px | `size-8 [&_svg]:size-5` |
  | S (default) | 40px | 24px | `size-10 [&_svg]:size-6` |
  | M | 56px | 24px | `size-14 [&_svg]:size-6` |
  | L | 96px | 32px | `size-24 [&_svg]:size-8` |
  | XL | 136px | 40px | `size-34 [&_svg]:size-10` |

### [Material Design 3 text fields](https://m3.material.io/components/text-fields/specs)

- Make a text field 56px high with 16px leading and trailing padding: `h-14 px-4`. Use 24px icons (`size-6`) and a 16px gap between an icon and the input (`gap-4`).
- Put the supporting text 4px below the field, with 16px side padding: `pt-1 px-4`.

### [Material Design 3 lists](https://m3.material.io/components/lists/specs)

- Make list items 56px high for one line, 72px for two lines, and 88px for three lines: `min-h-14`, `min-h-18`, `min-h-22`.
- Use 16px side padding, 10px top and bottom padding, and a 12px gap between the leading element and the text: `px-4 py-2.5 gap-3`.
- Use 20px leading icons (`size-5`), 40px avatars (`size-10`), and 56px images (`size-14`).

### [Material Design 3 menus](https://m3.material.io/components/menus/specs)

- Make a menu at least 112px wide (`min-w-28`), with 8px top and bottom padding (`py-2`).
- Make menu items 44px high, with 16px side padding, 8px top and bottom padding, and a 12px gap: `h-11 px-4 py-2 gap-3`. Use 20px icons (`size-5`).

### [Material Design 3 chips](https://m3.material.io/components/chips/specs)

- Make chips 32px high with 16px side padding: `h-8 px-4`. With a leading icon, use 8px leading padding (`ps-2`).
- Use 18px icons (`size-4.5`) and an 8px gap between an icon and the label, and between chips: `gap-2`.

### [Material Design 3 dialogs](https://m3.material.io/components/dialogs/specs)

- Make a dialog from 280px to 560px wide, and at least 24px from the screen edges: `min-w-70 max-w-[min(560px,calc(100%-3rem))]`.
- Use 24px padding (`p-6`) and 24px icons (`size-6`).

### [Material Design 3 selection controls](https://m3.material.io/components/checkbox/specs)

- Make a checkbox 18px (`size-4.5`), a radio button 20px (`size-5`), and a switch track 52x32px (`w-13 h-8`).
- Put a 40px state layer (`size-10`) around each control, and give it a 48x48px target. See [Targets](#targets).

### [Material Design 3 navigation bar](https://m3.material.io/components/navigation-bar/specs)

- Make the bottom navigation bar 64px high (`h-16`), as in MD3 Expressive.
- Make the active indicator 56x32px (`w-14 h-8`), with 24px icons (`size-6`) and a 4px gap between the icon and the label (`gap-1`).

### [Material Design 3 navigation rail](https://m3.material.io/components/navigation-rail/specs)

- Make the collapsed navigation rail 96px wide (`w-24`), as in MD3 Expressive. Make each item 64px high (`h-16`), with a 56x32px active indicator (`w-14 h-8`).
- Put 44px above the first item (`pt-11`), and 40px between an optional header, such as a FAB, and the items (`mb-10`).
- Make the expanded rail from 220px to 360px wide: `min-w-55 max-w-90`.
- Do not use a navigation drawer. MD3 Expressive deprecates it. Use the expanded navigation rail instead.
