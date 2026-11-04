import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { guardFormRequest, MUTATING_METHODS } from "@/lib/forms/policy";
import { withSecurityHeaders } from "@/lib/security/headers";

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
  const blocked = await guardFormRequest(
    request,
    url.pathname,
    env.FORMS_LIMITER,
  );
  if (blocked) return withSecurityHeaders(blocked);
  return withSecurityHeaders(await next());
});
