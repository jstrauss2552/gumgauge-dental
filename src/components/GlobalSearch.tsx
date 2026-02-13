import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPatients } from "../storage";
import type { Patient } from "../types";

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Patient[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.trim().toLowerCase();
    const patients = getPatients();
    const match = patients.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.dateOfBirth && p.dateOfBirth.includes(q)) ||
        (p.phone && p.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))) ||
        (p.email && p.email.toLowerCase().includes(q))
    );
    setResults(match.slice(0, 10));
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative px-3 pb-2">
      <label className="sr-only" htmlFor="global-search">Search patients</label>
      <input
        ref={inputRef}
        id="global-search"
        type="search"
        placeholder="Search patients (Ctrl+K)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="w-full px-3 py-2 text-sm rounded-lg bg-navy-light/50 border border-navy-light text-white placeholder:text-sky-light/70 focus:outline-none focus:ring-1 focus:ring-sky"
      />
      {open && (query.trim() || results.length > 0) && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-white border border-sky/40 rounded-lg shadow-xl max-h-64 overflow-auto">
          {results.length === 0 ? (
            <p className="p-3 text-sm text-navy/60">No patients match.</p>
          ) : (
            <ul className="py-1">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/dashboard/patients/${p.id}`);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-navy hover:bg-sky/10 flex justify-between gap-2"
                  >
                    <span className="font-medium">{p.firstName} {p.lastName}</span>
                    <span className="text-navy/60 truncate">{p.dateOfBirth}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
