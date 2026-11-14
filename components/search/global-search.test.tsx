import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { GlobalSearch } from "./global-search";

test("opens one dialog when desktop and mobile triggers share Ctrl+K", () => {
  render(
    <>
      <GlobalSearch variant="bar" />
      <GlobalSearch />
    </>,
  );
  const triggers = screen.getAllByRole("button", {
    name: "Cari di ruang kerja (Ctrl+K)",
  });
  Object.defineProperty(triggers[0], "getClientRects", { value: () => [] });
  Object.defineProperty(triggers[1], "getClientRects", {
    value: () => [{ width: 40, height: 40 }],
  });
  fireEvent.keyDown(window, { key: "k", ctrlKey: true, cancelable: true });
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
});
