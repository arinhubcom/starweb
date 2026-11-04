// Font families for `fonts` in astro.config.mjs. See Fonts and Icons in
// rules/MEDIA.md. `pnpm run fonts` checks these values with the providers.
import type { AstroUserConfig } from "astro";
import { fontProviders } from "astro/config";

// The Material Symbols font holds only these icons. Add a name here to use it
// in the MaterialIcon component. Names: https://fonts.google.com/icons
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
    fallbacks: ["sans-serif"],
    options: {
      experimental: {
        // No `glyphs` here: CMS content can hold any character.
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
    optimizedFallbacks: false,
    options: {
      experimental: {
        glyphs: [...ICON_NAMES],
      },
    },
  },
] satisfies NonNullable<AstroUserConfig<never, never, Providers>["fonts"]>;
