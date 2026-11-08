import { API_ROUTES } from "@/lib/routes";

export function reportPhotoMetadata(reportId: string, imagePath: string) {
  const hasPhoto = imagePath.length > 0;
  return {
    hasPhoto,
    photoHref: hasPhoto ? API_ROUTES.reports.photo(reportId) : null,
  };
}
