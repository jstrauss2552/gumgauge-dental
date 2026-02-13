/**
 * Role-based permissions derived from staff position.
 * Used to hide/disable features (e.g. billing, delete patient, reports).
 */
export type Permission =
  | "viewClinical"
  | "editClinical"
  | "viewFinancials"
  | "editFinancials"
  | "deletePatient"
  | "runReports"
  | "manageStaff"
  | "manageClinic";

const CLINICAL_POSITIONS = [
  "Dentist",
  "Pediatric Dentist",
  "Dental Hygienist",
  "Dental Assistant",
  "Certified Dental Assistant (CDA)",
  "Sterilization Technician",
  "Orthodontist",
  "Endodontist",
  "Periodontist",
  "Oral Surgeon",
  "Dental Lab Technician",
];

const FRONT_OFFICE_POSITIONS = [
  "Front Desk / Receptionist",
  "Patient Coordinator",
  "Billing / Insurance Coordinator",
  "Office Manager",
  "Practice Manager",
];

const DENTIST_POSITIONS = [
  "Dentist",
  "Pediatric Dentist",
  "Orthodontist",
  "Endodontist",
  "Periodontist",
  "Oral Surgeon",
];

export function getPermissionsForPosition(position: string): Set<Permission> {
  const set = new Set<Permission>();
  if (CLINICAL_POSITIONS.includes(position)) {
    set.add("viewClinical");
    set.add("editClinical");
  }
  if (FRONT_OFFICE_POSITIONS.includes(position) || DENTIST_POSITIONS.includes(position)) {
    set.add("viewFinancials");
    set.add("editFinancials");
  }
  if (["Billing / Insurance Coordinator", "Office Manager", "Practice Manager", ...DENTIST_POSITIONS].includes(position)) {
    set.add("runReports");
  }
  if (DENTIST_POSITIONS.includes(position)) {
    set.add("deletePatient");
  }
  if (["Office Manager", "Practice Manager"].includes(position)) {
    set.add("manageStaff");
    set.add("manageClinic");
  }
  return set;
}

export function hasPermission(position: string, permission: Permission): boolean {
  return getPermissionsForPosition(position).has(permission);
}
