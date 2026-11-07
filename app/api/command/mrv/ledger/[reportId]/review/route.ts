import { AuthorizationError, requireRole } from "@/lib/authz";
import { isUuid } from "@/lib/server/command/http";
import {
  isMrvSameOrigin,
  mrvPrivateJsonResponse,
  readBoundedRequestBody,
} from "@/lib/server/mrv/http";
import {
  recordMrvEvidenceReview,
  MrvEvidenceReviewError,
} from "@/lib/server/mrv/review";
import { parseEvidenceReviewRequest } from "@/lib/server/mrv/validation";
import { reportActorFromSession } from "@/lib/server/reports/access";

const MAX_REQUEST_BYTES = 1_024;

type RouteContext = { params: Promise<{ reportId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const session = await requireRole(["VERIFIKATOR"], request.headers);
    const { reportId } = await context.params;

    if (!isUuid(reportId)) {
      return mrvPrivateJsonResponse({ error: "ID laporan tidak valid." }, 400);
    }

    if (!isMrvSameOrigin(request)) {
      return mrvPrivateJsonResponse(
        { error: "Permintaan harus berasal dari situs yang sama." },
        403,
      );
    }

    const contentType = request.headers
      .get("Content-Type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();
    if (contentType !== "application/json") {
      return mrvPrivateJsonResponse(
        { error: "Content-Type application/json diperlukan." },
        415,
      );
    }

    const contentLength = Number(request.headers.get("Content-Length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return mrvPrivateJsonResponse(
        { error: "Ukuran permintaan terlalu besar." },
        413,
      );
    }

    const body = await readBoundedRequestBody(request, MAX_REQUEST_BYTES);
    if (!body.ok) {
      const message =
        body.reason === "too_large"
          ? "Ukuran permintaan terlalu besar."
          : body.reason === "invalid_utf8"
            ? "Encoding UTF-8 tidak valid."
            : "Body permintaan tidak dapat dibaca.";
      return mrvPrivateJsonResponse(
        { error: message },
        body.reason === "too_large" ? 413 : 400,
      );
    }

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(body.text) as unknown;
    } catch {
      return mrvPrivateJsonResponse({ error: "JSON tidak valid." }, 400);
    }

    const parsed = parseEvidenceReviewRequest(requestBody);
    if (!parsed.ok) {
      return mrvPrivateJsonResponse({ error: parsed.error }, 400);
    }

    const review = await recordMrvEvidenceReview(
      reportActorFromSession(session.user),
      reportId.toLowerCase(),
      parsed.value.decision,
    );

    return mrvPrivateJsonResponse({ review }, 201);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return mrvPrivateJsonResponse(
        {
          error:
            error.status === 401 ? "Sesi masuk diperlukan." : "Akses ditolak.",
        },
        error.status,
      );
    }

    if (error instanceof MrvEvidenceReviewError) {
      return mrvPrivateJsonResponse({ error: error.message }, error.status);
    }

    return mrvPrivateJsonResponse(
      { error: "Peninjauan bukti belum dapat disimpan." },
      503,
    );
  }
}
