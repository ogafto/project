import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";

declare global {
  var _otpStore: Map<string, { code: string; expiresAt: number }> | undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Nieprawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: "Wprowadź 6-cyfrowy kod weryfikacyjny." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const nowMs = Date.now();

    let isValid = false;
    let reason = "Nieprawidłowy lub wygasły kod weryfikacyjny.";

    // 1. Check memory store
    const stored = global._otpStore?.get(cleanEmail);
    if (stored) {
      if (stored.expiresAt < nowMs) {
        reason = "Kod weryfikacyjny wygasł (ważny 10 minut). Poproś o nowy kod.";
      } else if (stored.code === cleanCode) {
        isValid = true;
      }
    }

    // 2. Check Supabase DB if not verified yet
    if (!isValid && isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          const { data: otpRow } = await dbClient
            .from("otp_codes")
            .select("*")
            .eq("email", cleanEmail)
            .eq("code", cleanCode)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (otpRow) {
            const expMs = new Date(otpRow.expires_at).getTime();
            if (expMs >= nowMs) {
              isValid = true;
            } else {
              reason = "Kod weryfikacyjny wygasł. Poproś o nowy kod.";
            }
          }
        } catch (dbErr) {
          console.warn("Supabase OTP verify check fallback:", dbErr);
        }
      }
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: reason }, { status: 400 });
    }

    // Mark code as used
    global._otpStore?.delete(cleanEmail);

    // Update is_email_verified in Supabase profiles if configured
    if (isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          await dbClient.from("profiles").update({ is_email_verified: true }).eq("email", cleanEmail);
        } catch (e) {}
      }
    }

    return NextResponse.json({
      success: true,
      message: "Kod weryfikacyjny pomyślnie potwierdzony. Sesja użytkownika została zautoryzowana.",
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { success: false, error: "Błąd podczas weryfikacji kodu OTP." },
      { status: 500 }
    );
  }
}
