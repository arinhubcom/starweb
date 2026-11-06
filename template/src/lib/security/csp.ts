import { createHash } from "node:crypto";
import { themeScript } from "../theme-script";

const themeScriptHash = `sha256-${createHash("sha256").update(themeScript).digest("base64")}`;

// Use the CSP `frame-ancestors`, not `X-Frame-Options` alone.
export const frameAncestors = "frame-ancestors 'none'";

const turnstileOrigin = "https://challenges.cloudflare.com";

export const scriptDirective = {
  // Keep `'self'`: Astro replaces its default sources with this list.
  resources: ["'self'", turnstileOrigin],
  hashes: [themeScriptHash],
};

// One entry per directive, with all sources of that directive in it.
export const directives = [
  "default-src 'self'",
  // Keep `'self'`.
  "connect-src 'self'",
  `frame-src ${turnstileOrigin}`,
  "img-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  frameAncestors,
];
