import type { QueuedFieldReport } from "./types";

const LAST_KNOWN_OWNER_KEY = "peatguard:field:last-relawan-owner:v1";
const LEGACY_LAST_KNOWN_OWNER_KEY = "peatguard:field:last-owner:v1";

type OwnedRecord = Pick<QueuedFieldReport, "ownerId">;

let lastKnownOwnerSnapshot: string | null | undefined;
const ownerListeners = new Set<() => void>();

export function isFieldVolunteerRole(role: unknown): role is "RELAWAN" {
  return role === "RELAWAN";
}

export function isFieldRoleDenied(
  hasSessionUser: boolean,
  role: unknown,
): boolean {
  return hasSessionUser && !isFieldVolunteerRole(role);
}

export function isSessionAuthDenied(status: unknown): boolean {
  return status === 401 || status === 403;
}

export function filterReportsForOwner<T extends OwnedRecord>(
  reports: readonly T[],
  ownerId: string,
): T[] {
  return reports.filter((report) => report.ownerId === ownerId);
}

export function reportBelongsToOwner(
  report: OwnedRecord | undefined,
  ownerId: string,
): report is OwnedRecord {
  return Boolean(report && ownerId && report.ownerId === ownerId);
}

export function isActiveOwnerMatch(
  storedOwnerId: string,
  activeSessionOwnerId: string | null,
): boolean {
  return Boolean(
    storedOwnerId &&
    activeSessionOwnerId &&
    storedOwnerId === activeSessionOwnerId,
  );
}

export function isActiveVolunteerOwnerMatch(
  storedOwnerId: string,
  activeSessionOwnerId: string | null,
  activeSessionRole: unknown,
): boolean {
  return (
    isFieldVolunteerRole(activeSessionRole) &&
    isActiveOwnerMatch(storedOwnerId, activeSessionOwnerId)
  );
}

function notifyOwnerListeners() {
  ownerListeners.forEach((listener) => listener());
}

function handleOwnerStorageEvent(event: StorageEvent) {
  if (
    event.key !== LAST_KNOWN_OWNER_KEY &&
    event.key !== LEGACY_LAST_KNOWN_OWNER_KEY &&
    event.key !== null
  )
    return;
  lastKnownOwnerSnapshot = undefined;
  notifyOwnerListeners();
}

export function subscribeLastKnownOwner(listener: () => void) {
  ownerListeners.add(listener);
  window.addEventListener("storage", handleOwnerStorageEvent);
  return () => {
    ownerListeners.delete(listener);
    window.removeEventListener("storage", handleOwnerStorageEvent);
  };
}

export function getLastKnownOwnerSnapshot(): string | null {
  if (lastKnownOwnerSnapshot !== undefined) return lastKnownOwnerSnapshot;
  try {
    localStorage.removeItem(LEGACY_LAST_KNOWN_OWNER_KEY);
    lastKnownOwnerSnapshot =
      localStorage.getItem(LAST_KNOWN_OWNER_KEY)?.trim() || null;
  } catch {
    lastKnownOwnerSnapshot = null;
  }
  return lastKnownOwnerSnapshot;
}

export function getServerOwnerSnapshot(): null {
  return null;
}

export function persistLastKnownOwner(ownerId: string, role: unknown): boolean {
  if (!isFieldVolunteerRole(role)) return false;
  const normalizedOwnerId = ownerId.trim();
  if (!normalizedOwnerId) return false;
  try {
    localStorage.setItem(LAST_KNOWN_OWNER_KEY, normalizedOwnerId);
    lastKnownOwnerSnapshot = normalizedOwnerId;
    notifyOwnerListeners();
    return true;
  } catch {
    return false;
  }
}

export function clearLastKnownOwner(): void {
  try {
    localStorage.removeItem(LAST_KNOWN_OWNER_KEY);
    localStorage.removeItem(LEGACY_LAST_KNOWN_OWNER_KEY);
  } catch {
    // A failed cleanup must not change which user can access local reports.
  }
  lastKnownOwnerSnapshot = null;
  notifyOwnerListeners();
}
