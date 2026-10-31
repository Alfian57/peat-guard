import { requireRole } from "@/lib/authz";
import {
  commandErrorResponse,
  CommandApiError,
  jsonResponse,
  isUuid,
} from "@/lib/server/command/http";
import { approveCommandZone } from "@/lib/server/zones/data";

type RouteContext = { params: Promise<{ zoneId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireRole(["VERIFIKATOR"]);
    const { zoneId } = await context.params;

    if (!isUuid(zoneId)) {
      throw new CommandApiError(400, "invalid_zone_id", "ID zona tidak valid.");
    }

    const result = await approveCommandZone(zoneId, session.user.id);

    return jsonResponse(result, result.alreadyApproved ? 200 : 201);
  } catch (error) {
    return commandErrorResponse(error);
  }
}
