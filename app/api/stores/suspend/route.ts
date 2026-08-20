import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendStoreSuspendedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeId, subdomain, ownerEmail, storeName } = body;

    if (!storeId && !subdomain && !ownerEmail) {
      return NextResponse.json(
        { success: false, error: "Brak id sklepu, subdomeny lub adresu email." },
        { status: 400 }
      );
    }

    let targetStoreName = storeName || "Sklep";
    let targetSubdomain = subdomain || "sklep";
    let targetEmail = ownerEmail || "";

    const dbClient: any = supabaseAdmin || supabase;

    if (isSupabaseConfigured && dbClient) {
      try {
        // Find store by storeId or subdomain
        let query = dbClient.from("stores").select("*, profiles:owner_id(email)");
        if (storeId) {
          query = query.eq("id", storeId);
        } else if (subdomain) {
          query = query.eq("subdomain", subdomain);
        }

        const { data: storeData } = await query.maybeSingle();

        if (storeData) {
          targetStoreName = storeData.name || targetStoreName;
          targetSubdomain = storeData.subdomain || targetSubdomain;
          targetEmail = storeData.profiles?.email || targetEmail || storeData.owner_email;

          // Update store status to suspended
          await dbClient
            .from("stores")
            .update({
              status: "suspended",
              plan_status: "suspended",
              updated_at: new Date().toISOString(),
            })
            .eq("id", storeData.id);
        }
      } catch (dbErr) {
        console.warn("[API /stores/suspend DB warning]:", dbErr);
      }
    }

    if (!targetEmail) {
      console.warn(`[API /stores/suspend Warning] Nie znaleziono e-maila właściciela dla sklepu: ${targetStoreName}`);
      return NextResponse.json({
        success: true,
        message: "Status sklepu zmieniony na suspended, ale brak adresu e-mail do wysyłki powiadomienia.",
      });
    }

    // Wysyłanie e-maila powiadamiającego o zawieszeniu sklepu przez Resend
    const emailResult = await sendStoreSuspendedEmail({
      to: targetEmail,
      storeName: targetStoreName,
      subdomain: targetSubdomain,
    });

    if (!emailResult.success) {
      console.error(`[API /stores/suspend Email Error]: ${emailResult.error}`);
    }

    return NextResponse.json({
      success: true,
      message: `Sklep ${targetStoreName} został zawieszony, a powiadomienie e-mail wysłano na ${targetEmail}.`,
      emailResult,
    });
  } catch (error: any) {
    console.error("[API /stores/suspend Exception]:", error);
    return NextResponse.json(
      { success: false, error: `Wyjątek podczas zawieszania sklepu: ${error.message || error}` },
      { status: 500 }
    );
  }
}
