import { requireRole } from "@/lib/authz";
import {
  CommandApiError,
  commandErrorResponse,
  jsonResponse,
  readJsonObject,
} from "@/lib/server/command/http";
import { isMrvSameOrigin } from "@/lib/server/mrv/http";
import {
  createCarbonParameters,
  listCarbonParameters,
} from "@/lib/server/mrv/parameters";

export async function GET(request: Request) {
  try {
    await requireRole(["POSKO", "VERIFIKATOR"], request.headers);
    return jsonResponse({ parameters: await listCarbonParameters() });
  } catch (error) {
    return commandErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireRole(["VERIFIKATOR"], request.headers);
    if (!isMrvSameOrigin(request))
      throw new CommandApiError(
        403,
        "invalid_origin",
        "Permintaan harus berasal dari situs yang sama.",
      );
    return jsonResponse(
      await createCarbonParameters(await readJsonObject(request), user.id),
      201,
    );
  } catch (error) {
    return commandErrorResponse(error);
  }
}
