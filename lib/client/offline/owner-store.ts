import { createClientReportId } from "./report-contract";
import type { QueuedFieldReport } from "./types";

const LAST_KNOWN_OWNER_KEY = "peatguard:field:last-relawan-owner:v1";
const OWNER_AUTH_EVENT_KEY = "peatguard:field:owner-auth-event:v1";
const FIELD_AUTH_EVENT_KEY = "peatguard:field:auth-event:v1";
const LEGACY_LAST_KNOWN_OWNER_KEY = "peatguard:field:last-owner:v1";

type OwnedRecord = Pick<QueuedFieldReport, "ownerId">;

let fieldAuthEventFallback: string | undefined;
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
    event.key !== FIELD_AUTH_EVENT_KEY &&
    event.key !== OWNER_AUTH_EVENT_KEY &&
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
  if (ownerListeners.size === 1) {
    window.addEventListener("storage", handleOwnerStorageEvent);
  }
  return () => {
    ownerListeners.delete(listener);
    if (ownerListeners.size === 0) {
      window.removeEventListener("storage", handleOwnerStorageEvent);
    }
  };
}

export function getLastKnownOwnerSnapshot(): string | null {
  if (lastKnownOwnerSnapshot !== undefined) return lastKnownOwnerSnapshot;
  try {
    localStorage.removeItem(LEGACY_LAST_KNOWN_OWNER_KEY);
    const currentEvent = getFieldAuthEvent();
    lastKnownOwnerSnapshot =
      !currentEvent.startsWith("logout:") &&
      (localStorage.getItem(OWNER_AUTH_EVENT_KEY) ?? "") === currentEvent
        ? localStorage.getItem(LAST_KNOWN_OWNER_KEY)?.trim() || null
        : null;
  } catch {
    lastKnownOwnerSnapshot = null;
  }
  return lastKnownOwnerSnapshot;
}

export function getFieldAuthEvent(): string {
  if (fieldAuthEventFallback) return fieldAuthEventFallback;
  try {
    return localStorage.getItem(FIELD_AUTH_EVENT_KEY) ?? "";
  } catch {
    return "";
  }
}

export function publishFieldAuthEvent(action: "login" | "logout"): void {
  const event = action + ":" + createClientReportId();
  try {
    localStorage.setItem(FIELD_AUTH_EVENT_KEY, event);
    fieldAuthEventFallback = undefined;
  } catch {
    fieldAuthEventFallback = event;
  }
  clearLastKnownOwner();
}

export function getServerOwnerSnapshot(): null {
  return null;
}

export function persistLastKnownOwner(
  ownerId: string,
  role: unknown,
  authEvent = getFieldAuthEvent(),
): boolean {
  if (
    !isFieldVolunteerRole(role) ||
    authEvent.startsWith("logout:") ||
    authEvent !== getFieldAuthEvent()
  )
    return false;
  const normalizedOwnerId = ownerId.trim();
  if (!normalizedOwnerId) return false;
  try {
    localStorage.setItem(LAST_KNOWN_OWNER_KEY, normalizedOwnerId);
    localStorage.setItem(OWNER_AUTH_EVENT_KEY, authEvent);
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
    localStorage.removeItem(OWNER_AUTH_EVENT_KEY);
    localStorage.removeItem(LEGACY_LAST_KNOWN_OWNER_KEY);
  } catch {
    // A failed cleanup must not change which user can access local reports.
  }
  lastKnownOwnerSnapshot = null;
  notifyOwnerListeners();
}
