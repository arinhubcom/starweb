# MATERIAL

Material Design 3 (MD3) rules for layout, spacing, states, motion, color, and component sizes. The rules follow MD3 Expressive.

## Sources

### [Material Design 3 Expressive](https://m3.material.io/blog/building-with-m3-expressive)

- Use the MD3 Expressive value when it differs from baseline MD3, for example a 64px navigation bar instead of 80px.
- Take MD3 Expressive specs from the generated Jetpack Compose tokens in [androidx `material3/tokens`](https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens), for example `NavigationRailCollapsedTokens.kt`. They are the most complete source.
- Check what MD3 Expressive changed in the "M3 Expressive styles" section of each component doc in [MDC-Android](https://github.com/material-components/material-components-android/tree/master/docs/components).
- Take values for the web, such as `linear()` spring curves, from the experimental Expressive web components in [material-web `labs/gb`](https://github.com/material-components/material-web/tree/main/labs/gb).
- Do not take MD3 Expressive values from the material-web [`tokens/versions/latest`](https://github.com/material-components/material-web/tree/main/tokens/versions/latest/sass) folder: it has baseline MD3 values. Use it only for values that MD3 Expressive did not change, such as the state layer opacities.
- Do not use Flutter as a source: it does not implement MD3 Expressive ([flutter#168813](https://github.com/flutter/flutter/issues/168813)).
- Read the usage guidance on [m3.material.io](https://m3.material.io) in a browser, for example with `agent-browser`. The site is a JavaScript app, so fetch tools return no content.

## Layout

### [Material Design 3 layout](https://m3.material.io/foundations/layout/layout-overview)

- Use the Material Design 3 (MD3) rules for layout, spacing, and component sizes. Keep the fonts and the radius from the Fulldev UI theme. Generate the colors as described in [Color](#color).
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

## Motion

### [Material Design 3 motion](https://m3.material.io/styles/motion/overview/specs)

- Add the MD3 easing curves to the `@theme` block in `global.css`:

  ```css
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --ease-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
  --ease-spring-fast-spatial: linear(0, 0.099, 0.317, 0.561, 0.775, 0.934, 1.034, 1.083, 1.095, 1.084, 1.063, 1.04, 1.02, 1.005, 0.996, 0.992, 0.991, 0.992, 0.994, 0.996, 1);
  ```

- Use only MD3 durations with `duration-*`: 50, 100, 150, and 200ms (short), 250, 300, 350, and 400ms (medium), 450, 500, 550, and 600ms (long), and 700, 800, 900, and 1000ms (extra long). Do not use other values.
- Animate an element that enters the screen with `ease-emphasized-decelerate`, and an element that leaves it with `ease-emphasized-accelerate`.
- Animate a movement or a scale change (`transform`) in a small component, such as a switch handle, with the MD3 Expressive fast spatial spring: `ease-spring-fast-spatial duration-350`. Use longer durations from the list for full-screen transitions.
- Animate opacity and color with `ease-standard`. Do not use the spring for them: it overshoots.
- Follow the rules for reduced motion in [UI-UX.md](UI-UX.md#motion).

## Color

### [Material Design 3 color system](https://m3.material.io/styles/color/system/overview)

- Generate the theme colors from one seed color with [material-color-utilities](https://github.com/material-foundation/material-color-utilities) (`@material/material-color-utilities`). Do not pick theme colors by hand.
- Use `SchemeTonalSpot` with the 2025 spec (MD3 Expressive) and the standard contrast level: `new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), isDark, 0, "2025")`. Build one scheme with `isDark` set to `false` for `:root` and one with `true` for `.dark`.
- Use `SchemeFidelity` only when the exact brand color must appear in the UI: it puts the seed color in `primaryContainer`, but supports only the 2021 spec. Do not use `SchemeExpressive`: it moves the hues away from the seed color.
- Generate the colors at build time in `scripts/theme.ts`, and run it with `npx tsx scripts/theme.ts`. Install both packages as dev dependencies: `npm i -D @material/material-color-utilities tsx`. Do not run the script with plain `node`: version 0.4.0 imports its own files without the `.js` extension, so Node cannot load it.
- Read each role from the scheme and write it as hex: `hexFromArgb(scheme.surfaceContainerHigh)`.
- Write the output to `src/styles/theme.css` and import it in `global.css`. Do not edit `theme.css` by hand: change the seed and run the script again.
- Remove the color variables that `shadcn init` wrote to `:root` and `.dark` in `global.css`. Keep `--radius`, the shadows, the fonts, and the chart colors (`--chart-1` to `--chart-5`) from the Fulldev UI theme.
- Map the MD3 roles to the shadcn/ui variables. The roles follow the MD3 component tokens, for example a menu container is `surface-container`:

  | shadcn/ui variable | MD3 role |
  |---|---|
  | `--background`, `--foreground` | `surface`, `onSurface` |
  | `--card`, `--card-foreground` | `surfaceContainerLow`, `onSurface` |
  | `--popover`, `--popover-foreground` | `surfaceContainer`, `onSurface` |
  | `--primary`, `--primary-foreground` | `primary`, `onPrimary` |
  | `--secondary`, `--secondary-foreground` | `secondaryContainer`, `onSecondaryContainer` |
  | `--muted`, `--muted-foreground` | `surfaceContainerHighest`, `onSurfaceVariant` |
  | `--accent`, `--accent-foreground` | `secondaryContainer`, `onSecondaryContainer` |
  | `--destructive` | `error` |
  | `--border` | `outlineVariant` |
  | `--input` | `outline` |
  | `--ring` | `secondary` |
  | `--sidebar`, `--sidebar-foreground` | `surface`, `onSurface` |
  | `--sidebar-primary`, `--sidebar-primary-foreground` | `primary`, `onPrimary` |
  | `--sidebar-accent`, `--sidebar-accent-foreground` | `secondaryContainer`, `onSecondaryContainer` |
  | `--sidebar-border`, `--sidebar-ring` | `outlineVariant`, `secondary` |

- Add the MD3 roles that have no shadcn/ui variable as kebab-case variables, and expose them in `@theme inline` in `theme.css`: `primaryContainer`, `onPrimaryContainer`, `tertiary`, `onTertiary`, `tertiaryContainer`, `onTertiaryContainer`, `onError`, `errorContainer`, `onErrorContainer`, `surfaceContainerLowest` to `surfaceContainerHighest`, `inverseSurface`, `inverseOnSurface`, `inversePrimary`, `outline`, `outlineVariant`, and `scrim`. For example, write `--surface-container-high` and `--color-surface-container-high: var(--surface-container-high);`.
- Use the extra roles where MD3 uses them, for example `bg-surface-container-high` for a dialog, `bg-primary-container text-on-primary-container` for a highlighted area, and `bg-destructive text-on-error` for a destructive button.

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
- Make menu items at least 48px high (`min-h-12`), with 16px side padding, 8px top and bottom padding, and a 12px gap: `min-h-12 px-4 py-2 gap-3`. Use 20px icons (`size-5`). Do not use 44px: that is the height of an MD3 Expressive segmented menu item, which is below the 48px target (see [Targets](#targets)).

### [Material Design 3 chips](https://m3.material.io/components/chips/specs)

- Make chips 32px high with 16px side padding: `h-8 px-4`. With a leading icon, use 8px leading padding (`ps-2`).
- Use 18px icons (`size-4.5`) and an 8px gap between an icon and the label, and between chips in a row: `gap-2`.
- Give each chip a 48px high target (see [Targets](#targets)): extend the 32px chip with a transparent `::after` element, for example `relative after:absolute after:inset-x-0 after:-inset-y-2`. Put 16px between rows of chips (`gap-y-4`), so the targets do not overlap.

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
