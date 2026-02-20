/**
 * Export and import all clinic data as JSON for backup and restore.
 * Uses current demo mode: export reads from current mode; import writes to current mode.
 */
import { getPatients, savePatients } from "../storage";
import { getStaff, saveStaff } from "./staffStorage";
import { getClinic, setClinic } from "./clinicStorage";
import { getAppointments, replaceAllAppointments } from "./appointmentStorage";
import { getOperatories, replaceAllOperatories } from "./operatoryStorage";
import { getFeeSchedule, replaceAllFeeSchedule } from "./feeScheduleStorage";
import { getAuditEntries, setAuditEntries } from "./auditStorage";
import { getAllAvailability, replaceAllAvailability } from "./staffAvailabilityStorage";
import { DEMO_MODE_KEY } from "../constants/admin";
import type { Patient } from "../types";
import type { Clinic } from "./clinicStorage";
import type { AuditEntry } from "./auditStorage";
import type { FeeScheduleEntry } from "../types";
import type { StaffAvailability } from "../types";

const EXPORT_VERSION = 1;

function isDemoMode(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export interface ExportedData {
  version: number;
  exportedAt: string;
  demoMode: boolean;
  patients: Patient[];
  staff: ReturnType<typeof getStaff>;
  clinic: Clinic | null;
  appointments: ReturnType<typeof getAppointments>;
  operatories: ReturnType<typeof getOperatories>;
  feeSchedule: FeeScheduleEntry[];
  audit: AuditEntry[];
  staffAvailability: StaffAvailability[];
}

export function exportData(includeAudit = true): ExportedData {
  const data: ExportedData = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    demoMode: isDemoMode(),
    patients: getPatients(),
    staff: getStaff(),
    clinic: getClinic(),
    appointments: getAppointments(),
    operatories: getOperatories(),
    feeSchedule: getFeeSchedule(),
    audit: includeAudit ? getAuditEntries({ limit: 5000 }) : [],
    staffAvailability: getAllAvailability(),
  };
  return data;
}

export function exportDataAsBlob(includeAudit = true): Blob {
  const data = exportData(includeAudit);
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}

export function downloadExport(includeAudit = true, filename?: string): void {
  const blob = exportDataAsBlob(includeAudit);
  const name = filename ?? `gumgauge-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

function validateExportedData(raw: unknown): raw is ExportedData {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.version === "number" &&
    o.version >= 1 &&
    Array.isArray(o.patients) &&
    Array.isArray(o.staff) &&
    Array.isArray(o.appointments) &&
    Array.isArray(o.operatories) &&
    Array.isArray(o.feeSchedule) &&
    Array.isArray(o.audit) &&
    Array.isArray(o.staffAvailability)
  );
}

/**
 * Import data from a previously exported JSON. Overwrites all current data for the active mode.
 * Returns an error message or null on success.
 */
export function importData(data: unknown): string | null {
  if (!validateExportedData(data)) {
    return "Invalid backup file: missing or invalid version or data.";
  }
  try {
    savePatients(data.patients);
    saveStaff(data.staff);
    setClinic(data.clinic ?? null);
    replaceAllAppointments(data.appointments);
    replaceAllOperatories(data.operatories);
    replaceAllFeeSchedule(data.feeSchedule);
    setAuditEntries(data.audit);
    replaceAllAvailability(data.staffAvailability);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : "Import failed.";
  }
}
