# MEDIA

This file covers images, video, fonts, icons, and uploads. Read it before you add an image, a font, an icon, or an upload. For layout shift, see [UI-UX](UI-UX.md#show-loading-empty-and-error-states). For caching and CPU, see [PERF](PERF.md). For alt text, see [WRITING](WRITING.md). For CMS content, see [CMS](CMS.md).

## Add an image to a page

### Use [Astro](STACK.md#astro) images

- Put images in `src/` (`src/assets/`) and import them.
- Use `public/` only for files that need an exact URL. Astro never optimizes them.
- Use `<Image />` from `astro:assets` for one image, and `<Picture />` for several formats.
- Do not use a plain `<img>` for content images.
- Always set `alt`. Use `alt=""` for a decorative image.
- Set `width` and `height` on `public/` images and remote images. Local `src/` images infer them.
- For a remote image of unknown size, use `inferSize`, and only for authorized domains.
- List remote hosts in `image.domains` or `image.remotePatterns`.
- Set `layout` per component to get `srcset` and `sizes`. Do not use `densities`.
- Without `layout`, always set `widths` together with `sizes`.
- For photos, use `<Picture formats={['avif', 'webp']} />`. `<Image />` defaults to `webp`.
- Set `quality` only when the default is wrong. Use 0-100 or `low`, `mid`, `high`, `max`.
- Use `getImage()` on the server only, for images outside HTML such as API responses and Open Graph. Never use it in a client script.
- In a content collection schema, use the `image()` helper for local frontmatter images, not strings.
- In Markdown, use `![alt](src)`. In MDX, use `<Image />`.
- Set `priority` (`loading="eager"`, `decoding="sync"`, `fetchpriority="high"`) on the LCP image, which is the one hero image.
- Use at most 2 `priority` images per page.
- Never set `loading="lazy"` on the LCP image.

### Configure the Astro Cloudflare adapter

- Keep the default `imageService`, which is `cloudflare-binding`. The adapter adds the `IMAGES` binding. See [ARCH](ARCH.md).
- To prerender at build and transform on demand through the binding, set `imageService: { build: "compile", runtime: "cloudflare-binding" }`.
- Do not use `"passthrough"` for content images.
- Do not use `"custom"` with `sharp` unless you tested it in `workerd`.
- To rename the default `IMAGES` binding, set a matching `imagesBindingName` in the adapter and `images.binding` in `wrangler.jsonc`.

### Use the [Cloudflare Images](STACK.md#cloudflare-images) binding

- Set `format` in each transformation, because there is no default. Use `avif` or `webp`.
- Keep the input at 20 MB or less.
- Enable [Workers Cache](https://developers.cloudflare.com/workers/cache/) for transformed images. The binding does not cache.
- To test, set `"remote": true` on the `images` binding in the top-level (dev) config of `wrangler.jsonc`, then run `astro dev`.
- The local simulation supports only `width`, `height`, `rotate`, and `format`.
- Never set `remote` in `env.production`.

## Use media from the CMS

### Use the [EmDash](STACK.md#emdash) media library

- For image fields, use `Image` from `emdash/ui`. Pass the field value as `image`, with `width` and `height`.
- Do not read image URLs by hand.
- Set `priority` only on the top main image.
- Get the public URL with `Astro.locals.emdash?.getPublicMediaUrl?.(meta.storageKey)`. Never build it by hand.
- Set `publicUrl` in `r2()` only with a public custom domain.
- Never expose the `backups/` prefix of the bucket there.
- If the 50 MB default upload size is wrong, set `maxUploadSize` in `emdash()` (in bytes).
- Set the accepted types on the field. Do not accept SVG, because it is active content.
- Bind a separate dev R2 bucket to `MEDIA` in the top-level config and the `previews` block.
- Put the production bucket only in `env.production`.
- Dev, PR preview, and Preview never touch production. See [DEPLOY](DEPLOY.md#wrangler-config).

## Accept user uploads

### Use [R2](STACK.md#r2) presigned URLs

- For large browser uploads, use a presigned `PUT`. Do not use `POST`. See [SAAS](SAAS.md#store-files-in-r2).
- Sign `ContentType`.
- Keep the expiry short, from 1 second to 7 days.
- Treat a presigned URL as a secret. Never log it.
- Add CORS rules on the bucket for the uploading origins.
- Use the S3 API endpoint only, not a custom domain.
- Create a presigned URL only after you check sign-in and upload permission. See [AUTH](AUTH.md) and [SECURITY](SECURITY.md).

### Use the R2 Workers API

- For small uploads, stream with `env.MEDIA.put(key, request.body, { httpMetadata: { contentType } })`.
- Never buffer a large body.
- Through the Worker, the body can be at most the [Workers](STACK.md#workers) plan body limit, which is 100 MB on Free and Pro. For larger files, use a presigned URL.
- Build the key on the server, for example `tenant_id/uuid.ext`. Never use the user file name.
- Check the type against an allow list before you store the file.
- Use `onlyIf` on `put()` when a key must not be overwritten.

## Add video

### Use [MDN](STACK.md#mdn) `<video>`

- Reserve space for the video. See [UI-UX](UI-UX.md#show-loading-empty-and-error-states).
- Do not autoplay. Set `preload="metadata"` and `poster`.
- For speech, add `<track kind="captions" src="captions.vtt" srclang="en">` (WebVTT) and a transcript.
- Use `autoplay` only with `muted loop playsinline`, and only for decorative silent video. For motion rules, see [UI-UX](UI-UX.md).

## Change or add a font

### Use Astro fonts

- Do not write `@font-face`.
- Do not add a `<link>` to a font provider.
- To use another family, change `src/lib/fonts.ts` and the `--font-sans` line in `global.css`.
- For each font, set `name`, `provider`, and `cssVariable`.
- Set `weights`, `styles`, and `subsets` only as used.
- Fix each build warning about a value that the provider cannot serve.
- After each change to `src/lib/fonts.ts`, run `pnpm run fonts`. It is not part of `pnpm run check`.
- To self-host, use `fontProviders.local()` and put WOFF2 files in `src/assets/fonts/`.
- For many weights, use a variable font, for example `weights: ["100 900"]`.
- Add one `<Font />` per font in the `<head>` of the base layout.
- Set `preload` only for first-view fonts and subsets.
- Do not set `Cache-Control` for `/_astro/*` in `public/_headers`. `@astrojs/cloudflare` adds the `immutable` rule to `dist/client/_headers`.
- The adapter skips that rule when a rule already sets `Cache-Control`.

## Add an icon

### Use [Material Symbols](STACK.md#material-symbols)

- For all icons, use `<MaterialIcon name="search" />` from `@/components/ui/material-icon`.
- In a React island, import it from `@/components/ui/react/material-icon`.
- Do not use Lucide, Simple Icons, or any other icon package.
- To use a new icon, add its name to `ICON_NAMES` in `src/lib/fonts.ts`. `IconName` rejects other names.
- Size an icon with a font size. `text-2xl` is 24px, the default. In a button, the size comes from the button.
- Use the `filled` prop for the `FILL` axis.
- The other axes follow CSS: `wght` comes from `font-weight`, and `opsz` comes from the font size.
- `MaterialIcon` is decorative (`aria-hidden`). An icon-only control needs its own `aria-label`.
- If a registry item has an icon, replace it after `shadcn add`. See [COMPONENTS](COMPONENTS.md#replace-lucide-icons).

### Add an SVG

- For logos, brand marks (Material Symbols has none), and other graphics, use a local SVG as a component, for example `import Logo from "../assets/logo.svg"`.
- Attributes such as `class` pass as props to `<svg>`.
- Do not inline user SVG.
- Reject SVG uploads.
