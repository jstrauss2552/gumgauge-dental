import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { getStaff } from "../storage/staffStorage";
import { formatDisplayDate } from "../utils/dateFormat";
import { STAFF_POSITION_GROUPS } from "../constants/staffPositions";

export default function StaffList() {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const staff = useMemo(() => getStaff(), []);
  const filtered = useMemo(() => {
    let list = staff;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          s.position.toLowerCase().includes(q)
      );
    }
    if (positionFilter) {
      list = list.filter((s) => s.position === positionFilter);
    }
    return list.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  }, [staff, search, positionFilter]);

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-navy">Staff</h1>
        <Link
          to="/dashboard/staff/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light transition-colors"
        >
          + Add staff member
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input
          type="search"
          placeholder="Search by name, email, or position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-sky/60 rounded-lg bg-white text-navy placeholder-navy/50 focus:outline-none focus:ring-2 focus:ring-sky focus:border-transparent"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-navy/70 whitespace-nowrap">Position</label>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="px-3 py-2 border border-sky/60 rounded-lg bg-white text-navy min-w-[200px]"
          >
            <option value="">All positions</option>
            {STAFF_POSITION_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.positions.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-sky/40 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-navy/60">
            {staff.length === 0
              ? "No staff yet. Add your first staff member above."
              : "No staff match your search or filter."}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-navy/5 border-b border-sky/40">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Position</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Hire date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-navy">Contact</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-sky/20 hover:bg-sky/10">
                  <td className="py-3 px-4 font-medium text-navy">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="py-3 px-4 text-navy/80">{s.position}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        s.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : s.status === "On leave"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-navy/10 text-navy/70"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-navy/80">{formatDisplayDate(s.hireDate)}</td>
                  <td className="py-3 px-4 text-navy/80 text-sm">
                    {s.email || s.phone || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/dashboard/staff/${s.id}`}
                      className="text-sky-dark font-medium text-sm hover:underline"
                    >
                      View
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
