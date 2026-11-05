export function reportPhotoMetadata(reportId: string, imagePath: string) {
  const hasPhoto = imagePath.length > 0;
  return {
    hasPhoto,
    photoHref: hasPhoto ? `/api/reports/${reportId}/photo` : null,
  };
}
