import { describe, expect, it } from "bun:test";

import { parseGlobalSearchInput } from "./input";

describe("parseGlobalSearchInput", () => {
  it("trims a valid query", () => {
    expect(parseGlobalSearchInput(new URLSearchParams("q=%20zona%20"))).toEqual(
      {
        ok: true,
        value: { query: "zona" },
      },
    );
  });

  it("rejects short, repeated, and unexpected parameters", () => {
    expect(parseGlobalSearchInput(new URLSearchParams("q=a")).ok).toBe(false);
    expect(parseGlobalSearchInput(new URLSearchParams("q=aa&q=bb")).ok).toBe(
      false,
    );
    expect(
      parseGlobalSearchInput(new URLSearchParams("q=zona&reporter=someone")).ok,
    ).toBe(false);
  });
});
