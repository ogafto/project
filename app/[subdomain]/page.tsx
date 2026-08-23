import React from "react";
import Link from "next/link";
import { fetchStoreFromSupabase, fetchProductsFromSupabase } from "@/lib/supabase";
import { StoreClientView, SafeStore, SafeProduct } from "./StoreClientView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SubdomainPageProps {
  params: Promise<{ subdomain: string }> | { subdomain: string };
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

export default async function SubdomainPage({ params }: SubdomainPageProps) {
  let rawSub = "";
  try {
    const resolvedParams = await params;
    rawSub = resolvedParams?.subdomain || "";
  } catch {
    rawSub = "";
  }

  const cleanSub = decodeURIComponent(rawSub || "").toLowerCase().trim();

  let dbStore: any = null;
  let dbProducts: any[] = [];

  if (cleanSub) {
    try {
      dbStore = await fetchStoreFromSupabase(cleanSub);
      if (dbStore?.id) {
        dbProducts = (await fetchProductsFromSupabase(dbStore.id)) || [];
      }
    } catch (err) {
      console.warn(`[Subdomain Server Fetch Error for ${cleanSub}]:`, err);
    }
  }

  // Not found fallback screen
  if (!dbStore) {
    return (
      <div className="min-h-screen bg-[#0E0E11] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-[#14151A] border border-white/10 flex items-center justify-center text-3xl mb-4 shadow-xl">
          🏪
        </div>
        <h1 className="text-2xl font-bold font-['Sora',sans-serif]">Sklep nie został jeszcze aktywowany</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-md font-['Poppins',sans-serif]">
          Subdomena <strong className="text-[#D0FF00] font-mono">{cleanSub || "twoj-sklep"}</strong> oczekuje na dokończenie konfiguracji w panelu użytkownika.
        </p>
        <div className="mt-6 flex items-center gap-3 font-['Poppins',sans-serif]">
          <Link
            href="https://iskral.pl/dashboard"
            className="px-6 py-3 bg-[#D0FF00] hover:bg-[#bce600] text-black text-xs font-bold rounded-xl transition shadow-lg"
          >
            Przejdź do Panelu Klienta
          </Link>
        </div>
      </div>
    );
  }

  // Suspended or deactivated store screen
  const isStoreActive =
    dbStore.is_active !== false &&
    dbStore.status !== "deleted" &&
    dbStore.status !== "canceled" &&
    dbStore.plan_status !== "canceled" &&
    dbStore.plan_status !== "suspended";

  if (!isStoreActive) {
    return (
      <div className="min-h-screen bg-[#0E0E11] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans">
        <div className="relative z-10 max-w-md w-full text-center space-y-6 bg-[#14151A] border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-2xl font-extrabold mb-2">
            ⏸️
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight font-['Sora',sans-serif]">
            Ten sklep jest chwilowo niedostępny
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed font-['Poppins',sans-serif]">
            Okres rozliczeniowy lub darmowy trial tego sklepu dobiegł końca. Subdomena pozostaje zarezerwowana dla właściciela.
          </p>
          <div className="pt-2 flex flex-col gap-3 font-['Poppins',sans-serif]">
            <a
              href="https://iskral.pl/logowanie"
              className="w-full py-3.5 px-6 rounded-xl bg-[#D0FF00] hover:bg-[#bce600] text-black font-semibold text-xs transition shadow-lg flex items-center justify-center gap-2 text-center"
            >
              Właścicielu? Zaloguj się i opłać pakiet
            </a>
            <a
              href="https://iskral.pl"
              className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-medium text-xs hover:bg-white/10 transition flex items-center justify-center text-center"
            >
              Strona główna platformy
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Map products safely
  const safeProducts: SafeProduct[] = Array.isArray(dbProducts)
    ? dbProducts.map((p: any) => {
        const isDig = Boolean(p?.is_digital || p?.type === "Cyfrowy");
        const hasClothing = Boolean(
          p?.is_clothing ||
            (Array.isArray(p?.variants) &&
              p.variants.some((v: string) => ["XS", "S", "M", "L", "XL", "XXL"].includes(String(v).split(" ")[0])))
        );

        let safeImgs: string[] = [];
        if (Array.isArray(p?.images)) {
          safeImgs = p.images.filter((img: any): img is string => typeof img === "string" && img.trim().length > 0);
        } else if (typeof p?.images === "string" && p.images.trim().length > 0) {
          try {
            const parsed = JSON.parse(p.images);
            if (Array.isArray(parsed)) {
              safeImgs = parsed.filter((img: any): img is string => typeof img === "string" && img.trim().length > 0);
            } else {
              safeImgs = [p.images.trim()];
            }
          } catch {
            safeImgs = [p.images.trim()];
          }
        }
        if (safeImgs.length === 0 && p?.image_url) {
          safeImgs = [p.image_url];
        }

        return {
          id: String(p?.id || `p_${Date.now()}`),
          name: String(p?.name || "Produkt"),
          description: String(p?.description || ""),
          price: String(p?.price || `${(((p?.price_cents ?? 0) / 100) || 0).toFixed(2)} PLN`),
          priceCents: typeof p?.price_cents === "number" ? p.price_cents : 0,
          comparePrice: p?.compare_price || undefined,
          comparePriceCents: p?.compare_price_cents || undefined,
          type: isDig ? "Cyfrowy" : "Fizyczny",
          status: p?.status === "Nieaktywny" || p?.status === "Zawieszony" ? "Zawieszony" : "Aktywny",
          stock: typeof p?.stock === "number" ? Math.max(0, p.stock) : (isDig ? 999 : 50),
          sales: typeof p?.sales === "number" ? p.sales : 0,
          isClothing: !isDig && hasClothing,
          variants: !isDig && hasClothing && Array.isArray(p?.variants) ? p.variants : [],
          image: safeImgs[0] || "",
          imageUrl: safeImgs[0] || "",
          images: safeImgs,
          isDigital: isDig,
          digitalFileName: p?.digital_file_name || undefined,
          digitalFileSize: p?.digital_file_size || undefined,
          digitalFileUrl: p?.digital_file_url || undefined,
          isDropOnly: Boolean(p?.is_drop_only),
          dropTargetDate: p?.drop_target_date || undefined,
        };
      })
    : [];

  const safeStore: SafeStore = {
    id: dbStore.id || cleanSub,
    name: dbStore.name || `Sklep ${cleanSub}`,
    subdomain: dbStore.subdomain || cleanSub,
    customDomain: dbStore.custom_domain || "",
    logoUrl: dbStore.logo_url || "",
    description: dbStore.description || "",
    announcement: dbStore.announcement || "",
    niche: dbStore.niche || "Sklep Internetowy",
    template: dbStore.template || "Dark Vibe",
    accentColor: dbStore.accent_color || "#D0FF00",
    planType: dbStore.plan_type || "Start",
    planStatus: dbStore.plan_status || "active",
    status: dbStore.status || "active",
    socials: typeof dbStore.social_links === "object" && dbStore.social_links !== null ? dbStore.social_links : {},
    dropConfig:
      typeof dbStore.drop_config === "object" && dbStore.drop_config !== null
        ? dbStore.drop_config
        : { enabled: false, template: "Cyberpunk Launch", targetDate: "" },
    products: safeProducts,
  };

  return <StoreClientView store={safeStore} initialProducts={safeProducts} />;
}
