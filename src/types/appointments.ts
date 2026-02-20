import type { AppointmentStatus } from "../types";

/**
 * Appointment event for calendar/list. Built from first-class Appointment records or from patient's dateOfAppointment/dateOfNextAppointment (legacy).
 */
export interface AppointmentEvent {
  id: string;
  /** When from first-class Appointment, same as appointment.id; when legacy, synthetic e.g. apt-{patientId}-{date}. */
  appointmentId?: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes?: number;
  type: "appointment" | "next";
  appointmentType?: string;
  provider?: string;
  /** Provider staff ID when from first-class Appointment. */
  providerId?: string;
  room?: string;
  /** Operatory ID when from first-class Appointment. */
  operatoryId?: string;
  patientName: string;
  /** Flow status for today's appointment (Scheduled, Checked In, In Chair, With Doctor, Checkout, No-Show, Broken). */
  status?: AppointmentStatus;
  /** When patient checked in (ISO); from first-class Appointment. */
  checkedInAt?: string;
}
