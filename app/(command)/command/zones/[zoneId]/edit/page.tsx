import { ZoneEditorScreen } from "@/components/command/zones/zone-editor-screen";

export default async function EditZonePage({
  params,
}: {
  params: Promise<{ zoneId: string }>;
}) {
  const { zoneId } = await params;

  return <ZoneEditorScreen zoneId={zoneId} />;
}
