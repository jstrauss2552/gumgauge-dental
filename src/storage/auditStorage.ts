/**
 * Audit trail: who changed what and when.
 * Stored in localStorage (key: gumgauge-audit). In production this would be server-side.
 */
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
const MAX_ENTRIES = 2000;

let currentActor: string | undefined;

export function setAuditActor(name: string | undefined) {
  currentActor = name;
}

export function getAuditActor(): string | undefined {
  return currentActor;
}

function getEntries(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveEntries(entries: AuditEntry[]) {
  const trimmed = entries.slice(-MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function addAuditEntry(entry: Omit<AuditEntry, "id">): void {
  const list = getEntries();
  list.push({ ...entry, id: crypto.randomUUID(), actor: entry.actor ?? currentActor ?? "System" });
  saveEntries(list);
}

export function getAuditEntries(options?: { entityType?: string; entityId?: string; limit?: number }): AuditEntry[] {
  let list = getEntries();
  if (options?.entityType) list = list.filter((e) => e.entityType === options.entityType);
  if (options?.entityId) list = list.filter((e) => e.entityId === options.entityId);
  list = list.reverse(); // newest first
  if (options?.limit) list = list.slice(0, options.limit);
  return list;
}
