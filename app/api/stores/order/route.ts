import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";
import { sendCustomerOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawStoreId = body.storeId || body.tenantId || body.store_id;
    const {
      productId,
      productTitle,
      customerEmail,
      customerName,
      customerPhone,
      shippingType,
      paczkomatCode,
      shippingAddress,
      shippingDetails,
      items,
      amountTotalCents,
      stripeSessionId,
    } = body;

    if (!rawStoreId || !amountTotalCents) {
      return NextResponse.json({ success: false, error: "Brak wymaganych danych zamówienia." }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: true, warning: "Brak połączenia z bazą, zapisano lokalnie." });
    }

    // Resolve exact store ID from database
    let targetStoreId = rawStoreId;
    try {
      const { data: st } = await dbClient
        .from("stores")
        .select("id")
        .or(`id.eq.${rawStoreId},subdomain.eq.${rawStoreId}`)
        .maybeSingle();
      if (st?.id) {
        targetStoreId = st.id;
      }
    } catch {}

    // 1. Zapisz rekord zamówienia z poprawnym kluczem store_id oraz danymi klienta i wysyłki
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const resolvedShippingDetails = shippingDetails || {
      method: shippingType || (paczkomatCode ? "paczkomat" : shippingAddress ? "courier" : "digital"),
      paczkomat: paczkomatCode || null,
      address: shippingAddress || null,
      name: customerName || null,
      phone: customerPhone || null,
      email: customerEmail || null,
    };

    const resolvedItems = Array.isArray(items) && items.length > 0
      ? items
      : [{ productId: productId || "item", title: productTitle || "Produkt", quantity: 1, amountCents: amountTotalCents }];

    const orderPayload: any = {
      id: orderId,
      store_id: targetStoreId,
      stripe_session_id: stripeSessionId || `manual_${Date.now()}`,
      amount_total_cents: amountTotalCents,
      total_amount: ((amountTotalCents || 0) / 100).toFixed(2),
      status: body.status || "Niewysłane",
      customer_email: customerEmail || "klient@iskral.pl",
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      shipping_address: shippingAddress || null,
      inpost_box: paczkomatCode || null,
      shipping_details: resolvedShippingDetails,
      product_title: productTitle || (resolvedItems[0]?.title) || "Zamówienie w sklepie",
      items: resolvedItems,
      created_at: new Date().toISOString(),
    };

    const { data: orderData, error: orderErr } = await dbClient.from("orders").insert(orderPayload).select();

    if (orderErr) {
      console.warn("[API /api/stores/order POST error]:", orderErr.message);
    }

    // 2. Zaktualizuj stan magazynowy i sprzedaż produktu
    if (productId) {
      try {
        const { data: prod } = await dbClient.from("products").select("stock, sales").eq("id", productId).maybeSingle();
        if (prod) {
          const currentStock = typeof prod.stock === "number" ? prod.stock : 50;
          const newStock = Math.max(0, currentStock - 1);
          await dbClient
            .from("products")
            .update({
              stock: newStock,
              sales: (prod.sales || 0) + 1,
              status: newStock <= 0 ? "Wyprzedany" : "Aktywny",
            })
            .eq("id", productId);
        }
      } catch (prodErr) {
        console.warn("[API /api/stores/order update product stock error]:", prodErr);
      }
    }

    // 3. Zwiększ balance_cents w tabeli stores
    try {
      const { data: st } = await dbClient.from("stores").select("balance_cents").eq("id", targetStoreId).maybeSingle();
      if (st) {
        await dbClient
          .from("stores")
          .update({
            balance_cents: (st.balance_cents || 0) + amountTotalCents,
          })
          .eq("id", targetStoreId);
      }
    } catch (storeErr) {
      console.warn("[API /api/stores/order update balance error]:", storeErr);
    }

    // 4. Wysyłanie e-maila transakcyjnego z potwierdzeniem zakupu do klienta
    if (customerEmail && customerEmail.includes("@")) {
      try {
        let storeName = "IskraL Sklep";
        const { data: stInfo } = await dbClient
          .from("stores")
          .select("name")
          .or(`id.eq.${targetStoreId},subdomain.eq.${targetStoreId}`)
          .maybeSingle();
        if (stInfo?.name) storeName = stInfo.name;

        const amountFormatted = `${((amountTotalCents || 0) / 100).toFixed(2)} PLN`;

        sendCustomerOrderConfirmationEmail({
          to: customerEmail,
          storeName,
          orderId,
          amountTotalFormatted: amountFormatted,
          items: resolvedItems,
          productTitle: productTitle || resolvedItems[0]?.title,
          shippingMethod: resolvedShippingDetails?.method,
          paczkomatCode: paczkomatCode || resolvedShippingDetails?.paczkomat,
          shippingAddress: shippingAddress || resolvedShippingDetails?.address,
          customerName: customerName || resolvedShippingDetails?.name,
        }).catch((emailErr) => console.error("[Order API Email Error]:", emailErr));
      } catch (emailEx) {
        console.error("[Order API Email Exception]:", emailEx);
      }
    }

    return NextResponse.json({ success: true, order: orderData ? orderData[0] : orderPayload, orderId });
  } catch (err: any) {
    console.error("[API /api/stores/order Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd zapisu zamówienia" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawStoreId = searchParams.get("tenantId") || searchParams.get("storeId") || searchParams.get("store_id");
    const rawStoreIds = searchParams.get("storeIds");
    const rawSubdomain = searchParams.get("subdomain");
    const rawUserId = searchParams.get("userId") || searchParams.get("ownerId");
    const rawUserEmail = searchParams.get("userEmail") || searchParams.get("email");

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const matchingStoreIds = new Set<string>();

    // 1. Dodaj przekazane storeId
    if (rawStoreId && rawStoreId !== "empty_store") {
      rawStoreId.split(",").map((s) => s.trim()).filter(Boolean).forEach((id) => matchingStoreIds.add(id));
    }
    if (rawStoreIds) {
      rawStoreIds.split(",").map((s) => s.trim()).filter(Boolean).forEach((id) => matchingStoreIds.add(id));
    }
    if (rawSubdomain) {
      rawSubdomain.split(",").map((s) => s.trim()).filter(Boolean).forEach((sub) => matchingStoreIds.add(sub));
    }

    // 2. Jeśli przekazano userId lub userEmail, pobierz wszystkie powiązane sklepy
    try {
      let resolvedOwnerId = rawUserId;
      if (!resolvedOwnerId && rawUserEmail) {
        const { data: prof } = await dbClient
          .from("profiles")
          .select("id")
          .eq("email", rawUserEmail.trim().toLowerCase())
          .maybeSingle();
        if (prof?.id) {
          resolvedOwnerId = prof.id;
        }
      }

      if (resolvedOwnerId) {
        const { data: userStores } = await dbClient
          .from("stores")
          .select("id, subdomain")
          .eq("owner_id", resolvedOwnerId);

        if (userStores && Array.isArray(userStores)) {
          userStores.forEach((st: any) => {
            if (st.id) matchingStoreIds.add(st.id);
            if (st.subdomain) matchingStoreIds.add(st.subdomain);
          });
        }
      }
    } catch (ownerErr) {
      console.warn("[API /api/stores/order GET owner resolution warning]:", ownerErr);
    }

    // 3. Resolve stores matching store IDs or subdomains
    try {
      const orClauses: string[] = [];
      matchingStoreIds.forEach((id) => {
        orClauses.push(`id.eq.${id}`);
        orClauses.push(`subdomain.eq.${id}`);
      });

      if (orClauses.length > 0) {
        const { data: stList } = await dbClient
          .from("stores")
          .select("id, subdomain")
          .or(orClauses.join(","));

        if (stList && Array.isArray(stList)) {
          stList.forEach((s: any) => {
            if (s.id) matchingStoreIds.add(s.id);
            if (s.subdomain) matchingStoreIds.add(s.subdomain);
          });
        }
      }
    } catch (resolveErr) {
      console.warn("[API /api/stores/order GET store resolution warning]:", resolveErr);
    }

    const idList = Array.from(matchingStoreIds).filter((id) => id && id !== "empty_store");
    if (idList.length === 0) {
      // Jeśli brak filtrów ID, ale jest podany email lub id usera
      return NextResponse.json({ success: true, orders: [] });
    }

    // Pobieramy zamówienia bezpośrednio po wszystkich powiązanych identyfikatorach
    const orFilter = idList.map((id) => `store_id.eq.${id}`).join(",");
    const { data: orders, error } = await dbClient
      .from("orders")
      .select("*")
      .or(orFilter)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("[API /api/stores/order GET query warning]:", error.message);
      return NextResponse.json({ success: true, orders: [] });
    }

    const safeOrders = (orders || []).map((o: any) => {
      const shipDet = o.shipping_details || {};
      const resolvedStatus = o.status || "Niewysłane";

      return {
        id: o.id,
        tenantId: o.store_id || idList[0],
        storeId: o.store_id || idList[0],
        stripeSessionId: o.stripe_session_id || "",
        amountTotalCents: o.amount_total_cents || Math.round((Number(o.total_amount) || 0) * 100),
        totalAmount: o.total_amount || ((o.amount_total_cents || 0) / 100).toFixed(2),
        status: resolvedStatus,
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

    return NextResponse.json({ success: true, orders: safeOrders });
  } catch (err: any) {
    console.warn("[API /api/stores/order GET exception]:", err?.message || err);
    return NextResponse.json({ success: true, orders: [] });
  }
}

