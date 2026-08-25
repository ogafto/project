import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    const isFormData =
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data");

    if (isFormData) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const {
      tenantId,
      storeId,
      productId,
      title,
      priceCents,
      customerEmail,
      customerName,
      customerPhone,
      shippingType,
      paczkomatCode,
      shippingAddress,
      selectedVariant,
      items,
      isPlan,
      planType,
      billingCycle,
      action,
      packageId,
    } = body;

    let resolvedTenantId = storeId || tenantId || "";

    const origin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
    const cleanOrigin = origin.replace(/\/$/, "");

    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "iskral.pl").toLowerCase().trim();
    const isLocal =
      !process.env.NODE_ENV ||
      process.env.NODE_ENV === "development" ||
      cleanOrigin.includes("localhost") ||
      cleanOrigin.includes("127.0.0.1");
    const rootDashboardOrigin = isLocal ? "http://localhost:3000" : `https://${rootDomain}`;

    let finalUnitAmountCents = Number(priceCents || 0);

    const dbClient: any = supabaseAdmin || supabase;
    if (dbClient) {
      try {
        // Resolve store ID from database if provided as subdomain or missing
        if (resolvedTenantId) {
          const { data: stRow } = await dbClient
            .from("stores")
            .select("id")
            .or(`id.eq.${resolvedTenantId},subdomain.eq.${resolvedTenantId}`)
            .maybeSingle();
          if (stRow?.id) {
            resolvedTenantId = stRow.id;
          }
        }

        // If it's a store product, lookup real price & store_id in Supabase to guarantee 100% price & store integrity
        if (!isPlan && productId) {
          const { data: dbProd } = await dbClient
            .from("products")
            .select("name, price, price_cents, store_id")
            .eq("id", productId)
            .maybeSingle();

          if (dbProd) {
            if (dbProd.store_id && (!resolvedTenantId || resolvedTenantId === "demo-tenant")) {
              resolvedTenantId = dbProd.store_id;
            }
            if (typeof dbProd.price_cents === "number" && dbProd.price_cents > 0) {
              finalUnitAmountCents = dbProd.price_cents;
            } else if (dbProd.price) {
              const numeric = parseFloat(
                String(dbProd.price)
                  .replace(/[^0-9.,]/g, "")
                  .replace(",", ".")
              );
              if (!isNaN(numeric) && numeric > 0) {
                finalUnitAmountCents = Math.round(numeric * 100);
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("[Checkout API] Store and product lookup warning:", dbErr);
      }
    }

    if (!finalUnitAmountCents || finalUnitAmountCents <= 0) {
      finalUnitAmountCents = Number(priceCents) || 24900;
    }

    const lineItems = [
      {
        price_data: {
          currency: "pln",
          product_data: {
            name: title || (isPlan ? `Pakiet SaaS ${planType}` : "Produkt"),
            description: isPlan
              ? `Subskrypcja pakietu ${planType} (${billingCycle || "miesiac"})`
              : `Zakup ze sklepu ID: ${resolvedTenantId}`,
          },
          unit_amount: finalUnitAmountCents,
        },
        quantity: body.quantity ? Math.max(1, parseInt(String(body.quantity), 10)) : 1,
      },
    ];

    let successUrl: string;
    let cancelUrl: string;

    const planId = planType || "Creator";
    const planNameFormatted = planId.toLowerCase().startsWith("pakiet") ? planId : `Pakiet ${planId}`;
    const isRenewal = action === "extend" || action === "renew";

    if (isPlan) {
      // 1. ZAKUP / PRZEDŁUŻENIE PAKIETU SAAS -> ZAWSZE KIERUJE DO DASHBOARDU Z PARAMETREM SUKCESU
      successUrl = `${origin}/dashboard?payment=success&plan=${encodeURIComponent(planId)}&session_id={CHECKOUT_SESSION_ID}&action=${action || "buy"}`;
      cancelUrl = `${origin}/dashboard/store?payment=cancelled`;
    } else {
      // 2. ZAKUP PRODUKTU W SKLEPIE NA SUBDOMENIE -> ZAWSZE NA STRONĘ DANEGO SKLEPU Z POTWIERDZENIEM
      successUrl = `${cleanOrigin}/?checkout=success&payment=success&session_id={CHECKOUT_SESSION_ID}&product_id=${productId || ""}`;
      cancelUrl = `${cleanOrigin}/?checkout=cancelled`;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      client_reference_id: String(resolvedTenantId || "demo-tenant"),
      customer_email: customerEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: String(body.userId || body.user_id || customerEmail || ""),
        user_id: String(body.userId || body.user_id || customerEmail || ""),
        storeId: String(resolvedTenantId || ""),
        store_id: String(resolvedTenantId || ""),
        tenantId: String(resolvedTenantId || ""),
        tenant_id: String(resolvedTenantId || ""),
        planName: planNameFormatted,
        plan_name: planNameFormatted,
        planDurationDays: "30",
        plan_duration_days: "30",
        type: isPlan ? (isRenewal ? "plan_renewal" : "plan_purchase") : "product",
        productId: String(productId || "demo-product"),
        product_id: String(productId || "demo-product"),
        plan_type: planId,
        planType: planId,
        action: action || "buy",
        package_id: packageId || "",
        packageId: packageId || "",
        billingCycle: billingCycle || "miesiac",
        billing_cycle: billingCycle || "miesiac",
        customerEmail: customerEmail || "",
        customer_email: customerEmail || "",
        customerName: customerName || "",
        customer_name: customerName || "",
        customerPhone: customerPhone || "",
        customer_phone: customerPhone || "",
        shippingType: shippingType || "",
        shipping_type: shippingType || "",
        paczkomatCode: paczkomatCode || "",
        paczkomat_code: paczkomatCode || "",
        shippingAddress: shippingAddress || "",
        shipping_address: shippingAddress || "",
        selected_variant: selectedVariant || "",
        amount_cents: String(finalUnitAmountCents),
        title: title || "",
        quantity: String(body.quantity || 1),
      },
    });

    if (isFormData && session.url) {
      return NextResponse.redirect(session.url, 303);
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
