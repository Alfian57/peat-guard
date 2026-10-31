import { requireRole } from "@/lib/authz";
import {
  commandErrorResponse,
  jsonResponse,
  readJsonObject,
} from "@/lib/server/command/http";
import { createCommandZone, listCommandZones } from "@/lib/server/zones/data";
import { parseCreateZoneInput } from "@/lib/server/zones/validation";

export async function GET() {
  try {
    await requireRole(["POSKO"]);
    return jsonResponse({ zones: await listCommandZones() });
  } catch (error) {
    return commandErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole(["POSKO"]);
    const input = parseCreateZoneInput(await readJsonObject(request));
    const zone = await createCommandZone(input, session.user.id);

    return jsonResponse({ zone }, 201);
  } catch (error) {
    return commandErrorResponse(error);
  }
}
