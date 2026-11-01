import { requireRole } from "@/lib/authz";
import {
  reportActorFromSession,
  REPORT_READ_ROLES,
} from "@/lib/server/reports/access";
import {
  privateJsonResponse,
  reportErrorResponse,
} from "@/lib/server/reports/http";
import {
  isReportUuid,
  getPrivateReportDetail,
} from "@/lib/server/reports/read";
import { updateReportStatus } from "@/lib/server/reports/status";
import { readReportStatusUpdate } from "@/lib/server/reports/status-input";
import { ReportInputError } from "@/lib/server/reports/input";

type ReportRouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function GET(
  _request: Request,
  context: ReportRouteContext,
): Promise<Response> {
  try {
    const session = await requireRole(REPORT_READ_ROLES);
    const actor = reportActorFromSession(session.user);
    const { reportId } = await context.params;
    if (!isReportUuid(reportId)) {
      throw new ReportInputError(400, "The report ID must be a UUID.");
    }

    const report = await getPrivateReportDetail(actor, reportId);
    return privateJsonResponse({ report });
  } catch (error) {
    return reportErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  context: ReportRouteContext,
): Promise<Response> {
  try {
    const session = await requireRole(["POSKO"]);
    const actor = reportActorFromSession(session.user);
    const { reportId } = await context.params;
    if (!isReportUuid(reportId)) {
      throw new ReportInputError(400, "The report ID must be a UUID.");
    }

    if (
      request.headers
        .get("content-type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/json"
    ) {
      throw new ReportInputError(400, "The status request must use JSON.");
    }

    const input = await readReportStatusUpdate(request);
    const result = await updateReportStatus(actor, reportId, input);
    return privateJsonResponse(result);
  } catch (error) {
    return reportErrorResponse(error);
  }
}
