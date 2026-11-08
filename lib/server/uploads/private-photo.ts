import "server-only";

import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

import sharp from "sharp";

export const MAX_REPORT_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_NORMALIZED_PHOTO_BYTES = 6 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_IMAGE_DIMENSION = 1280;
const VALID_PHOTO_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/i;

export class ReportPhotoError extends Error {
  constructor(
    readonly status: 400 | 413,
    message: string,
  ) {
    super(message);
    this.name = "ReportPhotoError";
  }
}

export type NormalizedReportPhoto = {
  bytes: Buffer;
  width: number;
  height: number;
};

export function getPrivateUploadsDirectory(): string {
  const configuredDirectory = process.env.UPLOADS_DIR?.trim();
  return resolve(
    /*turbopackIgnore: true*/ configuredDirectory ||
      join(process.cwd(), ".data", "uploads"),
  );
}

function imageFormatFromSignature(bytes: Buffer): "jpeg" | "webp" | null {
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

export async function normalizeReportPhoto(
  file: File,
): Promise<NormalizedReportPhoto> {
  if (file.size > MAX_REPORT_PHOTO_BYTES) {
    throw new ReportPhotoError(
      413,
      "The report photo exceeds the upload limit.",
    );
  }

  if (
    file.size === 0 ||
    file.name.trim().length === 0 ||
    file.name.length > 255
  ) {
    throw new ReportPhotoError(400, "A valid report photo is required.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const signatureFormat = imageFormatFromSignature(bytes);
  const declaredFormat =
    file.type === "image/jpeg"
      ? "jpeg"
      : file.type === "image/webp"
        ? "webp"
        : null;

  if (!signatureFormat || signatureFormat !== declaredFormat) {
    throw new ReportPhotoError(
      400,
      "The report photo must be a JPEG or WebP image.",
    );
  }

  try {
    const image = sharp(bytes, {
      failOn: "warning",
      limitInputPixels: MAX_IMAGE_PIXELS,
      animated: false,
    });
    const metadata = await image.metadata();

    if (
      metadata.format !== signatureFormat ||
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > MAX_IMAGE_PIXELS ||
      (metadata.pages !== undefined && metadata.pages > 1)
    ) {
      throw new ReportPhotoError(
        400,
        "The report photo is not a supported still image.",
      );
    }

    const normalized = await image
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    if (normalized.data.byteLength > MAX_NORMALIZED_PHOTO_BYTES) {
      throw new ReportPhotoError(
        413,
        "The normalized report photo exceeds the storage limit.",
      );
    }

    return {
      bytes: normalized.data,
      width: normalized.info.width,
      height: normalized.info.height,
    };
  } catch (error) {
    if (error instanceof ReportPhotoError) throw error;
    throw new ReportPhotoError(400, "The report photo could not be decoded.");
  }
}

export async function savePrivateReportPhoto(
  bytes: Buffer,
  directory = getPrivateUploadsDirectory(),
): Promise<string> {
  const fileName = `${randomUUID()}.webp`;
  const filePath = join(directory, fileName);

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  try {
    await writeFile(filePath, bytes, { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (isNodeError(error) && error.code === "EEXIST") throw error;
    try {
      await rm(filePath, { force: true });
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Private report photo write failed and its partial file could not be removed.",
      );
    }

    throw error;
  }

  return fileName;
}

export async function removePrivateReportPhoto(
  fileName: string,
  directory = getPrivateUploadsDirectory(),
): Promise<void> {
  if (!VALID_PHOTO_NAME.test(fileName)) {
    throw new Error(
      "Refusing to remove a path outside private report storage.",
    );
  }

  await rm(/*turbopackIgnore: true*/ join(directory, fileName), {
    force: true,
  });
}

export async function readPrivateReportPhoto(
  fileName: string,
  directory = getPrivateUploadsDirectory(),
): Promise<Buffer | null> {
  if (!VALID_PHOTO_NAME.test(fileName)) return null;

  try {
    return await readFile(/*turbopackIgnore: true*/ join(directory, fileName));
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return null;
    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
