function canonicalProductionOrigin(): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit?.startsWith("http")) return explicit;
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (!prod) return null;
  return prod.startsWith("http")
    ? prod.replace(/\/$/, "")
    : `https://${prod.replace(/\/$/, "")}`;
}

/** Public site origin for the incoming request (works on Vercel and local dev). */
export function requestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host =
    forwardedHost?.split(",")[0]?.trim() || request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    "https";
  if (!host) return "";
  return `${proto}://${host}`;
}

export function kidShareUrl(request: Request, shareToken: string): string {
  const origin = canonicalProductionOrigin() || requestOrigin(request);
  if (!origin) return `/k/${shareToken}`;
  return `${origin}/k/${shareToken}`;
}

