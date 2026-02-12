import React, { useState } from "react";

interface CollapsibleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Default open state when unmounted (e.g. from localStorage). If undefined, defaults to true. */
  defaultOpen?: boolean;
  /** Optional badge content (e.g. count) shown next to title */
  badge?: React.ReactNode;
}

export default function CollapsibleSection({
  id,
  title,
  subtitle,
  children,
  defaultOpen = true,
  badge,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(() => {
    try {
      const key = `gumgauge-chart-section-${id}`;
      const stored = localStorage.getItem(key);
      return stored !== null ? stored === "1" : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(`gumgauge-chart-section-${id}`, next ? "1" : "0");
    } catch {}
  };

  return (
    <section className="border-b border-sky/20 last:border-0">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 py-3 text-left focus:outline-none focus:ring-2 focus:ring-sky/50 focus:ring-inset rounded-lg"
        aria-expanded={open}
        aria-controls={`section-${id}`}
        id={`section-toggle-${id}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-block transition-transform ${open ? "rotate-90" : ""}`}
            aria-hidden
          >
            ▶
          </span>
          <h2 className="text-sm font-semibold text-navy uppercase tracking-wide">
            {title}
          </h2>
          {badge != null && (
            <span className="text-xs text-navy/60 font-normal normal-case">{badge}</span>
          )}
        </div>
      </button>
      {subtitle && open && (
        <p className="text-xs text-navy/60 mb-2 pl-6 -mt-1">{subtitle}</p>
      )}
      <div
        id={`section-${id}`}
        role="region"
        aria-labelledby={`section-toggle-${id}`}
        className={open ? "pb-4" : "hidden"}
      >
        {children}
      </div>
    </section>
  );
}
