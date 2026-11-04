import { createHash } from "node:crypto";
import { themeScript } from "../theme-script";

const themeScriptHash = `sha256-${createHash("sha256").update(themeScript).digest("base64")}`;

export const frameAncestors = "frame-ancestors 'none'";

export const scriptDirective = {
  resources: ["'self'"],
  hashes: [themeScriptHash],
};

export const directives = [
  "default-src 'self'",
  "connect-src 'self'",
  "img-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  frameAncestors,
];
