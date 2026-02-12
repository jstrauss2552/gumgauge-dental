/**
 * Clinical / progress note templates for structured documentation.
 */
export const CLINICAL_NOTE_TEMPLATES = [
  { id: "new-patient", name: "New patient exam", placeholder: "Chief complaint:\nMedical history reviewed:\nClinical findings:\nTreatment discussed:\nPlan:" },
  { id: "prophy", name: "Prophylaxis", placeholder: "Prophy completed. Findings:\nPatient education:\nNext recall:" },
  { id: "srp", name: "Scaling and root planing", placeholder: "Areas treated:\nAnesthesia:\nPost-op instructions:\nFollow-up:" },
  { id: "emergency", name: "Emergency visit", placeholder: "Chief complaint:\nClinical findings:\nTreatment rendered:\nDisposition:" },
  { id: "restorative", name: "Restorative", placeholder: "Tooth/teeth:\nProcedure:\nMaterials:\nNotes:" },
  { id: "extraction", name: "Extraction", placeholder: "Tooth:\nIndication:\nAnesthesia:\nTechnique:\nPost-op instructions:" },
  { id: "custom", name: "Free form", placeholder: "Enter clinical note..." },
] as const;

export type ClinicalNoteTemplateId = (typeof CLINICAL_NOTE_TEMPLATES)[number]["id"];
