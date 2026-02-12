import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { getPatients } from "../storage";
import { formatDisplayDate } from "../utils/dateFormat";
import { useTodayInTimezone } from "../hooks/useAppTimezone";
import { useTimezoneContext } from "../contexts/TimezoneContext";

/** Compute next recall due date from lastCleaningDate + recallIntervalMonths */
function getRecallDueDate(lastCleaning: string | undefined, intervalMonths: number | undefined): string | null {
  if (!lastCleaning || !intervalMonths || intervalMonths < 1) return null;
  const d = new Date(lastCleaning + "T12:00:00");
  d.setMonth(d.getMonth() + intervalMonths);
  return d.toISOString().slice(0, 10);
}

export default function RecallReport() {
  const { timezone } = useTimezoneContext();
  const today = useTodayInTimezone(timezone);
  const patients = useMemo(() => getPatients(), []);

  const withRecall = useMemo(() => {
    return patients
      .filter((p) => p.recallIntervalMonths != null && p.recallIntervalMonths >= 1 && p.lastCleaningDate)
      .map((p) => {
        const due = getRecallDueDate(p.lastCleaningDate, p.recallIntervalMonths!);
        return { patient: p, dueDate: due!, overdue: due ? due < today : false };
      })
      .sort((a, b) => (a.overdue === b.overdue ? (a.dueDate.localeCompare(b.dueDate)) : (a.overdue ? -1 : 1)));
  }, [patients, today]);

  const overdue = withRecall.filter((x) => x.overdue);
  const dueSoon = withRecall.filter((x) => !x.overdue);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-2">Recall / recare</h1>
      <p className="text-navy/70 mb-6">Patients due for recall based on last cleaning date and recall interval. Set recall interval on the patient chart.</p>

      {withRecall.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
          <p className="text-navy/60">No patients with recall interval set. Edit a patient and set &quot;Recall / recurring (months)&quot; and &quot;Last cleaning date&quot; to see them here.</p>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-medium text-amber-900 mb-2">Overdue recall ({overdue.length})</h2>
              <ul className="space-y-2">
                {overdue.map(({ patient, dueDate }) => (
                  <li key={patient.id} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Link to={`/dashboard/patients/${patient.id}`} className="font-medium text-amber-900 hover:underline">
                      {patient.firstName} {patient.lastName}
                    </Link>
                    <span className="text-amber-800 text-sm">Due {formatDisplayDate(dueDate)} (overdue)</span>
                    <span className="text-amber-700 text-xs">Last cleaning: {patient.lastCleaningDate ? formatDisplayDate(patient.lastCleaningDate) : "—"} · Every {patient.recallIntervalMonths} mo</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6">
            <h2 className="text-lg font-medium text-navy mb-4">Upcoming recall</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sky/40">
                  <th className="text-left py-2 font-medium text-navy">Patient</th>
                  <th className="text-left py-2 font-medium text-navy">Due date</th>
                  <th className="text-left py-2 font-medium text-navy">Last cleaning</th>
                  <th className="text-left py-2 font-medium text-navy">Interval</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {dueSoon.map(({ patient, dueDate }) => (
                  <tr key={patient.id} className="border-b border-sky/20">
                    <td className="py-2">
                      <Link to={`/dashboard/patients/${patient.id}`} className="font-medium text-navy hover:underline">
                        {patient.firstName} {patient.lastName}
                      </Link>
                    </td>
                    <td className="py-2 text-navy/80">{formatDisplayDate(dueDate)}</td>
                    <td className="py-2 text-navy/80">{patient.lastCleaningDate ? formatDisplayDate(patient.lastCleaningDate) : "—"}</td>
                    <td className="py-2 text-navy/80">Every {patient.recallIntervalMonths} mo</td>
                    <td className="py-2">
                      <Link to={`/dashboard/patients/${patient.id}`} className="text-sky-dark text-sm font-medium hover:underline">Chart</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="mt-4 text-xs text-navy/60">Appointment reminders (email/SMS) would require a backend integration.</p>
    </div>
  );
}
