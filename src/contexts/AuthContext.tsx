import React, { createContext, useContext, useState, useEffect } from "react";
import { getStaffById, getStaffByLogin } from "../storage/staffStorage";
import { setAuditActor } from "../storage/auditStorage";
import { ADMIN_SESSION_KEY } from "../constants/admin";
import type { Staff } from "../types";

const AUTH_STORAGE_KEY = "gumgauge-signed-in-staff-id";

function getIsAdmin(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

type AuthContextValue = {
  staff: Staff | null;
  /** True when staff is signed in OR admin is logged in (demo mode). */
  isSignedIn: boolean;
  /** True when admin is logged in; in that case no staff sign-in is required for actions. */
  isAdmin: boolean;
  login: (loginEmail: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staffId, setStaffId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(AUTH_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [staff, setStaff] = useState<Staff | null>(null);

  useEffect(() => {
    if (!staffId) {
      setStaff(null);
      return;
    }
    const s = getStaffById(staffId);
    setStaff(s || null);
    if (!s) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      setStaffId(null);
    }
  }, [staffId]);

  const login = (loginEmail: string, password: string): boolean => {
    const found = getStaffByLogin(loginEmail.trim(), password);
    if (found) {
      setStaffId(found.id);
      setAuditActor(`${found.firstName} ${found.lastName}`);
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, found.id);
      } catch {}
      return true;
    }
    return false;
  };

  const logout = () => {
    setStaffId(null);
    setStaff(null);
    setAuditActor(undefined);
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  };

  const isAdmin = getIsAdmin();
  const isSignedIn = !!staff || isAdmin;

  return (
    <AuthContext.Provider value={{ staff, isSignedIn, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
