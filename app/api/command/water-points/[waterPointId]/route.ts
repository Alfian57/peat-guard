import { requireRole } from "@/lib/authz";
import {
  commandErrorResponse,
  CommandApiError,
  jsonResponse,
  isUuid,
  readJsonObject,
} from "@/lib/server/command/http";
import {
  deleteCommandWaterPoint,
  getCommandWaterPoint,
  updateCommandWaterPoint,
} from "@/lib/server/water/data";
import { parseUpdateWaterPointInput } from "@/lib/server/water/validation";

type RouteContext = { params: Promise<{ waterPointId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireRole(["POSKO"]);
    const { waterPointId } = await context.params;
    assertWaterPointId(waterPointId);

    return jsonResponse({
      waterPoint: await getCommandWaterPoint(waterPointId),
    });
  } catch (error) {
    return commandErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireRole(["POSKO"]);
    const { waterPointId } = await context.params;
    assertWaterPointId(waterPointId);
    const input = parseUpdateWaterPointInput(await readJsonObject(request));
    const waterPoint = await updateCommandWaterPoint(waterPointId, input);

    return jsonResponse({ waterPoint });
  } catch (error) {
    return commandErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireRole(["POSKO"]);
    const { waterPointId } = await context.params;
    assertWaterPointId(waterPointId);
    await deleteCommandWaterPoint(waterPointId);

    return jsonResponse({ deleted: true });
  } catch (error) {
    return commandErrorResponse(error);
  }
}

function assertWaterPointId(waterPointId: string): void {
  if (!isUuid(waterPointId)) {
    throw new CommandApiError(
      400,
      "invalid_water_point_id",
      "ID titik sumber air tidak valid.",
    );
  }
}
