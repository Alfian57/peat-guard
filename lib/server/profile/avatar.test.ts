import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "bun:test";
import sharp from "sharp";

import {
  normalizeProfileAvatar,
  profileAvatarFileName,
  ProfileAvatarError,
} from "./avatar";

describe("profile avatar processing", () => {
  it("uses the tracked demo portrait through the same square WebP normalizer", async () => {
    const source = await readFile(
      join(
        process.cwd(),
        "prisma",
        "seed-assets",
        "profile-avatars",
        "relawan-demo.webp",
      ),
    );
    const normalized = await normalizeProfileAvatar(source, "image/webp");
    const metadata = await sharp(normalized).metadata();

    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(512);
    expect(metadata.height).toBe(512);
  });

  it("rejects bytes whose signature does not match a supported image", async () => {
    await expect(
      normalizeProfileAvatar(Buffer.from("not an image"), "image/webp"),
    ).rejects.toBeInstanceOf(ProfileAvatarError);
  });

  it("accepts only profile avatar file names, not report photo names", () => {
    expect(
      profileAvatarFileName(
        "/api/profile/avatar/avatar-61000000-0000-4000-8000-000000000001.webp",
      ),
    ).toBe("avatar-61000000-0000-4000-8000-000000000001.webp");
    expect(
      profileAvatarFileName(
        "/api/profile/avatar/61000000-0000-4000-8000-000000000001.webp",
      ),
    ).toBeNull();
  });
});
