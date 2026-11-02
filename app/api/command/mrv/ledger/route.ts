import { requireRole } from "@/lib/authz";
import { getMrvLedger } from "@/lib/server/mrv/data";
import { createMrvPrivateHandler } from "@/lib/server/mrv/http";
import { parseLedgerFilters } from "@/lib/server/mrv/validation";

export const GET = createMrvPrivateHandler(
  async (request) => {
    const parsed = parseLedgerFilters(new URL(request.url).searchParams);

    if (!parsed.ok) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    return Response.json(await getMrvLedger(parsed.value));
  },
  {
    authorize: (request) => requireRole(["VERIFIKATOR"], request.headers),
  },
);
