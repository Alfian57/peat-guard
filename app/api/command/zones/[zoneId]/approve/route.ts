import { requireRole } from "@/lib/authz";
import {
  commandErrorResponse,
  CommandApiError,
  jsonResponse,
  isUuid,
  readJsonObject,
} from "@/lib/server/command/http";
import { approveCommandZone } from "@/lib/server/zones/data";

type RouteContext = { params: Promise<{ zoneId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(["VERIFIKATOR"]);
    const { zoneId } = await context.params;

    if (!isUuid(zoneId)) {
      throw new CommandApiError(400, "invalid_zone_id", "ID zona tidak valid.");
    }

    const { expectedRevision } = await readJsonObject(request);
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
