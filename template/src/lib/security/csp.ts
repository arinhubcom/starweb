import { createHash } from "node:crypto";
import { themeScript } from "../theme-script";

const themeScriptHash = `sha256-${createHash("sha256").update(themeScript).digest("base64")}`;

export const frameAncestors = "frame-ancestors 'none'";

const turnstileOrigin = "https://challenges.cloudflare.com";

export const scriptDirective = {
  resources: ["'self'", turnstileOrigin],
  hashes: [themeScriptHash],
};

export const directives = [
  "default-src 'self'",
  "connect-src 'self'",
  `frame-src ${turnstileOrigin}`,
  "img-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  frameAncestors,
];
