import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import sharp from "sharp";

import { API_ROUTES } from "@/lib/routes";

export const MAX_PROFILE_AVATAR_BYTES = 8 * 1024 * 1024;
const MAX_AVATAR_PIXELS = 40_000_000;
const MAX_NORMALIZED_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_FILE_NAME =
  /^avatar-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;

export class ProfileAvatarError extends Error {
  constructor(
    readonly status: 400 | 413,
    message: string,
  ) {
    super(message);
    this.name = "ProfileAvatarError";
  }
}

export function getProfileUploadsDirectory(): string {
  return resolve(
    /*turbopackIgnore: true*/
    process.env.UPLOADS_DIR?.trim() || join(process.cwd(), ".data", "uploads"),
  );
}

export async function normalizeProfileAvatar(
  bytes: Buffer,
  mimeType: string,
): Promise<Buffer> {
  if (bytes.byteLength === 0) {
    throw new ProfileAvatarError(400, "Pilih foto profil terlebih dahulu.");
  }
  if (bytes.byteLength > MAX_PROFILE_AVATAR_BYTES) {
    throw new ProfileAvatarError(413, "Ukuran foto maksimal 8 MB.");
  }

  const format = imageFormat(bytes);
  if (
    !format ||
    (mimeType !== "image/jpeg" && mimeType !== "image/webp") ||
    (format === "jpeg" && mimeType !== "image/jpeg") ||
    (format === "webp" && mimeType !== "image/webp")
  ) {
    throw new ProfileAvatarError(400, "Foto harus berformat JPEG atau WebP.");
  }

  try {
    const image = sharp(bytes, {
      animated: false,
      failOn: "warning",
      limitInputPixels: MAX_AVATAR_PIXELS,
    });
    const metadata = await image.metadata();

    if (
      metadata.format !== format ||
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_AVATAR_PIXELS ||
      (metadata.pages !== undefined && metadata.pages > 1)
    ) {
      throw new ProfileAvatarError(400, "Foto profil tidak dapat diproses.");
    }

    const normalized = await image
      .rotate()
      .resize(512, 512, { fit: "cover", position: "attention" })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    if (normalized.byteLength > MAX_NORMALIZED_AVATAR_BYTES) {
      throw new ProfileAvatarError(
        413,
        "Foto profil hasil proses terlalu besar.",
      );
    }
    return normalized;
  } catch (error) {
    if (error instanceof ProfileAvatarError) throw error;
    throw new ProfileAvatarError(400, "Foto profil tidak dapat diproses.");
  }
}

export async function savePrivateProfileAvatar(
  bytes: Buffer,
  directory = getProfileUploadsDirectory(),
): Promise<string> {
  const fileName = `avatar-${randomUUID()}.webp`;
  const filePath = join(directory, fileName);
  await mkdir(/*turbopackIgnore: true*/ directory, {
    recursive: true,
    mode: 0o700,
  });
  await chmod(/*turbopackIgnore: true*/ directory, 0o700);
  try {
    await writeFile(/*turbopackIgnore: true*/ filePath, bytes, {
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    try {
      await rm(/*turbopackIgnore: true*/ filePath, { force: true });
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Private profile avatar write failed and its partial file could not be removed.",
      );
    }
    throw error;
  }
  return fileName;
}

export async function removePrivateProfileAvatar(
  fileName: string,
  directory = getProfileUploadsDirectory(),
): Promise<void> {
  if (!AVATAR_FILE_NAME.test(fileName)) {
    throw new Error(
      "Refusing to remove a file outside profile avatar storage.",
    );
  }
  await rm(/*turbopackIgnore: true*/ join(directory, fileName), {
    force: true,
  });
}

export async function readPrivateProfileAvatar(
  fileName: string,
  directory = getProfileUploadsDirectory(),
): Promise<Buffer | null> {
  if (!AVATAR_FILE_NAME.test(fileName)) return null;
  try {
    return await readFile(/*turbopackIgnore: true*/ join(directory, fileName));
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return null;
    throw error;
  }
}

export function profileAvatarFileName(imageUrl: string | null): string | null {
  if (!imageUrl?.startsWith(API_ROUTES.profile.avatarPrefix)) return null;
  const fileName = imageUrl.slice(API_ROUTES.profile.avatarPrefix.length);
  return AVATAR_FILE_NAME.test(fileName) ? fileName : null;
}

function imageFormat(bytes: Buffer): "jpeg" | "webp" | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
