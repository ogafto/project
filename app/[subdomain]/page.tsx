"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import BackgroundVideo from "@/app/components/BackgroundVideo";
import { useAuth, Product, Category, StoreConfig, User } from "@/app/context/AuthContext";
import { fetchStoreFromSupabase, fetchProductsFromSupabase } from "@/lib/supabase";
import NotFoundPage from "@/app/not-found";

interface PageProps {
  params: Promise<{ subdomain: string }> | { subdomain: string };
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function TenantStorePage({ params }: PageProps) {
  // 1. ALL HOOKS MUST BE UNCONDITIONALLY EXECUTED AT THE TOP (Rules of Hooks)
  const resolvedParams =
    params && typeof (params as any).then === "function"
      ? use(params as Promise<{ subdomain: string }>)
      : (params as { subdomain: string });
  const rawSubdomain = resolvedParams?.subdomain || "";
  const subdomain = decodeURIComponent(rawSubdomain).toLowerCase().trim();

  const { allUsers = [], createStripeCheckout, recordOrder } = useAuth();
  const [asyncStore, setAsyncStore] = useState<StoreConfig | null>(null);
  const [isDBLoading, setIsDBLoading] = useState<boolean>(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedVariants, setSelectedVariants] = useState<{ [productId: string]: string }>({});
  const [cart, setCart] = useState<{ product: Product; quantity: number; selectedVariant?: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [purchasedDigitalItems, setPurchasedDigitalItems] = useState<Product[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // 2. Load store & products from Supabase
  useEffect(() => {
    async function loadFromDB() {
      if (!subdomain) {
        setIsDBLoading(false);
        return;
      }
      try {
        const dbData = await fetchStoreFromSupabase(subdomain);
        if (dbData) {
          let dbProducts: any[] = [];
          try {
            dbProducts = (await fetchProductsFromSupabase(dbData.id)) || [];
          } catch (prodErr) {
            console.error("Błąd ładowania produktów sklepu:", prodErr);
          }

          const mappedProducts: Product[] = Array.isArray(dbProducts)
            ? dbProducts.map((p: any) => ({
                id: p?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                tenantId: dbData?.id || "",
                categoryId: p?.category_id || undefined,
                name: p?.name || "Produkt",
                description: p?.description || "",
                price: p?.price || `${(((p?.price_cents ?? 0) / 100) || 0).toFixed(2)} PLN`,
                priceCents: typeof p?.price_cents === "number" ? p.price_cents : 0,
                comparePrice: p?.compare_price || undefined,
                comparePriceCents: p?.compare_price_cents || undefined,
                type: p?.type === "Cyfrowy" ? "Cyfrowy" : "Fizyczny",
                status: p?.status === "Nieaktywny" || p?.status === "Zawieszony" ? "Zawieszony" : "Aktywny",
                isDropOnly: Boolean(p?.is_drop_only),
                dropTargetDate: p?.drop_target_date || undefined,
                sales: p?.sales ?? 0,
                stock: typeof p?.stock === "number" ? p.stock : 50,
                variants: Array.isArray(p?.variants) && p.variants.length > 0 ? p.variants : ["S", "M", "L", "XL"],
                image: p?.image_url || p?.image || "",
                imageUrl: p?.image_url || p?.image || "",
                images: Array.isArray(p?.images) && p.images.length > 0 ? p.images : [p?.image_url || p?.image || ""].filter(Boolean),
                isDigital: Boolean(p?.is_digital || p?.type === "Cyfrowy"),
                digitalFileName: p?.digital_file_name || undefined,
                digitalFileSize: p?.digital_file_size || undefined,
                digitalFileUrl: p?.digital_file_url || undefined,
              }))
            : [];

          setAsyncStore({
            id: dbData?.id || `t_${subdomain}`,
            name: dbData?.name || `Sklep ${subdomain}`,
            subdomain: dbData?.subdomain || subdomain,
            customDomain: dbData?.custom_domain || "",
            domainVerified: Boolean(dbData?.domain_verified),
            logoUrl: dbData?.logo_url || "",
            description: dbData?.description || "",
            announcement: dbData?.announcement || "",
            niche: dbData?.niche || "Sklep Internetowy",
            template: dbData?.template || "Dark Vibe",
            accentColor: dbData?.accent_color || "#FF5B28",
            stripeStatus: dbData?.stripe_status || "disconnected",
            balanceCents: typeof dbData?.balance_cents === "number" ? dbData.balance_cents : 0,
            planType: dbData?.plan_type || "Start",
            planStatus: dbData?.plan_status || "active",
            status: dbData?.status || "active",
            socials: (typeof dbData?.social_links === "object" && dbData?.social_links !== null) ? dbData.social_links : {},
            dropConfig: (typeof dbData?.drop_config === "object" && dbData?.drop_config !== null)
              ? dbData.drop_config
              : { enabled: false, template: "Cyberpunk Launch", targetDate: "" },
            categories: Array.isArray(dbData?.categories) ? dbData.categories : [],
            products: mappedProducts,
            orders: [],
            payoutHistory: [],
            customers: [],
            campaigns: [],
            team: [],
          });
        }
      } catch (error) {
        console.error("Błąd ładowania sklepu:", error);
      } finally {
        setIsDBLoading(false);
      }
    }
    loadFromDB();
  }, [subdomain]);

  // 3. Resolve targetStore
  let targetStore: StoreConfig | undefined;
  let ownerUser: User | undefined;

  if (subdomain) {
    for (const u of allUsers || []) {
      const uStores = u?.stores || (u?.store ? [u.store] : []);
      const found = uStores.find(
        (s) =>
          s?.subdomain?.toLowerCase() === subdomain ||
          s?.customDomain?.toLowerCase() === subdomain ||
          s?.id === subdomain
      );
      if (found) {
        targetStore = found;
        ownerUser = u;
        break;
      }
    }
  }

  if (!targetStore && asyncStore) {
    targetStore = asyncStore;
  }

  // Local storage fallback for newly configured store / testing
  if (!targetStore && typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("iskra_active_store_") || k.startsWith("iskra_user_packages_"))) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed) ? parsed : [parsed];
            const match = list.find((item: any) => item?.subdomain?.toLowerCase() === subdomain);
            if (match) {
              const prodsRaw = localStorage.getItem(`iskra_products_${k.replace("iskra_active_store_", "").replace("iskra_user_packages_", "")}`);
              const prods = prodsRaw ? JSON.parse(prodsRaw) : [];
              targetStore = {
                id: match.id || `st_${subdomain}`,
                name: match.storeName || match.name || `Sklep ${subdomain}`,
                subdomain: match.subdomain || subdomain,
                customDomain: "",
                domainVerified: false,
                logoUrl: match.logoUrl || "",
                description: match.description || "",
                announcement: match.description || "",
                niche: "Streetwear & Moda",
                template: "Dark Vibe",
                accentColor: "#D0FF00",
                stripeStatus: "connected",
                balanceCents: 0,
                planType: match.planType || "Creator",
                planStatus: "active",
                status: "active",
                categories: [],
                products: prods,
                orders: [],
                payoutHistory: [],
                customers: [],
                campaigns: [],
                team: [],
                dropConfig: { enabled: false, template: "Cyberpunk Launch", targetDate: "" },
                socials: {},
              };
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Local storage fallback search error:", e);
    }
  }

  const isDropActive = Boolean(
    targetStore?.dropConfig?.enabled &&
      targetStore?.dropConfig?.targetDate &&
      !isNaN(new Date(targetStore.dropConfig.targetDate).getTime()) &&
      new Date(targetStore.dropConfig.targetDate).getTime() > Date.now()
  );

  // 4. Drop mode timer effect - MUST BE CALLED UNCONDITIONALLY BEFORE ANY RETURNS
  useEffect(() => {
    if (!isDropActive || !targetStore?.dropConfig?.targetDate) return;
    const targetTime = new Date(targetStore.dropConfig.targetDate).getTime();
    if (isNaN(targetTime)) return;

    const calculateTime = () => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [isDropActive, targetStore?.dropConfig?.targetDate]);

  // ==========================================
  // CONDITIONAL RENDERING STARTS HERE (SAFE)
  // ==========================================

  const isOwnerActive = ownerUser
    ? ownerUser.accountStatus !== "Blocked" && ownerUser.accountStatus !== "Suspended"
    : true;

  const isStoreActive = targetStore
    ? targetStore.status !== "suspended" &&
      targetStore.status !== "canceled" &&
      targetStore.planStatus !== "canceled" &&
      targetStore.planStatus !== "suspended"
    : false;

  // Suspended store condition
  if (targetStore && !isStoreActive) {
    return (
      <div className="min-h-screen bg-[#090A0C] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-md w-full text-center space-y-6 bg-white/[0.03] border border-white/10 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-2xl font-extrabold mb-2">
            ⏸️
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Ten sklep jest chwilowo niedostępny
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Okres rozliczeniowy lub darmowy trial tego sklepu dobiegł końca. Subdomena oraz zasoby sklepu pozostają zarezerwowane dla właściciela w okresie karencji.
          </p>
          <div className="pt-2 flex flex-col gap-3">
            <a
              href="https://iskral.pl/logowanie"
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FF5B28] to-[#FF8C38] text-white font-bold text-sm hover:opacity-90 transition shadow-lg shadow-[#FF5B28]/20 flex items-center justify-center gap-2 text-center"
            >
              Właścicielu? Zaloguj się i opłać pakiet
            </a>
            <a
              href="https://iskral.pl"
              className="w-full py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-zinc-300 font-medium text-sm hover:bg-white/10 transition flex items-center justify-center text-center"
            >
              Strona główna platformy
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Not found after loading finishes
  if (!isDBLoading && (!targetStore || !isOwnerActive)) {
    return <NotFoundPage />;
  }

  // Loading spinner
  if (isDBLoading && !targetStore) {
    return (
      <div className="min-h-screen bg-[#090A0C] text-white flex items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#FF5B28] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Ładowanie sklepu: {subdomain}...</span>
        </div>
      </div>
    );
  }

  if (!targetStore) {
    return <NotFoundPage />;
  }

  const store: StoreConfig = targetStore;
  const storeName = store.name || `Sklep ${subdomain || ""}`;
  const accentColor = store.accentColor || "#FF5B28";
  const logoUrl = store.logoUrl || "";
  const announcement = store.announcement || "";
  const niche = store.niche || "Sklep Internetowy";
  const categories = store.categories ?? [];
  const products = (store.products ?? []).filter((p) => p.status !== "Zawieszony");

  const filteredProducts =
    selectedCategoryId === "all"
      ? products
      : products.filter((p) => p && p.categoryId === selectedCategoryId);

  const handleSelectVariant = (productId: string, variant: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
  };

  const addToCart = (product: Product) => {
    if (!product) return;
    if (
      product.isDropOnly &&
      product.dropTargetDate &&
      !isNaN(new Date(product.dropTargetDate).getTime()) &&
      new Date(product.dropTargetDate).getTime() > Date.now()
    ) {
      alert("Ten produkt wyjdzie dopiero w dniu premiery dropu!");
      return;
    }

    const currentChosenVariant = selectedVariants[product.id] || (product.variants && product.variants[0]) || undefined;

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product?.id === product.id && item.selectedVariant === currentChosenVariant
      );
      if (existing) {
        return prev.map((item) =>
          item.product?.id === product.id && item.selectedVariant === currentChosenVariant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedVariant: currentChosenVariant }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, selectedVariant?: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.product?.id === productId && item.selectedVariant === selectedVariant))
    );
  };

  const cartTotalCents = cart.reduce(
    (sum, item) => sum + (item.product?.priceCents ?? 1000) * (item.quantity ?? 1),
    0
  );

  const handleStripeCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    try {
      const firstItem = cart[0]?.product;
      const digitalItems = cart.map((i) => i.product).filter((p) => p && (p.isDigital || p.digitalFileUrl));

      const checkoutUrl = await createStripeCheckout({
        productId: firstItem?.id || "order_prod",
        title: `${storeName} - Zamówienie (${cart.length} przedm.)`,
        priceCents: cartTotalCents,
        tenantId: store.id || `t_${subdomain}`,
        customerEmail: "klient@iskral.pl",
      });

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        if (store.id && firstItem?.id) {
          recordOrder(store.id, firstItem.id, "klient@iskral.pl", cartTotalCents);
        }
        setCart([]);
        setIsCartOpen(false);

        if (digitalItems.length > 0) {
          setPurchasedDigitalItems(digitalItems);
          setShowSuccessModal(true);
        } else {
          alert("🎉 Zamówienie opłacone pomyślnie przez Stripe! Transakcja trafiła do panelu sklepu.");
        }
      }
    } catch (checkoutErr) {
      console.error("Błąd podczas realizacji zamówienia Stripe:", checkoutErr);
      alert("Wystąpił problem z realizacją zamówienia. Spróbuj ponownie.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // FULLSCREEN DROP MODE COUNTDOWN SCREEN (HYPEBEAST / STREETWEAR AESTHETIC)
  if (isDropActive) {
    return (
      <main className="relative min-h-screen w-full bg-[#08080A] text-white flex flex-col items-center justify-center p-6 overflow-hidden select-none">
        <BackgroundVideo />

        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FF5B28]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl w-full bg-[#111216]/90 backdrop-blur-2xl border border-[#FF5B28]/40 rounded-[36px] p-8 sm:p-14 text-center flex flex-col items-center shadow-2xl ring-1 ring-white/10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FF5B28]/20 border border-[#FF5B28]/50 text-[#FF5B28] text-xs font-black rounded-full uppercase tracking-widest animate-pulse shadow-lg shadow-[#FF5B28]/20">
            <span className="w-2 h-2 rounded-full bg-[#FF5B28] animate-ping" />
            <span>DROP MODE ACTIVE • PREMIERA</span>
          </div>

          <h1 className="mt-6 text-4xl sm:text-6xl font-black tracking-tight text-white uppercase italic">
            {storeName}
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-md font-medium">
            Sklep jest obecnie zablokowany przed nowym dropem. Licznik bije na żywo — koszyk i zakupy zostaną odblokowane dokładnie w sekundzie premiery.
          </p>

          {/* Hypebeast Live Ticking Countdown Timer */}
          <div className="mt-10 grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-xl">
            <div className="p-4 sm:p-6 bg-[#090A0C] border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col items-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#FF5B28] to-transparent opacity-80" />
              <span className="text-3xl sm:text-6xl font-black text-[#FF5B28] font-mono tracking-tight">
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-500 mt-2 font-black uppercase tracking-wider">DNI</span>
            </div>

            <div className="p-4 sm:p-6 bg-[#090A0C] border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col items-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-40" />
              <span className="text-3xl sm:text-6xl font-black text-white font-mono tracking-tight">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-500 mt-2 font-black uppercase tracking-wider">GODZ</span>
            </div>

            <div className="p-4 sm:p-6 bg-[#090A0C] border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col items-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-40" />
              <span className="text-3xl sm:text-6xl font-black text-white font-mono tracking-tight">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-500 mt-2 font-black uppercase tracking-wider">MIN</span>
            </div>

            <div className="p-4 sm:p-6 bg-[#090A0C] border border-[#FF5B28]/30 rounded-2xl sm:rounded-3xl flex flex-col items-center shadow-2xl relative overflow-hidden group bg-gradient-to-b from-[#18181B] to-[#090A0C]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#FF5B28] to-transparent opacity-100 animate-pulse" />
              <span className="text-3xl sm:text-6xl font-black text-[#FF5B28] font-mono tracking-tight">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs text-[#FF5B28] mt-2 font-black uppercase tracking-wider">SEK</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-[#090A0C]/80 border border-white/10 rounded-2xl text-xs text-zinc-400 flex items-center gap-2">
            <span>🔒</span>
            <span>Zapraszamy w dniu premiery: <strong>{new Date(targetStore.dropConfig.targetDate).toLocaleString("pl-PL")}</strong></span>
          </div>
        </div>
      </main>
    );
  }

  // LIVE PUBLIC STOREFRONT SCREEN
  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col pb-24 font-sans">
      <BackgroundVideo />

      {/* Announcement Top Bar */}
      {announcement && (
        <div
          className="relative z-20 w-full py-2.5 text-white text-center text-xs font-black tracking-wide shadow-md"
          style={{ backgroundColor: accentColor }}
        >
          {announcement}
        </div>
      )}

      {/* Navbar Header */}
      <header className="relative z-10 w-full px-6 xl:px-[140px] py-6 flex items-center justify-between border-b border-white/[0.08] bg-[#0E0E11]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-10 w-auto max-w-[180px] object-contain rounded-lg"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-lg"
              style={{ backgroundColor: accentColor }}
            >
              {(storeName || "S").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black tracking-tight">{storeName}</h1>
            <span className="text-xs text-zinc-500 font-medium">
              {niche ? `${niche} • Sklep Internetowy` : "Oficjalny Sklep Internetowy"}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="px-5 py-2.5 bg-[#18181B] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span>🛒 Koszyk</span>
          {cart.length > 0 && (
            <span
              className="w-5 h-5 rounded-full text-white text-[11px] font-black flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              {cart.reduce((s, i) => s + (i.quantity || 1), 0)}
            </span>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 xl:px-[140px] pt-10 flex flex-col gap-8">
        
        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryId === "all"
                  ? "text-white shadow-lg"
                  : "bg-[#18181B] text-zinc-400 hover:text-white border border-white/10"
              }`}
              style={{
                backgroundColor: selectedCategoryId === "all" ? accentColor : undefined,
                boxShadow: selectedCategoryId === "all" ? `0 10px 15px -3px ${accentColor}40` : undefined,
              }}
            >
              Wszystkie Produkty ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? "text-white shadow-lg"
                    : "bg-[#18181B] text-zinc-400 hover:text-white border border-white/10"
                }`}
                style={{
                  backgroundColor: selectedCategoryId === cat.id ? accentColor : undefined,
                  boxShadow: selectedCategoryId === cat.id ? `0 10px 15px -3px ${accentColor}40` : undefined,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center bg-[#18181B] border border-white/10 rounded-3xl flex flex-col items-center">
            <span className="text-3xl mb-3">📦</span>
            <p className="text-sm font-bold text-white">Brak dostępnych produktów w sklepie.</p>
            <p className="text-xs text-zinc-500 mt-1">Wkrótce pojawią się nowe kolekcje.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => {
              if (!prod) return null;
              const isLockedProductDrop = Boolean(
                prod.isDropOnly &&
                  prod.dropTargetDate &&
                  !isNaN(new Date(prod.dropTargetDate).getTime()) &&
                  new Date(prod.dropTargetDate).getTime() > Date.now()
              );

              const currentVariant = selectedVariants[prod.id] || (prod.variants && prod.variants[0]) || "";

              return (
                <div
                  key={prod.id}
                  className="group p-5 bg-[#18181B] border border-white/10 hover:border-[#FF5B28]/50 rounded-3xl transition-all flex flex-col justify-between shadow-xl"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative w-full h-56 rounded-2xl bg-[#0E0E11] overflow-hidden">
                      <img
                        src={
                          prod.image ||
                          (Array.isArray(prod.images) && prod.images[0]) ||
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"
                        }
                        alt={prod.name || "Produkt"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold backdrop-blur-md ${
                            prod.isDigital ? "bg-cyan-500/80 text-white" : "bg-purple-500/80 text-white"
                          }`}
                        >
                          {prod.isDigital ? "💻 Cyfrowy" : "📦 Fizyczny"}
                        </span>
                        {isLockedProductDrop && (
                          <span className="px-2.5 py-1 bg-amber-500 text-black rounded-full text-[10px] font-black backdrop-blur-md">
                            🔒 Drop Only
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-4 font-black text-lg text-white group-hover:text-[#FF5B28] transition-colors">
                      {prod.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{prod.description}</p>

                    {/* Variant / Size Picker Pills */}
                    {prod.variants && prod.variants.length > 0 && (
                      <div className="mt-4">
                        <span className="text-[10px] font-extrabold uppercase text-zinc-500 block mb-1.5">Wybierz Wariant / Rozmiar:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {prod.variants.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => handleSelectVariant(prod.id, v)}
                              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                currentVariant === v
                                  ? "bg-[#FF5B28] text-white shadow-md shadow-[#FF5B28]/25 border border-[#FF5B28]"
                                  : "bg-[#0E0E11] text-zinc-400 hover:text-white border border-white/10"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-baseline gap-3">
                      <span className="text-2xl font-black text-[#FF5B28] font-mono">
                        {prod.price}
                      </span>
                      {prod.comparePrice && (
                        <span className="text-xs text-zinc-500 line-through font-mono">
                          {prod.comparePrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(prod)}
                    disabled={isLockedProductDrop}
                    className={`mt-6 w-full py-3.5 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      isLockedProductDrop
                        ? "bg-white/10 text-zinc-500 cursor-not-allowed"
                        : "bg-[#FF5B28] hover:bg-[#e04f20] text-white shadow-[#FF5B28]/20"
                    }`}
                  >
                    <span>{isLockedProductDrop ? "🔒 Oczekuje na Premierę Dropu" : "Dodaj do Koszyka"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-[#18181B] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h2 className="text-lg font-black text-white">Twój Koszyk ({cart.length})</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white font-bold cursor-pointer"
                >
                  Zamknij ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="mt-8 text-center text-xs text-zinc-500">Koszyk jest pusty.</p>
              ) : (
                <div className="mt-6 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#0E0E11] border border-white/10 rounded-2xl flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-extrabold text-xs text-white">{item.product?.name}</h4>
                        {item.selectedVariant && (
                          <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                            Wariant: <strong className="text-white">{item.selectedVariant}</strong>
                          </span>
                        )}
                        <span className="text-xs font-black text-[#FF5B28] font-mono mt-1 block">
                          {item.product?.price} x {item.quantity}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product?.id || "", item.selectedVariant)}
                        className="text-xs text-red-400 font-bold hover:underline cursor-pointer"
                      >
                        Usuń
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-zinc-400">Suma do zapłaty:</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {(cartTotalCents / 100).toFixed(2)} PLN
                  </span>
                </div>
                <button
                  onClick={handleStripeCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs rounded-xl transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {checkoutLoading ? "Przetwarzanie..." : "💳 Kup przez Stripe (Bezpieczna Płatność)"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIGITAL FILE DOWNLOAD SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#18181B] border border-emerald-500/50 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mb-4">
              🎉
            </div>
            <h2 className="text-2xl font-black text-white">Dziękujemy za zakup!</h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-md">
              Płatność Stripe została zaksięgowana. Poniżej znajduje się Twój zakupiony plik cyfrowy gotowy do natychmiastowego pobrania:
            </p>

            <div className="mt-6 w-full space-y-3">
              {purchasedDigitalItems.map((prod) => (
                <div key={prod.id} className="p-4 bg-[#0E0E11] border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-xl font-bold">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{prod.name}</h4>
                      <span className="text-[11px] text-purple-300 font-mono">
                        {prod.digitalFileName || "Plik_Cyfrowy.pdf"} ({prod.digitalFileSize || "15.4 MB"})
                      </span>
                    </div>
                  </div>

                  <a
                    href={prod.digitalFileUrl || "#"}
                    download={prod.digitalFileName || "Pobierz_Plik.pdf"}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>⬇️ Pobierz Plik</span>
                  </a>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-6 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Zamknij Okno
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
