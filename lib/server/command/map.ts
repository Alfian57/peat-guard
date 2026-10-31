import "server-only";

import { listCommandHotspots } from "@/lib/server/firms/repository";
import { listCommandZones } from "@/lib/server/zones/data";
import { listCommandWaterPoints } from "@/lib/server/water/data";

export async function getCommandMapData() {
  const [zones, waterPoints, hotspots] = await Promise.all([
    listCommandZones(),
    listCommandWaterPoints(),
    listCommandHotspots(),
  ]);

  return { zones, waterPoints, hotspots };
}
