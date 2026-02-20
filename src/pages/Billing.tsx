import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPatients, getPatientById, updatePatient } from "../storage";
import { getFeeForPlan, getFeeSchedule, addFeeScheduleEntry, deleteFeeScheduleEntry } from "../storage/feeScheduleStorage";
import { useAuth } from "../contexts/AuthContext";
import type { Patient, PaymentMethod, InsuranceClaim, PaymentHistoryEntry, InvoiceLine, Adjustment, ClaimPayment } from "../types";
import { CDT_CODES, getDefaultFeeForCode } from "../constants/cdtCodes";
import { CLAIM_OR_PROCEDURE_DESCRIPTIONS } from "../constants/autocompleteSuggestions";
import { formatDisplayDate } from "../utils/dateFormat";
import { getCardBrand, getLastFour } from "../utils/cardBrand";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Billing() {
  const { isAdmin } = useAuth();
  const patients = getPatients();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [recordPaymentModal, setRecordPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [addPaymentMethodModal, setAddPaymentMethodModal] = useState(false);
  const [newMethodType, setNewMethodType] = useState<PaymentMethod["type"]>("Card");
  const [newMethodCardNumber, setNewMethodCardNumber] = useState("");
  const [newMethodExpiryMonth, setNewMethodExpiryMonth] = useState("");
  const [newMethodExpiryYear, setNewMethodExpiryYear] = useState("");
  const [sendClaimModal, setSendClaimModal] = useState(false);
  const [claimDescription, setClaimDescription] = useState("");
  const [claimAmount, setClaimAmount] = useState("");
  const [claimCodes, setClaimCodes] = useState<string[]>([]);
  const [claimCodeToAdd, setClaimCodeToAdd] = useState("");
  const [emailReceiptModal, setEmailReceiptModal] = useState(false);
  const [emailReceiptSent, setEmailReceiptSent] = useState(false);
  const [eligibilityModal, setEligibilityModal] = useState(false);
  const [paymentUseInsurance, setPaymentUseInsurance] = useState<"outOfPocket" | "withInsurance" | "split">("outOfPocket");
  const [paymentOutOfPocket, setPaymentOutOfPocket] = useState("");
  const [paymentWithInsurance, setPaymentWithInsurance] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [addChargesModal, setAddChargesModal] = useState(false);
  const [chargeAppointmentDate, setChargeAppointmentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedProcedureCodes, setSelectedProcedureCodes] = useState<Set<string>>(new Set());
  const [procedureAmountOverrides, setProcedureAmountOverrides] = useState<Record<string, string>>({});
  const [writeOffModal, setWriteOffModal] = useState(false);
  const [writeOffAmount, setWriteOffAmount] = useState("");
  const [writeOffReason, setWriteOffReason] = useState("");
  const [writeOffType, setWriteOffType] = useState<Adjustment["type"]>("Write-off");
  const [billingRefresh, setBillingRefresh] = useState(0);
  const [eobModal, setEobModal] = useState(false);
  const [eobClaimId, setEobClaimId] = useState<string | null>(null);
  const [eobPaidAmount, setEobPaidAmount] = useState("");
  const [eobAllowedAmount, setEobAllowedAmount] = useState("");
  const [eobAdjustmentAmount, setEobAdjustmentAmount] = useState("");
  const [eobPatientResponsibility, setEobPatientResponsibility] = useState("");
  const [eobPaymentDate, setEobPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [feeSchedulePlan, setFeeSchedulePlan] = useState("");
  const [feeScheduleCode, setFeeScheduleCode] = useState("");
  const [feeScheduleFee, setFeeScheduleFee] = useState("");

  const selectedPatient = selectedPatientId ? getPatientById(selectedPatientId) : null;
  const balanceDue = selectedPatient?.balanceDue ?? 0;
  const paymentMethods = selectedPatient?.paymentMethods ?? [];
  const paymentHistory = selectedPatient?.paymentHistory ?? [];
  const insuranceClaims = selectedPatient?.insuranceClaims ?? [];
  const invoiceLines = selectedPatient?.invoiceLines ?? [];
  const adjustments = selectedPatient?.adjustments ?? [];

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
    setBillingRefresh((k) => k + 1);
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
    const patientName = `${selectedPatient.firstName} ${selectedPatient.lastName}`.trim();
    let lastFour: string | undefined;
    let cardBrand: string | undefined;
    if (newMethodType === "Card" && newMethodCardNumber.replace(/\D/g, "").length >= 4) {
      lastFour = getLastFour(newMethodCardNumber);
      cardBrand = getCardBrand(newMethodCardNumber) ?? undefined;
    }
    const method: PaymentMethod = {
      id: crypto.randomUUID(),
      type: newMethodType,
      lastFour,
      cardBrand,
      nameOnCard: patientName || undefined,
      expiryMonth: mm != null && mm >= 1 && mm <= 12 ? mm : undefined,
      expiryYear: yy != null && yy >= 2020 && yy <= 2050 ? yy : undefined,
      addedAt: new Date().toISOString(),
    };
    const next = [...paymentMethods, method];
    updatePatient(selectedPatient.id, { paymentMethods: next });
    setBillingRefresh((k) => k + 1);
    setAddPaymentMethodModal(false);
    setNewMethodType("Card");
    setNewMethodCardNumber("");
    setNewMethodExpiryMonth("");
    setNewMethodExpiryYear("");
  };

  const removePaymentMethod = (id: string) => {
    if (!selectedPatient) return;
    updatePatient(selectedPatient.id, { paymentMethods: paymentMethods.filter((m) => m.id !== id) });
    setBillingRefresh((k) => k + 1);
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
    setBillingRefresh((k) => k + 1);
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

  const toggleProcedureSelection = (code: string) => {
    setSelectedProcedureCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const setProcedureAmount = (code: string, value: string) => {
    setProcedureAmountOverrides((prev) => ({ ...prev, [code]: value }));
  };

  const getChargeAmountForCode = (code: string): number => {
    const override = procedureAmountOverrides[code];
    if (override !== undefined && override !== "") {
      const n = Number(override);
      if (!Number.isNaN(n) && n >= 0) return n;
    }
    const planId = selectedPatient?.insurancePlan ?? "Default";
    const feeScheduleFee = getFeeForPlan(planId, code);
    if (feeScheduleFee != null) return feeScheduleFee;
    return getDefaultFeeForCode(code) ?? 0;
  };

  const handleWriteOff = () => {
    if (!selectedPatient) return;
    const amount = Number(writeOffAmount);
    if (Number.isNaN(amount) || amount <= 0 || !writeOffReason.trim()) return;
    const now = new Date().toISOString();
    const newAdj: Adjustment = {
      id: crypto.randomUUID(),
      date: now.slice(0, 10),
      amount,
      reason: writeOffReason.trim(),
      type: writeOffType,
      addedAt: now,
    };
    const nextAdj = [...adjustments, newAdj];
    const newBalance = Math.max(0, (selectedPatient.balanceDue ?? 0) - amount);
    updatePatient(selectedPatient.id, { adjustments: nextAdj, balanceDue: newBalance });
    setWriteOffModal(false);
    setWriteOffAmount("");
    setWriteOffReason("");
    setWriteOffType("Write-off");
    setBillingRefresh((k) => k + 1);
  };

  const openEobModal = (claimId: string) => {
    setEobClaimId(claimId);
    setEobPaidAmount("");
    setEobAllowedAmount("");
    setEobAdjustmentAmount("");
    setEobPatientResponsibility("");
    setEobPaymentDate(new Date().toISOString().slice(0, 10));
    setEobModal(true);
  };

  const feeScheduleEntries = getFeeSchedule();

  const handleAddFeeScheduleEntry = () => {
    const plan = feeSchedulePlan.trim();
    const code = feeScheduleCode.trim();
    const fee = Number(feeScheduleFee);
    if (!plan || !code || Number.isNaN(fee) || fee < 0) return;
    addFeeScheduleEntry({ planIdentifier: plan, procedureCode: code, fee });
    setFeeSchedulePlan("");
    setFeeScheduleCode("");
    setFeeScheduleFee("");
    setBillingRefresh((k) => k + 1);
  };

  const handleRecordEob = () => {
    if (!selectedPatient || !eobClaimId) return;
    const paidAmount = Number(eobPaidAmount);
    if (Number.isNaN(paidAmount) || paidAmount < 0) return;
    const claim = insuranceClaims.find((c) => c.id === eobClaimId);
    if (!claim) return;
    const now = new Date().toISOString();
    const newPayment: ClaimPayment = {
      id: crypto.randomUUID(),
      claimId: eobClaimId,
      paidAmount,
      allowedAmount: eobAllowedAmount.trim() ? Number(eobAllowedAmount) : undefined,
      adjustmentAmount: eobAdjustmentAmount.trim() ? Number(eobAdjustmentAmount) : undefined,
      patientResponsibility: eobPatientResponsibility.trim() ? Number(eobPatientResponsibility) : undefined,
      paymentDate: eobPaymentDate,
      addedAt: now,
    };
    const existingPayments = claim.claimPayments ?? [];
    const totalPaid = existingPayments.reduce((s, p) => s + p.paidAmount, 0) + paidAmount;
    const newStatus: InsuranceClaim["status"] =
      totalPaid >= claim.amount ? "Paid" : totalPaid > 0 ? "Partially paid" : claim.status;
    const nextClaims = insuranceClaims.map((c) =>
      c.id === eobClaimId
        ? { ...c, claimPayments: [...existingPayments, newPayment], status: newStatus }
        : c
    );
    const newBalance = Math.max(0, (selectedPatient.balanceDue ?? 0) - paidAmount);
    const newPayEntry: PaymentHistoryEntry = {
      id: crypto.randomUUID(),
      date: eobPaymentDate,
      amount: paidAmount,
      note: `Insurance EOB: ${claim.description}`,
      amountWithInsurance: paidAmount,
    };
    updatePatient(selectedPatient.id, {
      insuranceClaims: nextClaims,
      paymentHistory: [...paymentHistory, newPayEntry],
      balanceDue: newBalance,
    });
    setBillingRefresh((k) => k + 1);
    setEobModal(false);
    setEobClaimId(null);
  };

  const handleAddChargesToTab = () => {
    if (!selectedPatient || selectedProcedureCodes.size === 0) return;
    const now = new Date().toISOString();
    const newLines: InvoiceLine[] = Array.from(selectedProcedureCodes).map((code) => {
      const cdt = CDT_CODES.find((c) => c.code === code);
      const amount = getChargeAmountForCode(code);
      return {
        id: crypto.randomUUID(),
        appointmentDate: chargeAppointmentDate,
        procedureCode: code,
        description: cdt?.description ?? code,
        amount,
        status: "Pending" as const,
        addedAt: now,
      };
    });
    const total = newLines.reduce((s, l) => s + l.amount, 0);
    const existing = selectedPatient.invoiceLines ?? [];
    updatePatient(selectedPatient.id, {
      invoiceLines: [...existing, ...newLines],
      balanceDue: (selectedPatient.balanceDue ?? 0) + total,
    });
    setAddChargesModal(false);
    setSelectedProcedureCodes(new Set());
    setProcedureAmountOverrides({});
    setChargeAppointmentDate(new Date().toISOString().slice(0, 10));
    setBillingRefresh((k) => k + 1);
  };

  const chargesByDate = invoiceLines.reduce<Record<string, InvoiceLine[]>>((acc, line) => {
    const d = line.appointmentDate;
    if (!acc[d]) acc[d] = [];
    acc[d].push(line);
    return acc;
  }, {});
  const sortedAppointmentDates = Object.keys(chargesByDate).sort();


  const allPatients = getPatients();
  const productionThisMonth = allPatients.reduce((s, p) => s + (p.paymentHistory ?? []).filter((pay) => pay.date.startsWith(new Date().toISOString().slice(0, 7))).reduce((sum, pay) => sum + pay.amount, 0), 0);
  const totalOutstanding = allPatients.reduce((s, p) => s + (p.balanceDue ?? 0), 0);

  const agingReport = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    allPatients.forEach((p) => {
      (p.invoiceLines ?? []).forEach((line) => {
        const status = line.status ?? "Pending";
        if (status === "Paid") return;
        const apptDate = new Date(line.appointmentDate);
        apptDate.setHours(0, 0, 0, 0);
        const days = Math.floor((today.getTime() - apptDate.getTime()) / (24 * 60 * 60 * 1000));
        const amount = line.amount ?? 0;
        if (days <= 30) buckets["0-30"] += amount;
        else if (days <= 60) buckets["31-60"] += amount;
        else if (days <= 90) buckets["61-90"] += amount;
        else buckets["90+"] += amount;
      });
    });
    return buckets;
  }, [allPatients, billingRefresh]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-2">Billing</h1>
      <p className="text-navy/70 mb-6">
        View balance, payment methods, and send claims to insurance. Procedure prices are based on standard fees (e.g. Cleaning $125).
      </p>

      {isAdmin && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <p className="text-xs text-navy/60 uppercase">Production (this month)</p>
              <p className="text-xl font-semibold text-navy">{formatCurrency(productionThisMonth)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <p className="text-xs text-navy/60 uppercase">Total outstanding</p>
              <p className="text-xl font-semibold text-navy">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
            <h3 className="text-sm font-semibold text-navy mb-3">Aging report (outstanding by service date)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-sky/10 rounded-lg p-3 border border-sky/30">
                <p className="text-xs text-navy/70">0–30 days</p>
                <p className="text-lg font-semibold text-navy">{formatCurrency(agingReport["0-30"])}</p>
              </div>
              <div className="bg-sky/10 rounded-lg p-3 border border-sky/30">
                <p className="text-xs text-navy/70">31–60 days</p>
                <p className="text-lg font-semibold text-navy">{formatCurrency(agingReport["31-60"])}</p>
              </div>
              <div className="bg-sky/10 rounded-lg p-3 border border-sky/30">
                <p className="text-xs text-navy/70">61–90 days</p>
                <p className="text-lg font-semibold text-navy">{formatCurrency(agingReport["61-90"])}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-navy/70">90+ days</p>
                <p className="text-lg font-semibold text-navy">{formatCurrency(agingReport["90+"])}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            Or pick from patients with a balance below.
          </p>
          {(() => {
            const withBalance = patients.filter((p) => (p.balanceDue ?? 0) > 0).sort((a, b) => (b.balanceDue ?? 0) - (a.balanceDue ?? 0));
            if (withBalance.length === 0) return <p className="text-xs text-navy/50 mt-2">No patients with an unpaid balance.</p>;
            return (
              <ul className="mt-3 border border-sky/30 rounded-lg divide-y divide-sky/20 max-h-48 overflow-y-auto">
                {withBalance.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-sky/10 transition-colors ${selectedPatientId === p.id ? "bg-sky/20 font-medium text-navy" : "text-navy/90"}`}
                    >
                      <span className="font-medium">{p.firstName} {p.lastName}</span>
                      <span className="ml-2 text-navy/70">{formatCurrency(p.balanceDue ?? 0)} due</span>
                    </button>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>

        {selectedPatient && (
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-navy">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEligibilityModal(true)}
                  className="px-3 py-1.5 border border-sky/60 text-navy rounded-lg text-sm font-medium hover:bg-sky/10"
                >
                  Check eligibility
                </button>
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

            {/* Account summary: balance + write-off + adjustments */}
            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <h3 className="text-sm font-semibold text-navy mb-3">Account summary</h3>
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="bg-sky/10 rounded-lg p-3 border border-sky/30">
                  <p className="text-xs text-navy/70 uppercase tracking-wide">Balance due</p>
                  <p className="text-xl font-semibold text-navy mt-0.5">{formatCurrency(balanceDue)}</p>
                </div>
                {balanceDue > 0 && (
                  <button
                    type="button"
                    onClick={() => { setWriteOffModal(true); setWriteOffAmount(""); setWriteOffReason(""); setWriteOffType("Write-off"); }}
                    className="px-3 py-1.5 border border-amber-500 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50"
                  >
                    Write-off / adjustment
                  </button>
                )}
              </div>
              {adjustments.length > 0 && (
                <div className="mt-2 pt-2 border-t border-sky/20">
                  <p className="text-xs font-medium text-navy/80 mb-1">Adjustments</p>
                  <ul className="text-sm space-y-1 text-navy/80">
                    {adjustments.map((a) => (
                      <li key={a.id}>{formatDisplayDate(a.date)} — {a.type}: {formatCurrency(a.amount)} — {a.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Primary & secondary insurance */}
            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <h3 className="text-sm font-semibold text-navy mb-3">Insurance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-navy/70 uppercase mb-1">Primary</p>
                  <p className="text-sm text-navy">{selectedPatient.insuranceProvider || "—"} {selectedPatient.insurancePlan ? `(${selectedPatient.insurancePlan})` : ""}</p>
                  {selectedPatient.insuranceMemberId && <p className="text-xs text-navy/70">ID: {selectedPatient.insuranceMemberId}</p>}
                </div>
                <div>
                  <p className="text-xs font-medium text-navy/70 uppercase mb-1">Secondary</p>
                  <p className="text-sm text-navy">{selectedPatient.insuranceProvider2 || "—"} {selectedPatient.insurancePlan2 ? `(${selectedPatient.insurancePlan2})` : ""}</p>
                  {selectedPatient.insuranceMemberId2 && <p className="text-xs text-navy/70">ID: {selectedPatient.insuranceMemberId2}</p>}
                  {(selectedPatient.insuranceDeductibleAnnual2 != null || selectedPatient.insuranceDeductibleRemaining2 != null) && (
                    <p className="text-xs text-navy/70">Deductible: {selectedPatient.insuranceDeductibleRemaining2 ?? "—"} / {selectedPatient.insuranceDeductibleAnnual2 ?? "—"} remaining</p>
                  )}
                  <Link to={`/dashboard/patients/${selectedPatient.id}`} className="text-xs text-sky-dark font-medium hover:underline mt-1 inline-block">Edit on chart</Link>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-navy">Charges by appointment date</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setAddChargesModal(true); setChargeAppointmentDate(new Date().toISOString().slice(0, 10)); setSelectedProcedureCodes(new Set()); setProcedureAmountOverrides({}); }}
                    className="px-3 py-1.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light"
                  >
                    + Add charges
                  </button>
                  <Link to={`/dashboard/patients/${selectedPatient.id}`} className="text-xs text-sky-dark font-medium hover:underline">From chart</Link>
                </div>
              </div>
              <p className="text-xs text-navy/60 mb-2">What the patient is being charged, grouped by appointment date. Add procedures below or from the patient chart (Assign to Billing).</p>
              {sortedAppointmentDates.length === 0 ? (
                <p className="text-navy/60 text-sm">No charges yet. Click “Add charges” to add procedures to this patient’s tab, or assign from Treatment plans on the chart.</p>
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

            {/* Payments: methods on file + record payment + history */}
            <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
              <h3 className="text-sm font-semibold text-navy mb-3">Payments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-navy/80 uppercase tracking-wide">Payment methods on file</span>
                    <button type="button" onClick={() => setAddPaymentMethodModal(true)} className="px-2.5 py-1.5 bg-navy text-white rounded-lg text-xs font-medium hover:bg-navy-light">+ Add</button>
                  </div>
                  {paymentMethods.length === 0 ? (
                    <p className="text-sm text-navy/60">No payment methods stored. Add a card or method to apply payments.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {paymentMethods.map((m) => (
                        <li key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-sky/5 border border-sky/20 text-sm">
                          <span className="text-navy">
                            {m.cardBrand || m.type}{m.lastFour ? ` •••• ${m.lastFour}` : ""}
                            {m.nameOnCard ? ` — ${m.nameOnCard}` : ""}
                            {m.expiryMonth != null && m.expiryYear != null ? ` Exp ${String(m.expiryMonth).padStart(2, "0")}/${m.expiryYear}` : ""}
                          </span>
                          <button type="button" onClick={() => removePaymentMethod(m.id)} className="text-xs text-red-600 hover:underline ml-2">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-navy/80 uppercase tracking-wide">Record payment</span>
                    <button type="button" onClick={() => setRecordPaymentModal(true)} className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">+ Record payment</button>
                  </div>
                  <p className="text-xs text-navy/60 mb-2">Apply payment to this patient&apos;s balance. You can select their posted balance in the modal.</p>
                  {paymentHistory.length === 0 ? (
                    <p className="text-sm text-navy/60">No payments recorded yet.</p>
                  ) : (
                    <ul className="space-y-1 text-sm border border-sky/20 rounded-lg divide-y divide-sky/20 max-h-40 overflow-y-auto">
                      {[...paymentHistory].reverse().slice(0, 10).map((pay) => (
                        <li key={pay.id} className="flex justify-between px-3 py-2 text-navy/90">
                          <span>{formatDisplayDate(pay.date)}{pay.note ? ` — ${pay.note}` : ""}</span>
                          <span className="font-medium">{formatCurrency(pay.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
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
                    <li key={c.id} className="py-2 border-b border-sky/20 last:border-0">
                      <div className="flex justify-between items-center gap-2 flex-wrap">
                        <span className="text-navy/80">
                          {formatDisplayDate(c.date)} — {c.description} — {formatCurrency(c.amount)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            c.status === "Paid" ? "bg-green-100 text-green-800" :
                            c.status === "Partially paid" ? "bg-amber-100 text-amber-800" :
                            c.status === "Sent" ? "bg-sky/20 text-navy" :
                            c.status === "Denied" ? "bg-red-100 text-red-800" : "bg-navy/10 text-navy"
                          }`}>
                            {c.status}
                          </span>
                          {(c.status === "Sent" || c.status === "Partially paid") && (
                            <button type="button" onClick={() => openEobModal(c.id)} className="text-xs text-sky-dark font-medium hover:underline">Record EOB</button>
                          )}
                        </span>
                      </div>
                      {(c.claimPayments?.length ?? 0) > 0 && (
                        <ul className="mt-1 ml-2 text-xs text-navy/70 space-y-0.5">
                          {c.claimPayments!.map((p) => (
                            <li key={p.id}>{formatDisplayDate(p.paymentDate)} — {formatCurrency(p.paidAmount)} paid{p.patientResponsibility != null ? `; patient resp. ${formatCurrency(p.patientResponsibility)}` : ""}</li>
                          ))}
                        </ul>
                      )}
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

            {isAdmin && (
              <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
                <h3 className="text-sm font-semibold text-navy mb-2">Fee schedule overrides</h3>
                <p className="text-xs text-navy/60 mb-2">Override default fee by plan (e.g. insurance plan name). Used when adding charges.</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <input type="text" value={feeSchedulePlan} onChange={(e) => setFeeSchedulePlan(e.target.value)} placeholder="Plan (e.g. PPO-A)" className="px-2 py-1.5 border border-sky/60 rounded-lg text-sm w-28" />
                  <select value={feeScheduleCode} onChange={(e) => setFeeScheduleCode(e.target.value)} className="px-2 py-1.5 border border-sky/60 rounded-lg text-sm bg-white w-32">
                    <option value="">— Code —</option>
                    {CDT_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                  <input type="number" min={0} step={0.01} value={feeScheduleFee} onChange={(e) => setFeeScheduleFee(e.target.value)} placeholder="Fee $" className="px-2 py-1.5 border border-sky/60 rounded-lg text-sm w-20" />
                  <button type="button" onClick={handleAddFeeScheduleEntry} disabled={!feeSchedulePlan.trim() || !feeScheduleCode || Number(feeScheduleFee) < 0} className="px-3 py-1.5 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-50">Add</button>
                </div>
                {feeScheduleEntries.length === 0 ? (
                  <p className="text-xs text-navy/50">No overrides. Add plan + code + fee above.</p>
                ) : (
                  <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                    {feeScheduleEntries.map((e) => (
                      <li key={e.id} className="flex justify-between items-center py-1 border-b border-sky/20">
                        <span className="text-navy/90">{e.planIdentifier} — {e.procedureCode}: {formatCurrency(e.fee)}</span>
                        <button type="button" onClick={() => { deleteFeeScheduleEntry(e.id); setBillingRefresh((k) => k + 1); }} className="text-red-600 hover:underline">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {recordPaymentModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="record-payment-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-md w-full">
            <h2 id="record-payment-title" className="text-lg font-semibold text-navy mb-2">Record payment</h2>
            <p className="text-sm text-navy/70 mb-4">Apply a payment to {selectedPatient.firstName} {selectedPatient.lastName}&apos;s account.</p>
            <div className="mb-4 p-3 bg-sky/10 rounded-lg border border-sky/30">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-navy">Posted balance due</span>
                <span className="text-lg font-semibold text-navy">{formatCurrency(balanceDue)}</span>
              </div>
              {balanceDue > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const bal = balanceDue.toFixed(2);
                    setPaymentAmount(bal);
                    setPaymentWithInsurance(paymentUseInsurance === "split" ? "0" : bal);
                    setPaymentOutOfPocket(paymentUseInsurance === "split" ? bal : "0");
                  }}
                  className="mt-2 w-full py-2 px-3 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light"
                >
                  Use full balance ({formatCurrency(balanceDue)})
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-2">Payment type</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="payType" checked={paymentUseInsurance === "outOfPocket"} onChange={() => setPaymentUseInsurance("outOfPocket")} className="text-navy" />
                    <span className="text-sm text-navy">Out of pocket</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="payType" checked={paymentUseInsurance === "withInsurance"} onChange={() => setPaymentUseInsurance("withInsurance")} className="text-navy" />
                    <span className="text-sm text-navy">Insurance</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="payType" checked={paymentUseInsurance === "split"} onChange={() => setPaymentUseInsurance("split")} className="text-navy" />
                    <span className="text-sm text-navy">Split (both)</span>
                  </label>
                </div>
              </div>
              {paymentUseInsurance === "outOfPocket" && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Amount ($)</label>
                  <input type="number" min={0} step={0.01} value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                </div>
              )}
              {paymentUseInsurance === "withInsurance" && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Amount from insurance ($)</label>
                  <input type="number" min={0} step={0.01} value={paymentWithInsurance} onChange={(e) => setPaymentWithInsurance(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                </div>
              )}
              {paymentUseInsurance === "split" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Out of pocket ($)</label>
                    <input type="number" min={0} step={0.01} value={paymentOutOfPocket} onChange={(e) => setPaymentOutOfPocket(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">From insurance ($)</label>
                    <input type="number" min={0} step={0.01} value={paymentWithInsurance} onChange={(e) => setPaymentWithInsurance(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Payment method (optional)</label>
                <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
                  <option value="">— None —</option>
                  {paymentMethods.map((m) => (
                    <option key={m.id} value={m.id}>{m.cardBrand || m.type}{m.lastFour ? ` •••• ${m.lastFour}` : ""} — {m.nameOnCard || "Card"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Note (optional)</label>
                <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="e.g. Check #1234" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-sky/30">
              <button type="button" onClick={() => { setRecordPaymentModal(false); setPaymentAmount(""); setPaymentNote(""); setPaymentOutOfPocket(""); setPaymentWithInsurance(""); setPaymentMethodId(""); setPaymentUseInsurance("outOfPocket"); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium text-navy hover:bg-sky/10">Cancel</button>
              <button type="button" onClick={handleRecordPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Record payment</button>
            </div>
          </div>
        </div>
      )}

      {addPaymentMethodModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-method-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-md w-full">
            <h2 id="add-method-title" className="text-lg font-semibold text-navy mb-1">Add payment method</h2>
            <p className="text-sm text-navy/70 mb-4">Card will be saved for {selectedPatient.firstName} {selectedPatient.lastName}. Card type is detected from the number.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Payment type</label>
                <select value={newMethodType} onChange={(e) => setNewMethodType(e.target.value as PaymentMethod["type"])} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
                  <option value="Card">Card</option>
                  <option value="Check">Check</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {newMethodType === "Card" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Card number</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={newMethodCardNumber}
                      onChange={(e) => setNewMethodCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19))}
                      placeholder="Enter full card number"
                      className="w-full px-3 py-2 border border-sky/60 rounded-lg font-mono"
                    />
                    {newMethodCardNumber.replace(/\D/g, "").length >= 4 && getCardBrand(newMethodCardNumber) && (
                      <p className="text-xs text-navy/60 mt-1">Detected: {getCardBrand(newMethodCardNumber)}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">Expiration month</label>
                      <select value={newMethodExpiryMonth} onChange={(e) => setNewMethodExpiryMonth(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
                        <option value="">Select month</option>
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy mb-1">Expiration year</label>
                      <select value={newMethodExpiryYear} onChange={(e) => setNewMethodExpiryYear(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
                        <option value="">Select year</option>
                        {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() + i).map((y) => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-sky/30">
              <button type="button" onClick={() => { setAddPaymentMethodModal(false); setNewMethodCardNumber(""); setNewMethodExpiryMonth(""); setNewMethodExpiryYear(""); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium text-navy hover:bg-sky/10">Cancel</button>
              <button type="button" onClick={handleAddPaymentMethod} className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light">Save payment method</button>
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
                <input type="text" value={claimDescription} onChange={(e) => setClaimDescription(e.target.value)} placeholder="e.g. Root canal #3" list="billing-claim-description-list" autoComplete="off" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                <datalist id="billing-claim-description-list">
                  {CLAIM_OR_PROCEDURE_DESCRIPTIONS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
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

      {eligibilityModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="eligibility-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-md w-full">
            <h2 id="eligibility-title" className="text-lg font-semibold text-navy mb-4">Insurance eligibility (simulated)</h2>
            <p className="text-sm text-navy/70 mb-4">
              For {selectedPatient.firstName} {selectedPatient.lastName}. In production this would query the payer.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-navy/70">Preventive coverage</span><span className="font-medium">100%</span></div>
              <div className="flex justify-between"><span className="text-navy/70">Basic coverage</span><span className="font-medium">80%</span></div>
              <div className="flex justify-between"><span className="text-navy/70">Major coverage</span><span className="font-medium">50%</span></div>
            </div>
            <button type="button" onClick={() => setEligibilityModal(false)} className="mt-6 px-4 py-2 border border-navy/30 rounded-lg font-medium">Close</button>
          </div>
        </div>
      )}

      {addChargesModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-charges-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
            <h2 id="add-charges-title" className="text-lg font-semibold text-navy mb-2">Add charges to tab</h2>
            <p className="text-sm text-navy/70 mb-3">Multi-select procedures to add to {selectedPatient.firstName} {selectedPatient.lastName}&apos;s invoice. Amounts use default fees; you can override per line.</p>
            <div className="mb-3">
              <label className="block text-sm text-navy/70 mb-1">Appointment date for these charges</label>
              <input
                type="date"
                value={chargeAppointmentDate}
                onChange={(e) => setChargeAppointmentDate(e.target.value)}
                className="w-full max-w-[180px] px-3 py-2 border border-sky/60 rounded-lg"
              />
            </div>
            <div className="border border-sky/30 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
              <div className="bg-sky/10 px-3 py-2 flex justify-between text-xs font-medium text-navy/80 border-b border-sky/30">
                <span>Procedure</span>
                <span className="w-24 text-right">Amount ($)</span>
              </div>
              <ul className="overflow-y-auto flex-1 divide-y divide-sky/20 max-h-[280px]">
                {CDT_CODES.map((c) => (
                  <li key={c.code} className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-sky/5">
                    <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProcedureCodes.has(c.code)}
                        onChange={() => toggleProcedureSelection(c.code)}
                        className="rounded border-sky/60"
                      />
                      <span className="text-sm text-navy truncate" title={`${c.code} ${c.description}`}>
                        {c.code} — {c.description}
                      </span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={selectedProcedureCodes.has(c.code) ? (procedureAmountOverrides[c.code] ?? String(getChargeAmountForCode(c.code))) : ""}
                      onChange={(e) => setProcedureAmount(c.code, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={!selectedProcedureCodes.has(c.code)}
                      className="w-24 px-2 py-1.5 border border-sky/60 rounded text-sm text-right disabled:bg-sky/10 disabled:text-navy/60"
                      placeholder={String(getChargeAmountForCode(c.code))}
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-sky/30 pt-3">
              <p className="text-sm text-navy/70">
                {selectedProcedureCodes.size === 0 ? "Select one or more procedures" : `Selected: ${selectedProcedureCodes.size} — Total: ${formatCurrency(Array.from(selectedProcedureCodes).reduce((s, code) => s + getChargeAmountForCode(code), 0))}`}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setAddChargesModal(false); setSelectedProcedureCodes(new Set()); setProcedureAmountOverrides({}); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium">Cancel</button>
                <button type="button" onClick={handleAddChargesToTab} disabled={selectedProcedureCodes.size === 0} className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed">Add to tab</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {writeOffModal && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="writeoff-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-md w-full">
            <h2 id="writeoff-title" className="text-lg font-semibold text-navy mb-2">Write-off / adjustment</h2>
            <p className="text-sm text-navy/70 mb-4">Reduce balance by this amount. Balance due: {formatCurrency(balanceDue)}.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Type</label>
                <select value={writeOffType} onChange={(e) => setWriteOffType(e.target.value as Adjustment["type"])} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
                  <option value="Write-off">Write-off</option>
                  <option value="Adjustment">Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Amount ($)</label>
                <input type="number" min={0} step={0.01} value={writeOffAmount} onChange={(e) => setWriteOffAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Reason (required)</label>
                <input type="text" value={writeOffReason} onChange={(e) => setWriteOffReason(e.target.value)} placeholder="e.g. Courtesy discount" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-sky/30">
              <button type="button" onClick={() => { setWriteOffModal(false); setWriteOffAmount(""); setWriteOffReason(""); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium text-navy hover:bg-sky/10">Cancel</button>
              <button type="button" onClick={handleWriteOff} disabled={!writeOffAmount.trim() || !writeOffReason.trim() || Number(writeOffAmount) <= 0} className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed">Apply</button>
            </div>
          </div>
        </div>
      )}

      {eobModal && selectedPatient && eobClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="eob-title">
          <div className="bg-white rounded-xl shadow-xl border border-sky/40 p-6 max-w-md w-full">
            <h2 id="eob-title" className="text-lg font-semibold text-navy mb-2">Record EOB / claim payment</h2>
            <p className="text-sm text-navy/70 mb-4">
              {insuranceClaims.find((c) => c.id === eobClaimId)?.description ?? "Claim"} — enter payment from insurance.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Payment date</label>
                <input type="date" value={eobPaymentDate} onChange={(e) => setEobPaymentDate(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Paid amount ($) — applied to balance</label>
                <input type="number" min={0} step={0.01} value={eobPaidAmount} onChange={(e) => setEobPaidAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Allowed amount ($, optional)</label>
                <input type="number" min={0} step={0.01} value={eobAllowedAmount} onChange={(e) => setEobAllowedAmount(e.target.value)} placeholder="—" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Adjustment ($, optional)</label>
                <input type="number" step={0.01} value={eobAdjustmentAmount} onChange={(e) => setEobAdjustmentAmount(e.target.value)} placeholder="—" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Patient responsibility ($, optional)</label>
                <input type="number" min={0} step={0.01} value={eobPatientResponsibility} onChange={(e) => setEobPatientResponsibility(e.target.value)} placeholder="—" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-sky/30">
              <button type="button" onClick={() => { setEobModal(false); setEobClaimId(null); }} className="px-4 py-2 border border-navy/30 rounded-lg font-medium text-navy hover:bg-sky/10">Cancel</button>
              <button type="button" onClick={handleRecordEob} disabled={eobPaidAmount.trim() === "" || Number(eobPaidAmount) < 0} className="px-4 py-2 bg-sky-dark text-white rounded-lg font-medium hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed">Record EOB</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
