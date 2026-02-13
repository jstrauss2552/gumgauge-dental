import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logo";
import { ADMIN_SESSION_KEY } from "../constants/admin";

export default function Splash() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const handleStart = () => {
    setStarting(true);
    setTimeout(() => navigate("/dashboard", { replace: true }), 400);
  };

  const handleDemo = () => {
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    } catch {}
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-navy relative">
      <div className="absolute top-6 right-6">
        <Link
          to="/admin"
          className="px-4 py-2 text-sky-light text-sm font-medium hover:text-white border border-white/30 rounded-lg hover:bg-white/10"
        >
          Admin Log-In
        </Link>
      </div>
      {/* Glimmer sweep across logo and text (runs until user leaves via button) */}
      <div className="splash-glimmer-wrapper flex flex-col items-center gap-8">
        <div className="splash-logo-glimmer">
          <Logo size="xl" variant="dark" />
        </div>
        <h1 className="splash-tagline-wrapper text-2xl sm:text-3xl md:text-4xl font-semibold text-center tracking-tight">
          <span className="splash-tagline-outline">GumGauge — The Future of Dental Care</span>
          <span className="splash-tagline-fill">GumGauge — The Future of Dental Care</span>
        </h1>
      </div>
      <div className="mt-12 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className="px-10 py-4 bg-white text-navy font-semibold text-lg rounded-xl border-2 border-black shadow-lg shadow-black/20 hover:bg-sky-light hover:shadow-xl hover:shadow-black/25 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-navy active:scale-[0.98] transition-all duration-200 disabled:opacity-80 disabled:hover:translate-y-0"
        >
          Start System
        </button>
        <button
          type="button"
          onClick={handleDemo}
          className="px-10 py-4 bg-amber-400 text-navy font-semibold text-lg rounded-xl border-2 border-amber-500 shadow-lg hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-navy active:scale-[0.98] transition-all duration-200"
        >
          Demo
        </button>
        <Link
          to="/signin"
          className="px-10 py-4 bg-white/10 text-white font-medium text-lg rounded-xl border-2 border-white/40 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-navy transition-all inline-block text-center"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
