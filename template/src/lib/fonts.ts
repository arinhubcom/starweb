// Font families for `fonts` in astro.config.mjs. See Change or add a font and Add an icon in
// rules/MEDIA.md. `pnpm run fonts` checks these values with the providers.
import type { AstroUserConfig } from "astro";
import { fontProviders } from "astro/config";

// The Material Symbols font holds only these icons. Add a name here to use it
// in the MaterialIcon component. Names: https://fonts.google.com/icons
// Never leave the list empty: the provider then serves the whole font.
export const ICON_NAMES = ["search"] as const;

export type IconName = (typeof ICON_NAMES)[number];

type Providers = [
  ReturnType<typeof fontProviders.google>,
  ReturnType<typeof fontProviders.googleicons>,
];

export const fonts = [
  {
    name: "Roboto Flex",
    cssVariable: "--font-roboto-flex",
    provider: fontProviders.google(),
    weights: ["400 700"],
    styles: ["normal"],
    subsets: ["latin", "latin-ext"],
    // Use a generic family. Keep `display: "swap"` (the default) and
    // `optimizedFallbacks: true` (the default) for a text font.
    fallbacks: ["sans-serif"],
    options: {
      experimental: {
        // No `glyphs` here: CMS content can hold any character. Use `glyphs` only
        // on fixed text or icons.
        // `variableAxis` sets axes other than `wght` and `ital`. `opsz` needs no
        // `font-variation-settings`: `font-optical-sizing: auto` sets it.
        variableAxis: { opsz: [["8", "144"]] },
      },
    },
  },
  {
    name: "Material Symbols Outlined",
    cssVariable: "--font-material-symbols",
    provider: fontProviders.googleicons(),
    weights: ["100 700"],
    styles: ["normal"],
    // A fallback font shows the icon name as text, so wait for the icon font.
    display: "block",
    fallbacks: [],
    // Only the icon font sets this to false. A text font keeps the default
    // `true`.
    optimizedFallbacks: false,
    options: {
      experimental: {
        glyphs: [...ICON_NAMES],
      },
    },
  },
] satisfies NonNullable<AstroUserConfig<never, never, Providers>["fonts"]>;
