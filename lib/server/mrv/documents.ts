import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { CANAL_CONDITION_LABELS } from "@/lib/canal-observation";
import { CommandApiError } from "@/lib/server/command/http";
import type { MrvGeneratedReport } from "./contracts";

const draftLifetimeMs = 24 * 3600_000;

export async function saveMrvDraft(
  authorId: string,
  report: MrvGeneratedReport,
) {
  const draft = await prisma.mrvDocument.create({
    data: {
      authorId,
      payload: JSON.parse(JSON.stringify(report)) as Prisma.InputJsonValue,
      expiresAt: new Date(Date.now() + draftLifetimeMs),
    },
    select: { id: true },
  });
  return draft.id;
}

export async function purgeExpiredMrvDrafts() {
  await prisma.mrvDocument.deleteMany({
    where: { publishedAt: null, expiresAt: { lte: new Date() } },
  });
}

export async function publishMrvDocument(id: string, authorId: string) {
  return prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRaw`SELECT id FROM mrv_documents WHERE id = ${id}::uuid FOR UPDATE`;
      const draft = await transaction.mrvDocument.findFirst({
        where: { id, authorId },
        select: { payload: true, publishedAt: true, expiresAt: true },
      });
      if (!draft)
        throw new CommandApiError(
          404,
          "document_not_found",
          "Draf tidak ditemukan.",
        );
      if (draft.publishedAt)
        return { id, publishedAt: draft.publishedAt.toISOString() };
      const publishedAt = new Date();
      if (draft.expiresAt <= publishedAt)
        throw new CommandApiError(
          410,
          "draft_expired",
          "Draf sudah kedaluwarsa. Susun kembali laporan.",
        );
      const pdf = await renderMrvPdf(
        readReport(draft.payload),
        id,
        publishedAt,
      );
      await transaction.mrvDocument.update({
        where: { id },
        data: { pdf, publishedAt },
      });
      await transaction.auditEvent.create({
        data: {
          actorId: authorId,
          aggregateType: "MrvDocument",
          aggregateId: id,
          eventType: "MRV_DOCUMENT_PUBLISHED",
        },
      });
      return { id, publishedAt: publishedAt.toISOString() };
    },
    { timeout: 25_000 },
  );
}

export async function listMrvDocuments(before?: string) {
  const rows = await prisma.mrvDocument.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    select: { id: true, payload: true, publishedAt: true },
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    take: 31,
  });
  const entries = rows.slice(0, 30).map((row) => {
    const report = readReport(row.payload);
    return {
      id: row.id,
      title: report.printable.title,
      scope: report.scope,
      publishedAt: row.publishedAt!,
    };
  });
  return { entries, next: rows.length > 30 ? entries.at(-1)?.id : undefined };
}

export async function getMrvDocument(id: string) {
  const row = await prisma.mrvDocument.findFirst({
    where: { id, publishedAt: { not: null } },
    select: { payload: true, publishedAt: true },
  });
  return row
    ? { report: readReport(row.payload), publishedAt: row.publishedAt! }
    : null;
}

export async function getMrvPdf(id: string) {
  const row = await prisma.mrvDocument.findFirst({
    where: { id, publishedAt: { not: null } },
    select: { pdf: true },
  });
  return row?.pdf ?? null;
}

function readReport(payload: Prisma.JsonValue): MrvGeneratedReport {
  // The only writer is the report generator. Keep the published version as stored.
  return payload as unknown as MrvGeneratedReport;
}

const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 });
function display(value: number | null | undefined, unit = "") {
  return value == null ? "Belum tersedia" : number.format(value) + unit;
}

async function renderMrvPdf(
  report: MrvGeneratedReport,
  id: string,
  publishedAt: Date,
) {
  const font = await readFile(
    join(process.cwd(), "lib/fonts/Inter-Variable.ttf"),
  );
  const document = new PDFDocument({
    size: "A4",
    margin: 44,
    info: { Title: report.printable.title, CreationDate: publishedAt },
  });
  const result = new Promise<Buffer<ArrayBuffer>>((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.once("end", () => resolve(Buffer.concat(chunks)));
    document.once("error", reject);
  });
  const metrics = report.metrics;
  const paragraph = (label: string, value: string) =>
    document
      .fontSize(10)
      .text(label + "  " + value)
      .moveDown(0.25);
  document.font(font).fontSize(20).text(report.printable.title).moveDown();
  paragraph("Nomor dokumen", id);
  paragraph(
    "Diterbitkan (WIB)",
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(publishedAt),
  );
  paragraph(
    "Periode (WIB)",
    `${report.scope.from ?? "–"} – ${report.scope.to ?? "–"}${report.partial ? " · parsial" : ""}`,
  );
  paragraph(
    "Wilayah",
    report.scope.zoneName ??
      (report.scope.zoneId ? "Zona terpilih" : "Semua zona"),
  );
  paragraph(
    "Metodologi",
    "Estimasi simulasi PEATGUARD" +
      (report.containsIllustrativeData ? " · Termasuk data ilustratif" : ""),
  );
  for (const section of report.printable.sections) {
    document.moveDown().fontSize(14).text(section.title).moveDown(0.4);
    switch (section.key) {
      case "carbon":
        paragraph("Snapshot", metrics.carbon.asOf ?? "Belum tersedia");
        paragraph(
          "Emisi dicegah",
          display(metrics.carbon.estimatedCarbonTons, " t CO₂e"),
        );
        paragraph(
          "Perubahan sejak akhir bulan sebelumnya",
          display(metrics.carbon.periodChangeTons, " t CO₂e"),
        );
        paragraph("Luas", display(metrics.carbon.protectedAreaHectares, " ha"));
        paragraph(
          "Insentif",
          display(metrics.carbon.estimatedIncentiveIdr, " rupiah"),
        );
        if (metrics.carbon.excludedZoneCount)
          paragraph(
            "Zona konflik dikecualikan",
            String(metrics.carbon.excludedZoneCount),
          );
        for (const zone of metrics.carbon.zones) {
          paragraph(
            zone.zoneName,
            `${display(zone.areaHectares, " ha")} · ${display(zone.estimatedCarbonTons, " t CO₂e")} · ${display(zone.estimatedIncentiveIdr, " rupiah")}${zone.isIllustrative ? " (ilustratif)" : ""}`,
          );
          paragraph(
            "Parameter",
            `${zone.parameters.name} · B ${zone.parameters.biomassFactorTonsCarbonPerHectare} · EF ${zone.parameters.emissionFactor} · K ${zone.parameters.co2ConversionFactor} · Tarif ${zone.parameters.incentivePerTonIdr}`,
          );
          paragraph("Snapshot zona", zone.snapshotAt);
        }
        break;
      case "evidence":
        paragraph(
          "Bukti diterima",
          display(metrics.reports.evidence?.accepted),
        );
        paragraph(
          "Perlu tindak lanjut",
          display(metrics.reports.evidence?.followUp),
        );
        paragraph("Bukti ditolak", display(metrics.reports.evidence?.rejected));
        break;
      case "hotspots":
        paragraph(
          "Titik terhitung",
          metrics.hotspots.historicalBoundaryUnavailable
            ? "Riwayat batas belum lengkap"
            : display(metrics.hotspots.totalCount),
        );
        if (!metrics.hotspots.historicalBoundaryUnavailable)
          paragraph("Termasuk ilustrasi", display(metrics.hotspots.demoCount));
        break;
      case "field-reports":
        paragraph("Laporan lapangan", display(metrics.reports.totalCount));
        paragraph("Triase AI selesai", display(metrics.reports.aiTriagedCount));
        paragraph("Belum selesai", display(metrics.reports.activeCount));
        paragraph("Selesai", display(metrics.reports.closedCount));
        break;
      case "response-time":
        paragraph(
          "Rata-rata",
          display(metrics.responseTime.averageMinutes, " menit"),
        );
        paragraph(
          "Laporan dengan waktu tercatat",
          display(metrics.responseTime.respondedReportCount),
        );
        break;
      case "canal-condition":
        if (report.canalCondition.status === "unavailable")
          paragraph("Observasi", "Belum tersedia");
        else
          for (const observation of report.canalCondition.observations) {
            paragraph(
              CANAL_CONDITION_LABELS[observation.condition],
              `${observation.nonDemoCount} observasi · ${observation.demoCount} ilustratif`,
            );
          }
        break;
      case "narrative":
        if (report.narrative.status === "generated") {
          paragraph(report.narrative.headline, report.narrative.narrative);
          for (const suggestion of report.narrative.recommendations)
            paragraph("•", suggestion);
        } else {
          paragraph(
            "Narasi",
            report.narrative.status === "not_requested"
              ? "Tidak diminta"
              : "Belum tersedia",
          );
        }
        break;
    }
  }
  document.end();
  return result;
}
