import { requireRole } from "@/lib/authz";
import { CommandApiError, isUuid } from "@/lib/server/command/http";
import { recordEvidenceSupplement } from "@/lib/server/mrv/follow-up";
import { isMrvSameOrigin } from "@/lib/server/mrv/http";
import { reportActorFromSession } from "@/lib/server/reports/access";
import {
  privateJsonResponse,
  reportErrorResponse,
} from "@/lib/server/reports/http";
import { readReportFormData } from "@/lib/server/reports/input";

export async function POST(
  request: Request,
  context: { params: Promise<{ reportId: string }> },
) {
  try {
    const session = await requireRole(["RELAWAN"], request.headers);
    if (!isMrvSameOrigin(request))
      throw new CommandApiError(
        403,
        "invalid_origin",
        "Permintaan harus berasal dari situs yang sama.",
      );
    const { reportId } = await context.params;
    if (!isUuid(reportId))
      throw new CommandApiError(
        400,
        "invalid_report",
        "ID laporan tidak valid.",
      );
    const form = await readReportFormData(request);
    const reviewId = form.get("reviewId");
    const note = form.get("note");
    const photoValue = form.get("photo");
    const photo =
      photoValue instanceof File && photoValue.size > 0 ? photoValue : null;
    if (
      typeof reviewId !== "string" ||
      !isUuid(reviewId) ||
      typeof note !== "string" ||
      note.length > 500 ||
      (!note.trim() && !photo) ||
      (photoValue !== null && !(photoValue instanceof File))
    ) {
      throw new CommandApiError(
        400,
        "invalid_follow_up",
        "Isi penjelasan atau sertakan foto bukti tambahan.",
      );
    }
    return privateJsonResponse(
      await recordEvidenceSupplement(
        reportActorFromSession(session.user),
        reportId,
        reviewId,
        note.trim(),
        photo,
      ),
      201,
    );
  } catch (error) {
    if (error instanceof CommandApiError)
      return privateJsonResponse({ error: error.message }, error.status);
    return reportErrorResponse(error);
  }
}
