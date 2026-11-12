import { API_ROUTES, APP_ROUTES } from "@/lib/routes";

export const COMMAND_ROUTES = {
  map: APP_ROUTES.command.map,
  reports: APP_ROUTES.command.reports,
  zones: APP_ROUTES.command.zones,
  createZone: APP_ROUTES.command.createZone,
  editZone: (zoneId: string) => APP_ROUTES.command.editZone(zoneId),
  waterPoints: APP_ROUTES.command.waterPoints,
  createWaterPoint: APP_ROUTES.command.createWaterPoint,
  editWaterPoint: (pointId: string) =>
    APP_ROUTES.command.editWaterPoint(pointId),
  login: APP_ROUTES.login,
} as const;

export const COMMAND_API_ROUTES = {
  map: API_ROUTES.command.map,
  reportMapPoints: API_ROUTES.command.reportMapPoints,
  reports: API_ROUTES.reports.root,
  zones: API_ROUTES.command.zones,
  waterPoints: API_ROUTES.command.waterPoints,
  firms: API_ROUTES.command.firms,
  firmsSync: API_ROUTES.command.firmsSync,
} as const;

export function zoneEditRoute(zoneId: string): string {
  return APP_ROUTES.command.editZone(zoneId);
}

export function waterPointEditRoute(waterPointId: string): string {
  return APP_ROUTES.command.editWaterPoint(waterPointId);
}

export function reportDetailRoute(reportId: string): string {
  return APP_ROUTES.command.reportDetail(reportId);
}

export function reportApiRoute(reportId: string): string {
  return API_ROUTES.reports.detail(reportId);
}

export function zoneApiRoute(zoneId: string): string {
  return API_ROUTES.command.zoneDetail(zoneId);
}

export function waterPointApiRoute(waterPointId: string): string {
  return API_ROUTES.command.waterPointDetail(waterPointId);
}
