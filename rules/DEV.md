# DEV

## Local dev

### [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

- Run the dev server with `astro dev`. It runs the site in workerd, the Workers runtime, through the Cloudflare Vite plugin.
- Test the build before you deploy: run `astro build`, then `astro preview`. It runs the built Worker in workerd. Use `astro preview` instead of `wrangler dev`.
- Test Cloudflare Images transformations in `astro dev` with a remote Images binding, because the local simulation supports only `width`, `height`, `rotate`, and `format`. Do not use `wrangler dev --remote` for the Astro site. Follow the rules in [MEDIA.md](MEDIA.md) (Cloudflare Images binding).
