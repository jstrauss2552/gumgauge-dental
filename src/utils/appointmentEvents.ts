import type { Patient, Appointment } from "../types";
import type { AppointmentEvent } from "../types/appointments";

const DEFAULT_TIME = "09:00";
const DEFAULT_DURATION = 60;

/** Build events from first-class Appointment records. Patient names resolved from patients map (id -> name). */
export function buildEventsFromAppointments(
  appointments: Appointment[],
  getPatientName: (patientId: string) => string
): AppointmentEvent[] {
  const today = new Date().toISOString().slice(0, 10);
  return appointments.map((a) => {
    const date = a.start.slice(0, 10);
    const time = a.start.slice(11, 16); // HH:mm
    const endMins = new Date(a.end).getHours() * 60 + new Date(a.end).getMinutes();
    const startMins = new Date(a.start).getHours() * 60 + new Date(a.start).getMinutes();
    const durationMinutes = endMins - startMins;
    return {
      id: a.id,
      appointmentId: a.id,
      patientId: a.patientId,
      date,
      time,
      durationMinutes: durationMinutes > 0 ? durationMinutes : undefined,
      type: date >= today ? (date === today ? "appointment" : "next") : "appointment",
      appointmentType: a.type,
      providerId: a.providerId,
      operatoryId: a.operatoryId,
      patientName: getPatientName(a.patientId),
      status: a.status,
      checkedInAt: a.checkedInAt,
    };
  });
}

export function buildEventsFromPatients(patients: Patient[]): AppointmentEvent[] {
  const events: AppointmentEvent[] = [];
  patients.forEach((p) => {
    const name = `${p.firstName} ${p.lastName}`;
    if (p.dateOfAppointment) {
      events.push({
        id: `apt-${p.id}-${p.dateOfAppointment}`,
        patientId: p.id,
        date: p.dateOfAppointment,
        time: p.appointmentTime ?? DEFAULT_TIME,
        durationMinutes: p.appointmentDurationMinutes ?? DEFAULT_DURATION,
        type: "appointment",
        appointmentType: p.appointmentType,
        provider: p.appointmentDoctor,
        room: p.appointmentRoom,
        patientName: name,
        status: p.appointmentStatus,
      });
    }
    if (p.dateOfNextAppointment) {
      events.push({
        id: `next-${p.id}-${p.dateOfNextAppointment}`,
        patientId: p.id,
        date: p.dateOfNextAppointment,
        time: p.nextAppointmentTime ?? DEFAULT_TIME,
        durationMinutes: p.nextAppointmentDurationMinutes ?? DEFAULT_DURATION,
        type: "next",
        appointmentType: p.appointmentType,
        provider: p.appointmentDoctor,
        room: p.nextAppointmentRoom,
        patientName: name,
      });
    }
  });
  return events;
}

/**
 * Unified events: use first-class appointments when any exist; otherwise fall back to patient-derived events.
 */
export function buildUnifiedEvents(
  appointments: Appointment[],
  patients: Patient[],
  getStaffDisplayName?: (staffId: string) => string
): AppointmentEvent[] {
  if (appointments.length > 0) {
    const patientMap = new Map(patients.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
    const getPatientName = (id: string) => patientMap.get(id) ?? "Unknown";
    const events = buildEventsFromAppointments(appointments, getPatientName);
    if (getStaffDisplayName) {
      return events.map((e) => ({
        ...e,
        provider: e.providerId ? getStaffDisplayName(e.providerId) : e.provider,
      }));
    }
    return events;
  }
  return buildEventsFromPatients(patients);
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
