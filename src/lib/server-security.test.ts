import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { assertInternalRequest } from "./server-security";

const SECRET = "test-internal-secret";

function makeRequest(options: {
  headers?: Record<string, string>;
  url?: string;
} = {}): { headers: Headers; url: string } {
  return {
    headers: new Headers(options.headers),
    url: options.url ?? "https://example.test/internal",
  };
}

function responseStatus(request: ReturnType<typeof makeRequest>): number | null {
  return assertInternalRequest(request)?.status ?? null;
}

let originalInternalSecret: string | undefined;
let originalCronSecret: string | undefined;

beforeEach(() => {
  originalInternalSecret = process.env.INTERNAL_API_SECRET;
  originalCronSecret = process.env.CRON_SECRET;
  process.env.INTERNAL_API_SECRET = SECRET;
  delete process.env.CRON_SECRET;
});

afterEach(() => {
  if (originalInternalSecret === undefined) delete process.env.INTERNAL_API_SECRET;
  else process.env.INTERNAL_API_SECRET = originalInternalSecret;

  if (originalCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalCronSecret;
});

describe("assertInternalRequest", () => {
  it("returns 401 when no credential headers or query secret are present", () => {
    expect(responseStatus(makeRequest())).toBe(401);
  });

  it("allows the configured x-internal-secret header", () => {
    expect(
      assertInternalRequest(
        makeRequest({ headers: { "x-internal-secret": SECRET } })
      )
    ).toBeNull();
  });

  it("allows a Bearer authorization credential", () => {
    expect(
      assertInternalRequest(
        makeRequest({ headers: { authorization: `Bearer ${SECRET}` } })
      )
    ).toBeNull();
  });

  it("allows the configured x-cron-secret header", () => {
    delete process.env.INTERNAL_API_SECRET;
    process.env.CRON_SECRET = SECRET;

    expect(
      assertInternalRequest(makeRequest({ headers: { "x-cron-secret": SECRET } }))
    ).toBeNull();
  });

  it("allows the configured query secret", () => {
    expect(
      assertInternalRequest(
        makeRequest({ url: `https://example.test/internal?secret=${SECRET}` })
      )
    ).toBeNull();
  });

  it("returns 401 when all supported credentials are wrong", () => {
    const request = makeRequest({
      headers: {
        authorization: "Bearer wrong-bearer",
        "x-internal-secret": "wrong-internal",
        "x-cron-secret": "wrong-cron",
      },
      url: "https://example.test/internal?secret=wrong-query",
    });

    expect(responseStatus(request)).toBe(401);
  });

  it("returns 503 rather than allowing requests without a configured secret", () => {
    delete process.env.INTERNAL_API_SECRET;
    delete process.env.CRON_SECRET;

    expect(responseStatus(makeRequest())).toBe(503);
  });
});
