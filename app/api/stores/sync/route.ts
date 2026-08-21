import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subdomain = searchParams.get("subdomain")?.toLowerCase().trim();

    if (!subdomain) {
      return NextResponse.json({ success: false, error: "Brak parametru subdomeny." }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: false, error: "Brak klienta Supabase." }, { status: 500 });
    }

    // 1. Znajdź sklep po subdomenie, domenie własnej lub ID
    const { data: stores, error: storeErr } = await dbClient
      .from("stores")
      .select("*")
      .or(`subdomain.eq.${subdomain},custom_domain.eq.${subdomain},id.eq.${subdomain}`)
      .limit(1);

    if (storeErr || !stores || stores.length === 0) {
      return NextResponse.json({ success: false, store: null, products: [] }, { status: 404 });
    }

    const store = stores[0];

    // 2. Pobierz produkty dla tego sklepu
    const { data: products, error: prodErr } = await dbClient
      .from("products")
      .select("*")
      .eq("store_id", store.id);

    return NextResponse.json({
      success: true,
      store,
      products: products || [],
    });
  } catch (err: any) {
    console.error("[API /api/stores/sync GET Exception]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}

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

    const storeId = store.id || `store_${cleanSubdomain}`;

    const dbPayload = {
      id: storeId,
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

    console.log(`[API /api/stores/sync] Synchronizowanie sklepu '${cleanSubdomain}' (id: ${storeId})...`);
    const { data: storeSaved, error: storeErr } = await dbClient.from("stores").upsert(dbPayload, { onConflict: "subdomain" });

    if (storeErr) {
      console.error(`[API /api/stores/sync Error] Błąd zapisu '${cleanSubdomain}':`, storeErr.message);
      return NextResponse.json({ success: false, error: storeErr.message }, { status: 500 });
    }

    // 2. Synchronizacja produktów do tabeli products w Supabase
    const incomingProducts = Array.isArray(store.products) ? store.products : [];

    if (incomingProducts.length > 0) {
      for (const p of incomingProducts) {
        if (!p || !p.name) continue;
        const cleanPrice = String(p.price || "").replace(",", ".").replace(/[^0-9.]/g, "");
        const priceNum = parseFloat(cleanPrice) || 149;
        const priceCents = p.priceCents || Math.round(priceNum * 100);

        const prodId = p.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const imgUrl = p.image || p.imageUrl || (p.images && p.images[0]) || (p.type === "Cyfrowy"
          ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80");

        const prodPayload = {
          id: prodId,
          store_id: storeId,
          name: p.name,
          description: p.description || "Oficjalny produkt gotowy w sklepie.",
          price: p.price || `${priceNum.toFixed(2)} PLN`,
          price_cents: priceCents,
          compare_price: p.comparePrice || null,
          compare_price_cents: p.comparePriceCents || null,
          type: p.type || "Fizyczny",
          status: p.status || "Aktywny",
          is_active: p.status !== "Nieaktywny",
          stock: p.stock !== undefined ? parseInt(String(p.stock)) : 50,
          image_url: imgUrl,
          images: p.images && p.images.length > 0 ? p.images : [imgUrl].filter(Boolean),
          is_digital: p.isDigital || p.type === "Cyfrowy",
          digital_file_name: p.digitalFileName || null,
          digital_file_size: p.digitalFileSize || null,
          digital_file_url: p.digitalFileUrl || null,
        };

        const { error: prodErr } = await dbClient.from("products").upsert(prodPayload, { onConflict: "id" });
        if (prodErr) {
          console.warn(`[API /api/stores/sync] Warning saving product '${p.name}':`, prodErr.message);
        }
      }
    } else {
      // Sprawdź czy sklep ma już jakiekolwiek produkty
      const { data: existingProds } = await dbClient.from("products").select("id").eq("store_id", storeId).limit(1);
      if (!existingProds || existingProds.length === 0) {
        // Wstaw domyślny produkt startowy dla nowego sklepu
        const defaultProd = {
          id: `prod_start_${storeId}`,
          store_id: storeId,
          name: `Kolekcja Limitowana 2026 - ${store.name || "Iskral"}`,
          description: "Wysokiej jakości produkt gotowy do natychmiastowego zakupu.",
          price: "149.00 PLN",
          price_cents: 14900,
          type: "Fizyczny",
          status: "Aktywny",
          is_active: true,
          stock: 50,
          image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
          images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"],
          is_digital: false,
        };
        await dbClient.from("products").upsert(defaultProd, { onConflict: "id" });
      }
    }

    console.log(`[API /api/stores/sync Success] Sklep '${cleanSubdomain}' i produkty zapisane w Supabase.`);
    return NextResponse.json({ success: true, store: dbPayload });
  } catch (err: any) {
    console.error("[API /api/stores/sync Exception]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
