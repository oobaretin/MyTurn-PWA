/** Normalize kid share token from URL path or route param. */
export function normalizeShareToken(raw: string): string {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}
