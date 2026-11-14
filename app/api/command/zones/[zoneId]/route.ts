import { requireRole } from "@/lib/authz";
import {
  commandErrorResponse,
  CommandApiError,
  jsonResponse,
  isUuid,
  readJsonObject,
} from "@/lib/server/command/http";
import {
  archiveCommandZone,
  getCommandZone,
  updateCommandZone,
} from "@/lib/server/zones/data";
import { parseUpdateZoneInput } from "@/lib/server/zones/validation";

type RouteContext = { params: Promise<{ zoneId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireRole(["POSKO"]);
    const { zoneId } = await context.params;
    assertZoneId(zoneId);

    return jsonResponse({ zone: await getCommandZone(zoneId) });
  } catch (error) {
    return commandErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireRole(["POSKO"]);
    const { zoneId } = await context.params;
    assertZoneId(zoneId);
    const input = parseUpdateZoneInput(await readJsonObject(request));
    const zone = await updateCommandZone(zoneId, input, session.user.id);

    return jsonResponse({ zone });
  } catch (error) {
    return commandErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireRole(["POSKO"]);
    const { zoneId } = await context.params;
    assertZoneId(zoneId);
    await archiveCommandZone(zoneId, session.user.id);

    return jsonResponse({ deleted: true });
  } catch (error) {
    return commandErrorResponse(error);
  }
}

function assertZoneId(zoneId: string): void {
  if (!isUuid(zoneId)) {
    throw new CommandApiError(400, "invalid_zone_id", "ID zona tidak valid.");
  }
}
