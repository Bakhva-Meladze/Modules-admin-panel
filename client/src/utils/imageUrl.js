/**
 * Turn DB `products.image_url` into a browser URL.
 * Stored value is usually a bare filename (e.g. `uuid.webp`); legacy rows may use `/uploads/...`
 * or `uploads/...`. Accepts non-ASCII / punctuation in the basename (encoded in the path).
 */
export function publicImageSrc(imageUrl) {
  if (imageUrl == null) return null;
  const raw = String(imageUrl).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;

  const normalized = raw.replace(/\\/g, "/").replace(/^\/?uploads\//i, "");
  const segments = normalized.split("/").filter(Boolean);
  const base = segments.pop() || "";
  if (!base || base === "." || base === ".." || segments.some((p) => p === "..")) return null;

  const root = String(import.meta.env.VITE_IMAGE_URL_PREFIX || "").replace(/\/$/, "");
  const path = `/uploads/${encodeURIComponent(base)}`;
  return root ? `${root}${path}` : path;
}
