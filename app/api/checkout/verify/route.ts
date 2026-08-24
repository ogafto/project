import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin, supabase } from "@/lib/supabase";
import { sendCustomerOrderConfirmationEmail, sendPurchaseConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const formatDatePL = (date: Date) => {
  const monthsPL = [
    "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
    "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
  ];
  return `${date.getDate()} ${monthsPL[date.getMonth()]} ${date.getFullYear()}`;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id") || searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Brak identyfikatora sesji Stripe (session_id)." }, { status: 400 });
    }

    const result = await processStripeSession(sessionId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Checkout Verify API GET Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd weryfikacji sesji" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId || body.session_id;

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Brak identyfikatora sesji Stripe." }, { status: 400 });
    }

    const result = await processStripeSession(sessionId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Checkout Verify API POST Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd weryfikacji sesji" }, { status: 500 });
  }
}

async function processStripeSession(sessionId: string) {
  if (!sessionId.startsWith("cs_")) {
    return { success: true, message: "Non-stripe session ID handled locally", sessionId };
  }

  // 1. Retrieve session from Stripe
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) {
    return { success: false, error: "Nie odnaleziono sesji w systemie Stripe." };
  }

  const dbAdmin: any = supabaseAdmin || supabase;
  const metadata = session.metadata || {};
  const isPlan = metadata.type === "plan" || Boolean(metadata.plan_type);
  let rawStoreId = session.client_reference_id || metadata.storeId || metadata.store_id || metadata.tenantId || metadata.tenant_id;
  const productId = metadata.productId || metadata.product_id;
  let resolvedStoreId = rawStoreId;

  if (dbAdmin) {
    if ((!rawStoreId || rawStoreId === "demo-tenant" || rawStoreId === "empty_store") && productId) {
      try {
        const { data: prodRow } = await dbAdmin
          .from("products")
          .select("store_id")
          .eq("id", productId)
          .maybeSingle();
        if (prodRow?.store_id) {
          rawStoreId = prodRow.store_id;
          resolvedStoreId = prodRow.store_id;
        }
      } catch {}
    }

    if (rawStoreId) {
      try {
        const { data: stRow } = await dbAdmin
          .from("stores")
          .select("id")
          .or(`id.eq.${rawStoreId},subdomain.eq.${rawStoreId}`)
          .maybeSingle();
        if (stRow?.id) {
          resolvedStoreId = stRow.id;
        }
      } catch {}
    }
  }

  const tenantId = resolvedStoreId || rawStoreId;
  const amountTotalCents = session.amount_total || Number(metadata.amount_cents || 24900);
  const customerEmail = session.customer_details?.email || metadata.customerEmail || metadata.customer_email || session.customer_email || "klient@iskral.pl";

  if (!dbAdmin || !tenantId) {
    return { success: true, verified: true, isPlan, tenantId, customerEmail };
  }

  if (isPlan) {
    const rawPlanName = metadata.plan_type || "Creator";
    const planNameFormatted = rawPlanName.toLowerCase().startsWith("pakiet") ? rawPlanName : `Pakiet ${rawPlanName}`;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 30);

    // Create or update subscription
    await dbAdmin.from("subscriptions").insert({
      tenant_id: tenantId,
      user_email: customerEmail,
      plan_name: rawPlanName,
      status: "active",
      stripe_customer_id: String(session.customer || ""),
      stripe_subscription_id: String(session.subscription || session.id),
      amount_paid_cents: amountTotalCents,
      current_period_end: expirationDate.toISOString(),
      created_at: new Date().toISOString(),
    });

    await dbAdmin
      .from("stores")
      .update({
        plan_type: rawPlanName,
        plan_status: "active",
        is_active: true,
        trial_ends_at: expirationDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${tenantId},subdomain.eq.${tenantId}`);

    if (customerEmail && customerEmail.includes("@")) {
      const amountFormatted = `${(amountTotalCents / 100).toFixed(2).replace(".", ",")} zł`;
      const expiresAtFormatted = formatDatePL(expirationDate);
      sendPurchaseConfirmationEmail({
        to: customerEmail,
        planName: planNameFormatted,
        amountFormatted,
        expiresAtFormatted,
      }).catch(() => {});
    }

    return { success: true, verified: true, isPlan: true, plan: rawPlanName, storeId: tenantId };
  } else {
    // Check if order already recorded
    const { data: existingOrders } = await dbAdmin
      .from("orders")
      .select("*")
      .eq("stripe_session_id", session.id)
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      return { success: true, verified: true, isPlan: false, order: existingOrders[0], alreadyRecorded: true };
    }

    const productId = metadata.productId || metadata.product_id;
    const quantity = Math.max(1, parseInt(metadata.quantity || "1", 10) || 1);
    const productTitle = metadata.title || metadata.product_title || "Zamówienie w sklepie";
    const customerName = metadata.customerName || metadata.customer_name || session.customer_details?.name || "";
    const customerPhone = metadata.customerPhone || metadata.customer_phone || session.customer_details?.phone || "";
    const shippingType = metadata.shippingType || metadata.shipping_type || (metadata.paczkomat_code || metadata.paczkomatCode ? "paczkomat" : metadata.shipping_address || metadata.shippingAddress ? "courier" : "digital");
    const paczkomatCode = metadata.paczkomatCode || metadata.paczkomat_code || "";
    const shippingAddress = metadata.shippingAddress || metadata.shipping_address || "";
    const selectedVariant = metadata.selectedVariant || metadata.selected_variant || "";

    const shippingDetails = {
      method: shippingType,
      paczkomat: paczkomatCode || null,
      address: shippingAddress || null,
      name: customerName || null,
      phone: customerPhone || null,
      email: customerEmail,
    };

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newOrderPayload = {
      id: orderId,
      store_id: tenantId,
      stripe_session_id: session.id,
      total_amount: (amountTotalCents / 100).toFixed(2),
      amount_total_cents: amountTotalCents,
      status: "Niewysłane",
      customer_email: customerEmail,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      shipping_address: shippingAddress || null,
      inpost_box: paczkomatCode || null,
      shipping_details: shippingDetails,
      product_title: productTitle,
      items: [{
        productId: productId || "prod_item",
        quantity,
        amountCents: amountTotalCents,
        title: productTitle,
        selectedVariant: selectedVariant || undefined,
      }],
      created_at: new Date().toISOString(),
    };

    await dbAdmin.from("orders").insert(newOrderPayload);

    // Update product stock and sales
    if (productId) {
      try {
        const { data: prod } = await dbAdmin
          .from("products")
          .select("stock, sales")
          .eq("id", productId)
          .maybeSingle();

        if (prod) {
          const currentStock = typeof prod.stock === "number" ? prod.stock : 50;
          const newStock = Math.max(0, currentStock - quantity);
          const newSales = (prod.sales ?? 0) + quantity;
          await dbAdmin
            .from("products")
            .update({
              stock: newStock,
              sales: newSales,
              status: newStock <= 0 ? "Wyprzedany" : "Aktywny",
            })
            .eq("id", productId);
        }
      } catch {}
    }

    // Update store balance
    try {
      const { data: storeData } = await dbAdmin
        .from("stores")
        .select("balance_cents, name")
        .or(`id.eq.${tenantId},subdomain.eq.${tenantId}`)
        .maybeSingle();

      const currentBalance = storeData?.balance_cents || 0;
      await dbAdmin
        .from("stores")
        .update({ balance_cents: currentBalance + amountTotalCents })
        .or(`id.eq.${tenantId},subdomain.eq.${tenantId}`);

      if (customerEmail && customerEmail.includes("@")) {
        const amountFormatted = `${(amountTotalCents / 100).toFixed(2).replace(".", ",")} zł`;
        sendCustomerOrderConfirmationEmail({
          to: customerEmail,
          storeName: storeData?.name || "Sklep",
          orderId,
          amountTotalFormatted: amountFormatted,
          items: [{ title: productTitle, quantity, amountCents: amountTotalCents, priceFormatted: amountFormatted }],
          productTitle,
          shippingMethod: shippingType,
          paczkomatCode: paczkomatCode || undefined,
          shippingAddress: shippingAddress || undefined,
          customerName: customerName || undefined,
        }).catch(() => {});
      }
    } catch {}

    return { success: true, verified: true, isPlan: false, order: newOrderPayload, storeId: tenantId };
  }
}
