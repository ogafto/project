import { NextRequest, NextResponse } from "next/server";
import { verifyUserCredentials } from "@/lib/credentialsStore";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail || !password) {
      return NextResponse.json({ success: false, valid: false }, { status: 400 });
    }

    const isValid = verifyUserCredentials(cleanEmail, password);
    return NextResponse.json({ success: true, valid: isValid });
  } catch (err: any) {
    return NextResponse.json({ success: false, valid: false, error: err.message }, { status: 500 });
  }
}
