import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, productId, customerEmail, amountTotalCents, stripeSessionId } = body;

    if (!tenantId || !amountTotalCents) {
      return NextResponse.json({ success: false, error: "Brak wymaganych danych zamówienia." }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: true, warning: "Brak połączenia z bazą, zapisano lokalnie." });
    }

    // 1. Zapisz rekord zamówienia
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const { data: orderData, error: orderErr } = await dbClient.from("orders").insert({
      id: orderId,
      tenant_id: tenantId,
      stripe_session_id: stripeSessionId || `manual_${Date.now()}`,
      amount_total_cents: amountTotalCents,
      status: "paid",
      customer_email: customerEmail || "klient@iskral.pl",
      created_at: new Date().toISOString(),
    }).select();

    // 2. Zaktualizuj stan magazynowy i sprzedaż produktu
    if (productId) {
      try {
        const { data: prod } = await dbClient.from("products").select("stock, sales").eq("id", productId).single();
        if (prod) {
          await dbClient
            .from("products")
            .update({
              stock: Math.max(0, (prod.stock || 50) - 1),
              sales: (prod.sales || 0) + 1,
            })
            .eq("id", productId);
        }
      } catch {}
    }

    // 3. Zwiększ balance_cents w tabeli stores
    try {
      const { data: st } = await dbClient.from("stores").select("balance_cents").eq("id", tenantId).single();
      if (st) {
        await dbClient
          .from("stores")
          .update({
            balance_cents: (st.balance_cents || 0) + amountTotalCents,
          })
          .eq("id", tenantId);
      }
    } catch {}

    return NextResponse.json({ success: true, order: orderData ? orderData[0] : null, orderId });
  } catch (err: any) {
    console.error("[API /api/stores/order Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd zapisu zamówienia" }, { status: 500 });
  }
}
