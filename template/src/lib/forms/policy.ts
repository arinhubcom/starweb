// Forms plugin policy. The plugin has no working option for these values, so
// the middleware enforces them. See the Add EmDash Forms section in rules/CMS.md.
const FORMS_API = "/_emdash/api/plugins/emdash-forms";

export const FORM_CREATE_PATH = `${FORMS_API}/forms/create`;
export const FORM_UPDATE_PATH = `${FORMS_API}/forms/update`;
export const FORM_SUBMIT_PATH = `${FORMS_API}/submit`;
export const FORM_RETENTION_DAYS = 365;
export const FORM_BODY_LIMIT_BYTES = 1024 * 1024;
export const MUTATING_METHODS: ReadonlySet<string> = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);
// Matches the period of FORMS_LIMITER in wrangler.jsonc.
export const FORM_RATE_LIMIT_SECONDS = 60;

interface FormLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRetention = (value: unknown): boolean =>
  Number.isInteger(value) &&
  (value as number) > 0 &&
  (value as number) <= FORM_RETENTION_DAYS;

const errorResponse = (
  status: number,
  code: string,
  message: string,
  headers: HeadersInit = {},
): Response =>
  Response.json(
    { success: false, error: { code, message } },
    { status, headers },
  );

export const isFormWrite = (pathname: string): boolean =>
  pathname === FORM_CREATE_PATH || pathname === FORM_UPDATE_PATH;

export function violatesFormPolicy(pathname: string, body: unknown): boolean {
  if (!isRecord(body)) return false;
  const settings = isRecord(body.settings) ? body.settings : {};
  // Create falls back to the plugin defaults, so it needs both values. Update
  // keeps the stored value of a key that it omits.
  const isCreate = pathname === FORM_CREATE_PATH;
  const badSpam =
    (isCreate || "spamProtection" in settings) &&
    settings.spamProtection !== "turnstile";
  const badRetention =
    (isCreate || "retentionDays" in settings) &&
    !isRetention(settings.retentionDays);
  return badSpam || badRetention;
}

// Reads a copy of the body, so the route can still read the request. Returns
// null over the limit: this code runs before the route checks the session.
async function readText(request: Request): Promise<string | null> {
  const body = request.clone().body as ReadableStream<Uint8Array> | null;
  if (!body) return "";
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    size += value.byteLength;
    if (size > FORM_BODY_LIMIT_BYTES) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // The route validates its input and rejects this body.
    return null;
  }
}

export async function checkFormPolicy(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const text = await readText(request);
  if (text === null) {
    return errorResponse(413, "PAYLOAD_TOO_LARGE", "This form is too large.");
  }
  if (!violatesFormPolicy(pathname, parseJson(text))) return null;
  return errorResponse(
    400,
    "FORM_POLICY",
    `Set spam protection to Turnstile, and retention to 1-${FORM_RETENTION_DAYS} days.`,
  );
}

export async function limitFormSubmit(
  request: Request,
  limiter: FormLimiter,
): Promise<Response | null> {
  const key = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const { success } = await limiter.limit({ key });
  if (success) return null;
  return errorResponse(
    429,
    "RATE_LIMITED",
    "Too many tries. Wait a minute, then try again.",
    { "Retry-After": String(FORM_RATE_LIMIT_SECONDS) },
  );
}

// The plugin routes accept each of these methods, not only POST.
export async function guardFormRequest(
  request: Request,
  pathname: string,
  limiter: FormLimiter,
): Promise<Response | null> {
  if (!MUTATING_METHODS.has(request.method)) return null;
  if (pathname === FORM_SUBMIT_PATH) return limitFormSubmit(request, limiter);
  if (isFormWrite(pathname)) return checkFormPolicy(request, pathname);
  return null;
}
