import { NextResponse } from "next/server";
import { runCronTick } from "@/lib/cron-tick";

function cronAuthorized(request: Request, secret: string): boolean {
  const trimmedSecret = secret.trim();
  const authorization = request.headers.get("authorization")?.trim();
  if (authorization === `Bearer ${trimmedSecret}`) return true;
  if (authorization === trimmedSecret) return true;
  const xCron = request.headers.get("x-cron-secret")?.trim();
  if (xCron === trimmedSecret) return true;
  return false;
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();

  if (!secret || !cronAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runCronTick();
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
