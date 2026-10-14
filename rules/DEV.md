# DEV

## Local dev

### [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

- Run the dev server with `astro dev`. It runs the site in workerd, the Workers runtime, through the Cloudflare Vite plugin.
- Test the build before you deploy: run `astro build`, then `astro preview`. It runs the built Worker in workerd. Use `astro preview` instead of `wrangler dev`.
