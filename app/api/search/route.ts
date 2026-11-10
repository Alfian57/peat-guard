import { requireRole } from "@/lib/authz";
import { isAppRole } from "@/lib/roles";
import { parseGlobalSearchInput } from "@/lib/server/search/input";
import { searchWorkspace } from "@/lib/server/search/data";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await requireRole(["RELAWAN", "POSKO", "VERIFIKATOR"]);
    if (!isAppRole(session.user.role)) {
      return Response.json(
        { error: "Sesi tidak valid." },
        { status: 403, headers: PRIVATE_HEADERS },
      );
    }

    const parsed = parseGlobalSearchInput(new URL(request.url).searchParams);
    if (!parsed.ok) {
      return Response.json(
        { error: parsed.message },
        { status: 400, headers: PRIVATE_HEADERS },
      );
    }

    const results = await searchWorkspace(
      parsed.value.query,
      session.user.role,
      session.user.id,
    );
    return Response.json({ results }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error.status === 401 || error.status === 403)
        ? error.status
        : 500;
    return Response.json(
      {
        error:
          status === 500 ? "Pencarian belum tersedia." : "Sesi tidak tersedia.",
      },
      { status, headers: PRIVATE_HEADERS },
    );
  }
}
