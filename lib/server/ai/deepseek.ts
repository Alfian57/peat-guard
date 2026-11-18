import "server-only";

const REPORT_CATEGORIES = [
  "API_AKTIF",
  "ASAP_GAMBUT",
  "SEKAT_KANAL_KERING",
  "AMAN_TERKENDALI",
] as const;

const REPORT_URGENCIES = ["KRITIS", "WASPADA", "RENDAH"] as const;

const REPORT_ASSESSMENT_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: REPORT_CATEGORIES },
    urgency: { type: "string", enum: REPORT_URGENCIES },
    confidence_score: { type: "number", minimum: 0, maximum: 1 },
    visual_indicators: {
      type: "array",
      items: { type: "string" },
    },
    false_positive_check: { type: "string" },
    action_recommendations: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "category",
    "urgency",
    "confidence_score",
    "visual_indicators",
    "false_positive_check",
    "action_recommendations",
  ],
  additionalProperties: false,
} as const;

export type DeepSeekAssessment = {
  category: (typeof REPORT_CATEGORIES)[number];
  urgency: (typeof REPORT_URGENCIES)[number];
  confidence: number;
  summary: string | null;
  visualIndicators: string[];
  falsePositiveCheck: string;
  actionRecommendations: string[];
};

export class DeepSeekAnalysisError extends Error {
  constructor(
    message = "The report photo analysis is unavailable.",
    readonly reason = "invalid_provider_output",
    readonly retryDelayMs: number | null = null,
  ) {
    super(message);
    this.name = "DeepSeekAnalysisError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function isBoundedText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function parseTextArray(
  value: unknown,
  maxItems: number,
  maxItemLength: number,
): string[] | null {
  if (!Array.isArray(value)) return null;

  const items: unknown[] = value;
  if (items.length > maxItems) return null;

  const textItems: string[] = [];
  for (const item of items) {
    if (!isBoundedText(item, maxItemLength)) return null;
    textItems.push(item.trim());
  }

  return textItems;
}

function isReportCategory(
  value: unknown,
): value is DeepSeekAssessment["category"] {
  return (
    typeof value === "string" &&
    (REPORT_CATEGORIES as readonly string[]).includes(value)
  );
}

function isReportUrgency(
  value: unknown,
): value is DeepSeekAssessment["urgency"] {
  return (
    typeof value === "string" &&
    (REPORT_URGENCIES as readonly string[]).includes(value)
  );
}

export function parseDeepSeekAssessment(value: unknown): DeepSeekAssessment {
  const keys = [
    "category",
    "urgency",
    "confidence_score",
    "visual_indicators",
    "false_positive_check",
    "action_recommendations",
  ] as const;

  if (!isRecord(value) || !hasExactKeys(value, keys)) {
    throw new DeepSeekAnalysisError(
      "The report photo analysis returned an invalid shape.",
    );
  }

  const visualIndicators = parseTextArray(value.visual_indicators, 8, 160);
  const actionRecommendations = parseTextArray(
    value.action_recommendations,
    3,
    240,
  );

  if (
    !isReportCategory(value.category) ||
    !isReportUrgency(value.urgency) ||
    typeof value.confidence_score !== "number" ||
    !Number.isFinite(value.confidence_score) ||
    value.confidence_score < 0 ||
    value.confidence_score > 1 ||
    !visualIndicators ||
    !isBoundedText(value.false_positive_check, 500) ||
    !actionRecommendations
  ) {
    throw new DeepSeekAnalysisError(
      "The report photo analysis failed validation.",
    );
  }

  return {
    category: value.category,
    urgency: value.urgency,
    confidence: value.confidence_score,
    summary: null,
    visualIndicators,
    falsePositiveCheck: value.false_positive_check.trim(),
    actionRecommendations,
  };
}

function readResponsesOutput(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.output)) {
    throw new DeepSeekAnalysisError(
      "The report photo analysis returned no result.",
    );
  }

  if (value.status !== "completed") {
    if (
      value.status === "incomplete" &&
      isRecord(value.incomplete_details) &&
      value.incomplete_details.reason === "content_filter"
    ) {
      throw new DeepSeekAnalysisError("The report photo analysis was refused.");
    }
    throw new DeepSeekAnalysisError(
      "The report photo analysis did not complete.",
    );
  }

  const messages: unknown[] = value.output;
  const outputText: string[] = [];
  for (const item of messages) {
    if (!isRecord(item) || item.type !== "message") continue;
    if (typeof item.refusal === "string" && item.refusal.trim().length > 0) {
      throw new DeepSeekAnalysisError("The report photo analysis was refused.");
    }

    if (!Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (!isRecord(part)) continue;
      if (
        part.type === "refusal" &&
        typeof part.refusal === "string" &&
        part.refusal.trim().length > 0
      ) {
        throw new DeepSeekAnalysisError(
          "The report photo analysis was refused.",
        );
      }
      if (part.type === "output_text" && typeof part.text === "string") {
        outputText.push(part.text);
      }
    }
  }

  const content = outputText.join("").trim();
  if (content.length === 0) {
    throw new DeepSeekAnalysisError(
      "The report photo analysis returned no text.",
    );
  }

  return content;
}

export async function analyzeNormalizedReportPhoto(
  normalizedWebp: Buffer,
  options: {
    apiKey?: string;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<DeepSeekAssessment> {
  const apiKey = options.apiKey ?? process.env.DEEPSEEK_API_KEY;
  if (!apiKey?.trim()) {
    throw new DeepSeekAnalysisError(
      "The report photo analysis is not configured.",
      "not_configured",
    );
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const imageDataUrl = `data:image/webp;base64,${normalizedWebp.toString("base64")}`;

  let response: Response;
  try {
    response = await fetchImpl("https://api.deepseek.com/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-flash",
        instructions:
          "Kamu membantu triase awal laporan kebakaran gambut di Indonesia. Analisis hanya hal yang terlihat pada foto; jangan mengklaim lokasi, korban, atau kejadian yang tidak terlihat. Untuk field false_positive_check, nilai secara eksplisit apakah asap yang terlihat mungkin kabut, awan rendah, bayangan awan, uap, debu, atau sumber asap non-kebakaran; jika foto tidak cukup jelas, nyatakan ketidakpastian dan sarankan verifikasi petugas. Jangan menyimpulkan kebakaran hanya dari langit mendung atau kabut. Berikan maksimal 3 rekomendasi tindakan spesifik dan aman dalam action_recommendations. Hasil adalah saran triase awal untuk ditinjau petugas, bukan keputusan final.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Tinjau foto. Kembalikan tepat satu objek JSON, tanpa markdown, sesuai skema berikut: ${JSON.stringify(REPORT_ASSESSMENT_SCHEMA)}`,
              },
              {
                type: "input_image",
                image_url: imageDataUrl,
                detail: "high",
              },
            ],
          },
        ],
        reasoning: { effort: "none" },
        text: { format: { type: "text" } },
        safety_check: { level: "high" },
        temperature: 0.1,
        max_output_tokens: 900,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new DeepSeekAnalysisError(undefined, "transport_error", 0);
  }

  if (!response.ok) {
    const retryable = response.status === 429 || response.status >= 500;
    const header = response.headers.get("Retry-After")?.trim();
    const delay =
      header && /^\d+$/.test(header)
        ? Number(header) * 1000
        : header
          ? Date.parse(header) - Date.now()
          : 0;
    throw new DeepSeekAnalysisError(
      undefined,
      `provider_http_${response.status}`,
      retryable ? Math.min(24 * 3600_000, Math.max(0, delay || 0)) : null,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DeepSeekAnalysisError(
      "The report photo analysis returned invalid JSON.",
    );
  }

  let content: string;
  try {
    content = readResponsesOutput(payload);
  } catch (error) {
    if (error instanceof DeepSeekAnalysisError) throw error;
    throw new DeepSeekAnalysisError();
  }

  let assessment: unknown;
  try {
    const parsedJson: unknown = JSON.parse(
      content.replace(/^```(?:json)?\s*([\s\S]+?)\s*```$/i, "$1"),
    );
    assessment = parsedJson;
  } catch {
    throw new DeepSeekAnalysisError(
      "The report photo analysis returned invalid JSON.",
    );
  }

  return parseDeepSeekAssessment(assessment);
}
