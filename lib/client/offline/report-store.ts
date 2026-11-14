import { createClientReportId } from "./report-contract";
import type { NewFieldReport, QueuedFieldReport } from "./types";
import { filterReportsForOwner, reportBelongsToOwner } from "./owner-store";

const DATABASE_NAME = "peat-guard-field";
const DATABASE_VERSION = 2;
const REPORTS_STORE = "reports";

function uploadMayHaveCommitted(
  report: Pick<QueuedFieldReport, "syncState" | "uploadUncertain">,
): boolean {
  return (
    report.uploadUncertain ??
    (report.syncState === "syncing" ||
      report.syncState === "failed" ||
      report.syncState === "requires-auth")
  );
}

export function isRemovableLocalDraft(
  report: Pick<
    QueuedFieldReport,
    "syncState" | "serverReportId" | "uploadUncertain"
  >,
): boolean {
  return (
    report.syncState !== "synced" &&
    report.syncState !== "syncing" &&
    report.serverReportId === null &&
    !uploadMayHaveCommitted(report)
  );
}

function openReportDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("Penyimpanan offline tidak tersedia di browser ini."),
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction;
      if (!transaction) return;

      const isNewStore = !database.objectStoreNames.contains(REPORTS_STORE);
      const store = isNewStore
        ? database.createObjectStore(REPORTS_STORE, {
            keyPath: "clientReportId",
          })
        : transaction.objectStore(REPORTS_STORE);

      if (isNewStore) {
        store.createIndex("createdAt", "createdAt");
        store.createIndex("syncState", "syncState");
      }
      if (!store.indexNames.contains("ownerId")) {
        store.createIndex("ownerId", "ownerId");
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () =>
      reject(
        request.error ?? new Error("Tidak dapat membuka antrean laporan."),
      );
    request.onblocked = () =>
      reject(
        new Error(
          "Tutup tab PEATGUARD lain untuk memperbarui antrean offline.",
        ),
      );
  });
}

export async function listQueuedReports(
  ownerId: string,
): Promise<QueuedFieldReport[]> {
  if (!ownerId.trim()) return [];
  const database = await openReportDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction(REPORTS_STORE, "readonly")
        .objectStore(REPORTS_STORE)
        .index("ownerId")
        .getAll(ownerId);

      request.onsuccess = () => {
        const reports = request.result as QueuedFieldReport[];
        resolve(
          filterReportsForOwner(reports, ownerId).toSorted((left, right) =>
            right.createdAt.localeCompare(left.createdAt),
          ),
        );
      };
      request.onerror = () =>
        reject(
          request.error ?? new Error("Tidak dapat membaca antrean laporan."),
        );
    });
  } finally {
    database.close();
  }
}

export async function getQueuedReport(
  clientReportId: string,
  ownerId: string,
): Promise<QueuedFieldReport | null> {
  if (!ownerId.trim()) return null;
  const database = await openReportDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const request = database
        .transaction(REPORTS_STORE, "readonly")
        .objectStore(REPORTS_STORE)
        .get(clientReportId);

      request.onsuccess = () => {
        const report = request.result as QueuedFieldReport | undefined;
        resolve(reportBelongsToOwner(report, ownerId) ? report : null);
      };
      request.onerror = () =>
        reject(request.error ?? new Error("Tidak dapat membaca draf laporan."));
    });
  } finally {
    database.close();
  }
}

export async function saveQueuedReport(
  report: QueuedFieldReport,
  ownerId: string,
): Promise<void> {
  if (!reportBelongsToOwner(report, ownerId)) {
    throw new Error(
      "Laporan ini tidak cocok dengan akun pemilik yang sedang aktif.",
    );
  }
  const database = await openReportDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(REPORTS_STORE, "readwrite");
      transaction.objectStore(REPORTS_STORE).add(report);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error("Tidak dapat menyimpan laporan."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ?? new Error("Penyimpanan laporan dibatalkan."),
        );
    });
  } finally {
    database.close();
  }
}

type DraftChange = QueuedFieldReport | "delete" | null;

async function changeOwnedDraft(
  clientReportId: string,
  ownerId: string,
  change: (current: QueuedFieldReport) => DraftChange,
): Promise<DraftChange> {
  if (!ownerId.trim()) return null;
  const database = await openReportDatabase();
  try {
    return await new Promise<DraftChange>((resolve, reject) => {
      const transaction = database.transaction(REPORTS_STORE, "readwrite");
      const store = transaction.objectStore(REPORTS_STORE);
      const request = store.get(clientReportId);
      let result: DraftChange = null;
      request.onsuccess = () => {
        const current = request.result as QueuedFieldReport | undefined;
        if (!reportBelongsToOwner(current, ownerId)) return;
        result = change(current);
        if (result === "delete") store.delete(clientReportId);
        else if (result) store.put(result);
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () =>
        reject(
          transaction.error ??
            new Error("Perubahan draf tidak dapat disimpan."),
        );
    });
  } finally {
    database.close();
  }
}

export async function editQueuedReport(
  original: QueuedFieldReport,
  ownerId: string,
  data: NewFieldReport,
): Promise<boolean> {
  const result = await changeOwnedDraft(
    original.clientReportId,
    ownerId,
    (current) => {
      if (
        !isRemovableLocalDraft(current) ||
        (current.revision ?? 0) !== (original.revision ?? 0)
      ) {
        return null;
      }
      return {
        ...current,
        ...data,
        revision: (current.revision ?? 0) + 1,
        syncState: "pending",
        syncError: null,
        aiState: data.aiConsent ? "pending" : "skipped",
      };
    },
  );
  return result !== null;
}

export async function claimQueuedReport(
  clientReportId: string,
  ownerId: string,
): Promise<QueuedFieldReport | null> {
  const result = await changeOwnedDraft(clientReportId, ownerId, (current) => {
    const now = Date.now();
    if (
      current.syncState === "synced" ||
      (current.syncLease?.expiresAt ?? 0) > now
    ) {
      return null;
    }
    return {
      ...current,
      syncState: "syncing",
      syncError: null,
      syncLease: { token: createClientReportId(), expiresAt: now + 60_000 },
      uploadUncertain: uploadMayHaveCommitted(current),
    };
  });
  return result === "delete" ? null : result;
}

export async function finishQueuedReport(
  claim: QueuedFieldReport,
  update: Pick<
    QueuedFieldReport,
    "syncState" | "syncError" | "uploadUncertain"
  > &
    Partial<Pick<QueuedFieldReport, "serverReportId" | "aiState">>,
): Promise<QueuedFieldReport | null> {
  const result = await changeOwnedDraft(
    claim.clientReportId,
    claim.ownerId,
    (current) => {
      if (
        !claim.syncLease ||
        current.syncLease?.token !== claim.syncLease.token
      )
        return null;
      return { ...current, ...update, syncLease: null };
    },
  );
  return result === "delete" ? null : result;
}

export async function removeQueuedReport(
  clientReportId: string,
  ownerId: string,
): Promise<boolean> {
  const result = await changeOwnedDraft(clientReportId, ownerId, (current) =>
    isRemovableLocalDraft(current) ? "delete" : null,
  );
  return result === "delete";
}
