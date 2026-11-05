import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import {
  authorizeHouseholdAdmin,
  loadHousehold,
} from "@/lib/household-admin";

const deleteSchema = z.object({
  pin: z.string().optional(),
  confirm: z.literal(true),
});

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

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
    await db.delete(schema.households).where(eq(schema.households.id, id));

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
