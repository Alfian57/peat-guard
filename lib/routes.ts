export const APP_ROUTES = {
  home: "/",
  homeSections: {
    hero: "#hero",
    mainContent: "#main-content",
    monitoring: "#pantauan",
    peatlandStory: "#cerita-gambut",
    publicMap: "#peta-publik",
    workflow: "#cara-kerja",
  },
  login: "/login",
  profile: "/profile",
  publicMap: "/peta",

  // Field (Relawan)
  field: {
    root: "/field",
    home: "/field/home",
    queue: "/field/queue",
    report: "/field/report",
    createReport: "/field/reports/create",
    reportDetail: (id: string) => `/field/reports/${encodeURIComponent(id)}`,
    reportEdit: (id: string) => `/field/reports/${encodeURIComponent(id)}/edit`,
  },

  // Command (POSKO)
  command: {
    map: "/command/map",
    reports: "/command/reports",
    reportDetail: (reportId: string) =>
      `/command/reports/${encodeURIComponent(reportId)}`,
    zones: "/command/zones",
    createZone: "/command/zones/create",
    editZone: (zoneId: string) =>
      `/command/zones/${encodeURIComponent(zoneId)}/edit`,
    waterPoints: "/command/water-points",
    createWaterPoint: "/command/water-points/create",
    editWaterPoint: (pointId: string) =>
      `/command/water-points/${encodeURIComponent(pointId)}/edit`,
  },

  // Audit (Verifikator)
  audit: {
    dashboard: "/audit/dashboard",
    ledger: "/audit/ledger",
    ledgerReport: (reportId: string) =>
      `/audit/ledger?reportId=${encodeURIComponent(reportId)}`,
    generator: "/audit/generator",
  },
} as const;

export const API_ROUTES = {
  profile: {
    root: "/api/profile",
    avatarPrefix: "/api/profile/avatar/",
    avatar: (fileName: string) =>
      `/api/profile/avatar/${encodeURIComponent(fileName)}`,
    avatarUpload: "/api/profile/avatar",
  },
  search: "/api/search",
  public: {
    map: "/api/public/map",
    metrics: "/api/public/metrics",
  },
  reports: {
    root: "/api/reports",
    detail: (reportId: string) =>
      `/api/reports/${encodeURIComponent(reportId)}`,
    photo: (reportId: string) =>
      `/api/reports/${encodeURIComponent(reportId)}/photo`,
  },
  command: {
    map: "/api/command/map",
    reportMapPoints: "/api/command/reports/map-points",
    zones: "/api/command/zones",
    zoneDetail: (zoneId: string) =>
      `/api/command/zones/${encodeURIComponent(zoneId)}`,
    zoneApprove: (zoneId: string) =>
      `/api/command/zones/${encodeURIComponent(zoneId)}/approve`,
    waterPoints: "/api/command/water-points",
    waterPointDetail: (waterPointId: string) =>
      `/api/command/water-points/${encodeURIComponent(waterPointId)}`,
    firms: "/api/command/firms",
    firmsSync: "/api/command/firms/sync",
    mrvSummary: "/api/command/mrv/summary",
    mrvGenerate: "/api/command/mrv/generate",
    mrvLedger: "/api/command/mrv/ledger",
    mrvLedgerExport: "/api/command/mrv/ledger/export",
    mrvLedgerReview: (reportId: string) =>
      `/api/command/mrv/ledger/${encodeURIComponent(reportId)}/review`,
  },
} as const;
