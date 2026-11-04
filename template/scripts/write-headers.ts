import { mkdirSync, writeFileSync } from "node:fs";
import { frameAncestors } from "../src/lib/security/csp";
import { securityHeaders } from "../src/lib/security/headers";

const headers = {
  ...securityHeaders,
  "Content-Security-Policy": frameAncestors,
};
const lines = Object.entries(headers).map(
  ([name, value]) => `  ${name}: ${value}`,
);

mkdirSync("public", { recursive: true });
writeFileSync("public/_headers", `/*\n${lines.join("\n")}\n`);
