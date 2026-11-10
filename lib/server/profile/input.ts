export type ProfileUpdateInput = {
  name: string;
  villageName?: string | null;
};

export type ProfileInputResult =
  { ok: true; value: ProfileUpdateInput } | { ok: false; message: string };

export function parseProfileUpdateInput(
  value: unknown,
  canEditVillage: boolean,
): ProfileInputResult {
  if (!isRecord(value)) {
    return { ok: false, message: "Data profil tidak valid." };
  }

  const allowedKeys = canEditVillage
    ? new Set(["name", "villageName"])
    : new Set(["name"]);

  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    return { ok: false, message: "Ada kolom profil yang tidak dapat diubah." };
  }

  if (typeof value.name !== "string") {
    return { ok: false, message: "Nama wajib diisi." };
  }

  const name = value.name.trim();
  if (name.length < 2 || name.length > 100) {
    return { ok: false, message: "Nama harus berisi 2–100 karakter." };
  }

  if (!canEditVillage) return { ok: true, value: { name } };

  if (
    value.villageName !== undefined &&
    value.villageName !== null &&
    typeof value.villageName !== "string"
  ) {
    return { ok: false, message: "Nama desa tidak valid." };
  }

  const villageName =
    typeof value.villageName === "string" ? value.villageName.trim() : "";
  if (villageName.length > 100) {
    return { ok: false, message: "Nama desa maksimal 100 karakter." };
  }

  return { ok: true, value: { name, villageName: villageName || null } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
