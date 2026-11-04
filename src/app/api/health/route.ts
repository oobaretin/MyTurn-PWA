import { NextResponse } from "next/server";

export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasVapid =
    Boolean(process.env.VAPID_PUBLIC_KEY) &&
    Boolean(process.env.VAPID_PRIVATE_KEY);

  return NextResponse.json({
    ok: hasDatabaseUrl,
    database: hasDatabaseUrl ? "configured" : "missing",
    push: hasVapid ? "configured" : "missing",
  });
}
