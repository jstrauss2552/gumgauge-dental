const CLINIC_STORAGE_KEY = "gumgauge-clinic";

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

function getStored(): Clinic | null {
  try {
    const raw = localStorage.getItem(CLINIC_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Clinic;
  } catch {
    return null;
  }
}

export function getClinic(): Clinic | null {
  return getStored();
}

export function saveClinic(clinic: Partial<Clinic> & { name: string }): Clinic {
  const existing = getStored();
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
    localStorage.setItem(CLINIC_STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}
