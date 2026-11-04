import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { hasAdminSession, hashPin, verifyPin } from "@/lib/auth";

const patchSchema = z.object({
  pin: z.string().optional(),
  name: z.string().min(1).max(80).optional(),
  timezone: z.string().optional(),
  eveningStartTime: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/)
    .optional(),
  morningStartTime: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/)
    .optional(),
  minutesPerTurn: z.number().int().min(5).max(60).optional(),
  schoolDaysOnly: z.boolean().optional(),
  newPin: z.string().min(4).max(8).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const db = getDb();
    const [household] = await db
      .select()
      .from(schema.households)
      .where(eq(schema.households.id, id))
      .limit(1);
    if (!household) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const kids = await db
      .select()
      .from(schema.kids)
      .where(eq(schema.kids.householdId, id));

    const authed = await hasAdminSession(id);

    return NextResponse.json({
      authed,
      household: {
        id: household.id,
        name: household.name,
        timezone: household.timezone,
        eveningStartTime: household.eveningStartTime,
        morningStartTime: household.morningStartTime,
        minutesPerTurn: household.minutesPerTurn,
        schoolDaysOnly: household.schoolDaysOnly,
        hasPin: Boolean(household.adminPinHash),
      },
      kids: kids.map((k) => ({
        id: k.id,
        name: k.name,
        color: k.color,
        sharePath: `/k/${k.shareToken}`,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const body = patchSchema.parse(await request.json());
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

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = body.name;
    if (body.timezone) updates.timezone = body.timezone;
    if (body.eveningStartTime) updates.eveningStartTime = body.eveningStartTime;
    if (body.morningStartTime) updates.morningStartTime = body.morningStartTime;
    if (body.minutesPerTurn) updates.minutesPerTurn = body.minutesPerTurn;
    if (body.schoolDaysOnly !== undefined) {
      updates.schoolDaysOnly = body.schoolDaysOnly;
    }
    if (body.newPin) {
      updates.adminPinHash = await hashPin(body.newPin);
    }

    if (Object.keys(updates).length > 0) {
      await db
        .update(schema.households)
        .set(updates)
        .where(eq(schema.households.id, id));
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
