export type NextSearchParams = Record<string, string | string[] | undefined>;

export function toURLSearchParams(values: NextSearchParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item);
      }
    } else if (typeof value === "string") {
      searchParams.append(key, value);
    }
  }

  return searchParams;
}

export function firstSearchValue(
  values: NextSearchParams,
  key: string,
): string {
  const value = values[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}
