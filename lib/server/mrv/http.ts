import { AuthorizationError } from "@/lib/role-access";

export const MRV_PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
} as const;

type MrvOperation = (request: Request) => Promise<Response>;
type MrvAuthorizer = (request: Request) => Promise<unknown>;

export type BoundedRequestBodyResult =
  | { ok: true; text: string }
  | { ok: false; reason: "invalid_utf8" | "too_large" | "unreadable" };

export async function readBoundedRequestBody(
  request: Request,
  maxBytes: number,
): Promise<BoundedRequestBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    return { ok: false, reason: "unreadable" };
  }

  if (!request.body) {
    return { ok: true, text: "" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const result = await reader.read();

      if (result.done) {
        break;
      }

      totalBytes += result.value.byteLength;

      if (totalBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          return { ok: false, reason: "unreadable" };
        }

        return { ok: false, reason: "too_large" };
      }

      chunks.push(result.value);
    }
  } catch {
    return { ok: false, reason: "unreadable" };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      ok: true,
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    };
  } catch {
    return { ok: false, reason: "invalid_utf8" };
  }
}

function addPrivateHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  const vary = new Set(
    (headers.get("Vary") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  vary.add("Cookie");
  headers.set("Cache-Control", MRV_PRIVATE_HEADERS["Cache-Control"]);
  headers.set("Vary", [...vary].join(", "));
  headers.set(
    "X-Content-Type-Options",
    MRV_PRIVATE_HEADERS["X-Content-Type-Options"],
  );

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export function createMrvPrivateHandler(
  operation: MrvOperation,
  options: {
    authorize: MrvAuthorizer;
    failureMessage?: string;
  },
): (request: Request) => Promise<Response> {
  const authorize = options.authorize;
  const failureMessage =
    options.failureMessage ?? "Data MRV belum dapat dimuat.";

  return async (request) => {
    try {
      await authorize(request);
      return addPrivateHeaders(await operation(request));
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return addPrivateHeaders(
          Response.json(
            {
              error:
                error.status === 401
                  ? "Sesi masuk diperlukan."
                  : "Akses ditolak.",
            },
            { status: error.status },
          ),
        );
      }

      return addPrivateHeaders(
        Response.json({ error: failureMessage }, { status: 503 }),
      );
    }
  };
}
