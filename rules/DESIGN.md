# DESIGN

This file covers the UI libraries and the styling system of the site and the apps. Read it before you style a component or add a UI library.

## Choose the UI library

- Use [Tailwind CSS](STACK.md#tailwind-css) and [Base UI](STACK.md#base-ui) for the site and the app: `.astro` pages and React islands.
- For layout, spacing, states, motion, color, and sizes, see [MATERIAL](MATERIAL.md).
- For Astro and React components (Fulldev UI, Base UI), see [COMPONENTS](COMPONENTS.md).
- For accessibility, states, forms, feedback, motion, navigation, and theme, see [UI-UX](UI-UX.md).
- Use [Kumo](STACK.md#kumo) only for the admin pages of native EmDash plugins. See [SAAS](SAAS.md#add-an-app-admin-as-an-emdash-native-plugin).
- Never import Kumo in site or app code.

## Style with Tailwind CSS

- Use Tailwind v4 for all styles. Do not add a second styling system.
- Define tokens (colors, fonts, radius, spacing) as theme variables in `@theme` in `global.css`.
- Use token classes in components, such as `bg-primary`. Do not hardcode colors or sizes.
- Merge classes with `cn()` from `src/lib/utils.ts`.
- Do not join class strings by hand. Do not add `clsx` or `tailwind-merge`.
- Scoped `<style>` and `@apply` are for CSS that Tailwind cannot express.

## Write variants

- Write variants with [Tailwind Variants](STACK.md#tailwind-variants) `tv()`.
- Use `base`, `variants`, `defaultVariants`, and `compoundVariants`.
- Use `slots` for a component with several parts.
- Type the props with the `VariantProps` type of Tailwind Variants.
- Do not use `class-variance-authority` (`cva()`). Convert each `cva()` to `tv()`.
- Do not write `if` logic for variants in markup.
