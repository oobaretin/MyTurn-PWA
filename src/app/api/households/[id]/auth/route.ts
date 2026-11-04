import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { setAdminSession, verifyPin } from "@/lib/auth";

const schemaBody = z.object({
  pin: z.string().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const body = schemaBody.parse(await request.json());
    const db = getDb();
    const [household] = await db
      .select()
      .from(schema.households)
      .where(eq(schema.households.id, id))
      .limit(1);
    if (!household) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ok = await verifyPin(body.pin ?? "", household.adminPinHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    await setAdminSession(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
