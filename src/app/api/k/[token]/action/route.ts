import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import {
  getOrCreateDayState,
  performTurnAction,
  type Routine,
} from "@/lib/day-state";
import { normalizeShareToken } from "@/lib/share-token";

const bodySchema = z.object({
  action: z.enum(["start", "done"]),
  routine: z.enum(["evening", "morning"]),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await context.params;
  const token = normalizeShareToken(rawToken);
  try {
    const body = bodySchema.parse(await request.json());
    const db = getDb();
    const [kid] = await db
      .select()
      .from(schema.kids)
      .where(eq(schema.kids.shareToken, token))
      .limit(1);
    if (!kid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [household] = await db
      .select()
      .from(schema.households)
      .where(eq(schema.households.id, kid.householdId))
      .limit(1);
    if (!household) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { dayState } = await getOrCreateDayState(household);
    const updated = await performTurnAction(
      kid,
      household,
      dayState,
      body.routine as Routine,
      body.action,
    );

    return NextResponse.json({ ok: true, dayStateId: updated.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
