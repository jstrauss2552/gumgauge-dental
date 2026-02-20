# Tier 1, 2 & 3 — Detailed Implementation Breakdown

This document is a **detailed breakdown** of what was implemented in **Tier 1** (scheduling & production), **Tier 2** (clinical & safety), and **Tier 3** (billing & insurance), aligned with the [DENTAL_PROFESSIONAL_GAP_ANALYSIS.md](./DENTAL_PROFESSIONAL_GAP_ANALYSIS.md).

---

## Tier 1 — Foundation (Scheduling and Production)

**Goal:** First-class appointments and operatories, conflict detection, and production linked to provider.

---

### 1.1 Data model

| Item | Location | Description |
|------|----------|-------------|
| **Operatory** | `src/types.ts` | `id`, `name`, `defaultDurationMinutes` (optional). Represents a operatory/room. |
| **Appointment** | `src/types.ts` | `id`, `patientId`, `providerId` (staff), `operatoryId`, `start` / `end` (ISO datetime), `type`, `status`, `notes`, `createdAt`, `updatedAt`. Optional: `checkedInAt` (ISO timestamp) for wait-time. |
| **AppointmentEvent** | `src/types/appointments.ts` | Unified event for calendar: `appointmentId`, `providerId`, `operatoryId`, `patientId`, start/end, type, status, `checkedInAt`. Used by the Appointments page. |
| **InvoiceLine.providerId** | `src/types.ts` | Optional `providerId` (staff id) on each invoice line so production can be reported by provider. |

---

### 1.2 Storage

| File | Purpose |
|------|---------|
| **`src/storage/operatoryStorage.ts`** | CRUD for operatories. `getOperatories()`, `addOperatory()`, `updateOperatory()`, `deleteOperatory()`. Demo vs non-demo keys (`gumgauge-demo-operatories` / `gumgauge-operatories`). Seed: 3 operatories when empty (or demo seed). |
| **`src/storage/appointmentStorage.ts`** | CRUD for appointments. `getAppointments()`, `getAppointmentById()`, `getAppointmentsByDate(date)`, `addAppointment()`, `updateAppointment()`, `deleteAppointment()`, **`getAppointmentConflicts(appointmentId, operatoryId, providerId, start, end)`** — returns overlapping appointments for same operatory or same provider (used to warn/block double-booking). |

---

### 1.3 Demo seed

| File | What’s seeded |
|------|----------------|
| **`src/data/demoSeed.ts`** | `getDemoOperatories()` — demo operatories; `getDemoAppointments()` — appointments built from demo patients (linked by `patientId`). |

---

### 1.4 Appointment events (calendar)

| File | Purpose |
|------|---------|
| **`src/utils/appointmentEvents.ts`** | `buildEventsFromAppointments(appointments, patients)` — turns `Appointment[]` into `AppointmentEvent[]` with patient name, provider, operatory. `buildUnifiedEvents(...)` — merges first-class appointments with legacy “current/next” patient fields when no appointments exist (backward compatible). |
| **`src/types/appointments.ts`** | `AppointmentEvent` type used by the Appointments page list/table/CSV and by the New appointment modal. |

---

### 1.5 Appointments page

| Feature | Description |
|---------|-------------|
| **View** | Day list or table of events; optional CSV export. Events come from first-class appointments when present, else from patient `dateOfAppointment` / `appointmentTime`. |
| **Status** | Status shown and editable (e.g. Scheduled, Checked In, No-Show) — stored on the **appointment** or, when no appointment, on the **patient** (legacy). |
| **New appointment** | Modal: select **patient**, **provider** (staff), **operatory**, **date**, **time**, **duration**, **type**. On save, **conflict check** runs (`getAppointmentConflicts`). If conflict (same operatory or same provider overlapping), user is warned; can still save or change time/room. |
| **Reschedule / edit** | Edit existing appointment (time, operatory, provider, etc.) or move “legacy” patient appointment; conflict check on update. |

---

### 1.6 Dashboard and PatientChart

| Where | Change |
|-------|--------|
| **Dashboard** | “Today’s appointments” and “Upcoming appointments” use **first-class appointments** when available (`getAppointmentsByDate`, etc.). **Pending lab cases** widget: patients with lab cases in status “Sent” or “In progress” (Tier 2 data). |
| **PatientChart** | When viewing a patient, appointment info can be derived from the appointment entity (e.g. next appointment from `getAppointmentsByDate` filtered by `patientId`) where applicable. |

---

### 1.7 Summary — Tier 1

- **Operatory** and **Appointment** are first-class; operatories and appointments have dedicated storage and demo seed.
- **Conflict detection** on create/update appointment (operatory + provider overlap).
- **Appointments page** supports list/table, new appointment (with conflict check), reschedule, status.
- **InvoiceLine** has optional **providerId** for production-by-provider (used when adding charges; reporting can be extended later).
- **Backward compatibility:** Unified events still use patient “current/next” when no first-class appointments exist.

---

## Tier 2 — Clinical and Safety

**Goal:** ASA/pre-med, visit-scoped procedures, structured consent, referrals, and lab cases with chart sections and workflows.

---

### 2.1 Data model (types)

| Item | Location | Description |
|------|----------|-------------|
| **AsaStatus** | `src/types.ts` | `"I" \| "II" \| "III" \| "IV" \| "V"` for ASA physical status. |
| **Patient** | `src/types.ts` | New fields: `asaStatus`, `premedRequired` (boolean), `premedNote`, `premedLastGivenDate` (ISO date). |
| **VisitProcedure** | `src/types.ts` | `procedureCode` (CDT), `tooth` (optional number), `description` (optional). Represents a procedure completed in a visit. |
| **VisitHistoryEntry** | `src/types.ts` | Extended with **`procedures?: VisitProcedure[]`** — procedures completed when “End visit” was used. |
| **StructuredConsent** | `src/types.ts` | `id`, `procedureOrTreatment`, `date` (ISO), `signedBy`, `witnessStaffId` (optional), `documentId` (optional). |
| **Patient** | `src/types.ts` | **`consents?: StructuredConsent[]`**. |
| **Referral** | `src/types.ts` | `id`, `referredTo`, `reason`, `date` (ISO), `status` (e.g. Sent / Accepted / Completed), `responseNote`, `addedAt`. |
| **ReferralStatus** | `src/types.ts` | Type for referral status. |
| **Patient** | `src/types.ts` | **`referrals?: Referral[]`**. |
| **LabCase** | `src/types.ts` | `id`, `labName`, `caseType` (e.g. crown, bridge, denture), `sentDate`, `expectedDate`, `receivedDate`, `status`, `prescriptionNote`, `toothOrTeeth` (optional), `addedAt`. |
| **LabCaseStatus** | `src/types.ts` | Status values for lab case. |
| **Patient** | `src/types.ts` | **`labCases?: LabCase[]`**. |

---

### 2.2 Storage

- **ASA, pre-med, consents, referrals, lab cases** are stored **on the patient** (no separate storage modules). CRUD via `updatePatient(patientId, { asaStatus, premedRequired, … })`, etc.
- **Visit procedures** are stored inside **`VisitHistoryEntry.procedures`** when the user ends a visit and optionally adds procedures in the End-visit modal.

---

### 2.3 Demo seed

| Data | Description |
|------|-------------|
| **Robert Johnson (demo patient)** | Has ASA status, pre-med required, pre-med note, last pre-med date; one **referral** (e.g. Sent); one **lab case** (e.g. crown, Sent or In progress). Used to showcase chart sections. |

---

### 2.4 Patient chart — sections and UX

| Section | What’s implemented |
|--------|--------------------|
| **Medical history — ASA & Pre-med** | Subsection: ASA dropdown (I–V), “Pre-med required” checkbox, pre-med note (text), “Pre-med last given / cleared” (date). Editable in edit mode; saved with rest of patient. |
| **Consents** | **Consents** section: list of structured consents (procedure/treatment, date, signed by). **Add** (prompt or form: procedure/treatment, date, signed by); **Remove** per consent. Stored in `patient.consents`. |
| **Referrals** | **Referrals** section: list of referrals (referred to, reason, date, status). **Status** editable (dropdown: Sent, Accepted, Completed, etc.). **Add** (referred to, reason, …); **Remove** per referral. |
| **Lab cases** | **Lab cases** section: list (lab name, case type, sent/expected/received dates, status). **Status** dropdown; when status set to “Received” or “Delivered”, **received date** can be set. **Add** (lab name, case type, …); **Remove** per case. |
| **Visit history** | Each visit entry can show **procedures** (CDT + tooth + description) when `VisitHistoryEntry.procedures` is present. |
| **End visit** | **End visit** button opens a modal. User can optionally **add procedures** (code, tooth, description) for that visit. On **Confirm end visit**, `endVisit(procedures)` is called; the new **VisitHistoryEntry** is saved with **`procedures`** populated. |

---

### 2.5 Dashboard

| Widget | Description |
|--------|-------------|
| **Pending lab cases** | Lists patients who have at least one lab case with status “Sent” or “In progress” (or similar), with link to chart. |

---

### 2.6 Summary — Tier 2

- **ASA and pre-med** on patient with chart subsection.
- **Visit-scoped procedures:** procedures (CDT + tooth) can be added when **ending a visit**; stored in `VisitHistoryEntry.procedures` and shown in visit history.
- **Structured consent:** list + add/remove on chart; data in `patient.consents`.
- **Referrals:** list, status dropdown, add/remove; data in `patient.referrals`.
- **Lab cases:** list, status, set received date when received/delivered, add/remove; data in `patient.labCases`.
- **Dashboard:** Pending lab cases widget.

---

## Tier 3 — Billing and Insurance

**Goal:** Secondary insurance, fee schedule, write-offs/adjustments, EOB/claim payments, and aging report with full Billing UI.

---

### 3.1 Data model (types)

| Item | Location | Description |
|------|----------|-------------|
| **Patient** | `src/types.ts` | **Secondary insurance:** `insuranceProvider2`, `insurancePlan2`, `insuranceMemberId2`, `insuranceGroupNumber2`, `insuranceDeductibleAnnual2`, `insuranceDeductibleRemaining2`. |
| **Patient** | `src/types.ts` | **`adjustments?: Adjustment[]`** — write-offs and other adjustments that reduce balance. |
| **Adjustment** | `src/types.ts` | `id`, `date` (ISO), `amount`, `reason`, `type`: `"Write-off" \| "Adjustment"`, `staffId` (optional), `addedAt`. |
| **InsuranceClaim** | `src/types.ts` | **`claimPayments?: ClaimPayment[]`** — EOB/ERA payments applied to the claim. |
| **ClaimPayment** | `src/types.ts` | `id`, `claimId`, `paidAmount`, `allowedAmount`, `adjustmentAmount`, `patientResponsibility`, `paymentDate`, `addedAt`. |
| **FeeScheduleEntry** | `src/types.ts` | `id`, `planIdentifier` (e.g. plan name), `procedureCode` (CDT), `fee`, `addedAt`. |

---

### 3.2 Storage

| File | Purpose |
|------|---------|
| **`src/storage/feeScheduleStorage.ts`** | `getFeeSchedule()`, `getFeeForPlan(planIdentifier, procedureCode)` (returns fee or `undefined`), `addFeeScheduleEntry()`, `updateFeeScheduleEntry()`, `deleteFeeScheduleEntry()`. Keys: `gumgauge-fee-schedule` / `gumgauge-demo-fee-schedule` by demo mode. |
| **Adjustments** | Stored on **patient**: `patient.adjustments` (array). No separate storage. |
| **Claim payments** | Stored on **claim**: `InsuranceClaim.claimPayments` (array). No separate storage. |

---

### 3.3 Billing page — features

| Feature | Description |
|--------|-------------|
| **Secondary insurance (display)** | **Insurance** block shows Primary (provider, plan, member ID) and **Secondary** (provider, plan, member ID, group, deductibles). Link “Edit on chart” to PatientChart. |
| **Secondary insurance (edit)** | **PatientChart → Insurance** section includes **Secondary insurance** subsection: Provider, Plan name, Member ID, Group number, Deductible (annual), Deductible remaining. All editable in edit mode; saved with patient. |
| **Fee schedule when adding charges** | In **Add charges** modal, the **amount** for each procedure code is resolved by: (1) user override if any, (2) **`getFeeForPlan(patient.insurancePlan ?? "Default", procedureCode)`** from fee schedule, (3) default CDT fee. Placeholder and default value in the list use this same logic. |
| **Fee schedule management (admin)** | When user is **admin** and a patient is selected, right column shows **Fee schedule overrides**: list of entries (plan + code + fee) with **Remove** per row; **Add** form: Plan (text), Code (CDT dropdown), Fee (number). Calls `addFeeScheduleEntry` / `deleteFeeScheduleEntry`; list refreshes so Add charges uses latest fees. |
| **Write-off / adjustment** | **Account summary** has “Write-off / adjustment” button when balance &gt; 0. Modal: **Type** (Write-off | Adjustment), **Amount** ($), **Reason** (required). On Apply: new **Adjustment** appended to `patient.adjustments`, **balanceDue** reduced by amount (not below 0). **Adjustments** list shown below balance (date, type, amount, reason). |
| **Aging report** | **Admin** section at top of Billing: **Aging report (outstanding by service date)** with four buckets: **0–30 days**, **31–60 days**, **61–90 days**, **90+ days**. Amounts are summed from **invoice lines** (status not “Paid”) by **appointmentDate** vs today (days since service). |
| **EOB / claim payment** | In **Send to insurance** list, each claim shows **claim payments** (date, paid amount, optional patient responsibility). For claims with status **Sent** or **Partially paid**, **“Record EOB”** opens a modal: Payment date, **Paid amount** (required; applied to balance), Allowed amount, Adjustment amount, Patient responsibility (optional). On **Record EOB**: **ClaimPayment** appended to that claim; claim **status** set to **Paid** if total payments ≥ claim amount, else **Partially paid**; **payment history** entry added for the insurance payment; **balanceDue** reduced by paid amount. |

---

### 3.4 Balance and refresh

| Behavior | Description |
|----------|-------------|
| **Balance** | `balanceDue` is reduced by **payments** (payment history) and by **adjustments** (write-off/adjustment). EOB paid amount is recorded as a payment and reduces balance. |
| **Refresh** | After any update (payment, add charges, write-off, EOB, etc.), **`setBillingRefresh(k => k + 1)`** is used so the component re-reads patient data and UI (balance, claims, adjustments, fee schedule list) stays in sync. |

---

### 3.5 Summary — Tier 3

- **Secondary insurance:** Fields on patient; display on Billing; full edit on PatientChart (Insurance section).
- **Fee schedule:** Storage by plan + procedure code; **Add charges** uses it when resolving amounts; **admin** can add/remove overrides on Billing.
- **Write-off / adjustment:** Adjustment type and list on patient; modal on Billing to add; balance reduced; adjustments listed under Account summary.
- **Aging report:** Admin-only; buckets 0–30, 31–60, 61–90, 90+ days from service date; sums from unpaid invoice lines.
- **EOB/claim payment:** ClaimPayment on claim; **Record EOB** modal; payments listed under each claim; claim status and balance updated when EOB is recorded.

---

## File reference (quick index)

| Tier | Area | Files |
|------|------|--------|
| 1 | Types | `src/types.ts`, `src/types/appointments.ts` |
| 1 | Storage | `src/storage/operatoryStorage.ts`, `src/storage/appointmentStorage.ts` |
| 1 | Events | `src/utils/appointmentEvents.ts` |
| 1 | Seed | `src/data/demoSeed.ts` |
| 1 | Pages | `src/pages/Appointments.tsx`, `src/pages/Dashboard.tsx` |
| 2 | Types | `src/types.ts` (ASA, VisitProcedure, StructuredConsent, Referral, LabCase, etc.) |
| 2 | Chart | `src/pages/PatientChart.tsx` (ASA, consents, referrals, lab, visit procedures, end-visit modal) |
| 2 | Dashboard | `src/pages/Dashboard.tsx` (pending lab) |
| 3 | Types | `src/types.ts` (secondary insurance, Adjustment, ClaimPayment, FeeScheduleEntry) |
| 3 | Storage | `src/storage/feeScheduleStorage.ts` |
| 3 | Billing | `src/pages/Billing.tsx` (secondary, fee schedule, write-off, aging, EOB) |
| 3 | Chart | `src/pages/PatientChart.tsx` (secondary insurance subsection) |

---

## What’s next (Tier 4 — from gap analysis)

- Staff availability (schedule / slots).
- Preferred contact (method + time) on patient.
- Audit: store **actorStaffId**; session timeout / auto-logout.
- Export / import (JSON backup and restore).

### Tier 4 (implemented)

- **Audit:** AuditEntry.actorStaffId; setAuditActor(name, staffId); AuthContext passes staff id on login; Audit log shows Staff ID column. Session timeout (15 min) already in place.
- **Preferred contact:** Patient.preferredContactMethod and preferredContactTime; Chart Demographics section has Preferred contact (recall/reminders).
- **Staff availability:** StaffAvailability type and staffAvailabilityStorage; StaffDetail page has Availability section (add day/start/end, list, remove). replaceAllAvailability for import.
- **Export/import:** exportImport.ts (exportData, downloadExport, importData); Backup page at /dashboard/backup with Export and Import (confirm overwrite). Replace helpers in storages for restore.

This breakdown reflects the current codebase through Tier 4 implementation.
