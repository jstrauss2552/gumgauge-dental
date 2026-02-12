/**
 * Pending clinic registrations submitted by offices.
 * Admin approves these to "assign" a clinic to this device (then saved via clinicStorage).
 */

export interface PendingClinicRegistration {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  deviceCount?: number;
  submittedAt: string; // ISO
}

const PENDING_KEY = "gumgauge-pending-clinics";

function getStored(): PendingClinicRegistration[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveStored(list: PendingClinicRegistration[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {}
}

export function getPendingClinicRegistrations(): PendingClinicRegistration[] {
  return getStored();
}

export function addPendingClinicRegistration(data: Omit<PendingClinicRegistration, "id" | "submittedAt">): PendingClinicRegistration {
  const now = new Date().toISOString();
  const entry: PendingClinicRegistration = {
    ...data,
    id: crypto.randomUUID(),
    submittedAt: now,
  };
  const list = getStored();
  list.push(entry);
  saveStored(list);
  return entry;
}

export function removePendingClinicRegistration(id: string): boolean {
  const list = getStored().filter((p) => p.id !== id);
  if (list.length === getStored().length) return false;
  saveStored(list);
  return true;
}
