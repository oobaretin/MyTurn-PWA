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
  const origin = requestOrigin(request);
  if (!origin) return `/k/${shareToken}`;
  return `${origin}/k/${shareToken}`;
}
