import { requireRole } from "@/lib/authz";
import {
  privateJsonResponse,
  reportErrorResponse,
} from "@/lib/server/reports/http";
import {
  readReportFormData,
  ReportInputError,
} from "@/lib/server/reports/input";
import { createFieldReport } from "@/lib/server/reports/create";
import {
  reportActorFromSession,
  REPORT_READ_ROLES,
} from "@/lib/server/reports/access";
import { getPrivateReportList } from "@/lib/server/reports/read";
import { parseReportListFilters } from "@/lib/server/reports/list-input";

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireRole(REPORT_READ_ROLES);
    const actor = reportActorFromSession(session.user);
    const filters = parseReportListFilters(new URL(request.url).searchParams);
    const reportList = await getPrivateReportList(actor, filters);
    return privateJsonResponse(reportList);
  } catch (error) {
    return reportErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = await requireRole(["RELAWAN"]);
    const actor = reportActorFromSession(session.user);

    const contentType =
      request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("multipart/form-data;")) {
      throw new ReportInputError(
        400,
        "The report request must use multipart form data.",
      );
    }

    const formData = await readReportFormData(request);

    const result = await createFieldReport(actor, formData);
    const payload = { id: result.id, report: { id: result.id } };
    return privateJsonResponse(payload, result.created ? 201 : 200);
  } catch (error) {
    return reportErrorResponse(error);
  }
}
