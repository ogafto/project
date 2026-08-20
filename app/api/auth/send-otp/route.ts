import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendOtpEmail } from "@/lib/email";

declare global {
  var _otpStore: Map<string, { code: string; expiresAt: number }> | undefined;
}

if (!global._otpStore) {
  global._otpStore = new Map();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    // 1. SPRAWDZENIE ODBIORCY W API: pobranie dynamicznego adresu z formularza
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Nieprawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generowanie 6-cyfrowego kodu oraz terminu ważności (10 min)
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtMs = Date.now() + 10 * 60 * 1000;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    // Zapis w pamięci serwera
    global._otpStore?.set(cleanEmail, { code: generatedCode, expiresAt: expiresAtMs });

    // 3. SPRAWDZENIE BAZY DANYCH: Powiązanie kodu z konkretnym e-mailem w Supabase
    if (isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          const { error: insertErr } = await dbClient.from("otp_codes").upsert(
            {
              email: cleanEmail,
              code: generatedCode,
              expires_at: expiresAtIso,
              created_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );

          if (insertErr) {
            // Fallback: przypisanie kodu do profilu użytkownika w tabeli profiles
            await dbClient.from("profiles").update({
              otp_code: generatedCode,
              otp_expires_at: expiresAtIso,
            }).eq("email", cleanEmail);
          }
        } catch (dbErr) {
          console.warn("[Supabase OTP DB Warning] Fallback to memory store:", dbErr);
        }
      }
    }

    // Wysyłanie e-maila z kodem OTP przez Resend API
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      code: generatedCode,
    });

    if (!emailResult.success) {
      console.error(`[API /send-otp Error] Nie udało się wysłać kodu OTP do ${cleanEmail}: ${emailResult.error}`);
      return NextResponse.json(
        {
          success: false,
          error: `Resend Error: ${emailResult.error || "Błąd wysyłania e-maila"}`,
          details: emailResult.data,
        },
        { status: 400 }
      );
    }

    console.log(`[API /send-otp Success] Kod OTP został pomyślnie wysłany na adres: ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: `Kod weryfikacyjny został pomyślnie wysłany na adres: ${cleanEmail}`,
      expiresAt: expiresAtIso,
    });
  } catch (error: any) {
    console.error("[API /send-otp Exception]:", error);
    return NextResponse.json(
      { success: false, error: `Wyjątek podczas wysyłania kodu OTP: ${error.message || error}` },
      { status: 500 }
    );
  }
}
