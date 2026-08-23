import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      productId,
      title,
      priceCents,
      customerEmail,
      isPlan,
      planType,
      billingCycle,
      action,
      packageId,
    } = body;

    const origin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:3000";
    const cleanOrigin = origin.replace(/\/$/, "");

    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "iskral.pl").toLowerCase().trim();
    const isLocal = !process.env.NODE_ENV || process.env.NODE_ENV === "development" || cleanOrigin.includes("localhost") || cleanOrigin.includes("127.0.0.1");
    const rootDashboardOrigin = isLocal ? "http://localhost:3000" : `https://${rootDomain}`;

    const lineItems = [
      {
        price_data: {
          currency: "pln",
          product_data: {
            name: title || (isPlan ? `Pakiet SaaS ${planType}` : "Produkt"),
            description: isPlan
              ? `Subskrypcja pakietu ${planType} (${billingCycle || "miesiac"})`
              : `Zakup ze sklepu ID: ${tenantId}`,
          },
          unit_amount: priceCents || 1000,
        },
        quantity: body.quantity ? Math.max(1, parseInt(String(body.quantity), 10)) : 1,
      },
    ];

    let successUrl: string;
    let cancelUrl: string;

    if (isPlan) {
      // 1. ZAKUP PAKIETU / SUBSKRYPCJI SAAS -> ZAWSZE KIERUJE NA GŁÓWNĄ DOMENĘ /dashboard
      const successQuery = new URLSearchParams({
        checkout: "success",
        action: action || "buy",
        package_id: packageId || "",
        plan: planType || "Creator",
        billing: billingCycle || "miesiac",
      });
      successUrl = `${rootDashboardOrigin}/dashboard?${successQuery.toString()}&session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${rootDashboardOrigin}/dashboard?checkout=cancelled`;
    } else {
      // 2. ZAKUP PRODUKTU W SKLEPIE NA SUBDOMENIE -> ZAWSZE NA STRONĘ DANEGO SKLEPU Z POTWIERDZENIEM
      successUrl = `${cleanOrigin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}&product_id=${productId || ""}`;
      cancelUrl = `${cleanOrigin}/?checkout=cancelled`;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenant_id: tenantId || "demo-tenant",
        store_id: tenantId || "demo-tenant",
        product_id: productId || "demo-product",
        type: isPlan ? "plan" : "product",
        plan_type: planType || "",
        action: action || "buy",
        package_id: packageId || "",
        customer_email: customerEmail || "",
        amount_cents: String(priceCents || 1000),
        title: title || "",
        quantity: String(body.quantity || 1),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
