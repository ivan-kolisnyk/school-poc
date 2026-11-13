/**
 * Why the homepage hero photo cannot be shown, or null when it can (or when none is set).
 * The photo needs `hero_alt` and an existing file; otherwise the labeled placeholder shows
 * (DESIGN.md 9, 10.3) and the build prints a warning — never a build failure.
 */
export function heroPhotoIssue(data, exists = () => true) {
  const image = String(data?.hero_image ?? "").trim();
  if (!image) return null;
  if (!String(data?.hero_alt ?? "").trim()) return "has a hero_image but no hero_alt";
  if (!exists(image, data)) return `hero_image file not found: ${image}`;
  return null;
}
