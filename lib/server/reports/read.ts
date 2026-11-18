import { getLatestEvidenceVersion } from "@/lib/server/mrv/follow-up";
import { isRecord } from "@/lib/server/command/http";
import "server-only";

import { prisma } from "@/lib/prisma";
import { reportReadScope, type ReportActor } from "@/lib/server/reports/access";
import { ReportNotFoundError } from "@/lib/server/reports/http";
import type { ReportListFilters } from "@/lib/server/reports/list-input";
import { reportPhotoMetadata } from "@/lib/server/reports/photo-metadata";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isReportUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

const reportDetailSelect = {
  id: true,
  clientReportId: true,
  zoneId: true,
  latitude: true,
  longitude: true,
  accuracyMeters: true,
  fieldNotes: true,
  canalCondition: true,
  canalObservation: true,
  tags: true,
  capturedAt: true,
  syncedAt: true,
  aiConsent: true,
  aiState: true,
  aiCategory: true,
  aiUrgency: true,
  aiConfidence: true,
  aiSummary: true,
  aiVisualIndicators: true,
  aiFalsePositiveCheck: true,
  aiActionRecommendations: true,
  aiAnalyzedAt: true,
  handlingStatus: true,
  nearestWaterDistanceM: true,
  isDemoSample: true,
  imagePath: true,
  createdAt: true,
  updatedAt: true,
  statusEvents: {
    select: {
      id: true,
      previousStatus: true,
      nextStatus: true,
      note: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getPrivateReportList(
  actor: ReportActor,
  filters: ReportListFilters,
) {
  const capturedAt: { gte?: Date; lt?: Date } = {};
  if (filters.from) capturedAt.gte = filters.from;
  if (filters.toExclusive) capturedAt.lt = filters.toExclusive;

  const where = {
    ...reportReadScope(actor),
    ...(filters.status ? { handlingStatus: filters.status } : {}),
    ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
    ...(filters.isDemoSample === null
      ? {}
      : { isDemoSample: filters.isDemoSample }),
    ...(Object.keys(capturedAt).length > 0 ? { capturedAt } : {}),
  };

  const [reports, total] = await prisma.$transaction([
    prisma.fieldReport.findMany({
      where,
      orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      select: {
        id: true,
        zoneId: true,
        latitude: true,
        longitude: true,
        accuracyMeters: true,
        capturedAt: true,
        syncedAt: true,
        handlingStatus: true,
        aiState: true,
        aiCategory: true,
        aiUrgency: true,
        imagePath: true,
        isDemoSample: true,
      },
    }),
    prisma.fieldReport.count({ where }),
  ]);

  return {
    reports: reports.map((report) => {
      const photo = reportPhotoMetadata(report.id, report.imagePath);
      return {
        id: report.id,
        zoneId: report.zoneId,
        latitude: report.latitude,
        longitude: report.longitude,
        accuracyMeters: report.accuracyMeters,
        capturedAt: report.capturedAt,
        syncedAt: report.syncedAt,
        handlingStatus: report.handlingStatus,
        aiState: report.aiState,
        aiCategory: report.aiCategory,
        aiUrgency: report.aiUrgency,
        isDemoSample: report.isDemoSample,
        ...photo,
      };
    }),
    page: filters.page,
    pageSize: filters.pageSize,
    total,
  };
}

export async function getPrivateReportDetail(
  actor: ReportActor,
  reportId: string,
) {
  const report = await prisma.fieldReport.findFirst({
    where: { id: reportId, ...reportReadScope(actor) },
    select: reportDetailSelect,
  });

  if (!report) throw new ReportNotFoundError();

  const photo = reportPhotoMetadata(report.id, report.imagePath);
  const latestEvidence = await getLatestEvidenceVersion(prisma, report.id);
  const evidencePayload =
    latestEvidence && isRecord(latestEvidence.payload)
      ? latestEvidence.payload
      : null;
  const followUp =
    latestEvidence?.eventType === "MRV_EVIDENCE_REVIEWED" &&
    evidencePayload?.decision === "NEEDS_FOLLOW_UP" &&
    typeof evidencePayload.note === "string"
      ? { reviewId: latestEvidence.id, note: evidencePayload.note }
      : null;
  return {
    id: report.id,
    clientReportId: report.clientReportId,
    zoneId: report.zoneId,
    latitude: report.latitude,
    longitude: report.longitude,
    accuracyMeters: report.accuracyMeters,
    fieldNotes: report.fieldNotes,
    canalCondition: report.canalCondition,
    canalObservation: report.canalObservation,
    followUp,
    tags: report.tags,
    capturedAt: report.capturedAt,
    syncedAt: report.syncedAt,
    aiConsent: report.aiConsent,
    aiState: report.aiState,
    aiCategory: report.aiCategory,
    aiUrgency: report.aiUrgency,
    aiConfidence:
      report.aiConfidence === null ? null : Number(report.aiConfidence),
    aiSummary: report.aiSummary,
    aiVisualIndicators: report.aiVisualIndicators,
    aiFalsePositiveCheck: report.aiFalsePositiveCheck,
    aiActionRecommendations: report.aiActionRecommendations,
    aiAnalyzedAt: report.aiAnalyzedAt,
    handlingStatus: report.handlingStatus,
    nearestWaterDistanceM:
      report.nearestWaterDistanceM === null
        ? null
        : Number(report.nearestWaterDistanceM),
    isDemoSample: report.isDemoSample,
    ...photo,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    statusEvents: report.statusEvents,
  };
}

export async function getPrivateReportPhotoPath(
  actor: ReportActor,
  reportId: string,
): Promise<string> {
  const report = await prisma.fieldReport.findFirst({
    where: { id: reportId, ...reportReadScope(actor) },
    select: { imagePath: true },
  });

  if (!report) throw new ReportNotFoundError();
  return report.imagePath;
}
