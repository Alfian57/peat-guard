import { getPublicMapData } from "@/lib/public/data";
import { createPublicMapHandler } from "@/lib/public/http";

export const GET = createPublicMapHandler(getPublicMapData);
