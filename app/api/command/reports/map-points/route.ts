import { requireRole } from "@/lib/authz";
import { commandErrorResponse, jsonResponse } from "@/lib/server/command/http";
import { getCommandReportMapPoints } from "@/lib/server/command/report-map";
import { parseReportMapFilters } from "@/lib/server/command/report-map-input";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireRole(["POSKO"]);
    const filters = parseReportMapFilters(new URL(request.url).searchParams);
    const result = await getCommandReportMapPoints(session.user.role, filters);
    return jsonResponse(result);
  } catch (error) {
    return commandErrorResponse(error);
  }
}
