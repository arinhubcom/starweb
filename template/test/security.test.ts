import { describe, expect, it } from "vitest";
import {
  directives,
  frameAncestors,
  scriptDirective,
} from "../src/lib/security/csp";
import {
  securityHeaders,
  withSecurityHeaders,
} from "../src/lib/security/headers";
import { themeScript } from "../src/lib/theme-script";

describe("csp", () => {
  it("hashes the theme script", () => {
    expect(scriptDirective.hashes[0]).toMatch(/^sha256-/);
    expect(themeScript).toContain("classList.toggle");
  });

  it("keeps self in connect-src and script resources", () => {
    expect(directives).toContain("connect-src 'self'");
    expect(scriptDirective.resources).toContain("'self'");
  });

  it("sends frame-ancestors", () => {
    expect(directives).toContain(frameAncestors);
  });
});

describe("withSecurityHeaders", () => {
  it("sets the headers on a copy and keeps the original", () => {
    const original = new Response("ok");
    const copy = withSecurityHeaders(original);
    for (const [name, value] of Object.entries(securityHeaders)) {
      expect(copy.headers.get(name)).toBe(value);
      expect(original.headers.get(name)).toBeNull();
    }
  });
});
