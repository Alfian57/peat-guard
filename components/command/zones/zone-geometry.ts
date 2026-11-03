import type { ZonePolygon } from "@/lib/server/zones/validation";

export function polygonFromVertices(
  vertices: [number, number][],
): ZonePolygon | null {
  if (vertices.length < 3) return null;
  const first = vertices[0];
  const last = vertices.at(-1);
  const ring =
    last && first && last[0] === first[0] && last[1] === first[1]
      ? vertices
      : [...vertices, first];
  return { type: "Polygon", coordinates: [ring] };
}

export function polygonWithUpdatedOuterRing(
  current: ZonePolygon,
  vertices: [number, number][],
): ZonePolygon | null {
  const outerRing = polygonFromVertices(vertices);
  if (!outerRing) return null;
  return {
    type: "Polygon",
    coordinates: [outerRing.coordinates[0], ...current.coordinates.slice(1)],
  };
}
