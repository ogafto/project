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
    } = body;

    const origin = req.headers.get("origin") || "http://localhost:3000";

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
        quantity: 1,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail || undefined,
      success_url: `${origin}/dashboard?checkout=success&plan=${encodeURIComponent(planType || "Creator")}&billing=${encodeURIComponent(billingCycle || "miesiac")}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      metadata: {
        tenant_id: tenantId || "demo-tenant",
        product_id: productId || "demo-product",
        type: isPlan ? "plan" : "product",
        plan_type: planType || "",
        customer_email: customerEmail || "",
        amount_cents: String(priceCents || 1000),
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
