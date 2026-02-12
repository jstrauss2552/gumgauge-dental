import { useEffect, useState } from "react";
import type { TimezoneId } from "../constants/timezones";
import { formatDateTimeInTimezone, getTodayInTimezone } from "../utils/dateFormat";

/**
 * Returns live date/time in the given timezone, updating every second.
 */
export function useClock(timeZone: TimezoneId): { date: string; time: string; full: string } {
  const [dt, setDt] = useState(() => formatDateTimeInTimezone(timeZone));

  useEffect(() => {
    setDt(formatDateTimeInTimezone(timeZone));
    const id = setInterval(() => setDt(formatDateTimeInTimezone(timeZone)), 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  return dt;
}

/**
 * Returns today's date (YYYY-MM-DD) in the given timezone. Updates every minute.
 */
export function useTodayInTimezone(timeZone: TimezoneId): string {
  const [today, setToday] = useState(() => getTodayInTimezone(timeZone));

  useEffect(() => {
    setToday(getTodayInTimezone(timeZone));
    const id = setInterval(() => setToday(getTodayInTimezone(timeZone)), 60_000);
    return () => clearInterval(id);
  }, [timeZone]);

  return today;
}
