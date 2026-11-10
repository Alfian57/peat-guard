import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  PublicMapFiltersPanel,
  type PublicMapFilters,
} from "@/components/public/public-map-filters";

test("filters are labeled and viewport searches require an explicit action", async () => {
  const user = userEvent.setup();
  const changedFilters: Partial<PublicMapFilters>[] = [];
  let viewportSearches = 0;

  render(
    <PublicMapFiltersPanel
      filters={{ period: "7d", source: "all", confidence: "all" }}
      hasUnappliedViewport
      isLoading={false}
      onChange={(filters) => changedFilters.push(filters)}
      onSearchViewport={() => {
        viewportSearches += 1;
      }}
    />,
  );

  await user.selectOptions(screen.getByLabelText(/Waktu pengamatan/), "24h");
  await user.selectOptions(screen.getByLabelText(/Sumber hotspot/), "demo");
  await user.selectOptions(screen.getByLabelText(/Keyakinan satelit/), "high");
  await user.click(screen.getByRole("button", { name: "Cari di area peta" }));

  expect(changedFilters).toEqual([
    { period: "24h" },
    { source: "demo" },
    { confidence: "high" },
  ]);
  expect(viewportSearches).toBe(1);
});

test("disables the area search when the viewport has not changed", () => {
  render(
    <PublicMapFiltersPanel
      filters={{ period: "7d", source: "all", confidence: "all" }}
      hasUnappliedViewport={false}
      isLoading={false}
      onChange={() => undefined}
      onSearchViewport={() => undefined}
    />,
  );

  const searchButton = screen.getByRole("button", {
    name: "Cari di area peta",
  }) as HTMLButtonElement;

  expect(searchButton.disabled).toBe(true);
});
