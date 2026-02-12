import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getPatients, getPatientById, updatePatient } from "../storage";
import type { Patient, PaymentMethod, InsuranceClaim, PaymentHistoryEntry } from "../types";
import { CDT_CODES } from "../constants/cdtCodes";
import { formatDisplayDate } from "../utils/dateFormat";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Billing() {
  const patients = getPatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [recordPaymentModal, setRecordPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [addPaymentMethodModal, setAddPaymentMethodModal] = useState(false);
  const [newMethodType, setNewMethodType] = useState<PaymentMethod["type"]>("Card");
  const [newMethodLastFour, setNewMethodLastFour] = useState("");
  const [newMethodNickname, setNewMethodNickname] = useState("");
  const [sendClaimModal, setSendClaimModal] = useState(false);
  const [claimDescription, setClaimDescription] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [claimCodes, setClaimCodes] = useState<string[]>([]);
  const [claimCodeToAdd, setClaimCodeToAdd] = useState("");

  const selectedPatient = selectedPatientId ? getPatientById(selectedPatientId) : null;
  const balanceDue = selectedPatient?.balanceDue ?? 0;
  const deductibleRemaining = selectedPatient?.insuranceDeductibleRemaining ?? 0;
  const deductibleAnnual = selectedPatient?.insuranceDeductibleAnnual ?? 0;
  const paymentMethods = selectedPatient?.paymentMethods ?? [];
  const paymentHistory = selectedPatient?.paymentHistory ?? [];
  const insuranceClaims = selectedPatient?.insuranceClaims ?? [];

  const handleRecordPayment = () => {
    if (!selectedPatient) return;
    const amount = Number(paymentAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    const newPay: PaymentHistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      amount,
      note: paymentNote.trim() || undefined,
    };
    const nextHistory = [...paymentHistory, newPay];
    const newBalance = Math.max(0, balanceDue - amount);
    updatePatient(selectedPatient.id, { paymentHistory: nextHistory, balanceDue: newBalance });
    setRecordPaymentModal(false);
    setPaymentAmount("");
    setPaymentNote("");
  };

  const handleAddPaymentMethod = () => {
    if (!selectedPatient) return;
    const method: PaymentMethod = {
      id: crypto.randomUUID(),
      type: newMethodType,
      lastFour: newMethodLastFour.trim() || undefined,
      nickname: newMethodNickname.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    const next = [...paymentMethods, method];
    updatePatient(selectedPatient.id, { paymentMethods: next });
    setAddPaymentMethodModal(false);
    setNewMethodType("Card");
    setNewMethodLastFour("");
    setNewMethodNickname("");
  };

  const removePaymentMethod = (id: string) => {
    if (!selectedPatient) return;
    updatePatient(selectedPatient.id, { paymentMethods: paymentMethods.filter((m) => m.id !== id) });
  };

  const handleSendClaim = () => {
    if (!selectedPatient) return;
    const amount = Number(claimAmount);
    if (Number.isNaN(amount) || amount < 0) return;
    const claim: InsuranceClaim = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      procedureCodes: claimCodes.length ? claimCodes : ["—"],
      description: claimDescription.trim() || "Insurance claim",
      amount,
      status: "Sent",
    };
    const next = [...insuranceClaims, claim];
    updatePatient(selectedPatient.id, { insuranceClaims: next });
    setSendClaimModal(false);
    setClaimDescription("");
    setClaimAmount("");
    setClaimCodes([]);
    setClaimCodeToAdd("");
  };

  const addClaimCode = () => {
    if (claimCodeToAdd.trim()) {
      setClaimCodes((c) => [...c, claimCodeToAdd.trim()]);
      setClaimCodeToAdd("");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-2">Billing</h1>
      <p className="text-navy/70 mb-6">
        View balance, insurance deductible, payment methods, and send claims to insurance. Procedure prices are based on standard fees (e.g. Cleaning $125).
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">Select patient</h2>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white"
          >
            <option value="">— Select patient —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
                {(p.balanceDue ?? 0) > 0 ? ` — ${formatCurrency(p.balanceDue!)} due` : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-navy/60 mt-2">
            Patients with a balance show the amount due in the list.
          </p>
        </div>

        {selectedPatient && (
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-navy">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </h2>
              <Link
                to={`/dashboard/patients/${selectedPatient.id}`}
                className="text-sky-dark font-medium text-sm hover:underline"
              >
                Open chart →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-sky/10 rounded-lg p-3 border border-sky/30">
                <p className="text-xs text-navy/70 uppercase">Balance due</p>
                <p className="text-lg font-semibold text-navy">{formatCurrency(balanceDue)}</p>
              </div>
              <div className="bg-sky/10 rounded-lg p-3 border border-sky/30">
                <p className="text-xs text-navy/70 uppercase">Deductible remaining</p>
                <p className="text-lg font-semibold text-navy">
                  {deductibleAnnual > 0 ? formatCurrency(deductibleRemaining) : "—"}
                </p>
                {deductibleAnnual > 0 && (
                  <p className="text-xs text-navy/60">of {formatCurrency(deductibleAnnual)} annual</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-navy">Insurance deductible</h3>
                <button
                  type="button"
                  onClick={() => {
                    const annual = prompt("Annual deductible amount (e.g. 50)", String(deductibleAnnual || ""));
                    if (annual === null) return;
                    const n = Number(annual);
                    if (!Number.isNaN(n) && n >= 0) {
                      const remaining = prompt("Remaining deductible (e.g. 25)", String(deductibleRemaining ?? n));
                      if (remaining !== null) {
                        const r = Number(remaining);
                        if (!Number.isNaN(r) && r >= 0)
                          updatePatient(selectedPatient.id, {
                            insuranceDeductibleAnnual: n,
                            insuranceDeductibleRemaining: r,
                          });
                      }
                    }
                  }}
                  className="text-sm text-sky-dark font-medium hover:underline"
                >
                  Edit
                </button>
              </div>
              <p className="text-sm text-navy/70">
                {deductibleAnnual > 0
                  ? `Patient has ${formatCurrency(deductibleRemaining)} remaining of ${formatCurrency(deductibleAnnual)} annual deductible.`
                  : "Set annual deductible and remaining to track insurance responsibility."}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-navy">Payment methods</h3>
                <button
                  type="button"
                  onClick={() => setAddPaymentMethodModal(true)}
                  className="px-3 py-1.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light"
                >
                  + Add payment method
                </button>
              </div>
              <p className="text-xs text-navy/60 mb-2">Store card or method for future visits.</p>
              {paymentMethods.length === 0 ? (
                <p className="text-navy/60 text-sm">None stored. Add one so the front office can use it for future visits.</p>
              ) : (
                <ul className="space-y-2">
                  {paymentMethods.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-2 border-b border-sky/20 last:border-0">
                      <span className="text-sm text-navy">
                        {m.type}
                        {m.lastFour ? ` •••• ${m.lastFour}` : ""}
                        {m.nickname ? ` (${m.nickname})` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePaymentMethod(m.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-navy">Record payment</h3>
                <button
                  type="button"
                  onClick={() => setRecordPaymentModal(true)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  + Record payment
                </button>
              </div>
              {paymentHistory.length === 0 ? (
                <p className="text-navy/60 text-sm">No payments recorded yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {[...paymentHistory].reverse().slice(0, 10).map((pay) => (
                    <li key={pay.id} className="flex justify-between text-navy/80">
                      <span>{formatDisplayDate(pay.date)}{pay.note ? ` — ${pay.note}` : ""}</span>
                      <span className="font-medium">{formatCurrency(pay.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-navy">Send to insurance</h3>
                <button
                  type="button"
                  onClick={() => setSendClaimModal(true)}
                  className="px-3 py-1.5 bg-sky-dark text-white rounded-lg text-sm font-medium hover:bg-navy"
                >
                  + Send claim
                </button>
              </div>
              <p className="text-xs text-navy/60 mb-2">For larger amounts (surgery, root canal, etc.).</p>
              {insuranceClaims.length === 0 ? (
                <p className="text-navy/60 text-sm">No claims yet.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {insuranceClaims.map((c) => (
                    <li key={c.id} className="flex justify-between items-center py-2 border-b border-sky/20 last:border-0">
                      <span className="text-navy/80">
                        {formatDisplayDate(c.date)} — {c.description} — {formatCurrency(c.amount)}
                      </span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        c.status === "Paid" ? "bg-green-100 text-green-800" :
                        c.status === "Sent" ? "bg-sky/20 text-navy" :
                        c.status === "Denied" ? "bg-red-100 text-red-800" : "bg-navy/10 text-navy"
                      }`}>
                        {c.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <h3 className="text-sm font-semibold text-navy mb-2">Procedure prices (reference)</h3>
              <p className="text-xs text-navy/60 mb-2">Standard fees used for estimates and claims.</p>
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-sky/10">
                      <th className="px-2 py-1 text-left">Code</th>
                      <th className="px-2 py-1 text-left">Description</th>
                      <th className="px-2 py-1 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CDT_CODES.filter((c) => c.defaultFee != null).map((c) => (
                      <tr key={c.code} className="border-t border-sky/20">
                        <td className="px-2 py-1">{c.code}</td>
                        <td className="px-2 py-1">{c.description}</td>
                        <td className="px-2 py-1 text-right font-medium">{formatCurrency(c.defaultFee!)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {recordPaymentModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="record-payment-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-sm w-full">
            <h2 id="record-payment-title" className="text-lg font-semibold text-navy mb-4">Record payment</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-navy/70 mb-1">Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-sky/60 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="e.g. Check #1234"
                  className="w-full px-3 py-2 border border-sky/60 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={() => { setRecordPaymentModal(false); setPaymentAmount(""); setPaymentNote(""); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium">Cancel</button>
              <button type="button" onClick={handleRecordPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">Record</button>
            </div>
          </div>
        </div>
      )}

      {addPaymentMethodModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-method-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-sm w-full">
            <h2 id="add-method-title" className="text-lg font-semibold text-navy mb-4">Add payment method</h2>
            <p className="text-sm text-navy/70 mb-4">Store for future visits. Do not enter full card numbers; use last 4 only.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-navy/70 mb-1">Type</label>
                <select value={newMethodType} onChange={(e) => setNewMethodType(e.target.value as PaymentMethod["type"])} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white">
                  <option value="Card">Card</option>
                  <option value="Check">Check</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Last 4 digits (optional)</label>
                <input type="text" maxLength={4} value={newMethodLastFour} onChange={(e) => setNewMethodLastFour(e.target.value.replace(/\D/g, ""))} placeholder="1234" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Nickname (optional)</label>
                <input type="text" value={newMethodNickname} onChange={(e) => setNewMethodNickname(e.target.value)} placeholder="e.g. Visa on file" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={() => setAddPaymentMethodModal(false)} className="px-4 py-2 border border-navy/30 rounded-lg font-medium">Cancel</button>
              <button type="button" onClick={handleAddPaymentMethod} className="px-4 py-2 bg-navy text-white rounded-lg font-medium">Add</button>
            </div>
          </div>
        </div>
      )}

      {sendClaimModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="send-claim-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-md w-full">
            <h2 id="send-claim-title" className="text-lg font-semibold text-navy mb-4">Send claim to insurance</h2>
            <p className="text-sm text-navy/70 mb-4">For surgery, root canal, or other larger procedures.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-navy/70 mb-1">Description</label>
                <input type="text" value={claimDescription} onChange={(e) => setClaimDescription(e.target.value)} placeholder="e.g. Root canal #3" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Procedure codes (CDT)</label>
                <div className="flex gap-2">
                  <select value={claimCodeToAdd} onChange={(e) => setClaimCodeToAdd(e.target.value)} className="flex-1 px-3 py-2 border border-sky/60 rounded-lg bg-white text-sm">
                    <option value="">— Add code —</option>
                    {CDT_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} {c.description} {c.defaultFee != null ? `$${c.defaultFee}` : ""}</option>
                    ))}
                  </select>
                  <button type="button" onClick={addClaimCode} className="px-3 py-2 bg-sky/20 text-navy rounded-lg text-sm font-medium">Add</button>
                </div>
                {claimCodes.length > 0 && (
                  <p className="text-xs text-navy/70 mt-1">Codes: {claimCodes.join(", ")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Amount ($)</label>
                <input type="number" min={0} step={0.01} value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={() => { setSendClaimModal(false); setClaimDescription(""); setClaimAmount(""); setClaimCodes([]); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium">Cancel</button>
              <button type="button" onClick={handleSendClaim} className="px-4 py-2 bg-sky-dark text-white rounded-lg font-medium">Send claim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
