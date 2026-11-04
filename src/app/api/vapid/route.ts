import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push";

export async function GET() {
  const key = getVapidPublicKey();
  if (!key) {
    return NextResponse.json({ publicKey: null });
  }
  return NextResponse.json({ publicKey: key });
}
