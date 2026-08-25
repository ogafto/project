import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  return handleAdminSetup({
    email: "projekt@iskral.pl",
    password: "AdminPassword2026!",
    name: "Właściciel / Admin",
    role: "superadmin",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || "projekt@iskral.pl";
    const password = body.password || "AdminPassword2026!";
    const name = body.name || "Administrator";
    const role = body.role || "superadmin";

    return handleAdminSetup({ email, password, name, role });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}

async function handleAdminSetup({
  email,
  password,
  name,
  role,
}: {
  email: string;
  password: string;
  name: string;
  role: string;
}) {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (!cleanEmail || !password) {
    return NextResponse.json(
      { success: false, error: "Brak adresu e-mail lub hasła." },
      { status: 400 }
    );
  }

  let authUserId: string | null = null;
  let authError: string | null = null;

  // 1. Twarda rejestracja / aktualizacja konta w Supabase Auth
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: name || "Admin",
            role: role || "superadmin",
          },
        },
      });

      if (error) {
        authError = error.message;
        console.warn(`[Setup Admin] Supabase signUp note for ${cleanEmail}: ${error.message}`);
      } else if (data?.user?.id) {
        authUserId = data.user.id;
        console.log(`[Setup Admin] Supabase user created/found id=${authUserId}`);
      }
    } catch (e: any) {
      authError = e.message;
      console.warn("[Setup Admin] Supabase signUp exception:", e);
    }
  }

  // 2. Synchronizacja profilu w tabeli profiles
  const dbClient: any = supabaseAdmin || supabase;
  if (dbClient) {
    try {
      const profileData: any = {
        email: cleanEmail,
        name: name,
        role: role || "superadmin",
        plan: "Brand",
        is_email_verified: true,
        account_status: "Active",
        updated_at: new Date().toISOString(),
      };

      if (authUserId) {
        profileData.id = authUserId;
      }

      await dbClient.from("profiles").upsert(profileData, { onConflict: "email" });
      console.log(`[Setup Admin] Upserted profile for ${cleanEmail}`);

      // 3. Upewnij się, że sklep admina istnieje
      const { data: existingStore } = await dbClient
        .from("stores")
        .select("id")
        .eq("subdomain", "iskral")
        .maybeSingle();

      if (!existingStore) {
        await dbClient.from("stores").insert({
          id: "store_admin_main",
          owner_id: authUserId || null,
          name: "IskraL Oficjalny Sklep",
          subdomain: "iskral",
          plan_type: "Brand",
          plan_status: "active",
          status: "active",
          is_active: true,
          template: "Dark Vibe",
          accent_color: "#D0FF00",
          theme_config: { ownerEmail: cleanEmail, template: "Dark Vibe", accentColor: "#D0FF00" },
          expires_at: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    } catch (dbErr: any) {
      console.warn("[Setup Admin] DB sync error:", dbErr.message);
    }
  }

  return NextResponse.json({
    success: true,
    message: `Konto ${cleanEmail} zostało pomyślnie utworzone / skonfigurowane w Supabase.`,
    email: cleanEmail,
    role: role || "superadmin",
    authNote: authError || "Autoryzacja Supabase Auth gotowa",
  });
}
