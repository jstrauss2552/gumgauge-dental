/**
 * Format ISO date string (YYYY-MM-DD) to "Month Day, Year" e.g. February 8, 2025
 */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!m || m < 1 || m > 12) return isoDate;
  const month = MONTHS[m - 1];
  const day = d;
  const year = y;
  return `${month} ${day}, ${year}`;
}

/**
 * Get current date in "Month Day, Year" format (uses local machine time)
 */
export function getCurrentDateFormatted(): string {
  return formatDisplayDate(new Date().toISOString().slice(0, 10));
}

/**
 * Get today's date as YYYY-MM-DD in the given IANA timezone
 */
export function getTodayInTimezone(timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date()); // e.g. "2026-02-08"
}

/**
 * Format current date and time in the given timezone: "Month Day, Year" and time with period (e.g. "2:30 PM")
 */
export function formatDateTimeInTimezone(timeZone: string): { date: string; time: string; full: string } {
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);
  const timeStr = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(now);
  return { date: dateStr, time: timeStr, full: `${dateStr} · ${timeStr}` };
}

/**
 * Format an ISO timestamp in the given timezone (e.g. for "visit started at").
 */
export function formatISODateTimeInTimezone(isoString: string, timeZone: string): string {
  const date = new Date(isoString);
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
  return `${dateStr} · ${timeStr}`;
}
