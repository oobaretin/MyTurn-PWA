import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { hashPin, setAdminSession } from "@/lib/auth";
import { generateHouseholdId, generateShareToken } from "@/lib/tokens";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  pin: z.string().min(4).max(8).optional(),
  timezone: z.string().min(1),
  eveningStartTime: z.string().regex(/^\d{1,2}:\d{2}$/),
  morningStartTime: z.string().regex(/^\d{1,2}:\d{2}$/),
  minutesPerTurn: z.number().int().min(5).max(60).optional(),
  schoolDaysOnly: z.boolean().optional(),
  kids: z
    .array(
      z.object({
        name: z.string().min(1).max(40),
        color: z.string().optional(),
      }),
    )
    .min(1)
    .max(8),
});

export async function POST(request: Request) {
  try {
    const body = createSchema.parse(await request.json());
    const db = getDb();
    const id = generateHouseholdId();
    const adminPinHash = body.pin ? await hashPin(body.pin) : null;

    await db.insert(schema.households).values({
      id,
      name: body.name,
      adminPinHash,
      timezone: body.timezone,
      eveningStartTime: body.eveningStartTime,
      morningStartTime: body.morningStartTime,
      minutesPerTurn: body.minutesPerTurn ?? 15,
      schoolDaysOnly: body.schoolDaysOnly ?? true,
    });

    const kidRows = body.kids.map((k, i) => ({
      householdId: id,
      name: k.name,
      color: k.color ?? "#6366f1",
      shareToken: generateShareToken(),
      sortOrder: i,
    }));

    const insertedKids = await db
      .insert(schema.kids)
      .values(kidRows)
      .returning();

    await setAdminSession(id);

    return NextResponse.json({
      householdId: id,
      kids: insertedKids.map((k) => ({
        id: k.id,
        name: k.name,
        shareToken: k.shareToken,
        sharePath: `/k/${k.shareToken}`,
      })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
