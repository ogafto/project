import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendOtpEmail } from "@/lib/email";

// Fallback in-memory store (works only in same serverless instance)
// Primary storage is Supabase otp_codes table
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

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Nieprawidłowy adres e-mail." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generate 6-digit OTP valid for 10 minutes
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtMs = Date.now() + 10 * 60 * 1000;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    console.log(`[OTP] Generated code for ${cleanEmail}: ${generatedCode} (expires: ${expiresAtIso})`);

    // PRIMARY: Save to RAM (always works, same process)
    global._otpStore?.set(cleanEmail, { code: generatedCode, expiresAt: expiresAtMs });

    // SECONDARY: Save to Supabase (works across serverless instances)
    if (isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        // Try otp_codes table first
        const { error: otpErr } = await dbClient.from("otp_codes").upsert(
          {
            email: cleanEmail,
            code: generatedCode,
            expires_at: expiresAtIso,
            created_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

        if (otpErr) {
          console.warn(`[OTP Supabase] otp_codes upsert failed (table may not exist): ${otpErr.message}`);
          // Fallback: try saving to profiles table
          const { error: profErr } = await dbClient
            .from("profiles")
            .update({ otp_code: generatedCode, otp_expires_at: expiresAtIso })
            .eq("email", cleanEmail);
          
          if (profErr) {
            console.warn(`[OTP Supabase] profiles update also failed: ${profErr.message}`);
            // Insert profile if doesn't exist
            await dbClient.from("profiles").upsert(
              { email: cleanEmail, otp_code: generatedCode, otp_expires_at: expiresAtIso },
              { onConflict: "email" }
            );
          } else {
            console.log(`[OTP Supabase] Saved to profiles.otp_code for ${cleanEmail}`);
          }
        } else {
          console.log(`[OTP Supabase] Saved to otp_codes for ${cleanEmail}`);
        }
      }
    }

    // Send email with OTP code via Resend
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      code: generatedCode,
    });

    if (!emailResult.success) {
      console.error(`[OTP Email FAILED] Could not deliver to ${cleanEmail}: ${emailResult.error}`);
      // Code is saved in RAM/DB - return success so user can try verifying
      // But warn that email may not have arrived
      return NextResponse.json({
        success: true,
        isEmailSent: false,
        warning: emailResult.error,
        message: `Nie udało się wysłać e-maila na ${cleanEmail}. Błąd Resend: ${emailResult.error}`,
        expiresAt: expiresAtIso,
      });
    }

    console.log(`[OTP Email SUCCESS] Sent to: ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      isEmailSent: true,
      message: `Kod weryfikacyjny wysłany na ${cleanEmail}. Sprawdź skrzynkę i folder SPAM.`,
      expiresAt: expiresAtIso,
    });
  } catch (error: any) {
    console.error("[OTP Route Exception]:", error);
    return NextResponse.json(
      { success: false, error: `Błąd podczas generowania kodu OTP: ${error.message || error}` },
      { status: 500 }
    );
  }
}
