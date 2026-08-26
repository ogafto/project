import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || searchParams.get("user_id");
    const email = searchParams.get("email");
    const storeId = searchParams.get("storeId") || searchParams.get("store_id");

    const cleanEmail = (email || "").trim().toLowerCase();
    const dbClient: any = supabaseAdmin || supabase;

    let purchases: any[] = [];

    if (dbClient) {
      try {
        // 1. Sprawdź tabelę platform_purchases
        let query = dbClient.from("platform_purchases").select("*");
        if (userId && cleanEmail) {
          query = query.or(`user_id.eq.${userId},user_email.eq.${cleanEmail}${storeId ? `,store_id.eq.${storeId}` : ""}`);
        } else if (userId) {
          query = query.or(`user_id.eq.${userId}${storeId ? `,store_id.eq.${storeId}` : ""}`);
        } else if (cleanEmail) {
          query = query.or(`user_email.eq.${cleanEmail}${storeId ? `,store_id.eq.${storeId}` : ""}`);
        } else if (storeId) {
          query = query.eq("store_id", storeId);
        }

        const { data, error } = await query.order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          purchases = data;
        }
      } catch (err) {
        console.warn("[Purchases API] platform_purchases query warning:", err);
      }

      // 2. Jeśli brak rekordów w platform_purchases, sprawdź subscriptions
      if (purchases.length === 0) {
        try {
          let subQuery = dbClient.from("subscriptions").select("*");
          if (cleanEmail && storeId) {
            subQuery = subQuery.or(`user_email.eq.${cleanEmail},tenant_id.eq.${storeId}`);
          } else if (cleanEmail) {
            subQuery = subQuery.eq("user_email", cleanEmail);
          } else if (storeId) {
            subQuery = subQuery.eq("tenant_id", storeId);
          }
          const { data: subData, error: subErr } = await subQuery.order("created_at", { ascending: false });
          if (!subErr && subData && subData.length > 0) {
            // Filtrujemy tylko realne subskrypcje (usuwamy zduplikowane 0-kwotowe generacje)
            const realSubs = subData.filter((s: any) => s.tenant_id || s.stripe_customer_id || s.amount_paid_cents > 0);
            const targetSubs = realSubs.length > 0 ? [realSubs[0]] : [subData[0]]; // 1 aktywny zakup na 1 subskrypcję

            purchases = targetSubs.map((s: any) => {
              const rawPlan = s.plan_name || "Creator";
              const cleanPlan = rawPlan.replace(/^Pakiet\s+/i, "");
              const planPrice = cleanPlan === "Brand" ? 5999 : cleanPlan === "Start" ? 0 : 2999;
              return {
                id: s.id || `purch_${s.stripe_subscription_id || Date.now()}`,
                user_id: userId || null,
                user_email: s.user_email || cleanEmail,
                store_id: s.tenant_id || storeId || "store_1000",
                store_name: s.tenant_id ? `Sklep #${s.tenant_id.slice(-4)}` : "Twój Sklep",
                package_name: `Pakiet ${cleanPlan} (30 dni)`,
                plan_type: cleanPlan,
                amount_cents: s.amount_paid_cents > 0 ? s.amount_paid_cents : planPrice,
                currency: "PLN",
                stripe_payment_id: s.stripe_subscription_id || s.stripe_customer_id || `pi_${Math.random().toString(36).substring(2, 10)}`,
                stripe_receipt_url: null,
                status: "Opłacone",
                created_at: s.created_at || new Date().toISOString(),
              };
            });
          }
        } catch (subException) {
          console.warn("[Purchases API] subscriptions query warning:", subException);
        }
      }
    }

    return NextResponse.json({
      success: true,
      purchases,
    });
  } catch (err: any) {
    console.error("[Purchases API Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      userEmail,
      storeId,
      storeName,
      packageName,
      planType,
      amountCents,
      stripePaymentId,
      stripeReceiptUrl,
    } = body;

    const dbClient: any = supabaseAdmin || supabase;
    const cleanEmail = (userEmail || "").trim().toLowerCase();

    const recordPayload = {
      id: `purch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || null,
      user_email: cleanEmail,
      store_id: storeId || null,
      store_name: storeName || "Twój Sklep",
      package_name: packageName || `Pakiet ${planType || "Creator"} (30 dni)`,
      plan_type: planType || "Creator",
      amount_cents: amountCents || 4900,
      currency: "PLN",
      stripe_payment_id: stripePaymentId || `pi_${Date.now()}`,
      stripe_receipt_url: stripeReceiptUrl || null,
      status: "Opłacone",
      created_at: new Date().toISOString(),
    };

    if (dbClient) {
      try {
        await dbClient.from("platform_purchases").insert(recordPayload);
      } catch (err) {
        console.warn("[Purchases API] insert warning:", err);
      }
    }

    return NextResponse.json({
      success: true,
      purchase: recordPayload,
    });
  } catch (err: any) {
    console.error("[Purchases API POST Error]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
