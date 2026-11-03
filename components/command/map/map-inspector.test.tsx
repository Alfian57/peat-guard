import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { MapInspector } from "@/components/command/map/map-inspector";

test("shows report urgency, current status, and a link to its detail", () => {
  render(
    <MapInspector
      point={{
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        coordinates: [114.75, -1.25],
        kind: "report",
        label: "PG-AAAAAAAA",
        description: "Asap gambut · Dalam penanganan · 15/11/26",
        urgency: "KRITIS",
        isDemoData: false,
      }}
      zone={null}
    />,
  );

  expect(screen.getByText(/Dalam penanganan/)).toBeTruthy();
  expect(screen.getByText("Kritis")).toBeTruthy();
  expect(
    screen
      .getByRole("link", { name: "Buka detail laporan" })
      .getAttribute("href"),
  ).toBe("/command/reports/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
});

test("labels a report with no AI urgency as unrated", () => {
  render(
    <MapInspector
      point={{
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        coordinates: [114.75, -1.25],
        kind: "report",
        label: "PG-BBBBBBBB",
        description: "Kategori belum dinilai · Menunggu tindakan · 15/11/26",
      }}
      zone={null}
    />,
  );

  expect(screen.getByText("Belum dinilai")).toBeTruthy();
});
