import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getPatients } from "../storage";
import { getClinic } from "../storage/clinicStorage";
import { useTimezoneContext } from "../contexts/TimezoneContext";
import { useTodayInTimezone } from "../hooks/useAppTimezone";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function Analytics() {
  const clinic = getClinic();
  const { timezone } = useTimezoneContext();
  const today = useTodayInTimezone(timezone);
  const thisMonth = today.slice(0, 7);
  const patients = useMemo(() => getPatients(), []);

  const productionToday = useMemo(() => {
    return patients.reduce((sum, p) => sum + (p.paymentHistory ?? []).filter((pay) => pay.date === today).reduce((s, pay) => s + pay.amount, 0), 0);
  }, [patients, today]);
  const productionMonth = useMemo(() => {
    return patients.reduce((sum, p) => sum + (p.paymentHistory ?? []).filter((pay) => pay.date.startsWith(thisMonth)).reduce((s, pay) => s + pay.amount, 0), 0);
  }, [patients, thisMonth]);
  const totalOutstanding = useMemo(() => patients.reduce((s, p) => s + (p.balanceDue ?? 0), 0), [patients]);

  const recallDue = useMemo(() => {
    const now = new Date();
    return patients.filter((p) => {
      const interval = p.recallIntervalMonths ?? 6;
      const last = p.lastCleaningDate;
      if (!last) return false;
      const d = new Date(last + "T12:00:00");
      d.setMonth(d.getMonth() + interval);
      return d <= now;
    }).length;
  }, [patients]);
  const totalWithRecallInterval = patients.filter((p) => (p.recallIntervalMonths ?? 0) > 0 || (p.lastCleaningDate ?? "").length > 0).length;
  const recallDuePct = totalWithRecallInterval > 0 ? Math.round((recallDue / totalWithRecallInterval) * 100) : 0;

  const newPatientsThisMonth = useMemo(() => patients.filter((p) => p.createdAt.startsWith(thisMonth)).length, [patients, thisMonth]);

  const plansWithStatus = useMemo(() => {
    const plans = patients.flatMap((p) => (p.treatmentPlans ?? []).map((t) => ({ ...t, patientId: p.id })));
    const accepted = plans.filter((p) => p.status === "Accepted").length;
    const declined = plans.filter((p) => p.status === "Declined").length;
    const presented = accepted + declined;
    return { total: plans.length, accepted, declined, presented, acceptancePct: presented > 0 ? Math.round((accepted / presented) * 100) : 0 };
  }, [patients]);

  const totalScans = useMemo(() => patients.reduce((s, p) => s + (p.gumGaugeExams?.length ?? 0), 0), [patients]);

  if (!clinic) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-navy mb-2">Analytics</h1>
        <p className="text-navy/70 mb-6">Analytics are shown for the clinic assigned to this device.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 max-w-lg">
          <p className="text-amber-900 font-medium">No clinic assigned</p>
          <p className="text-amber-800/90 text-sm mt-1">Register your clinic or ask your admin to assign this device to a clinic. Then you can view analytics here.</p>
          <Link to="/dashboard/clinic" className="inline-block mt-4 px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light">Go to Clinic</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-2xl font-semibold text-navy">Analytics</h1>
        <p className="text-navy/70 text-sm font-medium">{clinic.name}</p>
      </div>
      <p className="text-navy/60 text-sm mb-6">Stats for this clinic (assigned to this device).</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">Total patients</p>
          <p className="text-2xl font-semibold text-navy mt-1">{patients.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">Production (today)</p>
          <p className="text-xl font-semibold text-navy mt-1">{formatCurrency(productionToday)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">Production (this month)</p>
          <p className="text-xl font-semibold text-navy mt-1">{formatCurrency(productionMonth)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">Total outstanding</p>
          <p className="text-xl font-semibold text-navy mt-1">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">Recall due</p>
          <p className="text-2xl font-semibold text-navy mt-1">{recallDue}</p>
          <p className="text-xs text-navy/60 mt-0.5">patients past due</p>
          <Link to="/dashboard/recall" className="text-xs text-sky-dark mt-1 inline-block hover:underline">View recall</Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">Recall due %</p>
          <p className="text-2xl font-semibold text-navy mt-1">{recallDuePct}%</p>
          <p className="text-xs text-navy/60 mt-0.5">of those with recall interval</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">New patients (this month)</p>
          <p className="text-2xl font-semibold text-navy mt-1">{newPatientsThisMonth}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">Case acceptance</p>
          <p className="text-2xl font-semibold text-navy mt-1">{plansWithStatus.acceptancePct}%</p>
          <p className="text-xs text-navy/60 mt-0.5">{plansWithStatus.accepted} accepted / {plansWithStatus.presented} presented</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">GumGauge scans (total)</p>
          <p className="text-2xl font-semibold text-navy mt-1">{totalScans}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">Treatment plans</p>
          <p className="text-2xl font-semibold text-navy mt-1">{plansWithStatus.total}</p>
          <p className="text-xs text-navy/60 mt-0.5">total plans on file</p>
        </div>
      </div>
    </div>
  );
}
