const HONORIFIC = /^(mr|mrs|ms|miss|dr)\.?$/i;

/** Two capitals for the initials circle: first and last name, honorific skipped. */
export function initials(name) {
  const words = String(name ?? "").trim().split(/\s+/).filter((w) => w && !HONORIFIC.test(w));
  if (!words.length) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** [{ name, people }] for each non-empty group, in `order`; people sorted by `order` then name. */
export function staffGroups(items, order) {
  return order
    .map((name) => ({
      name,
      people: items
        .filter((i) => i.data.group === name)
        .sort((a, b) => (a.data.order ?? 1e9) - (b.data.order ?? 1e9) || String(a.data.name).localeCompare(String(b.data.name)))
        .map((i) => i.data),
    }))
    .filter((g) => g.people.length);
}

/** Why a person's photo cannot be shown (needs photo_alt and an existing file), or null. */
export function staffPhotoIssue(data, exists = () => true) {
  const photo = String(data?.photo ?? "").trim();
  if (!photo) return null;
  if (!String(data?.photo_alt ?? "").trim()) return "has a photo but no photo_alt";
  if (!exists(photo, data)) return `photo file not found: ${photo}`;
  return null;
}
