import { requireRole } from "@/lib/authz";
import { APP_ROLES } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { parseProfileUpdateInput } from "@/lib/server/profile/input";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function PATCH(request: Request): Promise<Response> {
  try {
    const session = await requireRole(APP_ROLES);
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > 16 * 1024) {
      return Response.json(
        { error: "Data profil terlalu besar." },
        { status: 413, headers: PRIVATE_HEADERS },
      );
    }
    const role = session.user.role;
    if (!APP_ROLES.includes(role as (typeof APP_ROLES)[number])) {
      return Response.json({ error: "Sesi tidak valid." }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Data profil tidak valid." },
        { status: 400 },
      );
    }

    const parsed = parseProfileUpdateInput(body, role === "RELAWAN");
    if (!parsed.ok) {
      return Response.json({ error: parsed.message }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.value.name,
        ...(role === "RELAWAN"
          ? { villageName: parsed.value.villageName }
          : {}),
      },
      select: { name: true, villageName: true },
    });

    return Response.json(updated, { headers: PRIVATE_HEADERS });
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
          status === 500
            ? "Profil belum dapat diperbarui."
            : "Sesi tidak tersedia.",
      },
      { status, headers: PRIVATE_HEADERS },
    );
  }
}
