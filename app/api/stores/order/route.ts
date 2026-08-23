import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawStoreId = body.storeId || body.tenantId || body.store_id;
    const { productId, productTitle, customerEmail, amountTotalCents, stripeSessionId } = body;

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

    // 1. Zapisz rekord zamówienia z poprawnym kluczem store_id
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const orderPayload = {
      id: orderId,
      store_id: targetStoreId,
      stripe_session_id: stripeSessionId || `manual_${Date.now()}`,
      amount_total_cents: amountTotalCents,
      total_amount: ((amountTotalCents || 0) / 100).toFixed(2),
      status: "paid",
      customer_email: customerEmail || "klient@iskral.pl",
      product_title: productTitle || "Zamówienie w sklepie",
      items: [{ productId: productId || "item", quantity: 1, amountCents: amountTotalCents }],
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
      .limit(50);

    if (error) {
      console.warn("[API /api/stores/order GET warning]:", error.message);
      return NextResponse.json({ success: true, orders: [] });
    }

    const safeOrders = (orders || []).map((o: any) => ({
      id: o.id,
      tenantId: o.store_id || targetStoreId,
      storeId: o.store_id || targetStoreId,
      stripeSessionId: o.stripe_session_id || "",
      amountTotalCents: o.amount_total_cents || Math.round((Number(o.total_amount) || 0) * 100),
      totalAmount: o.total_amount || ((o.amount_total_cents || 0) / 100).toFixed(2),
      status: o.status || "paid",
      customerEmail: o.customer_email || "klient@iskral.pl",
      productTitle: o.product_title || "Zamówienie w sklepie",
      createdAt: o.created_at || new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, orders: safeOrders });
  } catch (err: any) {
    console.warn("[API /api/stores/order GET exception]:", err?.message || err);
    return NextResponse.json({ success: true, orders: [] });
  }
}
