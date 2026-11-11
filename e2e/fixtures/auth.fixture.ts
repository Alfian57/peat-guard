import { test as base, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { APP_ROUTES } from "@/lib/routes";
import { prisma } from "@/lib/prisma";
import { DEMO_USERS } from "@/lib/demo-login";

export const DEMO_CREDENTIALS = {
  RELAWAN: {
    email: "relawan@gmail.com",
    password: "password",
    homeRoute: APP_ROUTES.field.home,
  },
  POSKO: {
    email: "posko@gmail.com",
    password: "password",
    homeRoute: APP_ROUTES.command.map,
  },
  VERIFIKATOR: {
    email: "verifikator@gmail.com",
    password: "password",
    homeRoute: APP_ROUTES.audit.dashboard,
  },
} as const;

export async function ensureFieldReportExists(): Promise<string> {
  const existing = await prisma.fieldReport.findFirst({
    select: { id: true },
  });
  if (existing) return existing.id;

  const relawan = DEMO_USERS.find((u) => u.role === "RELAWAN")!;
  const reportId = randomUUID();
  const clientReportId = randomUUID();

  await prisma.$executeRaw`
    INSERT INTO "field_reports" (
      "id", "client_report_id", "reporter_id", "zone_id", "latitude",
      "longitude", "accuracy_meters", "location", "image_path", "field_notes",
      "tags", "captured_at", "synced_at", "ai_consent", "ai_state",
      "handling_status", "nearest_water_distance_m", "is_demo_sample",
      "created_at", "updated_at"
    ) VALUES (
      ${reportId}::uuid,
      ${clientReportId}::uuid,
      ${relawan.id}::uuid,
      NULL,
      -2.3194,
      113.9102,
      15.0,
      ST_SetSRID(ST_MakePoint(113.9102, -2.3194), 4326),
      'patrol-sample.webp',
      'Temuan asap tipis saat patroli relawan MPA.',
      ARRAY['Asap', 'Vegetasi']::varchar(60)[],
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      FALSE,
      'SKIPPED'::"AIAnalysisState",
      'MENUNGGU_TINDAKAN'::"HandlingStatus",
      120.5,
      FALSE,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
  `;

  await prisma.reportStatusEvent.create({
    data: {
      reportId,
      changedById: relawan.id,
      previousStatus: null,
      nextStatus: "MENUNGGU_TINDAKAN",
    },
  });

  return reportId;
}

export async function loginAs(
  page: Page,
  role: keyof typeof DEMO_CREDENTIALS,
): Promise<void> {
  const creds = DEMO_CREDENTIALS[role];
  await page.goto(APP_ROUTES.login);

  await page.fill('input[name="email"]', creds.email);
  await page.fill('input[name="password"]', creds.password);
  await page.click('button[type="submit"]');

  const expectedPrefix = creds.homeRoute.split("/")[1]
    ? `/${creds.homeRoute.split("/")[1]}`
    : "/";
  await page.waitForURL((url) => url.pathname.startsWith(expectedPrefix), {
    timeout: 20_000,
  });
}

export const test = base.extend<{
  relawanPage: Page;
  poskoPage: Page;
  verifikatorPage: Page;
}>({
  relawanPage: async ({ page }, provide) => {
    await loginAs(page, "RELAWAN");
    await provide(page);
  },
  poskoPage: async ({ page }, provide) => {
    await loginAs(page, "POSKO");
    await provide(page);
  },
  verifikatorPage: async ({ page }, provide) => {
    await loginAs(page, "VERIFIKATOR");
    await provide(page);
  },
});

export { expect } from "@playwright/test";
