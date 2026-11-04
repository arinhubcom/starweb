// Site identity. rules/SETUP.md lists these values to set before launch.
export const SITE = "__SITE__";
export const CONTROLLER = "__NAME__";

const { hostname } = new URL(SITE);

export const SECURITY_CONTACT = `mailto:security@${hostname}`;
export const PRIVACY_EMAIL = `privacy@${hostname}`;
