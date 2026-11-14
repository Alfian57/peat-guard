import {
  WaterPointType,
  type WaterPointType as WaterPointTypeValue,
} from "@/lib/generated/prisma/enums";

export const WATER_POINT_TYPE_OPTIONS = [
  { value: WaterPointType.SUMBER_AIR, label: "Sumber air" },
  { value: WaterPointType.EMBUNG, label: "Embung" },
  { value: WaterPointType.SEKAT_KANAL, label: "Sekat kanal" },
] as const satisfies ReadonlyArray<{
  value: WaterPointTypeValue;
  label: string;
}>;

export function waterPointTypeLabel(type: WaterPointTypeValue): string {
  return (
    WATER_POINT_TYPE_OPTIONS.find((option) => option.value === type)?.label ??
    "Jenis titik tidak dikenal"
  );
}
