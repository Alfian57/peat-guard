import { requireRole } from "@/lib/authz";
import { getMrvDashboard } from "@/lib/server/mrv/data";
import { createMrvPrivateHandler } from "@/lib/server/mrv/http";
import { parseDashboardFilters } from "@/lib/server/mrv/validation";

export const GET = createMrvPrivateHandler(
  async (request) => {
    const parsed = parseDashboardFilters(new URL(request.url).searchParams);

    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    const dashboard = await getMrvDashboard(parsed.value);
    return Response.json(dashboard);
  },
  {
    authorize: (request) => requireRole(["VERIFIKATOR"], request.headers),
  },
);
