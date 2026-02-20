import type { FeeScheduleEntry } from "../types";
import { DEMO_MODE_KEY } from "../constants/admin";

const STORAGE_KEY = "gumgauge-fee-schedule";
const DEMO_STORAGE_KEY = "gumgauge-demo-fee-schedule";

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

function getStored(key: string): FeeScheduleEntry[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as FeeScheduleEntry[];
  } catch {
    return [];
  }
}

export function getFeeSchedule(): FeeScheduleEntry[] {
  return getStored(getStorageKey());
}

/** Get fee for a procedure code and plan. Returns first matching entry fee, or undefined if no override. */
export function getFeeForPlan(planIdentifier: string, procedureCode: string): number | undefined {
  const schedule = getFeeSchedule();
  const entry = schedule.find(
    (e) => e.planIdentifier === planIdentifier && e.procedureCode === procedureCode
  );
  return entry?.fee;
}

export function addFeeScheduleEntry(entry: Omit<FeeScheduleEntry, "id" | "addedAt">): FeeScheduleEntry {
  const key = getStorageKey();
  const now = new Date().toISOString();
  const newEntry: FeeScheduleEntry = {
    ...entry,
    id: crypto.randomUUID(),
    addedAt: now,
  };
  const list = getStored(key);
  localStorage.setItem(key, JSON.stringify([...list, newEntry]));
  return newEntry;
}

export function updateFeeScheduleEntry(id: string, updates: Partial<Omit<FeeScheduleEntry, "id" | "addedAt">>): FeeScheduleEntry | null {
  const key = getStorageKey();
  const list = getStored(key);
  const index = list.findIndex((e) => e.id === id);
  if (index === -1) return null;
  const next = [...list];
  next[index] = { ...next[index], ...updates };
  localStorage.setItem(key, JSON.stringify(next));
  return next[index];
}

export function deleteFeeScheduleEntry(id: string): boolean {
  const key = getStorageKey();
  const list = getStored(key).filter((e) => e.id !== id);
  if (list.length === getStored(key).length) return false;
  localStorage.setItem(key, JSON.stringify(list));
  return true;
}

/** Replace all fee schedule entries (e.g. for import/restore). */
export function replaceAllFeeSchedule(entries: FeeScheduleEntry[]): void {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(entries ?? []));
  } catch {}
}
