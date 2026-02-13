import React, { useState } from "react";
import type { Prescription } from "../types";
import { formatDisplayDate } from "../utils/dateFormat";
import { MEDICATION_STRENGTHS, PRESCRIBER_CREDENTIALS } from "../constants/autocompleteSuggestions";

/** Common dental medications for quick select (user can type custom). */
const COMMON_DENTAL_MEDICATIONS = [
  "Amoxicillin",
  "Amoxicillin-Clavulanate",
  "Azithromycin",
  "Clindamycin",
  "Ibuprofen",
  "Acetaminophen",
  "Naproxen",
  "Hydrocodone-Acetaminophen",
  "Tramadol",
  "Penicillin VK",
  "Metronidazole",
  "Chlorhexidine gluconate",
  "Fluoride toothpaste",
  "Other",
];

interface PrescriptionViewProps {
  prescriptions: Prescription[];
  patientName: string;
  patientDob: string;
  /** Prescriber display name (e.g. from signed-in staff). */
  defaultPrescriberName?: string;
  defaultPrescriberCredentials?: string;
  defaultDeaNumber?: string;
  /** Staff ID when signing (optional). */
  signedInStaffId?: string;
  onAdd: (rx: Omit<Prescription, "id" | "signedAt">) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
}

export default function PrescriptionView({
  prescriptions,
  patientName,
  patientDob,
  defaultPrescriberName = "",
  defaultPrescriberCredentials = "DDS",
  defaultDeaNumber = "",
  signedInStaffId,
  onAdd,
  onDelete,
  readOnly = false,
}: PrescriptionViewProps) {
  const [adding, setAdding] = useState(false);
  const [medicationSelect, setMedicationSelect] = useState("Other");
  const [medicationCustom, setMedicationCustom] = useState("");
  const [strength, setStrength] = useState("");
  const [sig, setSig] = useState("");
  const [quantity, setQuantity] = useState("");
  const [refills, setRefills] = useState("0");
  const [prescriberName, setPrescriberName] = useState(defaultPrescriberName);
  const [prescriberCredentials, setPrescriberCredentials] = useState(defaultPrescriberCredentials);
  const [deaNumber, setDeaNumber] = useState(defaultDeaNumber);
  const [note, setNote] = useState("");
  const medication = medicationSelect === "Other" ? medicationCustom : medicationSelect;

  const handleAdd = () => {
    const q = parseInt(quantity, 10);
    const r = parseInt(refills, 10);
    if (!medication.trim() || !sig.trim() || Number.isNaN(q) || q < 1) return;
    onAdd({
      date: new Date().toISOString().slice(0, 10),
      medication: medication.trim(),
      strength: strength.trim() || undefined,
      sig: sig.trim(),
      quantity: q,
      refills: Number.isNaN(r) || r < 0 ? 0 : r,
      prescriberName: prescriberName.trim() || "Prescriber",
      prescriberCredentials: prescriberCredentials.trim() || undefined,
      deaNumber: deaNumber.trim() || undefined,
      prescribedByStaffId: signedInStaffId,
      note: note.trim() || undefined,
    });
    setAdding(false);
    setMedicationSelect("Other");
    setMedicationCustom("");
    setStrength("");
    setSig("");
    setQuantity("");
    setRefills("0");
    setPrescriberName(defaultPrescriberName);
    setPrescriberCredentials(defaultPrescriberCredentials);
    setDeaNumber(defaultDeaNumber);
    setNote("");
  };

  const buildPrintHtml = (rx: Prescription) => {
    const medLine = rx.strength ? `${rx.medication} ${rx.strength}` : rx.medication;
    return `
      <div class="rx-block" style="margin-top:1.5rem; padding:1rem; border:1px solid #333;">
        <p style="margin:0 0 0.5rem 0;"><strong>Patient:</strong> ${patientName} &nbsp; <strong>DOB:</strong> ${formatDisplayDate(patientDob)}</p>
        <p style="margin:0 0 0.5rem 0;"><strong>Date:</strong> ${formatDisplayDate(rx.date)}</p>
        <p style="margin:0 0 0.5rem 0; font-size:1.1em;"><strong>${medLine}</strong></p>
        <p style="margin:0 0 0.5rem 0;"><strong>Sig:</strong> ${rx.sig}</p>
        <p style="margin:0 0 0.5rem 0;"><strong>Quantity:</strong> ${rx.quantity} &nbsp; <strong>Refills:</strong> ${rx.refills}</p>
        <p style="margin:0.5rem 0 0 0;">_________________________</p>
        <p style="margin:0; font-size:0.95em;">${rx.prescriberName}${rx.prescriberCredentials ? `, ${rx.prescriberCredentials}` : ""}</p>
        ${rx.deaNumber ? `<p style="margin:0; font-size:0.85em;">DEA: ${rx.deaNumber}</p>` : ""}
      </div>`;
  };

  const handlePrint = (rx: Prescription) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Prescription - ${patientName}</title>
      <style>
        body { font-family: Georgia, serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
        .rx-block { font-size: 14px; }
      </style></head><body>
      <h2 style="margin-top:0;">Prescription</h2>
      ${buildPrintHtml(rx)}
      </body></html>
    `);
    win.document.close();
    win.print();
    win.close();
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light"
          >
            + New prescription
          </button>
        </div>
      )}

      {adding && (
        <div className="border-2 border-sky/40 rounded-xl p-4 bg-sky/5 space-y-4">
          <h4 className="font-medium text-navy">New prescription</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy/70 mb-1">Medication *</label>
              <select
                value={medicationSelect}
                onChange={(e) => setMedicationSelect(e.target.value)}
                className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white"
              >
                {COMMON_DENTAL_MEDICATIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {medicationSelect === "Other" && (
                <input
                  type="text"
                  value={medicationCustom}
                  onChange={(e) => setMedicationCustom(e.target.value)}
                  placeholder="Type medication name"
                  className="w-full mt-1 px-3 py-2 border border-sky/60 rounded-lg"
                />
              )}
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Strength / form</label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500mg capsule"
                list="rx-strength-list"
                autoComplete="off"
                className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              />
              <datalist id="rx-strength-list">
                {MEDICATION_STRENGTHS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-navy/70 mb-1">Sig (directions for use) *</label>
              <input
                type="text"
                value={sig}
                onChange={(e) => setSig(e.target.value)}
                placeholder="e.g. Take 1 tablet by mouth twice daily for 7 days"
                className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Quantity *</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 30"
                className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Refills</label>
              <input
                type="number"
                min={0}
                value={refills}
                onChange={(e) => setRefills(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Prescriber name *</label>
              <input
                type="text"
                value={prescriberName}
                onChange={(e) => setPrescriberName(e.target.value)}
                placeholder="e.g. Dr. Smith"
                className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Credentials</label>
              <input
                type="text"
                value={prescriberCredentials}
                onChange={(e) => setPrescriberCredentials(e.target.value)}
                placeholder="e.g. DDS"
                list="rx-credentials-list"
                autoComplete="off"
                className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              />
              <datalist id="rx-credentials-list">
                {PRESCRIBER_CREDENTIALS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">DEA number (if controlled)</label>
              <input
                type="text"
                value={deaNumber}
                onChange={(e) => setDeaNumber(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-navy/70 mb-1">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Take with food"
                className="w-full px-3 py-2 border border-sky/60 rounded-lg"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium">
              Sign &amp; save prescription
            </button>
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 border border-navy/30 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {prescriptions.length === 0 && !adding && (
        <p className="text-navy/60 text-sm">No prescriptions on file.</p>
      )}

      {prescriptions.map((rx) => (
        <div key={rx.id} className="border border-sky/40 rounded-xl p-4 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-medium text-navy">
                {rx.medication}
                {rx.strength ? ` ${rx.strength}` : ""}
              </p>
              <p className="text-sm text-navy/70">{formatDisplayDate(rx.date)} — {rx.prescriberName}{rx.prescriberCredentials ? `, ${rx.prescriberCredentials}` : ""}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePrint(rx)}
                className="px-3 py-1.5 border border-sky/60 rounded-lg text-sm font-medium hover:bg-sky/10"
              >
                Print
              </button>
              {!readOnly && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(rx.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-navy/80"><strong>Sig:</strong> {rx.sig}</p>
          <p className="text-sm text-navy/70">Quantity: {rx.quantity} &nbsp; Refills: {rx.refills}</p>
          {rx.note && <p className="text-xs text-navy/60 mt-1">{rx.note}</p>}
        </div>
      ))}
    </div>
  );
}
