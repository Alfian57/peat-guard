import type { QueuedFieldReport } from "@/lib/client/offline/types";

type DeferredRead = {
  result?: QueuedFieldReport | QueuedFieldReport[];
  onsuccess?: () => void;
};

// Implement the IndexedDB boundary used by the outbox. Run read handlers and
// their writes within the same turn, then deliver the transaction completion.
export function registerFieldReportDatabase() {
  const rows = new Map<string, QueuedFieldReport>();
  const original = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
  const database = {
    close() {},
    transaction() {
      const transaction = {
        oncomplete: undefined as (() => void) | undefined,
        objectStore() {
          const store = {
            add(report: QueuedFieldReport) {
              store.put(report);
              queueMicrotask(() => transaction.oncomplete?.());
            },
            put(report: QueuedFieldReport) {
              rows.set(report.clientReportId, { ...report });
            },
            delete(id: string) {
              rows.delete(id);
            },
            get(id: string) {
              return read(() => rows.get(id));
            },
            index() {
              return {
                getAll(ownerId: string) {
                  return read(() =>
                    [...rows.values()].filter((row) => row.ownerId === ownerId),
                  );
                },
              };
            },
          };
          return store;
        },
      };
      function read(get: () => DeferredRead["result"]) {
        const request: DeferredRead = {};
        queueMicrotask(() => {
          request.result = get();
          request.onsuccess?.();
          transaction.oncomplete?.();
        });
        return request;
      }
      return transaction;
    },
  };

  Object.defineProperty(globalThis, "indexedDB", {
    configurable: true,
    value: {
      open() {
        const request: { result: typeof database; onsuccess?: () => void } = {
          result: database,
        };
        queueMicrotask(() => request.onsuccess?.());
        return request;
      },
    },
  });
  return () => {
    if (original) Object.defineProperty(globalThis, "indexedDB", original);
    else Reflect.deleteProperty(globalThis, "indexedDB");
  };
}
