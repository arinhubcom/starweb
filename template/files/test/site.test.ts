import { describe, expect, it } from "vitest";
import { buildSecurityTxt } from "../src/lib/security/security-txt";
import { PRIVACY_EMAIL, SECURITY_CONTACT, SITE } from "../src/lib/site";

describe("site", () => {
  it("derives the contact addresses from the site host", () => {
    const { hostname } = new URL(SITE);
    expect(SECURITY_CONTACT).toBe(`mailto:security@${hostname}`);
    expect(PRIVACY_EMAIL).toBe(`privacy@${hostname}`);
  });
});

describe("buildSecurityTxt", () => {
  const text = buildSecurityTxt({
    site: "https://example.com",
    contact: "mailto:security@example.com",
    now: new Date("2026-01-01T00:00:00.000Z"),
  });

  it("writes the contact and the canonical URL", () => {
    expect(text).toContain("Contact: mailto:security@example.com\n");
    expect(text).toContain(
      "Canonical: https://example.com/.well-known/security.txt\n",
    );
  });

  it("keeps one slash in the canonical URL when the site ends with one", () => {
    const withSlash = buildSecurityTxt({
      site: "https://example.com/",
      contact: "mailto:security@example.com",
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(withSlash).toContain(
      "Canonical: https://example.com/.well-known/security.txt\n",
    );
  });

  it("sets Expires less than one year ahead", () => {
    expect(text).toContain("Expires: 2026-12-31T00:00:00.000Z\n");
  });
});
