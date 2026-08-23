"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import BackgroundVideo from "@/app/components/BackgroundVideo";
import type { Product, StoreConfig } from "@/app/context/AuthContext";
import { fetchStoreFromSupabase, fetchProductsFromSupabase } from "@/lib/supabase";
import { safeSetItem, safeGetItem } from "@/lib/storage";

const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80";

export class ProductErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn("[Product Card Error Boundary Caught]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export function extractProductImages(product: any): string[] {
  if (!product) return [DEFAULT_PRODUCT_IMAGE];
  try {
    const rawImages = product.images ?? product.image ?? product.imageUrl ?? product.image_url;
    let imageList: string[] = [];

    if (Array.isArray(rawImages)) {
      imageList = rawImages.filter((img): img is string => typeof img === "string" && img.trim().length > 0);
    } else if (typeof rawImages === "string" && rawImages.trim().length > 0) {
      const trimmed = rawImages.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            imageList = parsed.filter((img): img is string => typeof img === "string" && img.trim().length > 0);
          }
        } catch {
          imageList = [trimmed];
        }
      } else {
        imageList = [trimmed];
      }
    }

    if (imageList.length === 0) {
      const single = product.image || product.image_url || product.imageUrl;
      if (typeof single === "string" && single.trim().length > 0) {
        imageList = [single.trim()];
      }
    }

    if (imageList.length === 0) {
      imageList = [DEFAULT_PRODUCT_IMAGE];
    }

    return imageList;
  } catch {
    return [DEFAULT_PRODUCT_IMAGE];
  }
}

function ProductCardItem({
  prod,
  accentColor,
  selectedVariants,
  onSelectVariant,
  onOpenModal,
  onAddToCart,
}: {
  prod: any;
  accentColor: string;
  selectedVariants: { [productId: string]: string };
  onSelectVariant: (productId: string, variant: string) => void;
  onOpenModal: (prod: any) => void;
  onAddToCart: (prod: any) => void;
}) {
  if (!prod) return null;

  const isLockedProductDrop = Boolean(
    prod.isDropOnly &&
      prod.dropTargetDate &&
      !isNaN(new Date(prod.dropTargetDate).getTime()) &&
      new Date(prod.dropTargetDate).getTime() > Date.now()
  );

  const isDigital = Boolean(prod.isDigital || prod.type === "Cyfrowy");
  const isClothing = Boolean(!isDigital && prod.isClothing);
  const stock = typeof prod.stock === "number" ? prod.stock : (isDigital ? 999 : 0);
  const isSoldOut = !isDigital && stock <= 0;
  const currentVariant = selectedVariants[prod.id] || (Array.isArray(prod.variants) && prod.variants[0]) || "";
  const prodImgs = extractProductImages(prod);
  const mainCoverImg = prodImgs[0] || DEFAULT_PRODUCT_IMAGE;

  return (
    <div className="group p-5 bg-[#18181B] border border-white/10 hover:border-white/25 rounded-3xl transition-all flex flex-col justify-between shadow-xl">
      <div>
        {/* Image Container - Clickable to open modal */}
        <div
          onClick={() => onOpenModal(prod)}
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
            {isLockedProductDrop && !isSoldOut && (
              <span className="px-2.5 py-1 bg-amber-500 text-black rounded-full text-[10px] font-bold backdrop-blur-md">
                🔒 Drop Only
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
          onClick={() => onOpenModal(prod)}
          className="mt-4 font-bold text-base text-white group-hover:text-[#D0FF00] transition-colors cursor-pointer font-['Sora',sans-serif]"
        >
          {prod.name || "Produkt"}
        </h3>

        {/* Stan magazynowy / Dostępność */}
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
                Stan: <strong className="text-zinc-200">{stock} szt.</strong>
              </span>
            )}
          </span>
        </div>

        <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {prod.description || "Oryginalny produkt w ofercie sklepu."}
        </p>

        {/* Variant / Size Picker Pills - ONLY IF CLOTHING */}
        {isClothing && Array.isArray(prod.variants) && prod.variants.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block mb-1.5">
              Wybierz Rozmiar:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {prod.variants.map((v: string) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onSelectVariant(prod.id, v)}
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

        {/* CENA */}
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-2xl font-black font-mono" style={{ color: accentColor }}>
            {prod.price || "0.00 PLN"}
          </span>
          {prod.comparePrice && (
            <span className="text-xs text-zinc-500 line-through font-mono">
              {prod.comparePrice}
            </span>
          )}
        </div>
      </div>

      {/* PRZYCISKI AKCJI (ZOBACZ PRODUKT + DODAJ DO KOSZYKA) */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onOpenModal(prod)}
          className="py-2.5 px-3 bg-[#111319] hover:bg-[#181B24] border border-white/10 rounded-xl text-zinc-300 hover:text-white text-[13px] font-medium transition-colors cursor-pointer text-center"
        >
          Zobacz produkt
        </button>

        <button
          type="button"
          onClick={() => {
            if (isSoldOut) return;
            onAddToCart(prod);
          }}
          disabled={isLockedProductDrop || isSoldOut}
          className={`py-2.5 px-3 font-medium text-[13px] rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md ${
            isSoldOut ? "opacity-60 cursor-not-allowed bg-zinc-800 text-zinc-500" : "cursor-pointer"
          }`}
          style={{
            backgroundColor: isLockedProductDrop ? "rgba(255,255,255,0.1)" : isSoldOut ? undefined : accentColor,
            color: isLockedProductDrop ? "#71717A" : isSoldOut ? undefined : (accentColor === "#D0FF00" ? "#000" : "#FFF"),
          }}
        >
          <span>{isLockedProductDrop ? "🔒 Zablokowany" : isSoldOut ? "Wyprzedane" : "Do koszyka"}</span>
        </button>
      </div>
    </div>
  );
}

interface TenantStoreFrontProps {
  subdomain: string;
  initialStore?: any;
  initialProducts?: any[];
  searchParams?: { [key: string]: string | string[] | undefined };
}

export function TenantStoreFront({
  subdomain,
  initialStore,
  initialProducts = [],
  searchParams,
}: TenantStoreFrontProps) {
  const [asyncStore, setAsyncStore] = useState<StoreConfig | null>(initialStore || null);
  const [localFallbackStore, setLocalFallbackStore] = useState<StoreConfig | null>(null);
  const [isDBLoading, setIsDBLoading] = useState<boolean>(!initialStore);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [selectedVariants, setSelectedVariants] = useState<{ [productId: string]: string }>({});
  const [cart, setCart] = useState<{ product: Product; quantity: number; selectedVariant?: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [, setPurchasedDigitalItems] = useState<Product[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Product detail modal state
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [activeModalImageIdx, setActiveModalImageIdx] = useState<number>(0);

  // Checkout shipping & customer details
  const [checkoutEmail, setCheckoutEmail] = useState<string>("");
  const [checkoutName, setCheckoutName] = useState<string>("");
  const [checkoutPhone, setCheckoutPhone] = useState<string>("");
  const [checkoutShippingMethod, setCheckoutShippingMethod] = useState<"paczkomat" | "courier">("paczkomat");
  const [checkoutPaczkomat, setCheckoutPaczkomat] = useState<string>("");
  const [checkoutAddress, setCheckoutAddress] = useState<string>("");
  const [checkoutError, setCheckoutError] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle return from Stripe Checkout (?checkout=success or ?payment=success)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const isSuccess =
        params.get("checkout") === "success" ||
        params.get("payment") === "success" ||
        params.get("status") === "success" ||
        searchParams?.checkout === "success" ||
        searchParams?.payment === "success";
      const sessionId = params.get("session_id") || params.get("sessionId");
      const productId = params.get("product_id") || params.get("productId");

      if (isSuccess) {
        setCart([]);
        setIsCartOpen(false);
        setShowSuccessModal(true);

        if (subdomain) {
          fetch("/api/stores/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              storeId: asyncStore?.id || subdomain,
              tenantId: asyncStore?.id || subdomain,
              productId: productId || "order_prod",
              customerEmail: "klient@iskral.pl",
              amountTotalCents: 24900,
              stripeSessionId: sessionId || `cs_${Date.now()}`,
            }),
          }).catch(() => {});
        }

        try {
          window.history.replaceState(null, "", window.location.pathname);
        } catch {}
      }
    } catch (err) {
      console.warn("Stripe return handler warning:", err);
    }
  }, [subdomain, asyncStore?.id, searchParams]);

  // Track visits safely in background without blocking
  useEffect(() => {
    if (!subdomain || typeof window === "undefined") return;
    try {
      fetch("/api/stores/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain }),
      }).catch(() => {});
    } catch {}

    try {
      const visitKey = `iskra_visits_${subdomain}`;
      const cur = Number(safeGetItem(visitKey) || "0");
      safeSetItem(visitKey, String(cur + 1));
    } catch {}
  }, [subdomain]);

  // Load store & products if not passed from server
  useEffect(() => {
    if (initialStore) {
      setIsDBLoading(false);
      return;
    }

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
            console.error("Błąd ładowania produktów z bazy:", prodErr);
          }

          const mappedProducts: Product[] = Array.isArray(dbProducts)
            ? dbProducts.map((p: any) => {
                const isDig = Boolean(p?.is_digital || p?.type === "Cyfrowy");
                const hasClothing = Boolean(
                  p?.is_clothing ||
                    (Array.isArray(p?.variants) &&
                      p.variants.some((v: string) => ["XS", "S", "M", "L", "XL", "XXL"].includes(String(v).split(" ")[0])))
                );

                let parsedPriceCents = typeof p?.price_cents === "number" && p.price_cents > 0 ? p.price_cents : 0;
                if (parsedPriceCents === 0 && p?.price) {
                  const num = parseFloat(
                    String(p.price)
                      .replace(/[^0-9.,]/g, "")
                      .replace(",", ".")
                  );
                  if (!isNaN(num) && num > 0) {
                    parsedPriceCents = Math.round(num * 100);
                  }
                }
                if (parsedPriceCents === 0) {
                  parsedPriceCents = 24900;
                }

                const formattedPrice =
                  p?.price && (String(p.price).includes("PLN") || String(p.price).includes("zł"))
                    ? String(p.price)
                    : `${(parsedPriceCents / 100).toFixed(2)} PLN`;

                const imgs = extractProductImages(p);

                return {
                  id: p?.id || `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                  tenantId: dbData?.id || "",
                  categoryId: p?.category_id || undefined,
                  name: p?.name || "Produkt",
                  description: p?.description || "",
                  price: formattedPrice,
                  priceCents: parsedPriceCents,
                  comparePrice: p?.compare_price || undefined,
                  comparePriceCents: p?.compare_price_cents || undefined,
                  type: isDig ? "Cyfrowy" : "Fizyczny",
                  status: p?.status === "Nieaktywny" || p?.status === "Zawieszony" ? "Zawieszony" : "Aktywny",
                  isDropOnly: Boolean(p?.is_drop_only),
                  dropTargetDate: p?.drop_target_date || undefined,
                  sales: p?.sales ?? 0,
                  stock: typeof p?.stock === "number" ? Math.max(0, p.stock) : (isDig ? 999 : 50),
                  isClothing: !isDig && hasClothing,
                  variants: !isDig && hasClothing && Array.isArray(p?.variants) && p.variants.length > 0 ? p.variants : [],
                  image: imgs[0],
                  imageUrl: imgs[0],
                  images: imgs,
                  isDigital: isDig,
                  digitalFileName: p?.digital_file_name || undefined,
                  digitalFileSize: p?.digital_file_size || undefined,
                  digitalFileUrl: p?.digital_file_url || undefined,
                };
              })
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
            socials: typeof dbData?.social_links === "object" && dbData?.social_links !== null ? dbData.social_links : {},
            dropConfig:
              typeof dbData?.drop_config === "object" && dbData?.drop_config !== null
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
  }, [subdomain, initialStore]);

  // Client-side fallback from localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !subdomain) return;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k &&
          (k.startsWith("iskra_active_store_") ||
            k.startsWith("iskra_user_packages_") ||
            k.startsWith("iskra_stores_"))
        ) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            const list = Array.isArray(parsed) ? parsed : [parsed];
            const match = list.find(
              (item: any) => item?.subdomain?.toLowerCase() === subdomain || item?.id === subdomain
            );
            if (match) {
              const suffix = k
                .replace("iskra_active_store_", "")
                .replace("iskra_user_packages_", "")
                .replace("iskra_stores_", "");
              const prodsRaw = localStorage.getItem(`iskra_products_${suffix}`);
              let prods: any[] = [];
              if (prodsRaw) {
                try {
                  prods = JSON.parse(prodsRaw);
                } catch {
                  prods = [];
                }
              }
              setLocalFallbackStore({
                id: match.id || `st_${subdomain}`,
                name: match.storeName || match.name || `Sklep ${subdomain}`,
                subdomain: match.subdomain || subdomain,
                customDomain: "",
                domainVerified: false,
                logoUrl: match.logoUrl || "",
                description: match.description || "",
                announcement: match.announcement || match.description || "",
                niche: "Streetwear & E-Commerce",
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
                socials: match.socials || {},
              });
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Local storage fallback search error:", e);
    }
  }, [subdomain]);

  // Resolve targetStore
  const targetStore: StoreConfig | undefined = asyncStore || localFallbackStore || undefined;

  const isDropActive = Boolean(
    targetStore?.dropConfig?.enabled &&
      targetStore?.dropConfig?.targetDate &&
      !isNaN(new Date(targetStore.dropConfig.targetDate).getTime()) &&
      new Date(targetStore.dropConfig.targetDate).getTime() > Date.now()
  );

  // Drop mode timer effect
  useEffect(() => {
    if (!isDropActive || !targetStore?.dropConfig?.targetDate) return;
    const targetTime = new Date(targetStore.dropConfig.targetDate).getTime();
    if (isNaN(targetTime)) return;

    const calculateTime = () => {
      const now = Date.now();
      const diff = targetTime - now;

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

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [isDropActive, targetStore?.dropConfig?.targetDate]);

  const store = targetStore;
  const storeName = store?.name ?? `Sklep ${subdomain}`;
  const accentColor = store?.accentColor ?? "#D0FF00";
  const logoUrl = store?.logoUrl ?? "";
  const announcement = store?.announcement ?? "";
  const niche = store?.niche ?? "";
  const categories = Array.isArray(store?.categories) ? store.categories : [];
  const rawProducts = Array.isArray(store?.products) ? store.products : initialProducts || [];

  // Filter products by selected category
  const filteredProducts = rawProducts.filter((p) => {
    if (!p) return false;
    if (selectedCategoryId === "all") return true;
    return p.categoryId === selectedCategoryId;
  });

  const handleSelectVariant = (productId: string, variant: string) => {
    setSelectedVariants((prev) => ({ ...prev, [productId]: variant }));
  };

  const addToCart = (product: Product, chosenVariant?: string) => {
    if (!product) return;
    try {
      if (
        product.isDropOnly &&
        product.dropTargetDate &&
        !isNaN(new Date(product.dropTargetDate).getTime()) &&
        new Date(product.dropTargetDate).getTime() > Date.now()
      ) {
        alert("Ten produkt wyjdzie dopiero w dniu premiery dropu!");
        return;
      }

      const isDigital = Boolean(product.isDigital || product.type === "Cyfrowy");
      const stock = typeof product.stock === "number" ? product.stock : (isDigital ? 999 : 0);
      if (!isDigital && stock <= 0) {
        alert("Przepraszamy, ten produkt został wyprzedany!");
        return;
      }

      const isClothing = Boolean(!isDigital && product.isClothing);
      const finalVariant = isClothing
        ? chosenVariant || selectedVariants[product.id] || (Array.isArray(product.variants) && product.variants[0]) || undefined
        : undefined;

      setCart((prev) => {
        const safePrev = Array.isArray(prev) ? prev : [];
        const existing = safePrev.find(
          (item) => item?.product?.id === product.id && item?.selectedVariant === finalVariant
        );
        if (existing) {
          return safePrev.map((item) =>
            item?.product?.id === product.id && item?.selectedVariant === finalVariant
              ? { ...item, quantity: (item.quantity || 1) + 1 }
              : item
          );
        }
        return [...safePrev, { product, quantity: 1, selectedVariant: finalVariant }];
      });
      setIsCartOpen(true);
    } catch (e) {
      console.warn("Błąd dodawania do koszyka:", e);
    }
  };

  const removeFromCart = (productId: string, selectedVariant?: string) => {
    setCart((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (item) => !(item?.product?.id === productId && item?.selectedVariant === selectedVariant)
      )
    );
  };

  const cartTotalCents = (Array.isArray(cart) ? cart : []).reduce((sum, item) => {
    if (!item?.product) return sum;
    let pCents = item.product.priceCents;
    if (!pCents || pCents <= 0) {
      if (item.product.price) {
        const parsed = parseFloat(String(item.product.price).replace(/[^0-9.,]/g, "").replace(",", "."));
        if (!isNaN(parsed) && parsed > 0) pCents = Math.round(parsed * 100);
      }
    }
    return sum + (pCents || 24900) * (item.quantity || 1);
  }, 0);

  const hasPhysicalItems = cart.some(
    (item) => !item.product.isDigital && item.product.type !== "Cyfrowy"
  );

  const handleStripeCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!checkoutEmail.trim() || !emailRegex.test(checkoutEmail.trim())) {
      setCheckoutError("Podaj poprawny adres e-mail do zamówienia.");
      return;
    }

    if (hasPhysicalItems) {
      if (!checkoutName.trim()) {
        setCheckoutError("Podaj imię i nazwisko odbiorcy.");
        return;
      }
      if (!checkoutPhone.trim() || checkoutPhone.trim().length < 7) {
        setCheckoutError("Podaj numer telefonu (niezbędny dla kuriera / InPost).");
        return;
      }
      if (checkoutShippingMethod === "paczkomat" && !checkoutPaczkomat.trim()) {
        setCheckoutError("Podaj kod lub adres Paczkomatu InPost (np. KRA01M).");
        return;
      }
      if (checkoutShippingMethod === "courier" && !checkoutAddress.trim()) {
        setCheckoutError("Podaj pełny adres doręczenia (ulica, nr, kod pocztowy, miasto).");
        return;
      }
    }

    setCheckoutLoading(true);

    try {
      const firstItem = cart[0]?.product;
      const itemsPayload = cart.map((i) => ({
        productId: i.product.id,
        title: i.product.name,
        quantity: i.quantity || 1,
        selectedVariant: i.selectedVariant || "",
        amountCents: (i.product.priceCents || 0) * (i.quantity || 1),
      }));

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: store?.id || `t_${subdomain}`,
          storeId: store?.id || `t_${subdomain}`,
          productId: firstItem?.id || "order_prod",
          title: `${storeName} - Zamówienie (${cart.length} przedm.)`,
          priceCents: cartTotalCents,
          customerEmail: checkoutEmail.trim(),
          customerName: checkoutName.trim(),
          customerPhone: checkoutPhone.trim(),
          shippingType: hasPhysicalItems ? checkoutShippingMethod : "digital",
          paczkomatCode: hasPhysicalItems && checkoutShippingMethod === "paczkomat" ? checkoutPaczkomat.trim().toUpperCase() : undefined,
          shippingAddress: hasPhysicalItems && checkoutShippingMethod === "courier" ? checkoutAddress.trim() : undefined,
          selectedVariant: cart[0]?.selectedVariant || "",
          items: itemsPayload,
          action: "buy_product",
        }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      // Fallback local / manual order recording
      if (store?.id && firstItem?.id) {
        fetch("/api/stores/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId: store.id,
            tenantId: store.id,
            productId: firstItem.id,
            productTitle: firstItem.name,
            customerEmail: checkoutEmail.trim(),
            customerName: checkoutName.trim(),
            customerPhone: checkoutPhone.trim(),
            shippingType: hasPhysicalItems ? checkoutShippingMethod : "digital",
            paczkomatCode: hasPhysicalItems && checkoutShippingMethod === "paczkomat" ? checkoutPaczkomat.trim().toUpperCase() : undefined,
            shippingAddress: hasPhysicalItems && checkoutShippingMethod === "courier" ? checkoutAddress.trim() : undefined,
            amountTotalCents: cartTotalCents,
            items: itemsPayload,
          }),
        }).catch(() => {});
      }

      setCart([]);
      setIsCartOpen(false);
      setShowSuccessModal(true);
    } catch (checkoutErr) {
      console.error("Błąd podczas realizacji zamówienia Stripe:", checkoutErr);
      setCheckoutError("Wystąpił problem z realizacją zamówienia. Spróbuj ponownie.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isStoreActive = targetStore
    ? (targetStore as any).is_active !== false &&
      (targetStore as any).isActive !== false &&
      targetStore.status !== "canceled" &&
      targetStore.status !== "suspended" &&
      targetStore.planStatus !== "canceled" &&
      targetStore.planStatus !== "suspended"
    : false;

  // Initial mounting state
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0E0E11] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-white/10 border-t-[#D0FF00] rounded-full animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Ładowanie sklepu: {subdomain || "wczytywanie"}...</span>
        </div>
      </div>
    );
  }

  // Suspended store screen
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
          <p className="text-zinc-400 text-sm leading-relaxed font-['Poppins',sans-serif]">
            Okres rozliczeniowy lub darmowy trial tego sklepu dobiegł końca. Subdomena oraz zasoby sklepu pozostają zarezerwowane dla właściciela.
          </p>
          <div className="pt-2 flex flex-col gap-3 font-['Poppins',sans-serif]">
            <a
              href="https://iskral.pl/logowanie"
              className="w-full py-3.5 px-6 rounded-xl bg-[#D0FF00] hover:bg-[#bce600] text-black font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 text-center"
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

  // Not found
  if (!isDBLoading && !targetStore) {
    return (
      <div className="min-h-screen bg-[#0A0B0D] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-2xl mb-4">
          🏪
        </div>
        <h1 className="text-2xl font-bold font-['Sora',sans-serif]">Sklep nie został jeszcze aktywowany</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-md font-['Poppins',sans-serif]">
          Subdomena <strong className="text-[#D0FF00] font-mono">{subdomain}</strong> oczekuje na dokończenie konfiguracji w panelu użytkownika.
        </p>
        <div className="mt-6 flex items-center gap-3 font-['Poppins',sans-serif]">
          <Link
            href="https://iskral.pl/dashboard"
            className="px-6 py-3 bg-[#D0FF00] hover:bg-[#bce600] text-black text-sm font-medium rounded-xl transition shadow-sm"
          >
            Przejdź do Panelu Klienta
          </Link>
        </div>
      </div>
    );
  }

  // FULLSCREEN DROP MODE COUNTDOWN SCREEN
  if (isDropActive && store) {
    return (
      <main className="relative min-h-screen w-full bg-[#08080A] text-white flex flex-col items-center justify-center p-6 overflow-hidden select-none">
        <BackgroundVideo />

        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-20"
          style={{ backgroundColor: accentColor }}
        />

        <div className="relative z-10 flex flex-col items-center max-w-2xl w-full text-center">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="h-16 w-auto max-w-[240px] object-contain mb-6 drop-shadow-2xl" />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-2xl"
              style={{ backgroundColor: accentColor, color: accentColor === "#D0FF00" ? "#000" : "#FFF" }}
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
            {store?.description || "Przygotuj się na unikalny drop. Zapisz się do powiadomień lub bądź gotowy przed wyprzedaniem asortymentu."}
          </p>

          <div className="grid grid-cols-4 gap-3 sm:gap-6 w-full max-w-lg mb-10">
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
              <span className="text-2xl sm:text-5xl font-black font-mono text-white">{isMounted ? String(timeLeft.days).padStart(2, "0") : "00"}</span>
              <span className="text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider" style={{ color: accentColor }}>DNI</span>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
              <span className="text-2xl sm:text-5xl font-black font-mono text-white">{isMounted ? String(timeLeft.hours).padStart(2, "0") : "00"}</span>
              <span className="text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider" style={{ color: accentColor }}>GODZ</span>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
              <span className="text-2xl sm:text-5xl font-black font-mono text-white">{isMounted ? String(timeLeft.minutes).padStart(2, "0") : "00"}</span>
              <span className="text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider" style={{ color: accentColor }}>MIN</span>
            </div>
            <div className="flex flex-col items-center p-4 sm:p-6 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
              <span className="text-2xl sm:text-5xl font-black font-mono text-white">{isMounted ? String(timeLeft.seconds).padStart(2, "0") : "00"}</span>
              <span className="text-[10px] sm:text-xs mt-2 font-black uppercase tracking-wider" style={{ color: accentColor }}>SEK</span>
            </div>
          </div>

          <div className="p-4 bg-[#090A0C]/80 border border-white/10 rounded-2xl text-xs text-zinc-400 flex items-center gap-2">
            <span>🔒</span>
            <span>Zapraszamy w dniu premiery: <strong>{isMounted && targetStore?.dropConfig?.targetDate ? new Date(targetStore.dropConfig.targetDate).toLocaleString("pl-PL") : "Wkrótce"}</strong></span>
          </div>
        </div>
      </main>
    );
  }

  // LIVE PUBLIC STOREFRONT SCREEN
  const socials = store?.socials || {};

  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col pb-24 font-sans selection:bg-[#D0FF00] selection:text-black">
      <BackgroundVideo />

      {/* Announcement Top Bar */}
      {announcement && (
        <div
          className="relative z-20 w-full py-2.5 text-center text-xs font-black tracking-wide shadow-md font-['Poppins',sans-serif]"
          style={{ backgroundColor: accentColor, color: accentColor === "#D0FF00" ? "#000" : "#FFF" }}
        >
          {announcement}
        </div>
      )}

      {/* Navbar Header */}
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
              {niche ? `${niche} • Oficjalny Sklep` : "Oficjalny Sklep Internetowy"}
            </span>
          </div>
        </div>

        {/* Social Media & Cart */}
        <div className="flex items-center gap-3 font-['Poppins',sans-serif]">
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
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="px-4 py-2 bg-[#18181B] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <span>🛒 Koszyk</span>
            {cart.length > 0 && (
              <span
                className="w-5 h-5 rounded-full text-black text-[11px] font-bold flex items-center justify-center shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                {cart.reduce((s, i) => s + (i.quantity || 1), 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 xl:px-[140px] pt-8 flex flex-col gap-8">
        {/* Category Filter Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 font-['Poppins',sans-serif]">
            <button
              type="button"
              onClick={() => setSelectedCategoryId("all")}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryId === "all"
                  ? "text-black shadow-lg font-bold"
                  : "bg-[#18181B] text-zinc-400 hover:text-white border border-white/10"
              }`}
              style={{
                backgroundColor: selectedCategoryId === "all" ? accentColor : undefined,
                boxShadow: selectedCategoryId === "all" ? `0 10px 15px -3px ${accentColor}40` : undefined,
              }}
            >
              Wszystkie Produkty ({rawProducts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategoryId === cat.id
                    ? "text-black shadow-lg font-bold"
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

        {/* Product Grid with Error Boundaries */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center bg-[#18181B] border border-white/10 rounded-3xl font-['Poppins',sans-serif]">
            <span className="text-4xl block mb-3">📦</span>
            <h3 className="text-lg font-bold text-white">Brak produktów w tej kategorii</h3>
            <p className="text-xs text-zinc-400 mt-1">Wkrótce pojawią się tutaj nowe przedmioty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-['Poppins',sans-serif]">
            {filteredProducts.map((prod) => {
              if (!prod) return null;
              return (
                <ProductErrorBoundary key={prod.id || String(Math.random())}>
                  <ProductCardItem
                    prod={prod}
                    accentColor={accentColor}
                    selectedVariants={selectedVariants}
                    onSelectVariant={handleSelectVariant}
                    onOpenModal={(p) => {
                      setSelectedProductModal(p);
                      setActiveModalImageIdx(0);
                    }}
                    onAddToCart={addToCart}
                  />
                </ProductErrorBoundary>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL SZCZEGÓŁÓW PRODUKTU (WIĘCEJ ZDJĘĆ, DUŻY OPIS, STAN MAGAZYNOWY, KUPNO) */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#18181B] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedProductModal(null)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-['Poppins',sans-serif]">
              {/* Lewa kolumna: Galeria zdjęć */}
              <div className="space-y-3">
                {(() => {
                  const modalImgs = extractProductImages(selectedProductModal);
                  const activeImg = modalImgs[activeModalImageIdx] || modalImgs[0] || DEFAULT_PRODUCT_IMAGE;

                  return (
                    <>
                      <div className="w-full h-80 sm:h-96 rounded-2xl bg-[#0E0E11] overflow-hidden relative border border-white/10">
                        <img
                          src={activeImg}
                          alt={selectedProductModal.name || "Produkt"}
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

              {/* Prawa kolumna: Tytuł, opis, stan, warianty, dodawanie do koszyka */}
              <div className="flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Sora',sans-serif]">
                      {selectedProductModal.name || "Produkt"}
                    </h2>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-3xl font-black font-mono" style={{ color: accentColor }}>
                        {selectedProductModal.price || "0.00 PLN"}
                      </span>
                      {selectedProductModal.comparePrice && (
                        <span className="text-sm text-zinc-500 line-through font-mono">
                          {selectedProductModal.comparePrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stan magazynowy / Dostępność */}
                  <div className="p-3.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs flex items-center justify-between">
                    <span className="text-zinc-400">Dostępność produktu:</span>
                    <span className="font-semibold text-white">
                      {selectedProductModal.isDigital || selectedProductModal.type === "Cyfrowy" ? (
                        <span className="text-emerald-400 font-bold">⚡ Plik gotowy do pobrania od ręki</span>
                      ) : typeof selectedProductModal.stock === "number" && selectedProductModal.stock <= 0 ? (
                        <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md">
                          🚫 Wyprzedane
                        </span>
                      ) : (
                        <span>
                          W magazynie: <strong className="text-[#D0FF00] font-mono">{typeof selectedProductModal.stock === "number" ? selectedProductModal.stock : 50} sztuk</strong>
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Rozmiary jeśli odzież */}
                  {selectedProductModal.isClothing &&
                    Array.isArray(selectedProductModal.variants) &&
                    selectedProductModal.variants.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                          Wybierz rozmiar:
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedProductModal.variants.map((v: string) => {
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

                  {/* Długi opis produktu */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-zinc-300 block uppercase tracking-wider">
                      Opis i specyfikacja:
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line bg-[#0E0E11]/60 p-4 rounded-2xl border border-white/5 max-h-48 overflow-y-auto">
                      {selectedProductModal.description || "Brak dodatkowego opisu dla tego produktu."}
                    </p>
                  </div>
                </div>

                {/* Przyciski zakupowe */}
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
                          isModalSoldOut ? "opacity-50 cursor-not-allowed bg-zinc-800 text-zinc-500" : "cursor-pointer"
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

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-[#18181B] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl font-['Poppins',sans-serif]">
            <div className="overflow-y-auto pr-1 flex-1">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-bold text-base text-white font-['Sora',sans-serif]">
                  Twój Koszyk ({cart.reduce((s, i) => s + (i.quantity || 1), 0)})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500">
                    <p className="text-xs">Twój koszyk jest pusty.</p>
                  </div>
                ) : (
                  cart.map((item, idx) => {
                    const prodImg = extractProductImages(item?.product)[0] || DEFAULT_PRODUCT_IMAGE;
                    return (
                      <div
                        key={`${item?.product?.id}_${item?.selectedVariant || ""}_${idx}`}
                        className="flex items-center justify-between p-3.5 bg-[#0E0E11] border border-white/5 rounded-2xl gap-3"
                      >
                        <div className="w-14 h-14 rounded-xl bg-black/50 overflow-hidden shrink-0">
                          <img
                            src={prodImg}
                            alt={item?.product?.name || "Produkt"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate font-['Sora',sans-serif]">
                            {item?.product?.name || "Produkt"}
                          </h4>
                          {item?.selectedVariant && (
                            <span className="text-[10px] text-zinc-400 font-mono block">
                              Rozmiar: <strong>{item.selectedVariant}</strong>
                            </span>
                          )}
                          <span className="text-xs font-mono font-bold" style={{ color: accentColor }}>
                            {item?.product?.price || "0.00 PLN"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-400">x{item?.quantity || 1}</span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item?.product?.id, item?.selectedVariant)}
                            className="text-zinc-500 hover:text-rose-400 text-xs p-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Formularz danych do zamówienia i wysyłki */}
              {cart.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                      Adres e-mail *
                    </label>
                    <input
                      type="email"
                      value={checkoutEmail}
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      placeholder="twoj@email.com"
                      className="w-full px-3.5 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00] transition-colors"
                      required
                    />
                    <span className="text-[10px] text-zinc-500 block mt-0.5">
                      Na ten adres otrzymasz potwierdzenie zakupu oraz powiadomienia o wysyłce.
                    </span>
                  </div>

                  {hasPhysicalItems && (
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                          Dostawa i dane odbiorcy
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">Darmowa dostawa</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-medium text-zinc-400 block mb-1">
                            Imię i nazwisko *
                          </label>
                          <input
                            type="text"
                            value={checkoutName}
                            onChange={(e) => setCheckoutName(e.target.value)}
                            placeholder="Jan Kowalski"
                            className="w-full px-3 py-2 bg-[#0E0E11] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-zinc-400 block mb-1">
                            Telefon (dla kuriera / InPost) *
                          </label>
                          <input
                            type="tel"
                            value={checkoutPhone}
                            onChange={(e) => setCheckoutPhone(e.target.value)}
                            placeholder="np. 500 123 456"
                            className="w-full px-3 py-2 bg-[#0E0E11] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00]"
                          />
                        </div>
                      </div>

                      {/* Wybór metody dostawy */}
                      <div>
                        <label className="text-[10px] font-medium text-zinc-400 block mb-1">
                          Wybierz sposób dostawy:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setCheckoutShippingMethod("paczkomat")}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left flex items-center justify-between ${
                              checkoutShippingMethod === "paczkomat"
                                ? "bg-[#0E0E11] border-[#D0FF00] text-white"
                                : "bg-[#0E0E11]/40 border-white/5 text-zinc-400 hover:text-white"
                            }`}
                          >
                            <span>📦 Paczkomat</span>
                            {checkoutShippingMethod === "paczkomat" && <span className="text-[#D0FF00]">✓</span>}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCheckoutShippingMethod("courier")}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left flex items-center justify-between ${
                              checkoutShippingMethod === "courier"
                                ? "bg-[#0E0E11] border-[#D0FF00] text-white"
                                : "bg-[#0E0E11]/40 border-white/5 text-zinc-400 hover:text-white"
                            }`}
                          >
                            <span>🚚 Kurier</span>
                            {checkoutShippingMethod === "courier" && <span className="text-[#D0FF00]">✓</span>}
                          </button>
                        </div>
                      </div>

                      {/* Pole zależne od wybranej metody dostawy */}
                      {checkoutShippingMethod === "paczkomat" ? (
                        <div>
                          <label className="text-[10px] font-medium text-zinc-400 block mb-1">
                            Kod Paczkomatu InPost *
                          </label>
                          <input
                            type="text"
                            value={checkoutPaczkomat}
                            onChange={(e) => setCheckoutPaczkomat(e.target.value.toUpperCase())}
                            placeholder="np. KRA01M lub WAW22A"
                            className="w-full px-3 py-2 bg-[#0E0E11] border border-white/10 rounded-xl text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00]"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-medium text-zinc-400 block mb-1">
                            Adres dostawy (Ulica, nr, kod pocztowy, miasto) *
                          </label>
                          <input
                            type="text"
                            value={checkoutAddress}
                            onChange={(e) => setCheckoutAddress(e.target.value)}
                            placeholder="ul. Marszałkowska 10/2, 00-001 Warszawa"
                            className="w-full px-3 py-2 bg-[#0E0E11] border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Błąd walidacji */}
                  {checkoutError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-[11px] text-rose-400 font-medium">
                      ⚠️ {checkoutError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Summary & Checkout */}
            <div className="pt-4 border-t border-white/10 space-y-3 mt-4">
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
                {checkoutLoading ? "Przekierowanie do kasy..." : "Zapłać teraz (Stripe / BLIK)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181B] border border-white/10 p-6 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white font-['Sora',sans-serif]">Dziękujemy za zamówienie!</h3>
            <p className="text-xs text-zinc-400">
              Płatność została zaksięgowana. Potwierdzenie wysłaliśmy na podany adres e-mail.
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#D0FF00] hover:bg-[#bce600] text-black font-bold text-xs transition-colors cursor-pointer"
            >
              Wróć do sklepu
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

