import type { Staff } from "../types";
import { addAuditEntry } from "./auditStorage";

const STORAGE_KEY = "gumgauge-staff";

export function getStaff(): Staff[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStaff(staff: Staff[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
}

export function getStaffById(id: string): Staff | undefined {
  return getStaff().find((s) => s.id === id);
}

/** Find staff by login email and password (for sign-in). Returns staff if credentials match. */
export function getStaffByLogin(loginEmail: string, password: string): Staff | undefined {
  const list = getStaff();
  return list.find(
    (s) =>
      s.loginEmail?.trim().toLowerCase() === loginEmail.trim().toLowerCase() &&
      s.password === password
  );
}

export function addStaff(staff: Omit<Staff, "id" | "createdAt" | "updatedAt">): Staff {
  const list = getStaff();
  const now = new Date().toISOString();
  const newStaff: Staff = {
    ...staff,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  list.push(newStaff);
  saveStaff(list);
  addAuditEntry({ timestamp: now, action: "staff.create", entityType: "staff", entityId: newStaff.id, details: `${newStaff.firstName} ${newStaff.lastName}` });
  return newStaff;
}

export function updateStaff(id: string, updates: Partial<Staff>): Staff | null {
  const list = getStaff();
  const index = list.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  list[index] = { ...list[index], ...updates, updatedAt: now };
  saveStaff(list);
  addAuditEntry({ timestamp: now, action: "staff.update", entityType: "staff", entityId: id });
  return list[index];
}

export function deleteStaff(id: string): boolean {
  const list = getStaff();
  const found = list.find((s) => s.id === id);
  const next = list.filter((s) => s.id !== id);
  if (next.length === list.length) return false;
  saveStaff(next);
  addAuditEntry({ timestamp: new Date().toISOString(), action: "staff.delete", entityType: "staff", entityId: id, details: found ? `${found.firstName} ${found.lastName}` : undefined });
  return true;
}
