import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPatients } from "../storage";
import { getClinic } from "../storage/clinicStorage";
import { formatDisplayDate, formatISODateTimeInTimezone } from "../utils/dateFormat";
import { useTimezoneContext } from "../contexts/TimezoneContext";
import { useClock, useTodayInTimezone } from "../hooks/useAppTimezone";

export default function Dashboard() {
  const clinic = getClinic();
  const { timezone } = useTimezoneContext();
  const today = useTodayInTimezone(timezone);
  const { full } = useClock(timezone);
  const [patients, setPatients] = useState(() => getPatients());
  useEffect(() => {
    setPatients(getPatients());
  }, []);

  const inProgressPatients = patients
    .filter((p) => p.currentVisitStartedAt)
    .sort((a, b) => (b.currentVisitStartedAt ?? "").localeCompare(a.currentVisitStartedAt ?? ""));
  const todayAppointments = patients
    .filter((p) => p.dateOfAppointment === today)
    .sort((a, b) => (a.appointmentTime || "00:00").localeCompare(b.appointmentTime || "00:00"));
  const upcomingNext = patients
    .filter((p) => p.dateOfNextAppointment && p.dateOfNextAppointment >= today)
    .sort((a, b) => {
      const d = a.dateOfNextAppointment.localeCompare(b.dateOfNextAppointment);
      if (d !== 0) return d;
      return (a.nextAppointmentTime || "00:00").localeCompare(b.nextAppointmentTime || "00:00");
    })
    .slice(0, 5);

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h1 className="text-2xl font-semibold text-navy">Dashboard</h1>
        {clinic?.name && (
          <p className="text-navy/70 text-sm font-medium">{clinic.name}</p>
        )}
      </div>
      <p className="text-navy/70 mb-1">{full}</p>
      <p className="text-navy/50 text-sm mb-4">Live · based on selected time zone</p>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Link to="/dashboard/patients/new" className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light inline-block">
          + Add patient
        </Link>
        <Link to="/dashboard/analytics" className="px-4 py-2 border border-sky/60 rounded-lg font-medium text-navy hover:bg-sky/10 inline-block">
          Analytics
        </Link>
        <span className="text-navy/60 text-sm">
          {inProgressPatients.length} in progress · {todayAppointments.length} today
        </span>
      </div>

      <div className="bg-green-50 rounded-xl shadow-sm border-2 border-green-200 p-6 mb-6">
        <h2 className="text-lg font-medium text-green-900 mb-1">Visits in progress</h2>
        <p className="text-sm text-green-800/70 mb-4">Patients currently in the office — visible to all dentists and front office staff.</p>
        {inProgressPatients.length === 0 ? (
          <p className="text-green-800/70">No visits in progress.</p>
        ) : (
          <ul className="space-y-2">
            {inProgressPatients.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 border-b border-green-200 last:border-0">
                <span className="text-green-900 font-medium">
                  {p.firstName} {p.lastName}
                </span>
                <span className="text-green-800/80 text-sm">
                  Started {p.currentVisitStartedAt && formatISODateTimeInTimezone(p.currentVisitStartedAt, timezone)}
                </span>
                <Link to={`/dashboard/patients/${p.id}`} className="text-green-700 text-sm font-medium hover:underline shrink-0">
                  Open chart
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6 mb-6">
        <h2 className="text-lg font-medium text-navy mb-4">Today&apos;s appointments</h2>
        {todayAppointments.length === 0 ? (
          <p className="text-navy/60">No appointments today.</p>
        ) : (
          <ul className="space-y-2">
            {todayAppointments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 border-b border-sky/20 last:border-0">
                <span className="text-navy">
                  {p.firstName} {p.lastName}
                  {p.appointmentTime && <span className="text-navy/70 text-sm ml-2">{p.appointmentTime}</span>}
                  {p.currentVisitStartedAt && (
                    <span className="ml-2 inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      In progress
                    </span>
                  )}
                </span>
                <span className="text-navy/70 text-sm">
                  {p.appointmentType && <span>{p.appointmentType}</span>}
                  {p.appointmentType && p.appointmentDoctor && " · "}
                  {p.appointmentDoctor && <span>with {p.appointmentDoctor}</span>}
                  {!p.appointmentType && !p.appointmentDoctor && "—"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {!p.currentVisitStartedAt && (
                    <Link
                      to={`/dashboard/patients/${p.id}?startVisit=1`}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 inline-block"
                    >
                      Start visit
                    </Link>
                  )}
                  <Link to={`/dashboard/patients/${p.id}`} className="text-sky-dark text-sm font-medium hover:underline">
                    Chart
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
        <h2 className="text-lg font-medium text-navy mb-4">Upcoming next appointments</h2>
        {upcomingNext.length === 0 ? (
          <p className="text-navy/60">No upcoming next appointments.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingNext.map((p) => (
              <li key={p.id} className="flex justify-between items-center py-2 border-b border-sky/20 last:border-0">
                <span className="text-navy">
                  {p.firstName} {p.lastName}
                </span>
                <span className="text-navy/70 text-sm">
                  {formatDisplayDate(p.dateOfNextAppointment)}
                  {p.nextAppointmentTime ? ` ${p.nextAppointmentTime}` : ""}
                </span>
                <Link to={`/dashboard/patients/${p.id}`} className="text-sky-dark text-sm font-medium hover:underline">
                  View chart
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
