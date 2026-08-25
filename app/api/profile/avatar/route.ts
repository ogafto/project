import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { saveUserAvatar, getUserAvatar, deleteUserAvatar } from "@/lib/avatars";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: "Brak adresu email." }, { status: 400 });
    }

    // 1. Sprawdź lokalny trwały magazyn
    let avatarUrl = getUserAvatar(cleanEmail);

    // 2. Jeśli brak, sprawdź bazę Supabase profiles (jeśli kolumna istnieje)
    if (!avatarUrl) {
      const dbClient: any = supabaseAdmin || supabase;
      if (dbClient) {
        try {
          const { data } = await dbClient
            .from("profiles")
            .select("avatar_url")
            .eq("email", cleanEmail)
            .maybeSingle();
          if (data?.avatar_url && typeof data.avatar_url === "string") {
            avatarUrl = data.avatar_url;
            await saveUserAvatar(cleanEmail, data.avatar_url);
          }
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl: avatarUrl || "",
      avatar_url: avatarUrl || "",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, userId, avatarUrl, imageBase64 } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: "Brak adresu email użytkownika." }, { status: 400 });
    }

    const rawData = avatarUrl || imageBase64 || "";
    if (!rawData) {
      return NextResponse.json({ success: false, error: "Brak danych zdjęcia." }, { status: 400 });
    }

    // 1. Zapisz trwale na serwerze (/public/avatars/ i data/avatars.json)
    const savedAvatarUrl = await saveUserAvatar(cleanEmail, rawData);

    // 2. Zapisz w Supabase profiles (z bezpiecznym fallbackiem)
    const dbClient: any = supabaseAdmin || supabase;
    if (dbClient) {
      try {
        await dbClient
          .from("profiles")
          .update({ avatar_url: savedAvatarUrl })
          .eq("email", cleanEmail);
      } catch (dbErr) {
        console.warn("[Avatar Upload] Supabase profiles update notice:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      avatarUrl: savedAvatarUrl,
      avatar_url: savedAvatarUrl,
    });
  } catch (err: any) {
    console.error("[Avatar Upload API Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: "Brak adresu email." }, { status: 400 });
    }

    // 1. Usuń z lokalnego magazynu serwera
    deleteUserAvatar(cleanEmail);

    // 2. Zaktualizuj bazę Supabase jeśli możliwe
    const dbClient: any = supabaseAdmin || supabase;
    if (dbClient) {
      try {
        await dbClient
          .from("profiles")
          .update({ avatar_url: null })
          .eq("email", cleanEmail);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      avatarUrl: null,
      avatar_url: null,
    });
  } catch (err: any) {
    console.error("[Avatar Delete API Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
