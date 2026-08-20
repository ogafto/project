import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin, supabase } from "@/lib/supabase";
import { sendPurchaseConfirmationEmail } from "@/lib/email";

const formatDatePL = (date: Date) => {
  const monthsPL = [
    "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
    "lipca", "sierpnia", "września", "października", "listopada", "grudnia"
  ];
  return `${date.getDate()} ${monthsPL[date.getMonth()]} ${date.getFullYear()}`;
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

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

  const dbAdmin: any = supabaseAdmin || supabase;

  // Handle checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata || {};

    const tenantId = metadata.tenant_id;
    const productId = metadata.product_id;
    const isPlan = metadata.type === "plan" || Boolean(metadata.plan_type);
    const rawPlanName = metadata.plan_type || "Creator";
    const planNameFormatted = rawPlanName.toLowerCase().startsWith("pakiet") ? rawPlanName : `Pakiet ${rawPlanName}`;
    const amountTotalCents = session.amount_total || Number(metadata.amount_cents || 2999);
    const customerEmail = session.customer_details?.email || metadata.customer_email || session.customer_email;
    const paymentStatus = session.payment_status === "paid" ? "paid" : "pending";

    console.log(`[Stripe Webhook] ${isPlan ? "SaaS Plan Subscription" : "Product Payment"} received: ${amountTotalCents} cents for tenant: ${tenantId}`);

    if (dbAdmin && tenantId) {
      try {
        if (isPlan) {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() + 30); // 30 dni ważności subskrypcji

          // 1. Create/update subscription record
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

          // 2. Update store in stores table
          await dbAdmin
            .from("stores")
            .update({
              plan_type: rawPlanName,
              plan_status: "active",
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", tenantId);

          console.log(`[Stripe Webhook] Successfully activated SaaS Plan [${rawPlanName}] for store ID: ${tenantId}`);

          // 3. Wysyłanie e-maila transakcyjnego z potwierdzeniem zakupu przez Resend
          if (customerEmail) {
            const amountFormatted = `${(amountTotalCents / 100).toFixed(2).replace(".", ",")} zł`;
            const expiresAtFormatted = formatDatePL(expirationDate);

            sendPurchaseConfirmationEmail({
              to: customerEmail,
              planName: planNameFormatted,
              amountFormatted,
              expiresAtFormatted,
            }).catch((emailErr) => console.error("[Stripe Webhook Email Error]:", emailErr));
          }
        } else {
          // 1. Create order in orders table
          await dbAdmin.from("orders").insert({
            tenant_id: tenantId,
            stripe_session_id: session.id,
            amount_total_cents: amountTotalCents,
            status: paymentStatus,
            customer_email: customerEmail,
            created_at: new Date().toISOString(),
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

          // 3. Increment store balance_cents
          const { data: storeData } = await dbAdmin
            .from("stores")
            .select("balance_cents")
            .eq("id", tenantId)
            .single();

          const currentBalance = storeData?.balance_cents || 0;
          await dbAdmin
            .from("stores")
            .update({ balance_cents: currentBalance + amountTotalCents })
            .eq("id", tenantId);
        }
      } catch (dbErr) {
        console.error("Supabase webhook update error:", dbErr);
      }
    }
  }

  // Handle subscription creation / update events
  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as any;
    const customerId = subscription.customer;
    const status = subscription.status;

    console.log(`[Stripe Webhook] Subscription update: customer ${customerId}, status ${status}`);

    if (dbAdmin && customerId) {
      try {
        await dbAdmin
          .from("subscriptions")
          .update({
            status: status === "active" ? "active" : "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);
      } catch (dbErr) {
        console.error("Supabase subscription webhook error:", dbErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
