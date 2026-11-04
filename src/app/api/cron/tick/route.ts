import { NextResponse } from "next/server";
import { agentLog } from "@/lib/agent-debug-log";
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
  const authorization = request.headers.get("authorization");
  const xCron = request.headers.get("x-cron-secret");

  if (!secret || !cronAuthorized(request, secret)) {
    const authFormat = authorization
      ? authorization.trim().startsWith("Bearer ")
        ? "bearer"
        : "raw"
      : "missing";
    // #region agent log
    agentLog(
      "api/cron/tick/route.ts:GET",
      "cron auth rejected",
      {
        hasCronSecret: Boolean(secret),
        authHeaderPresent: Boolean(authorization),
        xCronHeaderPresent: Boolean(xCron),
        authFormat,
      },
      !secret ? "A" : "B",
    );
    // #endregion
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runCronTick();
    // #region agent log
    agentLog(
      "api/cron/tick/route.ts:GET",
      "cron auth ok",
      { ok: true },
      "C",
    );
    // #endregion
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
