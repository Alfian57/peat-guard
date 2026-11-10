export type GlobalSearchInput = { query: string };

export type SearchInputResult =
  { ok: true; value: GlobalSearchInput } | { ok: false; message: string };

export function parseGlobalSearchInput(
  searchParams: URLSearchParams,
): SearchInputResult {
  if ([...searchParams.keys()].some((key) => key !== "q")) {
    return { ok: false, message: "Parameter pencarian tidak dikenal." };
  }

  const values = searchParams.getAll("q");
  if (values.length !== 1) {
    return { ok: false, message: "Masukkan satu kata kunci pencarian." };
  }

  const query = values[0].trim();
  if (query.length < 2 || query.length > 100) {
    return { ok: false, message: "Kata kunci harus berisi 2–100 karakter." };
  }

  return { ok: true, value: { query } };
}
