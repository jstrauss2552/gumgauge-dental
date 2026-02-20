# GumGauge Dental — Gap Analysis & Improvement Roadmap

**Audience:** Dental professionals across all clinic roles  
**Purpose:** Identify what is missing from a real-world dental practice perspective, with data and workflow improvements specified **before** implementation.

---

## 1. Executive Summary

GumGauge Dental is a **patient-centric practice management app** with:

- **Strengths:** Patient charts (demographics, medical alerts, insurance, documents), perio charting, GumGauge scan integration, restorative tooth chart, clinical notes (with templates), formal treatment plans, prescriptions, billing (charges, payments, insurance claims, card on file), recall report, visit flow (Start visit / End visit), staff roles/permissions, audit log, timezone support, and a clear Device Scan workflow.
- **Data model:** Patients own a single “current” and “next” appointment (no first-class **Appointment** entity). All persistence is **localStorage** (no server, no multi-device sync, no backup/restore).
- **Roles modeled:** Dentist, Pediatric Dentist, Hygienist, Assistant, Front Desk, Billing, Office Manager, specialists (Ortho, Endo, Perio, OS), Sterilization Tech, Lab Tech — with permissions for clinical/financial/reports/delete/manage.

From a **dental professional’s view across all roles**, the following gaps and improvements are organized by domain and by data changes needed first.

---

## 2. Gaps by Clinic Role

### 2.1 Front Desk / Receptionist / Patient Coordinator

| Gap | Current State | What’s Missing (Data & UX) |
|-----|----------------|----------------------------|
| **True scheduling** | One “current” and one “next” appointment per patient; no slots. | **First-class `Appointment` entity:** `id`, `patientId`, `providerId` (staff), `operatoryId`, `start`/`end` (datetime), `type`, `status`, `createdBy`, `notes`. Need **operatory** and **provider availability** to prevent double-booking and show a real schedule grid. |
| **Conflict detection** | Moving “next” to “current” is manual; no check for same time/room. | Data: link appointments to **operatory** and **provider**; validate no overlapping appointments for same operatory or same provider in same time range. |
| **Check-in / status** | `appointmentStatus` on patient (Scheduled → Checked In → In Chair → …). | Keep status on the **appointment** (or derived from appointment + visit). Add **checkedInAt** (timestamp) for wait-time and reporting. |
| **Multiple appointments per day** | Not supported (one date/time per patient for “today”). | Data: one patient can have multiple `Appointment` records on the same day (e.g. hygiene + doctor). |
| **Appointment reminders** | `lastAppointmentReminderSent` exists; no sending. | Data: add `reminderSentAt` per appointment (or keep per-patient for backward compat). Backend/integration needed for SMS/email; app can track “last sent” and “next due”. |
| **Recall reminders** | `lastRecallReminderSent` on patient; Recall report shows “due”. | Same: need reminder tracking per recall “event” if you add outbound campaigns; otherwise current data is enough for a list. |
| **New patient intake** | PatientNew has demographics, medical, insurance, first appointment. | Optional: **intake form version** or **questionnaire steps** (e.g. HIPAA acknowledgment, consent to treat) stored as dated documents or structured answers. |
| **Preferred contact** | Phone/email on patient. | Add **preferredContactMethod**: `"Phone" \| "Email" \| "SMS" \| "Any"` and **preferredContactTime** (e.g. morning/afternoon) for recall/reminders. |

### 2.2 Dental Hygienist

| Gap | Current State | What’s Missing (Data & UX) |
|-----|----------------|----------------------------|
| **Perio charting** | Full 6-site per-tooth (PD, B, suppuration, GM, CAL, furcation, mobility). | Data is solid. Optional: **recession** (mm) per site; **plaque index** (e.g. 0–3) per tooth/site for hygiene-focused tracking. |
| **Prophy vs perio** | Appointment type “Cleaning”; perio exams separate. | Optional: **appointment or visit type** tied to hygiene (e.g. “Adult prophy”, “SRP”, “Perio maintenance”) for production by type. |
| **Hygienist-specific notes** | Clinical notes are generic. | Optional: **clinicalNoteEntry.role** or **templateId** that implies “hygienist note” for filtering; or a dedicated **hygieneNotes** text per visit. |
| **Production by provider** | Analytics are clinic-wide. | Data: **invoice lines / production** linked to **provider (staffId)** so hygienist production (e.g. D1110, D4341) can be reported. Same for dentist. |
| **My patients** | Hygienist has “My patients” if in `STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS`. | Already supported; ensure assignment is used in Appointments/Recall when filtering “my column”. |

### 2.3 Dentist / Specialist (General, Pediatric, Ortho, Endo, Perio, OS)

| Gap | Current State | What’s Missing (Data & UX) |
|-----|----------------|----------------------------|
| **Exam / diagnosis by tooth** | Tooth conditions (caries, restoration, missing, etc.); perio and GumGauge by tooth. | Optional: **diagnosis codes** (e.g. ICD/SNOMED or internal) per tooth or per quadrant for standard reporting. |
| **Treatment tied to visit** | Treatment plans and clinical notes exist; not explicitly “completed at this visit”. | Data: **visit-scoped procedures**: when “End visit” is used, optionally record which **procedures were completed** (CDT + tooth) in that visit for accurate production and charting. |
| **Pre-medication / ASA** | Medical conditions and medications are free text. | Add **ASA physical status** (I–V) and **pre-medication required** (e.g. antibiotic prophylaxis) with **last pre-med date** or “cleared by physician” note. Important for perio/endo/surgery. |
| **Consent** | Documents with type “Consent”; no structured consent. | Optional: **Consent** entity: `procedureOrTreatment`, `date`, `signedBy` (patient/guardian), `witnessStaffId`, `documentId` (link to PatientDocument). |
| **Referrals** | Document type “Referral”; no outbound referral tracking. | Data: **Referral** (outbound): `referredTo` (name/specialty), `reason`, `date`, `status` (Sent / Accepted / Completed), `responseNote`. Link to patient and optionally to appointment. |
| **Lab work** | Document type “Lab”; no case tracking. | Data: **Lab case**: `labName`, `caseType` (crown, bridge, denture, etc.), `sentDate`, `expectedDate`, `receivedDate`, `status`, `prescriptionNote`, `tooth/teeth`. |
| **Prescriptions** | Full sig, quantity, refills, prescriber, DEA. | Data is good. Optional: **e-prescribe** integration (backend); **controlled substance log** (quantity dispensed, refills used) for DEA compliance. |
| **Clinical note author** | `author` on clinical note (string). | Prefer **authorStaffId** (link to Staff) for audit and “my notes” filter; keep `author` as display name. |
| **GumGauge integration** | Scan → readings per tooth → save to chart; 3D/2D view. | Data and UX are strong. Optional: **comparison of two scan dates** side-by-side in one view. |

### 2.4 Dental Assistant

| Gap | Current State | What’s Missing (Data & UX) |
|-----|----------------|----------------------------|
| **Sterilization / room** | Appointment has `appointmentRoom` (string). | Data: **Operatory** entity: `id`, `name`, `defaultDurationMinutes`, optional **instrument set / turnover** tracking (if you ever add sterilization module). For now, room name is enough. |
| **Chairside checklist** | None. | Optional: **visit checklist** (e.g. “X-rays taken”, “Consent signed”, “Pre-med given”) as a simple list per visit, stored with visit or appointment. |
| **Provider assignment** | Appointment has `appointmentDoctor` (string). | When you add first-class Appointment, use **providerId** (staff) so assistant can see “Dr. X’s column” and operatory. |

### 2.5 Billing / Insurance Coordinator

| Gap | Current State | What’s Missing (Data & UX) |
|-----|----------------|----------------------------|
| **Secondary insurance** | Single insurance per patient. | Data: **secondary insurance** (same fields as primary: provider, plan, memberId, groupNumber, deductible). Billing UI: apply primary then secondary to invoice lines. |
| **EOB / ERA** | Insurance claims have status (Draft/Sent/Paid/Denied). | Data: **EOB (Explanation of Benefits)** or **ERA (835)** import: link to claim, paid amount, allowed amount, adjustment, patient responsibility. Enables accurate **insurance receivable** and appeal workflow. |
| **Eligibility** | “Eligibility” modal is placeholder. | Real eligibility requires payer API or clearinghouse; store **lastEligibilityCheckDate** and **eligibilityResult** (JSON or summary) on patient for display. |
| **Fee schedule** | CDT codes have default fees; overrides per charge. | Data: **Fee schedule** per insurance (or per plan): `insuranceId`/plan, `procedureCode`, `fee`. Fallback to default fee. |
| **Patient statement** | Balance due and payment history shown. | **Statement**: list of unpaid invoice lines + payments in period; printable PDF. Data you have is sufficient; add statement date range and “Statement generated at” for audit. |
| **Write-off / adjustment** | No explicit write-off. | Data: **PaymentHistoryEntry** or new **Adjustment** type: `type: "Write-off" \| "Adjustment"`, `amount`, `reason`, `date`. Reduces balance without “payment”. |
| **Production by provider/date** | Analytics: production today/month, total outstanding. | Data: **invoice line** (or completed procedure) linked to **providerId**; report production by provider and by date range. |
| **Aging report** | Total outstanding only. | Data: invoice lines have `appointmentDate` and `status`. Add **aging buckets** (0–30, 31–60, 61–90, 90+) in reporting. |

### 2.6 Office Manager / Practice Manager

| Gap | Current State | What’s Missing (Data & UX) |
|-----|----------------|----------------------------|
| **Multi-location** | One clinic per device (localStorage). | Data: **Clinic** already has id/name/address; add **locations** (multi) or keep one clinic per browser. For multi-site: **Location** entity and assign staff/operatories to location. |
| **Operatory utilization** | Room is a string on appointment. | When Appointment + Operatory exist: report **operatory utilization** (hours used / hours available) by day/week. |
| **Staff schedule** | No staff-level schedule. | Data: **StaffSchedule** or **availability**: staffId, dayOfWeek, startTime, endTime, effectiveFrom/To. Used to prevent booking when provider is out. |
| **No-show / broken** | `AppointmentStatus` includes No-Show, Broken. | Data: store **noShowCount** or **brokenAppointmentCount** on patient for recall and front-desk alerts; optional **noShowReason** on appointment. |
| **Case acceptance** | Analytics: treatment plan accepted vs presented %. | Already in place; optional: **presentedByStaffId** and **acceptedAt** for per-dentist case acceptance. |
| **Audit / compliance** | Audit log with action, entity, actor, timestamp. | Strengthen: **audit actor** = staffId when signed in; **sensitive actions** (e.g. delete patient, view financials) always logged. **Session timeout** and **auto-logout** for HIPAA. |
| **Backup / export** | localStorage only. | **Export all data** (JSON) for backup; **import** to restore or migrate. No server required for MVP. |

### 2.7 Sterilization Technician / Dental Lab Technician

| Gap | Current State | What’s Missing (Data & UX) |
|-----|----------------|----------------------------|
| **Sterilization logs** | None. | Optional: **SterilizationLog**: cycle date/time, operator, autoclave id, load type, result (pass/fail). Separate module; not in current patient chart. |
| **Lab cases** | “Lab” document type only. | As above: **Lab case** entity with sent/expected/received, status, prescription, tooth. Lab tech view: list of outstanding cases by lab or by patient. |

---

## 3. Data Model Changes (Prioritized)

Implement these in order so that features built on top stay consistent.

### 3.1 Tier 1 — Foundation (scheduling and production)

1. **First-class Appointment**
   - `Appointment`: id, patientId, providerId (staff), operatoryId (optional), start (ISO datetime), end (ISO datetime), type, status, notes, createdAt, updatedAt.
   - Keep **patient** fields `dateOfAppointment`, `appointmentTime`, etc. as **derived/cached** from “primary” current/next appointment for backward compatibility, or migrate to “current = appointment where date = today” and “next = soonest future”.
   - **Operatory**: id, name, defaultDurationMinutes (optional).

2. **Production / provider linkage**
   - **InvoiceLine** (or a new **CompletedProcedure**): add `providerId` (staff id) so production by provider and by date is possible.
   - **TreatmentPlanProcedure** when marked “Completed”: optionally record `completedAt` and `providerId` and link to an invoice line.

3. **Conflict checks**
   - On create/update Appointment: same operatory and overlapping start/end → warn or block.
   - Same provider and overlapping start/end → warn or block.

### 3.2 Tier 2 — Clinical and safety

4. **ASA and pre-med**
   - Patient: `asaStatus` (I–V), `premedRequired` (boolean), `premedNote` (e.g. “2g Amoxicillin 1hr prior”), `premedLastGivenDate` (optional).

5. **Visit-scoped procedures**
   - **VisitHistoryEntry** (or new **VisitProcedure**): link visit to list of procedures (CDT + tooth) completed in that visit. Enables “what did we do today” and production by visit.

6. **Consent (structured)**
   - **Consent** (or extend PatientDocument): procedure/treatment, date, signedBy, witnessStaffId, documentId. Optional but improves compliance.

7. **Referral (outbound)**
   - **Referral**: patientId, referredTo, reason, date, status, responseNote. List on chart and in a simple “Referrals” report.

8. **Lab case**
   - **LabCase**: patientId, labName, caseType, sentDate, expectedDate, receivedDate, status, tooth/teeth, prescriptionNote. List “pending lab” on dashboard or dedicated page.

### 3.3 Tier 3 — Billing and insurance

9. **Secondary insurance**
   - Patient: duplicate insurance block (insuranceProvider2, plan2, memberId2, groupNumber2, deductible2, etc.) or **Insurance** sub-entity array (primary/secondary).

10. **Fee schedule**
    - **FeeScheduleEntry**: planId or insuranceName, procedureCode, fee. Override default CDT fee when applying to invoice.

11. **Adjustments / write-offs**
    - **Adjustment** (or PaymentHistoryEntry with type): type Write-off | Adjustment, amount, reason, date, staffId. Subtracts from balance.

12. **EOB/ERA**
    - **ClaimPayment** or **EOB**: claimId, paidAmount, allowedAmount, adjustmentAmount, patientResponsibility, paymentDate. Link to InsuranceClaim.

### 3.4 Tier 4 — Operations and compliance

13. **Staff availability**
    - **StaffAvailability**: staffId, dayOfWeek, startTime, endTime, effectiveFrom, effectiveTo. Used when building appointment slots.

14. **Preferred contact**
    - Patient: preferredContactMethod (Phone | Email | SMS | Any), preferredContactTime (optional).

15. **Audit and session**
    - Audit: store **actorStaffId** when signed-in staff exists; **session timeout** (e.g. 15 min inactivity) and **auto-logout**; optional **sensitive data access** log (e.g. viewing financials).

16. **Export / import**
    - **Export**: all patients, staff, clinic, appointments (when added), audit (optional) as JSON. **Import**: restore from JSON (with overwrite/merge rules and validation).

---

## 4. UX and Workflow Improvements (After Data)

- **Appointments page:** When Appointment entity exists, show a **day/week view** by operatory and by provider; drag-and-drop reschedule; conflict warning on save.
- **Dashboard:** “Pending lab cases” widget; “Referrals awaiting response” if Referral exists.
- **Patient chart:** Tab or section for “ASA & Pre-med”, “Referrals”, “Lab cases”; link documents to consent/referral/lab by id.
- **Billing:** “Secondary insurance” section; “Apply fee schedule” when adding charges; “Write-off” button with reason; “Aging” report (0–30, 31–60, …).
- **Analytics:** Production by provider; production by appointment type; operatory utilization; case acceptance by provider.
- **Recall:** Filter by preferred contact method; show “last reminder sent” per patient; “Mark reminder sent” with date.
- **Security:** Session timeout; require re-auth for sensitive actions (delete patient, export data); optional role-based “mask financials” (show only last 4 of SSN or hide balance for some roles).

---

## 5. What Not to Change (Keep As-Is for Now)

- **GumGauge scan flow and data** (density, health, 3D/2D) — already strong.
- **Perio charting** (6-site, PD, B, GM, CAL, furcation, mobility) — sufficient; optional recession/plaque later.
- **Tooth conditions** (restorative chart) and **ToothChart** component.
- **Clinical notes with templates** and **visit history** structure.
- **Prescription** structure (sig, quantity, refills, prescriber, DEA).
- **Staff positions and permissions** — only extend (e.g. add permission for “view lab” or “manage fee schedule”).

---

## 6. Implementation Order (Recommended)

1. **Phase 1 (Data + minimal UX)**  
   - Add **Appointment** and **Operatory**; migrate “current/next” to derived from appointments or keep dual-write.  
   - Add **providerId** to invoice/procedure completion.  
   - Appointments page: list by date; create/edit one appointment; conflict check (operatory + provider).

2. **Phase 2 (Clinical safety)**  
   - ASA/pre-med on patient; structured **Consent** and **Referral**; **Lab case**.  
   - Chart sections and lists for referrals and lab.

3. **Phase 3 (Billing)**  
   - Secondary insurance; fee schedule; adjustments; EOB storage.  
   - Aging report; production by provider.

4. **Phase 4 (Operations)**  
   - Staff availability; export/import; session timeout and audit hardening.

5. **Phase 5 (Optional)**  
   - Sterilization log; controlled substance log; multi-location; reminder sending (backend).

---

## 7. Summary Table: Data Additions

| Area | New / Extended Data | Purpose |
|------|--------------------|--------|
| Scheduling | Appointment, Operatory | Real slots, conflict detection, multi-appt per day |
| Production | providerId on InvoiceLine / procedure | Production by provider and date |
| Safety | ASA, pre-med, Consent, Referral, Lab case | Compliance, referrals, lab tracking |
| Billing | Secondary insurance, Fee schedule, Adjustment, EOB | Full billing and insurance workflow |
| Operations | Staff availability, Export/Import, session/audit | Multi-user, backup, HIPAA-friendly behavior |

This document should be used as the **single source of truth** for “what to build next” and in what order, before coding. Each feature that touches scheduling, billing, or compliance should align with these data shapes and phases.
