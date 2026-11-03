# MEDIA

Images, video, fonts, icons, uploads. Layout shift → [UI-UX](UI-UX.md) (Cumulative Layout Shift). Caching, CPU → [PERF](PERF.md). Alt text → [WRITING](WRITING.md). CMS content → [CMS](CMS.md).

## Images

### [Astro](STACK.md#astro) images

- Images in `src/` (`src/assets/`), imported. `public/` only for files needing an exact URL (never optimized).
- `<Image />` from `astro:assets` for one image, `<Picture />` for several formats. No plain `<img>` for content images.
- `alt` always; `alt=""` for decorative.
- `width` and `height` on `public/` and remote images (local `src/` images infer them). `inferSize` for remote of unknown size (authorized domains only).
- Remote hosts in `image.domains` or `image.remotePatterns`.
- `image.layout` in `astro.config` (`"constrained"`) or `layout` per component for `srcset`/`sizes`; with it `image.responsiveStyles: true`, no `densities`. Without `layout`: `widths` always with `sizes`.
- Photos: `<Picture formats={['avif', 'webp']} />` (`<Image />` defaults to `webp`).
- `quality` only when the default is wrong: 0-100 or `low`/`mid`/`high`/`max`.
- `getImage()` server-only, for images outside HTML (API responses, Open Graph). Never in a client script.
- Content collection schema: `image()` helper for local frontmatter images, not strings.
- Markdown `![alt](src)`; MDX `<Image />`.
- LCP image: `priority` (`loading="eager"`, `decoding="sync"`, `fetchpriority="high"`) on the one hero; ≤ 2 per page. Never `loading="lazy"` on it.

### Astro Cloudflare adapter

- Keep default `imageService: "cloudflare-binding"` → [ARCH](ARCH.md).
- Prerendered at build, on-demand via binding: `imageService: { build: "compile", runtime: "cloudflare-binding" }`.
- No `"passthrough"` for content images. No `"custom"` with `sharp` unless tested in `workerd`.
- Rename the default `IMAGES` binding only with matching `imagesBindingName` (adapter) and `images.binding` (`wrangler.jsonc`).

### [Cloudflare Images](STACK.md#cloudflare-images) binding

- `format` in each transformation (no default): `avif` or `webp`. Input ≤ 20 MB.
- Enable [Workers Cache](https://developers.cloudflare.com/workers/cache/) for transformed images (the binding does not cache).
- Test with `"remote": true` on the `images` binding in the top-level (dev) config of `wrangler.jsonc`, then `astro dev`. Local simulation supports only `width`, `height`, `rotate`, `format`. Never `remote` in `env.production`.

## EmDash media

### [EmDash](STACK.md#emdash) media library

- Storage: `emdash({ storage: r2({ binding: "MEDIA" }) })` from `@emdash-cms/cloudflare` on [R2](STACK.md#r2). Binding name `MEDIA`.
- Image fields: `Image` from `emdash/ui`, field value as `image`, with `width` and `height`; no hand-read URLs. `priority` only on the top main image.
- Public URL: `Astro.locals.emdash?.getPublicMediaUrl?.(meta.storageKey)`, never hand-built.
- `publicUrl` in `r2()` only with a public custom domain; never expose the bucket's `backups/` prefix there.
- `maxUploadSize` in `emdash()` (bytes) if the 50 MB default is wrong; accepted types on the field. No SVG (active content).
- Separate dev R2 bucket bound to `MEDIA` in the top-level config and `previews` block; production bucket only in `env.production`. Dev, PR preview, Preview never touch production → [DEPLOY](DEPLOY.md) (Environments).

## User uploads

### R2 presigned URLs

- Large browser uploads: presigned `PUT` → [SAAS](SAAS.md) (Files). No `POST`.
- Sign `ContentType`. Expiry short (1 s to 7 days). Treat as a secret; never log.
- CORS rules on the bucket for uploading origins.
- S3 API endpoint only, no custom domain.
- Create only after checking sign-in and upload permission → [AUTH](AUTH.md), [SECURITY](SECURITY.md).

### R2 Workers API

- Small uploads: stream `env.MEDIA.put(key, request.body, { httpMetadata: { contentType } })`; never buffer a large body.
- Through the Worker ≤ the [Workers](STACK.md#workers) plan body limit (100 MB Free and Pro); larger → presigned URL.
- Server-built key (`tenant_id/uuid.ext`), never the user file name.
- Allow list of types, checked before storing.
- `onlyIf` on `put()` when a key must not be overwritten.

## Video

### [MDN](STACK.md#mdn) `<video>`

- Reserve space → [UI-UX](UI-UX.md) (States).
- No autoplay: `preload="metadata"` and `poster`.
- Speech: `<track kind="captions" src="captions.vtt" srclang="en">` (WebVTT) plus a transcript.
- `autoplay` only with `muted loop playsinline`, only for decorative silent video → motion rules in [UI-UX](UI-UX.md).

## Fonts

### Astro fonts

- `fonts` in `astro.config` (Astro 6+) with `fontProviders` from `astro/config`. No `@font-face`, no `<link>` to a font provider.
- Per font: `name`, `provider`, `cssVariable`; `weights`, `styles`, `subsets` only as used.
- `fallbacks: ["sans-serif"]`-style generic; keep `optimizedFallbacks: true`. Keep `display: swap`.
- Self-hosted: `fontProviders.local()`, WOFF2 in `src/assets/fonts/`. Many weights → variable font (`weights: ["100 900"]`).
- `<Font cssVariable="--font-sans" />` from `astro:assets` in the base layout `<head>`, once per font; `preload` only for first-view fonts.
- [Tailwind CSS](STACK.md#tailwind-css) v4: `@theme inline` in `global.css` (`--font-sans: var(--font-roboto);`) → [DESIGN](DESIGN.md).

## Icons

- Local SVG as components (`import Logo from "../assets/logo.svg"`); attributes such as `class` pass as props to `<svg>`.
- No inline user SVG; reject SVG uploads.
