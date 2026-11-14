import { mock, test, expect } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { parseLedgerFilters } from "@/lib/server/mrv/validation";

mock.module("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

mock.module("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <span aria-label={alt} data-source={src} role="img" />
  ),
}));

const { LedgerView } = await import("@/components/audit/ledger/ledger-view");

const filters = {
  aiState: null,
  evidence: "all" as const,
  page: 1,
  pageSize: 25,
  reportId: null,
  range: null,
  zoneId: null,
};

const ledger = {
  filters: {
    aiState: null,
    evidence: "all" as const,
    from: null,
    reportId: null,
    to: null,
    zoneId: null,
  },
  page: 1,
  pageSize: 25,
  rows: [
    {
      aiTriage: {
        category: "ASAP_GAMBUT",
        confidence: 0.94,
        state: "COMPLETED",
        urgency: "WASPADA",
      },
      coordinates: {
        accuracyMeters: 17.5,
        latitude: -2.3194,
        longitude: 113.9102,
        status: "recorded_not_verified" as const,
      },
      createdAt: "2026-11-15T02:25:00.000Z",
      capturedAt: "2026-11-15T02:24:00.000Z",
      evidenceStatus: "complete" as const,
      auditHistory: [],
      hasPhoto: true,
      handlingStatus: "MENUNGGU_TINDAKAN",
      isDemoSample: false,
      photoHref: "/api/reports/61000000-0000-4000-8000-000000000001/photo",
      reportId: "61000000-0000-4000-8000-000000000001",
      statusHistory: [],
      syncedAt: "2026-11-15T02:31:00.000Z",
      villageName: "Desa Contoh",
      zoneName: "Zona Contoh",
      zoneImpactContext: null,
    },
  ],
  total: 30,
};

function getLedgerFormSearchParams(form: HTMLFormElement): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of new window.FormData(form).entries()) {
    if (typeof value === "string") params.append(key, value);
  }

  return params;
}

function submitLedgerFilterForm(form: HTMLFormElement): URLSearchParams {
  let submittedParams: URLSearchParams | null = null;

  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      submittedParams = getLedgerFormSearchParams(form);
    },
    { once: true },
  );
  fireEvent.submit(form);

  if (!submittedParams) {
    throw new Error("Ledger filter form did not submit.");
  }

  return submittedParams;
}

test("ledger shows factual GPS evidence, private photo viewer, filters, and pagination", () => {
  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={ledger}
      to=""
      zones={[]}
    />,
  );

  expect(
    screen.getByRole("button", { name: "Filter buku besar" }),
  ).toBeTruthy();
  expect(
    screen.getByText("Koordinat tercatat · belum diverifikasi"),
  ).toBeTruthy();
  expect(screen.getByText("Akurasi perangkat: 17,5 m")).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Lihat foto bukti laporan 61000000" }),
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: "Ekspor data" })).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Halaman berikutnya" })
      .getAttribute("href"),
  ).toContain("page=2");
  expect(
    screen.getByText(
      /Estimasi emisi dicegah per zona ditampilkan sebagai konteks/,
    ),
  ).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "Aksi" })).toBeTruthy();
  expect(
    screen.getByRole("button", { name: "Peninjauan bukti laporan 61000000" }),
  ).toBeTruthy();
  expect(screen.getByText("Belum ditinjau")).toBeTruthy();
  expect(screen.queryByRole("dialog") === null).toBe(true);
  expect(
    screen.queryByText(
      "Snapshot audit awal belum tersedia untuk laporan ini.",
    ) === null,
  ).toBe(true);
});

test("status history opens from Aksi and returns focus after closing its empty state", async () => {
  const user = userEvent.setup();
  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={ledger}
      to=""
      zones={[]}
    />,
  );

  const trigger = screen.getByRole("button", {
    name: "Riwayat status laporan 61000000",
  });
  const cell = trigger.closest("td")!;
  expect(cell.cellIndex).toBe(8);
  expect(
    within(cell).getByRole("button", {
      name: "Peninjauan bukti laporan 61000000",
    }),
  ).toBeTruthy();
  expect(screen.queryByText("Belum ada perubahan status.") === null).toBe(true);

  await user.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Riwayat status" });
  const closeButton = within(dialog).getByRole("button", {
    name: "Tutup riwayat status",
  });
  expect(within(dialog).getByText("Belum ada perubahan status.")).toBeTruthy();
  expect(document.activeElement === closeButton).toBe(true);
  await user.keyboard("{Tab}");
  expect(document.activeElement === closeButton).toBe(true);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog") === null).toBe(true);
  expect(document.activeElement === trigger).toBe(true);
});

test("status dialog shows only the selected report history", async () => {
  const user = userEvent.setup();
  const historyLedger = {
    ...ledger,
    rows: [
      {
        ...ledger.rows[0],
        statusHistory: [
          {
            actorRole: "POSKO",
            createdAt: "2026-11-15T03:00:00.000Z",
            eventId: "63000000-0000-4000-8000-000000000003",
            previousStatus: "MENUNGGU_TINDAKAN",
            nextStatus: "DALAM_PENANGANAN",
          },
        ],
      },
      {
        ...ledger.rows[0],
        reportId: "62000000-0000-4000-8000-000000000002",
      },
    ],
  };
  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={historyLedger}
      to=""
      zones={[]}
    />,
  );

  await user.click(
    screen.getByRole("button", { name: "Riwayat status laporan 61000000" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Riwayat status" });
  expect(
    within(dialog).getByText("Menunggu tindakan → Dalam penanganan"),
  ).toBeTruthy();
  expect(dialog.textContent).toContain("POSKO");
  await user.click(
    within(dialog).getByRole("button", { name: "Tutup riwayat status" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Riwayat status laporan 62000000" }),
  );
  expect(screen.getByText("Belum ada perubahan status.")).toBeTruthy();
  expect(
    screen.queryByText("Menunggu tindakan → Dalam penanganan") === null,
  ).toBe(true);
});

test("review timeline exposes stored evidence and permits human review when AI was skipped", async () => {
  const user = userEvent.setup();
  const evidenceEntry = {
    actorRole: "SYSTEM",
    classification: null,
    createdAt: "2026-11-15T02:31:00.000Z",
    decision: null,
    eventId: "63000000-0000-4000-8000-000000000001",
    eventType: "REPORT_EVIDENCE_RECORDED" as const,
    evidenceSnapshot: {
      accuracyMeters: 17.5,
      aiCategory: null,
      aiConfidence: null,
      aiState: "SKIPPED",
      aiUrgency: null,
      capturedAt: "2026-11-15T02:24:00.000Z",
      latitude: -2.3194,
      longitude: 113.9102,
      photoPresent: true,
      photoSha256: null,
      syncedAt: "2026-11-15T02:31:00.000Z",
    },
    source: "field_sync" as const,
  };
  const reviewEntry = {
    actorRole: "VERIFIKATOR",
    classification: null,
    createdAt: "2026-11-15T03:00:00.000Z",
    decision: "ACCEPTED" as const,
    eventId: "63000000-0000-4000-8000-000000000002",
    eventType: "MRV_EVIDENCE_REVIEWED" as const,
    evidenceSnapshot: {
      ...evidenceEntry.evidenceSnapshot,
      photoSha256: "a".repeat(64),
    },
    source: null,
  };
  const reviewLedger = {
    ...ledger,
    rows: [
      {
        ...ledger.rows[0],
        aiTriage: { ...ledger.rows[0].aiTriage, state: "SKIPPED" },
        auditHistory: [evidenceEntry],
      },
    ],
  };

  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={reviewLedger}
      to=""
      zones={[]}
    />,
  );

  const trigger = screen.getByRole("button", {
    name: "Peninjauan bukti laporan 61000000",
  });
  await user.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Peninjauan bukti" });
  expect(
    document.activeElement ===
      within(dialog).getByRole("button", { name: "Tutup peninjauan bukti" }),
  ).toBe(true);
  expect(screen.getByText("Bukti awal dicatat")).toBeTruthy();
  expect(screen.getByText("Koordinat tersimpan")).toBeTruthy();
  expect(screen.getAllByText("-2.3194, 113.9102").length).toBeGreaterThan(1);
  expect(screen.getByText(/Triase: Tidak dianalisis/)).toBeTruthy();
  expect(
    within(dialog).getByText(/Tidak dianalisis · Belum diklasifikasikan/),
  ).toBeTruthy();
  expect(screen.getByText(/tidak diverifikasi secara independen/)).toBeTruthy();

  const acceptButton = screen.getByRole("button", {
    name: "Terima bukti",
  });
  expect((acceptButton as HTMLButtonElement).disabled).toBe(false);
  expect(
    screen.getByRole("button", {
      name: "Lihat foto bukti laporan 61000000",
    }),
  ).toBeTruthy();

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    expect(input).toBe(
      "/api/command/mrv/ledger/61000000-0000-4000-8000-000000000001/review",
    );
    expect(init?.cache).toBe("no-store");
    expect(init?.credentials).toBe("same-origin");
    expect(init?.body).toBe(JSON.stringify({ decision: "ACCEPTED" }));

    return new Response(JSON.stringify({ review: reviewEntry }), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  };

  try {
    await user.click(acceptButton);
    await screen.findByText("Bukti diterima");
    expect(screen.queryByRole("dialog") === null).toBe(true);
    expect(document.activeElement === trigger).toBe(true);
    await user.click(trigger);
    expect(
      within(
        screen.getByRole("dialog", { name: "Peninjauan bukti" }),
      ).getByText("Keputusan peninjauan: bukti diterima"),
    ).toBeTruthy();
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("review dialog preserves the history and permits retry after a failed decision", async () => {
  const user = userEvent.setup();
  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={ledger}
      to=""
      zones={[]}
    />,
  );
  await user.click(
    screen.getByRole("button", { name: "Peninjauan bukti laporan 61000000" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Peninjauan bukti" });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ error: "Koneksi terputus, coba lagi." }, { status: 503 });
  try {
    await user.click(
      within(dialog).getByRole("button", {
        name: "Minta tindak lanjut",
      }),
    );
    expect((await within(dialog).findByRole("alert")).textContent).toBe(
      "Koneksi terputus, coba lagi.",
    );
    expect(
      within(dialog).getByText(
        "Snapshot audit awal belum tersedia untuk laporan ini.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Belum ditinjau")).toBeTruthy();
    expect(
      within(dialog)
        .getByRole("button", { name: "Minta tindak lanjut" })
        .hasAttribute("disabled"),
    ).toBe(false);
    await user.keyboard("{Escape}");
    await user.click(
      screen.getByRole("button", { name: "Peninjauan bukti laporan 61000000" }),
    );
    expect(screen.getByRole("alert").textContent).toBe(
      "Koneksi terputus, coba lagi.",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("review dialog prevents accepting incomplete evidence while keeping follow-up available", async () => {
  const user = userEvent.setup();
  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={{
        ...ledger,
        rows: [
          {
            ...ledger.rows[0],
            hasPhoto: false,
            photoHref: null,
            evidenceStatus: "incomplete",
          },
        ],
      }}
      to=""
      zones={[]}
    />,
  );
  await user.click(
    screen.getByRole("button", { name: "Peninjauan bukti laporan 61000000" }),
  );
  const dialog = screen.getByRole("dialog", { name: "Peninjauan bukti" });
  const closeButton = within(dialog).getByRole("button", {
    name: "Tutup peninjauan bukti",
  });
  expect(
    within(dialog)
      .getByRole("button", { name: "Terima bukti" })
      .hasAttribute("disabled"),
  ).toBe(true);
  expect(
    within(dialog)
      .getByRole("button", { name: "Minta tindak lanjut" })
      .hasAttribute("disabled"),
  ).toBe(false);
  await user.keyboard("{Shift>}{Tab}{/Shift}");
  expect(
    document.activeElement ===
      within(dialog).getByRole("button", { name: "Tolak bukti" }),
  ).toBe(true);
  await user.keyboard("{Tab}");
  expect(document.activeElement === closeButton).toBe(true);
});

test("filter dialog applies supported filters and restores focus on Escape", async () => {
  const user = userEvent.setup();

  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={ledger}
      to=""
      zones={[]}
    />,
  );

  const trigger = screen.getByRole("button", { name: "Filter buku besar" });
  await user.click(trigger);

  const dialog = screen.getByRole("dialog", { name: "Filter buku besar MRV" });
  const evidenceFilter = screen.getByLabelText(/Kelengkapan bukti/);
  const aiFilter = screen.getByLabelText(/Triase AI/);

  expect(document.activeElement).toBe(screen.getByLabelText(/Zona gambut/));
  expect(dialog.textContent).toContain("bukan keputusan verifikator");
  await user.selectOptions(evidenceFilter, "complete");
  expect(aiFilter.hasAttribute("disabled")).toBe(false);
  expect(evidenceFilter.closest("form")?.getAttribute("action")).toBe(
    "/audit/ledger",
  );

  screen.getByRole("button", { name: "Tutup filter" }).focus();
  await user.keyboard("{Shift>}{Tab}{/Shift}");
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Terapkan filter" }),
  );
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("filter form submits parsable defaults, evidence-only, and AI-only filters", async () => {
  const user = userEvent.setup();

  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={ledger}
      to=""
      zones={[]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Filter buku besar" }));
  const form = screen
    .getByRole("button", { name: "Terapkan filter" })
    .closest("form");

  if (!form) throw new Error("Ledger filter form was not rendered.");

  const defaultParams = submitLedgerFilterForm(form);
  expect(defaultParams.toString()).toBe("evidence=all");
  expect(parseLedgerFilters(defaultParams).ok).toBe(true);

  await user.selectOptions(
    screen.getByLabelText(/Kelengkapan bukti/),
    "complete",
  );
  const evidenceParams = submitLedgerFilterForm(form);
  expect(evidenceParams.toString()).toBe("evidence=complete");
  expect(parseLedgerFilters(evidenceParams).ok).toBe(true);

  await user.selectOptions(screen.getByLabelText(/Kelengkapan bukti/), "all");
  await user.selectOptions(screen.getByLabelText(/Triase AI/), "FAILED");
  const aiParams = submitLedgerFilterForm(form);
  expect(aiParams.toString()).toBe("evidence=all&aiState=FAILED");
  expect(parseLedgerFilters(aiParams).ok).toBe(true);

  await user.selectOptions(
    screen.getByLabelText(/Kelengkapan bukti/),
    "complete",
  );
  await user.selectOptions(screen.getByLabelText(/Triase AI/), "SKIPPED");
  const evidenceAndAiParams = submitLedgerFilterForm(form);
  expect(evidenceAndAiParams.toString()).toBe(
    "evidence=complete&aiState=SKIPPED",
  );
  expect(parseLedgerFilters(evidenceAndAiParams).ok).toBe(true);

  const reportParams = new URLSearchParams(
    "reportId=61000000-0000-4000-8000-000000000001",
  );
  const reportFilters = parseLedgerFilters(reportParams);
  expect(reportFilters.ok && reportFilters.value.reportId).toBe(
    "61000000-0000-4000-8000-000000000001",
  );
});

test("report-specific ledger search survives applying other filters", async () => {
  const user = userEvent.setup();
  const reportId = "61000000-0000-4000-8000-000000000001";

  render(
    <LedgerView
      filterError={null}
      filters={{ ...filters, reportId }}
      from=""
      ledger={{
        ...ledger,
        filters: { ...ledger.filters, reportId },
      }}
      to=""
      zones={[]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Filter buku besar" }));
  const form = screen
    .getByRole("button", { name: "Terapkan filter" })
    .closest("form");
  if (!form) throw new Error("Ledger filter form was not rendered.");

  expect(submitLedgerFilterForm(form).get("reportId")).toBe(reportId);
});

test("export dialog summarizes scope and blocks results above the endpoint cap", async () => {
  const user = userEvent.setup();

  render(
    <LedgerView
      filterError={null}
      filters={{
        ...filters,
        evidence: "complete",
        range: {
          from: new Date("2026-11-01T00:00:00.000Z"),
          fromDate: "2026-11-01",
          toDate: "2026-11-15",
          toExclusive: new Date("2026-11-16T00:00:00.000Z"),
        },
      }}
      from="2026-11-01"
      ledger={ledger}
      to="2026-11-15"
      zones={[]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Ekspor data" }));
  expect(
    screen.getByRole("dialog", { name: "Ekspor buku besar MRV" }),
  ).toBeTruthy();
  expect(screen.getByText("30 baris")).toBeTruthy();
  expect(screen.getByText("2026-11-01 – 2026-11-15")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "Unduh CSV" }).getAttribute("href"),
  ).toContain("format=csv");
  expect(
    screen.getByRole("link", { name: "Unduh JSON" }).getAttribute("href"),
  ).toContain("evidence=complete");
  expect(
    screen.getByRole("link", { name: "Unduh CSV" }).getAttribute("href"),
  ).toContain("from=2026-11-01");
  expect(
    screen.getByRole("link", { name: "Unduh CSV" }).getAttribute("href"),
  ).toContain("to=2026-11-15");
});

test("export dialog explains the 5,000-row cap and hides unavailable downloads", async () => {
  const user = userEvent.setup();

  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={{ ...ledger, total: 5001 }}
      to=""
      zones={[]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Ekspor data" }));
  expect(screen.getByRole("alert").textContent).toContain("5.000 baris");
  expect(screen.queryByRole("link", { name: "Unduh CSV" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Unduh JSON" })).toBeNull();
});

test("photo viewer uses the private same-origin endpoint and restores focus", async () => {
  const user = userEvent.setup();

  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={ledger}
      to=""
      zones={[]}
    />,
  );

  const trigger = screen.getByRole("button", {
    name: "Lihat foto bukti laporan 61000000",
  });
  await user.click(trigger);

  const dialog = screen.getByRole("dialog", {
    name: "Foto bukti laporan 61000000",
  });
  expect(
    screen
      .getByRole("img", { name: "Foto bukti laporan 61000000" })
      .getAttribute("data-source"),
  ).toBe("/api/reports/61000000-0000-4000-8000-000000000001/photo");
  expect(dialog.textContent).toContain("belum diverifikasi secara independen");
  expect(document.activeElement).toBe(
    screen.getByRole("button", { name: "Tutup foto bukti" }),
  );

  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test("photo viewer refuses URLs outside the private report-photo route", () => {
  const unsafeLedger = {
    ...ledger,
    rows: [{ ...ledger.rows[0], photoHref: "https://example.com/photo.webp" }],
  };

  render(
    <LedgerView
      filterError={null}
      filters={filters}
      from=""
      ledger={unsafeLedger}
      to=""
      zones={[]}
    />,
  );

  expect(screen.getByText("Foto belum tersedia")).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: /Lihat foto bukti laporan/ }),
  ).toBeNull();
});

test("ledger shows a clear empty state and preserves filter errors", () => {
  render(
    <LedgerView
      filterError="Parameter aiState tidak valid."
      filters={filters}
      from=""
      ledger={{ ...ledger, rows: [], total: 0 }}
      to=""
      zones={[]}
    />,
  );

  expect(screen.getByRole("alert").textContent).toContain("aiState");
  expect(screen.getByText("Tidak ada catatan yang cocok")).toBeTruthy();
  expect(screen.getByText(/Menampilkan 0–0 dari 0 catatan/)).toBeTruthy();
});
