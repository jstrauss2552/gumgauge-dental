/**
 * Audit trail: who changed what and when.
 * Stored in localStorage (key: gumgauge-audit). In production this would be server-side.
 */
import { DEMO_MODE_KEY } from "../constants/admin";
import { getDemoAuditEntries } from "../data/demoSeed";

export interface AuditEntry {
  id: string;
  timestamp: string; // ISO
  actor?: string; // staff name or "System"
  action: string; // e.g. "patient.update", "patient.create", "staff.delete"
  entityType: string; // "patient" | "staff" | "appointment"
  entityId: string;
  details?: string; // optional summary of what changed
}

const STORAGE_KEY = "gumgauge-audit";
const DEMO_STORAGE_KEY = "gumgauge-demo-audit";
const MAX_ENTRIES = 2000;

let currentActor: string | undefined;

function isDemoMode(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

function getAuditStorageKey(): string {
  return isDemoMode() ? DEMO_STORAGE_KEY : STORAGE_KEY;
}

function ensureDemoAuditSeed(): void {
  if (!isDemoMode()) return;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return;
    const entries = getDemoAuditEntries();
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function setAuditActor(name: string | undefined) {
  currentActor = name;
}

export function getAuditActor(): string | undefined {
  return currentActor;
}

function getEntries(): AuditEntry[] {
  const key = getAuditStorageKey();
  if (key === DEMO_STORAGE_KEY) ensureDemoAuditSeed();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveEntries(entries: AuditEntry[], key: string) {
  const trimmed = entries.slice(-MAX_ENTRIES);
  localStorage.setItem(key, JSON.stringify(trimmed));
}

export function addAuditEntry(entry: Omit<AuditEntry, "id">): void {
  const key = getAuditStorageKey();
  const list = getEntries();
  list.push({ ...entry, id: crypto.randomUUID(), actor: entry.actor ?? currentActor ?? "System" });
  saveEntries(list, key);
}

export function getAuditEntries(options?: { entityType?: string; entityId?: string; limit?: number }): AuditEntry[] {
  let list = getEntries();
  if (options?.entityType) list = list.filter((e) => e.entityType === options.entityType);
  if (options?.entityId) list = list.filter((e) => e.entityId === options.entityId);
  list = list.reverse(); // newest first
  if (options?.limit) list = list.slice(0, options.limit);
  return list;
}

/** Clear the entire audit log. For admin use only. Does not add an entry (to avoid recursion). */
export function clearAuditLog(): void {
  try {
    localStorage.setItem(getAuditStorageKey(), JSON.stringify([]));
  } catch {}
}
