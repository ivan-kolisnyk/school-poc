import { chicagoLocalToDate } from "./dates.js";

/** Chicago wall-time string to Date, or null (with a warning) when malformed. */
export function parseAlertDate(value, field) {
  try {
    // Reject overflowing components (month 13, hour 25) that Date.UTC would silently roll over.
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(String(value).trim());
    if (!m) throw new Error("format");
    const [y, mo, d0, h = 0, mi = 0] = m.slice(1).map(Number);
    const chk = new Date(Date.UTC(y, mo - 1, d0, h, mi));
    if (chk.getUTCMonth() !== mo - 1 || chk.getUTCDate() !== d0 || chk.getUTCHours() !== h || chk.getUTCMinutes() !== mi) throw new Error("range");
    const d = chicagoLocalToDate(String(value).trim());
    if (!Number.isNaN(d.getTime())) return d;
  } catch (e) { /* fall through */ }
  console.warn(`[alert] Invalid ${field} "${value}": expected YYYY-MM-DD or YYYY-MM-DDTHH:mm. Alert hidden.`);
  return null;
}

/** Active when shown, has a message and a valid end, and start <= now < end (Chicago wall time). Never throws. */
export function isAlertActive(alert, now) {
  if (!alert || !alert.show) return false;
  if (!String(alert.message || "").trim()) return false;
  if (!alert.end) return false;
  const end = parseAlertDate(alert.end, "end");
  if (!end) return false;
  let start = null;
  if (alert.start) {
    start = parseAlertDate(alert.start, "start");
    if (!start) return false;
  }
  return now < end && (!start || now >= start);
}
