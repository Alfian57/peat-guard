import "server-only";

import { generateExecutiveNarrative } from "@/lib/server/ai/executive-narrative";
import type {
  MrvGeneratedReport,
  MrvReportRequest,
} from "@/lib/server/mrv/contracts";
import { getMrvReportSource } from "@/lib/server/mrv/report-data";
import {
  buildMrvGeneratedReport,
  type NarrativeProvider,
} from "@/lib/server/mrv/report-calculations";

export { buildMrvGeneratedReport } from "@/lib/server/mrv/report-calculations";
export type { NarrativeProvider } from "@/lib/server/mrv/report-calculations";

export type MrvGeneratedReportResult = MrvGeneratedReport | null;

export async function generateMrvReport(
  request: MrvReportRequest,
  provider: NarrativeProvider = generateExecutiveNarrative,
  generatedAt = new Date(),
): Promise<MrvGeneratedReportResult> {
  const source = await getMrvReportSource(request.filters, generatedAt);

  if (!source) {
    return null;
  }

  return buildMrvGeneratedReport(request, source, provider, generatedAt);
}
