"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, Product, Category, PlanType, StoreConfig, TeamMember, Campaign, ServicePackage, User } from "../context/AuthContext";
import { getStoreUrl } from "@/lib/cookies";
import { checkSubdomainAvailability } from "@/lib/supabase";
import {
  Home,
  ShoppingBag,
  Layers,
  Settings as SettingsIcon,
  Package,
  BarChart3,
  Globe,
  Wallet,
  Mail,
  Users,
  Flame,
  Search,
  Plus,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Edit,
  Trash2,
  Upload,
  Camera,
  X,
  Sparkles,
  AlertTriangle,
  Lock,
  Unlock,
  ShieldCheck,
  Smartphone,
  QrCode,
  LogOut,
  CreditCard,
  TrendingUp,
  FileText,
  DollarSign,
  Eye,
  Crown,
  Share2,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const {
    user,
    allUsers,
    activeStore,
    userStores,
    setActiveStoreId,
    isImpersonating,
    isEditUnlocked,
    exitImpersonation,
    toggleImpersonationEdit,
    logout,
    buyPlan,
    updateUserProfile,
    toggle2FA,
    updateStoreConfig,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    addCategory,
    deleteCategory,
    connectStripe,
    requestPayoutWithIBAN,
    configureDrop,
    recordOrder,
    message,
    setMessage,
    createOrUpdateStoreFull,
  } = useAuth();

  const router = useRouter();

  // Navigation state:
  // "home" (Strona główna)
  // "shop" (Sklep - kupno pakietu)
  // "templates" (Szablony)
  // "settings" (Ustawienia konta)
  // Store tabs: "editor", "stats", "products", "orders", "domain", "balance", "newsletter", "team", "drop", "seo"
  const [activeNav, setActiveNav] = useState<string>("home");

  // Selected Service / Store
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // Configuration Modal state (Kreator Konfiguracji Sklepu)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configService, setConfigService] = useState<ServicePackage | null>(null);

  // Store Configuration Form State
  const [cfgName, setCfgName] = useState("");
  const [cfgSubdomain, setCfgSubdomain] = useState("");
  const [cfgDescription, setCfgDescription] = useState("");
  const [cfgLogo, setCfgLogo] = useState<string>("");
  const [cfgTemplate, setCfgTemplate] = useState("Dark Vibe");
  const [cfgColor, setCfgColor] = useState("#FF5B28");
  const [cfgShowSocials, setCfgShowSocials] = useState(true);
  const [cfgInstagram, setCfgInstagram] = useState("");
  const [cfgTiktok, setCfgTiktok] = useState("");
  const [cfgYoutube, setCfgYoutube] = useState("");
  const [cfgX, setCfgX] = useState("");
  const [cfgDiscord, setCfgDiscord] = useState("");
  const [cfgFacebook, setCfgFacebook] = useState("");
  const [cfgSubdomainAvailable, setCfgSubdomainAvailable] = useState<boolean | null>(null);
  const [cfgCheckingSubdomain, setCfgCheckingSubdomain] = useState(false);

  // Product modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("149.00");
  const [prodComparePrice, setProdComparePrice] = useState("199.00");
  const [prodType, setProdType] = useState<"Fizyczny" | "Cyfrowy">("Fizyczny");
  const [prodStock, setProdStock] = useState("50");
  const [prodVariants, setProdVariants] = useState<string[]>(["S", "M", "L", "XL"]);
  const [prodVariantInput, setProdVariantInput] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodStatus, setProdStatus] = useState<"Aktywny" | "Zawieszony">("Aktywny");
  const [prodSearch, setProdSearch] = useState("");

  // Copy Link State
  const [linkCopied, setLinkCopied] = useState(false);

  // User Profile Settings State
  const [profName, setProfName] = useState(user?.name || "");
  const [profEmail, setProfEmail] = useState(user?.email || "");
  const [profPhone, setProfPhone] = useState(user?.phone || "");
  const [profStreet, setProfStreet] = useState(user?.address?.street || "ul. Nowogrodzka 42/12");
  const [profZip, setProfZip] = useState(user?.address?.zip || "00-695");
  const [profCity, setProfCity] = useState(user?.address?.city || "Warszawa");
  const [profCountry, setProfCountry] = useState(user?.address?.country || "Polska");
  const [profAvatar, setProfAvatar] = useState(user?.avatarUrl || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [totpInput, setTotpInput] = useState("");
  const totpSecret = "ISKRAL2FASEC2026KEY";
  const totpQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `otpauth://totp/Iskral.pl:${user?.email || "klient@iskral.pl"}?secret=${totpSecret}&issuer=Iskral.pl`
  )}`;

  // Drop Mode Settings State
  const [dropEnabled, setDropEnabled] = useState(false);
  const [dropDate, setDropDate] = useState("");
  const [dropTemplate, setDropTemplate] = useState<"Cyberpunk Launch" | "Minimalist Timer" | "Hypebeast Countdown">("Cyberpunk Launch");

  // Payout State
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutIban, setPayoutIban] = useState("PL 12 1020 4900 0000 1234 5678 9012");

  // Team & Newsletter State
  const [teamEmail, setTeamEmail] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");

  // Top User Pill Menu
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state with activeStore & user
  useEffect(() => {
    if (user) {
      setProfName(user.name || "");
      setProfEmail(user.email || "");
      setProfPhone(user.phone || "");
      setProfStreet(user.address?.street || "ul. Nowogrodzka 42/12");
      setProfZip(user.address?.zip || "00-695");
      setProfCity(user.address?.city || "Warszawa");
      setProfCountry(user.address?.country || "Polska");
      setProfAvatar(user.avatarUrl || "");
    }
  }, [user]);

  const currentStore: StoreConfig = activeStore || userStores[0] || {
    id: "default",
    name: "Mój Sklep",
    subdomain: "mojsklep",
    customDomain: "",
    domainVerified: false,
    template: "Dark Vibe",
    accentColor: "#FF5B28",
    stripeStatus: "connected",
    balanceCents: 0,
    planType: user?.plan || "Start",
    planStatus: "active",
    announcement: "",
    socials: { instagram: "", tiktok: "", youtube: "", x: "" },
    dropConfig: { enabled: false, template: "Cyberpunk Launch", targetDate: "" },
    categories: [],
    products: [],
    orders: [],
    payoutHistory: [],
    customers: [],
    campaigns: [],
    team: [],
  };

  useEffect(() => {
    if (currentStore) {
      setDropEnabled(Boolean(currentStore.dropConfig?.enabled));
      setDropDate(currentStore.dropConfig?.targetDate || "");
      setDropTemplate(currentStore.dropConfig?.template || "Cyberpunk Launch");
    }
  }, [currentStore.id]);

  // Live subdomain check in config modal
  useEffect(() => {
    if (!cfgSubdomain || cfgSubdomain.trim().length < 2) {
      setCfgSubdomainAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCfgCheckingSubdomain(true);
      const res = await checkSubdomainAvailability(cfgSubdomain);
      setCfgSubdomainAvailable(res.available);
      setCfgCheckingSubdomain(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [cfgSubdomain]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen w-full bg-[#F4F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-[#F4F5F7] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-8 text-center max-w-md shadow-lg space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900">Brak Dostępu</h2>
          <p className="text-xs text-zinc-500">Zaloguj się, aby uzyskać dostęp do panelu klienta.</p>
          <Link
            href="/logowanie"
            className="inline-block px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs shadow-md transition-all"
          >
            Przejdź do logowania →
          </Link>
        </div>
      </main>
    );
  }

  // Determine user packages & stores:
  const userServices: ServicePackage[] = user.services || [];
  const hasPurchasedPackages = userServices.length > 0 || (user.plan && user.plan !== "Brak");
  const hasConfiguredStore = userStores.length > 0 && user.hasStore;

  // Derive unassigned packages
  const unassignedServices = userServices.filter((s) => s.status === "Nieprzypisany");

  // Fallback synthetic service if user has plan but no services array yet
  const displayServices: ServicePackage[] = userServices.length > 0
    ? userServices
    : user.plan && user.plan !== "Brak"
    ? [
        {
          id: "srv_active",
          number: 442,
          title: `Pakiet ${user.plan} #442`,
          planType: user.plan,
          status: hasConfiguredStore ? "Przypisany" : "Nieprzypisany",
          assignedStoreId: currentStore?.id,
          assignedStoreName: currentStore?.name,
          assignedSubdomain: currentStore?.subdomain,
          expiresAt: "21.09.2026, godz. 00:02",
          createdAt: user.createdAt,
        },
      ]
    : [];

  const handleStartConfiguration = (service: ServicePackage) => {
    setConfigService(service);
    setCfgName(user?.name ? `Sklep ${user.name}` : "Dropwear Club");
    setCfgSubdomain((user?.name || "sklep").toLowerCase().replace(/[^a-z0-9]/g, "") || "dropwear");
    setCfgDescription("Oficjalny sklep z unikalnymi dropami i kolekcjami.");
    setCfgLogo("");
    setCfgTemplate("Dark Vibe");
    setCfgColor("#FF5B28");
    setCfgShowSocials(true);
    setShowConfigModal(true);
  };

  const handleLogoFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCfgLogo(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProfAvatar(e.target.result as string);
        updateUserProfile({ avatarUrl: e.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProductImageUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setProdImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinishStoreConfiguration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfgName.trim()) {
      alert("Wpisz nazwę sklepu.");
      return;
    }
    if (!cfgSubdomain.trim()) {
      alert("Wpisz subdomenę sklepu.");
      return;
    }

    const created = createOrUpdateStoreFull({
      name: cfgName,
      subdomain: cfgSubdomain,
      niche: "Moda & Streetwear",
      logoUrl: cfgLogo,
      template: cfgTemplate,
      accentColor: cfgColor,
      announcement: "🎉 Nowa kolekcja już dostępna online!",
      plan: configService?.planType || user.plan || "Brand",
      billingCycle: "miesiac",
    });

    // Update store with socials & showSocials
    updateStoreConfig({
      showSocials: cfgShowSocials,
      socials: {
        instagram: cfgInstagram,
        tiktok: cfgTiktok,
        youtube: cfgYoutube,
        x: cfgX,
        discord: cfgDiscord,
        facebook: cfgFacebook,
      },
    });

    setShowConfigModal(false);
    setActiveNav("editor");
    setMessage({
      type: "success",
      text: `🎉 Sklep ${cfgName} został pomyślnie utworzony pod adresem: https://${cfgSubdomain}.iskral.pl`,
    });
  };

  // Products handlers
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProdName("");
    setProdPrice("149.00");
    setProdComparePrice("199.00");
    setProdType("Fizyczny");
    setProdStock("50");
    setProdVariants(["S", "M", "L", "XL"]);
    setProdDescription("");
    setProdImage("");
    setProdStatus("Aktywny");
    setShowProductModal(true);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdPrice(p.price.replace(" PLN", "").trim());
    setProdComparePrice(p.comparePrice ? p.comparePrice.replace(" PLN", "").trim() : "");
    setProdType(p.type);
    setProdStock(String(p.stock !== undefined ? p.stock : 50));
    setProdVariants(p.variants && p.variants.length > 0 ? p.variants : ["S", "M", "L", "XL"]);
    setProdDescription(p.description || "");
    setProdImage(p.image || (p.images && p.images[0]) || "");
    setProdStatus(p.status === "Zawieszony" ? "Zawieszony" : "Aktywny");
    setShowProductModal(true);
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert("Wpisz nazwę produktu.");
      return;
    }

    const cleanPrice = prodPrice.replace(",", ".").replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(cleanPrice) || 10;
    const priceCents = Math.round(priceNum * 100);

    const cleanComparePrice = prodComparePrice ? prodComparePrice.replace(",", ".").replace(/[^0-9.]/g, "") : "";
    const comparePriceNum = parseFloat(cleanComparePrice) || 0;
    const comparePriceCents = comparePriceNum > 0 ? Math.round(comparePriceNum * 100) : undefined;

    const defaultImg = prodType === "Cyfrowy"
      ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
      : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80";

    if (editingProductId) {
      updateProduct(editingProductId, {
        name: prodName,
        description: prodDescription,
        price: `${priceNum.toFixed(2)} PLN`,
        priceCents,
        comparePrice: comparePriceCents ? `${comparePriceNum.toFixed(2)} PLN` : undefined,
        comparePriceCents,
        type: prodType,
        status: prodStatus,
        stock: parseInt(prodStock) || 50,
        variants: prodVariants,
        image: prodImage || defaultImg,
        images: [prodImage || defaultImg],
        isDigital: prodType === "Cyfrowy",
      });
      setMessage({ type: "success", text: `Zaktualizowano produkt: ${prodName}` });
    } else {
      addProduct({
        name: prodName,
        description: prodDescription,
        price: `${priceNum.toFixed(2)} PLN`,
        priceCents,
        comparePrice: comparePriceCents ? `${comparePriceNum.toFixed(2)} PLN` : undefined,
        comparePriceCents,
        type: prodType,
        status: prodStatus,
        stock: parseInt(prodStock) || 50,
        variants: prodVariants,
        image: prodImage || defaultImg,
        images: [prodImage || defaultImg],
        isDigital: prodType === "Cyfrowy",
      });
    }
    setShowProductModal(false);
  };

  const handleAddVariant = () => {
    const val = prodVariantInput.trim().toUpperCase();
    if (val && !prodVariants.includes(val)) {
      setProdVariants([...prodVariants, val]);
      setProdVariantInput("");
    }
  };

  const handleRemoveVariant = (variant: string) => {
    setProdVariants(prodVariants.filter((v) => v !== variant));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: profName,
      phone: profPhone,
      address: {
        street: profStreet,
        zip: profZip,
        city: profCity,
        country: profCountry,
      },
      avatarUrl: profAvatar,
    });
  };

  const handleSaveDropSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreConfig({
      dropConfig: {
        enabled: dropEnabled,
        targetDate: dropDate,
        template: dropTemplate,
      },
    });
    setMessage({
      type: "success",
      text: dropEnabled
        ? `🔥 Tryb Dropu aktywny do: ${dropDate ? new Date(dropDate).toLocaleString("pl-PL") : "Wyznaczonej daty"}`
        : "Wyłączono odliczanie do dropu.",
    });
  };

  const liveStoreUrl = getStoreUrl(currentStore.subdomain, currentStore.customDomain);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(liveStoreUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Stats calculation
  const storeOrders = currentStore.orders || [];
  const storeProducts = currentStore.products || [];
  const paidOrders = storeOrders.filter((o) => o.status === "paid");
  const totalRevenueCents = paidOrders.reduce((sum, o) => sum + o.amountTotalCents, 0);
  const totalRevenuePLN = (totalRevenueCents / 100).toFixed(2);
  const totalOrdersCount = paidOrders.length;
  const aovPLN = totalOrdersCount > 0 ? (totalRevenueCents / totalOrdersCount / 100).toFixed(2) : "0.00";
  const visitsCount = currentStore.visitsCount || (storeOrders.length * 14 + 102);

  const filteredProducts = storeProducts.filter((p) =>
    !prodSearch ? true : p.name.toLowerCase().includes(prodSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[#F4F5F7] text-zinc-900 flex font-sans antialiased selection:bg-[#3B82F6] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (SIDEBAR PO LEWEJ STRONIE JAK NA MAKIECIE) */}
      {/* ========================================================================= */}
      <aside className="w-64 bg-white border-r border-zinc-200/80 min-h-screen flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 mb-8">
            <img src="/logo.svg" alt="iskral" className="h-7 w-auto object-contain" />
          </Link>

          {/* SEKDOM: GŁÓWNE */}
          <div className="space-y-1 mb-8">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2 block">
              GŁÓWNE
            </span>

            <button
              onClick={() => setActiveNav("home")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                activeNav === "home"
                  ? "bg-zinc-100 text-zinc-900 font-bold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              <span>Strona główna</span>
            </button>

            {/* Sklep / Zakup Pakietu */}
            <button
              onClick={() => setActiveNav("shop")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                activeNav === "shop"
                  ? "bg-zinc-100 text-zinc-900 font-bold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              <span>Sklep</span>
            </button>

            {/* Szablony */}
            <button
              onClick={() => setActiveNav("templates")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                activeNav === "templates"
                  ? "bg-zinc-100 text-zinc-900 font-bold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              <span>Szablony</span>
            </button>

            {/* Usługi */}
            <div className="pt-1">
              <button
                onClick={() => setActiveNav("home")}
                className="w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 flex items-center justify-between cursor-pointer"
              >
                <span>Usługi</span>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>

              {/* Sub-item: Show active assigned package if store is configured */}
              {hasConfiguredStore && (
                <div className="pl-6 pt-1">
                  <button
                    onClick={() => setActiveNav("editor")}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                      activeNav === "editor" ? "text-[#3B82F6] font-bold" : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Pakiet {currentStore.planType || user.plan || "Brand"} #{displayServices[0]?.number || 442}
                  </button>
                </div>
              )}
            </div>

            {/* Ustawienia Konta */}
            <button
              onClick={() => setActiveNav("settings")}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 cursor-pointer ${
                activeNav === "settings"
                  ? "bg-zinc-100 text-zinc-900 font-bold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              <span>Ustawienia</span>
            </button>
          </div>

          {/* SEKDOM: PAKIET / ZARZĄDZANIE SKLEPEM (WIDOCZNE GDY SKLEP JEST SKONFIGUROWANY) */}
          {hasConfiguredStore && (
            <div className="space-y-1 pt-2 border-t border-zinc-100">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 mb-2 block">
                PAKIET
              </span>

              <button
                onClick={() => setActiveNav("editor")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "editor"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                Edytor strony
              </button>

              <button
                onClick={() => setActiveNav("stats")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "stats"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                Statystyki
              </button>

              <button
                onClick={() => setActiveNav("products")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "products"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                Dodaj produkt
              </button>

              <button
                onClick={() => setActiveNav("orders")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "orders"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                Zamówienia
              </button>

              <button
                onClick={() => setActiveNav("domain")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "domain"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                Domena
              </button>

              <button
                onClick={() => setActiveNav("balance")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "balance"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                Saldo
              </button>

              <button
                onClick={() => setActiveNav("newsletter")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "newsletter"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                Newsletter
              </button>

              <button
                onClick={() => setActiveNav("team")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "team"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                Team Collaboration
              </button>

              <button
                onClick={() => setActiveNav("drop")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "drop"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                Drop
              </button>

              <button
                onClick={() => setActiveNav("seo")}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  activeNav === "seo"
                    ? "bg-zinc-100 text-zinc-900 font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                SEO
              </button>
            </div>
          )}

        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-zinc-100">
          <button
            onClick={() => {
              logout();
              router.push("/logowanie");
            }}
            className="w-full px-3.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Wyloguj się</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER BAR */}
        <header className="w-full px-8 py-5 flex items-center justify-between bg-transparent">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              {hasConfiguredStore && activeNav !== "home" && activeNav !== "shop" && activeNav !== "templates" && activeNav !== "settings"
                ? currentStore.name
                : "Strona główna"}
            </h1>
          </div>

          {/* User Profile Pill */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 p-1.5 pl-2 pr-4 bg-white hover:bg-zinc-50 rounded-full border border-zinc-200/80 shadow-sm transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 font-black text-xs flex items-center justify-center overflow-hidden shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name ? user.name.slice(0, 2).toUpperCase() : "JK"}</span>
                )}
              </div>
              <span className="text-xs font-bold text-zinc-800">{user.name || user.email}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl p-2 shadow-xl z-50 animate-in fade-in duration-100">
                <div className="p-3 border-b border-zinc-100 mb-1">
                  <span className="text-[10px] font-extrabold uppercase text-[#3B82F6] block">Zalogowano jako</span>
                  <span className="text-xs font-bold text-zinc-900 truncate block">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    setActiveNav("settings");
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4 text-zinc-400" />
                  <span>Ustawienia Konta</span>
                </button>
                <div className="border-t border-zinc-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      logout();
                      router.push("/logowanie");
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Wyloguj się</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Global Alert Notification */}
        {message && (
          <div className="px-8 mt-2">
            <div
              className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-sm ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 p-8 pt-4">

          {/* ========================================================================= */}
          {/* TAB 1: STRONA GŁÓWNA */}
          {/* ========================================================================= */}
          {activeNav === "home" && (
            <div className="w-full space-y-6">

              {/* STAN 1: BRAK PAKIETU (SCREEN 1) */}
              {!hasPurchasedPackages && displayServices.length === 0 ? (
                <div className="w-full max-w-xl mx-auto mt-12 p-12 bg-white rounded-3xl border border-zinc-200/80 shadow-sm text-center flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-200">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">
                    Nie posiadasz żadnego pakietu
                  </h2>
                  <button
                    onClick={() => setActiveNav("shop")}
                    className="px-8 py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    Przejdź do sklepu
                  </button>
                </div>
              ) : (
                /* STAN 2 & 3: ZAKUPIONE USŁUGI / PAKIETY (SCREEN 2) */
                <div className="space-y-4">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    USŁUGI
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayServices.map((srv) => (
                      <div
                        key={srv.id}
                        className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 hover:border-zinc-300 transition-all"
                      >
                        <div>
                          {/* Top Row: Title & Placeholder Box */}
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-black text-zinc-900">{srv.title}</h3>
                              <span className="text-xs text-zinc-400 font-medium">
                                {srv.status}
                              </span>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                              <Package className="w-6 h-6 text-zinc-400" />
                            </div>
                          </div>

                          {/* Info Lines */}
                          <div className="mt-6 space-y-1.5 text-xs text-zinc-600">
                            <div className="flex items-center justify-between">
                              <span>Nazwa pakietu:</span>
                              <strong className="text-zinc-900 font-bold">Pakiet {srv.planType}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Ważność pakietu:</span>
                              <strong className="text-zinc-900 font-bold">{srv.expiresAt}</strong>
                            </div>
                          </div>

                          {/* Gray Sub-Buttons */}
                          <div className="grid grid-cols-2 gap-2.5 mt-6">
                            <button
                              onClick={() => setActiveNav("shop")}
                              className="py-2.5 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
                            >
                              przedłuż pakiet
                            </button>
                            <button
                              onClick={() => setActiveNav("orders")}
                              className="py-2.5 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
                            >
                              zamówienia
                            </button>
                          </div>
                        </div>

                        {/* Blue Main Action Button */}
                        <div>
                          {srv.status === "Nieprzypisany" ? (
                            <button
                              onClick={() => handleStartConfiguration(srv)}
                              className="w-full py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                            >
                              Przejdź dalej
                            </button>
                          ) : (
                            <button
                              onClick={() => setActiveNav("editor")}
                              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                            >
                              Zarządzaj Sklepem →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SKLEP (ZAKUP PAKIETÓW) */}
          {/* ========================================================================= */}
          {activeNav === "shop" && (
            <div className="space-y-6 max-w-5xl animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Sklep z Pakietami Platformy</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Wybierz pakiet dla swojego sklepu. Usługa pojawi się natychmiast na stronie głównej w stanie "Nieprzypisany".</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Pakiet Start */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div>
                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full text-[10px] font-bold uppercase">14 Dni Gratis</span>
                    <h3 className="text-xl font-black text-zinc-900 mt-2">Pakiet Start</h3>
                    <p className="text-xs text-zinc-500 mt-1">Sprawdź swój pomysł bez opłat.</p>
                    <div className="text-3xl font-black text-zinc-900 mt-4">0 PLN <span className="text-xs font-normal text-zinc-400">/ 14 dni</span></div>
                    <ul className="mt-6 space-y-2 text-xs text-zinc-600">
                      <li>✓ Subdomena .iskral.pl</li>
                      <li>✓ Do 5 produktów</li>
                      <li>✓ Płatności testowe Stripe</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      buyPlan("Start", "miesiac");
                      setActiveNav("home");
                    }}
                    className="w-full py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Wybierz Pakiet Start (0 PLN)
                  </button>
                </div>

                {/* Pakiet Creator */}
                <div className="bg-white border-2 border-[#3B82F6] rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-6 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3B82F6] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase">
                    Polecany
                  </div>
                  <div>
                    <span className="px-2.5 py-1 bg-blue-50 text-[#3B82F6] rounded-full text-[10px] font-bold uppercase">Popularny</span>
                    <h3 className="text-xl font-black text-zinc-900 mt-2">Pakiet Creator</h3>
                    <p className="text-xs text-zinc-500 mt-1">Dla twórców odzieży i dropów.</p>
                    <div className="text-3xl font-black text-zinc-900 mt-4">49.90 PLN <span className="text-xs font-normal text-zinc-400">/ mc</span></div>
                    <ul className="mt-6 space-y-2 text-xs text-zinc-600">
                      <li>✓ Nielimitowane produkty</li>
                      <li>✓ Dynamiczny licznik dropu</li>
                      <li>✓ Prowizja tylko 1.0%</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      buyPlan("Creator", "miesiac");
                      setActiveNav("home");
                    }}
                    className="w-full py-3.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Kup Pakiet Creator
                  </button>
                </div>

                {/* Pakiet Brand */}
                <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div>
                    <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-full text-[10px] font-bold uppercase">Bez Prowizji</span>
                    <h3 className="text-xl font-black text-zinc-900 mt-2">Pakiet Brand</h3>
                    <p className="text-xs text-zinc-500 mt-1">Dla rosnących marek streetwear.</p>
                    <div className="text-3xl font-black text-zinc-900 mt-4">99.90 PLN <span className="text-xs font-normal text-zinc-400">/ mc</span></div>
                    <ul className="mt-6 space-y-2 text-xs text-zinc-600">
                      <li className="font-bold text-emerald-600">✓ 0% prowizji platformy</li>
                      <li>✓ Własna domena .pl / .com</li>
                      <li>✓ Priorytetowy support 24/7</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      buyPlan("Brand", "miesiac");
                      setActiveNav("home");
                    }}
                    className="w-full py-3.5 bg-zinc-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Kup Pakiet Brand
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SZABLONY */}
          {/* ========================================================================= */}
          {activeNav === "templates" && (
            <div className="space-y-6 max-w-4xl animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Dostępne Szablony Sklepu</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Platforma oferuje zoptymalizowany pod kątem konwersji i prędkości szablon streetwear.</p>
              </div>

              <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-64 h-40 bg-zinc-900 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
                  🔥 Dark Vibe / Streetwear
                </div>
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full uppercase">Domyślny Szablon</span>
                  <h3 className="text-lg font-bold text-zinc-900">Dark Vibe (Hype & Streetwear)</h3>
                  <p className="text-xs text-zinc-600">
                    Ciemna estetyka z wyrazistym akcentem kolorystycznym, dynamicznym licznikiem odliczania dropów oraz zoptymalizowanym koszykiem mobilnym.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: USTAWIENIA KONTA (DANE, 2FA, AVATAR, ADRES) */}
          {/* ========================================================================= */}
          {activeNav === "settings" && (
            <div className="max-w-3xl space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Ustawienia Konta i Profilu</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Uzupełnij swoje pełne dane osobowe, adres oraz zabezpiecz konto aplikacją Authenticator 2FA.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 bg-white border border-zinc-200/80 rounded-3xl shadow-sm space-y-6">
                
                {/* Avatar Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-2">Zdjęcie Profilowe Konta</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                      {profAvatar ? (
                        <img src={profAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <label className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Wgraj zdjęcie z komputera</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleAvatarFileUpload(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-zinc-400 mt-1">Obsługiwane formaty: PNG, JPG, WEBP (maks. 5MB).</p>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Imię i Nazwisko</label>
                    <input
                      type="text"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-medium outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Adres E-mail</label>
                    <input
                      type="email"
                      value={profEmail}
                      disabled
                      className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-xl text-xs text-zinc-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">Numer Telefonu</label>
                    <input
                      type="text"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      placeholder="+48 500 000 000"
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 font-medium outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                {/* Full Address */}
                <div className="pt-4 border-t border-zinc-100 space-y-4">
                  <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Adres Zamieszkania / Siedziba Firmy</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Ulica i numer lokalu</label>
                      <input
                        type="text"
                        value={profStreet}
                        onChange={(e) => setProfStreet(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Kod Pocztowy</label>
                      <input
                        type="text"
                        value={profZip}
                        onChange={(e) => setProfZip(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">Miejscowość</label>
                      <input
                        type="text"
                        value={profCity}
                        onChange={(e) => setProfCity(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Zapisz Dane Profilowe
                </button>
              </form>

              {/* 2FA Authenticator Card */}
              <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#3B82F6]" />
                    <h3 className="text-sm font-bold text-zinc-900">Dwuskładnikowa Autoryzacja 2FA (Google Authenticator)</h3>
                    {user.is2FAEnabled && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full">
                        Aktywne ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Zabezpiecz logowanie jednorazowymi 6-cyfrowymi kodami z telefonu.</p>
                </div>

                {user.is2FAEnabled ? (
                  <button
                    onClick={toggle2FA}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Wyłącz 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => setShow2FAModal(true)}
                    className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Skonfiguruj 2FA</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: EDYTOR STRONY / STATYSTYKI / ZARZĄDZANIE SKLEPEM (SCREEN 3) */}
          {/* ========================================================================= */}
          {(activeNav === "editor" || activeNav === "stats") && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* 4 STATS CARDS ROW (DOKŁADNIE JAK NA SCREENIE 3) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Stat 1: Przychód całkowity */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">Przychód całkowity</h4>
                      <span className="text-xs text-zinc-400 font-medium">Tygodniowo</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-zinc-900 font-mono">{totalRevenuePLN || "102"}</span>
                    <span className="text-xs font-bold text-emerald-500 font-mono">+29%</span>
                  </div>
                </div>

                {/* Stat 2: Liczba zamówień */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">Liczba zamówień</h4>
                      <span className="text-xs text-zinc-400 font-medium">Tygodniowo</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-zinc-900 font-mono">{totalOrdersCount || "102"}</span>
                    <span className="text-xs font-bold text-emerald-500 font-mono">+29%</span>
                  </div>
                </div>

                {/* Stat 3: Panel Sklepu (Odsłony) */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">Panel Sklepu</h4>
                      <span className="text-xs text-zinc-400 font-medium">Tygodniowo</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-zinc-900 font-mono">{visitsCount || "102"}</span>
                    <span className="text-xs font-bold text-emerald-500 font-mono">+29%</span>
                  </div>
                </div>

                {/* Stat 4: Panel Sklepu (Średni Koszyk) */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">Panel Sklepu</h4>
                      <span className="text-xs text-zinc-400 font-medium">Tygodniowo</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-zinc-900 font-mono">{aovPLN || "102"}</span>
                    <span className="text-xs font-bold text-emerald-500 font-mono">+29%</span>
                  </div>
                </div>

              </div>

              {/* Subdomain Live Quick Bar */}
              <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#3B82F6] block">Adres Twojego Sklepu</span>
                  <a
                    href={liveStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-lg font-bold text-zinc-900 hover:text-[#3B82F6] flex items-center gap-1.5 mt-0.5"
                  >
                    <span>https://{currentStore.subdomain}.iskral.pl</span>
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {linkCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{linkCopied ? "Skopiowano!" : "Kopiuj Link"}</span>
                  </button>

                  <a
                    href={liveStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Odwiedź Sklep ↗</span>
                  </a>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DODAJ PRODUKT / PRODUKTY */}
          {/* ========================================================================= */}
          {activeNav === "products" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-black text-zinc-900">Katalog Produktów ({storeProducts.length})</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Zarządzaj ofertą, stanem magazynowym i wariantami rozmiarów.</p>
                </div>

                <button
                  onClick={handleOpenAddProduct}
                  className="px-5 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dodaj Nowy Produkt</span>
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-12 bg-white border border-zinc-200/80 rounded-3xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto text-xl">
                    📦
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900">Brak produktów w sklepie</h4>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">Dodaj pierwszy produkt klikając przycisk powyżej.</p>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold text-[10px] border-b border-zinc-200">
                      <tr>
                        <th className="p-4">PRODUKT</th>
                        <th className="p-4">TYP</th>
                        <th className="p-4">CENA (PLN)</th>
                        <th className="p-4">MAGAZYN</th>
                        <th className="p-4">ROZMIARY</th>
                        <th className="p-4">STATUS</th>
                        <th className="p-4 text-right">AKCJE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-900">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-zinc-900 block">{p.name}</span>
                                <span className="text-[10px] text-zinc-400 line-clamp-1">{p.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md text-[10px] font-bold">
                              {p.type}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-zinc-900">
                            {p.price}
                          </td>
                          <td className="p-4 font-mono text-zinc-600">
                            {p.stock} szt.
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 flex-wrap">
                              {(p.variants || ["S", "M", "L"]).map((v) => (
                                <span key={v} className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-mono">
                                  {v}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => toggleProductStatus(p.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                                p.status === "Zawieszony" ? "bg-zinc-100 text-zinc-500" : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {p.status === "Zawieszony" ? "Szkic" : "Aktywny"}
                            </button>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEditProduct(p)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-blue-600">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: ZAMÓWIENIA */}
          {/* ========================================================================= */}
          {activeNav === "orders" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Historia Zamówień ({paidOrders.length})</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Lista opłaconych transakcji w Twoim sklepie.</p>
              </div>

              {paidOrders.length === 0 ? (
                <div className="p-12 bg-white border border-zinc-200/80 rounded-3xl text-center space-y-2">
                  <p className="text-sm font-bold text-zinc-800">Brak zamówień</p>
                  <p className="text-xs text-zinc-400">Gdy klienci opłacą zamówienia na stronie, pojawią się one w tym miejscu.</p>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500 uppercase font-bold text-[10px] border-b border-zinc-200">
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">KLIENT</th>
                        <th className="p-4">KWOTA</th>
                        <th className="p-4">STATUS</th>
                        <th className="p-4 text-right">DATA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paidOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="p-4 font-mono font-bold">#{o.id.slice(-6).toUpperCase()}</td>
                          <td className="p-4">{o.customerEmail}</td>
                          <td className="p-4 font-bold text-emerald-600">{(o.amountTotalCents / 100).toFixed(2)} PLN</td>
                          <td className="p-4"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold">Opłacone</span></td>
                          <td className="p-4 text-right font-mono text-zinc-400">{new Date(o.createdAt || Date.now()).toLocaleDateString("pl-PL")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DOMENA */}
          {/* ========================================================================= */}
          {activeNav === "domain" && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Ustawienia Domeny</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Zarządzaj subdomeną `.iskral.pl` oraz podepnij własną domenę .pl / .com.</p>
              </div>

              <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl shadow-sm space-y-4">
                <label className="block text-xs font-bold text-zinc-700">Subdomena w platformie</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={currentStore.subdomain}
                    disabled
                    className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 rounded-l-xl text-xs font-bold font-mono"
                  />
                  <span className="px-4 py-2.5 bg-zinc-200/70 border border-l-0 border-zinc-200 rounded-r-xl text-xs font-mono text-zinc-600">
                    .iskral.pl
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600 font-bold">🟢 Subdomena aktywna z certyfikatem SSL.</p>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: SALDO */}
          {/* ========================================================================= */}
          {activeNav === "balance" && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Saldo i Wypłaty Środków</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Zarządzaj zarobionymi środkami ze sprzedaży Stripe i zlecaj wypłaty IBAN.</p>
              </div>

              <div className="p-6 bg-white border border-zinc-200/80 rounded-3xl shadow-sm space-y-4">
                <span className="text-xs font-bold text-zinc-500 uppercase">Dostępne Saldo do Wypłaty</span>
                <div className="text-3xl font-black text-emerald-600 font-mono">{totalRevenuePLN} PLN</div>
                
                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <label className="block text-xs font-bold text-zinc-700">Numer Rachunku Bankowego (IBAN)</label>
                  <input
                    type="text"
                    value={payoutIban}
                    onChange={(e) => setPayoutIban(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold"
                  />
                  <button
                    onClick={() => {
                      if (parseFloat(totalRevenuePLN) <= 0) {
                        alert("Brak dostępnych środków do wypłaty.");
                        return;
                      }
                      requestPayoutWithIBAN(parseFloat(totalRevenuePLN), payoutIban);
                    }}
                    className="px-6 py-3 bg-zinc-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Zleć Wypłatę na Rachunek Bankowy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: DROP (ODLICZANIE DROP MODE) */}
          {/* ========================================================================= */}
          {activeNav === "drop" && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Konfiguracja Odliczania do Dropu</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Ustaw datę premiery kolekcji — na stronie pojawi się licznik na żywo, a sprzedaż odblokuje się automatycznie.</p>
              </div>

              <form onSubmit={handleSaveDropSettings} className="p-6 bg-white border border-zinc-200/80 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">Włącz Tryb Dropu (Countdown Timer)</h4>
                    <p className="text-xs text-zinc-500">Blokuje stronę sklepu dynamicznym zegarem przed premierą.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={dropEnabled}
                    onChange={(e) => setDropEnabled(e.target.checked)}
                    className="w-5 h-5 accent-[#3B82F6] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">Data i Godzina Najbliższego Dropu</label>
                  <input
                    type="datetime-local"
                    value={dropDate}
                    onChange={(e) => setDropDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Zapisz Ustawienia Dropu
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: NEWSLETTER / TEAM / SEO */}
          {/* ========================================================================= */}
          {activeNav === "newsletter" && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-black text-zinc-900">Kampanie Newsletter</h2>
              <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm space-y-4">
                <input
                  type="text"
                  placeholder="Tytuł Kampanii..."
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                />
                <button
                  onClick={() => {
                    alert("Kampania e-mail wysłana do subskrybentów!");
                    setCampaignTitle("");
                  }}
                  className="px-6 py-2.5 bg-[#3B82F6] text-white font-bold text-xs rounded-xl"
                >
                  Wyślij Kampanię
                </button>
              </div>
            </div>
          )}

          {activeNav === "team" && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-black text-zinc-900">Team Collaboration</h2>
              <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm space-y-4">
                <input
                  type="email"
                  placeholder="E-mail członka zespołu..."
                  value={teamEmail}
                  onChange={(e) => setTeamEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                />
                <button
                  onClick={() => {
                    alert("Wysłano zaproszenie do zespołu!");
                    setTeamEmail("");
                  }}
                  className="px-6 py-2.5 bg-[#3B82F6] text-white font-bold text-xs rounded-xl"
                >
                  Zaproś do sklepu
                </button>
              </div>
            </div>
          )}

          {activeNav === "seo" && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-150">
              <h2 className="text-xl font-black text-zinc-900">SEO & Pozycjonowanie</h2>
              <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Tytuł Meta (Title)</label>
                  <input
                    type="text"
                    defaultValue={`${currentStore.name} | Oficjalny Sklep`}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Opis Meta (Description)</label>
                  <textarea
                    rows={3}
                    defaultValue="Kupuj najnowsze limitowane dropy odzieży i akcesoriów."
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                  />
                </div>
                <button
                  onClick={() => setMessage({ type: "success", text: "Zapisano ustawienia SEO sklepu!" })}
                  className="px-6 py-2.5 bg-[#3B82F6] text-white font-bold text-xs rounded-xl"
                >
                  Zapisz SEO
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. KREATOR KONFIGURACJI SKLEPU (MODAL PO KLIKNIĘCIU "PRZEJDŹ DALEJ") */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <span className="text-[10px] font-black uppercase text-[#3B82F6] tracking-wider">Krok 2: Konfiguracja Sklepu</span>
                <h3 className="text-xl font-black text-zinc-900 mt-0.5">Konfigurator Nowego Sklepu</h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinishStoreConfiguration} className="mt-6 space-y-5">
              
              {/* Nazwa i Subdomena */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Nazwa Sklepu</label>
                  <input
                    type="text"
                    value={cfgName}
                    onChange={(e) => setCfgName(e.target.value)}
                    placeholder="np. Dropwear Club"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-[#3B82F6]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Subdomena Sklepu</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={cfgSubdomain}
                      onChange={(e) => setCfgSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      placeholder="twojanazwa"
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-l-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-[#3B82F6]"
                      required
                    />
                    <span className="px-3 py-2.5 bg-zinc-100 border border-l-0 border-zinc-200 rounded-r-xl text-xs font-mono text-zinc-500">
                      .iskral.pl
                    </span>
                  </div>
                  {cfgSubdomain && (
                    <span className={`text-[10px] font-bold mt-1 block ${cfgSubdomainAvailable ? "text-emerald-600" : "text-red-500"}`}>
                      {cfgCheckingSubdomain ? "Sprawdzanie..." : cfgSubdomainAvailable ? "🟢 Subdomena jest wolna!" : "🔴 Zajęta lub niedostępna"}
                    </span>
                  )}
                </div>
              </div>

              {/* Krótki opis */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Krótki Opis Sklepu / Bio Marki</label>
                <textarea
                  rows={2}
                  value={cfgDescription}
                  onChange={(e) => setCfgDescription(e.target.value)}
                  placeholder="Oficjalny sklep streetwear z limitowanymi kolekcjami..."
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none focus:border-[#3B82F6]"
                />
              </div>

              {/* Logo Upload - KLIK LUB DRAG & DROP Z KOMPUTERA */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Logo Sklepu (Wgraj z Komputera lub Przeciągnij)</label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleLogoFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-zinc-200 hover:border-[#3B82F6] rounded-2xl p-4 flex items-center justify-between gap-4 bg-zinc-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {cfgLogo ? (
                        <img src={cfgLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Camera className="w-6 h-6 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-zinc-800 block">
                        {cfgLogo ? "Logo załadowane z pliku ✓" : "Kliknij lub przeciągnij plik logo"}
                      </span>
                      <span className="text-[10px] text-zinc-400">Formaty: PNG, JPG, SVG, WEBP</span>
                    </div>
                  </div>

                  <label className="px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0">
                    <span>{cfgLogo ? "Zmień plik" : "Wybierz plik"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleLogoFileUpload(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Szablon i Kolorystyka */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Szablon Sklepu</label>
                  <select
                    value={cfgTemplate}
                    onChange={(e) => setCfgTemplate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none cursor-pointer"
                  >
                    <option value="Dark Vibe">🔥 Dark Vibe (Hype & Streetwear)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Kolorystyka Akcentu</label>
                  <div className="flex items-center gap-2">
                    {[
                      { name: "Orange", hex: "#FF5B28" },
                      { name: "Blue", hex: "#3B82F6" },
                      { name: "Green", hex: "#10B981" },
                      { name: "Purple", hex: "#8B5CF6" },
                      { name: "Pink", hex: "#EC4899" },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setCfgColor(col.hex)}
                        style={{ backgroundColor: col.hex }}
                        className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                          cfgColor === col.hex ? "ring-2 ring-offset-2 ring-zinc-900 scale-110" : "opacity-80 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Media & Toggle */}
              <div className="pt-3 border-t border-zinc-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">Social Media Sklepu</h4>
                    <p className="text-[10px] text-zinc-400">Podaj linki do mediów społecznościowych Twojej marki.</p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-700">
                    <input
                      type="checkbox"
                      checked={cfgShowSocials}
                      onChange={(e) => setCfgShowSocials(e.target.checked)}
                      className="w-4 h-4 accent-[#3B82F6]"
                    />
                    <span>Pokaż na stronie sklepu</span>
                  </label>
                </div>

                {cfgShowSocials && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Instagram (np. https://instagram.com/...)"
                      value={cfgInstagram}
                      onChange={(e) => setCfgInstagram(e.target.value)}
                      className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="TikTok (np. https://tiktok.com/@...)"
                      value={cfgTiktok}
                      onChange={(e) => setCfgTiktok(e.target.value)}
                      className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="YouTube..."
                      value={cfgYoutube}
                      onChange={(e) => setCfgYoutube(e.target.value)}
                      className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Discord / Telegram..."
                      value={cfgDiscord}
                      onChange={(e) => setCfgDiscord(e.target.value)}
                      className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                >
                  Uruchom Sklep i Przypisz Pakiet →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: DODAWANIE PRODUKTU (Z UPLOADEM ZDJĘCIA Z KOMPUTERA) */}
      {/* ========================================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#3B82F6]" />
                <span>{editingProductId ? "Edycja Produktu" : "Dodaj Nowy Produkt"}</span>
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Nazwa Produktu</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="np. Bluza Heavyweight Oversize 'Noir'"
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-[#3B82F6]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Cena (PLN)</label>
                  <input
                    type="text"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="149.00"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold font-mono outline-none focus:border-[#3B82F6]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Cena Porównawcza (PLN)</label>
                  <input
                    type="text"
                    value={prodComparePrice}
                    onChange={(e) => setProdComparePrice(e.target.value)}
                    placeholder="199.00"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Stan Magazynowy (Szt.)</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono outline-none"
                    min={0}
                  />
                </div>
              </div>

              {/* Rozmiary / Warianty */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Warianty / Rozmiary</label>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {prodVariants.map((v) => (
                    <span key={v} className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono font-bold text-zinc-800 flex items-center gap-1">
                      <span>{v}</span>
                      <button type="button" onClick={() => handleRemoveVariant(v)} className="text-zinc-400 hover:text-red-500 font-bold ml-1">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Dodaj rozmiar (np. XXL)..."
                    value={prodVariantInput}
                    onChange={(e) => setProdVariantInput(e.target.value)}
                    className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono flex-1 outline-none"
                  />
                  <button type="button" onClick={handleAddVariant} className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl cursor-pointer">
                    + Dodaj
                  </button>
                </div>
              </div>

              {/* Zdjęcie Produktu (Upload z Komputera) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">Zdjęcie Produktu (Wgraj z Komputera)</label>
                <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-4 flex items-center justify-between gap-4 bg-zinc-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                      {prodImage ? (
                        <img src={prodImage} alt="Produkt" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <span className="text-xs text-zinc-600 font-medium">
                      {prodImage ? "Zdjęcie załadowane ✓" : "Wybierz zdjęcie produktu"}
                    </span>
                  </div>
                  <label className="px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-xs rounded-xl cursor-pointer shrink-0">
                    <span>Wgraj z komputera</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleProductImageUpload(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Opis Produktu</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Krótki opis materiałów, kroju..."
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  {editingProductId ? "Zapisz Zmiany" : "Utwórz Produkt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: 2FA AUTHENTICATOR SETUP */}
      {/* ========================================================================= */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-zinc-900">Skonfiguruj Google Authenticator</h3>
            <p className="text-xs text-zinc-500">Zeskanuj poniższy kod QR w aplikacji Authenticator lub Authy na telefonie:</p>

            <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl inline-block mx-auto">
              <img src={totpQrUrl} alt="2FA QR Code" className="w-44 h-44 mx-auto rounded-lg" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (totpInput.trim().length !== 6) {
                  alert("Wpisz poprawny 6-cyfrowy kod z aplikacji.");
                  return;
                }
                toggle2FA();
                setShow2FAModal(false);
                setTotpInput("");
              }}
              className="space-y-3"
            >
              <input
                type="text"
                placeholder="Wpisz 6-cyfrowy kod..."
                maxLength={6}
                value={totpInput}
                onChange={(e) => setTotpInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-center text-base font-mono font-bold tracking-widest outline-none focus:border-[#3B82F6]"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="w-1/2 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Aktywuj 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
