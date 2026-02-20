import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPatients, getPatientById, updatePatient } from "../storage";
import { getAppointments, addAppointment, updateAppointment, getAppointmentConflicts } from "../storage/appointmentStorage";
import { getOperatories, getOperatoryById } from "../storage/operatoryStorage";
import { getStaff, getStaffById } from "../storage/staffStorage";
import { formatDisplayDate } from "../utils/dateFormat";
import type { Patient } from "../types";
import type { AppointmentStatus } from "../types";
import { APPOINTMENT_TYPES } from "../types";
import { useTimezoneContext } from "../contexts/TimezoneContext";
import { useTodayInTimezone } from "../hooks/useAppTimezone";
import { buildUnifiedEvents } from "../utils/appointmentEvents";
import { timeToMinutes, minutesToTime } from "../utils/appointmentEvents";
import { downloadCsv } from "../utils/exportCsv";
import AppointmentCalendar from "../components/AppointmentCalendar";
import { DENTIST_POSITIONS_FOR_CHART_DELETE } from "../constants/staffPositions";
import type { AppointmentEvent } from "../types/appointments";

type View = "today" | "upcoming" | "all";
type PeriodGroup = "year" | "month" | "week";
type DisplayMode = "list" | "calendar";
type CalendarViewMode = "day" | "week" | "month";

type ListItem = { date: string; type: "appointment" | "next"; event: AppointmentEvent; patient: Patient | undefined };

function getYear(d: string) {
  return d.slice(0, 4);
}
function getMonth(d: string) {
  return d.slice(0, 7);
}
function getWeekKey(d: string) {
  const date = new Date(d + "T12:00:00");
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return start.toISOString().slice(0, 10);
}

function getStaffDisplayName(staffId: string): string {
  const s = getStaffById(staffId);
  if (!s) return staffId;
  return (DENTIST_POSITIONS_FOR_CHART_DELETE as readonly string[]).includes(s.position)
    ? `Dr. ${s.firstName} ${s.lastName}`
    : `${s.firstName} ${s.lastName}`;
}

export default function Appointments() {
  const { timezone } = useTimezoneContext();
  const today = useTodayInTimezone(timezone);
  const [view, setView] = useState<View>("upcoming");
  const [periodGroup, setPeriodGroup] = useState<PeriodGroup>("month");
  const [periodValue, setPeriodValue] = useState<string>("");
  const [monthYear, setMonthYear] = useState<string>("");
  const [monthNum, setMonthNum] = useState<string>("");
  const [patientFilterId, setPatientFilterId] = useState<string>("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>("week");
  const [calendarDate, setCalendarDate] = useState<string>(() => today);
  const [patients, setPatients] = useState(() => getPatients());
  const [appointments, setAppointments] = useState(() => getAppointments());
  const refreshPatients = () => setPatients(getPatients());
  const refreshAppointments = () => setAppointments(getAppointments());

  const allEvents = useMemo(
    () => buildUnifiedEvents(appointments, patients, getStaffDisplayName),
    [appointments, patients]
  );

  const todayEvents = useMemo(() => allEvents.filter((e) => e.date === today).sort((a, b) => a.time.localeCompare(b.time)), [allEvents, today]);
  const upcomingDates = useMemo(
    () => [...new Set(allEvents.filter((e) => e.date >= today).map((e) => e.date))].sort().slice(0, 14),
    [allEvents, today]
  );
  const upcomingEvents = useMemo(
    () => upcomingDates.flatMap((d) => allEvents.filter((e) => e.date === d)).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
    [allEvents, upcomingDates]
  );
  const allDates = useMemo(() => [...new Set(allEvents.map((e) => e.date))].sort(), [allEvents]);
  const allEventsSorted = useMemo(() => [...allEvents].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)), [allEvents]);

  let rawList: ListItem[] =
    view === "today"
      ? todayEvents.map((e) => ({ date: e.date, type: e.type, event: e, patient: getPatientById(e.patientId) }))
      : view === "upcoming"
        ? upcomingEvents.map((e) => ({ date: e.date, type: e.type, event: e, patient: getPatientById(e.patientId) }))
        : allEventsSorted.map((e) => ({ date: e.date, type: e.type, event: e, patient: getPatientById(e.patientId) }));

  if (patientFilterId) {
    rawList = rawList.filter((item) => item.event.patientId === patientFilterId);
  }

  const currentYear = parseInt(today.slice(0, 4), 10);

  const periodOptions = useMemo(() => {
    const dates = rawList.map((r) => r.date);
    const uniqueDates = Array.from(new Set(dates));
    const years = Array.from(new Set(uniqueDates.map(getYear))).sort();
    const weeks = Array.from(new Set(uniqueDates.map(getWeekKey))).sort();
    const monthsByYear: Record<string, string[]> = {};
    uniqueDates.forEach((d) => {
      const y = getYear(d);
      const m = getMonth(d);
      if (!monthsByYear[y]) monthsByYear[y] = [];
      if (!monthsByYear[y].includes(m)) monthsByYear[y].push(m);
    });
    Object.keys(monthsByYear).forEach((y) => monthsByYear[y].sort());
    return { years, weeks, monthsByYear };
  }, [rawList]);

  const MONTH_OPTIONS = useMemo(() => {
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return names.map((name, i) => ({ value: String(i + 1).padStart(2, "0"), label: name }));
  }, []);

  const monthPeriodValue = monthYear && monthNum ? `${monthYear}-${monthNum}` : "";
  const monthOptionsForYear = (periodOptions.monthsByYear[monthYear ?? ""] ?? []);

  const list = useMemo(() => {
    if (periodGroup === "month") {
      if (!monthPeriodValue) return rawList;
      return rawList.filter((item) => getMonth(item.date) === monthPeriodValue);
    }
    if (periodGroup === "year") {
      if (!periodValue) return rawList;
      return rawList.filter((item) => getYear(item.date) === periodValue);
    }
    if (periodGroup === "week") {
      if (!periodValue) return rawList;
      return rawList.filter((item) => getWeekKey(item.date) === periodValue);
    }
    return rawList;
  }, [rawList, periodGroup, periodValue, monthPeriodValue]);

  const patientOptions = useMemo(
    () =>
      [...patients].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [patients]
  );

  const handleReschedule = (eventId: string, newDate: string, newTime: string) => {
    const event = allEvents.find((e) => e.id === eventId);
    if (!event) return;
    const duration = event.durationMinutes ?? 60;
    const startMins = timeToMinutes(newTime);
    const endMins = startMins + duration;
    const newStart = `${newDate}T${newTime}:00`;
    const newEnd = `${newDate}T${minutesToTime(endMins)}:00`;

    if (event.appointmentId) {
      const apt = appointments.find((a) => a.id === event.appointmentId);
      if (apt) {
        updateAppointment(apt.id, { start: newStart, end: newEnd });
        refreshAppointments();
      }
    } else {
      if (event.type === "next") {
        updatePatient(event.patientId, { dateOfNextAppointment: newDate, nextAppointmentTime: newTime });
      } else {
        updatePatient(event.patientId, { dateOfAppointment: newDate, appointmentTime: newTime });
      }
      refreshPatients();
    }
  };

  const filteredEvents = useMemo(() => {
    let events = patientFilterId ? allEvents.filter((e) => e.patientId === patientFilterId) : allEvents;
    if (view === "today") {
      events = events.filter((e) => e.date === today);
    } else if (view === "upcoming") {
      events = events.filter((e) => e.date >= today && upcomingDates.includes(e.date));
    }
    if (periodGroup === "month" && monthPeriodValue) {
      events = events.filter((e) => getMonth(e.date) === monthPeriodValue);
    } else if (periodGroup === "year" && periodValue) {
      events = events.filter((e) => getYear(e.date) === periodValue);
    } else if (periodGroup === "week" && periodValue) {
      events = events.filter((e) => getWeekKey(e.date) === periodValue);
    }
    return events;
  }, [allEvents, patientFilterId, view, today, upcomingDates, periodGroup, periodValue, monthPeriodValue]);

  const operatories = useMemo(() => getOperatories(), []);
  const staffList = useMemo(() => getStaff(), []);
  const providerOptions = useMemo(() => staffList.filter((s) => ["Dentist", "Pediatric Dentist", "Dental Hygienist", "Orthodontist", "Endodontist", "Periodontist", "Oral Surgeon"].includes(s.position)), [staffList]);

  const [newApptOpen, setNewApptOpen] = useState(false);
  const [newApptPatientId, setNewApptPatientId] = useState("");
  const [newApptProviderId, setNewApptProviderId] = useState("");
  const [newApptOperatoryId, setNewApptOperatoryId] = useState("");
  const [newApptDate, setNewApptDate] = useState(() => today);
  const [newApptTime, setNewApptTime] = useState("09:00");
  const [newApptDuration, setNewApptDuration] = useState("45");
  const [newApptType, setNewApptType] = useState("");
  const [newApptConflictWarning, setNewApptConflictWarning] = useState<{ operatory: string; provider: string }[] | null>(null);

  const handleCreateAppointment = () => {
    if (!newApptPatientId || !newApptProviderId) return;
    const duration = parseInt(newApptDuration, 10) || 45;
    const startDate = new Date(`${newApptDate}T${newApptTime}:00`);
    const start = startDate.toISOString();
    const end = new Date(startDate.getTime() + duration * 60 * 1000).toISOString();
    const conflicts = getAppointmentConflicts(start, end, newApptOperatoryId || undefined, newApptProviderId);
    if (conflicts.length > 0) {
      setNewApptConflictWarning(
        conflicts.map((c) => ({
          operatory: c.operatoryId ? getOperatoryById(c.operatoryId)?.name ?? c.operatoryId : "",
          provider: getStaffDisplayName(c.providerId),
        }))
      );
      return;
    }
    setNewApptConflictWarning(null);
    addAppointment({
      patientId: newApptPatientId,
      providerId: newApptProviderId,
      operatoryId: newApptOperatoryId || undefined,
      start,
      end,
      type: newApptType || undefined,
      status: "Scheduled",
    });
    setNewApptOpen(false);
    setNewApptPatientId("");
    setNewApptProviderId("");
    setNewApptOperatoryId("");
    setNewApptDate(today);
    setNewApptTime("09:00");
    setNewApptDuration("45");
    setNewApptType("");
    refreshAppointments();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-6">Appointments</h1>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <button
          type="button"
          onClick={() => { setNewApptOpen(true); setNewApptConflictWarning(null); }}
          className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light"
        >
          + New appointment
        </button>
        <span className="text-sm text-navy/70">View:</span>
        {(["list", "calendar"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setDisplayMode(m)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${displayMode === m ? "bg-navy text-white" : "bg-white border border-sky/60 text-navy hover:bg-sky/10"}`}
          >
            {m}
          </button>
        ))}
        {displayMode === "calendar" && (
          <>
            <span className="text-sm text-navy/70 ml-2">Calendar:</span>
            {(["day", "week", "month"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setCalendarViewMode(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${calendarViewMode === m ? "bg-sky-dark text-white" : "bg-sky/20 text-navy"}`}
              >
                {m}
              </button>
            ))}
          </>
        )}
      </div>
      {displayMode === "list" && list.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const headers = ["Date", "Time", "Type", "Patient", "Duration", "Room", "Provider"];
              const rows = list.map(({ date, type, event, patient }) => [
                formatDisplayDate(date),
                event.time,
                type === "appointment" ? "Appointment" : "Next appointment",
                event.patientName,
                event.durationMinutes ?? "",
                event.room ?? (event.operatoryId ? getOperatoryById(event.operatoryId)?.name : "") ?? "",
                event.provider ?? (event.providerId ? getStaffDisplayName(event.providerId) : "") ?? "",
              ]);
              downloadCsv(`appointments-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
            }}
            className="px-3 py-2 border border-sky/60 rounded-lg text-sm font-medium text-navy hover:bg-sky/10"
          >
            Export CSV
          </button>
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["today", "upcoming", "all"] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              setPeriodValue("");
            }}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              view === v ? "bg-navy text-white" : "bg-white border border-sky/60 text-navy hover:bg-sky/10"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-navy/70 whitespace-nowrap">Group by</label>
          <select
            value={periodGroup}
            onChange={(e) => {
              const v = e.target.value as PeriodGroup;
              setPeriodGroup(v);
              setPeriodValue("");
              setMonthYear("");
              setMonthNum("");
            }}
            className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy"
          >
            <option value="year">Year</option>
            <option value="month">Month</option>
            <option value="week">Week</option>
          </select>
        </div>
        {periodGroup === "month" ? (
          <>
            <div className="flex items-center gap-2">
              <label className="text-sm text-navy/70 whitespace-nowrap">Year</label>
              <select
                value={monthYear}
                onChange={(e) => {
                  setMonthYear(e.target.value);
                  setMonthNum("");
                }}
                className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy min-w-[100px]"
              >
                <option value="">Select year</option>
                {(periodOptions.years.length > 0 ? periodOptions.years : Array.from({ length: 11 }, (_, i) => String(currentYear - 5 + i))).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-navy/70 whitespace-nowrap">Month</label>
              <select
                value={monthNum}
                onChange={(e) => setMonthNum(e.target.value)}
                className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy min-w-[140px]"
              >
                <option value="">Select month</option>
                {(monthYear ? monthOptionsForYear : []).length > 0
                  ? monthOptionsForYear.map((m) => {
                      const opt = MONTH_OPTIONS.find((o) => o.value === m);
                      return <option key={m} value={m}>{opt?.label ?? m}</option>;
                    })
                  : MONTH_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
              </select>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <label className="text-sm text-navy/70 whitespace-nowrap">Show</label>
            <select
              value={periodValue}
              onChange={(e) => setPeriodValue(e.target.value)}
              className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy min-w-[180px]"
            >
              <option value="">
                {periodGroup === "year" ? "All years" : "All weeks"}
              </option>
              {periodGroup === "year" &&
                (periodOptions.years.length > 0 ? periodOptions.years : Array.from({ length: 11 }, (_, i) => String(currentYear - 5 + i))).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              {periodGroup === "week" &&
                periodOptions.weeks.map((opt) => (
                  <option key={opt} value={opt}>
                    {formatDisplayDate(opt)} (week)
                  </option>
                ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label className="text-sm text-navy/70 whitespace-nowrap">Patient</label>
          <select
            value={patientFilterId}
            onChange={(e) => setPatientFilterId(e.target.value)}
            className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy min-w-[180px]"
          >
            <option value="">All patients</option>
            {patientOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {displayMode === "calendar" && (
        <div className="mb-6">
          <AppointmentCalendar
            events={filteredEvents}
            currentDate={calendarDate}
            viewMode={calendarViewMode}
            onDateChange={setCalendarDate}
            onReschedule={handleReschedule}
          />
        </div>
      )}

      {displayMode === "list" && (
      <div className="bg-white rounded-xl shadow-sm border border-sky/40 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-navy/60">
            {periodValue || monthPeriodValue || patientFilterId
              ? "No appointments match the selected filters."
              : view === "today"
                ? "No appointments today."
                : view === "upcoming"
                  ? "No upcoming next appointments."
                  : "No appointments on file."}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-navy/5 border-b border-sky/40">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Patient</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Room</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {list.map(({ date, type, event, patient }) => (
                <tr key={`${event.id}-${date}-${type}`} className="border-b border-sky/20 hover:bg-sky/10">
                  <td className="py-3 px-4 text-navy">{formatDisplayDate(date)}{event.time ? ` ${event.time}` : ""}</td>
                  <td className="py-3 px-4 text-navy/80">
                    {event.appointmentType ?? (type === "appointment" ? "Appointment" : "Next appointment")}
                  </td>
                  <td className="py-3 px-4 font-medium text-navy">
                    {event.patientName}
                  </td>
                  <td className="py-3 px-4">
                    {date === today ? (
                      event.appointmentId ? (
                      <select
                        value={event.status ?? "Scheduled"}
                        onChange={(e) => {
                          updateAppointment(event.appointmentId!, { status: e.target.value as AppointmentStatus });
                          refreshAppointments();
                        }}
                        className="text-sm px-2 py-1 border border-sky/60 rounded bg-white text-navy"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Checked In">Checked In</option>
                        <option value="In Chair">In Chair</option>
                        <option value="With Doctor">With Doctor</option>
                        <option value="Checkout">Checkout</option>
                        <option value="No-Show">No-Show</option>
                        <option value="Broken">Broken</option>
                      </select>
                    ) : (
                      <select
                        value={patient?.appointmentStatus ?? "Scheduled"}
                        onChange={(e) => {
                          if (patient) {
                            updatePatient(patient.id, { appointmentStatus: e.target.value as AppointmentStatus });
                            refreshPatients();
                          }
                        }}
                        className="text-sm px-2 py-1 border border-sky/60 rounded bg-white text-navy"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Checked In">Checked In</option>
                        <option value="In Chair">In Chair</option>
                        <option value="With Doctor">With Doctor</option>
                        <option value="Checkout">Checkout</option>
                        <option value="No-Show">No-Show</option>
                        <option value="Broken">Broken</option>
                      </select>
                    )
                    ) : (
                      <span className="text-navy/60">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-navy/80">
                    {event.durationMinutes ? `${event.durationMinutes} min` : "—"}
                  </td>
                  <td className="py-3 px-4 text-navy/80">
                    {event.room ?? (event.operatoryId ? getOperatoryById(event.operatoryId)?.name : "") ?? "—"}
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/dashboard/patients/${event.patientId}`} className="text-sky-dark font-medium text-sm hover:underline">
                      Chart
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}

      {newApptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="new-appt-title">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 id="new-appt-title" className="text-lg font-semibold text-navy mb-4">New appointment</h2>
            {newApptConflictWarning && newApptConflictWarning.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
                <p className="font-medium">Conflict: this time overlaps with another appointment (same room or provider).</p>
                <p className="mt-1">Change time, room, or provider, or confirm to save anyway.</p>
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-navy/70 mb-1">Patient *</label>
                <select required value={newApptPatientId} onChange={(e) => setNewApptPatientId(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
                  <option value="">Select patient</option>
                  {patientOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Provider *</label>
                <select required value={newApptProviderId} onChange={(e) => setNewApptProviderId(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
                  <option value="">Select provider</option>
                  {providerOptions.map((s) => (
                    <option key={s.id} value={s.id}>{getStaffDisplayName(s.id)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Room (operatory)</label>
                <select value={newApptOperatoryId} onChange={(e) => setNewApptOperatoryId(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
                  <option value="">—</option>
                  {operatories.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-navy/70 mb-1">Date *</label>
                  <input type="date" value={newApptDate} onChange={(e) => setNewApptDate(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-navy/70 mb-1">Time *</label>
                  <input type="time" value={newApptTime} onChange={(e) => setNewApptTime(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-navy/70 mb-1">Duration (min)</label>
                  <input type="number" min={5} step={5} value={newApptDuration} onChange={(e) => setNewApptDuration(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm text-navy/70 mb-1">Type</label>
                  <select value={newApptType} onChange={(e) => setNewApptType(e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
                    <option value="">—</option>
                    {APPOINTMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={handleCreateAppointment} className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light">
                Save
              </button>
              <button type="button" onClick={() => { setNewApptOpen(false); setNewApptConflictWarning(null); }} className="px-4 py-2 border border-sky/60 rounded-lg font-medium text-navy hover:bg-sky/10">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
