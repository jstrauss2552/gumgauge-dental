/**
 * US timezones with example cities for the selector.
 * IANA timezone IDs used for Intl APIs.
 */
export const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern (New York, Boston, Miami)", abbr: "ET" },
  { value: "America/Chicago", label: "Central (Chicago, Houston, Dallas)", abbr: "CT" },
  { value: "America/Denver", label: "Mountain (Denver, Phoenix, Salt Lake City)", abbr: "MT" },
  { value: "America/Phoenix", label: "Arizona (Phoenix — no daylight saving)", abbr: "MST" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles, Seattle, San Francisco)", abbr: "PT" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)", abbr: "AKT" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)", abbr: "HT" },
] as const;

export type TimezoneId = (typeof US_TIMEZONES)[number]["value"];

export const DEFAULT_TIMEZONE: TimezoneId = "America/New_York";

const STORAGE_KEY = "gumgauge-timezone";

export function getStoredTimezone(): TimezoneId {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && US_TIMEZONES.some((z) => z.value === v)) return v as TimezoneId;
  } catch {}
  return DEFAULT_TIMEZONE;
}

export function setStoredTimezone(tz: TimezoneId): void {
  try {
    localStorage.setItem(STORAGE_KEY, tz);
  } catch {}
}
