import { requireRole } from "@/lib/authz";
import { commandErrorResponse, isUuid } from "@/lib/server/command/http";
import { publishMrvDocument } from "@/lib/server/mrv/documents";
import {
  createMrvPrivateHandler,
  isMrvSameOrigin,
} from "@/lib/server/mrv/http";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return createMrvPrivateHandler<Awaited<ReturnType<typeof requireRole>>>(
    async (req, { user }) => {
      const { id } = await context.params;
      if (!isMrvSameOrigin(req))
        return Response.json(
          { error: "Permintaan harus berasal dari situs yang sama." },
          { status: 403 },
        );
      if (!isUuid(id))
        return Response.json(
          { error: "ID dokumen tidak valid." },
          { status: 400 },
        );
      try {
        return Response.json(await publishMrvDocument(id, user.id));
      } catch (error) {
        return commandErrorResponse(error);
      }
    },
    { authorize: (req) => requireRole(["VERIFIKATOR"], req.headers) },
  )(request);
}
