# DESIGN

## Scope

### Where each UI system applies

- Use Tailwind CSS and Base UI for the site and the app: `.astro` pages and React islands.
- Use [Kumo](https://github.com/cloudflare/kumo) for admin pages of native EmDash plugins. Follow the rules in [SAAS.md](SAAS.md) (App admin).
- Do not import Kumo in site or app code.

## Styling

### [Tailwind CSS](https://tailwindcss.com/docs)

- Use Tailwind CSS v4 for all styles in `.astro` components and React islands. Do not add a second styling system.
- Install it with `npx astro add tailwind`. It adds the `@tailwindcss/vite` plugin to `astro.config` and creates `src/styles/global.css` with `@import "tailwindcss";`.
- Import `src/styles/global.css` once, in the base layout.
- Define design tokens (colors, fonts, radius, spacing) as theme variables in an `@theme` block in `global.css`. Do not hardcode colors or sizes in components: use the token classes, for example `bg-primary`.
- Turn on class-based dark mode with `@custom-variant dark (&:where(.dark, .dark *));`. Set the `.dark` class on `<html>` before the first paint.
- Merge classes with a `cn()` helper ([`clsx`](https://github.com/lukeed/clsx) and [`tailwind-merge`](https://github.com/dcastil/tailwind-merge)) in `src/lib/utils.ts`. Do not join class strings by hand.
- Define component variants (size, color, state) with [`class-variance-authority`](https://cva.style) (`cva()`), as Fulldev UI and shadcn/ui do. Do not write variant logic with `if` statements in markup.
- Sort classes with [`prettier-plugin-tailwindcss`](https://github.com/tailwindlabs/prettier-plugin-tailwindcss).
- Use Astro scoped `<style>` only for CSS that Tailwind cannot express. Use `@apply` only in that case too.

## Components

### [Fulldev UI](https://ui.full.dev)

- Use Fulldev UI for `.astro` components and page blocks (sections, hero, features, pricing, FAQ). They are plain Astro components with no client JavaScript.
- Set it up once with `npx shadcn@latest init https://ui.full.dev/r/styles/base-vega/base.json`. It writes `components.json` with the `@fulldev` registry, adds the theme tokens to the global stylesheet, and adds `cn()` in `src/lib/utils.ts`.
- Add `class="@container"` to `<body>` in the base layout. Fulldev UI uses container query variants such as `@2xl:`.
- Install each component or block with the shadcn CLI, for example `npx shadcn@latest add @fulldev/button`. Do not copy the code by hand.
- Keep Fulldev UI and other `.astro` components in `src/components/ui/`. Edit them there: they are your code after install, not a package.
- Change the theme in the CSS variables that the init step adds. Do not hardcode colors in components.
- Install the agent skills: `npx skills add shadcn/ui` and `npx skills add fulldotdev/ui --skill fulldev-ui`.
- Use React islands with Base UI only when a part must be interactive and no Fulldev component fits.


### [Base UI](https://base-ui.com/react/handbook/styling)

- Use Base UI (`@base-ui/react`) for interactive components in React islands, such as dialogs, menus, popovers, tabs, and selects. Do not add Radix UI.
- Put React components for islands, such as Base UI wrappers, in `src/components/ui/react/`. Do not put `.tsx` files in `src/components/ui/`.
- Install React components from a shadcn registry with `--path`, for example `npx shadcn@latest add dialog --path src/components/ui/react`. The default path is `src/components/ui/`, which is for `.astro` components.
- Check the imports of each React component after install. The shadcn CLI writes imports of other registry components with the `ui` alias from `components.json` (`@/components/ui/...`), not with `--path`. Change them to `@/components/ui/react/...`, and install the imported component with `--path` too.
- Wrap each Base UI part in your own component in `src/components/ui/react/`, styled with Tailwind classes. Import the wrapper in islands, not the Base UI part.
- Style component states with Base UI data attributes and Tailwind data variants, for example `data-checked:bg-primary` or `data-popup-open:opacity-100`.
- Use the `className` function only when a state has no data attribute: `className={(state) => cn(base, state.checked && checked)}`.
- Use the CSS variables that Base UI exposes (for example `--available-height` on a popup) in arbitrary values, for example `max-h-(--available-height)`.
- Use the `render` prop to put a Base UI part on your own element or component, for example `<Menu.Trigger render={<Button />} />`.
