const TZ = "America/Chicago";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const STYLES = {
  list: { weekday: "long", month: "short", day: "numeric" },
  post: { year: "numeric", month: "long", day: "numeric" },
  card: { month: "short", day: "numeric" },
  month: { month: "short" },
  day: { day: "numeric" },
};

const formatters = new Map();
function fmt(style, timeZone) {
  const key = `${style}|${timeZone}`;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.DateTimeFormat("en-US", { ...STYLES[style], timeZone }));
  }
  return formatters.get(key);
}

// Date-only strings are calendar dates (no zone): format them as UTC so they never shift.
// Everything else is an instant, shown in Chicago wall time.
export function formatDate(value, style) {
  if (!STYLES[style]) throw new Error(`Unknown date style: ${style}`);
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    return fmt(style, "UTC").format(new Date(`${value}T00:00:00Z`));
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${value}`);
  return fmt(style, TZ).format(d);
}

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ,
});

export function formatTime(value) {
  return timeFmt
    .format(value)
    .replace(/[  ]/g, " ")
    .replace(/\s?(AM|PM)$/, (_, p) => ` ${p.toLowerCase()}`);
}

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, hourCycle: "h23",
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
});

function chicagoOffsetMs(instant) {
  const p = Object.fromEntries(partsFmt.formatToParts(instant).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

// "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" read as America/Chicago wall time.
export function chicagoLocalToDate(local) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(local);
  if (!m) throw new Error(`Invalid Chicago local date: ${local}`);
  const [y, mo, d, h = 0, mi = 0] = m.slice(1).map((x) => (x === undefined ? undefined : +x));
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  let guess = wall - chicagoOffsetMs(new Date(wall));
  guess = wall - chicagoOffsetMs(new Date(guess));
  return new Date(guess);
}
