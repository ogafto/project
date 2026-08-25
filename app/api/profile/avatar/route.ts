import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, userId, avatarUrl, imageBase64 } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    if (!cleanEmail) {
      return NextResponse.json({ success: false, error: "Brak adresu email użytkownika." }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: false, error: "Brak połączenia z bazą danych." }, { status: 500 });
    }

    let finalAvatarUrl = avatarUrl || imageBase64 || "";

    // Jeśli przekazano base64, spróbuj zapisać w Supabase Storage bucket 'avatars'
    if (imageBase64 && imageBase64.startsWith("data:image/")) {
      try {
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const ext = contentType.split("/")[1] || "png";
          const fileName = `avatar_${cleanEmail.replace(/[^a-z0-9]/g, "_")}_${Date.now()}.${ext}`;

          const { data: uploadData, error: uploadError } = await dbClient.storage
            .from("avatars")
            .upload(fileName, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = dbClient.storage
              .from("avatars")
              .getPublicUrl(fileName);
            if (publicUrlData?.publicUrl) {
              finalAvatarUrl = publicUrlData.publicUrl;
            }
          } else {
            console.warn("[Avatar Upload] Storage bucket upload fallback to Data URL:", uploadError?.message);
          }
        }
      } catch (storageErr) {
        console.warn("[Avatar Upload] Storage error, using data URL fallback:", storageErr);
      }
    }

    // Zapisz URL w tabeli 'profiles'
    const profilePayload: any = {
      email: cleanEmail,
      avatar_url: finalAvatarUrl,
      updated_at: new Date().toISOString(),
    };

    if (userId && typeof userId === "string" && userId.length > 20 && userId.includes("-")) {
      profilePayload.id = userId;
    }

    const { error: updateErr } = await dbClient
      .from("profiles")
      .upsert(profilePayload, { onConflict: "email" });

    if (updateErr) {
      console.warn("[Avatar Upload] Supabase profiles update warning:", updateErr.message);
    }

    return NextResponse.json({
      success: true,
      avatarUrl: finalAvatarUrl,
      avatar_url: finalAvatarUrl,
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

    const dbClient: any = supabaseAdmin || supabase;
    if (dbClient) {
      await dbClient
        .from("profiles")
        .update({ avatar_url: null })
        .eq("email", cleanEmail);
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
