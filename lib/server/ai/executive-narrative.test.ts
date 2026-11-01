import { describe, expect, test } from "bun:test";

import {
  DeepSeekNarrativeError,
  generateExecutiveNarrative,
  parseExecutiveNarrative,
  parseExecutiveNarrativeInput,
  type ExecutiveNarrativeInput,
  type ExecutiveNarrativeMetrics,
} from "@/lib/server/ai/executive-narrative";

const validMetrics: ExecutiveNarrativeMetrics = {
  satelliteHotspotCount: 4,
  fieldReportCount: 12,
  aiTriagedReportCount: 10,
  activeReportCount: 5,
  closedReportCount: 7,
  reportsWithResponseTime: 7,
  averageResponseMinutes: 18.5,
  estimatedCarbonTons: 143.2,
  estimatedIncentiveIdr: 2_148_000,
};

const validInput: ExecutiveNarrativeInput = {
  consent: true,
  metrics: validMetrics,
};

const validNarrative = {
  headline: "Kesiapsiagaan lapangan perlu dipertahankan",
  narrative:
    "Aktivitas pemantauan dan tindak lanjut menunjukkan perlunya koordinasi yang konsisten.",
  recommendations: [
    "Pastikan laporan aktif segera ditinjau petugas.",
    "Lanjutkan pemantauan area dengan perhatian khusus.",
  ],
};

describe("DeepSeek executive narrative", () => {
  test("sends only validated anonymized metrics with high safety review", async () => {
    let requestBody = "";
    const fetchImpl: typeof fetch = async (_input, init) => {
      requestBody = String(init?.body);
      return Response.json({
        choices: [{ message: { content: JSON.stringify(validNarrative) } }],
      });
    };

    const result = await generateExecutiveNarrative(validInput, {
      apiKey: "test-key",
      fetchImpl,
    });

    expect(result).toEqual(validNarrative);
    expect(requestBody).toContain('"safety_check":{"level":"high"}');
    expect(requestBody).toContain('\\"satelliteHotspotCount\\":4');
    expect(requestBody).not.toContain("reportId");
    expect(requestBody).not.toContain("image_url");
    expect(requestBody).not.toContain("latitude");
  });

  test("requires explicit consent and bounded numeric-only aggregates", () => {
    const noConsent = { ...validInput, consent: false };
    expect(() => parseExecutiveNarrativeInput(noConsent)).toThrow(
      DeepSeekNarrativeError,
    );

    const extraIdentifier = {
      consent: true,
      metrics: { ...validMetrics, reportId: "private-report-id" },
    };
    expect(() => parseExecutiveNarrativeInput(extraIdentifier)).toThrow(
      DeepSeekNarrativeError,
    );

    const inconsistentCounts = {
      consent: true,
      metrics: { ...validMetrics, aiTriagedReportCount: 13 },
    };
    expect(() => parseExecutiveNarrativeInput(inconsistentCounts)).toThrow(
      DeepSeekNarrativeError,
    );
  });

  test("does not call the provider when its key or consent is missing", async () => {
    let requestCount = 0;
    const fetchImpl: typeof fetch = async () => {
      requestCount += 1;
      return Response.json({
        choices: [{ message: { content: JSON.stringify(validNarrative) } }],
      });
    };

    await expect(
      generateExecutiveNarrative(validInput, {
        apiKey: "",
        fetchImpl,
      }),
    ).rejects.toBeInstanceOf(DeepSeekNarrativeError);

    expect(requestCount).toBe(0);
  });

  test("treats safety refusals and malformed or numeric narrative text as failure", async () => {
    const refusalFetch: typeof fetch = async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify(validNarrative),
              refusal: "The request was refused.",
            },
          },
        ],
      });
    await expect(
      generateExecutiveNarrative(validInput, {
        apiKey: "test-key",
        fetchImpl: refusalFetch,
      }),
    ).rejects.toBeInstanceOf(DeepSeekNarrativeError);

    const malformedFetch: typeof fetch = async () =>
      Response.json({ choices: [{ message: { content: "not-json" } }] });
    await expect(
      generateExecutiveNarrative(validInput, {
        apiKey: "test-key",
        fetchImpl: malformedFetch,
      }),
    ).rejects.toBeInstanceOf(DeepSeekNarrativeError);

    for (const narrative of [
      "There were 12 reports in the selected period.",
      "The total is ١٢ reports.",
      "Nilai rupiah dan Rp perlu ditinjau.",
      "Ton karbon dan hektare gambut perlu diperhatikan.",
      "Mayoritas laporan memerlukan tindak lanjut.",
      "Sebagian besar laporan memerlukan tindak lanjut.",
      "Puluhan laporan menunggu pemeriksaan.",
      "Jutaan rupiah perlu dipastikan.",
      "Kondisi tercatat sebesar persen dari target.",
      "Kondisi laporan meningkat dibanding periode sebelumnya.",
      "Kondisi kanal membaik dan stabil.",
      "The response time is decreasing.",
    ]) {
      expect(() =>
        parseExecutiveNarrative({ ...validNarrative, narrative }),
      ).toThrow(DeepSeekNarrativeError);
    }
    expect(() =>
      parseExecutiveNarrative({
        ...validNarrative,
        estimatedCarbonTons: 143.2,
      }),
    ).toThrow(DeepSeekNarrativeError);
  });
});
