import "dotenv/config";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

import { Prisma, PrismaClient } from "../lib/generated/prisma/client";
import { DEMO_USERS } from "../lib/demo-login";
import { DEMO_HOTSPOT_SOURCE } from "../lib/firms-sources";
import { API_ROUTES } from "../lib/routes";
import {
  normalizeProfileAvatar,
  profileAvatarFileName,
  readPrivateProfileAvatar,
  removePrivateProfileAvatar,
  restorePrivateProfileAvatar,
  savePrivateProfileAvatar,
} from "../lib/server/profile/avatar";
import { removePrivateReportPhoto } from "../lib/server/uploads/private-photo";
import { demoHotspots, demoWaterPoints, demoZones } from "./demo-data";
import { isAllowedDemoSeedTarget } from "./seed-safety";
import { seedDemoReports } from "./seed-reports";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed demo data.");
}
if (
  !isAllowedDemoSeedTarget(
    connectionString,
    process.env.NODE_ENV,
    process.env.PEATGUARD_ALLOW_REMOTE_DEMO_SEED,
  )
) {
  throw new Error(
    "db:seed is for local demo databases; remote seeding requires the explicit reset opt-in.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
const DEMO_PASSWORD = "password";
const DEMO_AVATAR_ASSETS = {
  RELAWAN: "relawan-demo.webp",
  POSKO: "posko-demo.webp",
  VERIFIKATOR: "verifikator-demo.webp",
} as const;
const HOUR_MS = 3_600_000;

async function seedAccounts(
  transaction: Prisma.TransactionClient,
  savedAvatars: string[],
): Promise<number> {
  let restoredAvatars = 0;

  for (const user of DEMO_USERS) {
    const existing = await transaction.user.findUnique({
      where: { id: user.id },
      select: { id: true, image: true, role: true },
    });

    if (existing && existing.role !== user.role) {
      throw new Error("A reserved demo user ID belongs to a different role.");
    }

    const currentAvatarFileName = profileAvatarFileName(
      existing?.image ?? null,
    );
    const shouldSeedAvatar =
      !existing ||
      !existing.image ||
      (existing.image?.startsWith(API_ROUTES.profile.avatarPrefix) === true &&
        (!currentAvatarFileName ||
          !(await readPrivateProfileAvatar(currentAvatarFileName))));

    if (shouldSeedAvatar) {
      const assetName = DEMO_AVATAR_ASSETS[user.role];
      const source = await readFile(
        join(
          process.cwd(),
          "prisma",
          "seed-assets",
          "profile-avatars",
          assetName,
        ),
      );
      const normalized = await normalizeProfileAvatar(source, "image/webp");
      if (existing && currentAvatarFileName) {
        if (
          await restorePrivateProfileAvatar(currentAvatarFileName, normalized)
        ) {
          restoredAvatars += 1;
        }
      } else {
        const avatar = await savePrivateProfileAvatar(normalized);
        savedAvatars.push(avatar);
        const image = API_ROUTES.profile.avatar(avatar);
        if (existing) {
          await transaction.user.update({
            where: { id: user.id },
            data: { image },
          });
        } else {
          await transaction.user.create({
            data: {
              ...user,
              emailVerified: true,
              image,
            },
          });
        }
      }
    }

    const key = { providerId: "credential", accountId: user.id };
    const credential = await transaction.account.findUnique({
      where: { providerId_accountId: key },
      select: { userId: true },
    });
    if (credential && credential.userId !== user.id) {
      throw new Error(
        "A reserved demo credential belongs to a different user.",
      );
    }
    if (!credential) {
      await transaction.account.create({
        data: {
          ...key,
          userId: user.id,
          password: await hashPassword(DEMO_PASSWORD),
        },
      });
    }
  }

  return restoredAvatars;
}

async function seedZones(transaction: Prisma.TransactionClient, now: Date) {
  const activeParameters = await transaction.carbonParameterSet.findFirst({
    where: { isActive: true },
    select: { id: true },
  });
  const parameters = await transaction.carbonParameterSet.upsert({
    where: { name: "FigCraft demo values (illustrative)" },
    create: {
      id: "60000000-0000-4000-8000-000000000001",
      name: "FigCraft demo values (illustrative)",
      source: "Parameter sintetis untuk simulasi PEATGUARD",
      biomassFactor: 50,
      emissionFactor: 0.2,
      co2ConversionFactor: 3.67,
      incentivePerTonIdr: 15000,
      isActive: activeParameters === null,
      isDemoData: true,
    },
    update: {},
    select: { id: true, isDemoData: true },
  });
  if (!parameters.isDemoData) {
    throw new Error(
      "The reserved demo carbon parameter name is already in use.",
    );
  }

  for (const zone of demoZones) {
    await transaction.$executeRaw`
      INSERT INTO "forest_zones" (
        "id", "slug", "zone_name", "village_name", "peat_depth_meters",
        "boundary", "carbon_parameter_set_id", "is_approved", "is_demo_data", "updated_at"
      ) VALUES (
        ${zone.id}::uuid, ${zone.slug}, ${zone.name}, ${zone.village}, ${zone.depth},
        ST_MakeEnvelope(
          ${zone.longitude - zone.width / 2}, ${zone.latitude - zone.height / 2},
          ${zone.longitude + zone.width / 2}, ${zone.latitude + zone.height / 2}, 4326
        ),
        ${parameters.id}::uuid, ${zone.approved}, true, ${now}
      )
      ON CONFLICT ("id") DO NOTHING
    `;
  }

  // Backfill a single illustrative baseline for dated carbon exports. The
  // live snapshots and areas still come from the existing database triggers.
  const zoneIds = Prisma.join(
    demoZones.map((zone) => Prisma.sql`${zone.id}::uuid`),
  );
  const baselineAt = new Date(now.getTime() - 45 * 24 * HOUR_MS);
  await transaction.$executeRaw`
    INSERT INTO "forest_zone_carbon_snapshots" (
      "zone_id", "zone_name", "village_name", "area_hectares",
      "carbon_parameter_set_id", "parameter_set_name", "biomass_factor", "emission_factor",
      "co2_conversion_factor", "incentive_per_ton_idr", "is_zone_approved",
      "is_zone_demo_data", "is_parameter_demo_data", "reason", "captured_at", "boundary"
    )
    SELECT DISTINCT ON (snapshot."zone_id")
      snapshot."zone_id", snapshot."zone_name", snapshot."village_name", snapshot."area_hectares",
      snapshot."carbon_parameter_set_id", snapshot."parameter_set_name", snapshot."biomass_factor",
      snapshot."emission_factor", snapshot."co2_conversion_factor", snapshot."incentive_per_ton_idr",
      true, true, true, 'INITIAL_BASELINE'::"CarbonSnapshotReason", ${baselineAt}, snapshot.boundary
    FROM "forest_zone_carbon_snapshots" AS snapshot
    WHERE snapshot."zone_id" IN (${zoneIds})
      AND snapshot."is_zone_approved"
      AND snapshot."is_zone_demo_data"
      AND snapshot."is_parameter_demo_data"
      AND NOT EXISTS (
        SELECT 1
        FROM "forest_zone_carbon_snapshots" AS baseline
        WHERE baseline."zone_id" = snapshot."zone_id"
          AND baseline."reason" = 'INITIAL_BASELINE'
      )
    ORDER BY snapshot."zone_id", snapshot."captured_at", snapshot."id"
  `;
}

async function seedMapPoints(transaction: Prisma.TransactionClient, now: Date) {
  for (const [index, point] of demoWaterPoints.entries()) {
    const id = `62000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    const zone = demoZones[point.zone];
    await transaction.$executeRaw`
      INSERT INTO "water_points" (
        "id", "zone_id", "name", "type", "latitude", "longitude", "location", "is_demo_data", "updated_at"
      )
      SELECT ${id}::uuid, zone."id", ${point.name}, ${point.type}::"WaterPointType",
        ${point.latitude}, ${point.longitude},
        ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326), true, ${now}
      FROM "forest_zones" AS zone
      WHERE zone."id" = ${zone.id}::uuid AND zone."is_demo_data"
      ON CONFLICT ("id") DO NOTHING
    `;
  }

  const refreshBefore = new Date(now.getTime() - 12 * HOUR_MS);
  for (const [index, point] of demoHotspots.entries()) {
    const suffix = String(index + 1);
    const id = `63000000-0000-4000-8000-${suffix.padStart(12, "0")}`;
    const externalId = `demo-viirs-2026-${suffix.padStart(3, "0")}`;
    const acquiredAt = new Date(now.getTime() - point.hoursAgo * HOUR_MS);
    await transaction.$executeRaw`
      INSERT INTO "satellite_hotspots" (
        "id", "source", "external_id", "latitude", "longitude", "location",
        "brightness_kelvin", "confidence", "acquired_at", "fetched_at", "is_demo_data"
      ) VALUES (
        ${id}::uuid, ${DEMO_HOTSPOT_SOURCE}, ${externalId}, ${point.latitude}, ${point.longitude},
        ST_SetSRID(ST_MakePoint(${point.longitude}, ${point.latitude}), 4326),
        ${point.brightnessKelvin}, ${point.confidence}, ${acquiredAt}, ${now}, true
      )
      ON CONFLICT ("source", "external_id") DO UPDATE SET
        "acquired_at" = EXCLUDED."acquired_at",
        "fetched_at" = EXCLUDED."fetched_at"
      WHERE "satellite_hotspots"."id" = EXCLUDED."id"
        AND "satellite_hotspots"."is_demo_data"
        AND "satellite_hotspots"."fetched_at" < ${refreshBefore}
    `;
  }
}

async function seedDemoData() {
  const savedAvatars: string[] = [];
  const savedPhotos: string[] = [];

  try {
    const inserted = await prisma.$transaction(
      async (transaction) => {
        await transaction.$queryRaw`
        WITH seed_lock AS MATERIALIZED (
          SELECT pg_advisory_xact_lock(hashtext('peatguard:demo-seed')::bigint)
        )
        SELECT 1 FROM seed_lock
      `;
        const now = new Date();
        const restoredAvatars = await seedAccounts(transaction, savedAvatars);
        await seedZones(transaction, now);
        await seedMapPoints(transaction, now);
        const reportSeed = await seedDemoReports(transaction, now, savedPhotos);
        return { ...reportSeed, restoredAvatars };
      },
      { maxWait: 10_000, timeout: 60_000 },
    );

    return {
      inserted: inserted.inserted,
      profileAvatarsWritten: savedAvatars.length,
      profileAvatarsRestored: inserted.restoredAvatars,
      reportPhotosRestored: inserted.restoredPhotos,
      reportPhotosWritten: savedPhotos.length,
    };
  } catch (error) {
    const cleanup = await Promise.allSettled([
      ...savedAvatars.map((fileName) => removePrivateProfileAvatar(fileName)),
      ...savedPhotos.map((fileName) => removePrivateReportPhoto(fileName)),
    ]);
    if (cleanup.some((result) => result.status === "rejected")) {
      console.error(
        "Some private seed files could not be removed after rollback.",
      );
    }
    throw error;
  }
}

try {
  const result = await seedDemoData();
  console.info(
    `PEATGUARD demo seed ready. ${result.inserted} new reports added. Wrote ${result.reportPhotosWritten} new report photos and ${result.profileAvatarsWritten} new profile avatars; restored ${result.reportPhotosRestored} missing report photos and ${result.profileAvatarsRestored} missing profile avatars. Existing report and review history retained.`,
  );
} catch (error) {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  const errorCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : undefined;
  console.error(
    `PEATGUARD demo seed failed (${errorCode ? `${errorName}:${errorCode}` : errorName}).`,
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
