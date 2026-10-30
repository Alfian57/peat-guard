import { getPublicMapData } from "@/lib/public/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getPublicMapData();

    return Response.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Data peta belum dapat dimuat." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
