import { requireRole } from "@/lib/authz";
import {
  reportActorFromSession,
  REPORT_READ_ROLES,
} from "@/lib/server/reports/access";
import {
  PRIVATE_RESPONSE_HEADERS,
  ReportNotFoundError,
  reportErrorResponse,
} from "@/lib/server/reports/http";
import {
  getPrivateReportPhotoPath,
  isReportUuid,
} from "@/lib/server/reports/read";
import { ReportInputError } from "@/lib/server/reports/input";
import { readPrivateReportPhoto } from "@/lib/server/uploads/private-photo";

type ReportPhotoRouteContext = {
  params: Promise<{ reportId: string }>;
};

export async function GET(
  _request: Request,
  context: ReportPhotoRouteContext,
): Promise<Response> {
  try {
    const session = await requireRole(REPORT_READ_ROLES);
    const actor = reportActorFromSession(session.user);
    const { reportId } = await context.params;
    if (!isReportUuid(reportId)) {
      throw new ReportInputError(400, "The report ID must be a UUID.");
    }

    const photoPath = await getPrivateReportPhotoPath(actor, reportId);
    const photo = await readPrivateReportPhoto(photoPath);
    if (!photo) throw new ReportNotFoundError();

    const photoBytes = new ArrayBuffer(photo.byteLength);
    new Uint8Array(photoBytes).set(photo);

    return new Response(photoBytes, {
      headers: {
        ...PRIVATE_RESPONSE_HEADERS,
        "Content-Type": "image/webp",
        "Content-Length": String(photo.byteLength),
        "Content-Disposition": 'inline; filename="report-photo.webp"',
      },
    });
  } catch (error) {
    return reportErrorResponse(error);
  }
}
