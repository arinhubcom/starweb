# DEV

## Local dev

### [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

- Run the dev server with `astro dev`. It runs the site in workerd, the Workers runtime, through the Cloudflare Vite plugin.
- Test the build before you deploy: run `astro build`, then `astro preview`. It runs the built Worker in workerd. Use `astro preview` instead of `wrangler dev`.
- Test Cloudflare Images transformations in `astro dev` with a remote Images binding, because the local simulation supports only `width`, `height`, `rotate`, and `format`. Do not use `wrangler dev --remote` for the Astro site. Follow the rules in [MEDIA.md](MEDIA.md) (Cloudflare Images binding).
- Pass `--port <port>` to `astro dev` and `astro preview`, and check that the port is free. If the port is taken, the server silently starts on the next free port and `astro preview status` still shows the requested port. Read the real URL from the `Local` line of the output.
- Run `astro build` before `astro preview`, and keep `.wrangler/deploy/config.json`. The build writes it, and preview stops with `No build output found` without it.
- Expect `astro dev` and `astro preview` to share the local data in `.wrangler/state`. A new database gets its schema from the runtime migrations, and the admin redirects to the setup page until the setup is complete.
