# DESIGN

## Scope

### [Base UI](STACK.md#base-ui)

- Tailwind CSS + Base UI for site and app (`.astro` pages, React islands).
- Layout, spacing, states, motion, color, sizes → [MATERIAL](MATERIAL.md).
- Astro and React components (Fulldev UI, Base UI) → [COMPONENTS](COMPONENTS.md).
- Accessibility, states, forms, feedback, motion, navigation, theme → [UI-UX](UI-UX.md).

### [Kumo](STACK.md#kumo)

- Only for admin pages of native EmDash plugins. → [SAAS](SAAS.md) (App admin)
- Never import Kumo in site or app code.

## Styling

### [Tailwind CSS](STACK.md#tailwind-css)

- Tailwind v4 for all styles; no second styling system.
- Install: `npx astro add tailwind` (adds `@tailwindcss/vite`, creates `src/styles/global.css` with `@import "tailwindcss";`). Import `global.css` once, in the base layout.
- Tokens (colors, fonts, radius, spacing) as theme variables in `@theme` in `global.css`; components use token classes (`bg-primary`), no hardcoded colors or sizes.
- Keep `@custom-variant dark (&:is(.dark *));` from `shadcn init`; `.dark` on `<html>` via the theme script in `<head>` of the base layout. → [UI-UX](UI-UX.md) (Theme)
- Merge classes with `cn()` from the [`cn`](https://github.com/shadcn-ui/cn) package (re-exported in `src/lib/utils.ts` by `shadcn init`). No manual string joins, no `clsx`/`tailwind-merge`.
- Variants with [Tailwind Variants](STACK.md#tailwind-variants) `tv()` (`base`, `variants`, `defaultVariants`, `compoundVariants`, `slots` for multi-part components), types with its `VariantProps`. No `class-variance-authority` (`cva()`) → convert to `tv()`. No `if` variant logic in markup.
- Sort classes with `prettier-plugin-tailwindcss`.
- Scoped `<style>` and `@apply` only for CSS Tailwind cannot express.
