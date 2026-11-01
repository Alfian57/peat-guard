import "server-only";

const REPORT_CATEGORIES = [
  "API_AKTIF",
  "ASAP_GAMBUT",
  "SEKAT_KANAL_KERING",
  "AMAN_TERKENDALI",
] as const;

const REPORT_URGENCIES = ["KRITIS", "WASPADA", "RENDAH"] as const;

export type DeepSeekAssessment = {
  category: (typeof REPORT_CATEGORIES)[number];
  urgency: (typeof REPORT_URGENCIES)[number];
  confidence: number;
  summary: string;
  visualIndicators: string[];
  falsePositiveCheck: string;
  actionRecommendations: string[];
};

export class DeepSeekAnalysisError extends Error {
  constructor(message = "The report photo analysis is unavailable.") {
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
    "confidence",
    "summary",
    "visualIndicators",
    "falsePositiveCheck",
    "actionRecommendations",
  ] as const;

  if (!isRecord(value) || !hasExactKeys(value, keys)) {
    throw new DeepSeekAnalysisError(
      "The report photo analysis returned an invalid shape.",
    );
  }

  const visualIndicators = parseTextArray(value.visualIndicators, 8, 160);
  const actionRecommendations = parseTextArray(
    value.actionRecommendations,
    3,
    240,
  );

  if (
    !isReportCategory(value.category) ||
    !isReportUrgency(value.urgency) ||
    typeof value.confidence !== "number" ||
    !Number.isFinite(value.confidence) ||
    value.confidence < 0 ||
    value.confidence > 1 ||
    !isBoundedText(value.summary, 500) ||
    !visualIndicators ||
    !isBoundedText(value.falsePositiveCheck, 500) ||
    !actionRecommendations
  ) {
    throw new DeepSeekAnalysisError(
      "The report photo analysis failed validation.",
    );
  }

  return {
    category: value.category,
    urgency: value.urgency,
    confidence: value.confidence,
    summary: value.summary.trim(),
    visualIndicators,
    falsePositiveCheck: value.falsePositiveCheck.trim(),
    actionRecommendations,
  };
}

function readAssistantContent(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.choices)) {
    throw new DeepSeekAnalysisError(
      "The report photo analysis returned no result.",
    );
  }

  const choices: unknown[] = value.choices;
  const firstChoice = choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new DeepSeekAnalysisError(
      "The report photo analysis returned no result.",
    );
  }

  if (
    typeof firstChoice.message.refusal === "string" &&
    firstChoice.message.refusal.trim().length > 0
  ) {
    throw new DeepSeekAnalysisError("The report photo analysis was refused.");
  }

  const content = firstChoice.message.content;
  if (typeof content !== "string" || content.trim().length === 0) {
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
    );
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const imageDataUrl = `data:image/webp;base64,${normalizedWebp.toString("base64")}`;

  let response: Response;
  try {
    response = await fetchImpl("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-flash",
        messages: [
          {
            role: "system",
            content:
              "Kamu membantu triase laporan kebakaran gambut di Indonesia. Analisis hanya hal yang terlihat pada foto. Jangan mengklaim lokasi, korban, atau kejadian yang tidak terlihat. Keluarkan satu objek JSON valid tanpa markdown. Gunakan category API_AKTIF, ASAP_GAMBUT, SEKAT_KANAL_KERING, atau AMAN_TERKENDALI; urgency KRITIS, WASPADA, atau RENDAH; confidence angka 0 sampai 1; summary string maksimal 500 karakter; visualIndicators array maksimal 8 string; falsePositiveCheck string; actionRecommendations array maksimal 3 string.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Berikan saran triase awal berdasarkan foto ini. Hasil AI adalah saran untuk ditinjau petugas, bukan keputusan final.",
              },
              {
                type: "image_url",
                image_url: { url: imageDataUrl, detail: "high" },
              },
            ],
          },
        ],
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        safety_check: { level: "high" },
        temperature: 0.1,
        max_tokens: 900,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new DeepSeekAnalysisError();
  }

  if (!response.ok) throw new DeepSeekAnalysisError();

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
    content = readAssistantContent(payload);
  } catch (error) {
    if (error instanceof DeepSeekAnalysisError) throw error;
    throw new DeepSeekAnalysisError();
  }

  let assessment: unknown;
  try {
    const parsedJson: unknown = JSON.parse(content);
    assessment = parsedJson;
  } catch {
    throw new DeepSeekAnalysisError(
      "The report photo analysis returned invalid JSON.",
    );
  }

  return parseDeepSeekAssessment(assessment);
}
