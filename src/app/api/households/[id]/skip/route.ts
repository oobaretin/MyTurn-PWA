import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { hasAdminSession, verifyPin } from "@/lib/auth";
import {
  getOrCreateDayState,
  performTurnAction,
  type Routine,
} from "@/lib/day-state";

const bodySchema = z.object({
  pin: z.string().optional(),
  routine: z.enum(["evening", "morning"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const body = bodySchema.parse(await request.json());
    const db = getDb();
    const [household] = await db
      .select()
      .from(schema.households)
      .where(eq(schema.households.id, id))
      .limit(1);
    if (!household) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const authed = await hasAdminSession(id);
    if (!authed) {
      const ok = await verifyPin(body.pin ?? "", household.adminPinHash);
      if (!ok) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { dayState, kids } = await getOrCreateDayState(household);
    const routine = body.routine as Routine;
    const fields =
      routine === "evening"
        ? {
            order: dayState.eveningOrderKidIds,
            index: dayState.eveningTurnIndex,
          }
        : {
            order: dayState.morningOrderKidIds,
            index: dayState.morningTurnIndex,
          };

    const currentKidId = fields.order[fields.index];
    const kid = kids.find((k) => k.id === currentKidId);
    if (!kid) {
      return NextResponse.json({ error: "No active turn" }, { status: 400 });
    }

    await performTurnAction(kid, household, dayState, routine, "skip");
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
