import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { isReportUuid } from "@/lib/server/reports/read";
import {
  privateJsonResponse,
  reportErrorResponse,
} from "@/lib/server/reports/http";

export async function GET(
  request: Request,
  context: { params: Promise<{ clientReportId: string }> },
) {
  try {
    const { user } = await requireRole(["RELAWAN"], request.headers);
    const { clientReportId } = await context.params;
    if (!isReportUuid(clientReportId))
      return privateJsonResponse({ error: "ID draf tidak valid." }, 400);
    const report = await prisma.fieldReport.findUnique({
      where: {
        reporterId_clientReportId: { reporterId: user.id, clientReportId },
      },
      select: { id: true },
    });
    if (!report)
      return privateJsonResponse({ error: "Belum diterima Posko." }, 404);
    return privateJsonResponse(report);
  } catch (error) {
    return reportErrorResponse(error);
  }
}
