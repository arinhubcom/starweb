# DEV

## Local dev

### [Astro](STACK.md#astro) Cloudflare adapter

- Dev: `astro dev` (workerd via Cloudflare Vite plugin).
- Pre-deploy: `astro build` then `astro preview` (built Worker in workerd). `astro preview`, not `wrangler dev`.
- Images transformations: `astro dev` with a remote Images binding (local simulation supports only `width`, `height`, `rotate`, `format`). No `wrangler dev --remote` for the site. → [MEDIA](MEDIA.md) (Cloudflare Images binding)
- `--port <port>` for `astro dev` and `astro preview`; check the port is free (else it silently takes the next one and `astro preview status` shows the requested port). Real URL: `Local` line of the output.
- From an agent or script: `npm run preview -- --port <port> --background` (also self-backgrounds when it detects an agent). URL and PID: `.astro/preview.json` (`url`, `pid`) or `Local` line in `.astro/preview.log`. Stop: `npx astro preview stop` or the PID; never `pkill -f`.
- `astro build` before `astro preview`; keep `.wrangler/deploy/config.json` (build writes it; else `No build output found`).
- `astro dev` and `astro preview` share local data in `.wrangler/state`. A new database gets its schema from runtime migrations; admin redirects to setup until complete.
