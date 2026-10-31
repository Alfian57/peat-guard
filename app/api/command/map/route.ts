import { requireRole } from "@/lib/authz";
import { commandErrorResponse, jsonResponse } from "@/lib/server/command/http";
import { getCommandMapData } from "@/lib/server/command/map";

export async function GET() {
  try {
    await requireRole(["POSKO"]);

    return jsonResponse(await getCommandMapData());
  } catch (error) {
    return commandErrorResponse(error);
  }
}
