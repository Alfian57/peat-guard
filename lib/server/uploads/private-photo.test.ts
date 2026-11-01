import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "bun:test";
import sharp from "sharp";

import {
  MAX_REPORT_PHOTO_BYTES,
  normalizeReportPhoto,
  readPrivateReportPhoto,
  removePrivateReportPhoto,
  savePrivateReportPhoto,
} from "@/lib/server/uploads/private-photo";

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "peatguard-report-photo-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("private report photos", () => {
  test("re-encodes accepted images, scales them down, and removes EXIF metadata", async () => {
    const source = await sharp({
      create: {
        width: 1800,
        height: 900,
        channels: 3,
        background: { r: 75, g: 90, b: 40 },
      },
    })
      .jpeg()
      .withMetadata({ exif: { IFD0: { Artist: "private fixture" } } })
      .toBuffer();

    expect((await sharp(source).metadata()).exif).toBeDefined();

    const normalized = await normalizeReportPhoto(
      new File([source], "field-photo.jpg", { type: "image/jpeg" }),
    );
    const metadata = await sharp(normalized.bytes).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
    expect(normalized.width).toBeLessThanOrEqual(1280);
    expect(normalized.height).toBeLessThanOrEqual(1280);
  });

  test("rejects unsupported signatures and oversize files", async () => {
    const unsupported = new File(["not an image"], "photo.jpg", {
      type: "image/jpeg",
    });
    await expect(normalizeReportPhoto(unsupported)).rejects.toMatchObject({
      status: 400,
    });

    const oversized = new File(
      [new Uint8Array(MAX_REPORT_PHOTO_BYTES + 1)],
      "large.webp",
      { type: "image/webp" },
    );
    await expect(normalizeReportPhoto(oversized)).rejects.toMatchObject({
      status: 413,
    });
  });

  test("writes opaque private names and only reads or removes valid photo paths", async () => {
    const directory = await createTemporaryDirectory();
    const photoName = await savePrivateReportPhoto(
      Buffer.from("normalized"),
      directory,
    );

    expect(photoName).toMatch(/^[0-9a-f-]{36}\.webp$/i);
    expect(await readPrivateReportPhoto(photoName, directory)).toEqual(
      Buffer.from("normalized"),
    );
    expect(
      await readPrivateReportPhoto("../outside.webp", directory),
    ).toBeNull();
    await expect(
      removePrivateReportPhoto("../outside.webp", directory),
    ).rejects.toThrow();

    await removePrivateReportPhoto(photoName, directory);
    expect(await readPrivateReportPhoto(photoName, directory)).toBeNull();
  });
});
