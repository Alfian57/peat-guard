import { describe, expect, test } from "bun:test";

import {
  analyzeNormalizedReportPhoto,
  DeepSeekAnalysisError,
  parseDeepSeekAssessment,
} from "@/lib/server/ai/deepseek";

const validProviderAssessment = {
  category: "ASAP_GAMBUT",
  urgency: "WASPADA",
  confidence_score: 0.78,
  visual_indicators: ["Asap tipis"],
  false_positive_check:
    "Perlu pemeriksaan petugas untuk menyingkirkan kabut pagi.",
  action_recommendations: ["Periksa titik dari jalur aman."],
};
const validAssessment = {
  category: "ASAP_GAMBUT",
  urgency: "WASPADA",
  confidence: 0.78,
  summary: null,
  visualIndicators: ["Asap tipis"],
  falsePositiveCheck:
    "Perlu pemeriksaan petugas untuk menyingkirkan kabut pagi.",
  actionRecommendations: ["Periksa titik dari jalur aman."],
};

describe("DeepSeek report photo analysis", () => {
  test("accepts only the bounded report assessment shape", () => {
    expect(parseDeepSeekAssessment(validProviderAssessment)).toEqual(
      validAssessment,
    );
  });

  test("rejects invalid enums, confidence, extra fields, and unbounded suggestions", () => {
    expect(() =>
      parseDeepSeekAssessment({
        ...validProviderAssessment,
        urgency: "SEGERA",
      }),
    ).toThrow(DeepSeekAnalysisError);
    expect(() =>
      parseDeepSeekAssessment({
        ...validProviderAssessment,
        confidence_score: 1.2,
      }),
    ).toThrow(DeepSeekAnalysisError);
    expect(() =>
      parseDeepSeekAssessment({
        ...validProviderAssessment,
        internalReasoning: "extra",
      }),
    ).toThrow(DeepSeekAnalysisError);
    expect(() =>
      parseDeepSeekAssessment({
        ...validProviderAssessment,
        action_recommendations: ["x".repeat(241)],
      }),
    ).toThrow(DeepSeekAnalysisError);
    expect(() =>
      parseDeepSeekAssessment({
        ...validProviderAssessment,
        action_recommendations: ["1", "2", "3", "4"],
      }),
    ).toThrow(DeepSeekAnalysisError);
    expect(() => parseDeepSeekAssessment(validAssessment)).toThrow(
      DeepSeekAnalysisError,
    );
  });

  test("sends normalized WebP bytes and parses provider output", async () => {
    let requestBody = "";
    let requestUrl = "";
    const fetchImpl: typeof fetch = async (input, init) => {
      requestUrl = String(input);
      requestBody = String(init?.body ?? "");
      return Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(validProviderAssessment),
              },
            ],
          },
        ],
      });
    };

    const assessment = await analyzeNormalizedReportPhoto(
      Buffer.from("normalized-webp"),
      { apiKey: "test-key", fetchImpl },
    );

    expect(assessment).toEqual(validAssessment);
    expect(requestUrl).toBe("https://api.deepseek.com/responses");
    const requestPayload: unknown = JSON.parse(requestBody);
    expect(requestPayload).toMatchObject({
      model: "deepseek-flash",
      reasoning: { effort: "none" },
      safety_check: { level: "high" },
      max_output_tokens: 900,
      text: { format: { type: "text" } },
      input: [
        {
          role: "user",
          content: [
            { type: "input_text" },
            {
              type: "input_image",
              detail: "high",
              image_url: `data:image/webp;base64,${Buffer.from("normalized-webp").toString("base64")}`,
            },
          ],
        },
      ],
    });
    expect(requestBody).not.toContain('"confidence":');
    expect(requestBody).not.toContain('"visualIndicators":');
    expect(requestBody).not.toContain('"falsePositiveCheck":');
    expect(requestBody).not.toContain('"actionRecommendations":');
    expect(requestBody).not.toContain('"summary"');
    expect(requestBody).not.toContain('"maxItems"');
    expect(requestBody).not.toContain('"maxLength"');
    expect(requestBody).not.toContain('"minLength"');
    expect(requestPayload).toMatchObject({
      input: [
        {
          content: [
            {
              text: expect.stringContaining(
                '"required":["category","urgency","confidence_score","visual_indicators","false_positive_check","action_recommendations"]',
              ),
            },
            expect.anything(),
          ],
        },
      ],
    });
    expect(requestBody).toContain("awan rendah");
    expect(requestBody).toContain("sumber asap non-kebakaran");
    expect(requestBody).toContain("maksimal 3 rekomendasi");
    expect(requestBody).toContain('"model":"deepseek-flash"');
  });

  test("treats Responses API refusals and incomplete output as failed analysis", async () => {
    const refusedFetch: typeof fetch = async () =>
      Response.json({
        status: "incomplete",
        incomplete_details: { reason: "content_filter" },
        output: [],
      });
    const incompleteFetch: typeof fetch = async () =>
      Response.json({
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output: [],
      });

    await expect(
      analyzeNormalizedReportPhoto(Buffer.from("photo"), {
        apiKey: "test-key",
        fetchImpl: refusedFetch,
      }),
    ).rejects.toThrow("The report photo analysis was refused.");
    await expect(
      analyzeNormalizedReportPhoto(Buffer.from("photo"), {
        apiKey: "test-key",
        fetchImpl: incompleteFetch,
      }),
    ).rejects.toThrow("The report photo analysis did not complete.");
  });

  test("rejects a refusal part even when the response status is completed", async () => {
    const fetchImpl: typeof fetch = async () =>
      Response.json({
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              { type: "refusal", refusal: "Image was blocked by review." },
            ],
          },
        ],
      });

    await expect(
      analyzeNormalizedReportPhoto(Buffer.from("photo"), {
        apiKey: "test-key",
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(DeepSeekAnalysisError);
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
        status: "completed",
        output: [
          {
            type: "message",
            refusal: "The image could not be analyzed.",
            content: [
              {
                type: "output_text",
                text: JSON.stringify(validProviderAssessment),
              },
            ],
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
