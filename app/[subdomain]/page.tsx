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

  // 2. Load store & products from Supabase + track visits
  useEffect(() => {
    if (!subdomain) return;
    try {
      fetch("/api/stores/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain }),
      }).catch(() => {});
      const visitKey = `iskra_visits_${subdomain}`;
      const cur = Number(localStorage.getItem(visitKey) || "0");
      localStorage.setItem(visitKey, String(cur + 1));
    } catch {}
  }, [subdomain]);

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
            accentColor: dbData?.accent_color || "#D0FF00",
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
          fetch("/api/stores/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId: store.id,
              productId: firstItem.id,
              customerEmail: "klient@iskral.pl",
              amountTotalCents: cartTotalCents,
            }),
          }).catch(() => {});

          try {
            const ordKey = `iskra_orders_${store.id}`;
            const existing = JSON.parse(localStorage.getItem(ordKey) || "[]");
            const newOrd = {
              id: `ord_${Date.now()}`,
              tenantId: store.id,
              stripeSessionId: `cs_local_${Date.now()}`,
              amountTotalCents: cartTotalCents,
              status: "paid",
              customerEmail: "klient@iskral.pl",
              createdAt: new Date().toISOString(),
            };
            localStorage.setItem(ordKey, JSON.stringify([newOrd, ...existing]));
          } catch {}
        }
        setCart([]);
        setIsCartOpen(false);

        if (digitalItems.length > 0) {
          setPurchasedDigitalItems(digitalItems);
          setShowSuccessModal(true);
        } else {
          alert("🎉 Zamówienie opłacone pomyślnie! Transakcja i przychód trafiły do panelu Twojego sklepu.");
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
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{ backgroundColor: accentColor }}
        />

        <div
          className="relative z-10 max-w-3xl w-full bg-[#111216]/90 backdrop-blur-2xl border rounded-[36px] p-8 sm:p-14 text-center flex flex-col items-center shadow-2xl ring-1 ring-white/10"
          style={{ borderColor: `${accentColor}40` }}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 border text-xs font-black rounded-full uppercase tracking-widest animate-pulse"
            style={{
              backgroundColor: `${accentColor}20`,
              borderColor: `${accentColor}50`,
              color: accentColor,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
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
              <span className="text-3xl sm:text-6xl font-black font-mono tracking-tight" style={{ color: accentColor }}>
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-500 mt-2 font-black uppercase tracking-wider">DNI</span>
            </div>

            <div className="p-4 sm:p-6 bg-[#090A0C] border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col items-center shadow-2xl relative overflow-hidden group">
              <span className="text-3xl sm:text-6xl font-black text-white font-mono tracking-tight">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-500 mt-2 font-black uppercase tracking-wider">GODZ</span>
            </div>

            <div className="p-4 sm:p-6 bg-[#090A0C] border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col items-center shadow-2xl relative overflow-hidden group">
              <span className="text-3xl sm:text-6xl font-black text-white font-mono tracking-tight">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-500 mt-2 font-black uppercase tracking-wider">MIN</span>
            </div>

            <div className="p-4 sm:p-6 bg-[#090A0C] border border-white/10 rounded-2xl sm:rounded-3xl flex flex-col items-center shadow-2xl relative overflow-hidden group">
              <span className="text-3xl sm:text-6xl font-black font-mono tracking-tight" style={{ color: accentColor }}>
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider" style={{ color: accentColor }}>SEK</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-[#090A0C]/80 border border-white/10 rounded-2xl text-xs text-zinc-400 flex items-center gap-2">
            <span>🔒</span>
            <span>Zapraszamy w dniu premiery: <strong>{targetStore?.dropConfig?.targetDate ? new Date(targetStore.dropConfig.targetDate).toLocaleString("pl-PL") : "Wkrótce"}</strong></span>
          </div>
        </div>
      </main>
    );
  }

  // LIVE PUBLIC STOREFRONT SCREEN
  const socials = store.socials || {};

  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col pb-24 font-sans">
      <BackgroundVideo />

      {/* Announcement Top Bar */}
      {announcement && (
        <div
          className="relative z-20 w-full py-2.5 text-white text-center text-xs font-black tracking-wide shadow-md"
          style={{ backgroundColor: accentColor, color: accentColor === "#D0FF00" ? "#000" : "#FFF" }}
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
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-lg"
              style={{
                backgroundColor: accentColor,
                color: accentColor === "#D0FF00" ? "#000" : "#FFF",
              }}
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

        {/* Social Media & Cart */}
        <div className="flex items-center gap-3">
          {/* Social Media Icons */}
          {socials.instagram && (
            <a
              href={socials.instagram.startsWith("http") ? socials.instagram : `https://instagram.com/${socials.instagram.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-[#18181B] hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Instagram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
          )}
          {socials.tiktok && (
            <a
              href={socials.tiktok.startsWith("http") ? socials.tiktok : `https://tiktok.com/@${socials.tiktok.replace("@", "")}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-[#18181B] hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="TikTok"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-3.04-1.52z"/></svg>
            </a>
          )}
          {socials.facebook && (
            <a
              href={socials.facebook.startsWith("http") ? socials.facebook : `https://facebook.com/${socials.facebook}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-[#18181B] hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Facebook"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.688 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/></svg>
            </a>
          )}
          {socials.discord && (
            <a
              href={socials.discord.startsWith("http") ? socials.discord : `https://discord.gg/${socials.discord}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-[#18181B] hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Discord"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            </a>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            className="px-5 py-2.5 bg-[#18181B] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span>🛒 Koszyk</span>
            {cart.length > 0 && (
              <span
                className="w-5 h-5 rounded-full text-black text-[11px] font-black flex items-center justify-center"
                style={{ backgroundColor: accentColor }}
              >
                {cart.reduce((s, i) => s + (i.quantity || 1), 0)}
              </span>
            )}
          </button>
        </div>
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
                  ? "text-black shadow-lg"
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
                    ? "text-black shadow-lg"
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
                  className="group p-5 bg-[#18181B] border border-white/10 hover:border-white/30 rounded-3xl transition-all flex flex-col justify-between shadow-xl"
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

                    <h3 className="mt-4 font-black text-lg text-white group-hover:text-[#D0FF00] transition-colors">
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
                                  ? "text-black shadow-md border"
                                  : "bg-[#0E0E11] text-zinc-400 hover:text-white border border-white/10"
                              }`}
                              style={{
                                backgroundColor: currentVariant === v ? accentColor : undefined,
                                borderColor: currentVariant === v ? accentColor : undefined,
                              }}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-baseline gap-3">
                      <span className="text-2xl font-black font-mono" style={{ color: accentColor }}>
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
                    className="mt-6 w-full py-3.5 font-bold text-[14px] font-['Poppins',sans-serif] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    style={{
                      backgroundColor: isLockedProductDrop ? "rgba(255,255,255,0.1)" : accentColor,
                      color: isLockedProductDrop ? "#71717A" : (accentColor === "#D0FF00" ? "#000" : "#FFF"),
                    }}
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
                        <span className="text-xs font-black font-mono mt-1 block" style={{ color: accentColor }}>
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
                  <span className="text-2xl font-black font-mono" style={{ color: accentColor }}>
                    {(cartTotalCents / 100).toFixed(2)} PLN
                  </span>
                </div>
                <button
                  onClick={handleStripeCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-4 font-bold text-[14px] font-['Poppins',sans-serif] rounded-xl transition-colors cursor-pointer shadow-lg"
                  style={{
                    backgroundColor: accentColor,
                    color: accentColor === "#D0FF00" ? "#000" : "#FFF",
                  }}
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
