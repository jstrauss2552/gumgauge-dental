import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getStoredTimezone,
  setStoredTimezone,
  type TimezoneId,
} from "../constants/timezones";

const TimezoneContext = createContext<{
  timezone: TimezoneId;
  setTimezone: (tz: TimezoneId) => void;
} | null>(null);

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const [timezone, setTimezoneState] = useState<TimezoneId>(getStoredTimezone);

  useEffect(() => {
    setTimezoneState(getStoredTimezone());
  }, []);

  const setTimezone = (tz: TimezoneId) => {
    setStoredTimezone(tz);
    setTimezoneState(tz);
  };

  return (
    <TimezoneContext.Provider value={{ timezone, setTimezone }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezoneContext() {
  const ctx = useContext(TimezoneContext);
  if (!ctx) throw new Error("useTimezoneContext must be used within TimezoneProvider");
  return ctx;
}
