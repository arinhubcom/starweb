# DEV

This file covers how to run the site on your computer. Read it before you start a local server.

## Run the site while you write code

- Run `pnpm run dev`. It starts `astro dev`, which runs the site in workerd through the Cloudflare Vite plugin.
- To test image transformations, use `astro dev` with a remote Images binding. The local simulation supports only `width`, `height`, `rotate`, and `format`.
- Do not use `wrangler dev --remote` for the site. See [MEDIA](MEDIA.md).

## Test the built site before a deploy

1. Run `astro build`. It writes `.wrangler/deploy/config.json`.
2. Keep that file. Without it, the next step fails with `No build output found`.
3. Run `astro preview`, not `wrangler dev`. It runs the built Worker in workerd.

## Choose a port

- Use `--port <port>` with `astro dev` and `astro preview`.
- Check that the port is free first. If it is not, Astro silently takes the next port, and `astro preview status` still shows the port you asked for.
- Read the real URL from the `Local` line of the output.

## Start a preview from an agent or a script

- Run `pnpm run preview --port <port> --background`. The command also moves to the background when it detects an agent.
- Read the URL and the process ID from `.astro/preview.json`, or read the `Local` line in `.astro/preview.log`.
- To stop the preview, run `pnpm exec astro preview stop` or stop that process ID. Never use `pkill -f`.

## Work with local data

- `astro dev` and `astro preview` share local data in `.wrangler/state`.
- A new database gets its schema from runtime migrations.
- The admin redirects to setup until setup is complete.
