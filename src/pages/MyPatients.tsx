import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getPatients } from "../storage";
import { useAuth } from "../contexts/AuthContext";
import { formatDisplayDate } from "../utils/dateFormat";
import { STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS } from "../constants/staffPositions";

export default function MyPatients() {
  const { staff, isSignedIn, isAdmin } = useAuth();
  const allPatients = getPatients();
  const canSeeAssigned = staff && STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS.includes(staff.position as (typeof STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS)[number]);
  const assignedIds = staff?.assignedPatientIds ?? [];
  const myPatients = useMemo(
    () => allPatients.filter((p) => assignedIds.includes(p.id)),
    [allPatients, assignedIds]
  );

  if (!isSignedIn) {
    return (
      <div className="p-8">
        <p className="text-navy/70">Sign in to see your assigned patients.</p>
        <Link to="/signin" className="text-sky-dark font-medium mt-2 inline-block hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (isAdmin && !staff) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-navy mb-2">My patients</h1>
        <p className="text-navy/70">Demo mode. Use the Patients tab to view and manage patients.</p>
        <Link to="/dashboard/patients" className="text-sky-dark font-medium mt-2 inline-block hover:underline">
          Go to Patients
        </Link>
      </div>
    );
  }

  if (!canSeeAssigned) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-navy mb-2">My patients</h1>
        <p className="text-navy/70">
          Your role ({staff.position}) does not have an assigned patient list. Dentists, hygienists, and certain specialists can assign patients and view them here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-2">My patients</h1>
      <p className="text-navy/70 mb-6">
        Patients assigned to you ({staff.firstName} {staff.lastName}). Edit your staff profile to change assignments.
      </p>
      {myPatients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
          <p className="text-navy/60">No patients assigned yet. Assign patients in your staff profile (Staff → your name → Edit → Assigned patients).</p>
          <Link to="/dashboard/staff" className="text-sky-dark font-medium mt-2 inline-block hover:underline">
            Go to Staff
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sky/40 bg-sky/5">
                <th className="text-left px-4 py-3 font-semibold text-navy">Patient</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Appointment</th>
                <th className="text-left px-4 py-3 font-semibold text-navy">Next appointment</th>
                <th className="text-left px-4 py-3 font-semibold text-navy"></th>
              </tr>
            </thead>
            <tbody>
              {myPatients.map((p) => (
                <tr key={p.id} className="border-b border-sky/20 hover:bg-sky/5">
                  <td className="px-4 py-3">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="px-4 py-3 text-navy/80">
                    {formatDisplayDate(p.dateOfAppointment)}
                    {p.appointmentTime ? ` ${p.appointmentTime}` : ""}
                  </td>
                  <td className="px-4 py-3 text-navy/80">
                    {p.dateOfNextAppointment ? formatDisplayDate(p.dateOfNextAppointment) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/dashboard/patients/${p.id}`} className="text-sky-dark font-medium hover:underline">
                      Chart
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
