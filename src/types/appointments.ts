import type { AppointmentStatus } from "../types";

/**
 * Appointment event for calendar/list. Derived from patient's dateOfAppointment/dateOfNextAppointment
 * or from first-class Appointment records if we add them later.
 */
export interface AppointmentEvent {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes?: number;
  type: "appointment" | "next";
  appointmentType?: string;
  provider?: string;
  room?: string;
  patientName: string;
  /** Flow status for today's appointment (Scheduled, Checked In, In Chair, With Doctor, Checkout, No-Show, Broken). */
  status?: AppointmentStatus;
}
