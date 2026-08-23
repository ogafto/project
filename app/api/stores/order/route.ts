import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

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
      status: "paid",
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

    if (!rawStoreId) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: true, orders: [] });
    }

    // Resolve exact store ID
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

    // Pobieramy zamówienia bezpośrednio po właściwej kolumnie store_id
    const { data: orders, error } = await dbClient
      .from("orders")
      .select("*")
      .or(`store_id.eq.${targetStoreId},store_id.eq.${rawStoreId}`)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("[API /api/stores/order GET warning]:", error.message);
      return NextResponse.json({ success: true, orders: [] });
    }

    const safeOrders = (orders || []).map((o: any) => {
      const shipDet = o.shipping_details || {};
      return {
        id: o.id,
        tenantId: o.store_id || targetStoreId,
        storeId: o.store_id || targetStoreId,
        stripeSessionId: o.stripe_session_id || "",
        amountTotalCents: o.amount_total_cents || Math.round((Number(o.total_amount) || 0) * 100),
        totalAmount: o.total_amount || ((o.amount_total_cents || 0) / 100).toFixed(2),
        status: o.status || "paid",
        customerEmail: o.customer_email || shipDet.email || "klient@iskral.pl",
        customerName: o.customer_name || shipDet.name || "",
        customerPhone: o.customer_phone || shipDet.phone || "",
        shippingType: o.shipping_type || shipDet.method || (o.inpost_box ? "paczkomat" : o.shipping_address ? "courier" : "digital"),
        shippingAddress: o.shipping_address || shipDet.address || "",
        paczkomatCode: o.inpost_box || shipDet.paczkomat || "",
        shippingDetails: shipDet,
        items: Array.isArray(o.items) ? o.items : [],
        productTitle: o.product_title || "Zamówienie w sklepie",
        createdAt: o.created_at || new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, orders: safeOrders });
  } catch (err: any) {
    console.warn("[API /api/stores/order GET exception]:", err?.message || err);
    return NextResponse.json({ success: true, orders: [] });
  }
}

