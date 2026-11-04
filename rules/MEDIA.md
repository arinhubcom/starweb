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

- `fonts` in `astro.config` with `fontProviders` from `astro/config`. No `@font-face`, no `<link>` to a font provider.
- Families in `src/lib/fonts.ts`, imported by `astro.config.mjs`.
- Default: Roboto Flex, `fontProviders.google()`, `subsets: ["latin", "latin-ext"]`, `styles: ["normal"]`. Another family → change `src/lib/fonts.ts` and the `--font-sans` line in `global.css`.
- Per font: `name`, `provider`, `cssVariable`; `weights`, `styles`, `subsets` only as used. Fix each build warning about a value the provider cannot serve.
- `pnpm run fonts` (`scripts/check-fonts.ts`; run it after each change to `src/lib/fonts.ts`; not in `pnpm run check`; `.github/workflows/fonts.yml` runs it when that file or `pnpm-lock.yaml` changes) fails on a value the provider cannot serve: family, weight, style, subset (from `getFontProperties`), variable axis, or icon name.
- Variable font: `options.experimental.variableAxis` for axes other than `wght` and `ital` (`opsz: [["8", "144"]]`). `opsz` needs no `font-variation-settings`; `font-optical-sizing: auto` sets it.
- No `options.experimental.glyphs` on a font that renders CMS or user text; only on fixed text or icons.
- `fallbacks: ["sans-serif"]`-style generic; keep `optimizedFallbacks: true`. Keep `display: swap`, except for the icon font → Icons.
- Self-hosted: `fontProviders.local()`, WOFF2 in `src/assets/fonts/`. Many weights → variable font (`weights: ["100 900"]`).
- `<Font cssVariable="--font-roboto-flex" preload={[{ subset: "latin" }]} />` from `astro:assets` in the base layout `<head>`, once per font; `preload` only for first-view fonts and subsets.
- `pnpm run build` ends with `scripts/check-built-fonts.ts`: it fails when a family in `src/lib/fonts.ts` has no file in the build.
- Browser cache: no `Cache-Control` for `/_astro/*` in `public/_headers`; `@astrojs/cloudflare` adds the `immutable` rule to `dist/client/_headers`, and skips it when a rule already sets `Cache-Control`.
- CI: each workflow that builds restores `node_modules/.astro/fonts` with `actions/cache` after `pnpm install`, as `template/.github/workflows/ci.yml` does. → [DEPLOY](DEPLOY.md) (CI)
- [Tailwind CSS](STACK.md#tailwind-css) v4: `@theme inline` in `global.css` (`--font-sans: var(--font-roboto-flex);`) → [DESIGN](DESIGN.md).

## Icons

### [Material Symbols](STACK.md#material-symbols)

- All icons: `<MaterialIcon name="search" />` from `@/components/ui/material-icon`; in a React island, from `@/components/ui/react/material-icon`. No Lucide, Simple Icons, or other icon package; `no-restricted-imports` in `.oxlintrc.json` fails on `lucide-react` and `@lucide/*`, [Knip](STACK.md#knip) on an unused `lucide-static` or `simple-icons`.
- `fontProviders.googleicons()`, `options.experimental.glyphs` from `ICON_NAMES` in `src/lib/fonts.ts`: a new icon → add its name there; `IconName` rejects other names. Never an empty list (the provider then serves the whole font).
- One family: Material Symbols Outlined. `display: "block"`, `fallbacks: []`, `optimizedFallbacks: false`, `preload`.
- Size with a font size: `text-2xl` is 24px, the default. In a button, the size comes from the button.
- `filled` prop for the `FILL` axis. Other axes follow CSS: `wght` from `font-weight`, `opsz` from the font size.
- `MaterialIcon` is decorative (`aria-hidden`). An icon-only control needs its own `aria-label`.
- A registry item with an icon → replace it after `shadcn add` → [COMPONENTS](COMPONENTS.md) (Fulldev UI).

### SVG

- Logos, brand marks (Material Symbols has none), and other graphics: local SVG as components (`import Logo from "../assets/logo.svg"`); attributes such as `class` pass as props to `<svg>`.
- No inline user SVG; reject SVG uploads.
