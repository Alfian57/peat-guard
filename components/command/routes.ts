export const COMMAND_ROUTES = {
  map: "/command/map",
  reports: "/command/reports",
  zones: "/command/zones",
  createZone: "/command/zones/create",
  waterPoints: "/command/water-points",
  login: "/login",
} as const;

export const COMMAND_API_ROUTES = {
  map: "/api/command/map",
  reportMapPoints: "/api/command/reports/map-points",
  reports: "/api/reports",
  zones: "/api/command/zones",
  waterPoints: "/api/command/water-points",
  firms: "/api/command/firms",
  firmsSync: "/api/command/firms/sync",
} as const;

export function zoneEditRoute(zoneId: string): string {
  return `${COMMAND_ROUTES.zones}/${encodeURIComponent(zoneId)}/edit`;
}

export function reportDetailRoute(reportId: string): string {
  return `${COMMAND_ROUTES.reports}/${encodeURIComponent(reportId)}`;
}

export function reportApiRoute(reportId: string): string {
  return `${COMMAND_API_ROUTES.reports}/${encodeURIComponent(reportId)}`;
}

export function zoneApiRoute(zoneId: string): string {
  return `${COMMAND_API_ROUTES.zones}/${encodeURIComponent(zoneId)}`;
}

export function waterPointApiRoute(waterPointId: string): string {
  return `${COMMAND_API_ROUTES.waterPoints}/${encodeURIComponent(waterPointId)}`;
}
