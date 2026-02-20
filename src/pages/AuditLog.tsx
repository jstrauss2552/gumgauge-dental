import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getAuditEntries } from "../storage/auditStorage";

export default function AuditLog() {
  const [entityFilter, setEntityFilter] = useState<string>("");
  const entries = getAuditEntries({ limit: 200 });
  const filtered = entityFilter ? entries.filter((e) => e.entityType === entityFilter) : entries;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-navy mb-2">Audit trail</h1>
      <p className="text-navy/70 mb-4">Who changed what and when. Last 200 entries.</p>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="text-sm text-navy/70">Filter by type</label>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy">
          <option value="">All</option>
          <option value="patient">Patient</option>
          <option value="staff">Staff</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-sky/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-navy/5 border-b border-sky/40">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-navy">Time</th>
              <th className="text-left py-3 px-4 font-medium text-navy">Actor</th>
              <th className="text-left py-3 px-4 font-medium text-navy">Staff ID</th>
              <th className="text-left py-3 px-4 font-medium text-navy">Action</th>
              <th className="text-left py-3 px-4 font-medium text-navy">Entity</th>
              <th className="text-left py-3 px-4 font-medium text-navy">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-navy/60">No audit entries.</td></tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="border-b border-sky/20 hover:bg-sky/5">
                  <td className="py-2 px-4 text-navy/80">{new Date(e.timestamp).toLocaleString()}</td>
                  <td className="py-2 px-4">{e.actor ?? "—"}</td>
                  <td className="py-2 px-4 text-navy/70 font-mono text-xs">{e.actorStaffId ?? "—"}</td>
                  <td className="py-2 px-4">{e.action}</td>
                  <td className="py-2 px-4">
                    {e.entityType === "patient" && <Link to={`/dashboard/patients/${e.entityId}`} className="text-sky-dark hover:underline">Chart</Link>}
                    {e.entityType === "staff" && <Link to={`/dashboard/staff/${e.entityId}`} className="text-sky-dark hover:underline">View</Link>}
                    {e.entityType !== "patient" && e.entityType !== "staff" && e.entityId}
                  </td>
                  <td className="py-2 px-4 text-navy/70">{e.details ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
