import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addStaff } from "../storage/staffStorage";
import { STAFF_POSITION_GROUPS, STAFF_STATUSES } from "../constants/staffPositions";

const empty = {
  firstName: "",
  lastName: "",
  position: "",
  email: "",
  phone: "",
  loginEmail: "",
  password: "",
  hireDate: new Date().toISOString().slice(0, 10),
  status: "Active",
  licenseNumber: "",
  licenseExpiry: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  notes: "",
};

export default function StaffNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);

  const update = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toOptional = (s: string) => (s.trim() ? s.trim() : undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = addStaff({
      firstName: form.firstName,
      lastName: form.lastName,
      position: form.position,
      email: toOptional(form.email),
      phone: toOptional(form.phone),
      loginEmail: toOptional(form.loginEmail) ?? "",
      password: form.password,
      hireDate: form.hireDate,
      status: form.status,
      licenseNumber: toOptional(form.licenseNumber),
      licenseExpiry: toOptional(form.licenseExpiry),
      emergencyContactName: toOptional(form.emergencyContactName),
      emergencyContactPhone: toOptional(form.emergencyContactPhone),
      notes: toOptional(form.notes),
    });
    navigate(`/dashboard/staff/${staff.id}`, { replace: true });
  };

  const section = (title: string, children: React.ReactNode) => (
    <section>
      <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="p-8">
      <Link to="/dashboard/staff" className="text-sky-dark text-sm font-medium hover:underline mb-4 inline-block">
        ← Staff
      </Link>
      <h1 className="text-2xl font-semibold text-navy mb-6">Add staff member</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-sky/40 p-6 space-y-6 max-w-2xl">
        {section("Basic information", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy/70 mb-1">First name *</label>
              <input required value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Last name *</label>
              <input required value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-navy/70 mb-1">Position *</label>
              <select required value={form.position} onChange={(e) => update("position", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white">
                <option value="">Select position</option>
                {STAFF_POSITION_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.positions.map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white">
                {STAFF_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Hire date *</label>
              <input required type="date" value={form.hireDate} onChange={(e) => update("hireDate", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
            </div>
          </div>
        ))}

        {section("Contact", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy/70 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
            </div>
          </div>
        ))}

        {section("Login credentials", (
          <>
            <p className="text-xs text-navy/60 mb-2">Assigned credentials for this employee to sign in to GumGauge. Leave blank if they will not use sign-in.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-navy/70 mb-1">Login email or username</label>
                <input type="text" autoComplete="off" value={form.loginEmail} onChange={(e) => update("loginEmail", e.target.value)} placeholder="e.g. jane@practice.com" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm text-navy/70 mb-1">Password</label>
                <input type="password" autoComplete="new-password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Set password for sign-in" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
              </div>
            </div>
          </>
        ))}

        {section("License / certification", (
          <>
            <p className="text-xs text-navy/60 mb-2">For roles that require a license (e.g. Dentist, Hygienist, CDA)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy/70 mb-1">License number</label>
              <input value={form.licenseNumber} onChange={(e) => update("licenseNumber", e.target.value)} placeholder="e.g. state license #" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">License expiry</label>
              <input type="date" value={form.licenseExpiry} onChange={(e) => update("licenseExpiry", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
            </div>
            </div>
          </>
        ))}

        {section("Emergency contact", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-navy/70 mb-1">Name</label>
              <input value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Phone</label>
              <input value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
            </div>
          </div>
        ))}

        {section("Notes", (
          <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Internal notes about this staff member" className="w-full px-3 py-2 border border-sky/60 rounded-lg resize-y" />
        ))}

        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light">
            Save staff member
          </button>
          <Link to="/dashboard/staff" className="px-4 py-2 border border-navy/30 rounded-lg font-medium inline-block">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
