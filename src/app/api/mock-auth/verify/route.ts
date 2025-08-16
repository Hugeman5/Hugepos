import { NextResponse } from "next/server";
import { verifyUserByIdentifierAndPin } from "@/lib/usersRepo";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = String(body?.identifier ?? "").trim();
    const pin = String(body?.pin ?? "");

    if (!identifier || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "Identifier and 4-digit pin are required." }, { status: 400 });
    }

    const user = await verifyUserByIdentifierAndPin(identifier, pin);
    if (!user) {
       return NextResponse.json({ error: "Invalid PIN or user." }, { status: 401 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (e) {
    console.error("[mock-auth/verify] failed:", e);
    return NextResponse.json({ error: "Verification failed due to a server error." }, { status: 500 });
  }
}
