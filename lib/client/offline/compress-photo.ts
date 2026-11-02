import { MAX_COMPRESSED_PHOTO_BYTES, MAX_PHOTO_DIMENSION } from "./types";

type CompressedPhoto = {
  blob: Blob;
  fileName: string;
};

const SUPPORTED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Browser gagal mengompres foto."));
        }
      },
      type,
      quality,
    );
  });
}

export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  if (!SUPPORTED_PHOTO_TYPES.has(file.type)) {
    throw new Error("Pilih berkas foto dengan format gambar.");
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_PHOTO_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("Browser tidak dapat menyiapkan kompresi foto.");
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let blob = await canvasToBlob(canvas, "image/webp", 0.82);
    if (blob.type !== "image/webp") {
      blob = await canvasToBlob(canvas, "image/jpeg", 0.84);
    }

    if (blob.size > MAX_COMPRESSED_PHOTO_BYTES) {
      blob = await canvasToBlob(canvas, "image/jpeg", 0.68);
    }
    if (blob.size > MAX_COMPRESSED_PHOTO_BYTES) {
      throw new Error(
        "Foto masih terlalu besar setelah dikompres. Pilih foto yang lebih kecil.",
      );
    }

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    return { blob, fileName: `peatguard-${Date.now()}.${extension}` };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Foto masih")) {
      throw error;
    }
    throw new Error("Foto tidak dapat diproses. Coba pilih foto lain.");
  } finally {
    bitmap?.close();
  }
}
