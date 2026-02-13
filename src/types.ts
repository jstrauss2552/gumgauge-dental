export interface Patient {
  id: string;
  // Demographics
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  address?: string;
  // Medical history (relevant to dental treatment)
  allergies?: string;
  medicalConditions?: string;
  currentMedications?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  // Insurance
  insuranceProvider?: string;
  insurancePlan?: string;
  insuranceMemberId?: string;
  insuranceGroupNumber?: string;
  // Appointments & clinical
  dateOfAppointment: string;
  dateOfNextAppointment: string;
  appointmentTime?: string; // e.g. "09:00" for sorting/display
  nextAppointmentTime?: string;
  appointmentType?: string;
  /** When appointment type is "Other", this holds the free-text description */
  appointmentTypeOther?: string;
  appointmentDoctor?: string; // e.g. "Dr. Smith" — who is performing this appointment
  chiefComplaint?: string;
  treatmentPlan?: string;
  lastCleaningDate?: string;
  dentistNotes: string;
  /** X-rays, radiographs, and other visit images (stored as data URLs in localStorage) */
  patientImages?: PatientImage[];
  /** When set, patient is currently in the office for an appointment (visit in progress). ISO timestamp. */
  currentVisitStartedAt?: string;
  /** When true, this visit uses AI voice notes (with consent); notes stored with anonymity. */
  currentVisitUseVoiceNotes?: boolean;
  /** Temporary notes/transcript for current visit (moved to visit history on End visit). */
  currentVisitNotes?: string;
  /** Past visits: start, end, and duration in minutes (catalogued when "End visit" is used). */
  visitHistory?: VisitHistoryEntry[];
  /** Periodontal charting exams (pocket depths, bleeding, etc.); compare over time. */
  perioExams?: PerioExam[];
  /** GumGauge device scan results (light penetration %, health per tooth); auto-filled from device, shown in chart. */
  gumGaugeExams?: GumGaugeExam[];
  /** Structured progress / clinical notes (with optional templates). */
  clinicalNotes?: ClinicalNoteEntry[];
  /** Formal treatment plans with phases, procedures, estimated costs; printable. */
  treatmentPlans?: FormalTreatmentPlan[];
  /** Outstanding balance due (billing). */
  balanceDue?: number;
  /** Payment history for billing. */
  paymentHistory?: PaymentHistoryEntry[];
  /** Insurance: remaining deductible (amount left for patient to pay before insurance pays). */
  insuranceDeductibleRemaining?: number;
  /** Insurance: annual deductible amount (for display/tracking). */
  insuranceDeductibleAnnual?: number;
  /** Stored payment methods for future visits (card on file, etc.). */
  paymentMethods?: PaymentMethod[];
  /** Insurance claims sent or to be sent (surgery, large procedures). */
  insuranceClaims?: InsuranceClaim[];
  /** Invoice line items (charges by appointment date); used for billing and receipts. */
  invoiceLines?: InvoiceLine[];
  /** Prescriptions written for this patient. */
  prescriptions?: Prescription[];
  /** Recall/recurring interval in months (e.g. 6 for 6-month prophy). */
  recallIntervalMonths?: number;
  /** Duration of current appointment in minutes. */
  appointmentDurationMinutes?: number;
  /** Room or operatory for current appointment. */
  appointmentRoom?: string;
  /** Duration of next appointment in minutes. */
  nextAppointmentDurationMinutes?: number;
  /** Room for next appointment. */
  nextAppointmentRoom?: string;
  /** Current appointment flow status (for today's appointment). */
  appointmentStatus?: AppointmentStatus;
  /** Restorative chart: conditions per tooth/surface (caries, existing, missing, planned). */
  toothConditions?: ToothCondition[];
  /** Consent forms, referrals, lab slips, other documents. */
  documents?: PatientDocument[];
  /** Last date a recall reminder was sent (ISO date). */
  lastRecallReminderSent?: string;
  /** Last date an appointment reminder was sent (ISO date). */
  lastAppointmentReminderSent?: string;
  createdAt: string;
  updatedAt: string;
}

/** Appointment flow status for front desk / clinical. */
export type AppointmentStatus = "Scheduled" | "Checked In" | "In Chair" | "With Doctor" | "Checkout" | "No-Show" | "Broken";

/** Tooth condition for restorative charting (per tooth or per surface). */
export interface ToothCondition {
  id: string;
  tooth: number; // 1-32
  /** Surface: M, O, D, F, I, B, L, etc. Optional = whole tooth. */
  surface?: string;
  condition: ToothConditionType;
  /** Planned vs completed. */
  status: "Planned" | "Completed";
  /** When completed (ISO date). */
  completedAt?: string;
  note?: string;
  addedAt: string;
}

export type ToothConditionType = "Sound" | "Caries" | "Existing Restoration" | "Missing" | "Planned" | "Implant" | "Crown" | "Root Canal" | "Extraction" | "Other";

/** Patient document (consent, referral, lab, etc.). */
export interface PatientDocument {
  id: string;
  type: "Consent" | "Referral" | "Lab" | "Insurance" | "Other";
  title: string;
  date: string; // ISO date
  note?: string;
  /** Optional file/data URL for scanned doc. */
  dataUrl?: string;
  addedAt: string;
}

export interface VisitHistoryEntry {
  startedAt: string; // ISO
  endedAt: string;   // ISO
  durationMinutes: number;
  /** Clinical summary or voice notes transcript (patient anonymity preserved in recording). */
  clinicalSummary?: string;
  /** Whether AI voice notes were used with consent for this visit. */
  voiceNotesConsent?: boolean;
}

/** All imaging types available when attaching images to a patient chart */
export const PATIENT_IMAGE_TYPES = [
  "X-ray",
  "Panoramic X-ray",
  "Bitewing",
  "Periapical",
  "Radiograph",
  "CBCT (Cone Beam CT)",
  "CT scan",
  "MRI",
  "Ultrasound",
  "Intraoral photo",
  "Extraoral photo",
  "Photograph",
  "GumGauge Scan",
  "Other",
] as const;

export type PatientImageType = (typeof PATIENT_IMAGE_TYPES)[number];

export interface PatientImage {
  id: string;
  label: string; // e.g. "Panoramic X-ray Jan 2026"
  /** Use PATIENT_IMAGE_TYPES for new uploads; string allows legacy values (e.g. "x-ray") */
  type: PatientImageType | string;
  dataUrl: string; // base64 data URL from file read
  dateAdded: string; // ISO date
}

export type PatientInput = Omit<Patient, "id" | "createdAt" | "updatedAt">;

export const APPOINTMENT_TYPES = [
  "Checkup",
  "Cleaning",
  "Emergency",
  "Extraction",
  "Filling",
  "Follow-up",
  "GumGauge Scan",
  "New patient",
  "Root canal",
  "Whitening",
  "Other",
] as const;

// Staff (dental office employees)
export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  position: string; // from STAFF_POSITIONS in constants/staffPositions
  email?: string;
  phone?: string;
  /** Unique login identifier (email or username) for sign-in; required to use Sign in */
  loginEmail?: string;
  /** Password for sign-in (stored client-side for demo; use server auth in production) */
  password?: string;
  hireDate: string; // YYYY-MM-DD
  status: string; // Active | On leave | Inactive
  licenseNumber?: string;
  licenseExpiry?: string; // YYYY-MM-DD
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  /** Patient IDs assigned to this staff (e.g. dentist's patient list). Used for "My patients" view. */
  assignedPatientIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type StaffInput = Omit<Staff, "id" | "createdAt" | "updatedAt">;

// --- Clinical tools ---

/** Standard 6 sites per tooth: MB, B, DB, ML, L, DL (mesiobuccal, buccal, distobuccal, mesiolingual, lingual, distolingual) */
export const PERIO_SITES = ["MB", "B", "DB", "ML", "L", "DL"] as const;
export type PerioSiteId = (typeof PERIO_SITES)[number];

/** Per-tooth perio readings. Each array is 6 elements (one per site). */
export interface PerioToothReadings {
  tooth: number; // 1-32 universal
  pd?: number[];   // pocket depth mm
  bleeding?: boolean[];
  suppuration?: boolean[];
  gm?: number[];   // gingival margin mm
  cal?: number[]; // clinical attachment level mm
  furcation?: string; // e.g. "Class I", "Class II"
  mobility?: string;  // e.g. "0", "1", "2", "3"
}

export interface PerioExam {
  id: string;
  examDate: string; // ISO date
  teeth: PerioToothReadings[];
  notes?: string;
}

/** GumGauge device: density (0-1023) maps to health. Stored per tooth for chart integration. */
export type GumGaugeHealthResult = "Healthy" | "Moderate" | "Unhealthy";

export interface GumGaugeToothReading {
  tooth: number; // 1-32
  /** Raw density from device (0-1023). Higher = denser tissue. */
  density?: number;
  /** Light penetration % (0-100). Derived or from device. */
  lightPenetrationPercent?: number;
  /** Health from device: ≤350 Healthy, 351-530 Moderate, >530 Unhealthy. */
  healthResult?: GumGaugeHealthResult;
}

export interface GumGaugeExam {
  id: string;
  scanDate: string; // ISO date
  teeth: GumGaugeToothReading[];
  notes?: string;
}

/** Map raw density (0-1023) to health per C++ logic. */
export function densityToHealthResult(density: number): GumGaugeHealthResult {
  if (density <= 350) return "Healthy";
  if (density <= 530) return "Moderate";
  return "Unhealthy";
}

/** Map density to approximate light penetration % (inverse relationship). */
export function densityToLightPercent(density: number): number {
  const clamped = Math.max(0, Math.min(1023, density));
  return Math.round(100 - (clamped / 1023) * 100);
}

/** Clinical / progress note with optional template */
export interface ClinicalNoteEntry {
  id: string;
  date: string; // ISO date
  templateId?: string;
  content: string;
  author?: string;
  createdAt: string;
}

/** One procedure line in a treatment phase */
export interface TreatmentPlanProcedure {
  code?: string;   // CDT or internal code
  description: string;
  estimatedFee?: number;
}

/** One phase of a formal treatment plan */
export interface TreatmentPlanPhase {
  id: string;
  name: string; // e.g. "Phase 1: Emergency", "Phase 2: Restorative"
  procedures: TreatmentPlanProcedure[];
  notes?: string;
}

export interface FormalTreatmentPlan {
  id: string;
  createdAt: string; // ISO
  phases: TreatmentPlanPhase[];
  status?: "Draft" | "Accepted" | "In progress" | "Completed" | "Declined";
  notes?: string;
  /** When patient accepted (for case acceptance reporting). */
  acceptedAt?: string;
  /** When patient declined. */
  declinedAt?: string;
  /** Staff who presented (optional). */
  presentedBy?: string;
}

export interface PaymentHistoryEntry {
  id: string;
  date: string; // ISO date
  amount: number;
  note?: string;
  /** Payment method used (if any). */
  paymentMethodId?: string;
  /** Amount applied from insurance (if split). */
  amountWithInsurance?: number;
  /** Amount paid out of pocket. */
  amountOutOfPocket?: number;
}

/** One line on the patient invoice (charge by appointment date). */
export interface InvoiceLine {
  id: string;
  /** Appointment date this charge is tied to (ISO date). */
  appointmentDate: string;
  procedureCode?: string;
  description: string;
  /** Total charge amount. */
  amount: number;
  /** Portion expected from insurance. */
  amountWithInsurance?: number;
  /** Portion patient pays out of pocket. */
  amountOutOfPocket?: number;
  status?: "Pending" | "Paid" | "Partially paid";
  addedAt: string; // ISO
}

/** Stored payment method for front office (e.g. card on file). */
export interface PaymentMethod {
  id: string;
  type: "Card" | "Check" | "Cash" | "Other";
  /** Last 4 digits or identifier for display. */
  lastFour?: string;
  nickname?: string;
  /** Name on card (for charging). */
  nameOnCard?: string;
  /** Expiry month 1–12 (optional). */
  expiryMonth?: number;
  /** Expiry year (e.g. 2028). */
  expiryYear?: number;
  addedAt: string; // ISO
}

/** Insurance claim (e.g. for surgery or large procedures). */
export interface InsuranceClaim {
  id: string;
  date: string; // ISO date sent or to send
  procedureCodes: string[]; // CDT codes
  description: string;
  amount: number;
  status: "Draft" | "Sent" | "Paid" | "Partially paid" | "Denied";
  note?: string;
}

/** Prescription (real-life structure: sig, quantity, refills, prescriber). */
export interface Prescription {
  id: string;
  /** Date prescribed (ISO date). */
  date: string;
  /** Medication name (e.g. Amoxicillin). */
  medication: string;
  /** Strength and form (e.g. 500mg capsule). */
  strength?: string;
  /** Sig: directions for use (e.g. "Take 1 tablet by mouth twice daily for 7 days"). */
  sig: string;
  /** Quantity dispensed (e.g. 30). */
  quantity: number;
  /** Number of refills (0 = no refills). */
  refills: number;
  /** Prescriber name (e.g. Dr. Smith). */
  prescriberName: string;
  /** Prescriber credentials (e.g. DDS). */
  prescriberCredentials?: string;
  /** DEA number if controlled substance (optional). */
  deaNumber?: string;
  /** Staff ID who signed (optional, for audit). */
  prescribedByStaffId?: string;
  /** When the prescription was signed (ISO). */
  signedAt: string;
  note?: string;
}
