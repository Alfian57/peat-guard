import { requireRole } from "@/lib/authz";
import { APP_ROLES } from "@/lib/roles";
import { API_ROUTES } from "@/lib/routes";
import { prisma } from "@/lib/prisma";
import { readPrivateProfileAvatar } from "@/lib/server/profile/avatar";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  context: { params: Promise<{ fileName: string }> },
): Promise<Response> {
  try {
    const session = await requireRole(APP_ROLES);
    const { fileName } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });
    if (user?.image !== API_ROUTES.profile.avatar(fileName)) {
      return new Response(null, { status: 404, headers: PRIVATE_HEADERS });
    }

    const bytes = await readPrivateProfileAvatar(fileName);
    if (!bytes)
      return new Response(null, { status: 404, headers: PRIVATE_HEADERS });
    const body = new Uint8Array(bytes);
    return new Response(body, {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": "image/webp",
        "Content-Length": String(bytes.byteLength),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 401, headers: PRIVATE_HEADERS });
  }
}
