import { chicagoLocalToDate } from "./dates.js";

/** Active when shown, has a message and an end, and start <= now < end (Chicago wall time). */
export function isAlertActive(alert, now) {
  if (!alert || !alert.show) return false;
  if (!String(alert.message || "").trim()) return false;
  if (!alert.end) return false;
  const end = chicagoLocalToDate(alert.end);
  if (now >= end) return false;
  if (alert.start && now < chicagoLocalToDate(alert.start)) return false;
  return true;
}
