import type { QueuedFieldReport } from "./types";
import { filterReportsForOwner, reportBelongsToOwner } from "./owner-store";

const DATABASE_NAME = "peat-guard-field";
const DATABASE_VERSION = 2;
const REPORTS_STORE = "reports";

export function isRemovableLocalDraft(
  report: Pick<QueuedFieldReport, "syncState" | "serverReportId">,
): boolean {
  return (
    report.syncState !== "synced" &&
    report.syncState !== "syncing" &&
    report.serverReportId === null
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
      transaction.objectStore(REPORTS_STORE).put(report);
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

export async function removeQueuedReport(
  clientReportId: string,
  ownerId: string,
): Promise<boolean> {
  if (!ownerId.trim()) return false;
  const database = await openReportDatabase();
  try {
    return await new Promise<boolean>((resolve, reject) => {
      const transaction = database.transaction(REPORTS_STORE, "readwrite");
      const store = transaction.objectStore(REPORTS_STORE);
      const request = store.get(clientReportId);
      let removed = false;
      request.onsuccess = () => {
        const report = request.result as QueuedFieldReport | undefined;
        if (
          reportBelongsToOwner(report, ownerId) &&
          isRemovableLocalDraft(report)
        ) {
          store.delete(clientReportId);
          removed = true;
        }
      };
      transaction.oncomplete = () => resolve(removed);
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error("Tidak dapat menghapus draf laporan."),
        );
      transaction.onabort = () =>
        reject(
          transaction.error ?? new Error("Penghapusan laporan dibatalkan."),
        );
    });
  } finally {
    database.close();
  }
}
