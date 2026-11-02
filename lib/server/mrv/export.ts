import type { MrvLedger } from "@/lib/server/mrv/contracts";

const CSV_COLUMNS = [
  "report_id",
  "captured_at",
  "synced_at",
  "recorded_at",
  "village",
  "latitude",
  "longitude",
  "gps_accuracy_meters",
  "coordinate_status",
  "evidence_status_not_verification",
  "has_photo",
  "private_photo_href",
  "ai_state",
  "ai_category",
  "ai_urgency",
  "ai_confidence",
  "handling_status",
  "status_history",
  "zone_id",
  "zone_name",
  "zone_carbon_estimate_tons_context_only",
  "carbon_calculation_version",
  "zone_incentive_estimate_idr_context_only",
  "is_demo_sample",
] as const;

function csvCell(value: string | number | boolean | null): string {
  if (value === null) {
    return "";
  }

  let text = String(value);

  if (typeof value === "string" && /^[\t\r\n ]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeMrvLedgerCsv(ledger: MrvLedger): string {
  const rows = ledger.rows.map((row) => {
    const zoneImpact = row.zoneImpactContext;

    return [
      row.reportId,
      row.capturedAt,
      row.syncedAt,
      row.createdAt,
      row.villageName,
      row.coordinates.latitude,
      row.coordinates.longitude,
      row.coordinates.accuracyMeters,
      row.coordinates.status,
      row.evidenceStatus,
      row.hasPhoto,
      row.photoHref,
      row.aiTriage.state,
      row.aiTriage.category,
      row.aiTriage.urgency,
      row.aiTriage.confidence,
      row.handlingStatus,
      JSON.stringify(row.statusHistory),
      zoneImpact?.zoneId ?? null,
      zoneImpact?.zoneName ?? null,
      zoneImpact?.estimatedCarbonTons ?? null,
      zoneImpact?.calculationVersion ?? null,
      zoneImpact?.estimatedIncentiveIdr ?? null,
      row.isDemoSample,
    ]
      .map(csvCell)
      .join(",");
  });

  return [CSV_COLUMNS.map(csvCell).join(","), ...rows].join("\r\n");
}
