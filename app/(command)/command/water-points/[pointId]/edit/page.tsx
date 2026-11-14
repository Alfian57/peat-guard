import { Suspense } from "react";

import { WaterPointEditorScreen } from "@/components/command/water-points/water-point-editor-screen";
import { WaterPointEditorSkeleton } from "@/components/command/water-points/water-point-editor-skeleton";

export default function EditWaterPointPage({
  params,
}: {
  params: Promise<{ pointId: string }>;
}) {
  return (
    <Suspense fallback={<WaterPointEditorSkeleton />}>
      {params.then(({ pointId }) => (
        <WaterPointEditorScreen pointId={pointId} />
      ))}
    </Suspense>
  );
}
