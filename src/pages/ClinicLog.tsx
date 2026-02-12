import React, { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { getClinic } from "../storage/clinicStorage";
import { ADMIN_SESSION_KEY } from "../constants/admin";

export default function ClinicLog() {
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<ReturnType<typeof getClinic>>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setIsAdmin(sessionStorage.getItem(ADMIN_SESSION_KEY) === "1");
    } catch {
      setIsAdmin(false);
    }
    setClinic(getClinic());
  }, []);

  if (isAdmin === false) {
    return <Navigate to="/dashboard" replace />;
  }
  if (isAdmin === null) {
    return null; // brief check, avoid flash
  }

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
    navigate("/", { replace: true });
  };

  const location = [clinic?.city, clinic?.state, clinic?.zip].filter(Boolean).join(", ");

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-semibold text-navy">Clinic Log</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 border border-navy/30 rounded-lg font-medium hover:bg-navy/5"
          >
            Log out (Admin)
          </button>
        </div>
        <p className="text-navy/70 mb-6">
          View clinics using GumGauge, locations, and device counts. This tab is only visible when logged in as admin.
        </p>
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
          <h2 className="text-lg font-semibold text-navy mb-2">Clinics</h2>
          <p className="text-sm text-navy/60 mb-4">
            This view shows the clinic registered on this device. In production, GumGauge admin would see all clinics across all installations.
          </p>
          {clinic ? (
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4 py-3 border-b border-sky/20">
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
              <p className="text-sm text-navy/60">
                Total: <strong>1</strong> clinic, <strong>{clinic.deviceCount ?? 1}</strong> device(s).
              </p>
            </div>
          ) : (
            <p className="text-navy/60">No clinic registered yet. Clinics register via the app&apos;s Clinic page.</p>
          )}
        </div>
      </div>
    </div>
  );
}
