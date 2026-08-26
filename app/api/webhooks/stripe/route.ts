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
    let rawStoreId = session.client_reference_id || metadata.storeId || metadata.store_id || metadata.tenantId || metadata.tenant_id;
    const productId = metadata.product_id || metadata.productId;
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

      if ((!resolvedStoreId || resolvedStoreId === "demo-tenant" || resolvedStoreId === "empty_store") && (metadata.type === "plan" || metadata.type === "plan_purchase" || metadata.type === "plan_renewal" || metadata.plan_type || metadata.planType)) {
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

    console.log('=== PROCES ZAKUPU (Stripe Webhook) ===');
    console.log('ID PRODUKTU:', productId);
    console.log('STORE ID Z PRODUKTU:', rawStoreId);
    console.log('STORE ID AKTYWNEGO SKLEPU:', resolvedStoreId);
    console.log('TWORZENIE REKORDU ZAMÓWIENIA DLA STORE_ID:', tenantId);
    const quantity = Math.max(1, parseInt(metadata.quantity || "1", 10) || 1);
    const isPlan =
      metadata.type === "plan" ||
      metadata.type === "plan_purchase" ||
      metadata.type === "plan_renewal" ||
      Boolean(metadata.plan_type) ||
      Boolean(metadata.planType) ||
      Boolean(metadata.planName);
    const rawPlanName = metadata.plan_type || metadata.planType || metadata.planName || "Creator";
    const planNameFormatted = rawPlanName.toLowerCase().startsWith("pakiet") ? rawPlanName : `Pakiet ${rawPlanName}`;
    const amountTotalCents = session.amount_total || Number(metadata.amount_cents || 2999);
    const customerEmail = session.customer_details?.email || metadata.customer_email || metadata.customerEmail || session.customer_email || "klient@iskral.pl";
    const paymentStatus = isPlan ? "active" : "Niewysłane";
    const productTitle = metadata.title || metadata.product_title || (isPlan ? planNameFormatted : "Zamówienie w sklepie");
    const planDurationDays = parseInt(metadata.planDurationDays || metadata.plan_duration_days || "30", 10) || 30;

    console.log(`[Stripe Webhook] ${isPlan ? "SaaS Plan Subscription" : "Product Payment"} received: ${amountTotalCents} cents for store: ${tenantId}`);

    if (dbAdmin && tenantId) {
      try {
        if (isPlan) {
          // Pobierz obecny stan sklepu w celu obliczenia przedłużenia ważności
          const { data: currentStore } = await dbAdmin
            .from("stores")
            .select("id, name, theme_config, owner_id")
            .or(`id.eq.${tenantId},subdomain.eq.${tenantId}`)
            .maybeSingle();

          const currentExpiry = currentStore?.theme_config?.expires_at ? new Date(currentStore.theme_config.expires_at).getTime() : Date.now();
          const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
          const newExpiresAt = new Date(baseTime + planDurationDays * 24 * 60 * 60 * 1000).toISOString();

          // 1. Zapis/aktualizacja subskrypcji w tabeli subscriptions
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

          // 2. Zapis do historii transakcji platform_purchases
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
            console.warn("[Stripe Webhook] platform_purchases record warning:", purchErr);
          }

          // 3. Aktualizacja sklepu w tabeli stores (BEZWZGLĘDNY UPDATE, BRAK INSERTU)
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

          // 4. Aktualizacja profilu użytkownika w tabeli profiles
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

          console.log(`[Stripe Webhook] Successfully activated SaaS Plan [${planNameFormatted}] for store ID: ${tenantId}, expires: ${newExpiresAt}`);

          // 5. Wysyłanie e-maila transakcyjnego z potwierdzeniem zakupu przez Resend
          if (customerEmail) {
            const amountFormatted = `${(amountTotalCents / 100).toFixed(2).replace(".", ",")} zł`;
            const expiresAtFormatted = formatDatePL(new Date(newExpiresAt));

            sendPurchaseConfirmationEmail({
              to: customerEmail,
              planName: planNameFormatted,
              amountFormatted,
              expiresAtFormatted,
            }).catch((emailErr) => console.error("[Stripe Webhook Email Error]:", emailErr));
          }
        } else {
          // Check if order already recorded via callback or duplicate webhook
          const { data: existingOrders } = await dbAdmin
            .from("orders")
            .select("id")
            .eq("stripe_session_id", session.id)
            .limit(1);

          if (existingOrders && existingOrders.length > 0) {
            console.log(`[Stripe Webhook] Order for session ${session.id} already exists (ID: ${existingOrders[0].id}). Skipping duplicate.`);
            return NextResponse.json({ received: true, message: "Order already recorded" });
          }

          // 1. Create order in orders table
          const customerName = metadata.customer_name || metadata.customerName || session.customer_details?.name || "";
          const customerPhone = metadata.customer_phone || metadata.customerPhone || session.customer_details?.phone || "";
          const shippingType = metadata.shipping_type || metadata.shippingType || (metadata.paczkomat_code || metadata.paczkomatCode ? "paczkomat" : metadata.shipping_address || metadata.shippingAddress ? "courier" : "digital");
          const paczkomatCode = metadata.paczkomat_code || metadata.paczkomatCode || "";
          const shippingAddress = metadata.shipping_address || metadata.shippingAddress || "";
          const selectedVariant = metadata.selected_variant || metadata.selectedVariant || "";

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
