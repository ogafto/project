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
  const isPlan =
    metadata.type === "plan" ||
    metadata.type === "plan_purchase" ||
    metadata.type === "plan_renewal" ||
    Boolean(metadata.plan_type) ||
    Boolean(metadata.planType) ||
    Boolean(metadata.planName);
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

    if ((!resolvedStoreId || resolvedStoreId === "demo-tenant" || resolvedStoreId === "empty_store") && isPlan) {
      const targetUserId = metadata.userId || metadata.user_id;
      const targetEmail = session.customer_details?.email || metadata.customerEmail || metadata.customer_email || session.customer_email;
      if (targetUserId) {
        try {
          const { data: userStore } = await dbAdmin
            .from("stores")
            .select("id")
            .eq("owner_id", targetUserId)
            .neq("status", "deleted")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (userStore?.id) resolvedStoreId = userStore.id;
        } catch {}
      }
      if (!resolvedStoreId && targetEmail) {
        try {
          const { data: allStores } = await dbAdmin
            .from("stores")
            .select("id, theme_config, owner_email")
            .neq("status", "deleted");
          const found = (allStores || []).find((s: any) => {
            const ownerEmail = s.theme_config?.ownerEmail || s.owner_email;
            return ownerEmail && ownerEmail.toLowerCase() === targetEmail.toLowerCase();
          });
          if (found?.id) resolvedStoreId = found.id;
        } catch {}
      }
    }
  }

  const tenantId = resolvedStoreId || rawStoreId;

  console.log('=== PROCES ZAKUPU (Checkout Verify) ===');
  console.log('ID PRODUKTU:', productId);
  console.log('STORE ID Z PRODUKTU:', rawStoreId);
  console.log('STORE ID AKTYWNEGO SKLEPU:', resolvedStoreId);
  console.log('TWORZENIE REKORDU ZAMÓWIENIA DLA STORE_ID:', tenantId);

  const amountTotalCents = session.amount_total || Number(metadata.amount_cents || 24900);
  const customerEmail = session.customer_details?.email || metadata.customerEmail || metadata.customer_email || session.customer_email || "klient@iskral.pl";
  const planDurationDays = parseInt(metadata.planDurationDays || metadata.plan_duration_days || "30", 10) || 30;

  if (!dbAdmin || !tenantId) {
    return { success: true, verified: true, isPlan, tenantId, customerEmail };
  }

  if (isPlan) {
    const rawPlanName = metadata.plan_type || metadata.planType || metadata.planName || "Creator";
    const planNameFormatted = rawPlanName.toLowerCase().startsWith("pakiet") ? rawPlanName : `Pakiet ${rawPlanName}`;

    // Pobierz obecny stan sklepu do obliczenia ważności
    const { data: currentStore } = await dbAdmin
      .from("stores")
      .select("id, name, theme_config, owner_id")
      .or(`id.eq.${tenantId},subdomain.eq.${tenantId}`)
      .maybeSingle();

    const currentExpiry = currentStore?.theme_config?.expires_at ? new Date(currentStore.theme_config.expires_at).getTime() : Date.now();
    const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
    const newExpiresAt = new Date(baseTime + planDurationDays * 24 * 60 * 60 * 1000).toISOString();

    // 1. Zapis/aktualizacja rekordu w subscriptions
    try {
      await dbAdmin.from("subscriptions").insert({
        tenant_id: tenantId,
        user_id: metadata.userId || metadata.user_id || currentStore?.owner_id || null,
        user_email: customerEmail,
        plan_name: planNameFormatted,
        plan_id: rawPlanName,
        status: "active",
        billing_cycle: metadata.billingCycle || metadata.billing_cycle || "miesiac",
        stripe_customer_id: String(session.customer || ""),
        stripe_subscription_id: String(session.subscription || session.id),
        amount_paid_cents: amountTotalCents,
        current_period_end: newExpiresAt,
        created_at: new Date().toISOString(),
      });
    } catch (subErr) {
      console.warn("[Checkout Verify] subscriptions insert warning:", subErr);
    }

    // 2. Zapis w platform_purchases
    try {
      await dbAdmin.from("platform_purchases").upsert({
        id: `purch_${session.id || Date.now()}`,
        user_id: metadata.userId || metadata.user_id || currentStore?.owner_id || null,
        user_email: customerEmail,
        store_id: tenantId,
        store_name: currentStore?.name || `Sklep ${tenantId}`,
        package_name: `${planNameFormatted} (${planDurationDays} dni)`,
        plan_type: rawPlanName,
        amount_cents: amountTotalCents,
        currency: "PLN",
        stripe_payment_id: String(session.payment_intent || session.id),
        status: "Opłacone",
        created_at: new Date().toISOString(),
      });
    } catch (purchErr) {
      console.warn("[Checkout Verify] platform_purchases insert warning:", purchErr);
    }

    // 3. Aktualizacja istniejącego sklepu w tabeli stores (BEZWZGLĘDNY UPDATE, BRAK INSERTU)
    const prevThemeConfig = currentStore?.theme_config || {};
    const updatedThemeConfig = {
      ...prevThemeConfig,
      expires_at: newExpiresAt,
    };

    await dbAdmin
      .from("stores")
      .update({
        plan_type: rawPlanName,
        plan_status: "active",
        status: "active",
        is_active: true,
        theme_config: updatedThemeConfig,
      })
      .or(`id.eq.${tenantId},subdomain.eq.${tenantId}`);

    // 4. Aktualizacja profilu użytkownika
    const profileUserId = metadata.userId || metadata.user_id || currentStore?.owner_id;
    if (profileUserId) {
      await dbAdmin
        .from("profiles")
        .update({
          plan: rawPlanName,
          account_status: "Active",
        })
        .eq("id", profileUserId);
    } else if (customerEmail) {
      await dbAdmin
        .from("profiles")
        .update({
          plan: rawPlanName,
          account_status: "Active",
        })
        .eq("email", customerEmail);
    }

    if (customerEmail && customerEmail.includes("@")) {
      const amountFormatted = `${(amountTotalCents / 100).toFixed(2).replace(".", ",")} zł`;
      const expiresAtFormatted = formatDatePL(new Date(newExpiresAt));
      sendPurchaseConfirmationEmail({
        to: customerEmail,
        planName: planNameFormatted,
        amountFormatted,
        expiresAtFormatted,
      }).catch(() => {});
    }

    return {
      success: true,
      verified: true,
      isPlan: true,
      plan: rawPlanName,
      planName: planNameFormatted,
      expiresAt: newExpiresAt,
      storeId: tenantId,
      storeName: currentStore?.name || `Sklep ${tenantId}`
    };
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
