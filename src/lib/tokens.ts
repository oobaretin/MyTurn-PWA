import { randomBytes } from "crypto";

export function generateShareToken(): string {
  return randomBytes(24).toString("base64url");
}

export function generateHouseholdId(): string {
  return randomBytes(12).toString("base64url");
}
