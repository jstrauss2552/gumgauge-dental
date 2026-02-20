import type { Operatory } from "../types";
import { DEMO_MODE_KEY } from "../constants/admin";
import { getDemoOperatories } from "../data/demoSeed";

const STORAGE_KEY = "gumgauge-operatories";
const DEMO_STORAGE_KEY = "gumgauge-demo-operatories";

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

function ensureDemoSeed(): void {
  if (!isDemoMode()) return;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return;
    const operatories = getDemoOperatories();
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(operatories));
  } catch {
    // ignore
  }
}

function getStored(key: string): Operatory[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as Operatory[];
  } catch {
    return [];
  }
}

function seedDefaultOperatories(): void {
  const key = getStorageKey();
  if (key === DEMO_STORAGE_KEY) return;
  const list = getStored(key);
  if (list.length > 0) return;
  const defaults: Operatory[] = [
    { id: crypto.randomUUID(), name: "Op 1", defaultDurationMinutes: 45 },
    { id: crypto.randomUUID(), name: "Op 2", defaultDurationMinutes: 45 },
    { id: crypto.randomUUID(), name: "Op 3", defaultDurationMinutes: 60 },
  ];
  try {
    localStorage.setItem(key, JSON.stringify(defaults));
  } catch {}
}

export function getOperatories(): Operatory[] {
  const key = getStorageKey();
  if (key === DEMO_STORAGE_KEY) ensureDemoSeed();
  else seedDefaultOperatories();
  return getStored(key);
}

export function getOperatoryById(id: string): Operatory | undefined {
  return getOperatories().find((o) => o.id === id);
}

export function saveOperatory(operatory: Operatory): void {
  const key = getStorageKey();
  const list = getStored(key);
  const index = list.findIndex((o) => o.id === operatory.id);
  const next = index >= 0 ? [...list] : [...list, operatory];
  if (index >= 0) next[index] = operatory;
  else next[next.length - 1] = operatory;
  localStorage.setItem(key, JSON.stringify(next));
}

export function addOperatory(input: Omit<Operatory, "id">): Operatory {
  const operatory: Operatory = {
    ...input,
    id: crypto.randomUUID(),
  };
  const key = getStorageKey();
  const list = getStored(key);
  localStorage.setItem(key, JSON.stringify([...list, operatory]));
  return operatory;
}

export function updateOperatory(id: string, updates: Partial<Omit<Operatory, "id">>): Operatory | null {
  const list = getOperatories();
  const index = list.findIndex((o) => o.id === id);
  if (index === -1) return null;
  const next = [...list];
  next[index] = { ...next[index], ...updates };
  localStorage.setItem(getStorageKey(), JSON.stringify(next));
  return next[index];
}

export function deleteOperatory(id: string): boolean {
  const list = getOperatories().filter((o) => o.id !== id);
  if (list.length === getOperatories().length) return false;
  localStorage.setItem(getStorageKey(), JSON.stringify(list));
  return true;
}

/** Replace all operatories (e.g. for import/restore). */
export function replaceAllOperatories(operatories: Operatory[]): void {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(operatories ?? []));
  } catch {}
}
