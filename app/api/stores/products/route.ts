import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabase } from "@/lib/supabase";

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const storeId = searchParams.get("storeId") || searchParams.get("store_id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Brak ID produktu do usunięcia." }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: true, message: "Usunięto ze stanu lokalnego." });
    }

    let query = dbClient.from("products").delete().eq("id", id);
    if (storeId) {
      query = query.eq("store_id", storeId);
    }

    const { error } = await query;
    if (error) {
      console.warn("[API /api/stores/products DELETE Error]:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    try {
      revalidatePath("/dashboard");
      revalidatePath("/[subdomain]", "page");
    } catch {}

    return NextResponse.json({ success: true, message: "Produkt został pomyślnie usunięty z bazy." });
  } catch (err: any) {
    console.error("[API /api/stores/products DELETE Exception]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, storeId, subdomain } = body;

    console.log("[API /api/stores/products POST] DODAWANIE PRODUKTU DANE:", { product, storeId, subdomain });

    if (!product || (!storeId && !subdomain)) {
      console.warn("[API /api/stores/products POST] Brak wymaganych danych:", { product, storeId, subdomain });
      return NextResponse.json({ success: false, error: "Brak danych produktu lub ID sklepu." }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      console.warn("[API /api/stores/products POST] Brak klienta Supabase, zwracam dane lokalne.");
      return NextResponse.json({ success: true, product });
    }

    // Bezpieczna resolucja rzeczywistego store_id z tabeli stores w Supabase
    let resolvedStoreId = storeId;
    const lookupKey = subdomain || storeId;

    if (lookupKey) {
      const { data: foundStores } = await dbClient
        .from("stores")
        .select("id, subdomain")
        .or(`id.eq.${lookupKey},subdomain.eq.${lookupKey}`)
        .limit(1);

      if (foundStores && foundStores.length > 0) {
        resolvedStoreId = foundStores[0].id;
      }
    }

    const cleanPrice = String(product.price || "").replace(",", ".").replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(cleanPrice) || 0;
    const priceCents = product.priceCents !== undefined ? product.priceCents : Math.round(priceNum * 100);

    const rawImages = product.images || product.image || product.imageUrl || product.image_url;
    let safeImageList: string[] = [];
    if (Array.isArray(rawImages)) {
      safeImageList = rawImages.filter((img: any): img is string => typeof img === "string" && img.trim().length > 0);
    } else if (typeof rawImages === "string" && rawImages.trim().length > 0) {
      safeImageList = [rawImages.trim()];
    }

    const isDigital = Boolean(product.isDigital || product.type === "Cyfrowy" || product.type === "DIGITAL");
    const stockVal = isDigital ? 999999 : (product.stock !== undefined ? parseInt(String(product.stock)) || 0 : 50);

    const prodPayload = {
      id: product.id || `prod_${Date.now()}`,
      store_id: resolvedStoreId,
      name: product.name || "Bez nazwy",
      description: product.description || "",
      price: product.price || `${priceNum.toFixed(2)} PLN`,
      price_cents: priceCents,
      compare_price: product.comparePrice || null,
      compare_price_cents: product.comparePriceCents || null,
      type: product.type || (isDigital ? "Cyfrowy" : "Fizyczny"),
      status: product.status || "Aktywny",
      is_active: product.status !== "Nieaktywny" && product.status !== "Szkic",
      stock: stockVal,
      image_url: safeImageList[0] || null,
      images: safeImageList,
      is_digital: isDigital,
      digital_file_name: product.digitalFileName || null,
      digital_file_size: product.digitalFileSize || null,
      digital_file_url: product.digitalFileUrl || null,
      is_drop_only: Boolean(product.isDropOnly),
      drop_target_date: product.dropTargetDate || null,
      variants: Array.isArray(product.variants) ? product.variants : [],
    };

    console.log("[API /api/stores/products POST] Zapis do bazy Supabase:", prodPayload);
    const { data, error } = await dbClient.from("products").upsert(prodPayload, { onConflict: "id" }).select();
    
    if (error) {
      console.error("[API /api/stores/products POST Error]:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log("[API /api/stores/products POST Sukces]: Produkt zapisany w bazie.", data?.[0] || prodPayload);

    try {
      revalidatePath("/dashboard");
      revalidatePath("/[subdomain]", "page");
    } catch {}

    return NextResponse.json({ success: true, product: data ? data[0] : prodPayload });
  } catch (err: any) {
    console.error("[API /api/stores/products POST Exception]:", err);
    return NextResponse.json({ success: false, error: err.message || "Błąd zapisu produktu" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId") || searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json({ success: false, error: "Brak storeId." }, { status: 400 });
    }

    const dbClient: any = supabaseAdmin || supabase;
    if (!dbClient) {
      return NextResponse.json({ success: true, products: [] });
    }

    const { data, error } = await dbClient.from("products").select("*").eq("store_id", storeId);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, products: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Błąd serwera" }, { status: 500 });
  }
}
