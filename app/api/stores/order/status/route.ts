import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, supabase } from "@/lib/supabase";
import { sendOrderShippedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, status, storeId, storeName } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: "Brak orderId lub statusu." }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    let order: any = null;

    if (dbClient) {
      // 1. Update order status in Supabase orders table
      const { data: updatedOrders, error: updateErr } = await dbClient
        .from("orders")
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select();

      if (updateErr) {
        console.warn("[API /api/stores/order/status Error]:", updateErr.message);
      } else if (updatedOrders && updatedOrders.length > 0) {
        order = updatedOrders[0];
      }
    }

    // 2. If status changed to "shipped" / "Wysłane", trigger transactional email
    const isShipped = String(status).toLowerCase() === "shipped" || String(status).toLowerCase() === "wysłane";
    
    if (isShipped) {
      const recipientEmail = body.customerEmail || order?.customer_email;
      const resolvedStoreName = storeName || body.store_name || "IskraL Sklep";
      const items = body.items || order?.items || [];
      const shippingDetails = body.shippingDetails || order?.shipping_details || {};
      const paczkomatCode = body.paczkomatCode || order?.inpost_box || shippingDetails?.paczkomat;
      const shippingAddress = body.shippingAddress || order?.shipping_address || shippingDetails?.address;
      const shippingMethod = body.shippingType || shippingDetails?.method || (paczkomatCode ? "Paczkomat InPost" : "Przesyłka kurierska");

      if (recipientEmail) {
        try {
          await sendOrderShippedEmail({
            to: recipientEmail,
            storeName: resolvedStoreName,
            orderId: orderId,
            productTitle: body.productTitle || order?.product_title,
            items: Array.isArray(items) ? items : [],
            shippingMethod,
            paczkomatCode,
            shippingAddress,
          });
          console.log(`[Order Status] Wysłano e-mail z powiadomieniem o wysyłce na ${recipientEmail}`);
        } catch (emailErr) {
          console.error("[Order Status Email Exception]:", emailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Status zamówienia został zaktualizowany na '${status}'.`,
      orderId,
      status,
    });
  } catch (err: any) {
    console.error("[API /api/stores/order/status Exception]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
