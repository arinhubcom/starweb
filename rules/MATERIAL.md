# MATERIAL

Material Design 3 (MD3) rules for layout, spacing, and component sizes.

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
