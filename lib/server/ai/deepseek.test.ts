import { describe, expect, test } from "bun:test";

import {
  analyzeNormalizedReportPhoto,
  DeepSeekAnalysisError,
  parseDeepSeekAssessment,
} from "@/lib/server/ai/deepseek";

const validAssessment = {
  category: "ASAP_GAMBUT",
  urgency: "WASPADA",
  confidence: 0.78,
  summary: "Terlihat asap tipis di antara pepohonan.",
  visualIndicators: ["Asap tipis"],
  falsePositiveCheck:
    "Perlu pemeriksaan petugas untuk menyingkirkan kabut pagi.",
  actionRecommendations: ["Periksa titik dari jalur aman."],
};

describe("DeepSeek report photo analysis", () => {
  test("accepts only the bounded report assessment shape", () => {
    expect(parseDeepSeekAssessment(validAssessment)).toEqual(validAssessment);
  });

  test("rejects invalid enums, confidence, extra fields, and unbounded suggestions", () => {
    expect(() =>
      parseDeepSeekAssessment({ ...validAssessment, urgency: "SEGERA" }),
    ).toThrow(DeepSeekAnalysisError);
    expect(() =>
      parseDeepSeekAssessment({ ...validAssessment, confidence: 1.2 }),
    ).toThrow(DeepSeekAnalysisError);
    expect(() =>
      parseDeepSeekAssessment({
        ...validAssessment,
        internalReasoning: "extra",
      }),
    ).toThrow(DeepSeekAnalysisError);
    expect(() =>
      parseDeepSeekAssessment({
        ...validAssessment,
        actionRecommendations: ["x".repeat(241)],
      }),
    ).toThrow(DeepSeekAnalysisError);
  });

  test("sends normalized WebP bytes and parses provider output", async () => {
    let requestBody = "";
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestBody = String(init?.body ?? "");
      return Response.json({
        choices: [{ message: { content: JSON.stringify(validAssessment) } }],
      });
    };

    const assessment = await analyzeNormalizedReportPhoto(
      Buffer.from("normalized-webp"),
      { apiKey: "test-key", fetchImpl },
    );

    expect(assessment).toEqual(validAssessment);
    expect(requestBody).toContain(
      `data:image/webp;base64,${Buffer.from("normalized-webp").toString("base64")}`,
    );
    expect(requestBody).toContain('"model":"deepseek-flash"');
    expect(requestBody).toContain('"safety_check":{"level":"high"}');
  });

  test("does not issue a provider request without configuration", async () => {
    let requestCount = 0;
    const fetchImpl: typeof fetch = async () => {
      requestCount += 1;
      return Response.json({});
    };

    await expect(
      analyzeNormalizedReportPhoto(Buffer.from("normalized-webp"), {
        apiKey: "",
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(DeepSeekAnalysisError);
    expect(requestCount).toBe(0);
  });

  test("treats a provider safety refusal as a failed analysis", async () => {
    const fetchImpl: typeof fetch = async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify(validAssessment),
              refusal: "The image could not be analyzed.",
            },
          },
        ],
      });

    await expect(
      analyzeNormalizedReportPhoto(Buffer.from("normalized-webp"), {
        apiKey: "test-key",
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(DeepSeekAnalysisError);
  });
});
