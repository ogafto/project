"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ShoppingCart,
  X,
  Plus,
  Minus,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface SafeProduct {
  id: string;
  name: string;
  description?: string;
  price: string;
  priceCents: number;
  comparePrice?: string;
  comparePriceCents?: number;
  type: "Fizyczny" | "Cyfrowy";
  status: "Aktywny" | "Zawieszony" | "Wyprzedany";
  stock: number;
  sales?: number;
  isClothing?: boolean;
  variants?: string[];
  image?: string;
  imageUrl?: string;
  images?: string[];
  isDigital?: boolean;
  digitalFileName?: string;
  digitalFileSize?: string;
  digitalFileUrl?: string;
  isDropOnly?: boolean;
  dropTargetDate?: string;
}

export interface SafeStore {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  logoUrl?: string;
  description?: string;
  announcement?: string;
  niche?: string;
  template?: string;
  accentColor?: string;
  planType?: string;
  planStatus?: string;
  status?: string;
  socials?: { [key: string]: string };
  dropConfig?: {
    enabled: boolean;
    template?: string;
    targetDate?: string;
  };
  products?: SafeProduct[];
}

const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80";

function extractImages(product: SafeProduct): string[] {
  if (!product) return [DEFAULT_PRODUCT_IMAGE];
  if (Array.isArray(product.images) && product.images.length > 0) {
    const valid = product.images.filter(
      (img): img is string => typeof img === "string" && img.trim().length > 0
    );
    if (valid.length > 0) return valid;
  }
  if (product.imageUrl && typeof product.imageUrl === "string" && product.imageUrl.trim().length > 0) {
    return [product.imageUrl.trim()];
  }
  if (product.image && typeof product.image === "string" && product.image.trim().length > 0) {
    return [product.image.trim()];
  }
  return [DEFAULT_PRODUCT_IMAGE];
}

export function StoreClientView({
  store,
  initialProducts = [],
  initialSuccessModal = false,
}: {
  store: SafeStore;
  initialProducts: SafeProduct[];
  initialSuccessModal?: boolean;
}) {
  const storeName = store?.name || `Sklep ${store?.subdomain || ""}`;
  const accentColor = store?.accentColor || "#D0FF00";
  const logoUrl = store?.logoUrl || "";
  const announcement = store?.announcement || "";
  const subdomain = store?.subdomain || "";
  const products = Array.isArray(initialProducts) ? initialProducts : [];

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedVariants, setSelectedVariants] = useState<{ [productId: string]: string }>({});
  const [cart, setCart] = useState<{ product: SafeProduct; quantity: number; selectedVariant?: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(Boolean(initialSuccessModal));
  const [selectedProductModal, setSelectedProductModal] = useState<SafeProduct | null>(null);
  const [activeModalImageIdx, setActiveModalImageIdx] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Handle return from Stripe Checkout (?checkout=success or ?payment=success)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const isSuccess =
        params.get("checkout") === "success" ||
        params.get("payment") === "success" ||
        params.get("status") === "success";
      const sessionId = params.get("session_id") || params.get("sessionId");
      const productId = params.get("product_id") || params.get("productId");

      if (isSuccess || initialSuccessModal) {
        setCart([]);
        setIsCartOpen(false);
        setShowSuccessModal(true);

        // Record order safely in the background if productId exists
        if (store?.id && productId) {
          const matchedProd = products.find((p) => p.id === productId);
          const orderAmountCents = matchedProd?.priceCents || 24900;

          fetch("/api/stores/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storeId: store.id,
              productId: productId,
              productTitle: matchedProd?.name || "Zamówienie w sklepie",
              customerEmail: "klient@iskral.pl",
              amountTotalCents: orderAmountCents,
              stripeSessionId: sessionId || `cs_${Date.now()}`,
            }),
          }).catch(() => {});
        }

        // Clean query parameter from URL bar without page reload
        try {
          window.history.replaceState(null, "", window.location.pathname);
        } catch {}
      }
    } catch (e) {
      console.warn("Success URL parsing error:", e);
    }
  }, [store?.id, initialSuccessModal, products]);

  // Drop countdown timer if enabled
  const isDropActive = Boolean(
    store?.dropConfig?.enabled &&
      store?.dropConfig?.targetDate &&
      new Date(store.dropConfig.targetDate).getTime() > Date.now()
  );

  useEffect(() => {
    if (!isDropActive || !store?.dropConfig?.targetDate) return;
    const target = new Date(store.dropConfig.targetDate).getTime();

    const updateTimer = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isDropActive, store?.dropConfig?.targetDate]);

  const handleSelectVariant = (productId: string, variant: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
  };

  const addToCart = (product: SafeProduct, chosenVariant?: string) => {
    if (!product) return;

    const isDigital = Boolean(product.isDigital || product.type === "Cyfrowy");
    if (!isDigital && typeof product.stock === "number" && product.stock <= 0) {
      alert("Przepraszamy, ten produkt został wyprzedany!");
      return;
    }

    const isClothing = Boolean(!isDigital && product.isClothing);
    const finalVariant = isClothing
      ? chosenVariant ||
        selectedVariants[product.id] ||
        (Array.isArray(product.variants) && product.variants[0]) ||
        undefined
      : undefined;

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.product?.id === product.id && item.selectedVariant === finalVariant
      );
      if (existing) {
        return prev.map((item) =>
          item.product?.id === product.id && item.selectedVariant === finalVariant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, selectedVariant: finalVariant }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, selectedVariant?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product?.id === productId && item.selectedVariant === selectedVariant)
      )
    );
  };

  const updateCartQuantity = (productId: string, delta: number, selectedVariant?: string) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product?.id === productId && item.selectedVariant === selectedVariant) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is { product: SafeProduct; quantity: number; selectedVariant?: string } => item !== null)
    );
  };

  const cartTotalCents = cart.reduce((sum, item) => {
    let pCents = item.product?.priceCents;
    if (!pCents || pCents <= 0) {
      if (item.product?.price) {
        const parsed = parseFloat(String(item.product.price).replace(/[^0-9.,]/g, "").replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) pCents = Math.round(parsed * 100);
      }
    }
    return sum + (pCents || 24900) * (item.quantity || 1);
  }, 0);

  const totalCartItemsCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleStripeCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    try {
      const firstItem = cart[0]?.product;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: store?.id || subdomain,
          productId: firstItem?.id || "order_prod",
          title: `${storeName} - Zamówienie (${cart.length} przedm.)`,
          priceCents: cartTotalCents,
          customerEmail: "klient@iskral.pl",
          action: "buy_product",
        }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      // Fallback manual order recording
      if (store?.id && firstItem?.id) {
        fetch("/api/stores/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId: store.id,
            productId: firstItem.id,
            customerEmail: "klient@iskral.pl",
            amountTotalCents: cartTotalCents,
          }),
        }).catch(() => {});
      }

      setCart([]);
      setIsCartOpen(false);
      setShowSuccessModal(true);
    } catch (checkoutErr) {
      console.error("Błąd realizacji zamówienia:", checkoutErr);
      alert("Wystąpił problem z realizacją płatności. Spróbuj ponownie.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Filter products by category
  const filteredProducts = products.filter((p) => {
    if (selectedCategoryId === "all") return true;
    if (selectedCategoryId === "digital") return p.isDigital || p.type === "Cyfrowy";
    if (selectedCategoryId === "clothing") return !p.isDigital && p.isClothing;
    if (selectedCategoryId === "physical") return !p.isDigital && !p.isClothing;
    return true;
  });

  // FULLSCREEN DROP COUNTDOWN SCREEN
  if (isDropActive) {
    return (
      <main className="relative min-h-screen w-full bg-[#08080A] text-white flex flex-col items-center justify-center p-6 overflow-hidden select-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{ backgroundColor: accentColor }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-16 w-auto max-w-[240px] object-contain mb-6 drop-shadow-2xl"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-2xl"
              style={{
                backgroundColor: accentColor,
                color: accentColor === "#D0FF00" ? "#000" : "#FFF",
              }}
            >
              {(storeName || "S").charAt(0).toUpperCase()}
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-mono tracking-widest uppercase mb-4">
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
            <span>Nadchodzący Drop • Premiera wkrótce</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-white mb-4 font-['Sora',sans-serif]">
            {storeName}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-lg mb-10 leading-relaxed font-['Poppins',sans-serif]">
            {store?.description || "Przygotuj się na unikalny drop. Bądź gotowy w dniu premiery."}
          </p>

          <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-lg mb-10">
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
              <span className="text-2xl sm:text-5xl font-black font-mono text-white">
                {String(timeLeft.days).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider" style={{ color: accentColor }}>
                DNI
              </span>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
              <span className="text-2xl sm:text-5xl font-black font-mono text-white">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider" style={{ color: accentColor }}>
                GODZ
              </span>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
              <span className="text-2xl sm:text-5xl font-black font-mono text-white">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider" style={{ color: accentColor }}>
                MIN
              </span>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
              <span className="text-2xl sm:text-5xl font-black font-mono text-white">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider" style={{ color: accentColor }}>
                SEK
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#090A0C]/80 border border-white/10 rounded-2xl text-xs text-zinc-400 flex items-center gap-2">
            <span>🔒</span>
            <span>
              Premiera:{" "}
              <strong>
                {store?.dropConfig?.targetDate
                  ? new Date(store.dropConfig.targetDate).toLocaleString("pl-PL")
                  : "Wkrótce"}
              </strong>
            </span>
          </div>
        </div>
      </main>
    );
  }

  // STANDARD PUBLIC STOREFRONT
  const socials = store?.socials || {};

  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col pb-24 font-sans selection:bg-[#D0FF00] selection:text-black">
      {/* Announcement Bar */}
      {announcement && (
        <div
          className="relative z-20 w-full py-2.5 px-4 text-center text-xs font-black tracking-wide shadow-md font-['Poppins',sans-serif]"
          style={{
            backgroundColor: accentColor,
            color: accentColor === "#D0FF00" ? "#000" : "#FFF",
          }}
        >
          {announcement}
        </div>
      )}

      {/* Header Navbar */}
      <header className="relative z-10 w-full px-6 xl:px-[140px] py-5 flex items-center justify-between border-b border-white/[0.08] bg-[#0E0E11]/90 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={storeName}
              className="h-10 w-auto max-w-[180px] object-contain rounded-lg shadow-sm"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
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
            <h1 className="text-xl font-bold tracking-tight font-['Sora',sans-serif]">{storeName}</h1>
            <span className="text-xs text-zinc-400 font-['Poppins',sans-serif]">
              {store?.description ? store.description.slice(0, 45) : "Oficjalny sklep internetowy"}
            </span>
          </div>
        </div>

        {/* Right Header Navigation & Cart */}
        <div className="flex items-center gap-4">
          {/* Social Links */}
          <div className="hidden md:flex items-center gap-3 text-xs font-mono text-zinc-400">
            {socials.instagram && (
              <a
                href={socials.instagram.startsWith("http") ? socials.instagram : `https://instagram.com/${socials.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                Instagram
              </a>
            )}
            {socials.tiktok && (
              <a
                href={socials.tiktok.startsWith("http") ? socials.tiktok : `https://tiktok.com/@${socials.tiktok}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
              >
                TikTok
              </a>
            )}
          </div>

          {/* Cart Trigger Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" style={{ color: accentColor }} />
            <span className="hidden sm:inline font-mono">Koszyk</span>
            {totalCartItemsCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold"
                style={{
                  backgroundColor: accentColor,
                  color: accentColor === "#D0FF00" ? "#000" : "#FFF",
                }}
              >
                {totalCartItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 xl:px-[140px] pt-10 space-y-10 flex-1">
        {/* Hero Banner Header */}
        <div className="p-8 sm:p-12 rounded-[28px] bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 relative overflow-hidden backdrop-blur-xl">
          <div
            className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-20"
            style={{ backgroundColor: accentColor }}
          />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-300">
              <Sparkles className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span>Oryginalna Kolekcja • Bezpieczne Płatności Stripe & BLIK</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-['Sora',sans-serif]">
              {storeName}
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 font-['Poppins',sans-serif] leading-relaxed">
              {store?.description || "Witaj w naszym sklepie. Przeglądaj dostępne produkty i zamawiaj z błyskawiczną realizacją."}
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {[
              { id: "all", label: `Wszystkie (${products.length})` },
              { id: "digital", label: `Pliki Cyfrowe (${products.filter((p) => p.isDigital || p.type === "Cyfrowy").length})` },
              { id: "clothing", label: `Odzież (${products.filter((p) => !p.isDigital && p.isClothing).length})` },
              { id: "physical", label: `Akcesoria (${products.filter((p) => !p.isDigital && !p.isClothing).length})` },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategoryId === cat.id
                    ? "text-black shadow-lg"
                    : "bg-[#14151A] hover:bg-[#1C1E26] text-zinc-400 hover:text-white border border-white/5"
                }`}
                style={{
                  backgroundColor: selectedCategoryId === cat.id ? accentColor : undefined,
                  color: selectedCategoryId === cat.id ? (accentColor === "#D0FF00" ? "#000" : "#FFF") : undefined,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-500 font-mono">
            {filteredProducts.length} {filteredProducts.length === 1 ? "pozycja" : "pozycji"}
          </span>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center bg-[#14151A]/60 border border-white/10 rounded-3xl space-y-4">
            <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white font-['Sora',sans-serif]">Brak produktów w tej kategorii</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto font-['Poppins',sans-serif]">
              Właściciel sklepu przygotowuje nowe artykuły. Sprawdź ponownie za chwilę lub wybierz inną kategorię.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-['Poppins',sans-serif]">
            {filteredProducts.map((prod) => {
              if (!prod) return null;

              const isDigital = Boolean(prod.isDigital || prod.type === "Cyfrowy");
              const isClothing = Boolean(!isDigital && prod.isClothing);
              const isSoldOut = !isDigital && typeof prod.stock === "number" && prod.stock <= 0;
              const currentVariant = selectedVariants[prod.id] || (Array.isArray(prod.variants) && prod.variants[0]) || "";
              const prodImgs = extractImages(prod);
              const mainCoverImg = prodImgs[0] || DEFAULT_PRODUCT_IMAGE;

              return (
                <div
                  key={prod.id}
                  className="group p-5 bg-[#18181B] border border-white/10 hover:border-white/25 rounded-3xl transition-all flex flex-col justify-between shadow-xl"
                >
                  <div>
                    {/* Image Container - Clickable */}
                    <div
                      onClick={() => {
                        setSelectedProductModal(prod);
                        setActiveModalImageIdx(0);
                      }}
                      className="relative w-full h-60 rounded-2xl bg-[#0E0E11] overflow-hidden cursor-pointer"
                    >
                      <img
                        src={mainCoverImg}
                        alt={prod.name || "Produkt"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${
                            isDigital ? "bg-cyan-500/90 text-white" : "bg-purple-500/90 text-white"
                          }`}
                        >
                          {isDigital ? "💻 Cyfrowy" : isClothing ? "👕 Odzież" : "📦 Fizyczny"}
                        </span>
                        {isSoldOut && (
                          <span className="px-2.5 py-1 bg-rose-500/90 text-white rounded-full text-[10px] font-bold backdrop-blur-md">
                            🚫 Wyprzedane
                          </span>
                        )}
                      </div>

                      {prodImgs.length > 1 && (
                        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-black/75 rounded-md text-[10px] text-zinc-300 font-mono backdrop-blur-sm">
                          📷 {prodImgs.length} zdjęć
                        </div>
                      )}
                    </div>

                    <h3
                      onClick={() => {
                        setSelectedProductModal(prod);
                        setActiveModalImageIdx(0);
                      }}
                      className="mt-4 font-bold text-base text-white group-hover:text-[#D0FF00] transition-colors cursor-pointer font-['Sora',sans-serif]"
                    >
                      {prod.name}
                    </h3>

                    {/* Stock & Availability */}
                    <div className="mt-1 flex items-center justify-between text-xs text-zinc-400">
                      <span>
                        {isDigital ? (
                          <span className="text-emerald-400 font-medium">⚡ Dostęp natychmiastowy</span>
                        ) : isSoldOut ? (
                          <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                            🚫 Wyprzedane
                          </span>
                        ) : (
                          <span>
                            Stan: <strong className="text-zinc-200">{prod.stock ?? 50} szt.</strong>
                          </span>
                        )}
                      </span>
                    </div>

                    <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {prod.description || "Oryginalny produkt w ofercie sklepu."}
                    </p>

                    {/* Size Picker Pills - Clothing only */}
                    {isClothing && Array.isArray(prod.variants) && prod.variants.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/[0.06]">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1.5">
                          Wybierz Rozmiar:
                        </span>
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

                    {/* Price Display */}
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

                  {/* Actions */}
                  <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductModal(prod);
                        setActiveModalImageIdx(0);
                      }}
                      className="py-2.5 px-3 bg-[#111319] hover:bg-[#181B24] border border-white/10 rounded-xl text-zinc-300 hover:text-white text-[13px] font-medium transition-colors cursor-pointer text-center"
                    >
                      Szczegóły
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isSoldOut) return;
                        addToCart(prod);
                      }}
                      disabled={isSoldOut}
                      className={`py-2.5 px-3 font-medium text-[13px] rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md ${
                        isSoldOut
                          ? "opacity-60 cursor-not-allowed bg-zinc-800 text-zinc-500"
                          : "cursor-pointer"
                      }`}
                      style={{
                        backgroundColor: isSoldOut ? undefined : accentColor,
                        color: isSoldOut ? undefined : accentColor === "#D0FF00" ? "#000" : "#FFF",
                      }}
                    >
                      <span>{isSoldOut ? "Wyprzedane" : "Do koszyka"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PRODUCT DETAIL MODAL */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#18181B] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedProductModal(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-['Poppins',sans-serif]">
              {/* Left Column: Gallery */}
              <div className="space-y-3">
                {(() => {
                  const modalImgs = extractImages(selectedProductModal);
                  const activeImg = modalImgs[activeModalImageIdx] || modalImgs[0] || DEFAULT_PRODUCT_IMAGE;

                  return (
                    <>
                      <div className="w-full h-80 sm:h-96 rounded-2xl bg-[#0E0E11] overflow-hidden relative border border-white/10">
                        <img
                          src={activeImg}
                          alt={selectedProductModal.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                          }}
                        />
                      </div>

                      {modalImgs.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                          {modalImgs.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActiveModalImageIdx(idx)}
                              className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                activeModalImageIdx === idx ? "border-[#D0FF00] scale-95" : "border-white/10 opacity-60 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={img}
                                alt="Miniatura"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Right Column: Details & Buy Button */}
              <div className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Sora',sans-serif]">
                      {selectedProductModal.name}
                    </h2>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-3xl font-black font-mono" style={{ color: accentColor }}>
                        {selectedProductModal.price}
                      </span>
                      {selectedProductModal.comparePrice && (
                        <span className="text-sm text-zinc-500 line-through font-mono">
                          {selectedProductModal.comparePrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock info */}
                  <div className="p-3.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-zinc-400">Dostępność:</span>
                    <span className="font-semibold text-white">
                      {selectedProductModal.isDigital || selectedProductModal.type === "Cyfrowy" ? (
                        <span className="text-emerald-400 font-bold">⚡ Plik gotowy do pobrania od ręki</span>
                      ) : typeof selectedProductModal.stock === "number" && selectedProductModal.stock <= 0 ? (
                        <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md">
                          🚫 Wyprzedane
                        </span>
                      ) : (
                        <span>
                          W magazynie: <strong className="text-[#D0FF00] font-mono">{selectedProductModal.stock ?? 50} sztuk</strong>
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Sizes */}
                  {selectedProductModal.isClothing &&
                    Array.isArray(selectedProductModal.variants) &&
                    selectedProductModal.variants.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                          Wybierz rozmiar:
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedProductModal.variants.map((v) => {
                            const isSel =
                              (selectedVariants[selectedProductModal.id] || selectedProductModal.variants![0]) === v;
                            return (
                              <button
                                key={v}
                                type="button"
                                onClick={() => handleSelectVariant(selectedProductModal.id, v)}
                                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                                  isSel ? "text-black shadow-lg" : "bg-[#0E0E11] text-zinc-400 hover:text-white border border-white/10"
                                }`}
                                style={{
                                  backgroundColor: isSel ? accentColor : undefined,
                                }}
                              >
                                {v}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Description */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                      Opis i specyfikacja:
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line bg-[#0E0E11]/60 p-4 rounded-2xl border border-white/5 max-h-48 overflow-y-auto">
                      {selectedProductModal.description || "Brak dodatkowego opisu dla tego produktu."}
                    </p>
                  </div>
                </div>

                {/* Modal Buy Actions */}
                {(() => {
                  const isModalSoldOut =
                    !selectedProductModal.isDigital &&
                    selectedProductModal.type !== "Cyfrowy" &&
                    typeof selectedProductModal.stock === "number" &&
                    selectedProductModal.stock <= 0;

                  return (
                    <div className="space-y-2.5 pt-4 border-t border-white/10">
                      <button
                        type="button"
                        disabled={isModalSoldOut}
                        onClick={() => {
                          if (isModalSoldOut) return;
                          addToCart(selectedProductModal);
                          setSelectedProductModal(null);
                        }}
                        className={`w-full py-3.5 font-bold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                          isModalSoldOut
                            ? "opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500"
                            : "cursor-pointer"
                        }`}
                        style={{
                          backgroundColor: isModalSoldOut ? undefined : accentColor,
                          color: isModalSoldOut ? undefined : accentColor === "#D0FF00" ? "#000" : "#FFF",
                        }}
                      >
                        <span>{isModalSoldOut ? "🚫 Produkt Wyprzedany" : "Dodaj do koszyka"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedProductModal(null)}
                        className="w-full py-2.5 bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-medium rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Wróć do przeglądania sklepu
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-[#18181B] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl font-['Poppins',sans-serif]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" style={{ color: accentColor }} />
                  <h3 className="font-bold text-base text-white font-['Sora',sans-serif]">
                    Twój Koszyk ({totalCartItemsCount})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-[58vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto opacity-40" />
                    <p className="text-xs">Twój koszyk jest pusty.</p>
                  </div>
                ) : (
                  cart.map((item, idx) => {
                    const prodImg = extractImages(item.product)[0] || DEFAULT_PRODUCT_IMAGE;
                    return (
                      <div
                        key={`${item.product?.id}_${item.selectedVariant || ""}_${idx}`}
                        className="flex items-center justify-between p-3.5 bg-[#0E0E11] border border-white/5 rounded-2xl gap-3"
                      >
                        <div className="w-14 h-14 rounded-xl bg-black/50 overflow-hidden shrink-0">
                          <img
                            src={prodImg}
                            alt={item.product?.name || "Produkt"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate font-['Sora',sans-serif]">
                            {item.product?.name}
                          </h4>
                          {item.selectedVariant && (
                            <span className="text-[10px] text-zinc-400 font-mono block">
                              Rozmiar: <strong>{item.selectedVariant}</strong>
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold" style={{ color: accentColor }}>
                            {item.product?.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-[#18181B] border border-white/10 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, -1, item.selectedVariant)}
                              className="px-2 py-1 hover:bg-white/10 text-xs text-zinc-300"
                            >
                              -
                            </button>
                            <span className="px-2 text-xs font-mono font-bold text-white">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item.product.id, 1, item.selectedVariant)}
                              className="px-2 py-1 hover:bg-white/10 text-xs text-zinc-300"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id, item.selectedVariant)}
                            className="text-zinc-500 hover:text-rose-400 text-xs p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cart Footer */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Do zapłaty:</span>
                <span className="text-xl font-bold font-mono text-white">
                  {((cartTotalCents || 0) / 100).toFixed(2)} PLN
                </span>
              </div>
              <button
                type="button"
                onClick={handleStripeCheckout}
                disabled={cart.length === 0 || checkoutLoading}
                className="w-full py-3.5 font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: accentColor,
                  color: accentColor === "#D0FF00" ? "#000" : "#FFF",
                }}
              >
                {checkoutLoading ? (
                  <span>Przekierowanie do płatności...</span>
                ) : (
                  <span>Przejdź do kasy (Stripe • BLIK)</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS ORDER CONFIRMATION MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#18181B] border border-white/20 p-8 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-['Sora',sans-serif]">
                Dziękujemy za zamówienie!
              </h3>
              <p className="text-xs text-zinc-400 mt-2 font-['Poppins',sans-serif] leading-relaxed">
                Płatność przez Stripe została zaksięgowana. Potwierdzenie oraz szczegóły wysłaliśmy na Twój adres e-mail.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 rounded-xl bg-[#D0FF00] hover:bg-[#bce600] text-black font-bold text-xs transition-colors cursor-pointer"
            >
              Zamknij i kontynuuj zakupy
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
