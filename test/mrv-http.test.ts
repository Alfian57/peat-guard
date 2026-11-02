import { describe, expect, mock, test } from "bun:test";

import {
  createMrvPrivateHandler,
  readBoundedRequestBody,
} from "@/lib/server/mrv/http";
import { AuthorizationError } from "@/lib/role-access";

const request = new Request("http://localhost/api/command/mrv/summary");

describe("private MRV handler", () => {
  test("returns 401 before reading data for an anonymous caller", async () => {
    const operation = mock(async () => Response.json({ secret: "private" }));
    const handler = createMrvPrivateHandler(operation, {
      authorize: async () => {
        throw new AuthorizationError(401);
      },
    });

    const response = await handler(request);

    expect(response.status).toBe(401);
    expect(operation).not.toHaveBeenCalled();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Vary")).toBe("Cookie");
    expect(await response.json()).toEqual({ error: "Sesi masuk diperlukan." });
  });

  test("returns 403 for authenticated users without the verifier role", async () => {
    const handler = createMrvPrivateHandler(
      async () => Response.json({ sensitive: true }),
      {
        authorize: async () => {
          throw new AuthorizationError(403);
        },
      },
    );

    const response = await handler(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Akses ditolak." });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  test("preserves operation response headers while adding private cache rules", async () => {
    const handler = createMrvPrivateHandler(
      async () =>
        new Response("export", {
          headers: { "Content-Type": "text/csv; charset=utf-8" },
        }),
      { authorize: async () => undefined },
    );

    const response = await handler(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/csv; charset=utf-8",
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  test("does not expose database failure details", async () => {
    const handler = createMrvPrivateHandler(
      async () => {
        throw new Error("postgres://sensitive-connection-string");
      },
      {
        authorize: async () => undefined,
        failureMessage: "Ekspor belum tersedia.",
      },
    );

    const response = await handler(request);
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(body).toBe('{"error":"Ekspor belum tersedia."}');
    expect(body).not.toContain("sensitive-connection-string");
  });
});

describe("bounded MRV request bodies", () => {
  test("stops an oversized stream without relying on Content-Length", async () => {
    const payload = new Uint8Array(4_097);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(payload);
        controller.close();
      },
    });
    const streamedRequest = new Request(
      "http://localhost/api/command/mrv/generate",
      { body: stream, method: "POST" },
    );

    expect(streamedRequest.headers.get("Content-Length")).toBeNull();
    await expect(
      readBoundedRequestBody(streamedRequest, 4_096),
    ).resolves.toEqual({ ok: false, reason: "too_large" });
  });

  test("enforces the byte cap for multibyte UTF-8 text", async () => {
    const encoded = new TextEncoder().encode("🌳🌳");
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoded);
        controller.close();
      },
    });
    const streamedRequest = new Request(
      "http://localhost/api/command/mrv/generate",
      { body: stream, method: "POST" },
    );

    expect(await readBoundedRequestBody(streamedRequest, 7)).toEqual({
      ok: false,
      reason: "too_large",
    });
  });
});
