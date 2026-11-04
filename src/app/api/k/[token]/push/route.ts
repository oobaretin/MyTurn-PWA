import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, schema } from "@/db";

const subSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  try {
    const body = subSchema.parse(await request.json());
    const db = getDb();
    const [kid] = await db
      .select()
      .from(schema.kids)
      .where(eq(schema.kids.shareToken, token))
      .limit(1);
    if (!kid) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .insert(schema.pushSubscriptions)
      .values({
        kidId: kid.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
      })
      .onConflictDoUpdate({
        target: schema.pushSubscriptions.endpoint,
        set: {
          kidId: kid.id,
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
      });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid subscription";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
