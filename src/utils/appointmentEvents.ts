import type { Patient } from "../types";
import type { AppointmentEvent } from "../types/appointments";

const DEFAULT_TIME = "09:00";
const DEFAULT_DURATION = 60;

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

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
