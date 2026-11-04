import { describe, expect, it } from "vitest";
import {
  checkFormPolicy,
  FORM_BODY_LIMIT_BYTES,
  FORM_CREATE_PATH,
  FORM_RATE_LIMIT_SECONDS,
  FORM_RETENTION_DAYS,
  FORM_SUBMIT_PATH,
  FORM_UPDATE_PATH,
  guardFormRequest,
  isFormWrite,
  limitFormSubmit,
  MUTATING_METHODS,
  violatesFormPolicy,
} from "../src/lib/forms/policy";

const valid = { retentionDays: 30, spamProtection: "turnstile" };

const checkCreate = (settings?: unknown): boolean =>
  violatesFormPolicy(FORM_CREATE_PATH, { name: "Contact", settings });

const checkUpdate = (settings?: unknown): boolean =>
  violatesFormPolicy(FORM_UPDATE_PATH, { id: "1", settings });

const createRequest = (body: string): Request =>
  new Request(`https://example.com${FORM_CREATE_PATH}`, {
    method: "POST",
    body,
  });

const send = (method: string, path: string, body?: string): Request =>
  new Request(`https://example.com${path}`, {
    method,
    ...(body === undefined ? {} : { body }),
  });

const submitRequest = (ip?: string): Request =>
  new Request(`https://example.com${FORM_SUBMIT_PATH}`, {
    method: "POST",
    headers: ip === undefined ? {} : { "CF-Connecting-IP": ip },
  });

const recordingLimiter = (): {
  keys: string[];
  limit(options: { key: string }): Promise<{ success: boolean }>;
} => {
  const keys: string[] = [];
  return {
    keys,
    limit: ({ key }) => {
      keys.push(key);
      return Promise.resolve({ success: true });
    },
  };
};

describe("isFormWrite", () => {
  it("matches the create and update routes only", () => {
    expect(isFormWrite(FORM_CREATE_PATH)).toBe(true);
    expect(isFormWrite(FORM_UPDATE_PATH)).toBe(true);
    expect(isFormWrite(FORM_SUBMIT_PATH)).toBe(false);
    expect(isFormWrite(`${FORM_CREATE_PATH}/`)).toBe(false);
  });
});

describe("violatesFormPolicy on create", () => {
  it("accepts Turnstile and a retention period", () => {
    expect(checkCreate(valid)).toBe(false);
    expect(checkCreate({ ...valid, retentionDays: FORM_RETENTION_DAYS })).toBe(false);
  });

  it("rejects the admin defaults", () => {
    expect(checkCreate({ retentionDays: 0, spamProtection: "honeypot" })).toBe(true);
  });

  it("rejects missing settings, because the plugin defaults apply", () => {
    expect(checkCreate()).toBe(true);
    expect(checkCreate({})).toBe(true);
    expect(checkCreate({ spamProtection: "turnstile" })).toBe(true);
    expect(checkCreate({ retentionDays: 30 })).toBe(true);
  });

  it.each(["none", "honeypot", null])("rejects spam protection %s", (value) => {
    expect(checkCreate({ ...valid, spamProtection: value })).toBe(true);
  });

  it.each([0, -1, 1.5, "30", null, FORM_RETENTION_DAYS + 1])(
    "rejects the retention value %s",
    (value) => {
      expect(checkCreate({ ...valid, retentionDays: value })).toBe(true);
    },
  );
});

describe("violatesFormPolicy on update", () => {
  it("accepts an update that changes neither value", () => {
    expect(checkUpdate()).toBe(false);
    expect(checkUpdate({ submitLabel: "Send" })).toBe(false);
  });

  it("accepts valid values", () => {
    expect(checkUpdate(valid)).toBe(false);
  });

  it("rejects a change away from Turnstile", () => {
    expect(checkUpdate({ spamProtection: "none" })).toBe(true);
  });

  it("rejects an invalid retention period", () => {
    expect(checkUpdate({ retentionDays: 0 })).toBe(true);
    expect(checkUpdate({ retentionDays: FORM_RETENTION_DAYS + 1 })).toBe(true);
  });
});

describe("violatesFormPolicy on other bodies", () => {
  it.each([null, [], "text", 1])("leaves %j to the route", (body) => {
    expect(violatesFormPolicy(FORM_CREATE_PATH, body)).toBe(false);
  });
});

describe("checkFormPolicy", () => {
  it("returns 400 with a message for a violation", async () => {
    const response = await checkFormPolicy(
      createRequest(JSON.stringify({ settings: { retentionDays: 0 } })),
      FORM_CREATE_PATH,
    );
    expect(response?.status).toBe(400);
    const body = (await response?.json()) as {
      success: boolean;
      error: { message: string };
    };
    expect(body.success).toBe(false);
    expect(body.error.message).toContain("Turnstile");
    expect(body.error.message).toContain(String(FORM_RETENTION_DAYS));
  });

  it("leaves a valid body unread for the route", async () => {
    const sent = JSON.stringify({ settings: valid });
    const original = createRequest(sent);
    expect(await checkFormPolicy(original, FORM_CREATE_PATH)).toBeNull();
    expect(original.bodyUsed).toBe(false);
    expect(await original.text()).toBe(sent);
  });

  it("leaves invalid JSON unread for the route to reject", async () => {
    const original = createRequest("{not json");
    expect(await checkFormPolicy(original, FORM_CREATE_PATH)).toBeNull();
    expect(await original.text()).toBe("{not json");
  });

  it("returns 413 for a body over the limit, without Content-Length", async () => {
    const chunk = new Uint8Array(64 * 1024);
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(chunk);
      },
    });
    const large = new Request(`https://example.com${FORM_CREATE_PATH}`, {
      method: "POST",
      body: stream,
    });
    const response = await checkFormPolicy(large, FORM_CREATE_PATH);
    expect(response?.status).toBe(413);
  });

  it("accepts a body of exactly the limit", async () => {
    const pad = "x".repeat(FORM_BODY_LIMIT_BYTES - 2);
    const response = await checkFormPolicy(
      createRequest(`"${pad}"`),
      FORM_CREATE_PATH,
    );
    expect(response).toBeNull();
  });
});

describe("guardFormRequest", () => {
  const blocked = { limit: () => Promise.resolve({ success: false }) };
  const allowed = { limit: () => Promise.resolve({ success: true }) };
  const bad = JSON.stringify({
    settings: { retentionDays: 0, spamProtection: "none" },
  });
  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "limits %s on the submit route",
    async (method) => {
      const response = await guardFormRequest(
        send(method, FORM_SUBMIT_PATH),
        FORM_SUBMIT_PATH,
        blocked,
      );
      expect(response?.status).toBe(429);
    },
  );

  it.each(["POST", "PUT", "PATCH"])(
    "checks %s on the update route",
    async (method) => {
      const response = await guardFormRequest(
        send(method, FORM_UPDATE_PATH, bad),
        FORM_UPDATE_PATH,
        allowed,
      );
      expect(response?.status).toBe(400);
    },
  );

  it.each(["GET", "HEAD", "OPTIONS"])("skips %s", async (method) => {
    const response = await guardFormRequest(
      send(method, FORM_SUBMIT_PATH),
      FORM_SUBMIT_PATH,
      blocked,
    );
    expect(response).toBeNull();
  });

  it("skips other routes", async () => {
    const path = "/_emdash/api/plugins/emdash-forms/forms/list";
    const response = await guardFormRequest(
      send("POST", path, bad),
      path,
      blocked,
    );
    expect(response).toBeNull();
  });

  it("uses a shared method set", () => {
    expect([...MUTATING_METHODS].toSorted()).toEqual([
      "DELETE",
      "PATCH",
      "POST",
      "PUT",
    ]);
  });
});

describe("limitFormSubmit", () => {
  it("allows a request under the limit, keyed by IP address", async () => {
    const limiter = recordingLimiter();
    expect(await limitFormSubmit(submitRequest("192.0.2.1"), limiter)).toBeNull();
    expect(limiter.keys).toEqual(["192.0.2.1"]);
  });

  it("shares one key when the request has no IP address", async () => {
    const limiter = recordingLimiter();
    await limitFormSubmit(submitRequest(), limiter);
    expect(limiter.keys).toEqual(["unknown"]);
  });

  it("returns 429 with Retry-After over the limit", async () => {
    const limiter = { limit: () => Promise.resolve({ success: false }) };
    const response = await limitFormSubmit(submitRequest("192.0.2.1"), limiter);
    expect(response?.status).toBe(429);
    expect(response?.headers.get("Retry-After")).toBe(
      String(FORM_RATE_LIMIT_SECONDS),
    );
    const body = (await response?.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });
});
