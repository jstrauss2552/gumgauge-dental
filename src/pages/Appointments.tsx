import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPatients, updatePatient } from "../storage";
import { formatDisplayDate } from "../utils/dateFormat";
import type { Patient } from "../types";
import type { AppointmentStatus } from "../types";
import { useTimezoneContext } from "../contexts/TimezoneContext";
import { useTodayInTimezone } from "../hooks/useAppTimezone";
import { buildEventsFromPatients } from "../utils/appointmentEvents";
import { downloadCsv } from "../utils/exportCsv";
import AppointmentCalendar from "../components/AppointmentCalendar";

type View = "today" | "upcoming" | "all";
type PeriodGroup = "year" | "month" | "week";
type DisplayMode = "list" | "calendar";
type CalendarViewMode = "day" | "week" | "month";

type ListItem = { date: string; type: "appointment" | "next"; patient: Patient };

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

export default function Appointments() {
  const { timezone } = useTimezoneContext();
  const today = useTodayInTimezone(timezone);
  const [view, setView] = useState<View>("upcoming");
  const [periodGroup, setPeriodGroup] = useState<PeriodGroup>("month");
  const [periodValue, setPeriodValue] = useState<string>(""); // selected year or week start (not used for month)
  const [monthYear, setMonthYear] = useState<string>(""); // selected year when Group by = Month
  const [monthNum, setMonthNum] = useState<string>(""); // selected month 01-12 when Group by = Month
  const [patientFilterId, setPatientFilterId] = useState<string>("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>("week");
  const [calendarDate, setCalendarDate] = useState<string>(() => today);
  const [patients, setPatients] = useState(() => getPatients());
  const allEvents = useMemo(() => buildEventsFromPatients(patients), [patients]);
  const refreshPatients = () => setPatients(getPatients());

  const byAppointment = useMemo(() => {
    const map = new Map<string, Patient[]>();
    patients.forEach((p) => {
      const key = p.dateOfAppointment;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [patients]);

  const byNext = useMemo(() => {
    const map = new Map<string, Patient[]>();
    patients.forEach((p) => {
      if (!p.dateOfNextAppointment) return;
      const key = p.dateOfNextAppointment;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [patients]);

  const todayList = byAppointment.get(today) || [];
  const upcomingDates = Array.from(byNext.keys())
    .filter((d) => d >= today)
    .sort()
    .slice(0, 14);
  const allDates = Array.from(new Set([...byAppointment.keys(), ...byNext.keys()])).sort();

  let rawList: ListItem[] =
    view === "today"
      ? todayList.map((p) => ({ date: today, type: "appointment" as const, patient: p }))
      : view === "upcoming"
        ? upcomingDates.flatMap((date) =>
            (byNext.get(date) || []).map((patient) => ({ date, type: "next" as const, patient }))
          )
        : allDates.flatMap((date) => [
            ...(byAppointment.get(date) || []).map((patient) => ({ date, type: "appointment" as const, patient })),
            ...(byNext.get(date) || []).map((patient) => ({ date, type: "next" as const, patient })),
          ]);

  if (patientFilterId) {
    rawList = rawList.filter((item) => item.patient.id === patientFilterId);
  }

  const currentYear = parseInt(today.slice(0, 4), 10);
  const yearRange = useMemo(() => {
    const arr: string[] = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) arr.push(String(y));
    return arr;
  }, [currentYear]);

  const MONTH_OPTIONS = useMemo(() => {
    const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return names.map((name, i) => ({ value: String(i + 1).padStart(2, "0"), label: name }));
  }, []);

  const periodOptions = useMemo(() => {
    const dates = rawList.map((r) => r.date);
    const weeks = Array.from(new Set(dates.map(getWeekKey))).sort();
    return { year: yearRange, week: weeks };
  }, [rawList, view, patientFilterId, yearRange]);

  const monthPeriodValue = monthYear && monthNum ? `${monthYear}-${monthNum}` : "";

  const list = useMemo(() => {
    if (periodGroup === "month") {
      if (!monthPeriodValue) return rawList;
      return rawList.filter((item) => getMonth(item.date) === monthPeriodValue);
    }
    if (!periodValue) return rawList;
    return rawList.filter((item) => {
      const d = item.date;
      if (periodGroup === "year") return getYear(d) === periodValue;
      return getWeekKey(d) === periodValue;
    });
  }, [rawList, periodGroup, periodValue, monthPeriodValue]);

  const patientOptions = useMemo(
    () =>
      [...patients].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [patients]
  );

  const handleReschedule = (eventId: string, newDate: string, newTime: string) => {
    const event = allEvents.find((e) => e.id === eventId);
    if (!event) return;
    if (event.type === "next") {
      updatePatient(event.patientId, { dateOfNextAppointment: newDate, nextAppointmentTime: newTime });
    } else {
      updatePatient(event.patientId, { dateOfAppointment: newDate, appointmentTime: newTime });
    }
    refreshPatients();
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-6">Appointments</h1>
      <div className="flex flex-wrap items-center gap-4 mb-4">
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
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              const headers = ["Date", "Time", "Type", "Patient", "Duration", "Room"];
              const rows = list.map(({ date, type, patient }) => [
                formatDisplayDate(date),
                type === "appointment" ? (patient.appointmentTime ?? "") : (patient.nextAppointmentTime ?? ""),
                type === "appointment" ? "Appointment" : "Next appointment",
                `${patient.firstName} ${patient.lastName}`,
                type === "appointment" ? (patient.appointmentDurationMinutes ?? "") : (patient.nextAppointmentDurationMinutes ?? ""),
                type === "appointment" ? (patient.appointmentRoom ?? "") : (patient.nextAppointmentRoom ?? ""),
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
                onChange={(e) => setMonthYear(e.target.value)}
                className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy min-w-[100px]"
              >
                <option value="">Select year</option>
                {periodOptions.year.map((y) => (
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
                {MONTH_OPTIONS.map((m) => (
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
                periodOptions.year.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              {periodGroup === "week" &&
                periodOptions.week.map((opt) => (
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
              {list.map(({ date, type, patient }) => (
                <tr key={`${patient.id}-${date}-${type}`} className="border-b border-sky/20 hover:bg-sky/10">
                  <td className="py-3 px-4 text-navy">{formatDisplayDate(date)}{patient.appointmentTime || patient.nextAppointmentTime ? ` ${type === "appointment" ? patient.appointmentTime : patient.nextAppointmentTime}` : ""}</td>
                  <td className="py-3 px-4 text-navy/80">
                    {type === "appointment" ? "Appointment" : "Next appointment"}
                  </td>
                  <td className="py-3 px-4 font-medium text-navy">
                    {patient.firstName} {patient.lastName}
                  </td>
                  <td className="py-3 px-4">
                    {type === "appointment" ? (
                      <select
                        value={patient.appointmentStatus ?? "Scheduled"}
                        onChange={(e) => {
                          updatePatient(patient.id, { appointmentStatus: e.target.value as AppointmentStatus });
                          refreshPatients();
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
                      <span className="text-navy/60">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-navy/80">
                    {type === "appointment" ? (patient.appointmentDurationMinutes ? `${patient.appointmentDurationMinutes} min` : "—") : (patient.nextAppointmentDurationMinutes ? `${patient.nextAppointmentDurationMinutes} min` : "—")}
                  </td>
                  <td className="py-3 px-4 text-navy/80">
                    {type === "appointment" ? (patient.appointmentRoom ?? "—") : (patient.nextAppointmentRoom ?? "—")}
                  </td>
                  <td className="py-3 px-4">
                    <Link to={`/dashboard/patients/${patient.id}`} className="text-sky-dark font-medium text-sm hover:underline">
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
    </div>
  );
}
