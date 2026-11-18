import { requireRole } from "@/lib/authz";
import {
  CommandApiError,
  commandErrorResponse,
  isUuid,
  jsonResponse,
} from "@/lib/server/command/http";
import { isMrvSameOrigin } from "@/lib/server/mrv/http";
import { requeueFailedReport } from "@/lib/server/reports/ai-job";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireRole(["POSKO"], request.headers);
    const { id } = await context.params;
    if (!isMrvSameOrigin(request))
      throw new CommandApiError(
        403,
        "invalid_origin",
        "Permintaan harus berasal dari situs yang sama.",
      );
    if (!isUuid(id))
      throw new CommandApiError(
        400,
        "invalid_report",
        "ID laporan tidak valid.",
      );
    await requeueFailedReport(id, user.id);
    return jsonResponse({ status: "PENDING" }, 202);
  } catch (error) {
    return commandErrorResponse(error);
  }
}
