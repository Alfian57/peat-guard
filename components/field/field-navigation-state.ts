import { APP_ROUTES } from "@/lib/routes";

export type FieldNavigationRoute = "home" | "create" | "queue";

export function fieldNavigationRoute(pathname: string): FieldNavigationRoute {
  if (pathname === APP_ROUTES.field.createReport) return "create";
  if (
    pathname === APP_ROUTES.field.queue ||
    pathname === APP_ROUTES.field.report ||
    pathname.startsWith(APP_ROUTES.field.reportDetail(""))
  )
    return "queue";
  return "home";
}
