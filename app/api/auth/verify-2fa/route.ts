import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { verifyTOTP } from "@/lib/totp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, secret } = body;

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: "Wprowadź poprawny 6-cyfrowy kod weryfikacyjny 2FA." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();
    let userSecret = secret || "";

    // Jeśli nie podano secret w requeście, pobierz z profilu użytkownika w bazie Supabase
    if (!userSecret && email) {
      const cleanEmail = email.trim().toLowerCase();
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          const { data, error } = await dbClient
            .from("profiles")
            .select("two_factor_secret, is_2fa_enabled")
            .eq("email", cleanEmail)
            .maybeSingle();

          if (!error && data?.two_factor_secret) {
            userSecret = data.two_factor_secret;
          }
        } catch (e) {
          console.warn("[2FA Verify] Database query warning:", e);
        }
      }
    }

    // Jeśli nadal brak secretu (np. domyślny klucz dla konta bez skonfigurowanego unikalnego klucza)
    if (!userSecret) {
      userSecret = "ISKRA74829374029";
    }

    const isValid = verifyTOTP(cleanCode, userSecret, 1, 30);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Nieprawidłowy kod 2FA. Kod wygasł lub jest błędny." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kod 2FA pomyślnie zweryfikowany.",
    });
  } catch (error: any) {
    console.error("[2FA Verify API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Błąd serwera podczas weryfikacji 2FA." },
      { status: 500 }
    );
  }
}
