import React from "react";
import { notFound } from "next/navigation";
import { fetchStoreFromSupabase, fetchProductsFromSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SubdomainStorePage(props: PageProps) {
  // 1. Prawidłowe asynchroniczne rozwiązanie parametrów Next.js 15/16
  const params = await props.params;
  const searchParams = await props.searchParams;
  const subdomain = params?.subdomain;

  if (!subdomain) {
    return notFound();
  }

  // 2. Bezpieczne pobranie sklepu z bazy
  let store: any = null;
  try {
    const cleanSub = decodeURIComponent(subdomain).toLowerCase().trim();
    store = await fetchStoreFromSupabase(cleanSub);
    if (store?.id) {
      const products = await fetchProductsFromSupabase(store.id);
      store.products = products || [];
    }
  } catch (err) {
    console.error("Błąd bazy danych na subdomenie:", err);
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[#0E0E11] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-2xl font-bold mb-2 font-['Sora',sans-serif]">Sklep nie został znaleziony</h1>
        <p className="text-zinc-400 text-sm font-['Poppins',sans-serif]">Sprawdź adres URL lub skonfiguruj sklep w panelu.</p>
      </div>
    );
  }

  const products = Array.isArray(store.products) ? store.products : [];
  const isPaymentSuccess = searchParams?.payment === "success" || searchParams?.checkout === "success";

  return (
    <div className="min-h-screen bg-[#0E0E11] text-zinc-100 p-6 md:p-12 font-sans selection:bg-[#FF5B28] selection:text-white">
      <div className="max-w-5xl mx-auto">
        {/* Baner sukcesu po zakupie */}
        {isPaymentSuccess && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm text-center font-['Poppins',sans-serif]">
            🎉 Płatność zakończona sukcesem! Twoje zamówienie zostało przekazane do realizacji.
          </div>
        )}

        {/* Header sklepu */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-['Sora',sans-serif]">
            {store.name || subdomain}
          </h1>
          {(store.description || store.bio) && (
            <p className="text-zinc-400 text-sm mt-2 max-w-md mx-auto font-['Poppins',sans-serif] leading-relaxed">
              {store.description || store.bio}
            </p>
          )}
        </header>

        {/* Lista produktów */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-['Poppins',sans-serif]">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-16 text-zinc-500 text-sm">
              Brak dostępnych produktów.
            </div>
          ) : (
            products.map((item: any) => {
              const isSoldOut = typeof item.stock === "number" && item.stock <= 0;
              const imgUrl =
                Array.isArray(item.images) && item.images.length > 0
                  ? item.images[0]
                  : typeof item.image === "string" && item.image.length > 0
                  ? item.image
                  : typeof item.image_url === "string" && item.image_url.length > 0
                  ? item.image_url
                  : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

              let parsedPriceCents = typeof item?.price_cents === "number" && item.price_cents > 0 ? item.price_cents : 0;
              if (parsedPriceCents === 0 && item?.price) {
                const num = parseFloat(
                  String(item.price)
                    .replace(/[^0-9.,]/g, "")
                    .replace(",", ".")
                );
                if (!isNaN(num) && num > 0) {
                  parsedPriceCents = Math.round(num * 100);
                }
              }

              const displayPrice =
                item.price && (String(item.price).includes("PLN") || String(item.price).includes("zł"))
                  ? item.price
                  : `${(((parsedPriceCents || item.price_cents || 0) / 100) || 0).toFixed(2)} PLN`;

              return (
                <div
                  key={item.id}
                  className="bg-[#141418] border border-white/10 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-white/20 transition-all"
                >
                  <div>
                    <div className="w-full h-48 bg-zinc-900 rounded-xl overflow-hidden mb-4 relative flex items-center justify-center">
                      <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                      {isSoldOut && (
                        <span className="absolute top-3 right-3 bg-red-500/90 text-white text-xs px-2.5 py-1 rounded-md font-bold backdrop-blur-sm">
                          Wyprzedane
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white text-lg font-['Sora',sans-serif]">{item.name}</h3>
                    <p className="text-zinc-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                      {item.description || ""}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xl font-bold text-white font-mono">{displayPrice}</span>
                    <form action="/api/checkout" method="POST">
                      <input type="hidden" name="productId" value={item.id} />
                      <input type="hidden" name="storeId" value={store.id} />
                      <input type="hidden" name="tenantId" value={store.id} />
                      <input
                        type="hidden"
                        name="priceCents"
                        value={String(parsedPriceCents || item.price_cents || "")}
                      />
                      <button
                        type="submit"
                        disabled={isSoldOut}
                        className="px-4 py-2 bg-[#FF5B28] hover:bg-[#e04f20] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        {isSoldOut ? "Brak na stanie" : "Kup teraz"}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
