import { Suspense } from "react";

import { ZoneEditorScreen } from "@/components/command/zones/zone-editor-screen";
import { ZoneEditorSkeleton } from "@/components/command/zones/zone-editor-skeleton";

export default function EditZonePage({
  params,
}: {
  params: Promise<{ zoneId: string }>;
}) {
  return (
    <Suspense fallback={<ZoneEditorSkeleton />}>
      {params.then(({ zoneId }) => (
        <ZoneEditorScreen zoneId={zoneId} />
      ))}
    </Suspense>
  );
}
