# COMPONENTS

This file covers how to write and add UI components: Astro components, Fulldev UI blocks, React islands, shadcn/ui, and Base UI. Read it before you add or change a component.

## Write an Astro component

- Use `.astro` by default. For islands, see [ARCH](ARCH.md).
- Declare props with `interface Props` in the frontmatter.
- If the component wraps one element, extend its attributes: `extends HTMLAttributes<"section">` from `astro/types`.
- For an `as` prop, use `Polymorphic` or `HTMLTag` from `astro/types`.
- To reuse the props of another component, use `ComponentProps<typeof X>`. Never copy the type.
- Destructure the props: `const { title, size = "default", class: className, ...rest } = Astro.props`.
- On the root element, merge the class and spread the rest: `<section class={cn("p-4", className)} {...rest}>`.
- Never drop `id`, `aria-*`, or `data-*`.
- Use `<slot />` for content and named slots for regions. Put fallback content inside `<slot>`.
- To wrap a slot only when it has content, use `Astro.slots.has("footer")`.
- Keep `src/components/ui/` presentational: no database, API, or `Astro.locals`.
- Load data in pages or blocks and pass it as props. See [DATA](DATA.md).
- Use semantic HTML: `<button>` for actions, `<a href>` for navigation, and ordered headings.
- Do not put click handlers on a `<div>`.
- Use `<Image />` from `astro:assets` with `alt`.
- For EmDash image fields, use `Image` from `emdash/ui`. See [MEDIA](MEDIA.md#use-the-emdash-media-library).
- Do not add `client:*` to an `.astro` component. Astro throws an error.
- Name files in kebab-case, as the shadcn CLI writes them (`button.astro`). Import them in PascalCase (`Button`).

### Add a script to a component

- For a small interaction such as a toggle, copy, or menu, put a `<script>` in the component. Do not use an island.
- Pass server values to the script with `data-*` and `element.dataset`.
- Do not use `define:vars` or `is:inline`, because they disable bundling. The theme script is the only exception.
- If a component with a script can appear more than once, use a custom element: `customElements.define` and `connectedCallback`.

### Style a component

- Style every component with [Tailwind Variants](STACK.md#tailwind-variants) `tv()`. This covers Fulldev UI, [shadcn/ui](STACK.md#shadcnui), [Base UI](STACK.md#base-ui), and your own components.
- Follow [MATERIAL](MATERIAL.md) for sizes, targets, state layer, focus ring, disabled opacity, motion, and color roles.
- Apply the styles right after `shadcn add`, in the same commit.
- Use `src/components/ui/button/button-variants.ts` as the reference.

## Add a component with Fulldev UI

- Use [Fulldev UI](STACK.md#fulldev-ui) as the source of `.astro` components and page blocks: sections, hero, features, pricing, and FAQ. They have no client JavaScript.
- Add a component with `pnpm exec shadcn add @fulldev/button`. This uses the `shadcn` of the project.
- Do not use `@latest`. Do not copy a component by hand.
- Do not run `shadcn init` a second time.
- After install, the code is yours. Edit it in `src/components/ui/<name>/`.
- Theme the component with the CSS variables from init. Do not hardcode colors.
- Add the skills with `pnpm dlx skills add shadcn/ui` and `pnpm dlx skills add fulldotdev/ui --skill fulldev-ui`.
- Use a React island (shadcn/ui, Base UI) only for interactive parts that have no Fulldev UI component.

## Clean up after `shadcn add`

These steps apply to each `shadcn add`, for Fulldev UI and for shadcn/ui.

### Convert `cva()` to `tv()`

- Convert every `cva()` in the added files to `tv()`. See [DESIGN](DESIGN.md).
- Write `cva("<base>", { variants, defaultVariants })` as `tv({ base: "<base>", variants, defaultVariants })`.
- Import with `import { tv, type VariantProps } from "tailwind-variants"`.
- Leave the call sites as they are.
- Registry items import `class-variance-authority` without listing it. `pnpm exec astro check` reports each file you left.

### Replace Lucide icons

- Replace every `@lucide/astro` and `lucide-react` icon with `MaterialIcon`. See [MEDIA](MEDIA.md#add-an-icon).
- Change `size-*` to `text-*` on the icon.
- Add the icon name to `ICON_NAMES`.
- Remove `@lucide/astro` and `lucide-react` from `package.json`.
- If `@fulldev/icon` comes with blocks, headers, or footers, delete `src/components/ui/icon/`.
- Replace each use of it with `MaterialIcon`, or with a local SVG for a brand mark.
- Remove `lucide-static` and `simple-icons` from `package.json`.
- Never move `MaterialIcon` to `src/components/ui/icon/`.
- Keep `"iconLibrary": "lucide"` in `components.json`. The shadcn CLI has no Material Symbols option.

## Write a React component

- Write React 19 function components. Do not write classes. See [React](STACK.md#react).
- Do not use `forwardRef`. `ref` is a prop.
- Write `<Context value={...}>`, not `<Context.Provider>`.
- Take the props type from the wrapped element or part: `React.ComponentProps<"button">` or `ButtonPrimitive.Props`.
- Take `className`, merge it with `cn()`, and spread the rest on the root.
- Derive values during render. Do not copy state and do not sync it with `useEffect`.
- Put user-action logic in event handlers.
- Use `useEffect` only for outside systems, such as a browser API or a third-party widget.
- Reset state with `key`, as in `<Profile key={userId} />`, not with an effect.
- Do not fetch data in `useEffect`. Pass props from Astro, or use TanStack Query. See [ARCH](ARCH.md).
- Use stable data IDs as list keys. Do not use the index when items move or change.
- Use `useId()` for the IDs of labels, inputs, and `aria-*` attributes.

## Hydrate a React island

- Pass only serializable props to a hydrated island: string, number, array, plain object, `Date`, `Map`, `Set`. No functions.
- Handle events inside the island. Do not pass them from `.astro`.
- Children from `.astro` are static HTML, because slots become props. Do not put interactive state in them.
- For a small island, keep the static content in `.astro` and hydrate only the interactive part.
- Use `client:only="react"` only for components that need browser APIs at render.
- Do not share React context across islands. Use a store. See [ARCH](ARCH.md).
- Put shared islands in `src/components/islands/`.
- Put the islands of one app in `src/apps/<app>/islands/`. See [ARCH](ARCH.md#add-a-micro-frontend-as-an-astro-integration).
- Put reusable React UI in `src/components/ui/react/`.

## Add a React component with shadcn/ui

- Use shadcn/ui for React islands such as dialog, dropdown menu, popover, tabs, and select. These are Base UI wrappers in the Fulldev UI theme.
- For static UI, use a Fulldev UI `.astro` component.
- Use the shadcn/ui component when it exists. Do not write a Base UI wrapper by hand.
- Keep `"style": "base-vega"` in `components.json`. It cannot change after init.
- Do not use a `radix-*` style, because it imports `radix-ui`.
- Add a component with `--path`: `pnpm exec shadcn add dialog --path src/components/ui/react`. The default path is for `.astro`.
- Registry dependencies land in the same folder, with imports rewritten to `@/components/ui/react/...`.
- Edit the component in `src/components/ui/react/`.
- Before the first React component, add `@base-ui/react`. Init and `base-vega` do not add it.
- After each add, run `pnpm exec astro check`.
- Add the packages it reports as missing, except Lucide packages. Use `MaterialIcon` instead.
- After each add, check `package.json`. If `radix-ui` or `@radix-ui/*` was added, remove it and add the component again from `base-vega`.

## Compose a component with Base UI

- Use `@base-ui/react` for interactive island components. Do not use Radix UI.
- Put React wrappers in `src/components/ui/react/`, styled with Tailwind. Islands import the wrapper.
- Do not put `.tsx` files in `src/components/ui/`.
- Compose all parts of one component (`Dialog`, `DialogTrigger`, `DialogContent`) in one `.tsx` island. Use `src/components/islands/` or `src/apps/<app>/islands/`.
- Use that island in `.astro` with `client:*`.
- Never use the parts directly in `.astro`. They become separate islands with no shared context, and Base UI reports error #79.
- Style states with data attributes and Tailwind data variants: `data-checked:bg-primary`, `data-popup-open:opacity-100`.
- Use `className={(state) => cn(base, state.checked && checked)}` only when no data attribute exists.
- Use exposed CSS variables in arbitrary values: `max-h-(--available-height)`.
- To render your own element, use the `render` prop: `<Menu.Trigger render={<Button />} />`.
