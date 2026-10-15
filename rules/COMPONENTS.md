# COMPONENTS

## Astro components

### [Astro components](https://docs.astro.build/en/basics/astro-components/)

- Write UI as `.astro` components by default. Follow the rules in [ARCH.md](ARCH.md) for when to use an island.
- Type props with an `interface Props` in the frontmatter. For a component that wraps one HTML element, extend `HTMLAttributes<"tag">` from `astro/types`, for example `interface Props extends HTMLAttributes<"section"> { title: string }`.
- Use `Polymorphic` and `HTMLTag` from `astro/types` when a component can render as different tags (an `as` prop), as the Fulldev UI button does.
- Use `ComponentProps<typeof Component>` from `astro/types` to reuse the props of another component. Do not copy the type.
- Destructure `Astro.props` with defaults: `const { title, size = "default", class: className, ...rest } = Astro.props`.
- Merge the `class` prop with `cn()` and spread the rest on the root element: `<section class={cn("p-4", className)} {...rest}>`. Do not drop attributes such as `id`, `aria-*`, and `data-*`.
- Use `<slot />` for content and named slots (`<slot name="footer" />`) for regions. Put fallback content inside `<slot>` when a default makes sense.
- Use `Astro.slots.has("name")` to render a wrapper only when that slot has content: `{Astro.slots.has("footer") && <footer><slot name="footer" /></footer>}`.
- Keep components in `src/components/ui/` presentational: no database, API, or `Astro.locals` access. Load data in pages or block components, and pass it as props. Follow the rules in [DATA.md](DATA.md).
- Use semantic HTML: `<button>` for actions, `<a href>` for navigation, and headings in order. Do not put click handlers on `<div>`.
- Use `<Image />` from `astro:assets` for images, with an `alt` text. Follow the rules in [MEDIA.md](MEDIA.md). Render EmDash image fields with `Image` from `emdash/ui` (see [MEDIA.md](MEDIA.md) (EmDash media)).
- Use a `<script>` in the component for small interactions (toggle, copy, open a menu) instead of a React island. Astro bundles it and adds it once per page.
- Pass server values to the script in `data-*` attributes and read them with `element.dataset`. Do not use `define:vars` or `is:inline`: they turn off processing and bundling (`define:vars` implies `is:inline`). The one exception is the theme script (next rule).
- Add the theme script as the one allowed `is:inline` script: a blocking script in `<head>` of the base layout that sets the `.dark` class before the first paint (see [UI-UX.md](UI-UX.md) (Theme)). Keep its text in a constant in `src/lib/theme-script.ts` and render it with `<script is:inline set:html={themeScript} />`.
- Allow the theme script in the CSP. Astro does not add a hash for an `is:inline` script. Compute the SHA-256 hash of the `themeScript` text (`"sha256-" + createHash("sha256").update(themeScript).digest("base64")` from `node:crypto`) in the CSP module, and add it to `csp.scriptDirective.hashes` (see [SECURITY.md](SECURITY.md) (Headers)).
- Wrap the script logic in a custom element (`customElements.define`) when the component can appear more than once on a page. The browser runs `connectedCallback` for each element.
- Do not add a `client:*` directive to an `.astro` component. Astro components have no client runtime, and Astro throws an error.
- Keep the kebab-case file names that the shadcn CLI writes (`button.astro`). Import components with PascalCase names (`Button`).

### [Fulldev UI](https://ui.full.dev)

- Use Fulldev UI for `.astro` components and page blocks (sections, hero, features, pricing, FAQ). They are plain Astro components with no client JavaScript.
- Add the `@/*` path alias before init: `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }` in `compilerOptions` of `tsconfig.json`. Without it, `shadcn init` stops at "Validating import alias".
- Set it up once with `npx shadcn@<version> init https://ui.full.dev/r/styles/base-vega/base.json`, where `<version>` is `shadcn` in `devDependencies` of `template/package.json`. It writes `components.json` with the `@fulldev` registry, adds the theme tokens to `src/styles/global.css`, adds `cn()` in `src/lib/utils.ts`, and installs `shadcn` (for `shadcn/tailwind.css`), `cn`, `class-variance-authority`, and `tw-animate-css`.
- Add `class="@container"` to `<body>` in the base layout. Fulldev UI uses container query variants such as `@2xl:`.
- Install each component or block with the shadcn CLI, for example `npx shadcn add @fulldev/button`. It runs the `shadcn` version that init installed in the project. Do not use `@latest`. Do not copy the code by hand.
- Keep Fulldev UI and other `.astro` components in `src/components/ui/`, one folder per component (for example `ui/button/` with `button.astro`, `button-variants.ts`, and `index.ts`). Import them from the folder: `import { Button } from "@/components/ui/button"`. Edit them there: they are your code after install, not a package.
- Change the theme in the CSS variables that the init step adds. Do not hardcode colors in components.
- Install the agent skills: `npx skills add shadcn/ui` and `npx skills add fulldotdev/ui --skill fulldev-ui`.
- Use React islands with shadcn/ui and Base UI only when a part must be interactive and no Fulldev component fits.

## React components

### [React](https://react.dev/learn)

- Use React 19 function components. Do not write class components.
- Use `ref` as a normal prop. Do not use `forwardRef`: React 19 does not need it, and React plans to deprecate it.
- Render `<Context value={...}>` as the provider. Do not use `<Context.Provider>`.
- Type props with the props of the element or part that you wrap, for example `React.ComponentProps<"button">` or `ButtonPrimitive.Props`. Take `className`, merge it with `cn()`, and spread the rest on the root.
- Compute values from props and state during render. Do not copy them into state or sync them with `useEffect`.
- Put logic that a user action causes in the event handler. Use `useEffect` only to sync with an outside system, such as a browser API or a third-party widget.
- Reset the state of a component with a `key`, for example `<Profile key={userId} />`. Do not reset it in an effect.
- Do not fetch data in `useEffect`. Pass the data from Astro as props, or use TanStack Query (see [ARCH.md](ARCH.md)).
- Use stable IDs from the data as list keys. Do not use the array index when items can move or change.
- Use `useId()` for IDs that connect labels, inputs, and `aria-*` attributes. Do not hardcode IDs.

### [Astro islands](https://docs.astro.build/en/guides/framework-components/)

- Pass only serializable props to a hydrated island, for example strings, numbers, arrays, plain objects, `Date`, `Map`, and `Set`. Do not pass functions: they do not work on the client.
- Handle events inside the island. Do not pass event handlers from `.astro`.
- Expect children from `.astro` as static HTML. Astro converts slots to props (`children` and named slots). Do not put interactive state in them.
- Keep each island small. Render static content in `.astro` around it, and hydrate only the interactive part.
- Use `client:only="react"` only for a component that needs browser APIs during render. It shows nothing until JavaScript loads.
- Do not expect React context to work across islands. Share state through a store. Follow the rules in [ARCH.md](ARCH.md).
- Put islands that several pages or apps share in `src/components/islands/`. Put the islands of one app in its folder, `src/apps/<app>/islands/` (see [ARCH.md](ARCH.md) (Apps)). Keep reusable React UI parts in `src/components/ui/react/`.

### [shadcn/ui](https://ui.shadcn.com/docs)

- Use shadcn/ui components for React islands, such as dialog, dropdown menu, popover, tabs, and select. They are Base UI wrappers with Tailwind classes in the same theme as Fulldev UI. Do not use them for static UI: use Fulldev UI `.astro` components there.
- Start from the shadcn/ui component when one exists. Do not write a Base UI wrapper by hand.
- Keep `"style": "base-vega"` in `components.json`, as the Fulldev init writes it. The style cannot change after init. Do not install from a `radix-*` style: those components import `radix-ui`.
- Install React components with `--path`, for example `npx shadcn add dialog --path src/components/ui/react`. The default path is `src/components/ui/`, which is for `.astro` components. The CLI puts registry dependencies (for example `button.tsx` for `dialog`) in the same folder and rewrites their imports to `@/components/ui/react/...`.
- Install `@base-ui/react` and `lucide-react` yourself before the first React component: `npm i @base-ui/react lucide-react`. The Fulldev init and the `base-vega` registry items do not install them.
- Run `npx astro check` (needs `@astrojs/check`) after each install. Install each missing package that it reports.
- Check `package.json` after each install. Remove `radix-ui` or `@radix-ui/*` if the CLI added it, and install the component again from `base-vega`.
- Edit the installed components in `src/components/ui/react/`. They are your code after install, not a package.

### [Base UI](https://base-ui.com/react/handbook/styling)

- Use Base UI (`@base-ui/react`) for interactive components in React islands, such as dialogs, menus, popovers, tabs, and selects. Do not add Radix UI.
- Put React components for islands, such as Base UI wrappers, in `src/components/ui/react/`. Do not put `.tsx` files in `src/components/ui/`.
- Wrap each Base UI part in your own component in `src/components/ui/react/`, styled with Tailwind classes. Import the wrapper in islands, not the Base UI part.
- Compose all parts of one component (for example `Dialog`, `DialogTrigger`, `DialogContent`) in one `.tsx` island (in `src/components/islands/`, or in `src/apps/<app>/islands/` for an app), and use that island in `.astro` with a `client:*` directive. Do not use the parts directly in `.astro`: each one becomes a separate island without the shared context, and the render fails (Base UI error #79).
- Style component states with Base UI data attributes and Tailwind data variants, for example `data-checked:bg-primary` or `data-popup-open:opacity-100`.
- Use the `className` function only when a state has no data attribute: `className={(state) => cn(base, state.checked && checked)}`.
- Use the CSS variables that Base UI exposes (for example `--available-height` on a popup) in arbitrary values, for example `max-h-(--available-height)`.
- Use the `render` prop to put a Base UI part on your own element or component, for example `<Menu.Trigger render={<Button />} />`.
