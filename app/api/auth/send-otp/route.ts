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

    // Zapis w pamięci serwera (gwarantowane działanie)
    global._otpStore?.set(cleanEmail, { code: generatedCode, expiresAt: expiresAtMs });

    // Zapis w bazie danych Supabase
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
            await dbClient.from("profiles").update({
              otp_code: generatedCode,
              otp_expires_at: expiresAtIso,
            }).eq("email", cleanEmail);
          }
        } catch (dbErr) {
          console.warn("[Supabase OTP DB Warning] Fallback do pamięci RAM:", dbErr);
        }
      }
    }

    // Wysyłanie e-maila z kodem OTP przez Resend API
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      code: generatedCode,
    });

    if (!emailResult.success) {
      console.error(`[API /send-otp Resend Notice] Nie udało się doręczyć maila do ${cleanEmail} via Resend: ${emailResult.error}`);
      
      // Kod został poprawnie zapisany w DB / RAM, ale email nie dotarł.
      // Zwracamy success=true z informacją ostrzegawczą (nigdy nie ujawniamy kodu w odpowiedzi!).
      return NextResponse.json({
        success: true,
        isEmailSent: false,
        warning: `Resend API Notice: ${emailResult.error}`,
        message: `Wysłanie e-mail zablokowane przez Resend: ${emailResult.error}`,
        expiresAt: expiresAtIso,
      });
    }

    console.log(`[API /send-otp Success] Kod OTP wygenerowany i pomyślnie wysłany e-mailem do: ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      isEmailSent: true,
      message: `Kod weryfikacyjny został pomyślnie wysłany na adres: ${cleanEmail}`,
      expiresAt: expiresAtIso,
    });
  } catch (error: any) {
    console.error("[API /send-otp Exception]:", error);
    return NextResponse.json(
      { success: false, error: `Wyjątek podczas generowania kodu OTP: ${error.message || error}` },
      { status: 500 }
    );
  }
}
