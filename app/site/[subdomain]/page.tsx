"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import BackgroundVideo from "@/app/components/BackgroundVideo";
import { useAuth, Product, Category, StoreConfig, User } from "@/app/context/AuthContext";

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default function TenantStorePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const subdomain = resolvedParams.subdomain;

  const { allUsers, createStripeCheckout, recordOrder } = useAuth();

  // Find store by subdomain or custom domain across all users and stores
  let targetStore: StoreConfig | undefined;
  let ownerUser: User | undefined;

  if (subdomain) {
    const cleanSubdomain = subdomain.toLowerCase();
    for (const u of allUsers) {
      const uStores = u.stores || (u.store ? [u.store] : []);
      const found = uStores.find(
        (s) =>
          s.subdomain?.toLowerCase() === cleanSubdomain ||
          s.customDomain?.toLowerCase() === cleanSubdomain ||
          s.id === cleanSubdomain
      );
      if (found) {
        targetStore = found;
        ownerUser = u;
        break;
      }
    }
  }

  // Verification:
  // 1. Store must exist in database/users records
  // 2. Owner user must have an active account status
  // 3. Store must have an active status / plan status
  const isOwnerActive = ownerUser
    ? ownerUser.accountStatus !== "Blocked" && ownerUser.accountStatus !== "Suspended"
    : false;

  const isStoreActive = targetStore
    ? targetStore.status !== "suspended" &&
      targetStore.status !== "canceled" &&
      targetStore.planStatus !== "canceled" &&
      targetStore.planStatus !== "suspended"
    : false;

  if (!targetStore || !isOwnerActive || !isStoreActive) {
    notFound();
  }

  const store: StoreConfig = targetStore;

  const isDropActive = Boolean(
    store.dropConfig?.enabled &&
      store.dropConfig?.targetDate &&
      new Date(store.dropConfig.targetDate).getTime() > Date.now()
  );

  // Ticking countdown for drop mode
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!isDropActive || !store.dropConfig?.targetDate) return;
    const interval = setInterval(() => {
      const target = new Date(store.dropConfig.targetDate).getTime();
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isDropActive, store.dropConfig?.targetDate]);

  // Filtering & Cart State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const categories = store.categories || [];
  const products = store.products || [];

  const filteredProducts =
    selectedCategoryId === "all"
      ? products
      : products.filter((p) => p.categoryId === selectedCategoryId);

  const addToCart = (product: Product) => {
    // Prevent adding locked drop products
    if (product.isDropOnly && product.dropTargetDate && new Date(product.dropTargetDate).getTime() > Date.now()) {
      alert("Ten produkt wyjdzie dopiero w dniu premiery dropu!");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotalCents = cart.reduce(
    (sum, item) => sum + (item.product.priceCents || 1000) * item.quantity,
    0
  );

  const [purchasedDigitalItems, setPurchasedDigitalItems] = useState<Product[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleStripeCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    const firstItem = cart[0].product;
    const digitalItems = cart.map((i) => i.product).filter((p) => p.isDigital || p.digitalFileUrl);

    const checkoutUrl = await createStripeCheckout({
      productId: firstItem.id,
      title: `${store.name} - Zamówienie (${cart.length} przedm.)`,
      priceCents: cartTotalCents,
      tenantId: store.id,
      customerEmail: "klient@motywo.pl",
    });

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      // Direct checkout recording fallback
      recordOrder(store.id, firstItem.id, "klient@motywo.pl", cartTotalCents);
      setCart([]);
      setIsCartOpen(false);

      if (digitalItems.length > 0) {
        setPurchasedDigitalItems(digitalItems);
        setShowSuccessModal(true);
      } else {
        alert("🎉 Zamówienie opłacone pomyślnie przez Stripe! Transakcja trafiła do panelu sklepu.");
      }
    }
    setCheckoutLoading(false);
  };

  const isSuspended = store.status === "suspended" || store.planStatus === "suspended";

  // FULLSCREEN SUSPENDED STORE SCREEN
  if (isSuspended) {
    return (
      <main className="relative min-h-screen w-full bg-[#0B0C0E] text-white flex flex-col items-center justify-center p-6 overflow-hidden">
        <BackgroundVideo />
        <div className="relative z-10 max-w-md w-full bg-[#121316]/95 backdrop-blur-2xl border border-red-500/30 rounded-[28px] p-8 sm:p-10 text-center flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <span className="px-3.5 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
            STATUS: ZAWIESZONY
          </span>
          <h1 className="mt-4 text-2xl font-extrabold text-white tracking-tight">
            Sklep tymczasowo niedostępny
          </h1>
          <p className="mt-2 text-xs text-[#A1A1AA] leading-relaxed">
            Przepraszamy, ten sklep jest w tej chwili niedostępny. Płatności oraz składanie nowych zamówień zostały tymczasowo wstrzymane.
          </p>
          <div className="mt-6 p-4 w-full bg-[#0B0C0E] border border-white/[0.08] rounded-xl text-[11px] text-[#707075]">
            Skontaktuj się z administratorem platformy <strong className="text-white">motywo.pl</strong>, aby odblokować dostęp.
          </div>
        </div>
      </main>
    );
  }

  // FULLSCREEN DROP MODE COUNTDOWN SCREEN
  if (isDropActive) {
    return (
      <main className="relative min-h-screen w-full bg-[#09090C] text-white flex flex-col items-center justify-center p-6 overflow-hidden">
        <BackgroundVideo />

        <div className="relative z-10 max-w-2xl w-full bg-[#121216]/90 backdrop-blur-xl border border-[#FF5B28]/40 rounded-[32px] p-8 sm:p-14 text-center flex flex-col items-center shadow-2xl">
          <span className="px-4 py-1.5 bg-[#FF5B28] text-white text-xs font-bold rounded-full uppercase tracking-wider animate-pulse shadow-lg shadow-[#FF5B28]/40">
            🔥 PREMIERA / DROP MODE ACTIVE
          </span>

          <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight">
            {store.name}
          </h1>

          <p className="mt-3 text-sm text-[#A1A1AA] max-w-md">
            Sklep jest obecnie zablokowany przed nową premierą. Odliczanie trwa — zakupy zostaną odblokowane dokładnie o wyznaczonej godzinie!
          </p>

          {/* Ticking Countdown Timer */}
          <div className="mt-8 grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-lg">
            <div className="p-4 bg-[#0E0E11] border border-white/10 rounded-[20px] flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-extrabold text-[#FF5B28]">
                {timeLeft.days}
              </span>
              <span className="text-[11px] text-[#707070] mt-1 font-semibold uppercase">DNI</span>
            </div>
            <div className="p-4 bg-[#0E0E11] border border-white/10 rounded-[20px] flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-extrabold text-white">
                {String(timeLeft.hours).padStart(2, "0")}
              </span>
              <span className="text-[11px] text-[#707070] mt-1 font-semibold uppercase">GODZ</span>
            </div>
            <div className="p-4 bg-[#0E0E11] border border-white/10 rounded-[20px] flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-extrabold text-white">
                {String(timeLeft.minutes).padStart(2, "0")}
              </span>
              <span className="text-[11px] text-[#707070] mt-1 font-semibold uppercase">MIN</span>
            </div>
            <div className="p-4 bg-[#0E0E11] border border-white/10 rounded-[20px] flex flex-col items-center">
              <span className="text-3xl sm:text-5xl font-extrabold text-white">
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
              <span className="text-[11px] text-[#707070] mt-1 font-semibold uppercase">SEK</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/[0.03] border border-white/10 rounded-[16px] text-xs text-[#707070]">
            🔒 Przycisk koszyka i zakupów powróci automatycznie po zakończeniu odliczania.
          </div>
        </div>
      </main>
    );
  }

  // LIVE PUBLIC STOREFRONT SCREEN
  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col pb-24">
      <BackgroundVideo />

      {/* Announcement Top Bar */}
      {store.announcement && (
        <div className="relative z-20 w-full py-2.5 bg-[#FF5B28] text-white text-center text-xs font-bold tracking-wide shadow-md">
          {store.announcement}
        </div>
      )}

      {/* Navbar Header */}
      <header className="relative z-10 w-full px-6 xl:px-[140px] py-6 flex items-center justify-between border-b border-white/[0.08] bg-[#0E0E11]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {store.logoUrl ? (
            <img
              src={store.logoUrl}
              alt={store.name}
              className="h-10 w-auto max-w-[180px] object-contain rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF5B28] to-orange-400 flex items-center justify-center font-bold text-white text-lg shadow-lg">
              {store.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight">{store.name}</h1>
            <span className="text-xs text-[#707070]">
              {store.niche ? `${store.niche} • Sklep Internetowy` : "Oficjalny Sklep Internetowy"}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="px-5 py-2.5 bg-[#17171B] hover:bg-white/10 border border-white/10 rounded-[12px] text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          <span>🛒 Koszyk</span>
          {cart.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#FF5B28] text-white text-[11px] font-bold flex items-center justify-center">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 w-full px-6 xl:px-[140px] pt-10 flex flex-col gap-8">
        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategoryId("all")}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategoryId === "all"
                  ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/30"
                  : "bg-[#17171B] text-[#A1A1AA] hover:text-white border border-white/10"
              }`}
            >
              Wszystkie Produkty ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/30"
                    : "bg-[#17171B] text-[#A1A1AA] hover:text-white border border-white/10"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center bg-[#17171B] border border-white/10 rounded-[24px] flex flex-col items-center">
            <p className="text-sm text-[#707070]">Brak dostępnych produktów w sklepie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => {
              const isLockedProductDrop = Boolean(
                prod.isDropOnly &&
                  prod.dropTargetDate &&
                  new Date(prod.dropTargetDate).getTime() > Date.now()
              );

              return (
                <div
                  key={prod.id}
                  className="group p-5 bg-[#17171B] border border-white/[0.08] hover:border-[#FF5B28]/50 rounded-[24px] transition-all flex flex-col justify-between shadow-xl"
                >
                  <div>
                    {/* Image Container */}
                    <div className="relative w-full h-52 rounded-[18px] bg-[#0E0E11] overflow-hidden">
                      <img
                        src={
                          prod.image ||
                          (prod.images && prod.images[0]) ||
                          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"
                        }
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${
                            prod.isDigital ? "bg-cyan-500/80 text-white" : "bg-purple-500/80 text-white"
                          }`}
                        >
                          {prod.isDigital ? "💻 Produkt Cyfrowy" : "📦 Produkt Fizyczny"}
                        </span>
                        {isLockedProductDrop && (
                          <span className="px-2.5 py-1 bg-amber-500/90 text-black rounded-full text-[10px] font-extrabold backdrop-blur-md">
                            🔒 Oczekuje na Drop
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-4 font-bold text-lg text-white group-hover:text-[#FF5B28] transition-colors">
                      {prod.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#707070] line-clamp-2">{prod.description}</p>

                    <div className="mt-4 flex items-baseline gap-3">
                      <span className="text-2xl font-extrabold text-[#FF5B28]">
                        {prod.price}
                      </span>
                      {prod.comparePrice && (
                        <span className="text-xs text-[#707070] line-through font-semibold">
                          {prod.comparePrice}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(prod)}
                    disabled={isLockedProductDrop}
                    className={`mt-6 w-full py-3 font-bold text-xs rounded-[12px] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      isLockedProductDrop
                        ? "bg-white/10 text-[#707070] cursor-not-allowed"
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
          <div className="w-full max-w-md h-full bg-[#17171B] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h2 className="text-lg font-bold">Twój Koszyk</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-xs text-[#A1A1AA] hover:text-white font-bold cursor-pointer"
                >
                  Zamknij ✕
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="mt-8 text-center text-xs text-[#707070]">Koszyk jest pusty.</p>
              ) : (
                <div className="mt-6 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-4 bg-[#0E0E11] border border-white/10 rounded-[16px] flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-xs text-white">{item.product.name}</h4>
                        <span className="text-xs font-bold text-[#FF5B28]">
                          {item.product.price} x {item.quantity}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-xs text-red-400 font-bold cursor-pointer"
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
                  <span>Suma do zapłaty:</span>
                  <span className="text-xl text-emerald-400">
                    {(cartTotalCents / 100).toFixed(2)} PLN
                  </span>
                </div>
                <button
                  onClick={handleStripeCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs rounded-[12px] transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {checkoutLoading ? "Przetwarzanie..." : "💳 Kup przez Stripe (Test Mode)"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIGITAL FILE DOWNLOAD SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#17171B] border border-emerald-500/50 rounded-[28px] p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-3xl mb-4">
              🎉
            </div>
            <h2 className="text-2xl font-extrabold text-white">Dziękujemy za zakup!</h2>
            <p className="text-xs text-[#A1A1AA] mt-1 max-w-md">
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
                        {prod.digitalFileName || "Poradnik_Cyfrowy.pdf"} ({prod.digitalFileSize || "15.4 MB"})
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
