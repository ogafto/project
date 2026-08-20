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

    // 1. CHECK RAM store (same serverless instance - works if send and verify hit same pod)
    const ramStored = global._otpStore?.get(cleanEmail);
    if (ramStored) {
      console.log(`[OTP Verify] Found in RAM for ${cleanEmail}: stored=${ramStored.code}, provided=${cleanCode}, expired=${ramStored.expiresAt < nowMs}`);
      if (ramStored.expiresAt < nowMs) {
        reason = "Kod weryfikacyjny wygasł (ważny 10 minut). Kliknij 'Wyślij nowy kod OTP'.";
      } else if (ramStored.code === cleanCode) {
        isValid = true;
        console.log(`[OTP Verify] RAM match SUCCESS for ${cleanEmail}`);
      } else {
        console.log(`[OTP Verify] RAM code mismatch for ${cleanEmail}`);
      }
    } else {
      console.log(`[OTP Verify] No RAM entry for ${cleanEmail} - checking Supabase...`);
    }

    // 2. CHECK Supabase otp_codes table (works across serverless instances)
    if (!isValid && isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        // Try otp_codes table
        try {
          const { data: otpRow, error: otpErr } = await dbClient
            .from("otp_codes")
            .select("*")
            .eq("email", cleanEmail)
            .limit(1)
            .maybeSingle();

          if (otpErr) {
            console.warn(`[OTP Verify] otp_codes query error: ${otpErr.message}`);
          } else if (otpRow) {
            console.log(`[OTP Verify] Found in otp_codes for ${cleanEmail}: stored=${otpRow.code}, provided=${cleanCode}`);
            const expMs = new Date(otpRow.expires_at).getTime();
            if (expMs < nowMs) {
              reason = "Kod weryfikacyjny wygasł. Kliknij 'Wyślij nowy kod OTP'.";
            } else if (otpRow.code === cleanCode) {
              isValid = true;
              console.log(`[OTP Verify] otp_codes match SUCCESS for ${cleanEmail}`);
            }
          } else {
            console.log(`[OTP Verify] No otp_codes entry for ${cleanEmail}`);
          }
        } catch (e: any) {
          console.warn(`[OTP Verify] otp_codes check exception: ${e.message}`);
        }

        // Fallback: try profiles.otp_code column
        if (!isValid) {
          try {
            const { data: profRow, error: profErr } = await dbClient
              .from("profiles")
              .select("otp_code,otp_expires_at")
              .eq("email", cleanEmail)
              .limit(1)
              .maybeSingle();

            if (!profErr && profRow?.otp_code) {
              console.log(`[OTP Verify] Found in profiles for ${cleanEmail}: stored=${profRow.otp_code}, provided=${cleanCode}`);
              const expMs = profRow.otp_expires_at ? new Date(profRow.otp_expires_at).getTime() : 0;
              if (expMs < nowMs) {
                reason = "Kod weryfikacyjny wygasł. Kliknij 'Wyślij nowy kod OTP'.";
              } else if (profRow.otp_code === cleanCode) {
                isValid = true;
                console.log(`[OTP Verify] profiles.otp_code match SUCCESS for ${cleanEmail}`);
              }
            }
          } catch (e: any) {
            console.warn(`[OTP Verify] profiles check exception: ${e.message}`);
          }
        }
      }
    }

    if (!isValid) {
      console.warn(`[OTP Verify FAILED] email=${cleanEmail} code=${cleanCode} reason=${reason}`);
      return NextResponse.json({ success: false, error: reason }, { status: 400 });
    }

    // Mark OTP as used
    global._otpStore?.delete(cleanEmail);

    // Update Supabase - mark email as verified and clear OTP
    if (isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          // Delete from otp_codes
          await dbClient.from("otp_codes").delete().eq("email", cleanEmail).catch(() => {});
          // Update profiles if it exists
          await dbClient.from("profiles")
            .update({ is_email_verified: true, otp_code: null, otp_expires_at: null })
            .eq("email", cleanEmail)
            .catch(() => {});
        } catch (e) {
          console.warn("[OTP Verify] Cleanup error (non-critical):", e);
        }
      }
    }

    console.log(`[OTP Verify SUCCESS] Email verified: ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: "Kod weryfikacyjny pomyślnie potwierdzony. Adres e-mail został zweryfikowany.",
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error("[OTP Verify Exception]:", error);
    return NextResponse.json(
      { success: false, error: "Błąd podczas weryfikacji kodu OTP." },
      { status: 500 }
    );
  }
}
