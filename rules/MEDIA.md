# MEDIA

Rules for images, video, fonts, icons, and uploaded files. For layout shift rules, follow [UI-UX.md](UI-UX.md) (Cumulative Layout Shift). For caching and CPU time, follow [PERF.md](PERF.md). For alt text, follow [WRITING.md](WRITING.md). For CMS content, follow [CMS.md](CMS.md).

## Images

### [Astro images](https://docs.astro.build/en/guides/images/)

- Put images in `src/` (for example `src/assets/`) and import them. Do not put images in `public/`: Astro never optimizes files there. Use `public/` only for files that must keep an exact URL.
- Use `<Image />` from `astro:assets` for one image. Use `<Picture />` when you need several formats. Do not use a plain `<img>` for content images.
- Always set `alt` on `<Image />` and `<Picture />`. Set `alt=""` on a decorative image.
- Set `width` and `height` on images from `public/` and on remote images. Local images in `src/` get them from the file.
- Set `inferSize` on a remote image when you do not know its size. It works only for authorized remote domains.
- Add each remote image host to `image.domains` or `image.remotePatterns` in `astro.config`. Astro does not process other remote images.
- Set `image.layout` in `astro.config` (for example `"constrained"`), or `layout` on the component, so Astro generates `srcset` and `sizes`. Do not set `densities` together with `layout`.
- Set `image.responsiveStyles: true` when you use `layout`, so the images get the default resize styles.
- Use `widths` together with `sizes` when you do not use `layout`. Do not set `widths` without `sizes`.
- Use `<Picture formats={['avif', 'webp']} />` for photos. `<Image />` outputs `webp` by default.
- Set `quality` on `<Image />` only when the default is wrong, as a number from 0 to 100 or a preset (`low`, `mid`, `high`, `max`).
- Use `getImage()` only on the server, for images that are not in HTML, such as API responses or Open Graph images. Do not call it in a client script.
- Use the `image()` helper in the content collection schema for local images in frontmatter. Do not store them as plain strings.
- Use standard Markdown `![alt](src)` for images in Markdown. Use `<Image />` in MDX.

### [Astro LCP image](https://docs.astro.build/en/reference/modules/astro-assets/)

- Set `priority` on the one image that is the Largest Contentful Paint element, usually the hero image. It sets `loading="eager"`, `decoding="sync"`, and `fetchpriority="high"`.
- Do not set `priority` on more than one or two images per page. Keep the default lazy loading for all other images.
- Do not set `loading="lazy"` on the Largest Contentful Paint image (see [web.dev](https://web.dev/articles/optimize-lcp)).

### [Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

- Keep the default `imageService: "cloudflare-binding"`. It transforms images with the Cloudflare Images binding, which the adapter provisions on deploy. Follow the rules in [ARCH.md](ARCH.md).
- Use `imageService: { build: "compile", runtime: "cloudflare-binding" }` when prerendered pages must use build-time images and on-demand pages must use the binding.
- Do not use `imageService: "passthrough"` for pages with content images: it does not transform images.
- Do not use `imageService: "custom"` with `sharp` unless you tested it in `workerd`: the adapter does not check it.
- Set `imagesBindingName` in the adapter and `images.binding` in `wrangler.jsonc` to the same name, only when you rename the default `IMAGES` binding.

### [Cloudflare Images binding](https://developers.cloudflare.com/images/transform-images/bindings/)

- Set `format` in each transformation: the binding has no default output format. Use `avif` or `webp`.
- Keep input images at 20 MB or less.
- Enable [Workers Cache](https://developers.cloudflare.com/workers/cache/) for transformed images: the binding does not cache its responses.
- Test transformations with a remote binding: set `"remote": true` on the `images` binding in the top-level (dev) config of `wrangler.jsonc`, then run `astro dev`. The local simulation supports only `width`, `height`, `rotate`, and `format`. Do not set `remote` in `env.production`.

## EmDash media

### [EmDash media library](https://docs.emdashcms.com/guides/media-library/)

- Store media in R2: set `storage: r2({ binding: "MEDIA" })` from `@emdash-cms/cloudflare` in `emdash()`. Keep the binding name `MEDIA`.
- Render EmDash image fields with `Image` from `emdash/ui`. Pass the field value as `image`, and set `width` and `height`. Do not read a URL from the field by hand.
- Set `priority` on the EmDash `Image` only for the main image at the top of the page.
- Get the public URL of a file with `Astro.locals.emdash?.getPublicMediaUrl?.(meta.storageKey)`. Do not build the URL by hand.
- Set `publicUrl` in `r2()` only when the bucket has a public custom domain. Do not expose the `backups/` prefix of the bucket on that domain.
- Set `maxUploadSize` in `emdash()` (bytes) when the 50 MB default is wrong. Set the accepted types on the image or file field.
- Do not add SVG to the accepted upload types: SVG files can contain active content.
- Bind a separate dev R2 bucket to `MEDIA` in the top-level config and in the `previews` block. Bind the production bucket only in `env.production`. Do not bind dev, a PR preview, or a Preview to the production bucket. Follow the rules in [DEPLOY.md](DEPLOY.md) (Environments).

## User uploads

### [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

- Upload large files from the browser to R2 with a presigned `PUT` URL. Follow the rules in [SAAS.md](SAAS.md) (Files).
- Sign the `ContentType` in the URL, so an upload with another type fails. Do not use `POST`: presigned URLs do not support it.
- Set a short expiry on each presigned URL (1 second to 7 days). Treat each URL as a secret and do not log it.
- Set CORS rules on the bucket for the origins that upload from the browser.
- Do not use a custom domain for presigned URLs: they work only with the S3 API endpoint.
- Create presigned URLs only after you check that the user is signed in and may upload. Follow the rules in [AUTH.md](AUTH.md) and [SECURITY.md](SECURITY.md).

### [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)

- Stream small uploads through the Worker with `env.MEDIA.put(key, request.body, { httpMetadata: { contentType } })`. Do not read a large body into memory first.
- Keep uploads through the Worker below the request body limit of the [Workers plan](https://developers.cloudflare.com/workers/platform/limits/) (100 MB on Free and Pro). Use a presigned URL for larger files.
- Build the object key on the server, for example `tenant_id/uuid.ext`. Do not use the file name from the user as the key.
- Allow only the file types that the feature needs. Check the type against an allow list before you store the file.
- Use `onlyIf` on `put()` when a key must not be overwritten.

## Video

### [HTML video element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video)

- Reserve the space of each `<video>`. Follow the rules in [UI-UX.md](UI-UX.md) (States).
- Set `preload="metadata"` and `poster` on a video that does not autoplay.
- Add `<track kind="captions" src="captions.vtt" srclang="en">` with a WebVTT file to each video that has speech. Offer a transcript.
- Use `autoplay` only together with `muted`, `loop`, and `playsinline`, and only for decorative video without sound. Follow the motion rules in [UI-UX.md](UI-UX.md).

## Fonts

### [Astro fonts](https://docs.astro.build/en/guides/fonts/)

- Configure fonts in `fonts` in `astro.config` (Astro 6 and later) with `fontProviders` from `astro/config`. Do not write `@font-face` rules or load fonts from a `<link>` to a font provider.
- Set `name`, `provider`, and `cssVariable` on each font. Set `weights`, `styles`, and `subsets` to only the ones that the design uses.
- Set `fallbacks` to a generic family, for example `["sans-serif"]`. Keep `optimizedFallbacks` at its default `true` so Astro matches the fallback font metrics.
- Use `fontProviders.local()` for self-hosted files and keep the files in `src/assets/fonts/`. Use WOFF2 files.
- Use a variable font with a weight range, for example `weights: ["100 900"]`, when you need many weights.
- Add `<Font cssVariable="--font-sans" />` from `astro:assets` to the `<head>` of the base layout, once for each font.
- Add `preload` to `<Font />` only for the fonts that the first view needs.
- Connect the font to Tailwind CSS v4 in an `@theme inline` block in `global.css`, for example `--font-sans: var(--font-roboto);`. Follow the rules in [DESIGN.md](DESIGN.md).
- Keep `display` at its default `swap` unless the design needs another value.

## Icons

### [Astro SVG components](https://docs.astro.build/en/guides/images/#svg-components)

- Import local SVG icons as components, for example `import Logo from "../assets/logo.svg"`. Astro inlines them into the HTML. Pass attributes such as `class` as props: Astro applies them to the `<svg>` element.
- Do not render SVG files from users inline. Reject SVG uploads (see User uploads).
