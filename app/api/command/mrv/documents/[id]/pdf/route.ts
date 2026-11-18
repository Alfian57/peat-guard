import { requireRole } from "@/lib/authz";
import { isUuid } from "@/lib/server/command/http";
import { getMrvPdf } from "@/lib/server/mrv/documents";
import { createMrvPrivateHandler } from "@/lib/server/mrv/http";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return createMrvPrivateHandler(
    async () => {
      const { id } = await context.params;
      const pdf = isUuid(id) ? await getMrvPdf(id) : null;
      if (!pdf)
        return Response.json(
          { error: "Dokumen terbit tidak ditemukan." },
          { status: 404 },
        );
      return new Response(new Uint8Array(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="peatguard-mrv-${id}.pdf"`,
        },
      });
    },
    { authorize: (req) => requireRole(["POSKO", "VERIFIKATOR"], req.headers) },
  )(request);
}
