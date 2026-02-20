/**
 * Demo mode seed data: clinic, patients, staff, operatories, appointments, and audit with full details.
 * Used only when DEMO_MODE_KEY is set; ensures demo is fully operational with no empty views.
 */
import type { Patient, Clinic, Staff, Operatory, Appointment, Referral, LabCase } from "../types";
import { densityToHealthResult } from "../types";
import type { AuditEntry } from "../storage/auditStorage";

const DEMO_CLINIC_ID = "demo-clinic-001";

/** Stable IDs for demo staff so links and audit references work. */
export const DEMO_STAFF_IDS = {
  dentist1: "demo-staff-001",
  dentist2: "demo-staff-002",
  hygienist: "demo-staff-003",
  receptionist: "demo-staff-004",
  assistant: "demo-staff-005",
} as const;

/** Stable IDs for demo patients so links and references work. */
export const DEMO_PATIENT_IDS = [
  "demo-patient-001",
  "demo-patient-002",
  "demo-patient-003",
  "demo-patient-004",
  "demo-patient-005",
  "demo-patient-006",
  "demo-patient-007",
  "demo-patient-008",
] as const;

/** Stable IDs for demo operatories. */
export const DEMO_OPERATORY_IDS = {
  op1: "demo-op-001",
  op2: "demo-op-002",
  op3: "demo-op-003",
} as const;

function getTodayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function getDemoClinic(): Clinic {
  const now = new Date().toISOString();
  return {
    id: DEMO_CLINIC_ID,
    name: "Sunset Family Dental",
    address: "4521 Oak Boulevard, Suite 200",
    city: "Austin",
    state: "Texas",
    zip: "78731",
    phone: "(512) 555-0142",
    timezone: "America/Chicago",
    registeredAt: now,
    deviceCount: 2,
  };
}

export function getDemoOperatories(): Operatory[] {
  return [
    { id: DEMO_OPERATORY_IDS.op1, name: "Op 1", defaultDurationMinutes: 45 },
    { id: DEMO_OPERATORY_IDS.op2, name: "Op 2", defaultDurationMinutes: 45 },
    { id: DEMO_OPERATORY_IDS.op3, name: "Op 3", defaultDurationMinutes: 60 },
  ];
}

function parseTimeToMinutes(t: string | undefined): number {
  if (!t) return 9 * 60; // 09:00
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function toISODateTime(date: string, timeStr: string | undefined, durationMinutes: number): { start: string; end: string } {
  const startMins = parseTimeToMinutes(timeStr);
  const start = new Date(date + "T12:00:00");
  start.setHours(Math.floor(startMins / 60), startMins % 60, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function doctorToProviderId(doctor: string | undefined): string {
  if (!doctor) return DEMO_STAFF_IDS.dentist1;
  if (doctor.includes("Torres")) return DEMO_STAFF_IDS.dentist2;
  if (doctor.includes("Chen")) return DEMO_STAFF_IDS.dentist1;
  return DEMO_STAFF_IDS.dentist1;
}

function roomToOperatoryId(room: string | undefined): string | undefined {
  if (!room) return undefined;
  if (room.includes("1")) return DEMO_OPERATORY_IDS.op1;
  if (room.includes("2")) return DEMO_OPERATORY_IDS.op2;
  if (room.includes("3")) return DEMO_OPERATORY_IDS.op3;
  return undefined;
}

export function getDemoAppointments(): Appointment[] {
  const now = new Date().toISOString();
  const patients = getDemoPatients();
  const appointments: Appointment[] = [];
  patients.forEach((p, idx) => {
    if (p.dateOfAppointment) {
      const dur = p.appointmentDurationMinutes ?? 45;
      const { start, end } = toISODateTime(p.dateOfAppointment, p.appointmentTime, dur);
      appointments.push({
        id: `demo-apt-${idx}-current`,
        patientId: p.id,
        providerId: doctorToProviderId(p.appointmentDoctor),
        operatoryId: roomToOperatoryId(p.appointmentRoom),
        start,
        end,
        type: p.appointmentType,
        typeOther: p.appointmentTypeOther,
        status: p.appointmentStatus,
        notes: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
    if (p.dateOfNextAppointment) {
      const dur = p.nextAppointmentDurationMinutes ?? 30;
      const { start, end } = toISODateTime(p.dateOfNextAppointment, p.nextAppointmentTime, dur);
      appointments.push({
        id: `demo-apt-${idx}-next`,
        patientId: p.id,
        providerId: doctorToProviderId(p.appointmentDoctor),
        operatoryId: roomToOperatoryId(p.nextAppointmentRoom),
        start,
        end,
        type: p.appointmentType,
        typeOther: p.appointmentTypeOther,
        notes: undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
  });
  return appointments;
}

export function getDemoPatients(): Patient[] {
  const now = new Date().toISOString();
  const today = getTodayLocal();
  const tomorrow = addDays(today, 1);
  const nextWeek = addDays(today, 7);
  const twoWeeks = addDays(today, 14);
  const lastMonth = addDays(today, -30);
  const lastWeek = addDays(today, -7);

  const patients: Patient[] = [
    {
      id: DEMO_PATIENT_IDS[0],
      firstName: "Maria",
      lastName: "Santos",
      dateOfBirth: "1985-03-12",
      phone: "(512) 555-0101",
      email: "maria.santos@email.com",
      address: "1200 Riverside Dr, Austin, TX 78741",
      allergies: "Penicillin",
      medicalConditions: "Hypertension",
      currentMedications: "Lisinopril 10mg daily",
      emergencyContactName: "Carlos Santos",
      emergencyContactPhone: "(512) 555-0102",
      insuranceProvider: "UnitedHealthcare",
      insurancePlan: "PPO",
      insuranceMemberId: "UHC-8821-4492",
      insuranceGroupNumber: "GP-7722",
      insuranceDeductibleAnnual: 500,
      insuranceDeductibleRemaining: 200,
      dateOfAppointment: today,
      dateOfNextAppointment: nextWeek,
      appointmentTime: "09:00",
      nextAppointmentTime: "10:30",
      appointmentType: "Cleaning",
      appointmentDoctor: "Dr. Sarah Chen",
      chiefComplaint: "Routine 6-month cleaning",
      treatmentPlan: "Continue 6-month recall. Monitor lower right molar for possible sealant.",
      lastCleaningDate: lastMonth,
      dentistNotes: "Patient in good oral health. No new caries. Recommended fluoride varnish at next visit.",
      appointmentDurationMinutes: 45,
      nextAppointmentDurationMinutes: 30,
      appointmentRoom: "Op 1",
      nextAppointmentRoom: "Op 2",
      appointmentStatus: "In Chair",
      recallIntervalMonths: 6,
      currentVisitStartedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      currentVisitNotes: "Patient checked in. X-rays reviewed. Prophy in progress.",
      currentVisitUseVoiceNotes: false,
      visitHistory: [
        { startedAt: `${lastMonth}T09:00:00`, endedAt: `${lastMonth}T09:45:00`, durationMinutes: 45, clinicalSummary: "Prophylaxis completed. No issues.", voiceNotesConsent: false },
        { startedAt: `${addDays(lastMonth, -180)}T14:00:00`, endedAt: `${addDays(lastMonth, -180)}T14:50:00`, durationMinutes: 50, clinicalSummary: "Cleaning and exam. One small filling discussed for future.", voiceNotesConsent: false },
      ],
      clinicalNotes: [
        { id: "cn1", date: lastMonth, content: "Prophylaxis (D1110) completed. Bitewings taken. No caries. Patient educated on flossing.", author: "Dr. Sarah Chen", createdAt: `${lastMonth}T10:00:00` },
        { id: "cn2", date: addDays(lastMonth, -180), content: "Routine cleaning. Mild gingivitis in lower anterior—recommended improved flossing.", author: "Dr. Sarah Chen", createdAt: `${addDays(lastMonth, -180)}T15:00:00` },
      ],
      balanceDue: 0,
      paymentHistory: [
        { id: "ph1", date: lastMonth, amount: 125, note: "Prophylaxis", amountOutOfPocket: 25, amountWithInsurance: 100 },
      ],
      paymentMethods: [
        { id: "pm1", type: "Card", lastFour: "4242", cardBrand: "Visa", nameOnCard: "Maria Santos", expiryMonth: 12, expiryYear: 2027, addedAt: `${lastMonth}T08:00:00` },
      ],
      invoiceLines: [
        { id: "inv1", appointmentDate: lastMonth, procedureCode: "D1110", description: "Prophylaxis - adult", amount: 125, amountWithInsurance: 100, amountOutOfPocket: 25, status: "Paid", addedAt: `${lastMonth}T09:00:00` },
      ],
      prescriptions: [
        { id: "rx1", date: addDays(lastMonth, -365), medication: "Amoxicillin", strength: "500mg capsule", sig: "Take 1 capsule by mouth three times daily for 7 days", quantity: 21, refills: 0, prescriberName: "Dr. Sarah Chen", prescriberCredentials: "DDS", signedAt: `${addDays(lastMonth, -365)}T11:00:00` },
      ],
      treatmentPlans: [
        {
          id: "tp1",
          createdAt: lastMonth,
          phases: [
            { id: "ph1", name: "Phase 1: Prevention", procedures: [{ code: "D1110", description: "Prophylaxis - adult", estimatedFee: 125 }], notes: "Every 6 months" },
          ],
          status: "In progress",
          acceptedAt: lastMonth,
          presentedBy: "Dr. Sarah Chen",
        },
      ],
      perioExams: [
        {
          id: "pe1",
          examDate: lastMonth,
          teeth: [
            { tooth: 3, pd: [2, 2, 2, 2, 2, 2], bleeding: [false, false, false, false, false, false] },
            { tooth: 2, pd: [2, 3, 2, 2, 2, 2], bleeding: [false, true, false, false, false, false] },
            { tooth: 1, pd: [2, 2, 2, 2, 2, 2], bleeding: [false, false, false, false, false, false] },
          ],
          notes: "Overall healthy. Slight bleeding at #2 B.",
        },
      ],
      gumGaugeExams: [
        {
          id: "gg1",
          scanDate: lastMonth,
          teeth: [
            { tooth: 8, density: 280, lightPenetrationPercent: 73, healthResult: densityToHealthResult(280) },
            { tooth: 7, density: 310, lightPenetrationPercent: 70, healthResult: densityToHealthResult(310) },
            { tooth: 6, density: 290, lightPenetrationPercent: 72, healthResult: densityToHealthResult(290) },
          ],
          notes: "Baseline GumGauge scan. Results within normal range.",
        },
      ],
      toothConditions: [
        { id: "tc1", tooth: 3, surface: "O", condition: "Existing Restoration", status: "Completed", completedAt: addDays(lastMonth, -730), note: "Composite", addedAt: `${addDays(lastMonth, -730)}T00:00:00` },
      ],
        documents: [
        { id: "doc1", type: "Consent", title: "Treatment consent - prophylaxis", date: lastMonth, addedAt: `${lastMonth}T08:30:00` },
        { id: "doc2", type: "Insurance", title: "Insurance card on file", date: lastMonth, addedAt: `${lastMonth}T08:30:00` },
      ],
      lastRecallReminderSent: addDays(today, -150),
      lastAppointmentReminderSent: addDays(today, -2),
      createdAt: `${addDays(today, -400)}T00:00:00`,
      updatedAt: now,
    },
    {
      id: DEMO_PATIENT_IDS[1],
      firstName: "James",
      lastName: "Wilson",
      dateOfBirth: "1972-08-22",
      phone: "(512) 555-0202",
      email: "j.wilson@email.com",
      address: "8900 Research Blvd, Austin, TX 78758",
      allergies: "No known allergies",
      medicalConditions: "Diabetes (Type 2)",
      currentMedications: "Metformin 500mg twice daily",
      emergencyContactName: "Linda Wilson",
      emergencyContactPhone: "(512) 555-0203",
      insuranceProvider: "Humana",
      insurancePlan: "PPO",
      insuranceMemberId: "HUM-4412-8891",
      insuranceGroupNumber: "GRP-1122",
      insuranceDeductibleAnnual: 250,
      insuranceDeductibleRemaining: 100,
      dateOfAppointment: today,
      dateOfNextAppointment: twoWeeks,
      appointmentTime: "10:15",
      nextAppointmentTime: "14:00",
      appointmentType: "Filling",
      appointmentDoctor: "Dr. Michael Torres",
      chiefComplaint: "Sensitivity on upper left molar",
      treatmentPlan: "D2392 resin 2 surfaces tooth #14. Possible crown if decay deeper.",
      lastCleaningDate: lastWeek,
      dentistNotes: "Moderate caries on #14 MO. Patient prefers composite. Schedule 45 min.",
      appointmentDurationMinutes: 45,
      nextAppointmentDurationMinutes: 60,
      appointmentRoom: "Op 3",
      nextAppointmentRoom: "Op 3",
      appointmentStatus: "Scheduled",
      recallIntervalMonths: 6,
      visitHistory: [
        { startedAt: `${lastWeek}T10:00:00`, endedAt: `${lastWeek}T10:40:00`, durationMinutes: 40, clinicalSummary: "Exam and cleaning. Caries noted #14.", voiceNotesConsent: false },
      ],
      clinicalNotes: [
        { id: "cn1", date: lastWeek, content: "D0150 comprehensive exam. Caries #14 MO. Treatment plan presented and accepted. D2392 scheduled.", author: "Dr. Michael Torres", createdAt: `${lastWeek}T11:00:00` },
      ],
      balanceDue: 85,
      paymentHistory: [
        { id: "ph1", date: lastWeek, amount: 150, note: "Comprehensive exam", amountOutOfPocket: 50, amountWithInsurance: 100 },
      ],
      paymentMethods: [
        { id: "pm1", type: "Card", lastFour: "5555", cardBrand: "Mastercard", nameOnCard: "James Wilson", expiryMonth: 6, expiryYear: 2026, addedAt: `${lastWeek}T09:00:00` },
      ],
      invoiceLines: [
        { id: "inv1", appointmentDate: lastWeek, procedureCode: "D0150", description: "Comprehensive oral evaluation", amount: 150, amountWithInsurance: 100, amountOutOfPocket: 50, status: "Paid", addedAt: `${lastWeek}T10:00:00` },
        { id: "inv2", appointmentDate: today, procedureCode: "D2392", description: "Resin - 2 surfaces, posterior", amount: 225, amountWithInsurance: 140, amountOutOfPocket: 85, status: "Pending", addedAt: now },
      ],
      prescriptions: [],
      treatmentPlans: [
        {
          id: "tp1",
          createdAt: lastWeek,
          phases: [
            { id: "ph1", name: "Phase 1: Restorative", procedures: [{ code: "D2392", description: "Resin - 2 surfaces, posterior (#14)", estimatedFee: 225 }], notes: "MO composite" },
          ],
          status: "Accepted",
          acceptedAt: lastWeek,
          presentedBy: "Dr. Michael Torres",
        },
      ],
      perioExams: [],
      gumGaugeExams: [],
      toothConditions: [
        { id: "tc1", tooth: 14, surface: "MO", condition: "Caries", status: "Planned", note: "D2392 scheduled", addedAt: `${lastWeek}T00:00:00` },
      ],
      documents: [{ id: "doc1", type: "Consent", title: "Treatment consent", date: lastWeek, addedAt: `${lastWeek}T09:30:00` }],
      lastAppointmentReminderSent: addDays(today, -1),
      createdAt: `${addDays(today, -200)}T00:00:00`,
      updatedAt: now,
    },
    {
      id: DEMO_PATIENT_IDS[2],
      firstName: "Yuki",
      lastName: "Tanaka",
      dateOfBirth: "1991-11-05",
      phone: "(512) 555-0303",
      email: "yuki.tanaka@email.com",
      address: "2200 Guadalupe St, Austin, TX 78705",
      allergies: "Latex",
      medicalConditions: "None",
      currentMedications: "None",
      emergencyContactName: "Ken Tanaka",
      emergencyContactPhone: "(512) 555-0304",
      insuranceProvider: "Cigna",
      insurancePlan: "DPPO",
      insuranceMemberId: "CIG-2298-7741",
      insuranceGroupNumber: "DENT-4455",
      dateOfAppointment: today,
      dateOfNextAppointment: nextWeek,
      appointmentTime: "14:00",
      nextAppointmentTime: "09:00",
      appointmentType: "GumGauge Scan",
      appointmentDoctor: "Dr. Sarah Chen",
      chiefComplaint: "Wants to track gum health over time",
      treatmentPlan: "Baseline GumGauge scan. Follow-up in 6 months.",
      dentistNotes: "New patient. No latex products. Schedule in non-latex operatory.",
      appointmentDurationMinutes: 30,
      nextAppointmentDurationMinutes: 30,
      appointmentRoom: "Op 2",
      nextAppointmentRoom: "Op 2",
      appointmentStatus: "Checked In",
      recallIntervalMonths: 6,
      visitHistory: [],
      clinicalNotes: [],
      balanceDue: 0,
      paymentHistory: [],
      paymentMethods: [],
      invoiceLines: [],
      prescriptions: [],
      treatmentPlans: [],
      perioExams: [],
      gumGaugeExams: [],
      toothConditions: [],
      documents: [],
      createdAt: `${addDays(today, -30)}T00:00:00`,
      updatedAt: now,
    },
    {
      id: DEMO_PATIENT_IDS[3],
      firstName: "Robert",
      lastName: "Johnson",
      dateOfBirth: "1958-01-30",
      phone: "(512) 555-0404",
      email: "r.johnson@email.com",
      address: "5000 Burnet Rd, Austin, TX 78756",
      allergies: "Sulfa drugs",
      medicalConditions: "Hypertension, Blood thinners (anticoagulants)",
      currentMedications: "Amlodipine 5mg, Warfarin 5mg daily",
      asaStatus: "III",
      premedRequired: true,
      premedNote: "Medical clearance obtained for anticoagulation; use local hemostasis.",
      premedLastGivenDate: lastWeek,
      emergencyContactName: "Susan Johnson",
      emergencyContactPhone: "(512) 555-0405",
      insuranceProvider: "UnitedHealthcare",
      insurancePlan: "Medicare",
      insuranceMemberId: "UHC-MCR-9921",
      insuranceGroupNumber: "MCR-001",
      dateOfAppointment: tomorrow,
      dateOfNextAppointment: addDays(today, 21),
      appointmentTime: "08:30",
      nextAppointmentTime: "11:00",
      appointmentType: "Root canal",
      appointmentDoctor: "Dr. Michael Torres",
      chiefComplaint: "Severe pain upper right back tooth",
      treatmentPlan: "D3330 endodontic therapy tooth #3. Crown to follow.",
      lastCleaningDate: lastMonth,
      dentistNotes: "Medical clearance for anticoagulants obtained. Use local hemostasis. No sulfa abx.",
      appointmentDurationMinutes: 90,
      nextAppointmentDurationMinutes: 60,
      appointmentRoom: "Op 3",
      nextAppointmentRoom: "Op 3",
      appointmentStatus: "Scheduled",
      recallIntervalMonths: 6,
      visitHistory: [
        { startedAt: `${lastWeek}T15:00:00`, endedAt: `${lastWeek}T15:45:00`, durationMinutes: 45, clinicalSummary: "Emergency exam. Diagnosis: necrotic pulp #3. RCT recommended.", voiceNotesConsent: false },
      ],
      clinicalNotes: [
        { id: "cn1", date: lastWeek, content: "Emergency visit. Pulp test #3 negative. Radiograph shows periapical radiolucency. D3330 and D2740 treatment plan accepted.", author: "Dr. Michael Torres", createdAt: `${lastWeek}T16:00:00` },
      ],
      balanceDue: 450,
      paymentHistory: [
        { id: "ph1", date: lastWeek, amount: 150, note: "Emergency exam", amountOutOfPocket: 150 },
      ],
      paymentMethods: [
        { id: "pm1", type: "Card", lastFour: "1234", cardBrand: "Visa", nameOnCard: "Robert Johnson", expiryMonth: 3, expiryYear: 2028, addedAt: `${lastWeek}T14:30:00` },
      ],
      invoiceLines: [
        { id: "inv1", appointmentDate: lastWeek, procedureCode: "D0150", description: "Comprehensive oral evaluation (emergency)", amount: 150, status: "Paid", addedAt: `${lastWeek}T15:00:00` },
        { id: "inv2", appointmentDate: tomorrow, procedureCode: "D3330", description: "Endodontic therapy - molar (#3)", amount: 1295, amountWithInsurance: 845, amountOutOfPocket: 450, status: "Pending", addedAt: now },
      ],
      insuranceClaims: [
        { id: "cl1", date: tomorrow, procedureCodes: ["D3330"], description: "Root canal #3", amount: 1295, status: "Draft", note: "To send after RCT" },
      ],
      prescriptions: [
        { id: "rx1", date: lastWeek, medication: "Amoxicillin", strength: "500mg capsule", sig: "Take 1 capsule by mouth three times daily for 7 days (no sulfa)", quantity: 21, refills: 0, prescriberName: "Dr. Michael Torres", prescriberCredentials: "DDS", signedAt: `${lastWeek}T16:30:00` },
      ],
      treatmentPlans: [
        {
          id: "tp1",
          createdAt: lastWeek,
          phases: [
            { id: "ph1", name: "Phase 1: Endodontic", procedures: [{ code: "D3330", description: "Endodontic therapy - molar (#3)", estimatedFee: 1295 }] },
            { id: "ph2", name: "Phase 2: Restorative", procedures: [{ code: "D2740", description: "Crown - porcelain/ceramic (#3)", estimatedFee: 1295 }], notes: "After RCT healing" },
          ],
          status: "Accepted",
          acceptedAt: lastWeek,
          presentedBy: "Dr. Michael Torres",
        },
      ],
      perioExams: [],
      gumGaugeExams: [],
      toothConditions: [
        { id: "tc1", tooth: 3, condition: "Root Canal", status: "Planned", note: "D3330 scheduled", addedAt: `${lastWeek}T00:00:00` },
      ],
      documents: [
          { id: "doc1", type: "Referral", title: "Medical clearance - anticoagulation", date: lastWeek, note: "Cleared for RCT", addedAt: `${lastWeek}T14:00:00` },
        ],
      referrals: [
        { id: "ref1", referredTo: "Cardiology Associates", reason: "Medical clearance for anticoagulation prior to RCT", date: lastWeek, status: "Completed", responseNote: "Cleared for RCT", addedAt: `${lastWeek}T14:00:00` },
      ],
      labCases: [
        { id: "lab1", labName: "Premier Dental Lab", caseType: "Crown", sentDate: tomorrow, expectedDate: addDays(today, 14), status: "Sent", toothOrTeeth: "3", prescriptionNote: "D2740 PFM crown #3 post-RCT", addedAt: now },
      ],
      lastAppointmentReminderSent: addDays(today, -1),
      createdAt: `${addDays(today, -500)}T00:00:00`,
      updatedAt: now,
    },
    {
      id: DEMO_PATIENT_IDS[4],
      firstName: "Emily",
      lastName: "Davis",
      dateOfBirth: "2008-06-14",
      phone: "(512) 555-0505",
      email: "emily.davis.parent@email.com",
      address: "3100 Bee Caves Rd, Austin, TX 78746",
      allergies: "No known allergies",
      medicalConditions: "None",
      currentMedications: "None",
      emergencyContactName: "David Davis",
      emergencyContactPhone: "(512) 555-0506",
      insuranceProvider: "CVS Health (Aetna)",
      insurancePlan: "DHMO",
      insuranceMemberId: "AET-5543-2210",
      insuranceGroupNumber: "CHILD-8899",
      dateOfAppointment: nextWeek,
      dateOfNextAppointment: addDays(today, 90),
      appointmentTime: "15:30",
      nextAppointmentTime: "16:00",
      appointmentType: "Checkup",
      appointmentDoctor: "Dr. Sarah Chen",
      chiefComplaint: "Routine pediatric checkup",
      treatmentPlan: "D0120 periodic eval, D1120 prophy. Sealants if indicated.",
      lastCleaningDate: addDays(today, -180),
      dentistNotes: "Minor. Parent present for visits. Good hygiene per mom.",
      appointmentDurationMinutes: 30,
      nextAppointmentDurationMinutes: 30,
      appointmentRoom: "Op 1",
      nextAppointmentRoom: "Op 1",
      recallIntervalMonths: 6,
      visitHistory: [
        { startedAt: `${addDays(today, -180)}T16:00:00`, endedAt: `${addDays(today, -180)}T16:35:00`, durationMinutes: 35, clinicalSummary: "Child prophy and exam. No caries.", voiceNotesConsent: false },
      ],
      clinicalNotes: [
        { id: "cn1", date: addDays(today, -180), content: "D1120 prophy, D0120 exam. All clear. Next recall in 6 months.", author: "Dr. Sarah Chen", createdAt: `${addDays(today, -180)}T17:00:00` },
      ],
      balanceDue: 0,
      paymentHistory: [
        { id: "ph1", date: addDays(today, -180), amount: 95, note: "Child prophy", amountWithInsurance: 95, amountOutOfPocket: 0 },
      ],
      paymentMethods: [],
      invoiceLines: [
        { id: "inv1", appointmentDate: addDays(today, -180), procedureCode: "D1120", description: "Prophylaxis - child", amount: 95, amountWithInsurance: 95, amountOutOfPocket: 0, status: "Paid", addedAt: `${addDays(today, -180)}T16:00:00` },
      ],
      prescriptions: [],
      treatmentPlans: [],
      perioExams: [],
      gumGaugeExams: [],
      toothConditions: [],
      documents: [],
      lastRecallReminderSent: addDays(today, -30),
      createdAt: `${addDays(today, -400)}T00:00:00`,
      updatedAt: now,
    },
    {
      id: DEMO_PATIENT_IDS[5],
      firstName: "Patricia",
      lastName: "Martinez",
      dateOfBirth: "1965-09-28",
      phone: "(512) 555-0606",
      email: "p.martinez@email.com",
      address: "6500 N Lamar Blvd, Austin, TX 78752",
      allergies: "Penicillin, Codeine",
      medicalConditions: "Diabetes, Osteoporosis",
      currentMedications: "Metformin, Alendronate weekly",
      emergencyContactName: "Jose Martinez",
      emergencyContactPhone: "(512) 555-0607",
      insuranceProvider: "Blue Cross Blue Shield of Michigan",
      insurancePlan: "PPO",
      insuranceMemberId: "BCBS-7721-3344",
      insuranceGroupNumber: "BC-9988",
      insuranceDeductibleAnnual: 500,
      insuranceDeductibleRemaining: 500,
      dateOfAppointment: twoWeeks,
      dateOfNextAppointment: addDays(today, 98),
      appointmentTime: "11:00",
      nextAppointmentTime: "10:00",
      appointmentType: "New patient",
      appointmentDoctor: "Dr. Michael Torres",
      chiefComplaint: "First visit to practice, need full exam",
      treatmentPlan: "D0150 comprehensive exam, full series X-rays. Treatment plan to follow.",
      dentistNotes: "New patient. Medical hx significant—avoid penicillin/codeine. Pre-med not required per AHA.",
      appointmentDurationMinutes: 60,
      nextAppointmentDurationMinutes: 45,
      appointmentRoom: "Op 2",
      nextAppointmentRoom: "Op 2",
      recallIntervalMonths: 6,
      visitHistory: [],
      clinicalNotes: [],
      balanceDue: 0,
      paymentHistory: [],
      paymentMethods: [],
      invoiceLines: [],
      prescriptions: [],
      treatmentPlans: [],
      perioExams: [],
      gumGaugeExams: [],
      toothConditions: [],
      documents: [],
      createdAt: `${addDays(today, -14)}T00:00:00`,
      updatedAt: now,
    },
    {
      id: DEMO_PATIENT_IDS[6],
      firstName: "David",
      lastName: "Kim",
      dateOfBirth: "1982-04-17",
      phone: "(512) 555-0707",
      email: "david.kim@email.com",
      address: "9828 Great Hills Trail, Austin, TX 78759",
      allergies: "No known allergies",
      medicalConditions: "Anxiety / depression",
      currentMedications: "Sertraline 50mg daily",
      emergencyContactName: "Sarah Kim",
      emergencyContactPhone: "(512) 555-0708",
      insuranceProvider: "Kaiser Permanente",
      insurancePlan: "HMO",
      insuranceMemberId: "KP-2298-8877",
      insuranceGroupNumber: "HMO-4411",
      dateOfAppointment: addDays(today, 3),
      dateOfNextAppointment: addDays(today, 93),
      appointmentTime: "09:00",
      nextAppointmentTime: "14:30",
      appointmentType: "Follow-up",
      appointmentDoctor: "Dr. Sarah Chen",
      chiefComplaint: "Follow-up after extraction",
      treatmentPlan: "Healing check #19. Discuss implant or bridge options.",
      lastCleaningDate: addDays(today, -60),
      dentistNotes: "Extraction #19 completed 2 weeks ago. Patient considering implant. Sedation may be option given anxiety.",
      appointmentDurationMinutes: 30,
      nextAppointmentDurationMinutes: 60,
      appointmentRoom: "Op 1",
      nextAppointmentRoom: "Op 3",
      recallIntervalMonths: 6,
      visitHistory: [
        { startedAt: `${addDays(today, -14)}T09:30:00`, endedAt: `${addDays(today, -14)}T10:15:00`, durationMinutes: 45, clinicalSummary: "D7240 extraction #19. Gauze and post-op instructions given.", voiceNotesConsent: false },
      ],
      clinicalNotes: [
        { id: "cn1", date: addDays(today, -14), content: "Extraction #19. Socket preserved. Rx: ibuprofen, avoid straw. Follow-up in 2 weeks.", author: "Dr. Sarah Chen", createdAt: `${addDays(today, -14)}T10:30:00` },
      ],
      balanceDue: 0,
      paymentHistory: [
        { id: "ph1", date: addDays(today, -14), amount: 195, note: "Extraction", amountOutOfPocket: 50, amountWithInsurance: 145 },
      ],
      paymentMethods: [
        { id: "pm1", type: "Card", lastFour: "8765", cardBrand: "Discover", nameOnCard: "David Kim", expiryMonth: 9, expiryYear: 2027, addedAt: `${addDays(today, -14)}T09:00:00` },
      ],
      invoiceLines: [
        { id: "inv1", appointmentDate: addDays(today, -14), procedureCode: "D7240", description: "Extraction - erupted tooth (#19)", amount: 195, amountWithInsurance: 145, amountOutOfPocket: 50, status: "Paid", addedAt: `${addDays(today, -14)}T09:30:00` },
      ],
      prescriptions: [
        { id: "rx1", date: addDays(today, -14), medication: "Ibuprofen", strength: "400mg tablet", sig: "Take 1 tablet by mouth every 6 hours as needed for pain", quantity: 20, refills: 0, prescriberName: "Dr. Sarah Chen", prescriberCredentials: "DDS", signedAt: `${addDays(today, -14)}T10:15:00` },
      ],
      treatmentPlans: [
        {
          id: "tp1",
          createdAt: addDays(today, -14),
          phases: [
            { id: "ph1", name: "Phase 1: Extraction", procedures: [{ code: "D7240", description: "Extraction #19", estimatedFee: 195 }], notes: "Completed" },
            { id: "ph2", name: "Phase 2: Replacement", procedures: [{ code: "Implant", description: "Implant #19", estimatedFee: 3500 }, { code: "D6057", description: "Implant crown", estimatedFee: 1295 }], notes: "To discuss at follow-up" },
          ],
          status: "In progress",
          acceptedAt: addDays(today, -14),
          presentedBy: "Dr. Sarah Chen",
        },
      ],
      perioExams: [],
      gumGaugeExams: [],
      toothConditions: [
        { id: "tc1", tooth: 19, condition: "Extraction", status: "Completed", completedAt: addDays(today, -14).toString(), note: "Healing", addedAt: `${addDays(today, -14)}T00:00:00` },
      ],
      documents: [{ id: "doc1", type: "Consent", title: "Extraction consent", date: addDays(today, -14), addedAt: `${addDays(today, -14)}T09:00:00` }],
      lastAppointmentReminderSent: addDays(today, -2),
      createdAt: `${addDays(today, -300)}T00:00:00`,
      updatedAt: now,
    },
    {
      id: DEMO_PATIENT_IDS[7],
      firstName: "Lisa",
      lastName: "Nguyen",
      dateOfBirth: "1995-12-03",
      phone: "(512) 555-0808",
      email: "lisa.nguyen@email.com",
      address: "4477 S Lamar Blvd, Austin, TX 78745",
      allergies: "Latex",
      medicalConditions: "None",
      currentMedications: "None",
      emergencyContactName: "Tom Nguyen",
      emergencyContactPhone: "(512) 555-0809",
      insuranceProvider: "UnitedHealthcare",
      insurancePlan: "PPO",
      insuranceMemberId: "UHC-3344-5566",
      insuranceGroupNumber: "GP-2233",
      dateOfAppointment: addDays(today, 5),
      dateOfNextAppointment: addDays(today, 185),
      appointmentTime: "13:00",
      nextAppointmentTime: "09:00",
      appointmentType: "Whitening",
      appointmentDoctor: "Dr. Sarah Chen",
      chiefComplaint: "In-office whitening",
      treatmentPlan: "In-office whitening (full arch). Take-home trays for maintenance.",
      dentistNotes: "No latex. Patient has had cleaning within 6 months. Good candidate for whitening.",
      appointmentDurationMinutes: 90,
      nextAppointmentDurationMinutes: 30,
      appointmentRoom: "Op 2",
      nextAppointmentRoom: "Op 2",
      recallIntervalMonths: 6,
      visitHistory: [],
      clinicalNotes: [],
      balanceDue: 0,
      paymentHistory: [],
      paymentMethods: [],
      invoiceLines: [],
      prescriptions: [],
      treatmentPlans: [
        {
          id: "tp1",
          createdAt: addDays(today, -7),
          phases: [
            { id: "ph1", name: "Whitening", procedures: [{ description: "In-office whitening", estimatedFee: 450 }, { description: "Take-home trays", estimatedFee: 250 }], notes: "Optional take-home" },
          ],
          status: "Accepted",
          acceptedAt: addDays(today, -7),
          presentedBy: "Dr. Sarah Chen",
        },
      ],
      perioExams: [],
      gumGaugeExams: [],
      toothConditions: [],
      documents: [],
      createdAt: `${addDays(today, -60)}T00:00:00`,
      updatedAt: now,
    },
  ];

  return patients;
}

export function getDemoStaff(): Staff[] {
  const now = new Date().toISOString();
  const hireBase = "2020-06-01";
  return [
    {
      id: DEMO_STAFF_IDS.dentist1,
      firstName: "Sarah",
      lastName: "Chen",
      position: "Dentist",
      email: "sarah.chen@sunsetdental.demo",
      phone: "(512) 555-0143",
      loginEmail: "dr.chen@demo",
      password: "demo",
      hireDate: hireBase,
      status: "Active",
      licenseNumber: "TX-12345",
      licenseExpiry: "2026-12-31",
      emergencyContactName: "James Chen",
      emergencyContactPhone: "(512) 555-0199",
      notes: "Lead dentist. General and preventive.",
      assignedPatientIds: [DEMO_PATIENT_IDS[0], DEMO_PATIENT_IDS[2], DEMO_PATIENT_IDS[4], DEMO_PATIENT_IDS[6], DEMO_PATIENT_IDS[7]],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_STAFF_IDS.dentist2,
      firstName: "Michael",
      lastName: "Torres",
      position: "Dentist",
      email: "michael.torres@sunsetdental.demo",
      phone: "(512) 555-0144",
      loginEmail: "dr.torres@demo",
      password: "demo",
      hireDate: "2021-03-15",
      status: "Active",
      licenseNumber: "TX-22345",
      licenseExpiry: "2027-06-30",
      emergencyContactName: "Maria Torres",
      emergencyContactPhone: "(512) 555-0198",
      notes: "Restorative and endo.",
      assignedPatientIds: [DEMO_PATIENT_IDS[1], DEMO_PATIENT_IDS[3], DEMO_PATIENT_IDS[5]],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_STAFF_IDS.hygienist,
      firstName: "Jennifer",
      lastName: "Walsh",
      position: "Dental Hygienist",
      email: "jennifer.walsh@sunsetdental.demo",
      phone: "(512) 555-0145",
      hireDate: "2019-08-01",
      status: "Active",
      emergencyContactName: "Tom Walsh",
      emergencyContactPhone: "(512) 555-0197",
      notes: "Full-time hygienist.",
      assignedPatientIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_STAFF_IDS.receptionist,
      firstName: "Amy",
      lastName: "Rivera",
      position: "Front Desk / Receptionist",
      email: "amy.rivera@sunsetdental.demo",
      phone: "(512) 555-0146",
      hireDate: "2022-01-10",
      status: "Active",
      emergencyContactName: "Carlos Rivera",
      emergencyContactPhone: "(512) 555-0196",
      notes: "Scheduling and check-in.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DEMO_STAFF_IDS.assistant,
      firstName: "David",
      lastName: "Park",
      position: "Dental Assistant",
      email: "david.park@sunsetdental.demo",
      phone: "(512) 555-0147",
      hireDate: "2023-02-20",
      status: "Active",
      emergencyContactName: "Grace Park",
      emergencyContactPhone: "(512) 555-0195",
      notes: "Chairside assistant.",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function getDemoAuditEntries(): AuditEntry[] {
  const base = new Date();
  const entries: AuditEntry[] = [];
  const add = (daysAgo: number, action: string, entityType: string, entityId: string, details?: string, actor?: string) => {
    const d = new Date(base);
    d.setDate(d.getDate() - daysAgo);
    entries.push({
      id: `demo-audit-${entries.length + 1}`,
      timestamp: d.toISOString(),
      actor: actor ?? "Dr. Sarah Chen",
      action,
      entityType,
      entityId,
      details,
    });
  };
  add(0, "chart.view", "patient", DEMO_PATIENT_IDS[0], "Maria Santos");
  add(0, "chart.view", "patient", DEMO_PATIENT_IDS[1], "James Wilson");
  add(1, "patient.update", "patient", DEMO_PATIENT_IDS[1], "Appointment rescheduled");
  add(1, "patient.update", "patient", DEMO_PATIENT_IDS[3], "Treatment plan accepted");
  add(2, "chart.view", "patient", DEMO_PATIENT_IDS[3], "Robert Johnson");
  add(2, "patient.update", "patient", DEMO_PATIENT_IDS[2], "Yuki Tanaka");
  add(3, "patient.create", "patient", DEMO_PATIENT_IDS[2], "Yuki Tanaka");
  add(3, "chart.view", "patient", DEMO_PATIENT_IDS[6], "David Kim");
  add(4, "patient.update", "patient", DEMO_PATIENT_IDS[6], "Payment recorded");
  add(4, "staff.update", "staff", DEMO_STAFF_IDS.dentist1);
  add(5, "chart.view", "patient", DEMO_PATIENT_IDS[4], "Emily Davis");
  add(5, "patient.update", "patient", DEMO_PATIENT_IDS[0], "Clinical note added");
  add(6, "chart.view", "patient", DEMO_PATIENT_IDS[7], "Lisa Nguyen");
  add(6, "patient.update", "patient", DEMO_PATIENT_IDS[5], "New patient intake");
  add(7, "staff.create", "staff", DEMO_STAFF_IDS.assistant, "David Park");
  add(7, "chart.view", "patient", DEMO_PATIENT_IDS[1], "James Wilson");
  add(8, "patient.update", "patient", DEMO_PATIENT_IDS[3], "Prescription signed");
  add(8, "chart.view", "patient", DEMO_PATIENT_IDS[0], "Maria Santos");
  add(9, "patient.update", "patient", DEMO_PATIENT_IDS[0], "Visit ended");
  add(10, "chart.view", "patient", DEMO_PATIENT_IDS[4], "Emily Davis");
  add(10, "patient.update", "patient", DEMO_PATIENT_IDS[4], "Recall reminder sent");
  return entries;
}
