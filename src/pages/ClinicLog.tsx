import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { getClinic, saveClinic } from "../storage/clinicStorage";
import { getPendingClinicRegistrations, removePendingClinicRegistration, type PendingClinicRegistration } from "../storage/pendingClinicStorage";
import { getPatients } from "../storage";
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
            <div className="flex justify-between items-start gap-4 py-3">
              <div>
                <p className="font-medium text-navy">{clinic.name}</p>
                {location && <p className="text-sm text-navy/70">{location}</p>}
                {clinic.address && <p className="text-sm text-navy/70">{clinic.address}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm text-navy/70">Devices</p>
                <p className="text-xl font-semibold text-navy">{clinic.deviceCount ?? 1}</p>
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
