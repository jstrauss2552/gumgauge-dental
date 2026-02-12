# GumGauge Dental – Project Context & Handoff

**Purpose:** Dental practice management web app. Use this doc so a new chat/session can continue work without re-reading the full conversation history.

**Maintenance:** Update this file when adding features, changing flows, or fixing important behavior—so the next chat always has accurate context. The user may ask you to update it in a later chat. **Keep updating this file with every single change you make, and state in the "Document updates" section below that you updated the file.**

---

## 1. Project location and stack

- **Path:** `C:\Users\joshi\gumgauge-dental`
- **Stack:** React 18, TypeScript, Vite, React Router, Tailwind CSS. No backend; data in **localStorage**: `gumgauge-patients`, `gumgauge-staff`, `gumgauge-timezone`.
- **Run:** `cd C:\Users\joshi\gumgauge-dental` then `npm install` (if needed), `npm run dev` → open the URL shown (e.g. http://localhost:5173).

---

## 2. App flow and routes

- **`/`** – Splash: “GumGauge — The Future of Dental Care”, logo, glimmer on text, **Start System** button. User must click to enter; no auto-redirect.
- **`/dashboard`** – Layout (sidebar + main). Child routes:
  - **`/dashboard`** – Dashboard (stats, today’s appointments, upcoming next appointments).
  - **`/dashboard/patients`** – Patient list (search, sort).
  - **`/dashboard/patients/new`** – New patient form.
  - **`/dashboard/patients/:id`** – Patient chart (view/edit/delete).
  - **`/dashboard/staff`** – Staff list (search, filter by position).
  - **`/dashboard/staff/new`** – Add staff member.
  - **`/dashboard/staff/:id`** – Staff member detail (view/edit/delete).
  - **`/dashboard/appointments`** – Appointments list with filters.
  - **`/dashboard/billing`** – Billing tab: select patient, balance due, insurance deductible (remaining/annual), payment methods (add/store), record payment, send claim to insurance, procedure price reference (CDT with default fees, e.g. Cleaning $125).
- **Log out** – Sidebar button navigates to `"/"` (replace), back to splash/Start System.

---

## 3. Features implemented (for continuity)

### Splash / intro
- **Logo:** Uses `public/logo.png` (user-provided GumGauge logo with transparent background). Logo size on splash: `xl` (h-32 sm:h-40 md:h-48).“GumGauge — The Future of Dental Care”.
- **Tagline:** "GumGauge — The Future of Dental Care" — two-layer rendering: (1) black outline (5px stroke) behind, (2) white fill + glimmer gradient on top. Glimmer gradient: white base, brighter blue (#7dd3fc) highlight band at 35%–65%.
- **Glimmer animation:** Single shared animation on parent (`--glimmer-x`). Sweep left-to-right, fully off logo and text before repeat. Timing: ~5s sweep, 2.5s pause (7.5s total cycle). Glimmer on both logo (subtle white overlay) and tagline (more noticeable blue sweep). Uses CSS `@property` for sync.
- **Start System button:** White background, navy text, 2px black border, rounded-xl, hover lift + shadow, focus ring. Required to proceed; no automatic navigation.
- **Sign in:** Link/button on splash for employed staff; navigates to `/signin`.

### Time and timezone
- **Real-time clock** in selected US timezone (updates every second).
- **Default timezone:** Eastern – `America/New_York` (EST/EDT).
- **Timezone selector** in sidebar: Eastern (New York, Boston, Miami), Central (Chicago, Houston, Dallas), Mountain (Denver, Phoenix, Salt Lake City), Arizona (Phoenix, no DST), Pacific (Los Angeles, Seattle, San Francisco), Alaska (Anchorage), Hawaii (Honolulu). Stored in `localStorage` (`gumgauge-timezone`).
- **“Today”** everywhere (Dashboard, Appointments “today” view) is computed in the **selected timezone** (not browser local time).
- **Date display format** app-wide: **“Month Day, Year”** (e.g. February 8, 2026). See `src/utils/dateFormat.ts`.

### Dashboard
- Shows **live date and time** (from selected timezone) at top.
- Stats: Total patients, Today’s appointments, Quick action (Add patient).
- **Today’s appointments**: for each patient, shows name, time, **appointment type**, **doctor performing**; when a visit has been started, an **“In progress”** badge (green) is shown. Link is **“Start visit”** (opens chart to start visit) or **“Chart”** (when in progress). “Today” is timezone-based. Ordered by date then time.
- **Upcoming next appointments** ordered by date then time.

### Patients
- **List:** Search by name/email; **Sort by** dropdown: Name A→Z / Z→A, DOB (oldest/newest), Appt date, Appt time, Next appt date (earliest/latest). Dates shown as Month Day, Year; optional appointment times shown.
- **New/Edit:** Demographics, medical history, **insurance** (see below), appointments (date + optional time), clinical notes.
- **Insurance:** Dropdown with **top 20 US providers** (`src/constants/insuranceProviders.ts`) plus **“Other”**. When “Other” is selected, a **“Custom provider name”** text field appears; user must be able to type there. First option in provider dropdown is **“Select provider”**. Plan name has placeholder **“Select plan”**.
- **Start visit / End visit (patient chart):** When the patient is actually in the office for their appointment, staff can click **“Start visit”** on the patient chart. This sets **currentVisitStartedAt** (ISO timestamp) and shows a green **“Visit in progress”** banner with start time (in selected timezone) and **“End visit”** button. Ending the visit clears the flag. Dashboard “Today’s appointments” shows an **“In progress”** badge for patients with an active visit.
- **Images & imaging (patient chart only):** Section titled **“Images & imaging”**. Users can **upload** any imaging from their device; stored as base64 data URLs in the patient record (localStorage). **Imaging types** (dropdown): X-ray, Panoramic X-ray, Bitewing, Periapical, Radiograph, CBCT (Cone Beam CT), CT scan, MRI, Ultrasound, Intraoral photo, Extraoral photo, Photograph, Other. See `PATIENT_IMAGE_TYPES` in `types.ts`. When **editing**: add image (label, type, file picker), **View** full-size in a modal, **Remove** images. Limits: 10 images per patient, 3 MB per file. Type `PatientImage`: id, label, type, dataUrl, dateAdded.

### Staff
- **Positions** (grouped): **Clinical** (Dentist, Pediatric Dentist, Dental Hygienist, Dental Assistant, CDA, Sterilization Technician), **Front office** (Front Desk/Receptionist, Patient Coordinator, Billing/Insurance Coordinator, Office Manager, Practice Manager), **Specialists** (Orthodontist, Endodontist, Periodontist, Oral Surgeon), **Support** (Dental Lab Technician). See `src/constants/staffPositions.ts`. **STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS**: Dentist, Pediatric Dentist, Orthodontist, Endodontist, Periodontist, Oral Surgeon, Dental Hygienist — these roles see **My patients** and can have **assigned patients**.
- **List:** Search by name, email, or position; filter by **Position** dropdown (grouped). Columns: Name, Position, Status, Hire date, Contact, View link.
- **Add/Edit:** Basic info (name, position, status, hire date), Contact (email, phone), **Login credentials** (login email/username, password — for Sign in). License/certification, Emergency contact, Notes. For positions in STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS, **Assigned patients** (checkboxes to assign patient IDs). Status: Active | On leave | Inactive.
- **Sign in:** Each staff can have **loginEmail** and **password** (optional). Sign-in page at `/signin`; session stored in **sessionStorage** (`gumgauge-signed-in-staff-id`). **getStaffByLogin(loginEmail, password)** in staffStorage. AuthContext: `staff`, `isSignedIn`, `login()`, `logout()`.
- Storage: `src/storage/staffStorage.ts` – getStaff, saveStaff, getStaffById, getStaffByLogin, addStaff, updateStaff, deleteStaff; key `gumgauge-staff`.

### Device Scan
- **Route:** `/dashboard/device-scan`. **Device Scan** in sidebar.
- **Flow:** (1) Connect GumGauge device (simulated), (2) Select patient, (3) Start procedure (mock scan), (4) Upload scan file — saved to patient's **patientImages** as type **GumGauge Scan**. Link to open patient chart. In production, step 1 would link to real hardware.

### Appointments
- **Appointment types** include **GumGauge Scan** (in `APPOINTMENT_TYPES`).
- **View toggles:** Today | Upcoming | All.
- **Group by:** Year | Month | Week:
  - **Year:** Single **Show** dropdown with years (current − 5 to current + 5). “Current year” from selected timezone.
  - **Month:** **Year** dropdown first (same range), then **Month** dropdown with the 12 months only (January … December). User selects year, then month.
  - **Week:** Single **Show** dropdown listing weeks that have at least one appointment (from data).
- **Patient** filter: dropdown to filter by one patient or “All patients”.
- Table: Date (formatted), Type (Appointment / Next appointment), Patient, link to Chart.

### Data model (Patient)
- `types.ts`: id, firstName, lastName, dateOfBirth, phone, email, address, allergies, medicalConditions, currentMedications, emergencyContactName/Phone, insuranceProvider, insurancePlan, insuranceMemberId, insuranceGroupNumber, dateOfAppointment, dateOfNextAppointment, **appointmentTime**, **nextAppointmentTime** (optional), appointmentType, **appointmentTypeOther** (optional, when type is "Other"), **appointmentDoctor** (optional), chiefComplaint, treatmentPlan, lastCleaningDate, dentistNotes, **patientImages** (optional array), **currentVisitStartedAt** (optional ISO), **currentVisitUseVoiceNotes** (optional), **currentVisitNotes** (optional), **visitHistory** (optional array), createdAt, updatedAt.
- **VisitHistoryEntry**: startedAt, endedAt, durationMinutes, **clinicalSummary** (optional), **voiceNotesConsent** (optional).
- **PatientImage** (in `types.ts`): id, label, type (from `PATIENT_IMAGE_TYPES`: includes **GumGauge Scan**, Other, …), dataUrl (base64), dateAdded. Max 10 per patient, 3 MB per file in UI.
- Storage: `src/storage.ts` – getPatients, savePatients, getPatientById, addPatient, updatePatient, deletePatient; all persist to localStorage.

### Data model (Staff)
- `types.ts`: Staff – id, firstName, lastName, position, email, phone, **loginEmail** (optional), **password** (optional), hireDate, status (Active | On leave | Inactive), licenseNumber, licenseExpiry, emergencyContactName, emergencyContactPhone, notes, **assignedPatientIds** (optional string[]), createdAt, updatedAt.

---

## 4. Important files (quick reference)

| Path | Purpose |
|------|--------|
| `src/App.tsx` | Routes; wrapped in `TimezoneProvider`, `AuthProvider`. |
| `src/components/Layout.tsx` | Sidebar nav (Dashboard, Patients, Billing, Staff, Appointments, Device Scan, Recall, Audit log, My patients when applicable), timezone, clock, Sign in / Sign out. |
| `src/contexts/AuthContext.tsx` | Auth state (staff, isSignedIn), login(), logout(); sessionStorage. |
| `src/pages/SignIn.tsx` | Staff sign-in page (login email, password). |
| `src/pages/Splash.tsx` | Intro screen, Start System and Sign in buttons, glimmer. |
| `src/pages/MyPatients.tsx` | My patients list for signed-in staff in crucial positions. |
| `src/pages/DeviceScan.tsx` | Device Scan: connect device, select patient, run scan, upload to patient. |
| `src/pages/Dashboard.tsx` | Uses `useTimezoneContext`, `useTodayInTimezone`, `useClock` for timezone and “today”. |
| `src/pages/Appointments.tsx` | View/period/patient filters; year ±5, all months in range, weeks from data. |
| `src/pages/PatientList.tsx` | Search + sort; uses `formatDisplayDate`. |
| `src/pages/PatientNew.tsx` | New patient; insurance dropdown + Other/custom input; appointment time fields. |
| `src/pages/PatientChart.tsx` | View/edit patient; **collapsible sections** (Demographics, Medical, Insurance, Appointments, Images, Clinical, Dentist notes, Perio, Clinical notes, **Prescriptions**, Billing, Treatment plans, Visit history); **required fields**; **Add image** (quick-add modal); PrescriptionView; link to Billing tab. |
| `src/pages/Billing.tsx` | Billing tab: patient selector, balance due, insurance deductible (edit remaining/annual), payment methods (add/remove), record payment, send claim to insurance, procedure prices reference (CDT). |
| `src/components/CollapsibleSection.tsx` | Reusable collapsible section; open/closed state persisted per section in localStorage. |
| `src/pages/StaffList.tsx` | Staff list; search, filter by position (grouped). |
| `src/pages/StaffNew.tsx` | Add staff member form. |
| `src/pages/StaffDetail.tsx` | View/edit/delete staff member. |
| `src/storage/staffStorage.ts` | Staff CRUD; localStorage key `gumgauge-staff`. |
| `src/constants/staffPositions.ts` | STAFF_POSITION_GROUPS, STAFF_STATUSES. |
| `src/contexts/TimezoneContext.tsx` | Timezone state + setter; persisted to localStorage. |
| `src/hooks/useAppTimezone.ts` | `useClock(timezone)`, `useTodayInTimezone(timezone)`. |
| `src/hooks/useSpeechRecognition.ts` | Web Speech API: start/stop mic, onFinalTranscript, transcriptToBulletPoints(). |
| `src/utils/dateFormat.ts` | `formatDisplayDate(isoDate)`, `getTodayInTimezone(tz)`, `formatDateTimeInTimezone(tz)`, `formatISODateTimeInTimezone(isoString, tz)` (e.g. visit start time). |
| `src/constants/timezones.ts` | US_TIMEZONES (with example cities), getStoredTimezone, setStoredTimezone, DEFAULT_TIMEZONE. |
| `src/constants/insuranceProviders.ts` | TOP_INSURANCE_PROVIDERS (20 names), INSURANCE_OTHER = "Other". |
| `src/constants/cdtCodes.ts` | CDT_CODES (code, description, defaultFee); getDefaultFeeForCode(). Treatment plan procedure dropdown auto-fills description and estimated fee. |
| `src/components/PrescriptionView.tsx` | Prescriptions: new Rx form (medication, strength, sig, quantity, refills, prescriber, DEA), list, print Rx-style. |
| `src/types.ts` | Patient, PatientInput, PatientImage, Prescription, PerioExam, GumGaugeExam, GumGaugeToothReading, densityToHealthResult, densityToLightPercent, Staff, PaymentMethod, InsuranceClaim. |
| `src/storage.ts` | localStorage CRUD for patients. |
| `src/index.css` | Tailwind + splash glimmer styles. |

---

## 5. Conventions and gotchas

- **Dates:** Stored as ISO date strings (`YYYY-MM-DD`). Displayed with `formatDisplayDate()` as “Month Day, Year”. “Today” and current date/time use the **selected timezone**.
- **Insurance “Other”:** Stored value is the typed string (custom provider name). In forms, when “Other” is selected, the **custom provider name** input must be visible and editable (PatientNew uses `insuranceOther`, PatientChart uses `insuranceProvider` for the custom string when not in the top-20 list).
- **No backend:** All data is in the browser; changing device or clearing storage loses it.
- **Patient images:** All imaging types (x-ray, CBCT, CT, MRI, photos, etc.) stored as base64 data URLs in the patient object (localStorage). App limits to 10 images per patient and 3 MB per file. **Quick-add image** from chart without entering full Edit mode (modal).
- **Billing:** Billing tab at `/dashboard/billing`. Patient has **insuranceDeductibleRemaining**, **insuranceDeductibleAnnual**, **paymentMethods** (PaymentMethod[]), **insuranceClaims** (InsuranceClaim[]). CDT codes have **defaultFee** (e.g. D1110 $125); treatment plan procedure dropdown auto-fills fee.
- **Prescriptions:** Patient chart has **Prescriptions** section (PrescriptionView). Write prescriptions with medication (common dental list + Other), strength/form, **sig** (directions), **quantity**, **refills**, prescriber name/credentials, optional DEA. Prescriber defaults from signed-in staff. **Print** produces an Rx-style form. Patient has **prescriptions** (Prescription[]).
- **GumGauge integration:** Perio charting section keeps full PD/bleeding (1–16 and 17–32). **GumGauge device results** are integrated below: Teeth 1–16 and 17–32 boxes show **light penetration %** and **health** (Healthy / Moderate / Unhealthy) from device. Device Scan page: after scan, **Add GumGauge readings to chart** creates a GumGaugeExam and updates patient; chart auto-shows latest exam. Types: GumGaugeExam, GumGaugeToothReading, densityToHealthResult(), densityToLightPercent() (C++ logic: ≤350 Healthy, 351–530 Moderate, >530 Unhealthy).
- **Visit in progress:** `currentVisitStartedAt` on the patient is set when staff clicks “Start visit” and cleared on “End visit”. Visit history now stores clinicalSummary and voiceNotesConsent. Sign in uses sessionStorage.
- **AI Voice notes:** When a visit is started with “Use AI voice notes” and consent, the chart shows **Start recording** / **Stop recording** (browser microphone via Web Speech API). Live transcript is appended to visit notes as you speak. **Generate bullet points** turns the transcript into a concise clinical summary (client-side, no API). Supported in Chrome/Edge; unsupported browsers can type notes manually.
- **Log out** is navigation-only (to `/`); no auth or server session.
- **Sign-in required:** Start visit, End visit, perio exam add, clinical notes, prescriptions, treatment plans, and Device Scan (run scan, add readings) require staff to be signed in. SignIn supports **returnTo** query param.
- **Device scan:** Light/brightness slider (0–100%) when connected; 6-flash progress bar (3 preparing, 3 confirming) during scan.
- **Clinic:** Route `/dashboard/clinic`. Register clinic (name, address, city, state, zip, phone, device count). Stored in `gumgauge-clinic`. Clinic name shown in sidebar and on Dashboard.
- **Admin:** Splash has **Admin Log-In** (top right). Route `/admin` with password login; view clinics (name, location, device count). Demo shows the one registered clinic.
- **GumGauge interactive view:** **GumGaugeMouthView** component: 2D mouth diagram (SVG, no 3D engine) with upper arch (teeth 1–16) and lower arch (17–32). Click a tooth to see light % and health; colors by health (green/amber/red). **Scan date dropdown** to pick past scan. Shown on Device Scan (when patient has scans) and in patient chart Perio section (with date dropdown for multiple exams).

---

## 6. What to tell the next chat

You can say something like:

- “We’re working on the GumGauge dental app at `C:\Users\joshi\gumgauge-dental`. Please read `docs/PROJECT_CONTEXT_AND_HANDOFF.md` for full context, then [your new request].”

That gives the next session a single file to load for full project and conversation continuity without re-running loops.

---

## 7. Document updates

| Date | Change | Updated by |
|------|--------|------------|
| 2026-02-08 | Added splash screen details: logo, tagline, glimmer, Start System. Maintenance instruction. | AI (Cursor) |
| 2026-02-09 | **Clinical tools:** Perio charting (PerioChart component: PD, bleeding, numeric/graphic views, compare exams). Clinical notes (ClinicalNotes component with templates from clinicalNoteTemplates.ts). Treatment plans (TreatmentPlanView: phases, procedures with CDT codes, fees, printable). **Appointments:** Calendar view (day/week/month), drag-drop reschedule, duration and room on patient (appointmentDurationMinutes, appointmentRoom, etc.), recall interval; List view has Duration and Room columns; Export CSV. **Recall:** Recall report page (/dashboard/recall) – overdue and upcoming by lastCleaningDate + recallIntervalMonths. **Audit trail:** auditStorage, addAuditEntry on patient/staff create/update/delete, setAuditActor in AuthContext; Audit log page (/dashboard/audit). **Exports:** CSV export on Patients list and Appointments list (exportCsv.ts). **Billing:** Patient balanceDue, paymentHistory, Record payment; CDT_CODES constant; treatment plan procedure code dropdown uses CDT. | AI (Cursor) |
| 2026-02-09 | **Insurance "Other":** Custom provider name is a dedicated free-response field (PatientChart: `insuranceOtherCustom` state; PatientNew already had `insuranceOther`). **Appointment type "Other":** Added `appointmentTypeOther` and free-response field in PatientNew and PatientChart. **Sign in:** AuthContext, SignIn page (`/signin`), staff `loginEmail`/`password` (optional), getStaffByLogin, Splash "Sign in" button, Layout Sign in / Signed in as / Sign out. **Start Visit:** Modal with "Use AI voice notes" and consent; `currentVisitUseVoiceNotes`, `currentVisitNotes`; Visit session UI with anonymity note and notes textarea; visit history entries have `clinicalSummary` and `voiceNotesConsent`. Dashboard "Start visit" links to chart with `?startVisit=1` to open modal. **Assigned patients:** Staff `assignedPatientIds`, STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS, My patients page and nav (when signed in as crucial position), Assigned patients section in StaffDetail. **Device Scan:** Route and page (connect device, select patient, start procedure, upload result to patient images as GumGauge Scan). **GumGauge Scan:** Added to PATIENT_IMAGE_TYPES and APPOINTMENT_TYPES. | AI (Cursor) |
| 2026-02-11 | **Patient chart simplification:** CollapsibleSection component; all chart sections collapsible (state in localStorage). Required fields (first name, last name, DOB) marked with *. **Images:** "Add image" without full Edit (quick-add modal). **Perio charting:** New exam form split into two boxes – Teeth 1–16 and Teeth 17–32. **Treatment plans:** CDT_CODES now have defaultFee; procedure dropdown auto-fills description and estimated fee (e.g. Cleaning $125). **Billing tab:** New route /dashboard/billing; select patient, balance due, insurance deductible (remaining/annual), payment methods (add/remove), record payment, send claim to insurance, procedure price reference. Patient type: insuranceDeductibleRemaining, insuranceDeductibleAnnual, paymentMethods, insuranceClaims. Chart Billing section: deductible fields, link to Billing tab. | AI (Cursor) |
| 2026-02-11 | **AI Voice notes:** Microphone access via Web Speech API (useSpeechRecognition hook). During a visit with “Use AI voice notes”: Start/Stop recording, live transcript appended to visit notes; **Generate bullet points** produces a concise clinical summary from transcript (client-side). Types for SpeechRecognition in vite-env.d.ts. | AI (Cursor) |
| 2026-02-11 | **Prescriptions:** Prescription type (date, medication, strength, sig, quantity, refills, prescriberName, prescriberCredentials, deaNumber, signedAt). PrescriptionView in patient chart: common dental medications + Other, sig/quantity/refills, prescriber default from signed-in staff, Print Rx-style. Patient.prescriptions[]. | AI (Cursor) |
| 2026-02-11 | **GumGauge integration:** Kept full perio chart (PD, bleeding, 1–16 / 17–32). Added GumGauge device results below: Teeth 1–16 and 17–32 boxes with light penetration % and health (Healthy/Moderate/Unhealthy). Device Scan: “Add GumGauge readings to chart” creates GumGaugeExam and auto-fills chart. Patient.gumGaugeExams[]; densityToHealthResult, densityToLightPercent (C++ logic). | AI (Cursor) |
| 2026-02-11 | Sign-in required for visit/treatment/official input. Device scan: brightness slider, 6-flash progress. Clinic registration /dashboard/clinic; clinic name on sidebar and Dashboard. Admin /admin, Splash Admin Log-In, view clinics and device counts. | AI (Cursor) |
| 2026-02-11 | **GumGauge interactive view:** GumGaugeMouthView – 2D SVG mouth diagram (upper 1–16, lower 17–32), click tooth for light % and health, scan date dropdown for past scans. Shown on Device Scan and in patient chart Perio section. No 3D/WebGL. | AI (Cursor) |