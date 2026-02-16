import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../contexts/AuthContext";

export default function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const { login } = useAuth();
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginEmail.trim() || !password) {
      setError("Please enter your login email and password.");
      return;
    }
    const ok = login(loginEmail.trim(), password);
    if (ok) {
      navigate(returnTo.startsWith("/") ? returnTo : `/${returnTo}`, { replace: true });
    } else {
      setError("Invalid login email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo size="lg" variant="dark" />
        </div>
        <h1 className="text-xl font-semibold text-white text-center mb-2">Sign in</h1>
        <p className="text-sky-light/90 text-sm text-center mb-6">
          Enter your clinic credentials to log in as your profile and treat patients.
        </p>
        <form onSubmit={handleSubmit} className="bg-white/10 rounded-xl border border-white/20 p-6 space-y-4" autoComplete="off">
          <div>
            <label className="block text-sky-light/90 text-sm mb-1">Login email or username</label>
            <input
              type="text"
              autoComplete="off"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="e.g. jane@practice.com"
              className="w-full px-3 py-2 rounded-lg border border-sky/60 bg-white text-navy"
            />
          </div>
          <div>
            <label className="block text-sky-light/90 text-sm mb-1">Password</label>
            <input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg border border-sky/60 bg-white text-navy"
            />
          </div>
          {error && (
            <p className="text-amber-200 text-sm bg-amber-900/30 px-3 py-2 rounded-lg" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-white text-navy font-medium rounded-lg hover:bg-sky-light border-2 border-black"
          >
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center">
          <Link to="/" className="text-sky-light hover:text-white text-sm font-medium">
            ← Back to Start System
          </Link>
        </p>
      </div>
    </div>
  );
}
