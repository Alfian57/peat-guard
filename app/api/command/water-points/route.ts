import { requireRole } from "@/lib/authz";
import {
  commandErrorResponse,
  jsonResponse,
  readJsonObject,
} from "@/lib/server/command/http";
import {
  createCommandWaterPoint,
  listCommandWaterPoints,
} from "@/lib/server/water/data";
import { parseCreateWaterPointInput } from "@/lib/server/water/validation";

export async function GET() {
  try {
    await requireRole(["POSKO"]);
    return jsonResponse({ waterPoints: await listCommandWaterPoints() });
  } catch (error) {
    return commandErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["POSKO"]);
    const input = parseCreateWaterPointInput(await readJsonObject(request));
    const waterPoint = await createCommandWaterPoint(input);

    return jsonResponse({ waterPoint }, 201);
  } catch (error) {
    return commandErrorResponse(error);
  }
}
