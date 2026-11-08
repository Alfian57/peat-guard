import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../lib/generated/prisma/client";
import {
  demoLoginIsEnabled,
  demoPasswordForRole,
  DEMO_USERS,
} from "../lib/demo-login";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the local database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const carbonParameterSetId = "60000000-0000-4000-8000-000000000001";

const demoZones = [
  {
    id: "61000000-0000-4000-8000-000000000001",
    slug: "demo-khg-sungai-01",
    zoneName: "Zona Demo Sungai 01",
    centerLongitude: 113.9,
    centerLatitude: -2,
    widthDegrees: 0.008986075743241726,
    heightDegrees: 0.009046116338408152,
  },
  {
    id: "61000000-0000-4000-8000-000000000002",
    slug: "demo-khg-sungai-02",
    zoneName: "Zona Demo Sungai 02",
    centerLongitude: 113.9,
    centerLatitude: -2.012,
    widthDegrees: 0.008989423114060074,
    heightDegrees: 0.005425687447461649,
  },
  {
    id: "61000000-0000-4000-8000-000000000003",
    slug: "demo-khg-sungai-03",
    zoneName: "Zona Demo Sungai 03",
    centerLongitude: 113.9,
    centerLatitude: -2.02,
    widthDegrees: 0.008981163225556166,
    heightDegrees: 0.0036204689172063833,
  },
] as const;

const demoWaterPoints = [
  {
    id: "62000000-0000-4000-8000-000000000001",
    zoneId: demoZones[0].id,
    name: "Sekat Kanal Demo 01",
    type: "SEKAT_KANAL",
    latitude: -1.999,
    longitude: 113.901,
  },
  {
    id: "62000000-0000-4000-8000-000000000002",
    zoneId: demoZones[1].id,
    name: "Embung Demo 02",
    type: "EMBUNG",
    latitude: -2.012,
    longitude: 113.903,
  },
] as const;

const demoHotspots = [
  {
    id: "63000000-0000-4000-8000-000000000001",
    externalId: "demo-viirs-2026-001",
    latitude: -2.001,
    longitude: 113.904,
    brightnessKelvin: 315.4,
    confidence: "nominal",
  },
  {
    id: "63000000-0000-4000-8000-000000000002",
    externalId: "demo-viirs-2026-002",
    latitude: -2.014,
    longitude: 113.897,
    brightnessKelvin: 302.8,
    confidence: "low",
  },
] as const;

async function seedDemoData() {
  const demoPasswordHashes = demoLoginIsEnabled()
    ? await Promise.all(
        DEMO_USERS.map(async (user) => ({
          user,
          password: await hashPassword(demoPasswordForRole(user.role)),
        })),
      )
    : [];

  await prisma.$transaction(async (transaction) => {
    await transaction.carbonParameterSet.upsert({
      where: { name: "FigCraft demo values (illustrative)" },
      create: {
        id: carbonParameterSetId,
        name: "FigCraft demo values (illustrative)",
        biomassFactor: 50,
        emissionFactor: 0.2,
        co2ConversionFactor: 3.67,
        incentivePerTonIdr: 15000,
        isActive: true,
        isDemoData: true,
      },
      update: {
        biomassFactor: 50,
        emissionFactor: 0.2,
        co2ConversionFactor: 3.67,
        incentivePerTonIdr: 15000,
        isActive: true,
        isDemoData: true,
      },
    });

    for (const { user, password } of demoPasswordHashes) {
      await transaction.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: true,
          role: user.role,
          villageName: user.villageName,
        },
        update: {
          name: user.name,
          email: user.email,
          emailVerified: true,
          role: user.role,
          villageName: user.villageName,
        },
      });

      await transaction.account.upsert({
        where: {
          providerId_accountId: {
            providerId: "credential",
            accountId: user.id,
          },
        },
        create: {
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password,
        },
        update: {
          password,
          updatedAt: new Date(),
        },
      });
    }

    for (const zone of demoZones) {
      const halfWidth = zone.widthDegrees / 2;
      const halfHeight = zone.heightDegrees / 2;

      await transaction.$executeRaw`
        INSERT INTO "forest_zones" (
          "id", "slug", "zone_name", "village_name", "peat_depth_meters",
          "area_hectares", "boundary", "carbon_parameter_set_id", "is_approved", "is_demo_data", "updated_at"
        )
        VALUES (
          ${zone.id}::uuid, ${zone.slug}, ${zone.zoneName}, 'Desa Demo Gambut', 1.5,
          0,
          ST_MakeEnvelope(
            ${zone.centerLongitude - halfWidth}, ${zone.centerLatitude - halfHeight},
            ${zone.centerLongitude + halfWidth}, ${zone.centerLatitude + halfHeight},
            4326
          ),
          ${carbonParameterSetId}::uuid, true, true, CURRENT_TIMESTAMP
        )
        ON CONFLICT ("slug") DO UPDATE SET
          "zone_name" = EXCLUDED."zone_name",
          "village_name" = EXCLUDED."village_name",
          "peat_depth_meters" = EXCLUDED."peat_depth_meters",
          "boundary" = EXCLUDED."boundary",
          "carbon_parameter_set_id" = EXCLUDED."carbon_parameter_set_id",
          "is_approved" = EXCLUDED."is_approved",
          "is_demo_data" = EXCLUDED."is_demo_data",
          "updated_at" = CURRENT_TIMESTAMP
      `;
    }

    for (const waterPoint of demoWaterPoints) {
      await transaction.$executeRaw`
        INSERT INTO "water_points" (
          "id", "zone_id", "name", "type", "latitude", "longitude", "location", "is_demo_data", "updated_at"
        )
        VALUES (
          ${waterPoint.id}::uuid, ${waterPoint.zoneId}::uuid, ${waterPoint.name},
          ${waterPoint.type}::"WaterPointType", ${waterPoint.latitude}, ${waterPoint.longitude},
          ST_SetSRID(ST_MakePoint(${waterPoint.longitude}, ${waterPoint.latitude}), 4326), true, CURRENT_TIMESTAMP
        )
        ON CONFLICT ("id") DO UPDATE SET
          "zone_id" = EXCLUDED."zone_id",
          "name" = EXCLUDED."name",
          "type" = EXCLUDED."type",
          "latitude" = EXCLUDED."latitude",
          "longitude" = EXCLUDED."longitude",
          "is_demo_data" = EXCLUDED."is_demo_data",
          "updated_at" = CURRENT_TIMESTAMP
      `;
    }

    for (const hotspot of demoHotspots) {
      await transaction.$executeRaw`
        INSERT INTO "satellite_hotspots" (
          "id", "source", "external_id", "latitude", "longitude", "location",
          "brightness_kelvin", "confidence", "acquired_at", "fetched_at", "is_demo_data"
        )
        VALUES (
          ${hotspot.id}::uuid, 'DEMO_VIIRS', ${hotspot.externalId},
          ${hotspot.latitude}, ${hotspot.longitude},
          ST_SetSRID(ST_MakePoint(${hotspot.longitude}, ${hotspot.latitude}), 4326),
          ${hotspot.brightnessKelvin}, ${hotspot.confidence},
          '2026-11-10T03:00:00Z'::timestamptz, '2026-11-10T04:00:00Z'::timestamptz, true
        )
        ON CONFLICT ("source", "external_id") DO UPDATE SET
          "latitude" = EXCLUDED."latitude",
          "longitude" = EXCLUDED."longitude",
          "brightness_kelvin" = EXCLUDED."brightness_kelvin",
          "confidence" = EXCLUDED."confidence",
          "acquired_at" = EXCLUDED."acquired_at",
          "fetched_at" = EXCLUDED."fetched_at",
          "is_demo_data" = EXCLUDED."is_demo_data"
      `;
    }
  });
}

try {
  await seedDemoData();
  console.info(
    "Seeded illustrative PEATGUARD demo zones, water points, and hotspots.",
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
