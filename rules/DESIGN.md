# DESIGN

## Scope

### [Base UI](https://base-ui.com/react/overview/quick-start)

- Use Tailwind CSS and Base UI for the site and the app: `.astro` pages and React islands.
- Follow the rules in [MATERIAL.md](MATERIAL.md) for layout, spacing, states, motion, color, and component sizes (Material Design 3).
- Follow the rules in [COMPONENTS.md](COMPONENTS.md) for Astro and React components (Fulldev UI, Base UI).
- Follow the rules in [UI-UX.md](UI-UX.md) for how the UI behaves: accessibility, states, forms, feedback, motion, navigation, and theme.

### [Kumo](https://github.com/cloudflare/kumo)

- Use Kumo for admin pages of native EmDash plugins. Follow the rules in [SAAS.md](SAAS.md) (App admin).
- Do not import Kumo in site or app code.

## Styling

### [Tailwind CSS](https://tailwindcss.com/docs)

- Use Tailwind CSS v4 for all styles in `.astro` components and React islands. Do not add a second styling system.
- Install it with `npx astro add tailwind`. It adds the `@tailwindcss/vite` plugin to `astro.config` and creates `src/styles/global.css` with `@import "tailwindcss";`.
- Import `src/styles/global.css` once, in the base layout.
- Define design tokens (colors, fonts, radius, spacing) as theme variables in an `@theme` block in `global.css`. Do not hardcode colors or sizes in components: use the token classes, for example `bg-primary`.
- Keep the dark variant that `shadcn init` writes to `global.css` (`@custom-variant dark (&:is(.dark *));`). Set the `.dark` class on `<html>` before the first paint, with the theme script in `<head>` of the base layout. Follow the rules in [UI-UX.md](UI-UX.md) (Theme).
- Merge classes with `cn()` from the [`cn`](https://github.com/shadcn-ui/cn) package. `shadcn init` installs it and re-exports it in `src/lib/utils.ts`. Do not join class strings by hand, and do not add `clsx` or `tailwind-merge`.
- Define component variants (size, color, state) with [`class-variance-authority`](https://cva.style) (`cva()`), as Fulldev UI and shadcn/ui do. Do not write variant logic with `if` statements in markup.
- Sort classes with [`prettier-plugin-tailwindcss`](https://github.com/tailwindlabs/prettier-plugin-tailwindcss).
- Use Astro scoped `<style>` only for CSS that Tailwind cannot express. Use `@apply` only in that case too.
