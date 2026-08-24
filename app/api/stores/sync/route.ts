import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subdomain = searchParams.get("subdomain")?.toLowerCase().trim();
    const ownerId = searchParams.get("owner_id")?.trim();
    const ownerEmail = searchParams.get("owner_email")?.toLowerCase().trim();

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: false, error: "Brak klienta Supabase." }, { status: 500 });
    }

    // 1. Jeśli zapytanie jest o sklepy danego użytkownika (po owner_id lub owner_email)
    if (ownerId || ownerEmail) {
      let resolvedOwnerId = ownerId;
      if (!resolvedOwnerId && ownerEmail) {
        const { data: prof } = await dbClient
          .from("profiles")
          .select("id")
          .eq("email", ownerEmail)
          .maybeSingle();
        if (prof?.id) resolvedOwnerId = prof.id;
      }

      let userStores: any[] = [];
      if (resolvedOwnerId) {
        const { data: storesById } = await dbClient
          .from("stores")
          .select("*")
          .eq("owner_id", resolvedOwnerId)
          .neq("status", "deleted");
        if (storesById && storesById.length > 0) userStores = storesById;
      }

      if (userStores.length === 0 && ownerEmail) {
        const { data: allStores } = await dbClient
          .from("stores")
          .select("*")
          .neq("status", "deleted");
        if (allStores && allStores.length > 0) {
          userStores = allStores.filter((s: any) => {
            const em = s.theme_config?.ownerEmail || s.owner_email;
            return em && em.toLowerCase() === ownerEmail;
          });
        }
      }

      // Dołącz produkty do każdego sklepu
      const enrichedStores = await Promise.all(
        userStores.map(async (st: any) => {
          const { data: prods } = await dbClient
            .from("products")
            .select("*")
            .eq("store_id", st.id);

          const mappedProducts = (prods || []).map((p: any) => {
            const rawImages = p.images || p.image_url;
            let safeImgs: string[] = [];
            if (Array.isArray(rawImages)) {
              safeImgs = rawImages.filter((img: any): img is string => typeof img === "string" && img.trim().length > 0);
            } else if (typeof rawImages === "string" && rawImages.trim().length > 0) {
              const trimmed = rawImages.trim();
              if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                try {
                  const parsed = JSON.parse(trimmed);
                  if (Array.isArray(parsed)) safeImgs = parsed;
                  else safeImgs = [trimmed];
                } catch {
                  safeImgs = [trimmed];
                }
              } else {
                safeImgs = [trimmed];
              }
            }
            if (safeImgs.length === 0 && p.image_url) {
              safeImgs = [p.image_url];
            }

            return {
              id: p.id,
              name: p.name,
              price: p.price || `${((p.price_cents || 0) / 100).toFixed(2)} zł`,
              priceCents: p.price_cents || 0,
              comparePrice: p.compare_price,
              comparePriceCents: p.compare_price_cents,
              type: p.type || "Fizyczny",
              status: p.status || "Aktywny",
              sales: p.sales || 0,
              stock: p.stock !== undefined ? p.stock : 50,
              description: p.description || "",
              image: safeImgs[0] || p.image_url || "",
              imageUrl: safeImgs[0] || p.image_url || "",
              images: safeImgs,
              isDigital: p.is_digital || p.type === "Cyfrowy",
              digitalFileName: p.digital_file_name,
              digitalFileSize: p.digital_file_size,
              digitalFileUrl: p.digital_file_url,
              isDropOnly: p.is_drop_only,
              dropTargetDate: p.drop_target_date,
            };
          });

          return {
            id: st.id,
            name: st.name,
            subdomain: st.subdomain,
            customDomain: st.custom_domain,
            domainVerified: st.domain_verified,
            logoUrl: st.logo_url || "",
            description: st.description || "",
            announcement: st.announcement || "",
            template: st.template || "Dark Vibe",
            accentColor: st.accent_color || "#D0FF00",
            planType: st.plan_type || "Start",
            planStatus: st.plan_status || "active",
            status: st.status || "active",
            isActive: st.is_active,
            socials: st.social_links || {},
            dropConfig: st.drop_config || { enabled: false },
            products: mappedProducts,
            orders: [],
          };
        })
      );

      return NextResponse.json({
        success: true,
        stores: enrichedStores,
      });
    }

    // 2. Jeśli zapytanie jest o konkretny sklep po subdomenie, domenie własnej lub ID
    if (subdomain) {
      const { data: stores, error: storeErr } = await dbClient
        .from("stores")
        .select("*")
        .or(`subdomain.eq.${subdomain},custom_domain.eq.${subdomain},id.eq.${subdomain}`)
        .neq("status", "deleted")
        .limit(1);

      if (storeErr || !stores || stores.length === 0) {
        return NextResponse.json({ success: false, store: null, products: [] }, { status: 404 });
      }

      const store = stores[0];

      // Pobierz produkty dla tego sklepu
      const { data: products } = await dbClient
        .from("products")
        .select("*")
        .eq("store_id", store.id);

      return NextResponse.json({
        success: true,
        store,
        products: products || [],
      });
    }

    return NextResponse.json({ success: false, error: "Brak parametrów wyszukiwania (subdomain lub owner_id)." }, { status: 400 });
  } catch (err: any) {
    console.error("[API /api/stores/sync GET Exception]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { store, owner_id } = body;

    if (!store || !store.subdomain) {
      return NextResponse.json({ success: false, error: "Brak danych sklepu lub subdomeny." }, { status: 400 });
    }

    const cleanSubdomain = (store.subdomain || "").trim().toLowerCase();
    const dbClient: any = supabaseAdmin || supabase;

    if (!dbClient) {
      return NextResponse.json({ success: false, error: "Brak klienta Supabase." }, { status: 500 });
    }

    const storeId = store.id || `store_${cleanSubdomain}`;
    const resolvedOwnerId = owner_id || store.owner_id || store.ownerId || null;

    // Pobierz istniejący sklep z bazy, aby NIGDY nie nadpisać expires_at przy zwykłej synchronizacji
    const { data: existingDbStore } = await dbClient
      .from("stores")
      .select("id, expires_at, trial_ends_at")
      .eq("subdomain", cleanSubdomain)
      .maybeSingle();

    const dbPayload: any = {
      id: existingDbStore?.id || storeId,
      owner_id: resolvedOwnerId,
      name: store.name || "Mój Sklep",
      subdomain: cleanSubdomain,
      custom_domain: store.customDomain || null,
      logo_url: store.logoUrl || store.logo_url || null,
      description: store.description || null,
      announcement: store.announcement || null,
      niche: store.niche || null,
      template: store.template || "Dark Vibe",
      accent_color: store.accentColor || store.accent_color || "#D0FF00",
      stripe_status: store.stripeStatus || "disconnected",
      balance_cents: store.balanceCents || 0,
      plan_type: store.planType || "Start",
      plan_status: store.planStatus || "active",
      status: store.status || "active",
      is_active: store.is_active !== false && store.status !== "deleted",
      social_links: store.socials || {},
      theme_config: {
        template: store.template || "Dark Vibe",
        accentColor: store.accentColor || store.accent_color || "#D0FF00",
        ownerEmail: store.ownerEmail,
      },
      drop_config: store.dropConfig || { enabled: false },
    };

    if (existingDbStore?.expires_at) {
      dbPayload.expires_at = existingDbStore.expires_at;
    } else if (store.expiresAt || store.planExpiresAt || store.expires_at) {
      dbPayload.expires_at = store.expiresAt || store.planExpiresAt || store.expires_at;
    }

    if (existingDbStore?.trial_ends_at) {
      dbPayload.trial_ends_at = existingDbStore.trial_ends_at;
    } else if (store.trialEndsAt || store.trial_ends_at) {
      dbPayload.trial_ends_at = store.trialEndsAt || store.trial_ends_at;
    }

    console.log(`[API /api/stores/sync] Synchronizowanie sklepu '${cleanSubdomain}' (id: ${dbPayload.id}, owner: ${resolvedOwnerId})...`);
    const { error: storeErr } = await dbClient.from("stores").upsert(dbPayload, { onConflict: "subdomain" });

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
        const rawImages = p.images || p.image || p.imageUrl || p.image_url;
        let safeImageList: string[] = [];
        if (Array.isArray(rawImages)) {
          safeImageList = rawImages.filter((img: any): img is string => typeof img === "string" && img.trim().length > 0);
        } else if (typeof rawImages === "string" && rawImages.trim().length > 0) {
          const trimmed = rawImages.trim();
          if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) safeImageList = parsed.filter((img: any): img is string => typeof img === "string" && img.trim().length > 0);
              else safeImageList = [trimmed];
            } catch {
              safeImageList = [trimmed];
            }
          } else {
            safeImageList = [trimmed];
          }
        }
        if (safeImageList.length === 0) {
          safeImageList = [p.type === "Cyfrowy"
            ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
            : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"];
        }

        const imgUrl = safeImageList[0];

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
          is_active: p.status !== "Nieaktywny" && p.status !== "Szkic",
          stock: p.stock !== undefined ? parseInt(String(p.stock)) : 50,
          image_url: imgUrl,
          images: safeImageList,
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
    }

    try {
      revalidatePath("/dashboard");
      revalidatePath(`/${cleanSubdomain}`, "page");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Sklep '${cleanSubdomain}' został pomyślnie zsynchronizowany.`,
      storeId,
    });
  } catch (err: any) {
    console.error("[API /api/stores/sync POST Exception]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
