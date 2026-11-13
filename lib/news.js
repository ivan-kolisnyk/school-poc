const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const chicagoDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
});

/**
 * The posts after `currentUrl` in newest-first order, wrapping to the newest.
 * Never includes the current post; returns fewer than `n` when there are not enough posts.
 */
export function nextHeadlines(posts, currentUrl, n = 2) {
  const list = Array.isArray(posts) ? posts : [];
  const at = list.findIndex((p) => p.url === currentUrl);
  const others = list.length - (at === -1 ? 0 : 1);
  const out = [];
  for (let step = 1; out.length < Math.min(n, others) && step <= list.length; step++) {
    const post = list[(at + step + list.length) % list.length];
    if (post.url !== currentUrl) out.push(post);
  }
  return out;
}

/**
 * A post's calendar day as "YYYY-MM-DD".
 * Front matter `date: 2026-11-12` arrives as midnight UTC: that is a calendar date and must not
 * shift to Nov 11 in Chicago. Any other instant is read as Chicago wall time.
 */
export function newsDay(value) {
  if (typeof value === "string" && DATE_ONLY.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid news date: ${value}`);
  const utcMidnight =
    d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
  return utcMidnight ? d.toISOString().slice(0, 10) : chicagoDay.format(d);
}

/** True when a post can show its photo: both the image and its alt text are set. */
export function hasPhoto(data) {
  return Boolean(data && String(data.image ?? "").trim() && String(data.image_alt ?? "").trim());
}
