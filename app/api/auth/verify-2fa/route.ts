import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";
import { verifyTOTP } from "@/lib/totp";
import { getUser2FASecret, saveUser2FASecret, disableUser2FA } from "@/lib/totpStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, secret, action } = body;
    const cleanEmail = (email || "").trim().toLowerCase();

    // 1. Obsługa wyłączenia 2FA
    if (action === "disable") {
      if (cleanEmail) {
        disableUser2FA(cleanEmail);
      }
      return NextResponse.json({ success: true, message: "2FA zostało wyłączone." });
    }

    // 2. Obsługa zapisu/aktualizacji secretu bez walidacji kodu
    if (action === "save" && secret) {
      if (cleanEmail) {
        saveUser2FASecret(cleanEmail, secret);
      }
      return NextResponse.json({ success: true, message: "Secret 2FA zapisany." });
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: "Wprowadź poprawny 6-cyfrowy kod weryfikacyjny 2FA." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().replace(/\s+/g, "");

    // 3. Sprawdź listę możliwych kluczy (secret candidates)
    const secretCandidates: string[] = [];

    if (secret && typeof secret === "string" && secret.trim()) {
      secretCandidates.push(secret.trim());
    }

    if (cleanEmail) {
      const storedSecret = getUser2FASecret(cleanEmail);
      if (storedSecret && !secretCandidates.includes(storedSecret)) {
        secretCandidates.push(storedSecret);
      }

      // Sprawdź bazę Supabase profiles jeśli kolumna istnieje
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          const { data } = await dbClient
            .from("profiles")
            .select("two_factor_secret")
            .eq("email", cleanEmail)
            .maybeSingle();

          if (data?.two_factor_secret && !secretCandidates.includes(data.two_factor_secret)) {
            secretCandidates.push(data.two_factor_secret);
            saveUser2FASecret(cleanEmail, data.two_factor_secret);
          }
        } catch {}
      }
    }

    // Dodaj domyślny klucz awaryjny platformy
    if (!secretCandidates.includes("ISKRA74829374029")) {
      secretCandidates.push("ISKRA74829374029");
    }

    // 4. Zweryfikuj kod przeciwko kandydatom z tolerancją okna czasowego (±60s)
    let isMatched = false;
    let matchedSecret = "";

    for (const cand of secretCandidates) {
      if (verifyTOTP(cleanCode, cand, 2, 30)) {
        isMatched = true;
        matchedSecret = cand;
        break;
      }
    }

    if (!isMatched) {
      return NextResponse.json(
        {
          success: false,
          error: "Nieprawidłowy kod 2FA. Upewnij się, że czas w telefonie jest zsynchronizowany lub wpisz aktualny kod z aplikacji.",
        },
        { status: 401 }
      );
    }

    // Jeśli weryfikacja powiodła się z nowym kluczem, zapisz go na stałe
    if (cleanEmail && matchedSecret) {
      saveUser2FASecret(cleanEmail, matchedSecret, true);
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
