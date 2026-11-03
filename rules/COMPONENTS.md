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
- Theme script: blocking `<script is:inline set:html={themeScript} />` in `<head>` of the base layout, sets `.dark` before first paint; text is a constant in `src/lib/theme-script.ts`. → [UI-UX](UI-UX.md) (Theme)
- CSP for theme script: Astro adds no hash for `is:inline`. In the CSP module compute `"sha256-" + createHash("sha256").update(themeScript).digest("base64")` (`node:crypto`), add to `csp.scriptDirective.hashes`. → [SECURITY](SECURITY.md) (Headers)
- Component that can appear more than once with script → custom element (`customElements.define`, `connectedCallback`).
- No `client:*` on an `.astro` component (Astro throws).
- File names kebab-case as the shadcn CLI writes (`button.astro`); imports PascalCase (`Button`).

### [Fulldev UI](STACK.md#fulldev-ui)

- Source of `.astro` components and page blocks (sections, hero, features, pricing, FAQ); no client JS.
- Before init add the alias to `tsconfig.json` `compilerOptions`: `"baseUrl": "."`, `"paths": { "@/*": ["./src/*"] }`; else `shadcn init` stops at "Validating import alias".
- Init once: `npx shadcn@<version> init https://ui.full.dev/r/styles/base-vega/base.json`; `<version>` = `shadcn` in `devDependencies` of `template/package.json`. Writes `components.json` (`@fulldev` registry), theme tokens in `src/styles/global.css`, `cn()` in `src/lib/utils.ts`; installs `shadcn`, `cn`, `class-variance-authority`, `tw-animate-css`.
- Right after init: `npm i tailwind-variants && npm rm class-variance-authority`.
- After each `shadcn add` (Fulldev or shadcn/ui): convert every `cva()` in the added files to `tv()`. `cva("<base>", { variants, defaultVariants })` → `tv({ base: "<base>", variants, defaultVariants })`; `import { tv, type VariantProps } from "tailwind-variants"`. Call sites stay. Registry items import `class-variance-authority` without listing it; `npx astro check` reports each file left. → [DESIGN](DESIGN.md)
- `class="@container"` on `<body>` in the base layout (container query variants such as `@2xl:`).
- Install with `npx shadcn add @fulldev/button` (uses the project's `shadcn`). No `@latest`, no hand copy.
- Location: `src/components/ui/<name>/` (`button.astro`, `button-variants.ts`, `index.ts`); `import { Button } from "@/components/ui/button"`. Your code after install; edit there.
- Theme via the CSS variables from init; no hardcoded colors.
- Skills: `npx skills add shadcn/ui`, `npx skills add fulldotdev/ui --skill fulldev-ui`.
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
- Install with `--path`: `npx shadcn add dialog --path src/components/ui/react` (default path is for `.astro`). Registry dependencies land in the same folder with imports rewritten to `@/components/ui/react/...`.
- Before the first React component: `npm i @base-ui/react lucide-react` (not installed by init or `base-vega`).
- After each install: `npx astro check` (needs `@astrojs/check`); install reported missing packages.
- After each install check `package.json`; if `radix-ui` or `@radix-ui/*` was added, remove it and reinstall from `base-vega`.
- Edit in `src/components/ui/react/`.

### [Base UI](STACK.md#base-ui)

- `@base-ui/react` for interactive island components. No Radix UI.
- React wrappers in `src/components/ui/react/`, Tailwind-styled; islands import the wrapper. No `.tsx` in `src/components/ui/`.
- All parts of one component (`Dialog`, `DialogTrigger`, `DialogContent`) composed in one `.tsx` island (`src/components/islands/` or `src/apps/<app>/islands/`), used in `.astro` with `client:*`. Never parts directly in `.astro` (separate islands, no shared context, Base UI error #79).
- States: data attributes + Tailwind data variants (`data-checked:bg-primary`, `data-popup-open:opacity-100`).
- `className={(state) => cn(base, state.checked && checked)}` only when no data attribute exists.
- Exposed CSS variables in arbitrary values: `max-h-(--available-height)`.
- `render` prop for own element: `<Menu.Trigger render={<Button />} />`.
