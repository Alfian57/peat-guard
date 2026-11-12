import { WaterPointEditorScreen } from "@/components/command/water-points/water-point-editor-screen";

export default async function EditWaterPointPage({
  params,
}: {
  params: Promise<{ pointId: string }>;
}) {
  const { pointId } = await params;

  return <WaterPointEditorScreen pointId={pointId} />;
}
