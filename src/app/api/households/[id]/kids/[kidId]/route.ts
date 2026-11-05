import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { patchDayStateAfterKidRemoved } from "@/lib/day-state-kid-remove";
import {
  authorizeHouseholdAdmin,
  loadHousehold,
} from "@/lib/household-admin";

const deleteSchema = z.object({
  pin: z.string().optional(),
});

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; kidId: string }> },
) {
  const { id, kidId } = await context.params;

  try {
    const body = deleteSchema.parse(await request.json());
    const household = await loadHousehold(id);
    if (!household) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const authed = await authorizeHouseholdAdmin(household, body.pin);
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();
    const allKids = await db
      .select()
      .from(schema.kids)
      .where(eq(schema.kids.householdId, id));

    if (allKids.length <= 1) {
      return NextResponse.json(
        { error: "Keep at least one kid, or delete the whole household." },
        { status: 400 },
      );
    }

    const [kid] = await db
      .select()
      .from(schema.kids)
      .where(and(eq(schema.kids.id, kidId), eq(schema.kids.householdId, id)))
      .limit(1);
    if (!kid) {
      return NextResponse.json({ error: "Kid not found" }, { status: 404 });
    }

    const dayStates = await db
      .select()
      .from(schema.dayStates)
      .where(eq(schema.dayStates.householdId, id));

    for (const dayState of dayStates) {
      const patch = patchDayStateAfterKidRemoved(dayState, kidId);
      await db
        .update(schema.dayStates)
        .set(patch)
        .where(eq(schema.dayStates.id, dayState.id));
    }

    await db.delete(schema.kids).where(eq(schema.kids.id, kidId));

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
