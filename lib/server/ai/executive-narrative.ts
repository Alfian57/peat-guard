import "server-only";

const EXECUTIVE_METRIC_KEYS = [
  "satelliteHotspotCount",
  "fieldReportCount",
  "aiTriagedReportCount",
  "activeReportCount",
  "closedReportCount",
  "reportsWithResponseTime",
  "averageResponseMinutes",
  "estimatedCarbonTons",
  "estimatedIncentiveIdr",
] as const;

const NARRATIVE_KEYS = ["headline", "narrative", "recommendations"] as const;
const MAX_COUNT = 1_000_000;
const MAX_CARBON_TONS = 1_000_000_000_000;
const MAX_INCENTIVE_IDR = 1_000_000_000_000_000;
const MAX_RESPONSE_MINUTES = 60 * 24 * 365 * 100;
const NUMBER_WORDS = [
  "nol|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas",
  "belasan|puluh|puluhan|seratus|ratus|ratusan|seribu|ribu|ribuan",
  "juta|jutaan|miliaran|milyaran|miliar|milyar|triliun|triliunan",
  "pertama|kedua|ketiga|setengah|separo|persen|persentase",
  "rp|rupiah|ton|tons|tonne|tonnes|hektare|hektar|hectare|hectares|idr|dolar|usd",
  "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen",
  "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|first|second|third|fourth|fifth",
  "dozen|dozens|hundred|hundreds|thousand|thousands|million|millions|billion|billions",
  "several|multiple|many|few|banyak|sedikit|most|majority|minority|mayoritas|minoritas",
  "terbanyak|terendah|half|pair|couple|single|double|triple|twice|once",
].join("|");
const QUANTITY_PHRASES = [
  "sebagian\\s+besar",
  "sebagian\\s+kecil",
  "lebih\\s+dari",
  "kurang\\s+dari",
  "lebih\\s+banyak",
  "lebih\\s+sedikit",
  "paling\\s+tinggi",
  "paling\\s+rendah",
  "di\\s+atas",
  "di\\s+bawah",
  "around",
  "approximately",
  "more\\s+than",
  "less\\s+than",
  "fewer\\s+than",
];
const UNSUPPORTED_TREND_WORDS =
  "meningkat|peningkatan|menurun|penurunan|bertambah|bertambahnya|berkurang|pengurangan|membaik|perbaikan|stabil|stabilisasi|kenaikan|dibandingkan|tren|trend|naik|turun|increase|increased|increasing|rise|rose|rising|decrease|decreased|decreasing|higher|lower|more|less|fall|fell|falling|improve|improved|improving|stable|stabilize";
const UNSUPPORTED_CLAIM_PATTERN = new RegExp(
  `\\p{N}|\\b(?:${NUMBER_WORDS}|${UNSUPPORTED_TREND_WORDS})\\b|\\b(?:${QUANTITY_PHRASES.join("|")})\\b`,
  "iu",
);

export type ExecutiveNarrativeMetrics = {
  satelliteHotspotCount: number | null;
  fieldReportCount: number;
  aiTriagedReportCount: number;
  activeReportCount: number;
  closedReportCount: number;
  reportsWithResponseTime: number;
  averageResponseMinutes: number | null;
  estimatedCarbonTons: number | null;
  estimatedIncentiveIdr: number | null;
};

export type ExecutiveNarrativeInput = {
  consent: true;
  metrics: ExecutiveNarrativeMetrics;
};

export type ExecutiveNarrative = {
  headline: string;
  narrative: string;
  recommendations: string[];
};

export class DeepSeekNarrativeError extends Error {
  constructor(message = "The executive narrative is unavailable.") {
    super(message);
    this.name = "DeepSeekNarrativeError";
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

function isBoundedNumber(
  value: unknown,
  maximum: number,
  integer = false,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= maximum &&
    (!integer || Number.isInteger(value))
  );
}

function isOptionalBoundedNumber(
  value: unknown,
  maximum: number,
): value is number | null {
  return value === null || isBoundedNumber(value, maximum);
}

function isBoundedText(value: unknown, maximumLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maximumLength &&
    !UNSUPPORTED_CLAIM_PATTERN.test(value)
  );
}

function parseRecommendations(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const items: unknown[] = value;
  if (items.length < 1 || items.length > 3) return null;

  const recommendations: string[] = [];
  for (const item of items) {
    if (!isBoundedText(item, 200)) return null;
    recommendations.push(item.trim());
  }

  return recommendations;
}

function parseExecutiveNarrativeMetrics(
  value: unknown,
): ExecutiveNarrativeMetrics {
  if (!isRecord(value) || !hasExactKeys(value, EXECUTIVE_METRIC_KEYS)) {
    throw new DeepSeekNarrativeError(
      "Only anonymized aggregate metrics are accepted.",
    );
  }

  const satelliteHotspotCount = value.satelliteHotspotCount;
  const fieldReportCount = value.fieldReportCount;
  const aiTriagedReportCount = value.aiTriagedReportCount;
  const activeReportCount = value.activeReportCount;
  const closedReportCount = value.closedReportCount;
  const reportsWithResponseTime = value.reportsWithResponseTime;
  const averageResponseMinutes = value.averageResponseMinutes;
  const estimatedCarbonTons = value.estimatedCarbonTons;
  const estimatedIncentiveIdr = value.estimatedIncentiveIdr;

  if (
    (satelliteHotspotCount !== null &&
      !isBoundedNumber(satelliteHotspotCount, MAX_COUNT, true)) ||
    !isBoundedNumber(fieldReportCount, MAX_COUNT, true) ||
    !isBoundedNumber(aiTriagedReportCount, MAX_COUNT, true) ||
    !isBoundedNumber(activeReportCount, MAX_COUNT, true) ||
    !isBoundedNumber(closedReportCount, MAX_COUNT, true) ||
    !isBoundedNumber(reportsWithResponseTime, MAX_COUNT, true) ||
    !isOptionalBoundedNumber(estimatedCarbonTons, MAX_CARBON_TONS) ||
    !isOptionalBoundedNumber(estimatedIncentiveIdr, MAX_INCENTIVE_IDR)
  ) {
    throw new DeepSeekNarrativeError(
      "Aggregate report metrics failed validation.",
    );
  }

  if (
    aiTriagedReportCount > fieldReportCount ||
    activeReportCount + closedReportCount > fieldReportCount ||
    reportsWithResponseTime > fieldReportCount
  ) {
    throw new DeepSeekNarrativeError(
      "Aggregate report metrics failed validation.",
    );
  }

  let validatedAverageResponseMinutes: number | null = null;
  if (reportsWithResponseTime === 0) {
    if (averageResponseMinutes !== null) {
      throw new DeepSeekNarrativeError(
        "Aggregate report metrics failed validation.",
      );
    }
  } else {
    if (!isBoundedNumber(averageResponseMinutes, MAX_RESPONSE_MINUTES)) {
      throw new DeepSeekNarrativeError(
        "Aggregate report metrics failed validation.",
      );
    }
    validatedAverageResponseMinutes = averageResponseMinutes;
  }

  return {
    satelliteHotspotCount,
    fieldReportCount,
    aiTriagedReportCount,
    activeReportCount,
    closedReportCount,
    reportsWithResponseTime,
    averageResponseMinutes: validatedAverageResponseMinutes,
    estimatedCarbonTons,
    estimatedIncentiveIdr,
  };
}

export function parseExecutiveNarrativeInput(
  value: unknown,
): ExecutiveNarrativeInput {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["consent", "metrics"]) ||
    value.consent !== true
  ) {
    throw new DeepSeekNarrativeError(
      "Explicit consent and anonymized aggregate metrics are required.",
    );
  }

  return {
    consent: true,
    metrics: parseExecutiveNarrativeMetrics(value.metrics),
  };
}

function readAssistantContent(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.choices)) {
    throw new DeepSeekNarrativeError(
      "The narrative provider returned no result.",
    );
  }

  const choices: unknown[] = value.choices;
  const firstChoice = choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new DeepSeekNarrativeError(
      "The narrative provider returned no result.",
    );
  }

  if (
    typeof firstChoice.message.refusal === "string" &&
    firstChoice.message.refusal.trim().length > 0
  ) {
    throw new DeepSeekNarrativeError(
      "The narrative provider refused the request.",
    );
  }

  const content = firstChoice.message.content;
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new DeepSeekNarrativeError(
      "The narrative provider returned no text.",
    );
  }

  return content;
}

export function parseExecutiveNarrative(value: unknown): ExecutiveNarrative {
  if (!isRecord(value) || !hasExactKeys(value, NARRATIVE_KEYS)) {
    throw new DeepSeekNarrativeError(
      "The narrative provider returned an invalid shape.",
    );
  }

  const recommendations = parseRecommendations(value.recommendations);
  if (
    !isBoundedText(value.headline, 120) ||
    !isBoundedText(value.narrative, 800) ||
    !recommendations
  ) {
    throw new DeepSeekNarrativeError(
      "The narrative provider returned invalid text.",
    );
  }

  return {
    headline: value.headline.trim(),
    narrative: value.narrative.trim(),
    recommendations,
  };
}

export async function generateExecutiveNarrative(
  input: ExecutiveNarrativeInput,
  options: { apiKey?: string; fetchImpl?: typeof fetch } = {},
): Promise<ExecutiveNarrative> {
  const normalizedInput = parseExecutiveNarrativeInput(input);
  const apiKey = options.apiKey ?? process.env.DEEPSEEK_API_KEY;
  if (!apiKey?.trim()) {
    throw new DeepSeekNarrativeError(
      "The executive narrative provider is not configured.",
    );
  }

  const fetchImpl = options.fetchImpl ?? fetch;
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
              "Kamu menyusun draf narasi eksekutif berbahasa Indonesia untuk laporan situasi dan kepatuhan MRV gambut. Gunakan hanya fakta agregat yang diberikan dan jangan menyimpulkan sebab, lokasi, atau kondisi yang tidak tersedia. Nilai null berarti metrik tersebut belum tersedia; jangan menafsirkannya sebagai nol. Tulis singkat dan kualitatif. Jangan menulis angka, digit, tanggal, mata uang, jumlah, perbandingan, tren, persentase, atau klaim kuantitatif dalam field teks; angka resmi akan ditampilkan langsung dari database secara terpisah. Berikan satu headline maksimal 120 karakter, satu narasi maksimal 800 karakter, dan 1 sampai 3 rekomendasi maksimal 200 karakter masing-masing. Berikan narasi langsung tanpa membahas cara laporan dibuat, perintah ini, data yang tidak tersedia, atau kata seperti nol, satu, persentase, jumlah, meningkat, dan menurun. Contoh gaya yang valid: “Pantauan lapangan membutuhkan koordinasi berkelanjutan. Tinjau laporan aktif dan catat perkembangan respons.” Keluarkan tepat satu objek JSON dengan key headline, narrative, recommendations; tanpa markdown dan tanpa field lain.",
          },
          {
            role: "user",
            content: JSON.stringify(normalizedInput.metrics),
          },
        ],
        thinking: { type: "disabled" },
        response_format: { type: "text" },
        safety_check: { level: "high" },
        temperature: 0.2,
        max_tokens: 600,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new DeepSeekNarrativeError();
  }

  if (!response.ok) throw new DeepSeekNarrativeError();

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DeepSeekNarrativeError(
      "The narrative provider returned invalid JSON.",
    );
  }

  const content = readAssistantContent(payload);
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      content.replace(/^```(?:json)?\s*([\s\S]+?)\s*```$/i, "$1"),
    );
  } catch {
    throw new DeepSeekNarrativeError(
      "The narrative provider returned invalid JSON.",
    );
  }

  return parseExecutiveNarrative(parsed);
}
