import { requireRole } from "@/lib/authz";
import { APP_ROLES } from "@/lib/roles";
import { API_ROUTES } from "@/lib/routes";
import { prisma } from "@/lib/prisma";
import {
  normalizeProfileAvatar,
  ProfileAvatarError,
  profileAvatarFileName,
  removePrivateProfileAvatar,
  savePrivateProfileAvatar,
} from "@/lib/server/profile/avatar";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function PUT(request: Request): Promise<Response> {
  let savedFileName: string | null = null;
  try {
    const session = await requireRole(APP_ROLES);
    const contentType =
      request.headers.get("content-type")?.toLowerCase() ?? "";
    const contentLength = Number(request.headers.get("content-length"));
    if (
      Number.isFinite(contentLength) &&
      contentLength > 8 * 1024 * 1024 + 128 * 1024
    ) {
      return Response.json(
        { error: "Ukuran unggahan terlalu besar." },
        { status: 413, headers: PRIVATE_HEADERS },
      );
    }
    if (!contentType.startsWith("multipart/form-data;")) {
      return Response.json(
        { error: "Unggah foto dengan formulir yang valid." },
        { status: 400, headers: PRIVATE_HEADERS },
      );
    }

    const form = await request.formData();
    const file = form.get("avatar");
    if (!(file instanceof File)) {
      return Response.json(
        { error: "Pilih foto profil terlebih dahulu." },
        { status: 400, headers: PRIVATE_HEADERS },
      );
    }

    const normalized = await normalizeProfileAvatar(
      Buffer.from(await file.arrayBuffer()),
      file.type,
    );
    savedFileName = await savePrivateProfileAvatar(normalized);
    const avatarUrl = API_ROUTES.profile.avatar(savedFileName);
    const previous = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });
    if (!previous) {
      await removePrivateProfileAvatar(savedFileName);
      return Response.json(
        { error: "Akun tidak ditemukan." },
        { status: 404, headers: PRIVATE_HEADERS },
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: avatarUrl },
      select: { id: true },
    });
    const previousFileName = profileAvatarFileName(previous.image);
    if (previousFileName) {
      try {
        await removePrivateProfileAvatar(previousFileName);
      } catch {
        // The account already points to the new private avatar.
      }
    }
    savedFileName = null;

    return Response.json({ image: avatarUrl }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    if (savedFileName) {
      try {
        await removePrivateProfileAvatar(savedFileName);
      } catch {
        // Keep the response generic; a later fresh reset also clears stale uploads.
      }
    }
    if (error instanceof ProfileAvatarError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers: PRIVATE_HEADERS },
      );
    }
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
            ? "Foto profil belum dapat disimpan."
            : "Sesi tidak tersedia.",
      },
      { status, headers: PRIVATE_HEADERS },
    );
  }
}
