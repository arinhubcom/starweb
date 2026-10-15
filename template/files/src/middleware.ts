import { defineMiddleware } from "astro:middleware";
import { withSecurityHeaders } from "@/lib/security/headers";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const EMDASH_PREFIX = "/_emdash/";

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url } = context;
  const origin = request.headers.get("Origin");
  const isCrossSite =
    MUTATING_METHODS.has(request.method) &&
    !url.pathname.startsWith(EMDASH_PREFIX) &&
    origin !== null &&
    origin !== url.origin;

  if (isCrossSite) {
    return withSecurityHeaders(
      new Response("Cross-site request blocked", { status: 403 }),
    );
  }
  return withSecurityHeaders(await next());
});
