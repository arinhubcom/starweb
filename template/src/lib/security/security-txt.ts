const DAY_MS = 24 * 60 * 60 * 1000;
const VALID_DAYS = 364;

interface SecurityTxtOptions {
  site: string;
  contact: string;
  now: Date;
}

export const buildSecurityTxt = ({
  site,
  contact,
  now,
}: SecurityTxtOptions): string => {
  const expires = new Date(now.getTime() + VALID_DAYS * DAY_MS);
  return [
    `Contact: ${contact}`,
    `Expires: ${expires.toISOString()}`,
    `Canonical: ${new URL("/.well-known/security.txt", site).href}`,
    "",
  ].join("\n");
};
