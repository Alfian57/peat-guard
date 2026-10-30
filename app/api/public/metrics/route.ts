import { getPublicMetrics } from "@/lib/public/data";

export async function GET() {
  try {
    const metrics = await getPublicMetrics();

    return Response.json(metrics, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Ringkasan dampak belum dapat dimuat." },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
