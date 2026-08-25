import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || searchParams.get("user_id");
    const email = searchParams.get("email");

    const cleanEmail = (email || "").trim().toLowerCase();
    const dbClient: any = supabaseAdmin || supabase;

    let purchases: any[] = [];

    if (dbClient) {
      try {
        // 1. Sprawdź tabelę platform_purchases
        let query = dbClient.from("platform_purchases").select("*");
        if (userId && cleanEmail) {
          query = query.or(`user_id.eq.${userId},user_email.eq.${cleanEmail}`);
        } else if (userId) {
          query = query.eq("user_id", userId);
        } else if (cleanEmail) {
          query = query.eq("user_email", cleanEmail);
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
          if (cleanEmail) {
            subQuery = subQuery.eq("user_email", cleanEmail);
          }
          const { data: subData, error: subErr } = await subQuery.order("created_at", { ascending: false });
          if (!subErr && subData && subData.length > 0) {
            purchases = subData.map((s: any) => ({
              id: s.id || `purch_${s.stripe_subscription_id || Date.now()}`,
              user_id: userId || null,
              user_email: s.user_email || cleanEmail,
              store_id: s.tenant_id,
              store_name: s.tenant_id ? `Sklep ${s.tenant_id}` : "Główny sklep",
              package_name: `Pakiet ${s.plan_name || "Creator"} (30 dni)`,
              plan_type: s.plan_name || "Creator",
              amount_cents: s.amount_paid_cents || 4900,
              currency: "PLN",
              stripe_payment_id: s.stripe_subscription_id || `pi_${Math.random().toString(36).substring(2, 10)}`,
              stripe_receipt_url: null,
              status: s.status === "active" ? "Opłacone" : s.status || "Opłacone",
              created_at: s.created_at || new Date().toISOString(),
            }));
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
