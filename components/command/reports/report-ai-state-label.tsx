import type { AIAnalysisState as AIAnalysisStateValue } from "@/lib/generated/prisma/enums";
import { aiAnalysisStateLabel } from "@/lib/report-labels";

export function AiStateLabel({
  state,
}: {
  state: AIAnalysisStateValue | null;
}) {
  return aiAnalysisStateLabel(state);
}
