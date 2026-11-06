export const securityHeaders: Readonly<Record<string, string>> = {
  // Add `preload` only after you submit the site to the HSTS preload list:
  // https://hstspreload.org/
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Allow a feature only for the origin that needs it, for example
  // `geolocation=(self)`.
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export const withSecurityHeaders = (original: Response): Response => {
  const response = new Response(original.body, original);
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }
  return response;
};
