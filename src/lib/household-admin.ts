import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Household } from "@/db/schema";
import { hasAdminSession, verifyPin } from "@/lib/auth";

export async function loadHousehold(
  id: string,
): Promise<Household | null> {
  const db = getDb();
  const [household] = await db
    .select()
    .from(schema.households)
    .where(eq(schema.households.id, id))
    .limit(1);
  return household ?? null;
}

export async function authorizeHouseholdAdmin(
  household: Household,
  pin?: string,
): Promise<boolean> {
  if (await hasAdminSession(household.id)) return true;
  return verifyPin(pin ?? "", household.adminPinHash);
}
