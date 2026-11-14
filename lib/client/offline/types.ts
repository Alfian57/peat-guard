export type ReportSyncState =
  "pending" | "syncing" | "synced" | "failed" | "requires-auth";

export type ReportAiState =
  "not-requested" | "pending" | "complete" | "failed" | "skipped";

export type QueuedFieldReport = {
  clientReportId: string;
  ownerId: string;
  capturedAt: string;
  createdAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  fieldNotes: string;
  tags: string[];
  aiConsent: boolean;
  isDemoSample: boolean;
  photo: Blob;
  photoName: string;
  photoType: string;
  syncState: ReportSyncState;
  syncError: string | null;
  revision?: number;
  syncLease?: { token: string; expiresAt: number } | null;
  uploadUncertain?: boolean;
  serverReportId: string | null;
  aiState: ReportAiState;
};

export type NewFieldReport = Omit<
  QueuedFieldReport,
  | "ownerId"
  | "clientReportId"
  | "createdAt"
  | "syncState"
  | "syncError"
  | "revision"
  | "syncLease"
  | "uploadUncertain"
  | "serverReportId"
  | "aiState"
>;

export type SyncSummary = {
  synced: number;
  failed: number;
  requiresAuth: number;
  retryable?: boolean;
};

export const MAX_PHOTO_DIMENSION = 1280;
export const MAX_COMPRESSED_PHOTO_BYTES = 8 * 1024 * 1024;
