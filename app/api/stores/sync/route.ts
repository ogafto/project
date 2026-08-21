import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { store } = body;

    if (!store || !store.subdomain) {
      return NextResponse.json({ success: false, error: "Brak danych sklepu lub subdomeny." }, { status: 400 });
    }

    const cleanSubdomain = (store.subdomain || "").trim().toLowerCase();
    const dbClient: any = supabaseAdmin || supabase;

    if (!dbClient) {
      return NextResponse.json({ success: false, error: "Brak klienta Supabase." }, { status: 500 });
    }

    const dbPayload = {
      id: store.id || `t_${Date.now()}`,
      name: store.name || "Mój Sklep",
      subdomain: cleanSubdomain,
      custom_domain: store.customDomain || null,
      logo_url: store.logoUrl || null,
      description: store.description || null,
      announcement: store.announcement || null,
      niche: store.niche || null,
      template: store.template || "Dark Vibe",
      accent_color: store.accentColor || "#FF5B28",
      stripe_status: store.stripeStatus || "disconnected",
      balance_cents: store.balanceCents || 0,
      plan_type: store.planType || "Start",
      plan_status: store.planStatus || "active",
      status: store.status || "active",
      is_active: store.is_active !== false,
      social_links: store.socials || {},
      theme_config: { template: store.template || "Dark Vibe", accentColor: store.accentColor || "#FF5B28" },
      drop_config: store.dropConfig || { enabled: false },
    };

    console.log(`[API /api/stores/sync] Synchronizowanie sklepu '${cleanSubdomain}'...`);
    const { data, error } = await dbClient.from("stores").upsert(dbPayload, { onConflict: "subdomain" });

    if (error) {
      console.error(`[API /api/stores/sync Error] Błąd zapisu '${cleanSubdomain}':`, error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`[API /api/stores/sync Success] Sklep '${cleanSubdomain}' zapisany w Supabase.`);
    return NextResponse.json({ success: true, store: dbPayload });
  } catch (err: any) {
    console.error("[API /api/stores/sync Exception]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
