import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "myturn_admin_";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(
  pin: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash) return true;
  if (!pin) return false;
  return bcrypt.compare(pin, hash);
}

export async function setAdminSession(householdId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_PREFIX + householdId, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function hasAdminSession(householdId: string): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_PREFIX + householdId)?.value === "1";
}
