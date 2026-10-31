import { AuthorizationError } from "@/lib/role-access";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export class CommandApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "CommandApiError";
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

export function commandErrorResponse(error: unknown): Response {
  if (error instanceof AuthorizationError) {
    return jsonResponse(
      {
        error: error.status === 401 ? "authentication_required" : "forbidden",
        message:
          error.status === 401
            ? "Silakan masuk untuk melanjutkan."
            : "Anda tidak memiliki akses untuk tindakan ini.",
      },
      error.status,
    );
  }

  if (error instanceof CommandApiError) {
    return jsonResponse(
      { error: error.code, message: error.message },
      error.status,
    );
  }

  return jsonResponse(
    {
      error: "internal_error",
      message: "Permintaan belum dapat diproses. Silakan coba kembali.",
    },
    500,
  );
}

export async function readJsonObject(
  request: Request,
): Promise<Record<string, unknown>> {
  let value: unknown;

  try {
    value = await request.json();
  } catch {
    throw new CommandApiError(
      400,
      "invalid_json",
      "Isi permintaan tidak valid.",
    );
  }

  if (!isRecord(value)) {
    throw new CommandApiError(
      400,
      "invalid_json",
      "Isi permintaan tidak valid.",
    );
  }

  return value;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function databaseErrorCode(error: unknown): string | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const meta = isRecord(error.meta) ? error.meta : undefined;
  const code = meta?.code;

  if (typeof code === "string") {
    return code;
  }

  return typeof error.code === "string" ? error.code : undefined;
}
