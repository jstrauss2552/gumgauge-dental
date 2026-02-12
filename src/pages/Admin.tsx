import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { ADMIN_SESSION_KEY, ADMIN_PASSWORD } from "../constants/admin";

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") setAuthenticated(true);
    } catch {}
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      } catch {}
      setAuthenticated(true);
    } else {
      setError("Invalid password.");
    }
  };

  if (authenticated) {
    return <Navigate to="/dashboard/clinic-log" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-white text-center mb-2">GumGauge Admin</h1>
        <p className="text-sky-light/90 text-sm text-center mb-6">
          Company login. View clinics and device usage.
        </p>
        <form onSubmit={handleLogin} className="bg-white/10 rounded-xl border border-white/20 p-6 space-y-4">
          <div>
            <label className="block text-sky-light/90 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border border-sky/60 bg-white text-navy"
            />
          </div>
          {error && (
            <p className="text-amber-200 text-sm bg-amber-900/30 px-3 py-2 rounded-lg" role="alert">{error}</p>
          )}
          <button type="submit" className="w-full px-4 py-2 bg-white text-navy font-medium rounded-lg hover:bg-sky-light">
            Log in
          </button>
        </form>
        <p className="mt-4 text-center">
          <Link to="/" className="text-sky-light hover:text-white text-sm font-medium">
            ← Back
          </Link>
        </p>
      </div>
    </div>
  );
}
