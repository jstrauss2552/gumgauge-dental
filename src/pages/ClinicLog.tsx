import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { getClinic, saveClinic, unassignClinic } from "../storage/clinicStorage";
import { getPendingClinicRegistrations, removePendingClinicRegistration, type PendingClinicRegistration } from "../storage/pendingClinicStorage";
import { getPatients, clearAllPatientVisitHistory } from "../storage";
import { getAuditEntries, clearAuditLog } from "../storage/auditStorage";
import { ADMIN_SESSION_KEY } from "../constants/admin";
import { formatDisplayDate } from "../utils/dateFormat";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export default function ClinicLog() {
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<ReturnType<typeof getClinic>>(null);
  const [pending, setPending] = useState<PendingClinicRegistration[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [confirmClearAudit, setConfirmClearAudit] = useState(false);
  const [confirmClearVisits, setConfirmClearVisits] = useState(false);

  const refresh = () => {
    setClinic(getClinic());
    setPending(getPendingClinicRegistrations());
  };

  useEffect(() => {
    try {
      setIsAdmin(sessionStorage.getItem(ADMIN_SESSION_KEY) === "1");
    } catch {
      setIsAdmin(false);
    }
    refresh();
  }, []);

  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />;
  }
  if (isAdmin === null) {
    return null;
  }

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
    navigate("/", { replace: true });
  };

  const handleApprove = (p: PendingClinicRegistration) => {
    saveClinic({
      name: p.name,
      address: p.address,
      city: p.city,
      state: p.state,
      zip: p.zip,
      phone: p.phone,
      deviceCount: p.deviceCount ?? 1,
    });
    removePendingClinicRegistration(p.id);
    refresh();
  };

  const handleClearAuditLog = () => {
    clearAuditLog();
    setConfirmClearAudit(false);
    refresh();
  };

  const handleClearAllVisitHistory = () => {
    clearAllPatientVisitHistory();
    setConfirmClearVisits(false);
    refresh();
  };

  const auditEntryCount = getAuditEntries().length;

  const patients = getPatients();
  const patientCount = patients.length;
  const totalScans = patients.reduce((s, pt) => s + (pt.gumGaugeExams?.length ?? 0), 0);
  const scanDates = patients.flatMap((pt) => (pt.gumGaugeExams ?? []).map((e) => e.scanDate));
  const uniqueDays = new Set(scanDates).size;
  const avgScansPerDay = uniqueDays > 0 ? (totalScans / uniqueDays).toFixed(1) : "0";
  const devices = clinic?.deviceCount ?? 0;
  const revenueTotal = patients.reduce((s, pt) => s + (pt.paymentHistory ?? []).reduce((sum, pay) => sum + pay.amount, 0), 0);
  const paymentsByMonth: Record<string, number> = {};
  patients.forEach((pt) => {
    (pt.paymentHistory ?? []).forEach((pay) => {
      const month = pay.date.slice(0, 7);
      paymentsByMonth[month] = (paymentsByMonth[month] ?? 0) + pay.amount;
    });
  });
  const monthsWithRevenue = Object.keys(paymentsByMonth).length;
  const revenuePerMonthAvg = monthsWithRevenue > 0 ? revenueTotal / monthsWithRevenue : 0;
  const location = [clinic?.city, clinic?.state, clinic?.zip].filter(Boolean).join(", ");

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-navy">Clinic Log</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 border border-navy/30 rounded-lg font-medium hover:bg-navy/5"
          >
            Log out (Admin)
          </button>
        </div>
        <p className="text-navy/70">
          Select and assign clinics from pending registrations. Live stats for this installation below.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
            <p className="text-xs text-navy/60 uppercase">Patients</p>
            <p className="text-2xl font-semibold text-navy">{patientCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
            <p className="text-xs text-navy/60 uppercase">Total scans</p>
            <p className="text-2xl font-semibold text-navy">{totalScans}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
            <p className="text-xs text-navy/60 uppercase">Avg scans/day</p>
            <p className="text-2xl font-semibold text-navy">{avgScansPerDay}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
            <p className="text-xs text-navy/60 uppercase">Devices</p>
            <p className="text-2xl font-semibold text-navy">{devices}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
            <p className="text-xs text-navy/60 uppercase">Revenue (total)</p>
            <p className="text-xl font-semibold text-navy">{formatCurrency(revenueTotal)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-4">
          <p className="text-xs text-navy/60 uppercase">Revenue per month (average)</p>
          <p className="text-xl font-semibold text-navy">{formatCurrency(revenuePerMonthAvg)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
          <h2 className="text-lg font-semibold text-navy mb-2">Admin actions</h2>
          <p className="text-sm text-navy/60 mb-4">Clear audit log or all patient visit history. These actions cannot be undone.</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {!confirmClearAudit ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearAudit(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50"
                >
                  Clear audit log ({auditEntryCount} entries)
                </button>
              ) : (
                <>
                  <button type="button" onClick={handleClearAuditLog} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">Confirm clear</button>
                  <button type="button" onClick={() => setConfirmClearAudit(false)} className="px-4 py-2 border border-navy/30 rounded-lg">Cancel</button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!confirmClearVisits ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearVisits(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50"
                >
                  Clear all patient visit history
                </button>
              ) : (
                <>
                  <button type="button" onClick={handleClearAllVisitHistory} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">Confirm clear</button>
                  <button type="button" onClick={() => setConfirmClearVisits(false)} className="px-4 py-2 border border-navy/30 rounded-lg">Cancel</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
          <h2 className="text-lg font-semibold text-navy mb-2">Pending registrations</h2>
          <p className="text-sm text-navy/60 mb-4">Clinics that submitted for approval. Approve to assign them to this device.</p>
          {pending.length === 0 ? (
            <p className="text-navy/60">No pending registrations.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-sky/20 last:border-0">
                  <div>
                    <p className="font-medium text-navy">{p.name}</p>
                    <p className="text-sm text-navy/70">
                      {[p.city, p.state, p.zip].filter(Boolean).join(", ")}
                      {p.deviceCount != null && ` · ${p.deviceCount} device(s)`}
                    </p>
                    <p className="text-xs text-navy/60">Submitted {formatDisplayDate(p.submittedAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApprove(p)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                  >
                    Approve & assign
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
          <h2 className="text-lg font-semibold text-navy mb-2">Assigned clinic (this device)</h2>
          <p className="text-sm text-navy/60 mb-4">
            In production, admin would see all clinics across all installations.
          </p>
          {clinic ? (
            <div className="flex flex-wrap items-start justify-between gap-4 py-3">
              <div>
                <p className="font-medium text-navy">{clinic.name}</p>
                {location && <p className="text-sm text-navy/70">{location}</p>}
                {clinic.address && <p className="text-sm text-navy/70">{clinic.address}</p>}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-navy/70">Devices</p>
                  <p className="text-xl font-semibold text-navy">{clinic.deviceCount ?? 1}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Unassign this clinic from this device? The clinic can be reassigned later from pending registrations.")) {
                      unassignClinic();
                      refresh();
                    }
                  }}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50"
                >
                  Unassign clinic
                </button>
              </div>
            </div>
          ) : (
            <p className="text-navy/60">No clinic assigned yet. Approve a pending registration above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
