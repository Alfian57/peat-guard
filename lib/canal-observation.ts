export const CANAL_CONDITIONS = [
  "BERFUNGSI",
  "KERING",
  "RUSAK",
  "TIDAK_DAPAT_DINILAI",
] as const;
export type CanalCondition = (typeof CANAL_CONDITIONS)[number];

export const CANAL_CONDITION_LABELS: Record<CanalCondition, string> = {
  BERFUNGSI: "Berfungsi",
  KERING: "Kering",
  RUSAK: "Rusak",
  TIDAK_DAPAT_DINILAI: "Tidak dapat dinilai",
};

export function isCanalCondition(value: unknown): value is CanalCondition {
  return (
    typeof value === "string" &&
    CANAL_CONDITIONS.some((condition) => condition === value)
  );
}
