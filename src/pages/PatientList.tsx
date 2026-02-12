import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getPatients } from "../storage";
import { formatDisplayDate } from "../utils/dateFormat";
import { downloadCsv } from "../utils/exportCsv";
import type { Patient } from "../types";

type SortField = "name" | "dob" | "apptDate" | "apptTime" | "nextApptDate" | "nextApptTime";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "name-asc", label: "Name (A → Z)" },
  { value: "name-desc", label: "Name (Z → A)" },
  { value: "dob-asc", label: "DOB (oldest first)" },
  { value: "dob-desc", label: "DOB (newest first)" },
  { value: "apptDate-asc", label: "Appt date (earliest first)" },
  { value: "apptDate-desc", label: "Appt date (latest first)" },
  { value: "apptTime-asc", label: "Appt time (earliest first)" },
  { value: "apptTime-desc", label: "Appt time (latest first)" },
  { value: "nextApptDate-asc", label: "Next appt date (earliest first)" },
  { value: "nextApptDate-desc", label: "Next appt date (latest first)" },
];

function sortPatients(patients: Patient[], field: SortField, dir: SortDir): Patient[] {
  const mult = dir === "asc" ? 1 : -1;
  return [...patients].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "name": {
        const na = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nb = `${b.firstName} ${b.lastName}`.toLowerCase();
        cmp = na.localeCompare(nb);
        break;
      }
      case "dob":
        cmp = (a.dateOfBirth || "").localeCompare(b.dateOfBirth || "");
        break;
      case "apptDate":
        cmp = (a.dateOfAppointment || "").localeCompare(b.dateOfAppointment || "");
        break;
      case "apptTime": {
        const ta = a.appointmentTime || "00:00";
        const tb = b.appointmentTime || "00:00";
        cmp = ta.localeCompare(tb) || (a.dateOfAppointment || "").localeCompare(b.dateOfAppointment || "");
        break;
      }
      case "nextApptDate":
        cmp = (a.dateOfNextAppointment || "").localeCompare(b.dateOfNextAppointment || "");
        break;
      case "nextApptTime": {
        const ta = a.nextAppointmentTime || "00:00";
        const tb = b.nextAppointmentTime || "00:00";
        cmp = ta.localeCompare(tb) || (a.dateOfNextAppointment || "").localeCompare(b.dateOfNextAppointment || "");
        break;
      }
      default:
        break;
    }
    return cmp * mult;
  });
}

export default function PatientList() {
  const [search, setSearch] = useState("");
  const [sortValue, setSortValue] = useState("name-asc");
  const patients = useMemo(() => getPatients(), []);
  const filtered = useMemo(
    () =>
      patients.filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
      ),
    [patients, search]
  );
  const [field, dir] = sortValue.split("-") as [SortField, SortDir];
  const sorted = useMemo(
    () => sortPatients(filtered, field, dir),
    [filtered, field, dir]
  );

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-navy">Patients</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const headers = ["First name", "Last name", "DOB", "Phone", "Email", "Appt date", "Appt time", "Next appt date"];
              const rows = sorted.map((p) => [
                p.firstName,
                p.lastName,
                p.dateOfBirth ?? "",
                p.phone ?? "",
                p.email ?? "",
                p.dateOfAppointment ?? "",
                p.appointmentTime ?? "",
                p.dateOfNextAppointment ?? "",
              ]);
              downloadCsv(`patients-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-sky/60 rounded-lg font-medium text-navy hover:bg-sky/10"
          >
            Export CSV
          </button>
          <Link
            to="/dashboard/patients/new"
            className="inline-flex items-center justify-center px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light transition-colors"
          >
            + Add patient
          </Link>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-sky/60 rounded-lg bg-white text-navy placeholder-navy/50 focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-navy/70 whitespace-nowrap">Sort by</label>
          <select
            value={sortValue}
            onChange={(e) => setSortValue(e.target.value)}
            className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy min-w-[200px]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-sky/40 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-navy/60">
            {patients.length === 0
              ? "No patients yet. Add your first patient above."
              : "No patients match your search."}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-navy/5 border-b border-sky/40">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">DOB</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Allergies</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Appointment</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Next</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-b border-sky/20 hover:bg-sky/10">
                  <td className="py-3 px-4 font-medium text-navy">
                    {p.firstName} {p.lastName}
                  </td>
                  <td className="py-3 px-4 text-navy/80">{formatDisplayDate(p.dateOfBirth)}</td>
                  <td className="py-3 px-4">
                    {p.allergies ? (
                      <span className="text-amber-700 bg-amber-100 text-xs px-2 py-0.5 rounded" title={p.allergies}>
                        {p.allergies.length > 20 ? `${p.allergies.slice(0, 20)}…` : p.allergies}
                      </span>
                    ) : (
                      <span className="text-navy/50">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-navy/80">
                    {formatDisplayDate(p.dateOfAppointment)}
                    {p.appointmentTime ? ` ${p.appointmentTime}` : ""}
                  </td>
                  <td className="py-3 px-4 text-navy/80">
                    {p.dateOfNextAppointment ? formatDisplayDate(p.dateOfNextAppointment) + (p.nextAppointmentTime ? ` ${p.nextAppointmentTime}` : "") : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/dashboard/patients/${p.id}`}
                      className="text-sky-dark font-medium text-sm hover:underline"
                    >
                      Chart
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
