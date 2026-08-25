import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { getUserAvatar, saveUserAvatar } from "@/lib/avatars";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Brak lub nieprawidłowy adres e-mail." }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: false, error: "Brak połączenia z bazą danych Supabase." }, { status: 500 });
    }

    // 1. Pobierz profil użytkownika
    const { data: profileRows, error: profErr } = await dbClient
      .from("profiles")
      .select("*")
      .eq("email", email)
      .limit(1);

    let profile = profileRows && profileRows.length > 0 ? profileRows[0] : null;

    // 2. Pobierz wszystkie sklepy użytkownika (po emailu lub owner_id)
    let userStores: any[] = [];
    const userId = profile?.id;

    if (userId) {
      const { data: storesById } = await dbClient
        .from("stores")
        .select("*")
        .eq("owner_id", userId)
        .neq("status", "deleted");

      if (storesById && storesById.length > 0) {
        userStores = storesById;
      }
    }

    // Jeśli po ID nic nie ma lub brak profilu, spróbuj wyszukać po emailu w theme_config
    if (userStores.length === 0) {
      try {
        const { data: storesByEmail } = await dbClient
          .from("stores")
          .select("*")
          .neq("status", "deleted");

        if (storesByEmail && storesByEmail.length > 0) {
          userStores = storesByEmail.filter((s: any) => {
            const ownerEmail = s.theme_config?.ownerEmail || s.owner_email;
            return ownerEmail && ownerEmail.toLowerCase() === email;
          });
        }
      } catch {}
    }

    // 3. Dla każdego sklepu pobierz produkty i zamówienia
    const storesWithDetails = await Promise.all(
      userStores.map(async (st: any) => {
        const { data: prods } = await dbClient
          .from("products")
          .select("*")
          .eq("store_id", st.id);

        const mappedProducts = (prods || []).map((p: any) => ({
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
          image: p.image_url,
          images: p.images || (p.image_url ? [p.image_url] : []),
          isDigital: p.is_digital || p.type === "Cyfrowy",
          digitalFileName: p.digital_file_name,
          digitalFileSize: p.digital_file_size,
          digitalFileUrl: p.digital_file_url,
          isDropOnly: p.is_drop_only,
          dropTargetDate: p.drop_target_date,
        }));

        // Pobierz zamówienia sklepu
        const { data: storeOrders } = await dbClient
          .from("orders")
          .select("*")
          .or(`store_id.eq.${st.id},store_id.eq.${st.subdomain}`)
          .order("created_at", { ascending: false });

        const mappedOrders = (storeOrders || []).map((o: any) => {
          const shipDet = o.shipping_details || {};
          return {
            id: o.id || `ord_${Date.now()}`,
            tenantId: o.store_id || st.id,
            storeId: o.store_id || st.id,
            stripeSessionId: o.stripe_session_id || "",
            amountTotalCents: o.amount_total_cents || Math.round((Number(o.total_amount) || 0) * 100),
            totalAmount: o.total_amount || ((o.amount_total_cents || 0) / 100).toFixed(2),
            status: o.status || "Opłacone",
            customerEmail: o.customer_email || shipDet.email || "klient@iskral.pl",
            customerName: o.customer_name || shipDet.name || "",
            customerPhone: o.customer_phone || shipDet.phone || "",
            shippingType: o.shipping_type || shipDet.method || (o.inpost_box ? "paczkomat" : o.shipping_address ? "courier" : "digital"),
            shippingAddress: o.shipping_address || shipDet.address || "",
            paczkomatCode: o.inpost_box || shipDet.paczkomat || "",
            shippingDetails: shipDet,
            items: Array.isArray(o.items) ? o.items : [],
            productTitle: o.product_title || (Array.isArray(o.items) && o.items[0]?.title) || "Zamówienie w sklepie",
            createdAt: o.created_at || new Date().toISOString(),
          };
        });

        let storeExpiresAt = st.expires_at || st.trial_ends_at || null;
        const expTime = storeExpiresAt ? new Date(storeExpiresAt).getTime() : 0;
        if (!storeExpiresAt || isNaN(expTime) || expTime <= Date.now()) {
          storeExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          dbClient
            .from("stores")
            .update({ expires_at: storeExpiresAt, plan_status: "active", is_active: true })
            .eq("id", st.id)
            .then(() => {})
            .catch(() => {});
        }

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
          expiresAt: storeExpiresAt,
          planExpiresAt: storeExpiresAt,
          trialEndsAt: st.trial_ends_at || null,
          gracePeriodEndsAt: st.grace_period_ends_at || null,
          visitsCount: typeof st.visits_count === "number" ? st.visits_count : 0,
          balanceCents: typeof st.balance_cents === "number" ? st.balance_cents : 0,
          socials: st.social_links || {},
          dropConfig: st.drop_config || { enabled: false },
          products: mappedProducts,
          orders: mappedOrders,
        };
      })
    );

    // 4. Pobierz subskrypcje / pakiety
    let userServices: any[] = [];
    if (profile?.services && Array.isArray(profile.services)) {
      userServices = profile.services;
    } else if (userId) {
      const { data: subs } = await dbClient
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");

      if (subs && subs.length > 0) {
        userServices = subs.map((sub: any, idx: number) => ({
          id: sub.id || `srv_${idx + 100}`,
          number: 5000 + idx,
          title: `Pakiet ${sub.plan_name || "Start"}`,
          planType: sub.plan_name || "Start",
          status: "Aktywny",
          expiresAt: sub.current_period_end || null,
          createdAt: sub.created_at,
        }));
      }
    }

    // 5. Zbuduj pełny obiekt użytkownika
    const isSuperadmin = email === "projekt@motywo.pl" || email === "projekt@iskral.pl" || email.includes("admin");
    const persistentAvatar = getUserAvatar(email) || profile?.avatar_url || profile?.avatarUrl || "";

    const fullUser = {
      id: profile?.id || `usr_${email.replace(/[^a-z0-9]/g, "_")}`,
      email: email,
      name: profile?.name || email.split("@")[0],
      avatarUrl: persistentAvatar,
      avatar_url: persistentAvatar,
      role: isSuperadmin ? "superadmin" : (profile?.role || "user"),
      plan: profile?.plan || (isSuperadmin ? "Brand" : "Start"),
      hasStore: storesWithDetails.length > 0 || Boolean(profile?.has_store),
      accountStatus: profile?.account_status || "Active",
      isEmailVerified: profile?.is_email_verified !== false,
      createdAt: profile?.created_at || new Date().toISOString(),
      services: userServices,
      stores: storesWithDetails,
      store: storesWithDetails[0] || null,
      activeStoreId: storesWithDetails[0]?.id || null,
    };

    return NextResponse.json({
      success: true,
      user: fullUser,
      stores: storesWithDetails,
      services: userServices,
    });
  } catch (err: any) {
    console.error("[API /api/auth/sync-user GET Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user: incomingUser, services, stores } = body;

    if (!incomingUser || !incomingUser.email) {
      return NextResponse.json({ success: false, error: "Brak danych użytkownika lub e-maila." }, { status: 400 });
    }

    const cleanEmail = incomingUser.email.toLowerCase().trim();
    const dbClient: any = supabaseAdmin || supabase;

    if (!dbClient) {
      return NextResponse.json({ success: false, error: "Brak połączenia z bazą danych Supabase." }, { status: 500 });
    }

    // 0. Trwały zapis avatara jeśli przesłano w obiekcie usera
    const incomingAvatar = incomingUser.avatarUrl || incomingUser.avatar_url || incomingUser.image;
    if (incomingAvatar && typeof incomingAvatar === "string" && incomingAvatar.length > 0) {
      await saveUserAvatar(cleanEmail, incomingAvatar);
    }

    const isSuperadmin = cleanEmail === "projekt@motywo.pl" || cleanEmail === "projekt@iskral.pl" || cleanEmail.includes("admin");

    const profilePayload: any = {
      email: cleanEmail,
      name: incomingUser.name || cleanEmail.split("@")[0],
      role: isSuperadmin ? "superadmin" : (incomingUser.role || "user"),
      plan: incomingUser.plan || "Start",
      account_status: incomingUser.accountStatus || "Active",
      is_email_verified: incomingUser.isEmailVerified !== false,
    };

    if (incomingUser.id && typeof incomingUser.id === "string" && incomingUser.id.length > 20 && incomingUser.id.includes("-")) {
      profilePayload.id = incomingUser.id;
    }

    // 1. Bezpieczny upsert profilu w Supabase
    let resolvedOwnerId = (typeof incomingUser.id === "string" && incomingUser.id.length > 20 && incomingUser.id.includes("-")) ? incomingUser.id : null;

    try {
      const { data: upsertedProf, error: profErr } = await dbClient
        .from("profiles")
        .upsert(profilePayload, { onConflict: "email" })
        .select("id")
        .maybeSingle();

      if (upsertedProf?.id) {
        resolvedOwnerId = upsertedProf.id;
      } else if (profErr) {
        console.warn("[API /api/auth/sync-user POST] Warning upserting profile:", profErr.message);
        // Fallback: pobierz profil po emailu
        const { data: existingProf } = await dbClient
          .from("profiles")
          .select("id")
          .eq("email", cleanEmail)
          .maybeSingle();
        if (existingProf?.id) resolvedOwnerId = existingProf.id;
      }
    } catch (e: any) {
      console.warn("[API /api/auth/sync-user POST] Exception during profile upsert:", e.message);
    }

    // Opcjonalna synchronizacja pakietów / subskrypcji do tabeli subscriptions
    const incomingServices = services || incomingUser.services;
    if (Array.isArray(incomingServices) && incomingServices.length > 0 && resolvedOwnerId) {
      for (const s of incomingServices) {
        if (!s) continue;
        try {
          await dbClient.from("subscriptions").upsert({
            user_id: resolvedOwnerId,
            user_email: cleanEmail,
            plan_name: s.planType || s.title?.replace("Pakiet ", "") || "Start",
            status: "active",
            current_period_end: s.expiresAt || undefined,
          });
        } catch {}
      }
    }

    // 2. Jeśli przekazano sklepy, synchronizujemy je z tabelą stores
    const incomingStores = stores || incomingUser.stores || (incomingUser.store ? [incomingUser.store] : []);

    if (Array.isArray(incomingStores) && incomingStores.length > 0) {
      for (const st of incomingStores) {
        if (!st || !st.subdomain) continue;
        const cleanSub = st.subdomain.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!cleanSub) continue;

        // Pobierz istniejący sklep z bazy, aby NIGDY nie nadpisać expires_at przy logowaniu/syncu użytkownika
        const { data: existingStore } = await dbClient
          .from("stores")
          .select("id, expires_at, trial_ends_at")
          .eq("subdomain", cleanSub)
          .maybeSingle();

        const storePayload: any = {
          id: existingStore?.id || st.id || `store_${cleanSub}`,
          owner_id: resolvedOwnerId,
          name: st.name || "Mój Sklep",
          subdomain: cleanSub,
          custom_domain: st.customDomain || null,
          domain_verified: st.domainVerified || false,
          logo_url: st.logoUrl || null,
          description: st.description || null,
          announcement: st.announcement || null,
          template: st.template || "Dark Vibe",
          accent_color: st.accentColor || "#D0FF00",
          plan_type: st.planType || incomingUser.plan || "Start",
          plan_status: st.planStatus || "active",
          status: st.status || "active",
          is_active: st.isActive !== false && st.status !== "deleted",
          social_links: st.socials || {},
          theme_config: {
            template: st.template || "Dark Vibe",
            accentColor: st.accentColor || "#D0FF00",
            ownerEmail: cleanEmail,
          },
          drop_config: st.dropConfig || { enabled: false },
        };

        if (existingStore?.expires_at) {
          storePayload.expires_at = existingStore.expires_at;
        } else if (st.expiresAt || st.planExpiresAt || st.expires_at) {
          storePayload.expires_at = st.expiresAt || st.planExpiresAt || st.expires_at;
        }

        if (existingStore?.trial_ends_at) {
          storePayload.trial_ends_at = existingStore.trial_ends_at;
        } else if (st.trialEndsAt || st.trial_ends_at) {
          storePayload.trial_ends_at = st.trialEndsAt || st.trial_ends_at;
        }

        await dbClient.from("stores").upsert(storePayload, { onConflict: "subdomain" });

        // Synchronizuj produkty danego sklepu
        if (Array.isArray(st.products) && st.products.length > 0) {
          for (const p of st.products) {
            if (!p || !p.name) continue;
            const cleanPrice = String(p.price || "").replace(",", ".").replace(/[^0-9.]/g, "");
            const priceNum = parseFloat(cleanPrice) || 149;
            const priceCents = p.priceCents || Math.round(priceNum * 100);

            const prodPayload = {
              id: p.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              store_id: storePayload.id,
              name: p.name,
              description: p.description || "",
              price: p.price || `${priceNum.toFixed(2)} PLN`,
              price_cents: priceCents,
              compare_price: p.comparePrice || null,
              compare_price_cents: p.comparePriceCents || null,
              type: p.type || "Fizyczny",
              status: p.status || "Aktywny",
              is_active: p.status !== "Nieaktywny" && p.status !== "Szkic",
              stock: p.stock !== undefined ? parseInt(String(p.stock)) : 50,
              image_url: p.image || (p.images && p.images[0]) || null,
              images: p.images || (p.image ? [p.image] : []),
              is_digital: p.isDigital || p.type === "Cyfrowy",
              digital_file_name: p.digitalFileName || null,
              digital_file_size: p.digitalFileSize || null,
              digital_file_url: p.digitalFileUrl || null,
            };

            await dbClient.from("products").upsert(prodPayload, { onConflict: "id" });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profil i zasoby użytkownika zostały pomyślnie zsynchronizowane w bazie danych.",
      ownerId: resolvedOwnerId,
    });
  } catch (err: any) {
    console.error("[API /api/auth/sync-user POST Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
