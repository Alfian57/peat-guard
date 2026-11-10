import { describe, expect, it } from "bun:test";

import { parseProfileUpdateInput } from "./input";

describe("parseProfileUpdateInput", () => {
  it("accepts a volunteer name and village", () => {
    expect(
      parseProfileUpdateInput(
        { name: "  Sari Wulandari ", villageName: "  Desa Harapan " },
        true,
      ),
    ).toEqual({
      ok: true,
      value: { name: "Sari Wulandari", villageName: "Desa Harapan" },
    });
  });

  it("rejects email, role, and village edits for other roles", () => {
    expect(
      parseProfileUpdateInput(
        { name: "Koordinator", email: "other@example.com" },
        false,
      ).ok,
    ).toBe(false);
    expect(
      parseProfileUpdateInput(
        { name: "Koordinator", villageName: "Desa" },
        false,
      ).ok,
    ).toBe(false);
  });

  it("validates names and village length", () => {
    expect(parseProfileUpdateInput({ name: " " }, false).ok).toBe(false);
    expect(
      parseProfileUpdateInput(
        { name: "Relawan", villageName: "x".repeat(101) },
        true,
      ).ok,
    ).toBe(false);
  });
});
