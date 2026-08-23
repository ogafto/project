import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin, supabase } from "@/lib/supabase";
import { sendPurchaseConfirmationEmail, sendCustomerOrderConfirmationEmail } from "@/lib/email";

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

    const rawStoreId = metadata.store_id || metadata.storeId || metadata.tenant_id || metadata.tenantId;
    let resolvedStoreId = rawStoreId;

    if (dbAdmin && rawStoreId) {
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

    const tenantId = resolvedStoreId || rawStoreId;
    const productId = metadata.product_id || metadata.productId;
    const quantity = Math.max(1, parseInt(metadata.quantity || "1", 10) || 1);
    const isPlan = metadata.type === "plan" || Boolean(metadata.plan_type);
    const rawPlanName = metadata.plan_type || "Creator";
    const planNameFormatted = rawPlanName.toLowerCase().startsWith("pakiet") ? rawPlanName : `Pakiet ${rawPlanName}`;
    const amountTotalCents = session.amount_total || Number(metadata.amount_cents || 2999);
    const customerEmail = session.customer_details?.email || metadata.customer_email || session.customer_email || "klient@iskral.pl";
    const paymentStatus = session.payment_status === "paid" ? "paid" : "pending";
    const productTitle = metadata.title || metadata.product_title || (isPlan ? planNameFormatted : "Zamówienie w sklepie");

    console.log(`[Stripe Webhook] ${isPlan ? "SaaS Plan Subscription" : "Product Payment"} received: ${amountTotalCents} cents for store: ${tenantId}`);

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
            .or(`id.eq.${tenantId},subdomain.eq.${tenantId}`);

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
          const customerName = metadata.customer_name || session.customer_details?.name || "";
          const customerPhone = metadata.customer_phone || session.customer_details?.phone || "";
          const shippingType = metadata.shipping_type || (metadata.paczkomat_code ? "paczkomat" : metadata.shipping_address ? "courier" : "digital");
          const paczkomatCode = metadata.paczkomat_code || "";
          const shippingAddress = metadata.shipping_address || "";
          const selectedVariant = metadata.selected_variant || "";

          const shippingDetails = {
            method: shippingType,
            paczkomat: paczkomatCode || null,
            address: shippingAddress || null,
            name: customerName || null,
            phone: customerPhone || null,
            email: customerEmail,
          };

          const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await dbAdmin.from("orders").insert({
            id: orderId,
            store_id: tenantId,
            stripe_session_id: session.id,
            total_amount: (amountTotalCents / 100).toFixed(2),
            amount_total_cents: amountTotalCents,
            status: paymentStatus,
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
          });

          // 2. Decrement stock and increment sales for product
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
            } catch (stockErr) {
              console.warn("[Stripe Webhook] Stock update warning:", stockErr);
            }
          }

          // 3. Increment store balance_cents
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

            // Send order confirmation to customer
            if (customerEmail) {
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
                customerName: customerName || undefined
              }).catch((emailErr) => console.error("[Stripe Webhook Order Confirmation Email Error]:", emailErr));
            }
          } catch (balErr) {
            console.warn("[Stripe Webhook] Balance update warning:", balErr);
          }
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
