import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";

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

    // 1. Generate random 6-digit code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    // 2. Save in memory store
    global._otpStore?.set(cleanEmail, { code: generatedCode, expiresAt: expiresAtMs });

    // Save in Supabase if configured
    if (isSupabaseConfigured) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          const { error: insertErr } = await dbClient.from("otp_codes").insert({
            email: cleanEmail,
            code: generatedCode,
            expires_at: expiresAtIso,
            created_at: new Date().toISOString(),
          });

          if (insertErr) {
            await dbClient.from("profiles").update({
              otp_code: generatedCode,
              otp_expires_at: expiresAtIso,
            }).eq("email", cleanEmail);
          }
        } catch (dbErr) {
          console.warn("Supabase OTP save fallback:", dbErr);
        }
      }
    }

    // 3. Send email via Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.error("[Resend API Error]: RESEND_API_KEY is not defined in environment variables!");
      return NextResponse.json(
        { success: false, error: "Brak skonfigurowanego klucza RESEND_API_KEY w pliku .env.local." },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const senderEmail = process.env.RESEND_FROM_EMAIL || "Iskral Auth <onboarding@resend.dev>";
    const emailSubject = `Twój kod weryfikacyjny: ${generatedCode}`;

    const darkHtmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailSubject}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #090A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #090A0C; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="480" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #111216; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
                  <!-- Logo / Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <div style="display: inline-block; padding: 6px 14px; background-color: rgba(255, 91, 40, 0.15); border: 1px solid rgba(255, 91, 40, 0.3); border-radius: 999px; color: #FF5B28; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;">
                        Iskral Auth OTP
                      </div>
                    </td>
                  </tr>

                  <!-- Title -->
                  <tr>
                    <td align="center" style="padding-bottom: 12px;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                        Kod Weryfikacyjny
                      </h1>
                    </td>
                  </tr>

                  <!-- Description -->
                  <tr>
                    <td align="center" style="padding-bottom: 28px; font-size: 14px; line-height: 1.6; color: #A1A1AA;">
                      Kod został wygenerowany dla konta <strong style="color: #FFFFFF;">${cleanEmail}</strong>.<br>
                      Użyj go, aby dokończyć logowanie i zautoryzować sesję.
                    </td>
                  </tr>

                  <!-- OTP Code Box -->
                  <tr>
                    <td align="center" style="padding-bottom: 28px;">
                      <div style="background-color: #090A0C; border: 1px solid rgba(255, 91, 40, 0.4); border-radius: 16px; padding: 20px 30px; display: inline-block;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #FF5B28; display: block;">
                          ${generatedCode}
                        </span>
                      </div>
                    </td>
                  </tr>

                  <!-- Expiration Notice -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 12px 16px; font-size: 12px; color: #707070;">
                        ⏱️ Ten kod jest ważny przez <strong style="color: #FFFFFF;">10 minut</strong>. Nie udostępniaj go nikomu.
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="border-top: 1px solid rgba(255, 255, 255, 0.06); font-size: 11px; color: #505055; padding-top: 20px;">
                      © 2026 Platforma Iskral SaaS (iskral.pl). Wszelkie prawa zastrzeżone.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const resResult = await resend.emails.send({
      from: senderEmail,
      to: [cleanEmail],
      subject: emailSubject,
      html: darkHtmlContent,
    });

    if (resResult.error) {
      console.error("[Resend API Error Response]:", resResult.error);
      const isSandboxRestriction = resResult.error.message?.includes("You can only send testing emails to your own email address");

      if (isSandboxRestriction) {
        return NextResponse.json(
          {
            success: false,
            isSandboxRestriction: true,
            error: "Tryb darmowy Resend (onboarding@resend.dev): Maile testowe mogą być obecnie wysyłane wyłącznie na adres konta Resend: 16tobiasz16@gmail.com. Aby wysyłać na ten adres, podepnij domenę w panelu resend.com/domains.",
            debugCode: generatedCode,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Błąd wysyłania e-mail przez Resend: ${resResult.error.message}`,
          details: resResult.error,
        },
        { status: 400 }
      );
    }

    console.log(`[Resend SDK Sent Success] Email: ${cleanEmail}, Code: ${generatedCode}, Resend Data:`, resResult.data);

    return NextResponse.json({
      success: true,
      message: "Kod weryfikacyjny został wysłany na Twój adres e-mail. Wprowadź go poniżej, aby potwierdzić konto i przejść do panelu.",
      expiresAt: expiresAtIso,
    });
  } catch (error: any) {
    console.error("Send OTP Exception Error:", error);
    return NextResponse.json(
      { success: false, error: `Błąd podczas wysyłania kodu OTP: ${error.message || error}` },
      { status: 500 }
    );
  }
}
