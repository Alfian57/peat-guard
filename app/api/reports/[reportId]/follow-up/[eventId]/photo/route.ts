import { requireRole } from "@/lib/authz";
import { isUuid } from "@/lib/server/command/http";
import { getSupplementPhotoPath } from "@/lib/server/mrv/follow-up";
import {
  reportActorFromSession,
  REPORT_READ_ROLES,
} from "@/lib/server/reports/access";
import {
  PRIVATE_RESPONSE_HEADERS,
  ReportNotFoundError,
  reportErrorResponse,
} from "@/lib/server/reports/http";
import { readPrivateReportPhoto } from "@/lib/server/uploads/private-photo";

export async function GET(
  request: Request,
  context: { params: Promise<{ reportId: string; eventId: string }> },
) {
  try {
    const session = await requireRole(REPORT_READ_ROLES, request.headers);
    const { reportId, eventId } = await context.params;
    const path =
      isUuid(reportId) && isUuid(eventId)
        ? await getSupplementPhotoPath(
            reportActorFromSession(session.user),
            reportId,
            eventId,
          )
        : null;
    const photo = path ? await readPrivateReportPhoto(path) : null;
    if (!photo) throw new ReportNotFoundError();
    return new Response(new Uint8Array(photo), {
      headers: {
        ...PRIVATE_RESPONSE_HEADERS,
        "Content-Type": "image/webp",
        "Content-Disposition": 'inline; filename="bukti-tambahan.webp"',
      },
    });
  } catch (error) {
    return reportErrorResponse(error);
  }
}
