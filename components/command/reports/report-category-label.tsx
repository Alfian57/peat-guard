import {
  ReportCategory,
  type ReportCategory as ReportCategoryValue,
} from "@/lib/generated/prisma/enums";

export function ReportCategoryLabel({
  category,
}: {
  category: ReportCategoryValue | null;
}) {
  if (!category)
    return <span className="text-peat-forest/60">Belum dinilai</span>;
  switch (category) {
    case ReportCategory.API_AKTIF:
      return "Api aktif";
    case ReportCategory.ASAP_GAMBUT:
      return "Asap gambut";
    case ReportCategory.SEKAT_KANAL_KERING:
      return "Sekat kanal kering";
    case ReportCategory.AMAN_TERKENDALI:
      return "Aman / terkendali";
  }
}
