import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPatients, getPatientById } from "../storage";
import { getClinic } from "../storage/clinicStorage";
import { getAppointments, getAppointmentsByDate } from "../storage/appointmentStorage";
import { getStaffById } from "../storage/staffStorage";
import { formatDisplayDate, formatISODateTimeInTimezone } from "../utils/dateFormat";
import { useTimezoneContext } from "../contexts/TimezoneContext";
import { useClock, useTodayInTimezone } from "../hooks/useAppTimezone";
import { DEMO_MODE_KEY } from "../constants/admin";
import { DENTIST_POSITIONS_FOR_CHART_DELETE } from "../constants/staffPositions";
import type { Patient } from "../types";

function isDemoMode(): boolean {
  try {
    return typeof sessionStorage !== "undefined" && sessionStorage.getItem(DEMO_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Dashboard() {
  const clinic = getClinic();
  const { timezone } = useTimezoneContext();
  const today = useTodayInTimezone(timezone);
  const { full } = useClock(timezone);
  const [patients, setPatients] = useState(() => getPatients());
  useEffect(() => {
    setPatients(getPatients());
  }, []);

  const appointments = getAppointments();
  const useFirstClassAppointments = appointments.length > 0;

  const inProgressPatients = patients
    .filter((p) => p.currentVisitStartedAt)
    .sort((a, b) => (b.currentVisitStartedAt ?? "").localeCompare(a.currentVisitStartedAt ?? ""));

  const todayAppointmentsList = useMemo(() => {
    if (useFirstClassAppointments) {
      const byDate = getAppointmentsByDate(today);
      return byDate
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((a) => ({ appointment: a, patient: getPatientById(a.patientId) }));
    }
    return patients
      .filter((p) => p.dateOfAppointment === today)
      .sort((a, b) => (a.appointmentTime || "00:00").localeCompare(b.appointmentTime || "00:00"))
      .map((p) => ({ patient: p, appointment: null as { start: string; type?: string; providerId: string } | null }));
  }, [useFirstClassAppointments, today, patients]);

  const upcomingNextList = useMemo(() => {
    if (useFirstClassAppointments) {
      const future = appointments.filter((a) => a.start.slice(0, 10) >= today).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 5);
      return future.map((a) => ({ appointment: a, patient: getPatientById(a.patientId) }));
    }
    return patients
      .filter((p) => p.dateOfNextAppointment && p.dateOfNextAppointment >= today)
      .sort((a, b) => {
        const d = (a.dateOfNextAppointment ?? "").localeCompare(b.dateOfNextAppointment ?? "");
        if (d !== 0) return d;
        return (a.nextAppointmentTime || "00:00").localeCompare(b.nextAppointmentTime || "00:00");
      })
      .slice(0, 5)
      .map((p) => ({ patient: p, appointment: null as { start: string; type?: string; providerId: string } | null }));
  }, [useFirstClassAppointments, today, appointments.length, patients]);

  const todayCount = useFirstClassAppointments ? getAppointmentsByDate(today).length : patients.filter((p) => p.dateOfAppointment === today).length;

  const pendingLabCases = useMemo(() => {
    const out: { patient: Patient; lab: import("../types").LabCase }[] = [];
    patients.forEach((p) => {
      (p.labCases ?? []).filter((l) => l.status === "Sent" || l.status === "In progress").forEach((lab) => {
        out.push({ patient: p, lab });
      });
    });
    return out;
  }, [patients]);

  return (
    <div className="p-8">
      {isDemoMode() && (
        <div className="mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
          <strong>Demo mode.</strong> You’re viewing sample data. You can explore patients, charts, appointments, and clinic info. Changes are saved only for this demo session.
        </div>
      )}
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
          {inProgressPatients.length} in progress · {todayCount} today
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
        {todayAppointmentsList.length === 0 ? (
          <p className="text-navy/60">No appointments today.</p>
        ) : (
          <ul className="space-y-2">
            {todayAppointmentsList.map((item, idx) => {
              const p = item.patient;
              const apt = item.appointment;
              const patientId = p?.id ?? apt?.patientId;
              const timeStr = apt ? apt.start.slice(11, 16) : p?.appointmentTime;
              const typeStr = apt?.type ?? p?.appointmentType;
              const doctorStr = apt?.providerId ? (() => { const s = getStaffById(apt.providerId); return s ? ((DENTIST_POSITIONS_FOR_CHART_DELETE as readonly string[]).includes(s.position) ? `Dr. ${s.firstName} ${s.lastName}` : `${s.firstName} ${s.lastName}`) : ""; })() : p?.appointmentDoctor;
              const inProgress = p?.currentVisitStartedAt;
              const name = p ? `${p.firstName} ${p.lastName}` : "Unknown";
              return (
                <li key={apt?.id ?? `${patientId}-${idx}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 border-b border-sky/20 last:border-0">
                  <span className="text-navy">
                    {name}
                    {timeStr && <span className="text-navy/70 text-sm ml-2">{timeStr}</span>}
                    {inProgress && (
                      <span className="ml-2 inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        In progress
                      </span>
                    )}
                  </span>
                  <span className="text-navy/70 text-sm">
                    {typeStr && <span>{typeStr}</span>}
                    {typeStr && doctorStr && " · "}
                    {doctorStr && <span>with {doctorStr}</span>}
                    {!typeStr && !doctorStr && "—"}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {patientId && !inProgress && (
                      <Link
                        to={`/dashboard/patients/${patientId}?startVisit=1`}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 inline-block"
                      >
                        Start visit
                      </Link>
                    )}
                    {patientId && (
                      <Link to={`/dashboard/patients/${patientId}`} className="text-sky-dark text-sm font-medium hover:underline">
                        Chart
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
        <h2 className="text-lg font-medium text-navy mb-4">Upcoming next appointments</h2>
        {upcomingNextList.length === 0 ? (
          <p className="text-navy/60">No upcoming next appointments.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingNextList.map((item, idx) => {
              const p = item.patient;
              const apt = item.appointment;
              const patientId = p?.id ?? apt?.patientId;
              const dateStr = apt ? apt.start.slice(0, 10) : p?.dateOfNextAppointment;
              const timeStr = apt ? apt.start.slice(11, 16) : p?.nextAppointmentTime;
              const name = p ? `${p.firstName} ${p.lastName}` : "Unknown";
              return (
                <li key={apt?.id ?? `${patientId}-${idx}`} className="flex justify-between items-center py-2 border-b border-sky/20 last:border-0">
                  <span className="text-navy">{name}</span>
                  <span className="text-navy/70 text-sm">
                    {dateStr && formatDisplayDate(dateStr)}
                    {timeStr ? ` ${timeStr}` : ""}
                  </span>
                  {patientId && (
                    <Link to={`/dashboard/patients/${patientId}`} className="text-sky-dark text-sm font-medium hover:underline">
                      View chart
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pendingLabCases.length > 0 && (
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-6 mt-6">
          <h2 className="text-lg font-medium text-amber-900 mb-1">Pending lab cases</h2>
          <p className="text-sm text-amber-800/70 mb-4">Lab work sent or in progress. Update status on the patient chart.</p>
          <ul className="space-y-2">
            {pendingLabCases.map(({ patient, lab }) => (
              <li key={lab.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 border-b border-amber-200 last:border-0">
                <span className="text-amber-900 font-medium">{patient.firstName} {patient.lastName}</span>
                <span className="text-amber-800/80 text-sm">{lab.labName} · {lab.caseType}{lab.toothOrTeeth ? ` (${lab.toothOrTeeth})` : ""}</span>
                <Link to={`/dashboard/patients/${patient.id}#lab-cases`} className="text-amber-700 text-sm font-medium hover:underline shrink-0">
                  Chart
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
