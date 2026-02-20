import type { StaffAvailability } from "../types";
import { DEMO_MODE_KEY } from "../constants/admin";

const STORAGE_KEY = "gumgauge-staff-availability";
const DEMO_STORAGE_KEY = "gumgauge-demo-staff-availability";

function isDemoMode(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

function getStorageKey(): string {
  return isDemoMode() ? DEMO_STORAGE_KEY : STORAGE_KEY;
}

function getStored(key: string): StaffAvailability[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as StaffAvailability[];
  } catch {
    return [];
  }
}

export function getAvailabilityForStaff(staffId: string): StaffAvailability[] {
  return getStored(getStorageKey()).filter((a) => a.staffId === staffId);
}

export function getAllAvailability(): StaffAvailability[] {
  return getStored(getStorageKey());
}

export function addAvailability(entry: Omit<StaffAvailability, "id" | "addedAt">): StaffAvailability {
  const key = getStorageKey();
  const now = new Date().toISOString();
  const newEntry: StaffAvailability = { ...entry, id: crypto.randomUUID(), addedAt: now };
  const list = getStored(key);
  localStorage.setItem(key, JSON.stringify([...list, newEntry]));
  return newEntry;
}

export function updateAvailability(id: string, updates: Partial<Omit<StaffAvailability, "id" | "addedAt">>): StaffAvailability | null {
  const key = getStorageKey();
  const list = getStored(key);
  const index = list.findIndex((e) => e.id === id);
  if (index === -1) return null;
  const next = [...list];
  next[index] = { ...next[index], ...updates };
  localStorage.setItem(key, JSON.stringify(next));
  return next[index];
}

export function deleteAvailability(id: string): boolean {
  const key = getStorageKey();
  const list = getStored(key).filter((e) => e.id !== id);
  if (list.length === getStored(key).length) return false;
  localStorage.setItem(key, JSON.stringify(list));
  return true;
}

/** Replace all staff availability (e.g. for import/restore). */
export function replaceAllAvailability(entries: StaffAvailability[]): void {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(entries ?? []));
  } catch {}
}
