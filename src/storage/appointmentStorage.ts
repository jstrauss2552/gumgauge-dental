import type { Appointment, AppointmentInput } from "../types";
import { addAuditEntry } from "./auditStorage";
import { DEMO_MODE_KEY } from "../constants/admin";
import { getDemoAppointments } from "../data/demoSeed";

const STORAGE_KEY = "gumgauge-appointments";
const DEMO_STORAGE_KEY = "gumgauge-demo-appointments";

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
    const appointments = getDemoAppointments();
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(appointments));
  } catch {
    // ignore
  }
}

function getStored(key: string): Appointment[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as Appointment[];
  } catch {
    return [];
  }
}

export function getAppointments(): Appointment[] {
  const key = getStorageKey();
  if (key === DEMO_STORAGE_KEY) ensureDemoSeed();
  return getStored(key);
}

export function getAppointmentById(id: string): Appointment | undefined {
  return getAppointments().find((a) => a.id === id);
}

export function getAppointmentsByPatient(patientId: string): Appointment[] {
  return getAppointments()
    .filter((a) => a.patientId === patientId)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Appointments on a given date (YYYY-MM-DD). */
export function getAppointmentsByDate(date: string): Appointment[] {
  return getAppointments().filter((a) => a.start.startsWith(date));
}

/** Appointments in range [startDate, endDate] (inclusive, YYYY-MM-DD). */
export function getAppointmentsByDateRange(startDate: string, endDate: string): Appointment[] {
  return getAppointments().filter((a) => {
    const d = a.start.slice(0, 10);
    return d >= startDate && d <= endDate;
  });
}

/** Check for overlapping appointments: same operatoryId or same providerId in [start, end]. Exclude appointmentId if editing. */
export function getAppointmentConflicts(
  start: string,
  end: string,
  operatoryId: string | undefined,
  providerId: string,
  excludeAppointmentId?: string
): Appointment[] {
  const all = getAppointments();
  return all.filter((a) => {
    if (a.id === excludeAppointmentId) return false;
    const aStart = a.start;
    const aEnd = a.end;
    const overlaps = start < aEnd && end > aStart;
    if (!overlaps) return false;
    if (operatoryId && a.operatoryId === operatoryId) return true;
    if (a.providerId === providerId) return true;
    return false;
  });
}

export function addAppointment(input: AppointmentInput): Appointment {
  const now = new Date().toISOString();
  const appointment: Appointment = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  const key = getStorageKey();
  const list = getStored(key);
  localStorage.setItem(key, JSON.stringify([...list, appointment]));
  addAuditEntry({ timestamp: now, action: "appointment.create", entityType: "appointment", entityId: appointment.id, details: input.patientId });
  return appointment;
}

export function updateAppointment(id: string, updates: Partial<AppointmentInput>): Appointment | null {
  const list = getAppointments();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  const next = [...list];
  next[index] = { ...next[index], ...updates, updatedAt: now };
  localStorage.setItem(getStorageKey(), JSON.stringify(next));
  addAuditEntry({ timestamp: now, action: "appointment.update", entityType: "appointment", entityId: id });
  return next[index];
}

export function deleteAppointment(id: string): boolean {
  const list = getAppointments().filter((a) => a.id !== id);
  if (list.length === getAppointments().length) return false;
  localStorage.setItem(getStorageKey(), JSON.stringify(list));
  addAuditEntry({ timestamp: new Date().toISOString(), action: "appointment.delete", entityType: "appointment", entityId: id });
  return true;
}

/** Replace all appointments (e.g. for import/restore). Does not add audit entries. */
export function replaceAllAppointments(appointments: Appointment[]): void {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(appointments ?? []));
  } catch {}
}
