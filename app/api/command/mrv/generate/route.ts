import { requireRole } from "@/lib/authz";
import { generateMrvReport } from "@/lib/server/mrv/report-generator";
import {
  createMrvPrivateHandler,
  isMrvSameOrigin,
  readBoundedRequestBody,
} from "@/lib/server/mrv/http";
import { parseMrvReportRequest } from "@/lib/server/mrv/validation";

const MAX_REQUEST_BYTES = 4_096;

export const POST = createMrvPrivateHandler(
  async (request) => {
    if (!isMrvSameOrigin(request)) {
      return Response.json(
        { error: "Permintaan harus berasal dari situs yang sama." },
        { status: 403 },
      );
    }

    const contentType = request.headers
      .get("Content-Type")
      ?.split(";")[0]
      .trim()
      .toLowerCase();

    if (contentType !== "application/json") {
      return Response.json(
        { error: "Content-Type application/json diperlukan." },
        { status: 415 },
      );
    }

    const contentLength = Number(request.headers.get("Content-Length"));

    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return Response.json(
        { error: "Ukuran permintaan terlalu besar." },
        { status: 413 },
      );
    }

    const boundedBody = await readBoundedRequestBody(
      request,
      MAX_REQUEST_BYTES,
    );

    if (!boundedBody.ok) {
      const error =
        boundedBody.reason === "too_large"
          ? "Ukuran permintaan terlalu besar."
          : boundedBody.reason === "invalid_utf8"
            ? "Encoding UTF-8 tidak valid."
            : "Body permintaan tidak dapat dibaca.";

      return Response.json(
        { error },
        { status: boundedBody.reason === "too_large" ? 413 : 400 },
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(boundedBody.text) as unknown;
    } catch {
      return Response.json({ error: "JSON tidak valid." }, { status: 400 });
    }

    const parsed = parseMrvReportRequest(body);

    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    const report = await generateMrvReport(parsed.value);

    if (!report) {
      return Response.json(
        { error: "Zona tidak ditemukan atau belum disetujui." },
        { status: 404 },
      );
    }

    return Response.json(report);
  },
  {
    authorize: (request) =>
      requireRole(["POSKO", "VERIFIKATOR"], request.headers),
    failureMessage: "Laporan MRV belum dapat dibuat.",
  },
);
