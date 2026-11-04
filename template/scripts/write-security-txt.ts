import { mkdirSync, writeFileSync } from "node:fs";
import { buildSecurityTxt } from "../src/lib/security/security-txt";
import { SECURITY_CONTACT, SITE } from "../src/lib/site";

mkdirSync("public/.well-known", { recursive: true });
writeFileSync(
  "public/.well-known/security.txt",
  buildSecurityTxt({
    site: SITE,
    contact: SECURITY_CONTACT,
    now: new Date(),
  }),
);
