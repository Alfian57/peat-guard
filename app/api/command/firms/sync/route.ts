import { requireRole } from "@/lib/authz";
import { commandErrorResponse, jsonResponse } from "@/lib/server/command/http";
import { FirmsSyncError, syncNasaFirms } from "@/lib/server/firms/sync";

export async function POST() {
  try {
    const session = await requireRole(["POSKO"]);
    const result = await syncNasaFirms(session.user.id);

    return jsonResponse(result);
  } catch (error) {
    if (error instanceof FirmsSyncError) {
      return jsonResponse(
        {
          error: error.code,
          message:
            error.code === "storage_unavailable"
              ? "Penyimpanan hotspot belum dapat diperbarui. Data sebelumnya tetap tersedia."
              : "NASA FIRMS belum dapat dijangkau. Data hotspot sebelumnya tetap tersedia.",
        },
        error.status,
      );
    }

    return commandErrorResponse(error);
  }
}
