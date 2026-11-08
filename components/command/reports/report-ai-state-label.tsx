import {
  AIAnalysisState,
  type AIAnalysisState as AIAnalysisStateValue,
} from "@/lib/generated/prisma/enums";

export function AiStateLabel({
  state,
}: {
  state: AIAnalysisStateValue | null;
}) {
  if (!state) return "Belum dianalisis";
  switch (state) {
    case AIAnalysisState.PENDING:
      return "Analisis menunggu";
    case AIAnalysisState.COMPLETED:
      return "Analisis selesai";
    case AIAnalysisState.FAILED:
      return "Analisis gagal";
    case AIAnalysisState.SKIPPED:
      return "Analisis dilewati";
  }
}
