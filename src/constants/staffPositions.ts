/**
 * Dental clinic / office positions, including pediatric.
 * Grouped for display; value is the option value.
 */
export const STAFF_POSITION_GROUPS = [
  {
    label: "Clinical",
    positions: [
      "Dentist",
      "Pediatric Dentist",
      "Dental Hygienist",
      "Dental Assistant",
      "Certified Dental Assistant (CDA)",
      "Sterilization Technician",
    ],
  },
  {
    label: "Front office",
    positions: [
      "Front Desk / Receptionist",
      "Patient Coordinator",
      "Billing / Insurance Coordinator",
      "Office Manager",
      "Practice Manager",
    ],
  },
  {
    label: "Specialists",
    positions: [
      "Orthodontist",
      "Endodontist",
      "Periodontist",
      "Oral Surgeon",
    ],
  },
  {
    label: "Support",
    positions: [
      "Dental Lab Technician",
    ],
  },
] as const;

export const STAFF_POSITIONS_FLAT: string[] = STAFF_POSITION_GROUPS.flatMap((g) => [...g.positions]);

export const STAFF_STATUSES = ["Active", "On leave", "Inactive"] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

/** Positions that can have assigned patients and see "My patients" view */
export const STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS = [
  "Dentist",
  "Pediatric Dentist",
  "Orthodontist",
  "Endodontist",
  "Periodontist",
  "Oral Surgeon",
  "Dental Hygienist",
] as const;

/** Dentist-level positions that can delete a patient chart (clinic dentist / specialist). */
export const DENTIST_POSITIONS_FOR_CHART_DELETE = [
  "Dentist",
  "Pediatric Dentist",
  "Orthodontist",
  "Endodontist",
  "Periodontist",
  "Oral Surgeon",
] as const;
