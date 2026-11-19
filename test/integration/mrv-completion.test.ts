import { expect, test } from "bun:test";
import { DEMO_USERS } from "@/lib/demo-login";
import { prisma } from "@/lib/prisma";
import {
  approveCommandZone,
  archiveCommandZone,
  createCommandZone,
  requestZoneRevision,
  updateCommandZone,
} from "@/lib/server/zones/data";
import { getMrvReportSource } from "@/lib/server/mrv/report-data";
import { getPrivateReportList } from "@/lib/server/reports/read";
import { updateReportStatus } from "@/lib/server/reports/status";
import {
  parseDashboardFilters,
  parseMrvReportRequest,
} from "@/lib/server/mrv/validation";
import { generateMrvReport } from "@/lib/server/mrv/report-generator";
import {
  getMrvDocument,
  getMrvPdf,
  publishMrvDocument,
  saveMrvDraft,
} from "@/lib/server/mrv/documents";
import { recordEvidenceSupplement } from "@/lib/server/mrv/follow-up";
import { recordMrvEvidenceReview } from "@/lib/server/mrv/review";
import { getCarbonHistory } from "@/lib/server/mrv/carbon-history";
import { getMrvDashboard } from "@/lib/server/mrv/data";
import { createCarbonParameters } from "@/lib/server/mrv/parameters";
import { getPublicMetrics } from "@/lib/public/data";

const posko = DEMO_USERS.find(({ role }) => role === "POSKO")!;
const verifier = DEMO_USERS.find(({ role }) => role === "VERIFIKATOR")!;
const volunteer = DEMO_USERS.find(({ role }) => role === "RELAWAN")!;

function polygon(
  west: number,
  east: number,
  latitude = -1,
): { type: "Polygon"; coordinates: [number, number][][] } {
  return {
    type: "Polygon",
    coordinates: [
      [
        [west, latitude],
        [east, latitude],
        [east, latitude - 0.01],
        [west, latitude - 0.01],
        [west, latitude],
      ],
    ],
  };
}

test("rejects zero and over-precision carbon factors before writing a version", async () => {
  const input = {
    name: `Uji validasi ${crypto.randomUUID()}`,
    source: "Data uji lokal",
    isDemoData: true,
    isActive: false,
    biomassFactor: 0.01,
    emissionFactor: 0.0001,
    co2ConversionFactor: 0.001,
    incentivePerTonIdr: 0,
  };
  for (const invalid of [
    { biomassFactor: 0 },
    { emissionFactor: 0.00001 },
    { biomassFactor: 1.234 },
  ]) {
    await expect(
      createCarbonParameters({ ...input, ...invalid }, verifier.id),
    ).rejects.toMatchObject({ status: 400, code: "invalid_factor" });
  }
  expect(await createCarbonParameters(input, verifier.id)).toHaveProperty("id");
});

test("public metrics distinguish missing FIRMS coverage from zero detections", async () => {
  const previous = process.env.NASA_FIRMS_MAP_KEY;
  try {
    process.env.NASA_FIRMS_MAP_KEY = "";
    expect(await getPublicMetrics()).toMatchObject({
      firmsHotspotCount: 0,
      firmsFreshness: "not_configured",
    });
  } finally {
    if (previous === undefined) delete process.env.NASA_FIRMS_MAP_KEY;
    else process.env.NASA_FIRMS_MAP_KEY = previous;
  }
});

test("zone review serializes approvals, permits a shared edge, and resubmits a revised zone", async () => {
  const suffix = crypto.randomUUID().slice(0, 8);
  const makeZone = (name: string, west: number, east: number) =>
    createCommandZone(
      {
        zoneName: `Uji ${name} ${suffix}`,
        villageName: "Desa Uji",
        peatDepthMeters: 1,
        geometry: polygon(west, east),
      },
      posko.id,
    );
  const zones = await Promise.all([
    makeZone("A", 112.1, 112.11),
    makeZone("B", 112.1, 112.11),
    makeZone("C", 112.11, 112.12),
  ]);
  try {
    const contenders = await Promise.allSettled(
      zones
        .slice(0, 2)
        .map((zone) => approveCommandZone(zone.id, verifier.id, 0)),
    );
    expect(
      contenders.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejected = contenders.findIndex(
      (result) => result.status === "rejected",
    );
    const conflict = contenders[rejected];
    if (conflict.status !== "rejected")
      throw new Error("Overlap approval should fail.");
    expect(conflict.reason).toMatchObject({ code: "zone_overlap" });
    expect(
      (await approveCommandZone(zones[2].id, verifier.id, 0)).zone.isApproved,
    ).toBe(true);

    const zone = zones[rejected];
    await requestZoneRevision(zone.id, verifier.id, 0, "Pisahkan batas zona.");
    await expect(
      approveCommandZone(zone.id, verifier.id, 0),
    ).rejects.toMatchObject({ status: 409 });
    const revised = await updateCommandZone(
      zone.id,
      { geometry: polygon(112.12, 112.13), expectedRevision: 1 },
      posko.id,
    );
    expect(revised.reviewNote).toBeNull();
    expect(
      (await approveCommandZone(zone.id, verifier.id, 2)).zone.isApproved,
    ).toBe(true);
  } finally {
    await Promise.all(
      zones.map((zone) => archiveCommandZone(zone.id, posko.id)),
    );
  }
});

test("historical reports retain status, response, canal, and hotspot scope after later changes", async () => {
  const id = crypto.randomUUID();
  const zoneId = crypto.randomUUID();
  const village = `Desa Historis ${zoneId}`;
  const reference = "Rujukan parameter pengujian audit";
  const parameters = await createCarbonParameters(
    {
      name: `Parameter historis ${zoneId}`,
      source: reference,
      isDemoData: false,
      isActive: false,
      biomassFactor: 1,
      emissionFactor: 0.2,
      co2ConversionFactor: 3.667,
      incentivePerTonIdr: 0,
    },
    verifier.id,
  );
  const observed = new Date("2026-08-14T05:00:00.000Z");
  const parsed = parseMrvReportRequest({ from: "2026-08-14", zoneId });
  if (!parsed.ok) throw new Error(parsed.error);
  await prisma.$executeRaw`
    INSERT INTO forest_zones (id, slug, zone_name, village_name, boundary, carbon_parameter_set_id, is_approved, updated_at)
    SELECT ${zoneId}::uuid, ${"historical-" + zoneId}, 'Zona Uji Historis', ${village},
      ST_GeomFromText('POLYGON((111 -2,111.01 -2,111.01 -2.01,111 -2.01,111 -2))', 4326),
      ${parameters.id}::uuid, TRUE, CURRENT_TIMESTAMP
  `;
  await prisma.$executeRaw`
    INSERT INTO forest_zone_carbon_snapshots (zone_id, zone_name, village_name, area_hectares, carbon_parameter_set_id,
      parameter_set_name, biomass_factor, emission_factor, co2_conversion_factor, incentive_per_ton_idr,
      is_zone_approved, is_zone_demo_data, is_parameter_demo_data, reason, captured_at)
    SELECT zone_id, zone_name, village_name, area_hectares, carbon_parameter_set_id, parameter_set_name, biomass_factor,
      emission_factor, co2_conversion_factor, incentive_per_ton_idr, TRUE, FALSE, is_parameter_demo_data,
      'ZONE_CREATED', ${new Date("2026-08-13T00:00:00.000Z")}
    FROM forest_zone_carbon_snapshots WHERE zone_id = ${zoneId}::uuid LIMIT 1
  `;
  await prisma.$executeRaw`
    INSERT INTO field_reports (id, client_report_id, reporter_id, zone_id, latitude, longitude, location, image_path,
      captured_at, synced_at, created_at, updated_at, canal_condition)
    VALUES (${id}::uuid,${crypto.randomUUID()}::uuid,${volunteer.id}::uuid,${zoneId}::uuid,-2.005,111.005,
      ST_SetSRID(ST_MakePoint(111.005,-2.005),4326),'',${observed},${observed},${observed},${observed},'RUSAK')
  `;
  await prisma.$executeRaw`
    INSERT INTO satellite_hotspots (id, source, external_id, latitude, longitude, location, acquired_at, fetched_at)
    VALUES (${crypto.randomUUID()}::uuid, 'VIIRS_NOAA20_NRT', ${id}, -2.005,111.005,
      ST_SetSRID(ST_MakePoint(111.005,-2.005),4326),${observed},${observed})
  `;
  const before = await getMrvReportSource(parsed.value.filters);
  const [singleCutoff] = await getCarbonHistory([observed], zoneId);
  const repeatedCutoffs = await getCarbonHistory([observed, observed], zoneId);
  expect(singleCutoff.zones).toHaveLength(1);
  expect(singleCutoff.zones[0].parameterSource).toBe(reference);
  expect(repeatedCutoffs).toEqual([singleCutoff, singleCutoff]);
  await updateReportStatus(posko, id, {
    expectedStatus: "MENUNGGU_TINDAKAN",
    nextStatus: "DALAM_PENANGANAN",
    note: null,
  });
  await updateReportStatus(posko, id, {
    expectedStatus: "DALAM_PENANGANAN",
    nextStatus: "SELESAI",
    note: null,
  });
  await updateCommandZone(
    zoneId,
    { geometry: polygon(111.02, 111.03, -2), villageName: `${village} Baru` },
    posko.id,
  );
  const lateSync = new Date("2026-08-20T00:00:00.000Z");
  await prisma.$executeRaw`
    INSERT INTO field_reports (id, client_report_id, reporter_id, zone_id, latitude, longitude, location, image_path,
      captured_at, synced_at, created_at, updated_at)
    VALUES (${crypto.randomUUID()}::uuid,${crypto.randomUUID()}::uuid,${volunteer.id}::uuid,${zoneId}::uuid,-2.005,111.005,
      ST_SetSRID(ST_MakePoint(111.005,-2.005),4326),'',${observed},${lateSync},${lateSync},${lateSync})
  `;
  const after = await getMrvReportSource(parsed.value.filters);
  expect(before).toMatchObject({
    reports: {
      totalCount: 1,
      activeCount: 1,
      closedCount: 0,
      respondedCount: 0,
    },
    hotspots: { totalCount: 1, historicalBoundaryUnavailable: false },
    canalObservations: [{ condition: "RUSAK", demoCount: 0, nonDemoCount: 1 }],
  });
  expect(after).toEqual(before);
  // Put a sample report in the same zone and period to detect score contamination.
  await prisma.$executeRaw`
    INSERT INTO field_reports (id, client_report_id, reporter_id, zone_id, latitude, longitude, location, image_path,
      captured_at, synced_at, created_at, updated_at, is_demo_sample)
    SELECT ${crypto.randomUUID()}::uuid, ${crypto.randomUUID()}::uuid, reporter_id, zone_id, latitude, longitude, location, image_path,
      captured_at, synced_at, created_at, updated_at, TRUE FROM field_reports WHERE id = ${id}::uuid
  `;
  const filters = parseDashboardFilters(
    new URLSearchParams({
      from: "2026-08-13",
      to: "2026-08-15",
      dataset: "operational",
    }),
  );
  if (!filters.ok) throw new Error(filters.error);
  const dashboard = await getMrvDashboard(filters.value);
  expect(
    dashboard.villages.find(({ villageName }) => villageName === village),
  ).toMatchObject({
    fieldReportCount: 1,
    demoFieldReportCount: 0,
    readinessComponents: {
      eligibleReports: 1,
      patrolledZones: 1,
      timelyReports: 0,
      zoneCount: 1,
    },
    readinessScore: 50,
  });
  const simulation = await getMrvDashboard({
    ...filters.value,
    dataset: "simulation",
  });
  expect(
    simulation.villages.find(({ villageName }) => villageName === village),
  ).toMatchObject({
    fieldReportCount: 0,
    demoFieldReportCount: 1,
    readinessScore: null,
  });
  expect(dashboard.zones.every((zone) => !zone.isIllustrative)).toBe(true);
  expect(simulation.zones.length).toBeGreaterThan(0);
  expect(simulation.zones.every((zone) => zone.isIllustrative)).toBe(true);
  await prisma.satelliteHotspot.deleteMany({ where: { externalId: id } });
});

test("archives the exact preview, emits a valid PDF, and makes publication idempotent", async () => {
  const parsed = parseMrvReportRequest({ documentType: "CARBON_AUDIT" });
  if (!parsed.ok) throw new Error(parsed.error);
  const report = await generateMrvReport(parsed.value);
  if (!report) throw new Error("Report was not generated.");
  const id = await saveMrvDraft(verifier.id, report);
  expect(await getMrvPdf(id)).toBeNull();
  const first = await publishMrvDocument(id, verifier.id);
  const second = await publishMrvDocument(id, verifier.id);
  expect(first).toEqual(second);
  expect((await getMrvDocument(id))?.report).toEqual(
    JSON.parse(JSON.stringify(report)),
  );
  const pdf = await getMrvPdf(id);
  expect(
    Buffer.from(pdf ?? [])
      .subarray(0, 5)
      .toString(),
  ).toBe("%PDF-");
});

test("follow-up feedback and supplementary evidence keep independent revisions", async () => {
  const report = await prisma.fieldReport.findFirstOrThrow({
    where: { reporterId: volunteer.id, isDemoSample: true },
    select: { id: true, fieldNotes: true },
    orderBy: { capturedAt: "asc" },
  });
  const firstPage = () =>
    getPrivateReportList(volunteer, {
      from: null,
      toExclusive: null,
      isDemoSample: true,
      page: 1,
      pageSize: 1,
      status: null,
      zoneId: null,
    });
  expect((await firstPage()).reports[0]?.id).not.toBe(report.id);
  const latest = await prisma.auditEvent.findFirst({
    where: {
      reportId: report.id,
      eventType: { in: ["MRV_EVIDENCE_REVIEWED", "MRV_EVIDENCE_SUPPLEMENTED"] },
    },
    select: { id: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  const review = await recordMrvEvidenceReview(
    verifier,
    report.id,
    "NEEDS_FOLLOW_UP",
    {
      note: "Mohon lengkapi penjelasan.",
      expectedVersion: latest?.id ?? null,
    },
  );
  expect((await firstPage()).reports).toMatchObject([
    { id: report.id, needsFollowUp: true },
  ]);
  const supplement = await recordEvidenceSupplement(
    volunteer,
    report.id,
    review.eventId,
    "Foto diambil dari tepi kanal.",
    null,
  );
  expect((await firstPage()).reports[0]?.id).not.toBe(report.id);
  await expect(
    recordMrvEvidenceReview(verifier, report.id, "REJECTED", {
      expectedVersion: review.eventId,
    }),
  ).rejects.toMatchObject({ status: 409 });
  await expect(
    recordMrvEvidenceReview(verifier, report.id, "REJECTED", {
      expectedVersion: supplement.id,
    }),
  ).resolves.toMatchObject({ decision: "REJECTED" });
  expect(
    (
      await prisma.fieldReport.findUniqueOrThrow({
        where: { id: report.id },
        select: { fieldNotes: true },
      })
    ).fieldNotes,
  ).toBe(report.fieldNotes);
});
