import { parsePublicMapQuery } from "@/lib/public/query";
import type { PublicMapData } from "@/lib/public/contracts";
import type { PublicMapQuery } from "@/lib/public/query";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export function createPublicMapHandler(
  loadData: (query: PublicMapQuery) => Promise<PublicMapData>,
) {
  return async function GET(request: Request): Promise<Response> {
    const parsed = parsePublicMapQuery(new URL(request.url).searchParams);

    if (!parsed.success) {
      return Response.json(
        { error: "Filter peta tidak valid.", code: parsed.code },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    try {
      const data = await loadData(parsed.data);
      return Response.json(data, { headers: NO_STORE_HEADERS });
    } catch {
      return Response.json(
        { error: "Data peta publik belum dapat dimuat." },
        { status: 503, headers: NO_STORE_HEADERS },
      );
    }
  };
}
