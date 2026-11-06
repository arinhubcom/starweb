# COMPONENTS

## Astro components

### [Astro](STACK.md#astro) components

- `.astro` by default; islands → [ARCH](ARCH.md).
- Props: `interface Props` in frontmatter; wrapping one element → `extends HTMLAttributes<"section">` (`astro/types`).
- `Polymorphic`/`HTMLTag` (`astro/types`) for an `as` prop; `ComponentProps<typeof X>` to reuse props, never copy the type.
- `const { title, size = "default", class: className, ...rest } = Astro.props`; root: `<section class={cn("p-4", className)} {...rest}>`. Never drop `id`, `aria-*`, `data-*`.
- `<slot />`, named slots for regions, fallback content inside `<slot>`; `Astro.slots.has("footer")` to wrap conditionally.
- `src/components/ui/` is presentational: no database, API, or `Astro.locals`. Load data in pages or blocks, pass props. → [DATA](DATA.md)
- Semantic HTML: `<button>` actions, `<a href>` navigation, ordered headings. No click handlers on `<div>`.
- Images: `<Image />` from `astro:assets` with `alt`. EmDash image fields: `Image` from `emdash/ui`. → [MEDIA](MEDIA.md) (EmDash media)
- Small interactions (toggle, copy, menu): `<script>` in the component, not an island.
- Server values to script via `data-*` + `element.dataset`. No `define:vars`, no `is:inline` (disable bundling). Only exception: theme script.
- Component that can appear more than once with script → custom element (`customElements.define`, `connectedCallback`).
- No `client:*` on an `.astro` component (Astro throws).
- File names kebab-case as the shadcn CLI writes (`button.astro`); imports PascalCase (`Button`).
- Every component (Fulldev UI, [shadcn/ui](STACK.md#shadcnui), [Base UI](STACK.md#base-ui), and your own): styles in [Tailwind Variants](STACK.md#tailwind-variants) `tv()` that follow [MATERIAL](MATERIAL.md): sizes, targets, state layer, focus ring, disabled opacity, motion, and color roles. Apply it right after `shadcn add`, in the same commit. Reference: `src/components/ui/button/button-variants.ts`.

### [Fulldev UI](STACK.md#fulldev-ui)

- Source of `.astro` components and page blocks (sections, hero, features, pricing, FAQ); no client JS.
- Keep `paths` in `tsconfig.json`; `shadcn add` needs it.
- No second `shadcn init`.
- After each `shadcn add` (Fulldev or shadcn/ui): convert every `cva()` in the added files to `tv()`. `cva("<base>", { variants, defaultVariants })` → `tv({ base: "<base>", variants, defaultVariants })`; `import { tv, type VariantProps } from "tailwind-variants"`. Call sites stay. Registry items import `class-variance-authority` without listing it; `pnpm exec astro check` reports each file left. → [DESIGN](DESIGN.md)
- After each `shadcn add` (Fulldev or shadcn/ui): replace every `@lucide/astro` and `lucide-react` icon with `MaterialIcon` (→ [MEDIA](MEDIA.md) (Icons)), with `size-*` → `text-*`, and add the name to `ICON_NAMES`. Remove `@lucide/astro` and `lucide-react` from `package.json`.
- `@fulldev/icon` comes with blocks, headers, and footers. Delete `src/components/ui/icon/`, replace each use with `MaterialIcon` or a local SVG (brand mark), and remove `lucide-static` and `simple-icons` from `package.json`. Never move `MaterialIcon` to `src/components/ui/icon/`.
- Keep `"iconLibrary": "lucide"` in `components.json`; `shadcn` has no Material Symbols option.
- Add components with `pnpm exec shadcn add @fulldev/button` (uses the project's `shadcn`). No `@latest`, no hand copy.
- Your code after install; edit it in `src/components/ui/<name>/`.
- Theme via the CSS variables from init; no hardcoded colors.
- Skills: `pnpm dlx skills add shadcn/ui`, `pnpm dlx skills add fulldotdev/ui --skill fulldev-ui`.
- React islands (shadcn/ui, Base UI) only for interactive parts with no Fulldev component.

## React components

### [React](STACK.md#react)

- React 19 function components; no classes.
- No `forwardRef`; `ref` is a prop.
- `<Context value={...}>`, not `<Context.Provider>`.
- Props type from the wrapped element/part (`React.ComponentProps<"button">`, `ButtonPrimitive.Props`); take `className`, merge with `cn()`, spread rest on root.
- Derive during render; no state copy, no `useEffect` sync.
- User-action logic in event handlers; `useEffect` only for outside systems (browser API, third-party widget).
- Reset state with `key` (`<Profile key={userId} />`), not an effect.
- No data fetch in `useEffect` → props from Astro, or TanStack Query. → [ARCH](ARCH.md)
- List keys: stable data IDs, not index when items move or change.
- `useId()` for label/input/`aria-*` IDs.

### Astro islands

- Hydrated island props serializable only (string, number, array, plain object, `Date`, `Map`, `Set`); no functions.
- Handle events inside the island, not passed from `.astro`.
- Children from `.astro` are static HTML (slots become props); no interactive state in them.
- Small islands: static content in `.astro`, hydrate only the interactive part.
- `client:only="react"` only for components needing browser APIs at render.
- No React context across islands → store. → [ARCH](ARCH.md)
- Shared islands: `src/components/islands/`; one app: `src/apps/<app>/islands/` ([ARCH](ARCH.md) (Apps)); reusable React UI: `src/components/ui/react/`.

### [shadcn/ui](STACK.md#shadcnui)

- For React islands (dialog, dropdown menu, popover, tabs, select); Base UI wrappers in the Fulldev theme. Static UI → Fulldev `.astro`.
- Use the shadcn/ui component when it exists; no hand-written Base UI wrapper.
- Keep `"style": "base-vega"` in `components.json` (fixed after init). No `radix-*` style (imports `radix-ui`).
- Add with `--path`: `pnpm exec shadcn add dialog --path src/components/ui/react` (default path is for `.astro`). Registry dependencies land in the same folder with imports rewritten to `@/components/ui/react/...`.
- Before the first React component: add `@base-ui/react` (init and `base-vega` do not add it).
- After each `shadcn add`: `pnpm exec astro check`; add the reported missing packages, except Lucide → `MaterialIcon`.
- After each `shadcn add` check `package.json`; if `radix-ui` or `@radix-ui/*` was added, remove it and add the component again from `base-vega`.
- Edit in `src/components/ui/react/`.

### [Base UI](STACK.md#base-ui)

- `@base-ui/react` for interactive island components. No Radix UI.
- React wrappers in `src/components/ui/react/`, Tailwind-styled; islands import the wrapper. No `.tsx` in `src/components/ui/`.
- All parts of one component (`Dialog`, `DialogTrigger`, `DialogContent`) composed in one `.tsx` island (`src/components/islands/` or `src/apps/<app>/islands/`), used in `.astro` with `client:*`. Never parts directly in `.astro` (separate islands, no shared context, Base UI error #79).
- States: data attributes + Tailwind data variants (`data-checked:bg-primary`, `data-popup-open:opacity-100`).
- `className={(state) => cn(base, state.checked && checked)}` only when no data attribute exists.
- Exposed CSS variables in arbitrary values: `max-h-(--available-height)`.
- `render` prop for own element: `<Menu.Trigger render={<Button />} />`.
