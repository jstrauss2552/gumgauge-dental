import { DEMO_MODE_KEY } from "../constants/admin";
import { getDemoClinic } from "../data/demoSeed";

const CLINIC_STORAGE_KEY = "gumgauge-clinic";
const DEMO_CLINIC_STORAGE_KEY = "gumgauge-demo-clinic";

function isDemoMode(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

function getClinicStorageKey(): string {
  return isDemoMode() ? DEMO_CLINIC_STORAGE_KEY : CLINIC_STORAGE_KEY;
}

function ensureDemoClinicSeed(): void {
  if (!isDemoMode()) return;
  try {
    const raw = localStorage.getItem(DEMO_CLINIC_STORAGE_KEY);
    if (raw) return;
    const clinic = getDemoClinic();
    localStorage.setItem(DEMO_CLINIC_STORAGE_KEY, JSON.stringify(clinic));
  } catch {
    // ignore
  }
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  timezone?: string;
  /** For admin: when this clinic was registered (ISO). */
  registeredAt?: string;
  /** Number of GumGauge devices at this clinic. */
  deviceCount?: number;
}

function getStored(key: string): Clinic | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Clinic;
  } catch {
    return null;
  }
}

export function getClinic(): Clinic | null {
  const key = getClinicStorageKey();
  if (key === DEMO_CLINIC_STORAGE_KEY) ensureDemoClinicSeed();
  return getStored(key);
}

/** Remove the assigned clinic from this device. Admin can reassign from Clinic Log. */
export function unassignClinic(): void {
  try {
    localStorage.removeItem(CLINIC_STORAGE_KEY);
    if (isDemoMode()) localStorage.removeItem(DEMO_CLINIC_STORAGE_KEY);
  } catch {}
}

export function saveClinic(clinic: Partial<Clinic> & { name: string }): Clinic {
  const key = getClinicStorageKey();
  const existing = getStored(key);
  const now = new Date().toISOString();
  const next: Clinic = {
    id: existing?.id ?? crypto.randomUUID(),
    name: clinic.name,
    address: clinic.address ?? existing?.address,
    city: clinic.city ?? existing?.city,
    state: clinic.state ?? existing?.state,
    zip: clinic.zip ?? existing?.zip,
    phone: clinic.phone ?? existing?.phone,
    timezone: clinic.timezone ?? existing?.timezone,
    registeredAt: existing?.registeredAt ?? now,
    deviceCount: clinic.deviceCount ?? existing?.deviceCount ?? 1,
  };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
  return next;
}

/** Replace clinic entirely (e.g. for import/restore). Pass null to clear. */
export function setClinic(clinic: Clinic | null): void {
  try {
    const key = getClinicStorageKey();
    if (clinic === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(clinic));
    }
  } catch {}
}
