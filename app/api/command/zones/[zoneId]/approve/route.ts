import { requireRole } from "@/lib/authz";
import {
  commandErrorResponse,
  CommandApiError,
  jsonResponse,
  isUuid,
  readJsonObject,
} from "@/lib/server/command/http";
import { isMrvSameOrigin } from "@/lib/server/mrv/http";
import {
  approveCommandZone,
  requestZoneRevision,
} from "@/lib/server/zones/data";

type RouteContext = { params: Promise<{ zoneId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(["VERIFIKATOR"]);
    const { zoneId } = await context.params;

    if (!isUuid(zoneId)) {
      throw new CommandApiError(400, "invalid_zone_id", "ID zona tidak valid.");
    }

    const { expectedRevision, note, decision } = await readJsonObject(request);
    if (
      typeof expectedRevision !== "number" ||
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 0
    ) {
      throw new CommandApiError(
        400,
        "invalid_zone_revision",
        "Revisi zona tidak valid.",
      );
    }

    if (decision === "REQUEST_CHANGES") {
      if (!isMrvSameOrigin(request))
        throw new CommandApiError(
          403,
          "invalid_origin",
          "Permintaan harus berasal dari situs yang sama.",
        );
      if (typeof note !== "string" || !note.trim() || note.length > 500)
        throw new CommandApiError(
          400,
          "invalid_review_note",
          "Tulis catatan revisi (maksimal 500 karakter).",
        );
      await requestZoneRevision(
        zoneId,
        session.user.id,
        expectedRevision,
        note.trim(),
      );
      return jsonResponse({ requestedChanges: true });
    }
    if (decision !== undefined && decision !== "APPROVE")
      throw new CommandApiError(
        400,
        "invalid_review_decision",
        "Keputusan verifikasi tidak valid.",
      );

    const result = await approveCommandZone(
      zoneId,
      session.user.id,
      expectedRevision,
    );

    return jsonResponse(result, result.alreadyApproved ? 200 : 201);
  } catch (error) {
    return commandErrorResponse(error);
  }
}
