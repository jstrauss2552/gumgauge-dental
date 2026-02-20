import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useTimezoneContext } from "../contexts/TimezoneContext";
import { useAuth } from "../contexts/AuthContext";
import { useClock } from "../hooks/useAppTimezone";
import { getClinic } from "../storage/clinicStorage";
import { US_TIMEZONES } from "../constants/timezones";
import { STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS, DENTIST_POSITIONS_FOR_CHART_DELETE } from "../constants/staffPositions";
import { ADMIN_SESSION_KEY, DEMO_MODE_KEY } from "../constants/admin";
import type { TimezoneId } from "../constants/timezones";
import GlobalSearch from "./GlobalSearch";

const baseNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/dashboard/analytics", label: "Analytics" },
  { to: "/dashboard/patients", label: "Patients" },
  { to: "/dashboard/billing", label: "Billing" },
  { to: "/dashboard/staff", label: "Staff" },
  { to: "/dashboard/appointments", label: "Appointments" },
  { to: "/dashboard/device-scan", label: "Device Scan" },
  { to: "/dashboard/recall", label: "Recall" },
  { to: "/dashboard/audit", label: "Audit log" },
  { to: "/dashboard/backup", label: "Backup" },
  { to: "/dashboard/clinic", label: "Clinic" },
];

export default function Layout() {
  const navigate = useNavigate();
  const clinic = getClinic();
  const { timezone, setTimezone } = useTimezoneContext();
  const { staff, isSignedIn, isAdmin, logout } = useAuth();
  const { full } = useClock(timezone);

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="w-56 flex-shrink-0 bg-navy flex flex-col">
        <div className="p-4 border-b border-navy-light bg-transparent">
          <Logo size="md" />
          {clinic?.name && (
            <p className="text-sky-light text-xs mt-2 truncate" title={clinic.name}>
              {clinic.name}
            </p>
          )}
        </div>
        <GlobalSearch />
        <nav className="flex-1 p-3 space-y-1">
          {(() => {
            const isAdmin = typeof sessionStorage !== "undefined" && sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
            const isDemo = typeof sessionStorage !== "undefined" && sessionStorage.getItem(DEMO_MODE_KEY) === "1";
            let navItems = staff && STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS.includes(staff.position as (typeof STAFF_POSITIONS_WITH_ASSIGNED_PATIENTS)[number])
              ? [...baseNavItems, { to: "/dashboard/my-patients", label: "My patients" }]
              : baseNavItems;
            if (isDemo) {
              // In demo, show all main tabs (no "My patients" — no signed-in staff)
              navItems = baseNavItems;
            }
            const items = isAdmin ? [...navItems, { to: "/dashboard/clinic-log", label: "Clinic Log" }] : navItems;
            return items;
          })().map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sky/20 text-white"
                    : "text-sky-light hover:bg-navy-light hover:text-white"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-navy-light space-y-3">
          <div>
            <label className="block text-sky-light/80 text-xs mb-1 px-1">Time zone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value as TimezoneId)}
              className="w-full px-2 py-1.5 text-xs rounded bg-navy-light/50 text-white border border-navy-light focus:outline-none focus:ring-1 focus:ring-sky"
            >
              {US_TIMEZONES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sky-light/90 text-xs px-1 leading-tight" title={full}>
            {full}
          </p>
          {isSignedIn && staff ? (
            <>
              <p className="text-sky-light text-xs px-1 font-medium">
                Signed in as {DENTIST_POSITIONS_FOR_CHART_DELETE.includes(staff.position as (typeof DENTIST_POSITIONS_FOR_CHART_DELETE)[number]) ? `Dr. ${staff.firstName} ${staff.lastName}` : `${staff.firstName} ${staff.lastName}`}
              </p>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/", { replace: true });
                }}
                className="w-full mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-white/10 text-sky-light hover:bg-white/20 transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (typeof sessionStorage !== "undefined" && sessionStorage.getItem(DEMO_MODE_KEY) === "1") ? (
            <>
              <p className="text-sky-light text-xs px-1 font-medium">Demo mode</p>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem(DEMO_MODE_KEY);
                  } catch {}
                  navigate("/", { replace: true });
                }}
                className="w-full mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-white/10 text-sky-light hover:bg-white/20 transition-colors"
              >
                Exit demo
              </button>
            </>
          ) : isAdmin ? (
            <>
              <p className="text-sky-light text-xs px-1 font-medium">Admin</p>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem(ADMIN_SESSION_KEY);
                  } catch {}
                  navigate("/", { replace: true });
                }}
                className="w-full mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-white/10 text-sky-light hover:bg-white/20 transition-colors"
              >
                Log out (Admin)
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/signin"
                className="block w-full mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-white/10 text-sky-light hover:bg-white/20 transition-colors text-center"
              >
                Sign in
              </NavLink>
              <button
                type="button"
                onClick={() => navigate("/", { replace: true })}
                className="w-full mt-2 px-4 py-2 text-xs font-medium rounded-lg bg-white/10 text-sky-light hover:bg-white/20 transition-colors"
              >
                Log out
              </button>
            </>
          )}
          <p className="text-sky-light/80 text-xs px-4">GumGauge Dental</p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-sky-light/30">
        <Outlet />
      </main>
    </div>
  );
}
