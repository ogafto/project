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

    // 1. Sprawdzenie pamięci serwera (Primary Cache)
    const stored = global._otpStore?.get(cleanEmail);
    if (stored) {
      if (stored.expiresAt < nowMs) {
        reason = "Kod weryfikacyjny wygasł (ważny 10 minut). Poproś o nowy kod.";
      } else if (stored.code === cleanCode) {
        isValid = true;
      }
    }

    // 2. Sprawdzenie w bazie danych Supabase (tabela otp_codes)
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
            .maybeSingle();

          if (otpRow) {
            const expMs = new Date(otpRow.expires_at).getTime();
            if (expMs >= nowMs) {
              isValid = true;
            } else {
              reason = "Kod weryfikacyjny wygasł. Poproś o nowy kod.";
            }
          }
        } catch (dbErr) {
          console.warn("[Supabase OTP verify check fallback]:", dbErr);
        }
      }
    }

    if (!isValid) {
      console.warn(`[API /verify-otp Failed] Nieudana próba weryfikacji dla: ${cleanEmail}`);
      return NextResponse.json({ success: false, error: reason }, { status: 400 });
    }

    // Oznaczenie kodu jako zużytego w pamięci
    global._otpStore?.delete(cleanEmail);

    // Oznaczenie is_email_verified = true w Supabase profiles
    if (isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          await dbClient.from("profiles").update({ is_email_verified: true }).eq("email", cleanEmail);
          await dbClient.from("otp_codes").delete().eq("email", cleanEmail);
        } catch (e) {
          console.warn("[Supabase verify-otp profiles update warning]:", e);
        }
      }
    }

    console.log(`[API /verify-otp Success] Pomyślnie zweryfikowano e-mail dla: ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: "Kod weryfikacyjny pomyślnie potwierdzony. Adres e-mail został zweryfikowany.",
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("[API /verify-otp Exception]:", error);
    return NextResponse.json(
      { success: false, error: "Błąd podczas weryfikacji kodu OTP." },
      { status: 500 }
    );
  }
}
