import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Demo / Test mode fallback parsing without secret verification
      event = JSON.parse(body);
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata || {};

    const tenantId = metadata.tenant_id;
    const productId = metadata.product_id;
    const amountTotalCents = session.amount_total || Number(metadata.amount_cents || 0);
    const customerEmail = session.customer_details?.email || metadata.customer_email || "klient@example.com";
    const paymentStatus = session.payment_status === "paid" ? "paid" : "pending";

    console.log(`[Stripe Webhook] Payment received: ${amountTotalCents} cents for tenant: ${tenantId}`);

    const dbAdmin: any = supabaseAdmin;
    if (dbAdmin && tenantId) {
      try {
        // 1. Create order in orders table
        await dbAdmin.from("orders").insert({
          tenant_id: tenantId,
          stripe_session_id: session.id,
          amount_total_cents: amountTotalCents,
          status: paymentStatus,
          customer_email: customerEmail,
        });

        // 2. Decrement stock if product order
        if (productId && metadata.type === "product") {
          const { data: prod } = await dbAdmin
            .from("products")
            .select("stock")
            .eq("id", productId)
            .single();

          if (prod && prod.stock > 0) {
            await dbAdmin
              .from("products")
              .update({ stock: prod.stock - 1 })
              .eq("id", productId);
          }
        }

        // 3. Increment tenant balance_cents
        const { data: tenantData } = await dbAdmin
          .from("tenants")
          .select("balance_cents")
          .eq("id", tenantId)
          .single();

        const currentBalance = tenantData?.balance_cents || 0;
        await dbAdmin
          .from("tenants")
          .update({ balance_cents: currentBalance + amountTotalCents })
          .eq("id", tenantId);

      } catch (dbErr) {
        console.error("Supabase webhook update error:", dbErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
