import type { Patient } from "./types";
import { addAuditEntry } from "./storage/auditStorage";
import { DEMO_MODE_KEY } from "./constants/admin";
import { getDemoPatients } from "./data/demoSeed";

const STORAGE_KEY = "gumgauge-patients";
const DEMO_STORAGE_KEY = "gumgauge-demo-patients";

function isDemoMode(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

function getPatientStorageKey(): string {
  return isDemoMode() ? DEMO_STORAGE_KEY : STORAGE_KEY;
}

function ensureDemoSeed(): void {
  if (!isDemoMode()) return;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) return; // already seeded
    const patients = getDemoPatients();
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(patients));
  } catch {
    // ignore
  }
}

export function getPatients(): Patient[] {
  const key = getPatientStorageKey();
  if (key === DEMO_STORAGE_KEY) ensureDemoSeed();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePatients(patients: Patient[]): void {
  const key = getPatientStorageKey();
  localStorage.setItem(key, JSON.stringify(patients));
}

export function getPatientById(id: string): Patient | undefined {
  return getPatients().find((p) => p.id === id);
}

export function addPatient(patient: Omit<Patient, "id" | "createdAt" | "updatedAt">): Patient {
  const patients = getPatients();
  const now = new Date().toISOString();
  const newPatient: Patient = {
    ...patient,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  patients.push(newPatient);
  savePatients(patients);
  addAuditEntry({ timestamp: now, action: "patient.create", entityType: "patient", entityId: newPatient.id, details: `${newPatient.firstName} ${newPatient.lastName}` });
  return newPatient;
}

export function updatePatient(id: string, updates: Partial<Patient>): Patient | null {
  const patients = getPatients();
  const index = patients.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const now = new Date().toISOString();
  patients[index] = { ...patients[index], ...updates, updatedAt: now };
  savePatients(patients);
  addAuditEntry({ timestamp: now, action: "patient.update", entityType: "patient", entityId: id });
  return patients[index];
}

export function deletePatient(id: string): boolean {
  const patients = getPatients();
  const found = patients.find((p) => p.id === id);
  const next = patients.filter((p) => p.id !== id);
  if (next.length === patients.length) return false;
  savePatients(next);
  addAuditEntry({ timestamp: new Date().toISOString(), action: "patient.delete", entityType: "patient", entityId: id, details: found ? `${found.firstName} ${found.lastName}` : undefined });
  return true;
}

/** Clear visit history (and current visit) for all patients. For admin use only. */
export function clearAllPatientVisitHistory(): void {
  const patients = getPatients();
  const now = new Date().toISOString();
  const updated = patients.map((p) => ({
    ...p,
    visitHistory: [],
    currentVisitStartedAt: undefined,
    currentVisitNotes: undefined,
    currentVisitUseVoiceNotes: undefined,
    updatedAt: now,
  }));
  savePatients(updated);
}
