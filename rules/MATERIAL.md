# MATERIAL

[Material Design 3](STACK.md#material-design-3) (MD3) Expressive: layout, spacing, states, motion, color, component sizes. Radius stays from the [Fulldev UI](STACK.md#fulldev-ui) theme; fonts and icons per [MEDIA](MEDIA.md); colors per Color.

## Sources

- Expressive value wins over baseline (navigation bar 64px, not 80px).
- Expressive specs: androidx Compose [`material3/tokens`](https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens) (`NavigationRailCollapsedTokens.kt`); changes per component: "M3 Expressive styles" in [MDC-Android docs](https://github.com/material-components/material-components-android/tree/master/docs/components); web (`linear()` springs): material-web [`labs/gb`](https://github.com/material-components/material-web/tree/main/labs/gb).
- Not `tokens/versions/latest` of material-web (baseline) except unchanged values (state layer opacities). Not Flutter ([flutter#168813](https://github.com/flutter/flutter/issues/168813)).
- m3.material.io is a JS app: read in a browser (`agent-browser`), fetch returns nothing.

## Layout

- 1dp = 1 CSS px. Tailwind step (`--spacing: 0.25rem`) = 4px.
- `@theme` in `global.css`: `--breakpoint-medium: 37.5rem;` (600) `--breakpoint-expanded: 52.5rem;` (840) `--breakpoint-large: 75rem;` (1200) `--breakpoint-xlarge: 100rem;` (1600). < 600 compact, no prefix. Page layout uses `medium:` `expanded:` `large:` `xlarge:`; keep default `sm:` `md:` (Fulldev UI uses them).
- Page margin `px-4 medium:px-6`. Pane gap `gap-6`.
- Panes: 1 on compact/medium, 2 on expanded/large, ≤ 3 on xlarge. Medium 2 panes only for low-density content (settings), `grid-cols-2`.
- Fixed pane: expanded `w-90` (360px), large/xlarge `large:w-103` (412px); the other fills.
- Navigation: bottom bar on compact; rail at leading edge from medium; expanded rail (labels) only large/xlarge.
- Body text 40-60 characters: `max-w-[60ch]`. Align leading elements (thumbnails, avatars, icons) on one line.

## Spacing

- MD3 tokens only (8px scale, `space100` = 8px):

  | MD3 token | px | Tailwind |
  |---|---|---|
  | space0, 25, 50, 75 | 0, 2, 4, 6 | `0`, `0.5`, `1`, `1.5` |
  | space100, 125, 150, 175 | 8, 10, 12, 14 | `2`, `2.5`, `3`, `3.5` |
  | space200, 250, 300 | 16, 20, 24 | `4`, `5`, `6` |
  | space400, 450, 500 | 32, 36, 40 | `8`, `9`, `10` |
  | space600, 700, 800, 900 | 48, 56, 64, 72 | `12`, `14`, `16`, `18` |

- Default multiples of 8px (even steps); 2, 4, 6, 10, 12, 14px only inside components (icon-label).
- No other steps, no arbitrary values (`p-[13px]`). New value → `--spacing-*` token by multiplier pattern (`space225` = 18px).
- Padding and gap on the parent (`p-*`, `gap-*` with flex/grid); no child margins (`mt-*`, `space-y-*`) except outside parent padding or page layout.
- Logical sides (`ps-*`, `pe-*`, `ms-*`, `me-*`). ≥ 8px between interactive targets. Spacing unchanged at 200% text scale.

## Targets

- Touch target ≥ 48x48px (`min-h-12 min-w-12`) even if the visible control is smaller; extend with padding or transparent `::after`.
- Density 0 default. Denser variants opt-in via user setting only; each step (-1, -2, -3) removes 4px height or vertical padding. No dense targets < 48px by default; no density in menus, dialogs, snackbars. Font size constant across densities.

## States

- State layer: overlay in content color (`currentColor`) over the container; never change the container color. Opacities: hover 8%, focus 10%, pressed 10%, dragged 16%.
- Via `::before`: `relative before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-current before:opacity-0 hover:before:opacity-8 focus-visible:before:opacity-10 active:before:opacity-10`.
- Add once in the `tv()` `base` of every component (→ [COMPONENTS](COMPONENTS.md)); on an installed component remove its own hover color (`hover:bg-primary/90`).
- Disabled 38%: `disabled:opacity-38` (Base UI `data-disabled:opacity-38`); replace [shadcn/ui](STACK.md#shadcnui) `disabled:opacity-50`; no state layer.
- Focus ring 3px, offset 2px: `focus-visible:outline-3 focus-visible:outline-offset-2 outline-ring` (theme color).

## Motion

- `@theme` in `global.css`:

  ```css
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --ease-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
  --ease-spring-fast-spatial: linear(0, 0.099, 0.317, 0.561, 0.775, 0.934, 1.034, 1.083, 1.095, 1.084, 1.063, 1.04, 1.02, 1.005, 0.996, 0.992, 0.991, 0.992, 0.994, 0.996, 1);
  ```

- `duration-*` only: 50, 100, 150, 200 (short); 250, 300, 350, 400 (medium); 450, 500, 550, 600 (long); 700, 800, 900, 1000 (extra long) ms.
- Enter `ease-emphasized-decelerate`; exit `ease-emphasized-accelerate`.
- Small-component `transform` (switch handle): `ease-spring-fast-spatial duration-350`; full-screen transitions use longer durations.
- Opacity and color: `ease-standard`, never the spring (overshoots).
- Reduced motion → [UI-UX](UI-UX.md#motion).

## Color

- Generate from one seed with [material-color-utilities](https://github.com/material-foundation/material-color-utilities) (`@material/material-color-utilities`); no hand-picked theme colors.
- `new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)), isDark, 0, "2025")` (Expressive, standard contrast): `false` → `:root`, `true` → `.dark`.
- `SchemeFidelity` only when the exact brand color must show (seed in `primaryContainer`; 2021 spec only). No `SchemeExpressive` (shifts hues).
- Build time: `scripts/theme.ts` (in the template, with the `SEED` constant), run `pnpm exec tsx scripts/theme.ts`; the template pins `@material/material-color-utilities` and `tsx`. No plain `node` (0.4.0 imports without `.js`).
- Roles as hex: `hexFromArgb(scheme.surfaceContainerHigh)`.
- Output `src/styles/theme.css`, imported in `global.css`; never hand-edit, change the seed and rerun.
- `global.css` has no color variables in `:root` and `.dark`, only `--radius`, shadows, fonts, `--chart-1`..`--chart-5` from Fulldev UI. A registry item adds some → remove them.
- Role map:

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

- Roles without a shadcn/ui variable: kebab-case variables exposed in `@theme inline` in `theme.css` (`--surface-container-high` + `--color-surface-container-high: var(--surface-container-high);`): `primaryContainer`, `onPrimaryContainer`, `tertiary`, `onTertiary`, `tertiaryContainer`, `onTertiaryContainer`, `onError`, `errorContainer`, `onErrorContainer`, `surfaceContainerLowest`..`surfaceContainerHighest`, `inverseSurface`, `inverseOnSurface`, `inversePrimary`, `outline`, `outlineVariant`, `scrim`.
- Use as MD3 does: dialog `bg-surface-container-high`; highlight `bg-primary-container text-on-primary-container`; destructive button `bg-destructive text-on-error`.

## Components

### Buttons

- `size` variants of Fulldev UI and [Base UI](STACK.md#base-ui) buttons (→ [DESIGN](DESIGN.md)): `xs`, `default` and `sm`, `md`, `lg`, `xl` in `src/components/ui/button/button-variants.ts` (in the template); same values in `src/components/ui/react/button.tsx` after install:

  | Size | Height | Side padding | Icon | Gap | Tailwind |
  |---|---|---|---|---|---|
  | XS | 32 | 16 | 20 | 8 | `h-8 px-4 gap-2 [&_svg]:size-5` |
  | S (default) | 40 | 16 | 20 | 8 | `h-10 px-4 gap-2 [&_svg]:size-5` |
  | M | 56 | 24 | 24 | 8 | `h-14 px-6 gap-2 [&_svg]:size-6` |
  | L | 96 | 48 | 32 | 12 | `h-24 px-12 gap-3 [&_svg]:size-8` |
  | XL | 136 | 64 | 40 | 16 | `h-34 px-16 gap-4 [&_svg]:size-10` |

- XS and S buttons and icon buttons: 48x48px target (Targets).

### Icon buttons

| Size | Container | Icon | Tailwind |
|---|---|---|---|
| XS | 32 | 20 | `size-8 [&_svg]:size-5` |
| S (default) | 40 | 24 | `size-10 [&_svg]:size-6` |
| M | 56 | 24 | `size-14 [&_svg]:size-6` |
| L | 96 | 32 | `size-24 [&_svg]:size-8` |
| XL | 136 | 40 | `size-34 [&_svg]:size-10` |

### Text fields

- `h-14 px-4`, icons `size-6`, icon-input gap `gap-4`. Supporting text 4px below, 16px sides: `pt-1 px-4`.

### Lists

- Item height 1 line `min-h-14` (56), 2 lines `min-h-18` (72), 3 lines `min-h-22` (88). `px-4 py-2.5 gap-3`.
- Leading: icon `size-5` (20), avatar `size-10` (40), image `size-14` (56).

### Menus

- Menu `min-w-28` (112), `py-2`. Item `min-h-12 px-4 py-2 gap-3`, icons `size-5`. Not 44px (Expressive segmented item, below the 48px target).

### Chips

- `h-8 px-4`; leading icon `ps-2`; icon `size-4.5` (18); gap 8px (`gap-2`) icon-label and between chips.
- 48px target: `relative after:absolute after:inset-x-0 after:-inset-y-2`; rows `gap-y-4`.

### Dialogs

- Width 280-560px, ≥ 24px from edges: `min-w-70 max-w-[min(560px,calc(100%-3rem))]`. `p-6`, icons `size-6`.

### Selection controls

- Checkbox `size-4.5` (18), radio `size-5` (20), switch track `w-13 h-8` (52x32). State layer `size-10` (40) with a 48x48px target.

### Navigation bar

- Bottom bar `h-16` (64, Expressive). Active indicator `w-14 h-8` (56x32), icons `size-6`, icon-label gap `gap-1`.

### Navigation rail

- Collapsed `w-24` (96, Expressive); item `h-16` (64) with indicator `w-14 h-8` (56x32). 44px above first item (`pt-11`); 40px between header (FAB) and items (`mb-10`).
- Expanded `min-w-55 max-w-90` (220-360).
- No navigation drawer (deprecated in Expressive) → expanded rail.
