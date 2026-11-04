import cloudflare from "@astrojs/cloudflare";
import { cacheCloudflare } from "@astrojs/cloudflare/cache";
import react from "@astrojs/react";
import { d1, r2 } from "@emdash-cms/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import zodCompiler from "zod-compiler/vite";
import { fonts } from "./src/lib/fonts.ts";
import { directives, scriptDirective } from "./src/lib/security/csp.ts";
import { SITE } from "./src/lib/site.ts";

export default defineConfig({
  site: SITE,
  trailingSlash: "never",
  output: "server",
  fonts,
  security: { csp: { scriptDirective, directives } },
  cache: { provider: cacheCloudflare() },
  vite: { plugins: [tailwindcss(), zodCompiler()] },
  adapter: cloudflare(),
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: "DB" }),
      storage: r2({ binding: "MEDIA" }),
    }),
  ],
  devToolbar: { enabled: false },
});
