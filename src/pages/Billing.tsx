import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getPatients, getPatientById, updatePatient } from "../storage";
import type { Patient, PaymentMethod, InsuranceClaim, PaymentHistoryEntry, InvoiceLine } from "../types";
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
  const [newMethodNameOnCard, setNewMethodNameOnCard] = useState("");
  const [newMethodExpiryMonth, setNewMethodExpiryMonth] = useState("");
  const [newMethodExpiryYear, setNewMethodExpiryYear] = useState("");
  const [sendClaimModal, setSendClaimModal] = useState(false);
  const [claimDescription, setClaimDescription] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [claimCodes, setClaimCodes] = useState<string[]>([]);
  const [claimCodeToAdd, setClaimCodeToAdd] = useState("");
  const [emailReceiptModal, setEmailReceiptModal] = useState(false);
  const [emailReceiptSent, setEmailReceiptSent] = useState(false);
  const [paymentUseInsurance, setPaymentUseInsurance] = useState<"outOfPocket" | "withInsurance" | "split">("outOfPocket");
  const [paymentOutOfPocket, setPaymentOutOfPocket] = useState("");
  const [paymentWithInsurance, setPaymentWithInsurance] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [deductibleAnnualInput, setDeductibleAnnualInput] = useState("");
  const [deductibleRemainingInput, setDeductibleRemainingInput] = useState("");

  const selectedPatient = selectedPatientId ? getPatientById(selectedPatientId) : null;
  const balanceDue = selectedPatient?.balanceDue ?? 0;
  const deductibleRemaining = selectedPatient?.insuranceDeductibleRemaining ?? 0;
  const deductibleAnnual = selectedPatient?.insuranceDeductibleAnnual ?? 0;
  const paymentMethods = selectedPatient?.paymentMethods ?? [];
  const paymentHistory = selectedPatient?.paymentHistory ?? [];
  const insuranceClaims = selectedPatient?.insuranceClaims ?? [];
  const invoiceLines = selectedPatient?.invoiceLines ?? [];

  const handleRecordPayment = () => {
    if (!selectedPatient) return;
    let amount: number;
    let amountOOP: number | undefined;
    let amountIns: number | undefined;
    if (paymentUseInsurance === "split") {
      const oop = Number(paymentOutOfPocket);
      const ins = Number(paymentWithInsurance);
      if (Number.isNaN(oop) || Number.isNaN(ins) || oop < 0 || ins < 0 || (oop === 0 && ins === 0)) return;
      amount = oop + ins;
      amountOOP = oop;
      amountIns = ins;
    } else if (paymentUseInsurance === "withInsurance") {
      amount = Number(paymentWithInsurance);
      if (Number.isNaN(amount) || amount < 0) return;
      amountIns = amount;
    } else {
      amount = Number(paymentAmount);
      if (Number.isNaN(amount) || amount <= 0) return;
      amountOOP = amount;
    }
    const newPay: PaymentHistoryEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      amount,
      note: paymentNote.trim() || undefined,
      paymentMethodId: paymentMethodId || undefined,
      amountOutOfPocket: amountOOP,
      amountWithInsurance: amountIns,
    };
    const nextHistory = [...paymentHistory, newPay];
    const newBalance = Math.max(0, balanceDue - amount);
    updatePatient(selectedPatient.id, { paymentHistory: nextHistory, balanceDue: newBalance });
    setRecordPaymentModal(false);
    setPaymentAmount("");
    setPaymentNote("");
    setPaymentOutOfPocket("");
    setPaymentWithInsurance("");
    setPaymentMethodId("");
    setPaymentUseInsurance("outOfPocket");
  };

  const handleAddPaymentMethod = () => {
    if (!selectedPatient) return;
    const mm = newMethodExpiryMonth.trim() ? parseInt(newMethodExpiryMonth, 10) : undefined;
    const yy = newMethodExpiryYear.trim() ? parseInt(newMethodExpiryYear, 10) : undefined;
    const method: PaymentMethod = {
      id: crypto.randomUUID(),
      type: newMethodType,
      lastFour: newMethodLastFour.trim() || undefined,
      nickname: newMethodNickname.trim() || undefined,
      nameOnCard: newMethodNameOnCard.trim() || undefined,
      expiryMonth: mm != null && mm >= 1 && mm <= 12 ? mm : undefined,
      expiryYear: yy != null && yy >= 2020 && yy <= 2050 ? yy : undefined,
      addedAt: new Date().toISOString(),
    };
    const next = [...paymentMethods, method];
    updatePatient(selectedPatient.id, { paymentMethods: next });
    setAddPaymentMethodModal(false);
    setNewMethodType("Card");
    setNewMethodLastFour("");
    setNewMethodNickname("");
    setNewMethodNameOnCard("");
    setNewMethodExpiryMonth("");
    setNewMethodExpiryYear("");
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

  const saveDeductible = () => {
    if (!selectedPatient) return;
    const annual = Number(deductibleAnnualInput);
    const remaining = Number(deductibleRemainingInput);
    if (!Number.isNaN(annual) && annual >= 0 && !Number.isNaN(remaining) && remaining >= 0)
      updatePatient(selectedPatient.id, { insuranceDeductibleAnnual: annual, insuranceDeductibleRemaining: remaining });
  };

  const chargesByDate = invoiceLines.reduce<Record<string, InvoiceLine[]>>((acc, line) => {
    const d = line.appointmentDate;
    if (!acc[d]) acc[d] = [];
    acc[d].push(line);
    return acc;
  }, {});
  const sortedAppointmentDates = Object.keys(chargesByDate).sort();

  React.useEffect(() => {
    if (selectedPatient) {
      setDeductibleAnnualInput(selectedPatient.insuranceDeductibleAnnual != null ? String(selectedPatient.insuranceDeductibleAnnual) : "");
      setDeductibleRemainingInput(selectedPatient.insuranceDeductibleRemaining != null ? String(selectedPatient.insuranceDeductibleRemaining) : "");
    }
  }, [selectedPatientId, selectedPatient?.insuranceDeductibleAnnual, selectedPatient?.insuranceDeductibleRemaining]);

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
              <div className="flex items-center gap-2">
                {selectedPatient.email && (
                  <button
                    type="button"
                    onClick={() => { setEmailReceiptSent(false); setEmailReceiptModal(true); }}
                    className="px-3 py-1.5 border border-sky/60 text-navy rounded-lg text-sm font-medium hover:bg-sky/10"
                  >
                    Email receipt / invoice
                  </button>
                )}
                <Link
                  to={`/dashboard/patients/${selectedPatient.id}`}
                  className="text-sky-dark font-medium text-sm hover:underline"
                >
                  Open chart →
                </Link>
              </div>
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
              <h3 className="text-sm font-semibold text-navy mb-3">Insurance deductible</h3>
              <p className="text-xs text-navy/60 mb-2">Enter values directly. Used to track insurance responsibility.</p>
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-xs text-navy/70 mb-0.5">Annual ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={deductibleAnnualInput}
                    onChange={(e) => setDeductibleAnnualInput(e.target.value)}
                    onBlur={saveDeductible}
                    className="w-28 px-3 py-2 border border-sky/60 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs text-navy/70 mb-0.5">Remaining ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={deductibleRemainingInput}
                    onChange={(e) => setDeductibleRemainingInput(e.target.value)}
                    onBlur={saveDeductible}
                    className="w-28 px-3 py-2 border border-sky/60 rounded-lg"
                  />
                </div>
                <button type="button" onClick={saveDeductible} className="mt-5 px-3 py-1.5 bg-sky/20 text-navy rounded-lg text-sm font-medium">Save</button>
              </div>
              {deductibleAnnual > 0 && (
                <p className="text-sm text-navy/70 mt-2">
                  Patient has {formatCurrency(deductibleRemaining)} remaining of {formatCurrency(deductibleAnnual)} annual.
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-navy">Charges by appointment date</h3>
                <Link to={`/dashboard/patients/${selectedPatient.id}`} className="text-xs text-sky-dark font-medium hover:underline">From chart</Link>
              </div>
              <p className="text-xs text-navy/60 mb-2">What the patient is being charged, grouped by appointment date. Add line items from the patient chart (Assign to Billing).</p>
              {sortedAppointmentDates.length === 0 ? (
                <p className="text-navy/60 text-sm">No charges yet. Assign procedures from the patient chart Treatment plans to fill the invoice.</p>
              ) : (
                <div className="space-y-3">
                  {sortedAppointmentDates.map((date) => (
                    <div key={date} className="border border-sky/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-navy/80 mb-2">{formatDisplayDate(date)}</p>
                      <ul className="space-y-1 text-sm">
                        {chargesByDate[date].map((line) => (
                          <li key={line.id} className="flex justify-between text-navy/90">
                            <span>{line.description}{line.procedureCode ? ` (${line.procedureCode})` : ""}</span>
                            <span className="font-medium">{formatCurrency(line.amount)}</span>
                          </li>
                        ))}
                        <li className="flex justify-between text-navy/70 pt-1 border-t border-sky/20">
                          <span>Subtotal</span>
                          <span className="font-medium">{formatCurrency(chargesByDate[date].reduce((s, l) => s + l.amount, 0))}</span>
                        </li>
                      </ul>
                    </div>
                  ))}
                </div>
              )}
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
              <p className="text-xs text-navy/60 mb-2">Store card or method so you can charge the patient. Enter name on card and expiry for charging.</p>
              {paymentMethods.length === 0 ? (
                <p className="text-navy/60 text-sm">None stored. Add one to charge the patient.</p>
              ) : (
                <ul className="space-y-2">
                  {paymentMethods.map((m) => (
                    <li key={m.id} className="flex items-center justify-between py-2 border-b border-sky/20 last:border-0">
                      <span className="text-sm text-navy">
                        {m.type}
                        {m.lastFour ? ` •••• ${m.lastFour}` : ""}
                        {m.nameOnCard ? ` — ${m.nameOnCard}` : ""}
                        {m.expiryMonth != null && m.expiryYear != null ? ` Exp ${String(m.expiryMonth).padStart(2, "0")}/${m.expiryYear}` : ""}
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
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-md w-full">
            <h2 id="record-payment-title" className="text-lg font-semibold text-navy mb-4">Record payment</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-navy/70 mb-1">Pay with</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="payType" checked={paymentUseInsurance === "outOfPocket"} onChange={() => setPaymentUseInsurance("outOfPocket")} />
                    <span className="text-sm">Out of pocket</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="payType" checked={paymentUseInsurance === "withInsurance"} onChange={() => setPaymentUseInsurance("withInsurance")} />
                    <span className="text-sm">Insurance</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" name="payType" checked={paymentUseInsurance === "split"} onChange={() => setPaymentUseInsurance("split")} />
                    <span className="text-sm">Split (both)</span>
                  </label>
                </div>
              </div>
              {paymentUseInsurance === "outOfPocket" && (
                <div>
                  <label className="block text-sm text-navy/70 mb-1">Amount ($)</label>
                  <input type="number" min={0} step={0.01} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                </div>
              )}
              {paymentUseInsurance === "withInsurance" && (
                <div>
                  <label className="block text-sm text-navy/70 mb-1">Amount from insurance ($)</label>
                  <input type="number" min={0} step={0.01} value={paymentWithInsurance} onChange={(e) => setPaymentWithInsurance(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                </div>
              )}
              {paymentUseInsurance === "split" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-navy/70 mb-1">Out of pocket ($)</label>
                    <input type="number" min={0} step={0.01} value={paymentOutOfPocket} onChange={(e) => setPaymentOutOfPocket(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-navy/70 mb-1">From insurance ($)</label>
                    <input type="number" min={0} step={0.01} value={paymentWithInsurance} onChange={(e) => setPaymentWithInsurance(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm text-navy/70 mb-1">Payment method used (optional)</label>
                <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white">
                  <option value="">— None —</option>
                  {paymentMethods.map((m) => (
                    <option key={m.id} value={m.id}>{m.type}{m.lastFour ? ` •••• ${m.lastFour}` : ""}{m.nickname ? ` (${m.nickname})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Note (optional)</label>
                <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="e.g. Check #1234" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button type="button" onClick={() => { setRecordPaymentModal(false); setPaymentAmount(""); setPaymentNote(""); setPaymentOutOfPocket(""); setPaymentWithInsurance(""); setPaymentMethodId(""); setPaymentUseInsurance("outOfPocket"); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium">Cancel</button>
              <button type="button" onClick={handleRecordPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">Record</button>
            </div>
          </div>
        </div>
      )}

      {addPaymentMethodModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-method-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-sm w-full">
            <h2 id="add-method-title" className="text-lg font-semibold text-navy mb-4">Add payment method</h2>
            <p className="text-sm text-navy/70 mb-4">Enter info needed to charge the patient. Do not store full card numbers; use last 4 only.</p>
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
                <label className="block text-sm text-navy/70 mb-1">Name on card</label>
                <input type="text" value={newMethodNameOnCard} onChange={(e) => setNewMethodNameOnCard(e.target.value)} placeholder="As it appears on card" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Last 4 digits</label>
                <input type="text" maxLength={4} value={newMethodLastFour} onChange={(e) => setNewMethodLastFour(e.target.value.replace(/\D/g, ""))} placeholder="1234" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-navy/70 mb-1">Expiry month</label>
                  <input type="number" min={1} max={12} value={newMethodExpiryMonth} onChange={(e) => setNewMethodExpiryMonth(e.target.value)} placeholder="MM" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-navy/70 mb-1">Expiry year</label>
                  <input type="number" min={2024} max={2050} value={newMethodExpiryYear} onChange={(e) => setNewMethodExpiryYear(e.target.value)} placeholder="YYYY" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                </div>
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

      {emailReceiptModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="email-receipt-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-sm w-full">
            <h2 id="email-receipt-title" className="text-lg font-semibold text-navy mb-4">Email receipt / invoice</h2>
            {emailReceiptSent ? (
              <p className="text-green-700 font-medium">Receipt sent to {selectedPatient.email}</p>
            ) : (
              <>
                <p className="text-sm text-navy/70 mb-4">
                  Send a receipt or invoice to the patient at <strong>{selectedPatient.email}</strong>. In production this would send an email; for demo you can open your mail client.
                </p>
                <a
                  href={`mailto:${selectedPatient.email}?subject=Receipt - ${selectedPatient.firstName} ${selectedPatient.lastName}&body=Thank you for your payment. Balance due: ${formatCurrency(balanceDue)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setEmailReceiptSent(true)}
                  className="inline-block px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light"
                >
                  Open email to patient
                </a>
              </>
            )}
            <div className="mt-4">
              <button type="button" onClick={() => { setEmailReceiptModal(false); setEmailReceiptSent(false); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium">Close</button>
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
