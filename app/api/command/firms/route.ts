import { requireRole } from "@/lib/authz";
import { commandErrorResponse, jsonResponse } from "@/lib/server/command/http";
import { getFirmsSyncStatus } from "@/lib/server/firms/repository";

export async function GET() {
  try {
    await requireRole(["POSKO"]);
    const configured = Boolean(process.env.NASA_FIRMS_MAP_KEY?.trim());

    return jsonResponse(await getFirmsSyncStatus(configured));
  } catch (error) {
    return commandErrorResponse(error);
  }
}
