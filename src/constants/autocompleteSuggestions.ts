/**
 * Central autocomplete (datalist) suggestions for topics/subjects across the app.
 * Used with <input list="..."> and <datalist id="..."> for type-ahead suggestions.
 */

export const COMMON_ALLERGIES = [
  "Penicillin",
  "Amoxicillin",
  "Latex",
  "Sulfa drugs",
  "Aspirin",
  "Ibuprofen",
  "Codeine",
  "Local anesthetic (e.g. lidocaine)",
  "Nickel",
  "No known allergies",
];

export const COMMON_MEDICAL_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  "Heart disease",
  "Asthma",
  "Blood thinners (anticoagulants)",
  "Osteoporosis",
  "Pregnancy",
  "Cancer / chemotherapy",
  "HIV/AIDS",
  "Hepatitis",
  "Rheumatoid arthritis",
  "Thyroid disorder",
  "Kidney disease",
  "Liver disease",
  "Anxiety / depression",
  "Epilepsy",
  "None",
];

export const COMMON_CURRENT_MEDICATIONS = [
  "None",
  "Metformin",
  "Lisinopril",
  "Amlodipine",
  "Warfarin",
  "Aspirin",
  "Insulin",
  "Levothyroxine",
  "Omeprazole",
  "Atorvastatin",
  "Metoprolol",
  "Albuterol",
  "Gabapentin",
  "Sertraline",
  "Amitriptyline",
];

export const INSURANCE_PLANS = [
  "PPO",
  "HMO",
  "EPO",
  "DHMO",
  "DPPO",
  "Indemnity",
  "Medicare",
  "Medicaid",
  "Select plan",
];

export const APPOINTMENT_TYPE_OTHER = [
  "Implant consultation",
  "TMJ follow-up",
  "Crown delivery",
  "Bridge delivery",
  "Denture adjustment",
  "Botox / filler",
  "Sleep apnea appliance",
  "Invisalign check",
  "Bonding",
  "Veneer consultation",
  "Oral surgery consultation",
  "Periodontal surgery",
  "Emergency pain",
];

export const CHIEF_COMPLAINTS = [
  "Routine checkup",
  "Cleaning",
  "Tooth pain",
  "Sensitive teeth",
  "Broken tooth",
  "Lost filling",
  "Bleeding gums",
  "Bad breath",
  "Jaw pain",
  "Cosmetic consultation",
  "Denture problem",
  "Impacted tooth",
  "Swelling",
  "Follow-up",
  "Second opinion",
  "Reason for visit",
];

export const COMMON_OPERATORIES = [
  "Op 1",
  "Op 2",
  "Op 3",
  "Op 4",
  "Op 5",
  "Op 6",
  "Operatory 1",
  "Operatory 2",
  "Room 1",
  "Room 2",
  "Room A",
  "Room B",
  "Suite 1",
  "Suite 2",
];

export const PRESCRIBER_CREDENTIALS = [
  "DDS",
  "DMD",
  "MD",
  "DO",
  "RPh",
  "DDS, MS",
  "DMD, MS",
  "DDS, PhD",
];

export const MEDICATION_STRENGTHS = [
  "250mg capsule",
  "500mg capsule",
  "500mg tablet",
  "250mg/5ml suspension",
  "500mg/5ml suspension",
  "0.12% rinse",
  "400mg tablet",
  "5mg tablet",
  "10mg tablet",
  "325mg tablet",
  "0.5mg tablet",
  "1% gel",
];

export const TREATMENT_PHASE_NAMES = [
  "Phase 1: Emergency",
  "Phase 2: Restorative",
  "Phase 3: Perio",
  "Phase 4: Endo",
  "Phase 5: Crowns / prosthetics",
  "Phase 6: Implants",
  "Phase 7: Ortho",
  "Phase 8: Maintenance",
  "Phase 1: Evaluation",
  "Phase 2: Surgical",
  "Phase 3: Maintenance",
];

/** Suggestions for image/radiograph labels when uploading to chart. */
export const IMAGE_LABEL_SUGGESTIONS = [
  "Panoramic X-ray",
  "Bitewing",
  "Periapical",
  "Full mouth series",
  "CBCT",
  "Intraoral photo",
  "GumGauge Scan",
  "Panoramic X-ray Jan",
  "Bitewing 4-film",
  "Periapical #3",
  "Pre-op",
  "Post-op",
];

/** Procedure description suggestions (CDT-style + common phrases). Use with CDT_CODES for full list. */
export const CLAIM_OR_PROCEDURE_DESCRIPTIONS = [
  "Root canal #3",
  "Root canal #14",
  "Root canal #19",
  "Extraction #1",
  "Extraction - erupted tooth",
  "Crown #3",
  "Crown #14",
  "Prophylaxis - adult",
  "Scaling and root planing - per quadrant",
  "Periodic oral evaluation",
  "Comprehensive oral evaluation",
  "Bitewing - 4 films",
  "Intraoral - complete series",
  "Resin - 1 surface, posterior",
  "Resin - 2 surfaces, posterior",
  "Amalgam - 2 surfaces, primary",
  "Crown - porcelain/ceramic",
  "Endodontic therapy - molar",
  "Dental sealant - per tooth",
  "Pulp cap - direct",
];
