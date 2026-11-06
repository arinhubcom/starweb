import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { fieldKitPlugin } from "@emdash-cms/plugin-field-kit";
import { formsPlugin } from "@emdash-cms/plugin-forms";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import zodCompiler from "zod-compiler/vite";
import { fonts } from "./src/lib/fonts.ts";
import { directives, scriptDirective } from "./src/lib/security/csp.ts";
import { SITE } from "./src/lib/site.ts";

export default defineConfig({
  // The public origin. Build absolute URLs with `new URL(path, Astro.site)`.
  // Set it when more than one host answers (a custom domain and `*.workers.dev`),
  // so that auth and email links use the right host. `BETTER_AUTH_URL` is the
  // other option. EmDash needs its own site URL too: rules/SEO.md.
  site: SITE,
  // Do not set "ignore". After a change, check the prerendered pages on the
  // deployed Worker, because the host can ignore this option.
  trailingSlash: "never",
  output: "server",
  fonts,
  security: { csp: { scriptDirective, directives } },
  cache: { provider: cacheCloudflare() },
  vite: {
    plugins: [
      tailwindcss(),
      // Compiles Zod schemas at build time. Workers block `new Function()`, so
      // `z.compile()` falls back to the slow runtime parser without an error.
      zodCompiler(),
    ],
  },
  adapter: cloudflare(),
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  integrations: [
    // react() before emdash(): otherwise the admin UI hangs on "Loading EmDash...".
    react(),
    emdash({
      database: d1({ binding: "DB" }),
      storage: r2({ binding: "MEDIA" }),
      plugins: [fieldKitPlugin(), formsPlugin()],
    }),
  ],
  devToolbar: { enabled: false },
});
