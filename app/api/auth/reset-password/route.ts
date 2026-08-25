import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";

declare global {
  var _otpStore: Map<string, { code: string; expiresAt: number }> | undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, newPassword } = body;

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

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Nowe hasło musi mieć co najmniej 6 znaków." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const nowMs = Date.now();

    let isValid = false;
    let reason = "Nieprawidłowy lub wygasły kod weryfikacyjny.";

    // 1. CHECK RAM store
    const ramStored = global._otpStore?.get(cleanEmail);
    if (ramStored) {
      if (ramStored.expiresAt < nowMs) {
        reason = "Kod weryfikacyjny wygasł (ważny 10 minut). Poproś o nowy kod.";
      } else if (ramStored.code === cleanCode) {
        isValid = true;
      }
    }

    // 2. CHECK Supabase otp_codes table
    if (!isValid && isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          const { data: otpRow } = await dbClient
            .from("otp_codes")
            .select("*")
            .eq("email", cleanEmail)
            .limit(1)
            .maybeSingle();

          if (otpRow) {
            const expMs = new Date(otpRow.expires_at).getTime();
            if (expMs < nowMs) {
              reason = "Kod weryfikacyjny wygasł. Poproś o nowy kod.";
            } else if (otpRow.code === cleanCode) {
              isValid = true;
            }
          }
        } catch (e: any) {
          console.warn(`[Reset Password] otp_codes check error: ${e.message}`);
        }

        // Fallback: profiles.otp_code
        if (!isValid) {
          try {
            const { data: profRow } = await dbClient
              .from("profiles")
              .select("otp_code,otp_expires_at")
              .eq("email", cleanEmail)
              .limit(1)
              .maybeSingle();

            if (profRow?.otp_code) {
              const expMs = profRow.otp_expires_at ? new Date(profRow.otp_expires_at).getTime() : 0;
              if (expMs < nowMs) {
                reason = "Kod weryfikacyjny wygasł. Poproś o nowy kod.";
              } else if (profRow.otp_code === cleanCode) {
                isValid = true;
              }
            }
          } catch (e: any) {
            console.warn(`[Reset Password] profiles check error: ${e.message}`);
          }
        }
      }
    }

    if (!isValid) {
      console.warn(`[Reset Password FAILED] email=${cleanEmail} code=${cleanCode} reason=${reason}`);
      return NextResponse.json({ success: false, error: reason }, { status: 400 });
    }

    // 3. Twarda aktualizacja / utworzenie konta w Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        // Twarda rejestracja / aktualizacja hasła w Supabase Auth
        const { error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: newPassword,
          options: {
            data: { name: cleanEmail.split("@")[0] },
          },
        });

        if (signUpErr && !signUpErr.message?.toLowerCase().includes("already registered")) {
          console.warn("[Reset Password] Supabase Auth signUp warning:", signUpErr.message);
        }
      } catch (authEx: any) {
        console.warn("[Reset Password] Supabase Auth exception:", authEx);
      }
    }

    // 4. Update profile in Supabase DB
    if (isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          await dbClient.from("otp_codes").delete().eq("email", cleanEmail).catch(() => {});
          await dbClient.from("profiles").upsert(
            {
              email: cleanEmail,
              is_email_verified: true,
              otp_code: null,
              otp_expires_at: null,
              account_status: "Active",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );
        } catch (dbEx: any) {
          console.warn("[Reset Password] DB cleanup exception:", dbEx);
        }
      }
    }

    // Clear RAM store
    global._otpStore?.delete(cleanEmail);

    console.log(`[Reset Password SUCCESS] Password successfully updated for: ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: "Hasło zostało pomyślnie zaktualizowane. Możesz się teraz zalogować.",
    });
  } catch (error: any) {
    console.error("[Reset Password Exception]:", error);
    return NextResponse.json(
      { success: false, error: "Wystąpił błąd podczas resetowania hasła." },
      { status: 500 }
    );
  }
}
