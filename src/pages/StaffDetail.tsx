import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getStaffById, updateStaff, deleteStaff } from "../storage/staffStorage";
import { getPatients } from "../storage";
import type { Staff } from "../types";
import { formatDisplayDate } from "../utils/dateFormat";
import { STAFF_POSITION_GROUPS, STAFF_STATUSES, STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS } from "../constants/staffPositions";

function Field({
  label,
  value,
  editing,
  formValue,
  onChange,
  type = "text",
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  editing: boolean;
  formValue: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className={rows ? "md:col-span-2" : ""}>
      {label ? <label className="block text-sm text-navy/70 mb-1">{label}</label> : null}
      {editing ? (
        type === "textarea" ? (
          <textarea
            value={formValue}
            onChange={(e) => onChange(e.target.value)}
            rows={rows ?? 3}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-sky/60 rounded-lg resize-y"
          />
        ) : (
          <input
            type={type}
            value={formValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-sky/60 rounded-lg"
          />
        )
      ) : (
        <p className="text-navy">{value || "—"}</p>
      )}
    </div>
  );
}

export default function StaffDetail() {
  const { id } = useParams<"id">();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(getStaffById(id || ""));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Staff | null>(staff || null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const s = getStaffById(id || "");
    setStaff(s);
    setForm(s || null);
  }, [id]);

  if (!staff) {
    return (
      <div className="p-8">
        <p className="text-navy/70">Staff member not found.</p>
        <Link to="/dashboard/staff" className="text-sky-dark font-medium mt-2 inline-block hover:underline">
          Back to staff
        </Link>
      </div>
    );
  }

  const handleSave = () => {
    if (!form) return;
    const updates = { ...form };
    if (newPassword.trim() !== "") {
      updates.password = newPassword;
      setNewPassword("");
    }
    updateStaff(staff.id, updates);
    setStaff(getStaffById(staff.id)!);
    setForm(getStaffById(staff.id));
    setEditing(false);
  };

  const handleDelete = () => {
    deleteStaff(staff.id);
    navigate("/dashboard/staff", { replace: true });
  };

  const update = (key: keyof Staff, value: string) => {
    if (!form) return;
    setForm({ ...form, [key]: value });
  };

  const section = (title: string, children: React.ReactNode) => (
    <section>
      <h2 className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </section>
  );

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link to="/dashboard/staff" className="text-sky-dark text-sm font-medium hover:underline mb-2 inline-block">
            ← Staff
          </Link>
          <h1 className="text-2xl font-semibold text-navy">
            {staff.firstName} {staff.lastName}
          </h1>
          <p className="text-navy/70 mt-1">{staff.position}</p>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light"
              >
                Edit
              </button>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50"
                >
                  Delete
                </button>
              ) : (
                <>
                  <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">
                    Confirm delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-4 py-2 border border-navy/30 rounded-lg"
                  >
                    Cancel
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button onClick={handleSave} className="px-4 py-2 bg-navy text-white rounded-lg font-medium hover:bg-navy-light">
                Save
              </button>
              <button
                onClick={() => {
                  setForm(staff);
                  setEditing(false);
                  setConfirmDelete(false);
                  setNewPassword("");
                }}
                className="px-4 py-2 border border-navy/30 rounded-lg"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-sky/40 p-6 space-y-6">
        {section("Basic information", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First name" value={staff.firstName} editing={!!editing && !!form} formValue={form?.firstName ?? ""} onChange={(v) => update("firstName", v)} />
            <Field label="Last name" value={staff.lastName} editing={!!editing && !!form} formValue={form?.lastName ?? ""} onChange={(v) => update("lastName", v)} />
            <div className={form ? "" : "md:col-span-2"}>
              <label className="block text-sm text-navy/70 mb-1">Position</label>
              {editing && form ? (
                <select value={form.position} onChange={(e) => update("position", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white">
                  {STAFF_POSITION_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.positions.map((pos) => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <p className="text-navy">{staff.position}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-navy/70 mb-1">Status</label>
              {editing && form ? (
                <select value={form.status} onChange={(e) => update("status", e.target.value)} className="w-full px-3 py-2 border border-sky/60 rounded-lg bg-white">
                  {STAFF_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <p className="text-navy">{staff.status}</p>
              )}
            </div>
            <Field label="Hire date" value={staff.hireDate ? formatDisplayDate(staff.hireDate) : ""} editing={!!editing && !!form} formValue={form?.hireDate ?? ""} type="date" onChange={(v) => update("hireDate", v)} />
          </div>
        ))}

        {section("Contact", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" value={staff.email ?? ""} editing={!!editing && !!form} formValue={form?.email ?? ""} type="email" onChange={(v) => update("email", v)} />
            <Field label="Phone" value={staff.phone ?? ""} editing={!!editing && !!form} formValue={form?.phone ?? ""} onChange={(v) => update("phone", v)} />
          </div>
        ))}

        {section("Login credentials", (
          <>
            <p className="text-xs text-navy/60 mb-2">Used by this employee to sign in. Do not display or share passwords.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {editing && form ? (
                <>
                  <div>
                    <label className="block text-sm text-navy/70 mb-1">Login email or username</label>
                    <input type="text" autoComplete="off" value={form.loginEmail ?? ""} onChange={(e) => update("loginEmail", e.target.value)} placeholder="e.g. jane@practice.com" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm text-navy/70 mb-1">New password (leave blank to keep current)</label>
                    <input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2 border border-sky/60 rounded-lg" />
                  </div>
                </>
              ) : (
                <>
                  <Field label="Login email or username" value={staff.loginEmail ?? "—"} editing={false} formValue="" onChange={() => {}} />
                  <p className="text-navy/60 text-sm">Password is not displayed.</p>
                </>
              )}
            </div>
          </>
        ))}

        {section("License / certification", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="License number" value={staff.licenseNumber ?? ""} editing={!!editing && !!form} formValue={form?.licenseNumber ?? ""} placeholder="e.g. state license #" onChange={(v) => update("licenseNumber", v)} />
            <Field label="License expiry" value={staff.licenseExpiry ?? ""} editing={!!editing && !!form} formValue={form?.licenseExpiry ?? ""} type="date" onChange={(v) => update("licenseExpiry", v)} />
          </div>
        ))}

        {section("Emergency contact", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name" value={staff.emergencyContactName ?? ""} editing={!!editing && !!form} formValue={form?.emergencyContactName ?? ""} onChange={(v) => update("emergencyContactName", v)} />
            <Field label="Phone" value={staff.emergencyContactPhone ?? ""} editing={!!editing && !!form} formValue={form?.emergencyContactPhone ?? ""} onChange={(v) => update("emergencyContactPhone", v)} />
          </div>
        ))}

        {section("Notes", (
          <Field label="" value={staff.notes ?? ""} editing={!!editing && !!form} formValue={form?.notes ?? ""} type="textarea" rows={4} placeholder="Internal notes" onChange={(v) => update("notes", v)} />
        ))}

        {STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS.includes(staff.position as (typeof STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS)[number]) && (
          section("Assigned patients", (
            <>
              <p className="text-xs text-navy/60 mb-2">Patients assigned to this provider. They will see these in &quot;My patients&quot;.</p>
              {editing && form ? (
                <div className="max-h-48 overflow-y-auto border border-sky/40 rounded-lg p-2 space-y-1">
                  {getPatients().map((p) => {
                    const assigned = (form.assignedPatientIds ?? []).includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-sky/10 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={assigned}
                          onChange={(e) => {
                            if (!form) return;
                            const ids = form.assignedPatientIds ?? [];
                            const next = e.target.checked ? [...ids, p.id] : ids.filter((id) => id !== p.id);
                            setForm({ ...form, assignedPatientIds: next });
                          }}
                          className="rounded border-sky/60"
                        />
                        <span className="text-sm text-navy">{p.firstName} {p.lastName}</span>
                        <span className="text-xs text-navy/60">{formatDisplayDate(p.dateOfAppointment)}</span>
                      </label>
                    );
                  })}
                  {getPatients().length === 0 && <p className="text-navy/60 text-sm">No patients in the system yet.</p>}
                </div>
              ) : (
                <ul className="space-y-1">
                  {(staff.assignedPatientIds ?? []).length === 0 ? (
                    <li className="text-navy/60 text-sm">No patients assigned.</li>
                  ) : (
                    getPatients()
                      .filter((p) => (staff.assignedPatientIds ?? []).includes(p.id))
                      .map((p) => (
                        <li key={p.id} className="flex items-center gap-2">
                          <Link to={`/dashboard/patients/${p.id}`} className="text-sky-dark font-medium hover:underline text-sm">
                            {p.firstName} {p.lastName}
                          </Link>
                          <span className="text-xs text-navy/60">{formatDisplayDate(p.dateOfAppointment)}</span>
                        </li>
                      ))
                  )}
                </ul>
              )}
            </>
          ))
        )}
      </div>
    </div>
  );
}
