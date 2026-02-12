import type { Patient } from "./types";
import { addAuditEntry } from "./storage/auditStorage";

const STORAGE_KEY = "gumgauge-patients";

export function getPatients(): Patient[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function savePatients(patients: Patient[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
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
