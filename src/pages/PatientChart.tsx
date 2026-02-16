import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { getPatientById, updatePatient, deletePatient } from "../storage";
import { addAuditEntry } from "../storage/auditStorage";
import type { Patient, PatientImage, PerioExam, ClinicalNoteEntry, FormalTreatmentPlan, Prescription, InvoiceLine, ToothCondition, PatientDocument } from "../types";
import { APPOINTMENT_TYPES, PATIENT_IMAGE_TYPES } from "../types";
import PerioChart from "../components/PerioChart";
import ClinicalNotes from "../components/ClinicalNotes";
import TreatmentPlanView from "../components/TreatmentPlanView";
import CollapsibleSection from "../components/CollapsibleSection";
import { formatDisplayDate, formatISODateTimeInTimezone } from "../utils/dateFormat";
import { TOP_INSURANCE_PROVIDERS, INSURANCE_OTHER } from "../constants/insuranceProviders";
import {
  COMMON_ALLERGIES,
  COMMON_MEDICAL_CONDITIONS,
  COMMON_CURRENT_MEDICATIONS,
  INSURANCE_PLANS,
  APPOINTMENT_TYPE_OTHER,
  CHIEF_COMPLAINTS,
  COMMON_OPERATORIES,
  IMAGE_LABEL_SUGGESTIONS,
} from "../constants/autocompleteSuggestions";
import { DENTIST_POSITIONS_FOR_CHART_DELETE } from "../constants/staffPositions";
import { useTimezoneContext } from "../contexts/TimezoneContext";
import { useAuth } from "../contexts/AuthContext";
import { useSpeechRecognition, transcriptToBulletPoints } from "../hooks/useSpeechRecognition";
import PrescriptionView from "../components/PrescriptionView";
import MedicalAlertsBanner from "../components/MedicalAlertsBanner";
import ToothChart from "../components/ToothChart";
const MAX_PATIENT_IMAGES = 10;
const MAX_FILE_SIZE_MB = 3;

function Field({
  label,
  value,
  editing,
  formValue,
  onChange,
  type = "text",
  placeholder,
  rows,
  preWrap,
  required,
  listId,
  options,
}: {
  label: string;
  value: string;
  editing: boolean;
  formValue: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  rows?: number;
  preWrap?: boolean;
  required?: boolean;
  listId?: string;
  options?: readonly string[];
}) {
  return (
    <div className={rows ? "md:col-span-2" : ""}>
      {label ? (
        <label className="block text-sm text-navy/70 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-label="required">*</span>}
        </label>
      ) : null}
      {editing ? (
        type === "textarea" ? (
          <textarea
            value={formValue}
            onChange={(e) => onChange(e.target.value)}
            rows={rows ?? 3}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-sky/60 rounded-lg resize-y"
          />
        ) : (
          <>
            <input
              type={type}
              value={formValue}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              list={listId}
              autoComplete={listId ? "off" : undefined}
            />
            {listId && options && options.length > 0 && (
              <datalist id={listId}>
                {options.map((opt) => (
                  <option key={opt} value={opt} />
                ))}
              </datalist>
            )}
          </>
        )
      ) : (
        <p className={`text-navy ${preWrap ? "whitespace-pre-wrap" : ""}`}>{value || "—"}</p>
      )}
    </div>
  );
}

export default function PatientChart() {
  const { id } = useParams<"id">();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { timezone } = useTimezoneContext();
  const { staff: signedInStaff, isSignedIn } = useAuth();
  const canDeleteChart = isSignedIn && signedInStaff && (DENTIST_POSITIONS_FOR_CHART_DELETE as readonly string[]).includes(signedInStaff.position);
  const chartPath = `/dashboard/patients/${id}`;
  const signInReturnTo = chartPath + (searchParams.toString() ? `?${searchParams.toString()}` : "");
  const [patient, setPatient] = useState(getPatientById(id || ""));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Patient | null>(patient || null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewingImage, setViewingImage] = useState<PatientImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** When insurance dropdown is "Other", this holds the custom provider name (for edit form only) */
  const [insuranceOtherCustom, setInsuranceOtherCustom] = useState("");
  /** Modal: start visit with optional AI voice notes */
  const [startVisitModal, setStartVisitModal] = useState(false);
  const [startVisitUseVoiceNotes, setStartVisitUseVoiceNotes] = useState(false);
  const [startVisitConsent, setStartVisitConsent] = useState(false);
  /** Quick-add image modal (works without full Edit mode) */
  const [addImageModal, setAddImageModal] = useState(false);
  const [quickAddLabel, setQuickAddLabel] = useState("");
  const [quickAddType, setQuickAddType] = useState<PatientImage["type"]>("X-ray");
  const quickAddFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = getPatientById(id || "");
    setPatient(p);
    setForm(p || null);
    if (p?.insuranceProvider && p.insuranceProvider !== INSURANCE_OTHER && !TOP_INSURANCE_PROVIDERS.includes(p.insuranceProvider as (typeof TOP_INSURANCE_PROVIDERS)[number])) {
      setInsuranceOtherCustom(p.insuranceProvider);
    } else {
      setInsuranceOtherCustom("");
    }
  }, [id]);

  useEffect(() => {
    if (!editing || !form) return;
    const isCustom = form.insuranceProvider && !TOP_INSURANCE_PROVIDERS.includes(form.insuranceProvider as (typeof TOP_INSURANCE_PROVIDERS)[number]);
    if (isCustom) setInsuranceOtherCustom(form.insuranceProvider || "");
  }, [editing, form?.insuranceProvider]);

  useEffect(() => {
    if (searchParams.get("startVisit") === "1" && patient && !patient.currentVisitStartedAt) {
      setStartVisitModal(true);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("startVisit");
        return next;
      }, { replace: true });
    }
  }, [patient?.id, patient?.currentVisitStartedAt, searchParams, setSearchParams]);

  useEffect(() => {
    if (patient?.id) addAuditEntry({ timestamp: new Date().toISOString(), action: "chart.view", entityType: "patient", entityId: patient.id, details: `${patient.firstName} ${patient.lastName}` });
  }, [patient?.id]);

  if (!patient) {
    return (
      <div className="p-8">
        <p className="text-navy/70">Patient not found.</p>
        <Link to="/dashboard/patients" className="text-sky-dark font-medium mt-2 inline-block hover:underline">
          Back to patients
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    if (!form) return;
    const toSave = { ...form };
    if (toSave.insuranceProvider === INSURANCE_OTHER) {
      toSave.insuranceProvider = insuranceOtherCustom.trim() || undefined;
    }
    const num = (v: unknown) => (v === "" || v === undefined ? undefined : Number(v));
    toSave.appointmentDurationMinutes = num(toSave.appointmentDurationMinutes) as number | undefined;
    toSave.nextAppointmentDurationMinutes = num(toSave.nextAppointmentDurationMinutes) as number | undefined;
    toSave.recallIntervalMonths = num(toSave.recallIntervalMonths) as number | undefined;
    toSave.balanceDue = num(toSave.balanceDue) as number | undefined;
    updatePatient(patient.id, toSave);
    setPatient(getPatientById(patient.id)!);
    setForm(getPatientById(patient.id));
    setEditing(false);
  };

  const handleDelete = () => {
    deletePatient(patient.id);
    navigate("/dashboard/patients", { replace: true });
  };

  const update = (key: keyof Patient, value: string) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const images = form?.patientImages ?? patient.patientImages ?? [];

  const setImages = (next: PatientImage[]) => {
    if (!form) return;
    setForm({ ...form, patientImages: next });
  };

  const [newImageLabel, setNewImageLabel] = useState("");
  const [newImageType, setNewImageType] = useState<PatientImage["type"]>("X-ray");

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !form) return;
    if (images.length >= MAX_PATIENT_IMAGES) {
      alert(`Maximum ${MAX_PATIENT_IMAGES} images per patient. Remove one to add another.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File is too large. Please use an image under ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const label = newImageLabel.trim() || file.name.replace(/\.[^.]+$/, "") || "Image";
      const newImage: PatientImage = {
        id: crypto.randomUUID(),
        label,
        type: newImageType,
        dataUrl,
        dateAdded: new Date().toISOString(),
      };
      setImages([...images, newImage]);
      setNewImageLabel("");
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (imageId: string) => {
    setImages(images.filter((img) => img.id !== imageId));
  };

  const handleQuickAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !patient) return;
    const currentImages = patient.patientImages ?? [];
    if (currentImages.length >= MAX_PATIENT_IMAGES) {
      alert(`Maximum ${MAX_PATIENT_IMAGES} images per patient. Remove one to add another.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File is too large. Please use an image under ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const label = quickAddLabel.trim() || file.name.replace(/\.[^.]+$/, "") || "Image";
      const newImage: PatientImage = {
        id: crypto.randomUUID(),
        label,
        type: quickAddType,
        dataUrl,
        dateAdded: new Date().toISOString(),
      };
      updatePatient(patient.id, { patientImages: [...currentImages, newImage] });
      setPatient(getPatientById(patient.id)!);
      setForm(getPatientById(patient.id));
      setAddImageModal(false);
      setQuickAddLabel("");
    };
    reader.readAsDataURL(file);
  };

  const openStartVisitModal = () => setStartVisitModal(true);

  const startVisit = () => {
    if (!patient) return;
    const useVoiceNotes = startVisitUseVoiceNotes && startVisitConsent;
    updatePatient(patient.id, {
      currentVisitStartedAt: new Date().toISOString(),
      currentVisitUseVoiceNotes: useVoiceNotes || undefined,
      currentVisitNotes: useVoiceNotes ? "" : undefined,
    });
    setPatient(getPatientById(patient.id)!);
    setForm(getPatientById(patient.id));
    setStartVisitModal(false);
    setStartVisitUseVoiceNotes(false);
    setStartVisitConsent(false);
  };

  const endVisit = () => {
    if (!patient || !patient.currentVisitStartedAt) return;
    const endedAt = new Date().toISOString();
    const durationMinutes = Math.round(
      (new Date(endedAt).getTime() - new Date(patient.currentVisitStartedAt).getTime()) / 60_000
    );
    const newEntry = {
      startedAt: patient.currentVisitStartedAt,
      endedAt,
      durationMinutes,
      clinicalSummary: patient.currentVisitNotes || undefined,
      voiceNotesConsent: patient.currentVisitUseVoiceNotes || undefined,
    };
    const nextHistory = [...(patient.visitHistory || []), newEntry];
    updatePatient(patient.id, {
      currentVisitStartedAt: undefined,
      currentVisitUseVoiceNotes: undefined,
      currentVisitNotes: undefined,
      visitHistory: nextHistory,
    });
    setPatient(getPatientById(patient.id)!);
    setForm(getPatientById(patient.id));
  };

  const saveCurrentVisitNotes = (notes: string) => {
    if (!patient?.id) return;
    updatePatient(patient.id, { currentVisitNotes: notes });
    setPatient(getPatientById(patient.id)!);
    setForm(getPatientById(patient.id));
  };

  const handleFinalTranscript = (text: string) => {
    if (!patient?.id || !text.trim()) return;
    const latest = getPatientById(patient.id);
    if (!latest) return;
    const current = latest.currentVisitNotes ?? "";
    const next = current ? `${current} ${text.trim()}` : text.trim();
    updatePatient(patient.id, { currentVisitNotes: next });
    setPatient(getPatientById(patient.id)!);
    setForm(getPatientById(patient.id));
  };

  const {
    isSupported: isSpeechSupported,
    isListening,
    interimTranscript,
    error: speechError,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition({
    onFinalTranscript: handleFinalTranscript,
    lang: "en-US",
  });

  const handleGenerateBulletPoints = () => {
    const current = patient?.currentVisitNotes ?? "";
    if (!current.trim()) return;
    const bullets = transcriptToBulletPoints(current);
    if (!bullets) return;
    const separator = "\n\n--- Clinical summary ---\n";
    const existing = current.includes("--- Clinical summary ---")
      ? current.replace(/\n\n--- Clinical summary ---[\s\S]*$/, "").trim()
      : current;
    saveCurrentVisitNotes(existing + separator + bullets);
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link to="/dashboard/patients" className="text-sky-dark text-sm font-medium hover:underline mb-2 inline-block">
            ← Patients
          </Link>
          <h1 className="text-2xl font-semibold text-navy">
            Patient chart: {patient.firstName} {patient.lastName}
          </h1>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light"
              >
                Edit
              </button>
              {canDeleteChart ? (
                !confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
                    >
                      Confirm delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-4 py-2 border border-navy/30 rounded-lg"
                    >
                      Cancel
                    </button>
                  </>
                )
              ) : (
                <span className="px-4 py-2 text-navy/50 text-sm" title="Only a dentist from the clinic can delete a patient chart. Sign in as a dentist.">
                  Delete (dentist only)
                </span>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setForm(patient);
                  setEditing(false);
                  setConfirmDelete(false);
                }}
                className="px-4 py-2 border border-navy/30 rounded-lg"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <MedicalAlertsBanner
        allergies={patient.allergies}
        medicalConditions={patient.medicalConditions}
        currentMedications={patient.currentMedications}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link to={`/dashboard/billing?patient=${patient.id}`} className="px-3 py-1.5 border border-sky/60 rounded-lg text-sm font-medium text-navy hover:bg-sky/10">Send statement</Link>
        <Link to={`/dashboard/appointments?patient=${patient.id}`} className="px-3 py-1.5 border border-sky/60 rounded-lg text-sm font-medium text-navy hover:bg-sky/10">Schedule next</Link>
        <Link to={`/dashboard/recall`} className="px-3 py-1.5 border border-sky/60 rounded-lg text-sm font-medium text-navy hover:bg-sky/10">Recall list</Link>
        {isSignedIn && (
          <>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                updatePatient(patient.id, { lastRecallReminderSent: today });
                setPatient(getPatientById(patient.id)!);
                setForm(getPatientById(patient.id));
              }}
              className="px-3 py-1.5 border border-sky/60 rounded-lg text-sm font-medium text-navy hover:bg-sky/10"
            >
              Send recall reminder
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                updatePatient(patient.id, { lastAppointmentReminderSent: today });
                setPatient(getPatientById(patient.id)!);
                setForm(getPatientById(patient.id));
              }}
              className="px-3 py-1.5 border border-sky/60 rounded-lg text-sm font-medium text-navy hover:bg-sky/10"
            >
              Send appointment reminder
            </button>
          </>
        )}
      </div>

      {patient.currentVisitStartedAt && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3">
          <div>
            <span className="font-semibold text-green-800">Visit in progress</span>
            <span className="ml-2 text-green-700 text-sm">
              — started at {formatISODateTimeInTimezone(patient.currentVisitStartedAt, timezone)}
            </span>
          </div>
          {isSignedIn ? (
            <button
              type="button"
              onClick={endVisit}
              className="px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800"
            >
              End visit
            </button>
          ) : (
            <Link
              to={`/signin?returnTo=${encodeURIComponent(signInReturnTo)}`}
              className="px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-800 inline-block"
            >
              Sign in to end visit
            </Link>
          )}
        </div>
      )}

      {!patient.currentVisitStartedAt && (
        <div className="mb-6">
          {isSignedIn ? (
            <>
              <button
                type="button"
                onClick={openStartVisitModal}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Start visit
              </button>
              <p className="mt-1 text-sm text-navy/60">Mark that this patient is in the office for their appointment.</p>
            </>
          ) : (
            <p className="text-navy/80">
              <Link to={`/signin?returnTo=${encodeURIComponent(signInReturnTo)}`} className="text-sky-dark font-medium hover:underline">
                Sign in
              </Link>
              {" "}to start a patient visit or record treatment.
            </p>
          )}
        </div>
      )}

      {patient.currentVisitStartedAt && patient.currentVisitUseVoiceNotes && (
        <div className="mb-6 rounded-xl border-2 border-sky/40 bg-sky/5 p-4">
          <h3 className="text-sm font-semibold text-navy uppercase tracking-wide mb-1">Visit session — AI voice notes</h3>
          <p className="text-xs text-navy/60 mb-3">
            Patient identity is not stored with recordings. Notes are linked only to this visit for clinical use.
          </p>
          {isSpeechSupported ? (
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {!isListening ? (
                <button
                  type="button"
                  onClick={startListening}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2"
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-white" aria-hidden />
                  Start recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopListening}
                  className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light flex items-center gap-2"
                >
                  <span className="inline-flex h-2 w-2 rounded-full bg-red-400 animate-pulse" aria-hidden />
                  Stop recording
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateBulletPoints}
                disabled={!(patient.currentVisitNotes ?? "").trim()}
                className="px-4 py-2 bg-sky-dark text-white rounded-lg text-sm font-medium hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate bullet points
              </button>
              {isListening && (
                <span className="text-sm text-navy/70">Listening… (speak into your microphone)</span>
              )}
            </div>
          ) : (
            <p className="text-amber-700 text-sm mb-2">Microphone speech recognition is not supported in this browser. Use Chrome or Edge, or type notes below.</p>
          )}
          {speechError && (
            <p className="text-red-600 text-sm mb-2" role="alert">{speechError}</p>
          )}
          {interimTranscript && (
            <p className="text-sm text-navy/60 italic mb-2">{interimTranscript}</p>
          )}
          <textarea
            value={patient.currentVisitNotes ?? ""}
            onChange={(e) => saveCurrentVisitNotes(e.target.value)}
            onBlur={(e) => saveCurrentVisitNotes(e.target.value)}
            rows={8}
            placeholder="Transcript will appear here as you speak, or type notes manually. Click “Generate bullet points” for a concise clinical summary."
            className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white resize-y text-sm"
          />
        </div>
      )}

      {startVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="start-visit-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-md w-full">
            <h2 id="start-visit-title" className="text-lg font-semibold text-navy mb-4">Start visit</h2>
            <p className="text-sm text-navy/70 mb-4">Choose options before starting the visit.</p>
            <label className="flex items-start gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={startVisitUseVoiceNotes} onChange={(e) => setStartVisitUseVoiceNotes(e.target.checked)} className="mt-1 rounded border-sky/60" />
              <span className="text-sm text-navy">Use AI voice notes with patient consent (records conversation for clinical notes)</span>
            </label>
            {startVisitUseVoiceNotes && (
              <label className="flex items-start gap-2 mb-4 cursor-pointer">
                <input type="checkbox" checked={startVisitConsent} onChange={(e) => setStartVisitConsent(e.target.checked)} className="mt-1 rounded border-sky/60" />
                <span className="text-sm text-navy">Patient has given consent to record this conversation. Anonymity is maintained for the recording.</span>
              </label>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={() => { setStartVisitModal(false); setStartVisitUseVoiceNotes(false); setStartVisitConsent(false); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium">
                Cancel
              </button>
              <button type="button" onClick={startVisit} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
                Start visit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6 space-y-1">
        <CollapsibleSection id="demographics" title="Demographics" defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First name" value={patient.firstName} editing={!!editing && !!form} formValue={form?.firstName ?? ""} onChange={(v) => update("firstName", v)} required />
            <Field label="Last name" value={patient.lastName} editing={!!editing && !!form} formValue={form?.lastName ?? ""} onChange={(v) => update("lastName", v)} required />
            <Field label="Date of birth" value={formatDisplayDate(patient.dateOfBirth)} editing={!!editing && !!form} formValue={form?.dateOfBirth ?? ""} type="date" onChange={(v) => update("dateOfBirth", v)} required />
            <Field label="Phone" value={patient.phone ?? ""} editing={!!editing && !!form} formValue={form?.phone ?? ""} onChange={(v) => update("phone", v)} />
            <Field label="Email" value={patient.email ?? ""} editing={!!editing && !!form} formValue={form?.email ?? ""} type="email" onChange={(v) => update("email", v)} />
            <Field label="Address" value={patient.address ?? ""} editing={!!editing && !!form} formValue={form?.address ?? ""} onChange={(v) => update("address", v)} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="medical" title="Medical history" subtitle="Relevant for treatment safety (e.g. drug allergies, conditions affecting care)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Allergies" value={patient.allergies ?? ""} editing={!!editing && !!form} formValue={form?.allergies ?? ""} placeholder="e.g. Penicillin, latex" listId="patient-allergies-list" options={COMMON_ALLERGIES} onChange={(v) => update("allergies", v)} />
            <Field label="Medical conditions" value={patient.medicalConditions ?? ""} editing={!!editing && !!form} formValue={form?.medicalConditions ?? ""} placeholder="e.g. Diabetes, hypertension" listId="patient-medical-conditions-list" options={COMMON_MEDICAL_CONDITIONS} onChange={(v) => update("medicalConditions", v)} />
            <Field label="Current medications" value={patient.currentMedications ?? ""} editing={!!editing && !!form} formValue={form?.currentMedications ?? ""} placeholder="List current medications" listId="patient-current-medications-list" options={COMMON_CURRENT_MEDICATIONS} onChange={(v) => update("currentMedications", v)} />
            <Field label="Emergency contact name" value={patient.emergencyContactName ?? ""} editing={!!editing && !!form} formValue={form?.emergencyContactName ?? ""} onChange={(v) => update("emergencyContactName", v)} />
            <Field label="Emergency contact phone" value={patient.emergencyContactPhone ?? ""} editing={!!editing && !!form} formValue={form?.emergencyContactPhone ?? ""} onChange={(v) => update("emergencyContactPhone", v)} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="insurance" title="Insurance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={form ? "md:col-span-2" : ""}>
              <label className="block text-sm text-navy/70 mb-1">Insurance provider</label>
              {editing && form ? (
                <>
                  <select
                    value={TOP_INSURANCE_PROVIDERS.includes(form.insuranceProvider as (typeof TOP_INSURANCE_PROVIDERS)[number]) ? form.insuranceProvider : INSURANCE_OTHER}
                    onChange={(e) => {
                      const v = e.target.value;
                      update("insuranceProvider", v);
                      if (v !== INSURANCE_OTHER) setInsuranceOtherCustom("");
                    }}
                    className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white"
                  >
                    <option value="">Select provider</option>
                    {TOP_INSURANCE_PROVIDERS.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value={INSURANCE_OTHER}>{INSURANCE_OTHER}</option>
                  </select>
                  {(form.insuranceProvider === INSURANCE_OTHER || (form.insuranceProvider && !TOP_INSURANCE_PROVIDERS.includes(form.insuranceProvider as (typeof TOP_INSURANCE_PROVIDERS)[number]))) && (
                    <div className="mt-3">
                      <label className="block text-sm text-navy/70 mb-1">Custom provider name (free response)</label>
                      <input
                        type="text"
                        autoComplete="off"
                        list="patient-insurance-custom-list"
                        value={form.insuranceProvider === INSURANCE_OTHER ? insuranceOtherCustom : (form.insuranceProvider || "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (form.insuranceProvider === INSURANCE_OTHER) {
                            setInsuranceOtherCustom(val);
                          } else {
                            update("insuranceProvider", val);
                          }
                        }}
                        placeholder="Type your insurance provider name here"
                        className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy"
                      />
                      <datalist id="patient-insurance-custom-list">
                        {TOP_INSURANCE_PROVIDERS.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-navy">{patient.insuranceProvider || "—"}</p>
              )}
            </div>
            <Field label="Plan name" value={patient.insurancePlan ?? ""} editing={!!editing && !!form} formValue={form?.insurancePlan ?? ""} listId="patient-insurance-plan-list" options={INSURANCE_PLANS} onChange={(v) => update("insurancePlan", v)} />
            <Field label="Member ID" value={patient.insuranceMemberId ?? ""} editing={!!editing && !!form} formValue={form?.insuranceMemberId ?? ""} onChange={(v) => update("insuranceMemberId", v)} />
            <Field label="Group number" value={patient.insuranceGroupNumber ?? ""} editing={!!editing && !!form} formValue={form?.insuranceGroupNumber ?? ""} onChange={(v) => update("insuranceGroupNumber", v)} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="appointments" title="Appointments">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date of appointment" value={formatDisplayDate(patient.dateOfAppointment) + (patient.appointmentTime ? ` ${patient.appointmentTime}` : "")} editing={!!editing && !!form} formValue={form?.dateOfAppointment ?? ""} type="date" onChange={(v) => update("dateOfAppointment", v)} />
            <Field label="Appointment time" value={patient.appointmentTime ?? ""} editing={!!editing && !!form} formValue={form?.appointmentTime ?? ""} type="time" onChange={(v) => update("appointmentTime", v)} />
            <Field label="Date of next appointment" value={patient.dateOfNextAppointment ? formatDisplayDate(patient.dateOfNextAppointment) : ""} editing={!!editing && !!form} formValue={form?.dateOfNextAppointment ?? ""} type="date" onChange={(v) => update("dateOfNextAppointment", v)} />
            <Field label="Next appointment time" value={patient.nextAppointmentTime ?? ""} editing={!!editing && !!form} formValue={form?.nextAppointmentTime ?? ""} type="time" onChange={(v) => update("nextAppointmentTime", v)} />
            <div className={form?.appointmentType === "Other" ? "md:col-span-2" : ""}>
              <label className="block text-sm text-navy/70 mb-1">Appointment type</label>
              {editing && form ? (
                <>
                  <select
                    value={form.appointmentType ?? ""}
                    onChange={(e) => update("appointmentType", e.target.value)}
                    className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white"
                  >
                    <option value="">—</option>
                    {APPOINTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {form.appointmentType === "Other" && (
                    <div className="mt-2">
                      <label className="block text-sm text-navy/70 mb-1">Describe appointment type (free response)</label>
                      <input
                        type="text"
                        list="patient-appointment-type-other-list"
                        autoComplete="off"
                        value={form.appointmentTypeOther ?? ""}
                        onChange={(e) => update("appointmentTypeOther", e.target.value)}
                        placeholder="e.g. Implant consultation, TMJ follow-up"
                        className="w-full px-3 py-2 border border-sky/60 rounded-lg"
                      />
                      <datalist id="patient-appointment-type-other-list">
                        {APPOINTMENT_TYPE_OTHER.map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-navy">
                  {patient.appointmentType === "Other" && patient.appointmentTypeOther
                    ? `Other (${patient.appointmentTypeOther})`
                    : (patient.appointmentType || "—")}
                </p>
              )}
            </div>
            <Field label="Doctor (performing appointment)" value={patient.appointmentDoctor ?? ""} editing={!!editing && !!form} formValue={form?.appointmentDoctor ?? ""} placeholder="e.g. Dr. Smith" onChange={(v) => update("appointmentDoctor", v)} />
            <Field label="Duration (minutes)" value={patient.appointmentDurationMinutes != null ? String(patient.appointmentDurationMinutes) : ""} editing={!!editing && !!form} formValue={form?.appointmentDurationMinutes != null ? String(form.appointmentDurationMinutes) : ""} placeholder="e.g. 60" onChange={(v) => update("appointmentDurationMinutes", v === "" ? "" : v)} />
            <Field label="Room / operatory" value={patient.appointmentRoom ?? ""} editing={!!editing && !!form} formValue={form?.appointmentRoom ?? ""} placeholder="e.g. Op 1" listId="patient-room-list" options={COMMON_OPERATORIES} onChange={(v) => update("appointmentRoom", v)} />
            <Field label="Next appointment duration (min)" value={patient.nextAppointmentDurationMinutes != null ? String(patient.nextAppointmentDurationMinutes) : ""} editing={!!editing && !!form} formValue={form?.nextAppointmentDurationMinutes != null ? String(form.nextAppointmentDurationMinutes) : ""} placeholder="e.g. 30" onChange={(v) => update("nextAppointmentDurationMinutes", v === "" ? "" : v)} />
            <Field label="Next appointment room" value={patient.nextAppointmentRoom ?? ""} editing={!!editing && !!form} formValue={form?.nextAppointmentRoom ?? ""} placeholder="e.g. Op 2" listId="patient-next-room-list" options={COMMON_OPERATORIES} onChange={(v) => update("nextAppointmentRoom", v)} />
            <Field label="Recall / recurring (months)" value={patient.recallIntervalMonths != null ? String(patient.recallIntervalMonths) : ""} editing={!!editing && !!form} formValue={form?.recallIntervalMonths != null ? String(form.recallIntervalMonths) : ""} placeholder="e.g. 6 for 6-month prophy" onChange={(v) => update("recallIntervalMonths", v === "" ? "" : v)} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="images" title="Images & imaging" badge={images.length > 0 ? `${images.length} file${images.length !== 1 ? "s" : ""}` : undefined} subtitle="X-rays, radiographs, CT, MRI, photos. Upload from your device (stored with this chart).">
          {editing && form && (
            <div className="mb-4 p-4 bg-sky/10 rounded-lg border border-sky/30">
              <p className="text-sm font-medium text-navy mb-2">Add image</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[160px]">
                  <label className="block text-xs text-navy/70 mb-1">Label</label>
                  <input
                    type="text"
                    value={newImageLabel}
                    onChange={(e) => setNewImageLabel(e.target.value)}
                    placeholder="e.g. Panoramic X-ray Jan 2026"
                    list="patient-image-label-list"
                    autoComplete="off"
                    className="w-full px-3 py-2 border border-sky/60 rounded-lg text-sm"
                  />
                  <datalist id="patient-image-label-list">
                    {IMAGE_LABEL_SUGGESTIONS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div className="min-w-[120px]">
                  <label className="block text-xs text-navy/70 mb-1">Type</label>
                  <select
                    value={newImageType}
                    onChange={(e) => setNewImageType(e.target.value as PatientImage["type"])}
                    className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-sm"
                  >
                    {PATIENT_IMAGE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAddImage}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light"
                  >
                    Choose file
                  </button>
                </div>
              </div>
              <p className="text-xs text-navy/50 mt-2">Max {MAX_PATIENT_IMAGES} images, under {MAX_FILE_SIZE_MB} MB each.</p>
            </div>
          )}
          {!editing && images.length < MAX_PATIENT_IMAGES && (
            <button
              type="button"
              onClick={() => setAddImageModal(true)}
              className="mb-3 px-4 py-2 bg-sky/20 text-navy rounded-lg text-sm font-medium hover:bg-sky/30 border border-sky/40"
            >
              + Add image
            </button>
          )}
          {images.length === 0 ? (
            <p className="text-navy/60">No images attached. {editing && form ? "Use the form above to upload." : "Click “Add image” above to upload without editing the whole chart."}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => (
                <div key={img.id} className="border border-sky/40 rounded-lg overflow-hidden bg-navy/5">
                  <button
                    type="button"
                    onClick={() => setViewingImage(img)}
                    className="block w-full aspect-square p-1 focus:outline-none focus:ring-2 focus:ring-sky"
                  >
                    <img src={img.dataUrl} alt={img.label} className="w-full h-full object-contain" />
                  </button>
                  <div className="p-2">
                    <p className="text-sm font-medium text-navy truncate" title={img.label}>{img.label}</p>
                    <span className="text-xs text-navy/60 capitalize">{img.type}</span>
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setViewingImage(img)}
                        className="text-xs text-sky-dark font-medium hover:underline"
                      >
                        View
                      </button>
                      {editing && form && (
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="text-xs text-red-600 font-medium hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        <CollapsibleSection id="clinical" title="Clinical">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Chief complaint" value={patient.chiefComplaint ?? ""} editing={!!editing && !!form} formValue={form?.chiefComplaint ?? ""} placeholder="Reason for visit" listId="patient-chief-complaint-list" options={CHIEF_COMPLAINTS} onChange={(v) => update("chiefComplaint", v)} />
            <Field label="Last cleaning date" value={patient.lastCleaningDate ? formatDisplayDate(patient.lastCleaningDate) : ""} editing={!!editing && !!form} formValue={form?.lastCleaningDate ?? ""} type="date" onChange={(v) => update("lastCleaningDate", v)} />
            <Field label="Treatment plan" value={patient.treatmentPlan ?? ""} editing={!!editing && !!form} formValue={form?.treatmentPlan ?? ""} type="textarea" rows={3} preWrap placeholder="Planned treatment" onChange={(v) => update("treatmentPlan", v)} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection id="dentist-notes" title="Dentist's notes">
          <Field
            label=""
            value={patient.dentistNotes ?? ""}
            editing={!!editing && !!form}
            formValue={form?.dentistNotes ?? ""}
            type="textarea"
            rows={6}
            preWrap
            placeholder="Clinical notes, procedures performed, charting notes, etc."
            onChange={(v) => update("dentistNotes", v)}
          />
        </CollapsibleSection>

        <CollapsibleSection id="perio" title="Perio charting" subtitle="Pocket depths (PD), bleeding; numeric and graphic views. GumGauge device results (light %, health) auto-fill from Device Scan and show below.">
          <PerioChart
            exams={patient.perioExams ?? []}
            gumGaugeExams={patient.gumGaugeExams ?? []}
            onSaveExam={(exam) => {
              const newExam: PerioExam = { ...exam, id: crypto.randomUUID() };
              updatePatient(patient.id, { perioExams: [...(patient.perioExams ?? []), newExam] });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            onDeleteExam={(examId) => {
              updatePatient(patient.id, { perioExams: (patient.perioExams ?? []).filter((e) => e.id !== examId) });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            readOnly={!isSignedIn}
          />
        </CollapsibleSection>

        <CollapsibleSection id="restorative" title="Restorative chart" subtitle="Tooth-by-tooth conditions: caries, existing restorations, missing, planned. Click a tooth to set or change.">
          <ToothChart
            conditions={patient.toothConditions ?? []}
            onChange={(next) => {
              updatePatient(patient.id, { toothConditions: next });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            readOnly={!isSignedIn}
          />
        </CollapsibleSection>

        <CollapsibleSection id="clinical-notes" title="Clinical notes / progress notes" subtitle="Structured clinical notes with optional templates.">
          <ClinicalNotes
            notes={patient.clinicalNotes ?? []}
            onAdd={(entry) => {
              const newNote: ClinicalNoteEntry = { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
              updatePatient(patient.id, { clinicalNotes: [...(patient.clinicalNotes ?? []), newNote] });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            onDelete={(noteId) => {
              updatePatient(patient.id, { clinicalNotes: (patient.clinicalNotes ?? []).filter((n) => n.id !== noteId) });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            readOnly={!isSignedIn}
          />
        </CollapsibleSection>

        <CollapsibleSection id="prescriptions" title="Prescriptions" badge={patient.prescriptions?.length ? `${patient.prescriptions.length} Rx` : undefined} subtitle="Write prescriptions with sig, quantity, refills. Printable like a real Rx.">
          <PrescriptionView
            prescriptions={patient.prescriptions ?? []}
            patientName={`${patient.firstName} ${patient.lastName}`}
            patientDob={patient.dateOfBirth}
            defaultPrescriberName={signedInStaff ? `Dr. ${signedInStaff.firstName} ${signedInStaff.lastName}` : undefined}
            defaultPrescriberCredentials="DDS"
            signedInStaffId={signedInStaff?.id}
            onAdd={(rx) => {
              const newRx: Prescription = {
                ...rx,
                id: crypto.randomUUID(),
                signedAt: new Date().toISOString(),
              };
              updatePatient(patient.id, { prescriptions: [...(patient.prescriptions ?? []), newRx] });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            onDelete={(id) => {
              updatePatient(patient.id, { prescriptions: (patient.prescriptions ?? []).filter((p) => p.id !== id) });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            readOnly={!isSignedIn}
          />
        </CollapsibleSection>

        <CollapsibleSection id="billing" title="Billing" subtitle="Balance and payment history. For full billing (payment methods, send to insurance) use the Billing tab.">
          <div className="mb-3">
            <Link to="/dashboard/billing" className="text-sky-dark font-medium text-sm hover:underline">Open Billing tab →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy/70 mb-1">Balance due</label>
              {editing && form ? (
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.balanceDue ?? ""}
                  onChange={(e) => update("balanceDue", e.target.value === "" ? "" : e.target.value)}
                  className="w-full px-3 py-2 border border-sky/60 rounded-lg"
                />
              ) : (
                <p className="text-navy">
                  {patient.balanceDue != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(patient.balanceDue) : "—"}
                </p>
              )}
            </div>
          </div>
          {(patient.paymentHistory?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-navy/80 mb-1">Payment history</p>
              <ul className="space-y-1 text-sm">
                {(patient.paymentHistory ?? []).map((pay) => (
                  <li key={pay.id} className="flex justify-between text-navy/80">
                    <span>{formatDisplayDate(pay.date)}{pay.note ? ` — ${pay.note}` : ""}</span>
                    <span className="font-medium">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(pay.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {editing && form && (
            <button
              type="button"
              onClick={() => {
                const amount = prompt("Payment amount (e.g. 150)");
                if (amount === null || amount === "") return;
                const num = Number(amount);
                if (Number.isNaN(num) || num <= 0) return;
                const note = prompt("Note (optional)");
                const newPay = { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), amount: num, note: note ?? undefined };
                const nextHistory = [...(form.paymentHistory ?? []), newPay];
                const currentBalance = form.balanceDue ?? 0;
                updatePatient(patient.id, { paymentHistory: nextHistory, balanceDue: Math.max(0, currentBalance - num) });
                setPatient(getPatientById(patient.id)!);
                setForm(getPatientById(patient.id));
              }}
              className="mt-2 px-3 py-2 border border-green-600 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50"
            >
              + Record payment
            </button>
          )}
        </CollapsibleSection>

        <CollapsibleSection id="documents" title="Documents" badge={patient.documents?.length ? `${patient.documents.length}` : undefined} subtitle="Consent forms, referrals, lab slips, insurance documents.">
          <ul className="space-y-2 mb-3">
            {(patient.documents ?? []).map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-sky/20 last:border-0">
                <span className="text-navy font-medium">{doc.type}: {doc.title}</span>
                <span className="text-sm text-navy/70">{formatDisplayDate(doc.date)}</span>
                {isSignedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      updatePatient(patient.id, { documents: (patient.documents ?? []).filter((d) => d.id !== doc.id) });
                      setPatient(getPatientById(patient.id)!);
                      setForm(getPatientById(patient.id));
                    }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
          {isSignedIn && (
            <button
              type="button"
              onClick={() => {
                const typeRaw = prompt("Type (Consent, Referral, Lab, Insurance, Other)", "Consent");
                const title = prompt("Title", "");
                const date = prompt("Date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
                if (!title || !date) return;
                const validTypes: PatientDocument["type"][] = ["Consent", "Referral", "Lab", "Insurance", "Other"];
                const type = typeRaw && validTypes.includes(typeRaw as PatientDocument["type"]) ? (typeRaw as PatientDocument["type"]) : "Other";
                const newDoc: PatientDocument = { id: crypto.randomUUID(), type, title, date, addedAt: new Date().toISOString() };
                updatePatient(patient.id, { documents: [...(patient.documents ?? []), newDoc] });
                setPatient(getPatientById(patient.id)!);
                setForm(getPatientById(patient.id));
              }}
              className="px-3 py-2 border border-sky/60 rounded-lg text-sm font-medium text-navy hover:bg-sky/10"
            >
              + Add document
            </button>
          )}
        </CollapsibleSection>

        <CollapsibleSection id="treatment-plans" title="Treatment plans" subtitle="Formal plans with phases, procedures, and estimated costs (prices auto-fill from procedure codes). Printable.">
          <TreatmentPlanView
            plans={patient.treatmentPlans ?? []}
            patientName={`${patient.firstName} ${patient.lastName}`}
            onAddPlan={(plan) => {
              const newPlan: FormalTreatmentPlan = { ...plan, id: crypto.randomUUID() };
              updatePatient(patient.id, { treatmentPlans: [...(patient.treatmentPlans ?? []), newPlan] });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            onUpdatePlan={(id, updates) => {
              const next = (patient.treatmentPlans ?? []).map((p) => (p.id === id ? { ...p, ...updates } : p));
              updatePatient(patient.id, { treatmentPlans: next });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            onDeletePlan={(planId) => {
              updatePatient(patient.id, { treatmentPlans: (patient.treatmentPlans ?? []).filter((p) => p.id !== planId) });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            onAssignToBilling={(plan) => {
              const appointmentDate = patient.dateOfAppointment || new Date().toISOString().slice(0, 10);
              const now = new Date().toISOString();
              const lines: InvoiceLine[] = plan.phases.flatMap((ph) =>
                ph.procedures
                  .filter((pr) => pr.description.trim() || (pr.estimatedFee != null && pr.estimatedFee > 0))
                  .map((pr) => ({
                    id: crypto.randomUUID(),
                    appointmentDate,
                    procedureCode: pr.code,
                    description: pr.description || "Procedure",
                    amount: pr.estimatedFee ?? 0,
                    status: "Pending" as const,
                    addedAt: now,
                  }))
              );
              if (lines.length === 0) return;
              const existing = patient.invoiceLines ?? [];
              const total = lines.reduce((s, l) => s + l.amount, 0);
              updatePatient(patient.id, {
                invoiceLines: [...existing, ...lines],
                balanceDue: (patient.balanceDue ?? 0) + total,
              });
              setPatient(getPatientById(patient.id)!);
              setForm(getPatientById(patient.id));
            }}
            readOnly={!isSignedIn}
          />
        </CollapsibleSection>

        {(patient.visitHistory?.length ?? 0) > 0 && (
          <CollapsibleSection id="visit-history" title="Visit history" badge={`${patient.visitHistory?.length ?? 0} visit${(patient.visitHistory?.length ?? 0) !== 1 ? "s" : ""}`} subtitle="Time in office for past visits (catalogued when you end a visit).">
            <ul className="space-y-2">
              {[...(patient.visitHistory ?? [])].reverse().map((v, i) => (
                <li key={i} className="py-2 border-b border-sky/20 last:border-0 text-sm">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-navy/80">
                      {formatISODateTimeInTimezone(v.startedAt, timezone)}
                    </span>
                    <span className="text-navy font-medium">
                      {v.durationMinutes >= 60
                        ? `${Math.floor(v.durationMinutes / 60)} hr ${v.durationMinutes % 60} min`
                        : `${v.durationMinutes} min`}
                    </span>
                    {v.voiceNotesConsent && (
                      <span className="text-xs text-sky-dark bg-sky/20 px-1.5 py-0.5 rounded">Voice notes</span>
                    )}
                  </div>
                  {v.clinicalSummary && (
                    <p className="mt-1 text-navy/70 whitespace-pre-wrap text-xs">{v.clinicalSummary}</p>
                  )}
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}
      </div>

      {addImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-image-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-md w-full">
            <h2 id="add-image-title" className="text-lg font-semibold text-navy mb-4">Add image</h2>
            <p className="text-sm text-navy/70 mb-4">Add an image without editing the whole chart.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-navy/70 mb-1">Label</label>
                <input
                  type="text"
                  value={quickAddLabel}
                  onChange={(e) => setQuickAddLabel(e.target.value)}
                  placeholder="e.g. Panoramic X-ray Jan 2026"
                  list="patient-quick-add-label-list"
                  autoComplete="off"
                  className="w-full px-3 py-2 border border-sky/60 rounded-lg"
                />
                <datalist id="patient-quick-add-label-list">
                  {IMAGE_LABEL_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Type</label>
                <select
                  value={quickAddType}
                  onChange={(e) => setQuickAddType(e.target.value as PatientImage["type"])}
                  className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white"
                >
                  {PATIENT_IMAGE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  ref={quickAddFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleQuickAddImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => quickAddFileRef.current?.click()}
                  className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light"
                >
                  Choose file
                </button>
                <span className="ml-2 text-xs text-navy/60">Max {MAX_FILE_SIZE_MB} MB</span>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={() => { setAddImageModal(false); setQuickAddLabel(""); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setViewingImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="View image"
        >
          <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
            <img src={viewingImage.dataUrl} alt={viewingImage.label} className="max-w-full max-h-[90vh] object-contain rounded shadow-lg" />
            <p className="text-white text-center mt-2 text-sm">{viewingImage.label}</p>
            <button
              type="button"
              onClick={() => setViewingImage(null)}
              className="absolute -top-10 right-0 px-3 py-1 bg-white text-navy rounded font-medium hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
