"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BackgroundVideo from "../components/BackgroundVideo";
import Navbar from "../components/navbar";
import Badge from "../components/badge";
import Cennik from "../components/cennik";
import StoreBuilderWizard from "../components/StoreBuilderWizard";
import { useAuth, Product, Category, PlanType, StoreConfig, TeamMember, Campaign } from "../context/AuthContext";
import { getStoreUrl } from "@/lib/cookies";
import { PLANS, getPlanConfig, hasFeatureAccess, formatCommissionRate, getStoreLifecycleDates, PlanFeatureConfig } from "@/lib/plans";
import { checkSubdomainAvailability } from "@/lib/supabase";
import { 
  Crown, 
  Store, 
  ExternalLink, 
  Wand2, 
  Sparkles, 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  CreditCard, 
  ArrowUpRight, 
  ShieldCheck, 
  Sliders, 
  Globe, 
  Package, 
  Tag, 
  Flame, 
  Copy, 
  Check, 
  Plus, 
  RefreshCw, 
  AlertTriangle, 
  X, 
  ChevronRight, 
  ArrowLeftRight,
  LayoutDashboard,
  BarChart3,
  CheckCircle2,
  Lock,
  Zap,
  ShieldAlert,
  Unlock,
  Building2,
  DollarSign,
  Home,
  Users,
  Briefcase,
  Palette,
  ShoppingCart,
  Settings as SettingsIcon,
  Search,
  ArrowLeft,
  ChevronDown,
  MapPin,
  KeyRound,
  UserCheck,
  Calendar,
  Layers,
  QrCode,
  Smartphone,
  LogOut,
  Share2,
  FileText,
  Send,
  Clock,
  Link2,
  Upload,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

export default function DashboardPage() {
  const {
    user,
    allUsers,
    activeStore,
    userStores,
    hasAccess,
    setActiveStoreId,
    createAdditionalStore,
    isImpersonating,
    isEditUnlocked,
    exitImpersonation,
    toggleImpersonationEdit,
    logout,
    buyPlan,
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
    verifyDomainRecords,
    recordOrder,
    message,
    setMessage,
  } = useAuth();

  const router = useRouter();

  // 6 Main Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "home" | "products" | "orders" | "drop" | "plans" | "analytics" | "customers" | "settings" | "builder"
  >("home");

  // Profile Dropdown state & ref
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Inner builder sub-tab when editing a specific store (10 subtabs)
  const [builderSubTab, setBuilderSubTab] = useState<
    "overview" | "products" | "orders" | "design" | "drop" | "team" | "campaigns" | "domain" | "seo" | "legal"
  >("overview");

  const [isWizardActive, setIsWizardActive] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showSafeGuardModal, setShowSafeGuardModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Copy Link State
  const [linkCopied, setLinkCopied] = useState(false);

  // Template Store Selector Modal state
  const [showTemplateStoreModal, setShowTemplateStoreModal] = useState(false);
  const [selectedTemplateToApply, setSelectedTemplateToApply] = useState<string | null>(null);
  const [targetStoreForTemplate, setTargetStoreForTemplate] = useState<string>("");

  // Store design & config state
  const [storeNameInput, setStoreNameInput] = useState("");
  const [storeDescriptionInput, setStoreDescriptionInput] = useState("");
  const [subdomainInput, setSubdomainInput] = useState("");
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [templateInput, setTemplateInput] = useState("Dark Vibe");

  // Drop Mode State
  const [dropEnabled, setDropEnabled] = useState(false);
  const [dropDate, setDropDate] = useState("");
  const [dropTemplate, setDropTemplate] = useState<"Cyberpunk Launch" | "Minimalist Timer" | "Hypebeast Countdown">("Cyberpunk Launch");

  // Product Form State
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
  const [prodDigitalFileName, setProdDigitalFileName] = useState("");
  const [prodDigitalFileSize, setProdDigitalFileSize] = useState("");
  const [prodDigitalFileUrl, setProdDigitalFileUrl] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Social Media State
  const [instagramInput, setInstagramInput] = useState("");
  const [tiktokInput, setTiktokInput] = useState("");
  const [youtubeInput, setYoutubeInput] = useState("");
  const [xInput, setXInput] = useState("");
  const [discordInput, setDiscordInput] = useState("");
  const [facebookInput, setFacebookInput] = useState("");
  const [behanceInput, setBehanceInput] = useState("");
  const [telegramInput, setTelegramInput] = useState("");

  // Live Subdomain Availability Validation State
  const [subdomainValidation, setSubdomainValidation] = useState<{
    checking: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  // SEO Form State
  const [metaTitleInput, setMetaTitleInput] = useState("");
  const [metaDescriptionInput, setMetaDescriptionInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  // Legal Terms & Privacy Form State
  const [termsOfServiceInput, setTermsOfServiceInput] = useState("");
  const [privacyPolicyInput, setPrivacyPolicyInput] = useState("");

  // Customer Filter & Search State
  const [customerStoreFilter, setCustomerStoreFilter] = useState<string>("all");
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");

  // Settings Address & Password state
  const [fullNameInput, setFullNameInput] = useState(user?.name || "");
  const [emailInput, setEmailInput] = useState(user?.email || "");
  const [streetInput, setStreetInput] = useState("ul. Nowogrodzka 42/12");
  const [zipInput, setZipInput] = useState("00-695");
  const [cityInput, setCityInput] = useState("Warszawa");
  const [countryInput, setCountryInput] = useState("Polska");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Analytics store selector state ("all" or store ID)
  const [analyticsStoreIdFilter, setAnalyticsStoreIdFilter] = useState<string>("all");

  // 2FA Authenticator Modal & Input state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [totpVerificationInput, setTotpVerificationInput] = useState("");
  const totpSecret = "ISKRAL2FASEC2026KEY";
  const totpQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `otpauth://totp/Iskral.pl:${user?.email || "klient@iskral.pl"}?secret=${totpSecret}&issuer=Iskral.pl`
  )}`;

  const currentStore: StoreConfig = activeStore || userStores[0] || {
    id: "default",
    name: user?.name ? `Sklep ${user.name}` : "Mój Sklep",
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
    const currentSubdomain = currentStore.subdomain;
    const storeId = currentStore.id;
    if (!subdomainInput || subdomainInput.trim().toLowerCase() === currentSubdomain?.toLowerCase()) {
      setSubdomainValidation(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSubdomainValidation({ checking: true, available: false, message: "Sprawdzanie dostępności..." });
      const res = await checkSubdomainAvailability(subdomainInput, storeId);
      setSubdomainValidation({
        checking: false,
        available: res.available,
        message: res.available ? "🟢 Subdomena jest dostępna!" : `🔴 ${res.reason || "Niedostępna"}`,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [subdomainInput, currentStore]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("checkout") === "success") {
        const rawPlan = searchParams.get("plan");
        const billingParam = (searchParams.get("billing") || "miesiac") as "miesiac" | "rok";
        const planToActivate: PlanType =
          rawPlan && (rawPlan === "Creator" || rawPlan === "Brand" || rawPlan === "Start")
            ? (rawPlan as PlanType)
            : "Creator";

        buyPlan(planToActivate, billingParam);

        setMessage({
          type: "success",
          text: `🎉 Płatność Stripe zrealizowana pomyślnie! Pakiet ${planToActivate} został aktywowany dla Twojego sklepu.`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [setMessage, buyPlan]);

  useEffect(() => {
    if (user) {
      setFullNameInput(user.name || "");
      setEmailInput(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (currentStore) {
      setStoreNameInput(currentStore.name || "");
      setStoreDescriptionInput(currentStore.description || "Oficjalny sklep internetowy");
      setSubdomainInput(currentStore.subdomain || "");
      setCustomDomainInput(currentStore.customDomain || "");
      setLogoUrlInput(currentStore.logoUrl || "");
      setTemplateInput(currentStore.template || "Dark Vibe");

      // Drop config
      setDropEnabled(Boolean(currentStore.dropConfig?.enabled));
      setDropDate(currentStore.dropConfig?.targetDate || "");
      setDropTemplate(currentStore.dropConfig?.template || "Cyberpunk Launch");

      // Socials
      setInstagramInput(currentStore.socials?.instagram || "");
      setTiktokInput(currentStore.socials?.tiktok || "");
      setYoutubeInput(currentStore.socials?.youtube || "");
      setXInput(currentStore.socials?.x || "");
      setDiscordInput(currentStore.socials?.discord || "");
      setFacebookInput(currentStore.socials?.facebook || "");
      setBehanceInput(currentStore.socials?.behance || "");
      setTelegramInput(currentStore.socials?.telegram || "");

      // SEO
      setMetaTitleInput(currentStore.seoConfig?.metaTitle || `${currentStore.name} | Oficjalny Sklep`);
      setMetaDescriptionInput(currentStore.seoConfig?.metaDescription || `Kupuj w sklepie ${currentStore.name}.`);
      setKeywordsInput(currentStore.seoConfig?.keywords || `sklep, ${currentStore.subdomain}, e-commerce`);

      // Legal Terms
      setTermsOfServiceInput(currentStore.legalTerms?.termsOfService || "Regulamin Sklepu Internetowego...");
      setPrivacyPolicyInput(currentStore.legalTerms?.privacyPolicy || "Polityka Prywatności i Plików Cookies...");
    }
  }, [currentStore.id]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen w-full bg-[#090A0C] text-white flex flex-col items-center justify-center p-6">
        <BackgroundVideo />
        <div className="w-10 h-10 border-4 border-[#FF5B28]/20 border-t-[#FF5B28] rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="relative min-h-screen w-full bg-[#090A0C] text-white flex flex-col items-center justify-center p-6 font-sans">
        <BackgroundVideo />
        <div className="relative z-10 p-8 bg-[#111216] border border-white/5 rounded-2xl text-center max-w-md shadow-2xl space-y-4">
          <h2 className="text-2xl font-black text-white">Brak Dostępu</h2>
          <p className="text-xs text-zinc-400">Musisz być zalogowany, aby zobaczyć swój panel klienta.</p>
          <Link
            href="/logowanie"
            className="inline-block px-6 py-3 bg-[#FF5B28] text-white font-extrabold rounded-full text-xs shadow-lg shadow-[#FF5B28]/25"
          >
            Przejdź do logowania →
          </Link>
        </div>
      </main>
    );
  }

  const executeWithSafeGuard = (action: () => void) => {
    if (isImpersonating && !isEditUnlocked) {
      setPendingAction(() => action);
      setShowSafeGuardModal(true);
      return;
    }
    action();
  };

  // Calculated Store Stats
  const storeOrders = currentStore.orders || [];
  const storeProducts = currentStore.products || [];
  const paidOrders = storeOrders.filter((o) => o.status === "paid");

  const totalRevenueCents = paidOrders.reduce((sum, o) => sum + o.amountTotalCents, 0);
  const totalRevenuePLN = (totalRevenueCents / 100).toFixed(2);
  const totalOrdersCount = paidOrders.length;
  const aovPLN = totalOrdersCount > 0 ? (totalRevenueCents / totalOrdersCount / 100).toFixed(2) : "0.00";
  const visitsCount = currentStore.visitsCount || (storeOrders.length * 14 + 128);

  const liveStoreUrl = getStoreUrl(currentStore.subdomain, currentStore.customDomain);

  const handleCopyStoreLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(liveStoreUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Format Expiration Date & Time Helper
  const formatExpirationDate = (expDate?: string) => {
    if (user?.role === "superadmin") return "Bezterminowy (Superadmin)";
    if (!expDate) return "Ważny bezterminowo";
    const d = new Date(expDate);
    return `do ${d.toLocaleDateString("pl-PL")} r.`;
  };

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
    setProdDigitalFileName("");
    setProdDigitalFileSize("");
    setProdDigitalFileUrl("");
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
    setProdDigitalFileName(p.digitalFileName || "");
    setProdDigitalFileSize(p.digitalFileSize || "");
    setProdDigitalFileUrl(p.digitalFileUrl || "");
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

    executeWithSafeGuard(() => {
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
          digitalFileName: prodDigitalFileName || (prodType === "Cyfrowy" ? "Plik_Cyfrowy.pdf" : undefined),
          digitalFileSize: prodDigitalFileSize || (prodType === "Cyfrowy" ? "12.4 MB" : undefined),
          digitalFileUrl: prodDigitalFileUrl || (prodType === "Cyfrowy" ? "data:application/pdf;base64,demo" : undefined),
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
          digitalFileName: prodDigitalFileName || (prodType === "Cyfrowy" ? "Plik_Cyfrowy.pdf" : undefined),
          digitalFileSize: prodDigitalFileSize || (prodType === "Cyfrowy" ? "12.4 MB" : undefined),
          digitalFileUrl: prodDigitalFileUrl || (prodType === "Cyfrowy" ? "data:application/pdf;base64,demo" : undefined),
        });
      }
      setShowProductModal(false);
    });
  };

  const handleSaveDropConfig = (e: React.FormEvent) => {
    e.preventDefault();
    executeWithSafeGuard(() => {
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
          ? `🔥 Aktywowano Tryb Dropu do: ${dropDate ? new Date(dropDate).toLocaleString("pl-PL") : "Wyznaczonej daty"}`
          : "Wyłączono odliczanie do dropu.",
      });
    });
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

  const filteredProducts = storeProducts.filter((p) =>
    !productSearch ? true : p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Customer database compilation
  const rawCustomers = userStores.flatMap((s) =>
    (s.orders || [])
      .filter((o) => o.status === "paid")
      .map((o) => ({
        id: o.id,
        email: o.customerEmail,
        storeId: s.id,
        storeName: s.name,
        storeSubdomain: s.subdomain,
        amountPLN: (o.amountTotalCents / 100).toFixed(2),
        date: new Date(o.createdAt || Date.now()).toLocaleDateString("pl-PL"),
      }))
  );

  const filteredCustomers = rawCustomers.filter((c) => {
    const matchesStore = customerStoreFilter === "all" || c.storeId === customerStoreFilter;
    const matchesSearch = !customerSearchQuery || c.email.toLowerCase().includes(customerSearchQuery.toLowerCase());
    return matchesStore && matchesSearch;
  });

  // IF WIZARD ACTIVE, RENDER FULLSCREEN WIZARD
  if (isWizardActive) {
    return (
      <main className="relative min-h-screen w-full bg-[#090A0C] text-white flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
        <BackgroundVideo />
        <div className="relative z-10 w-full max-w-5xl">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setIsWizardActive(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              ← Powrót do Panelu Sklepu
            </button>
            <span className="text-xs text-zinc-400 font-mono">Panel Twórcy Iskral</span>
          </div>

          <StoreBuilderWizard
            onComplete={() => {
              setIsWizardActive(false);
              setMessage({ type: "success", text: "🎉 Gratulacje! Twój sklep jest gotowy i aktywny w panelu!" });
            }}
            initialStep={user.plan !== "Brak" && user.hasStore ? 2 : 1}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#090A0C] text-white flex flex-col font-sans pb-24 selection:bg-[#FF5B28] selection:text-white">
      <BackgroundVideo />

      {/* Admin Impersonation Banner */}
      {isImpersonating && (
        <div className="relative z-30 w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black font-extrabold text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xl animate-in fade-in duration-300 border-b border-amber-400/40">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-black/20 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5 text-black animate-pulse" />
            </div>
            <div>
              <span className="uppercase tracking-wider text-[10px] bg-black/20 px-2 py-0.5 rounded text-amber-950 font-black mr-2">
                Tryb Podglądu Admina
              </span>
              <span className="text-amber-950">
                Zarządzasz obecnie sklepem: <strong className="text-black underline">{currentStore.name}</strong> ({currentStore.subdomain}.iskral.pl)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleImpersonationEdit}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 shadow-md ${
                isEditUnlocked 
                  ? "bg-red-950 text-red-100 border border-red-500/50 shadow-red-950/40" 
                  : "bg-black/80 hover:bg-black text-amber-300 border border-black/30"
              }`}
            >
              {isEditUnlocked ? <Unlock className="w-3.5 h-3.5 text-red-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isEditUnlocked ? "Tryb Pełnej Edycji (Odblokowany)" : "Tylko Podgląd"}</span>
            </button>
            <button
              onClick={exitImpersonation}
              className="px-3.5 py-1.5 bg-black/80 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <X className="w-3.5 h-3.5" />
              <span>Wyjdź z Podglądu</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER & NAVIGATION */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 border-b border-white/[0.08] bg-[#0E0E11]/90 backdrop-blur-xl sticky top-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
            <img
              src="/logo.svg"
              alt="iskral.pl"
              className="h-8 sm:h-9 w-auto object-contain cursor-pointer"
            />
          </Link>

          {/* Center Tabs Navigation */}
          <div className="bg-[#18191E] border border-white/[0.08] text-white p-1 rounded-full flex items-center gap-1 overflow-x-auto max-w-full">
            
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "home"
                  ? "bg-[#FF5B28] text-white shadow-md shadow-[#FF5B28]/25"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Pulpit</span>
            </button>

            <button
              onClick={() => setActiveTab("products")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "products"
                  ? "bg-[#FF5B28] text-white shadow-md shadow-[#FF5B28]/25"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Produkty ({storeProducts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#FF5B28] text-white shadow-md shadow-[#FF5B28]/25"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Zamówienia ({paidOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("drop")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "drop"
                  ? "bg-[#FF5B28] text-white shadow-md shadow-[#FF5B28]/25"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Tryb Dropu</span>
            </button>

            <button
              onClick={() => setActiveTab("plans")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "plans"
                  ? "bg-[#FF5B28] text-white shadow-md shadow-[#FF5B28]/25"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Pakiety SaaS</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-[#FF5B28] text-white shadow-md shadow-[#FF5B28]/25"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analityka</span>
            </button>

            <button
              onClick={() => setActiveTab("customers")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "customers"
                  ? "bg-[#FF5B28] text-white shadow-md shadow-[#FF5B28]/25"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Klienci</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#FF5B28] text-white shadow-md shadow-[#FF5B28]/25"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Ustawienia</span>
            </button>

          </div>

          {/* Right User Profile Dropdown Menu */}
          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 p-1.5 px-3.5 bg-[#090A0C] hover:bg-white/5 rounded-full border border-white/[0.08] transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-full bg-[#18181B] border border-[#FF5B28]/50 text-[#FF5B28] flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {user.name ? user.name.substring(0, 2).toUpperCase() : "KL"}
              </div>

              <div className="flex flex-col text-left pr-1">
                <span className="text-xs font-extrabold text-white leading-tight flex items-center gap-1.5">
                  <span>{user.name || user.email}</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono leading-tight">
                  {currentStore.subdomain}.iskral.pl
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180 text-[#FF5B28]" : "group-hover:text-white"}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#18181B] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in duration-150">
                <div className="px-3.5 py-2.5 border-b border-white/5 mb-1 bg-[#0E0E11] rounded-xl">
                  <span className="text-[10px] uppercase font-extrabold text-[#FF5B28] block tracking-wider">
                    {user.role === "superadmin" || user.role === "admin" ? "Administrator" : "Właściciel Sklepu"}
                  </span>
                  <span className="text-xs font-bold text-white truncate block mt-0.5">{user.email}</span>
                </div>

                <button
                  onClick={() => {
                    setActiveTab("settings");
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-white/5 rounded-xl text-xs font-bold text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <SettingsIcon className="w-4 h-4 text-zinc-400" />
                  <span>Ustawienia Konta</span>
                </button>

                {(user.role === "superadmin" || user.role === "admin") && (
                  <Link
                    href="/admin"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="px-3.5 py-2.5 hover:bg-white/5 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-2.5 transition-colors"
                  >
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Konsola Zarządcza Admina</span>
                  </Link>
                )}

                <div className="border-t border-white/5 pt-1 mt-1">
                  <button
                    onClick={() => {
                      logout();
                      router.push("/logowanie");
                    }}
                    className="w-full px-3.5 py-2.5 hover:bg-red-500/10 text-red-400 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Wyloguj się</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      <div className="relative z-10 flex flex-col w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Global Toast Message */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between border shadow-xl backdrop-blur-xl animate-in fade-in duration-300 ${
              message.type === "success"
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10"
                : "bg-red-500/15 text-red-300 border-red-500/40 shadow-red-500/10"
            }`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-white/10 rounded-lg text-xs font-bold transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ONBOARDING CARD - ONLY SHOWN IF USER HAS ZERO STORES */}
        {userStores.length === 0 ? (
          <div className="p-8 sm:p-12 bg-gradient-to-b from-[#18181B] to-[#121216] border border-[#FF5B28]/30 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-2xl mx-auto my-12 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-[#FF5B28]/10 border border-[#FF5B28]/30 flex items-center justify-center text-[#FF5B28] text-3xl mb-4 animate-bounce">
              🚀
            </div>
            <span className="px-3 py-1 bg-[#FF5B28]/15 text-[#FF5B28] rounded-full text-[11px] font-extrabold border border-[#FF5B28]/30 uppercase tracking-wider mb-2">
              Rozpocznij Sprzedaż
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Skonfiguruj Swój Pierwszy Sklep
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md">
              Wybierz pakiet (14 dni darmowego trialu lub Pro), wpisz swoją subdomenę i uruchom sklep online w 2 minuty.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full my-6 text-left">
              <div className="p-3.5 bg-[#090A0C] border border-white/5 rounded-xl">
                <span className="text-base">⚡</span>
                <h4 className="text-xs font-bold text-white mt-1">1. Wybierz Pakiet</h4>
                <p className="text-[10px] text-zinc-400">14 dni bez opłat lub Pro</p>
              </div>
              <div className="p-3.5 bg-[#090A0C] border border-white/5 rounded-xl">
                <span className="text-base">🌐</span>
                <h4 className="text-xs font-bold text-white mt-1">2. Twoja Subdomena</h4>
                <p className="text-[10px] text-zinc-400">twojanazwa.iskral.pl</p>
              </div>
              <div className="p-3.5 bg-[#090A0C] border border-white/5 rounded-xl">
                <span className="text-base">🎨</span>
                <h4 className="text-xs font-bold text-white mt-1">3. Wybierz Szablon</h4>
                <p className="text-[10px] text-zinc-400">Dark Vibe, Luxury, Hype</p>
              </div>
            </div>

            <button
              onClick={() => setIsWizardActive(true)}
              className="px-8 py-4 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-black text-sm rounded-2xl shadow-xl shadow-[#FF5B28]/30 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-105"
            >
              <Wand2 className="w-5 h-5" />
              <span>Uruchom Kreator Sklepu Teraz →</span>
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-8">

            {/* STORE HEADER HERO BAR (LINEAR / VERCEL STYLE) */}
            <div className="p-6 sm:p-8 bg-[#18181B] border border-white/10 rounded-3xl shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF5B28]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-5 z-10">
                {/* Logo / Initial */}
                <div className="w-16 h-16 rounded-2xl bg-[#0E0E11] border border-white/10 flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-lg overflow-hidden">
                  {currentStore.logoUrl ? (
                    <img src={currentStore.logoUrl} alt={currentStore.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-[#FF5B28]">{(currentStore.name || "S").charAt(0).toUpperCase()}</span>
                  )}
                </div>

                {/* Info & Badges */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {currentStore.name}
                    </h1>
                    <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-extrabold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Aktywny</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-[#FF5B28]/15 text-[#FF5B28] border border-[#FF5B28]/30 rounded-full text-[11px] font-extrabold uppercase">
                      Pakiet {currentStore.planType || user.plan || "Start"}
                    </span>
                  </div>

                  {/* Subdomain Link Bar */}
                  <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400 font-mono">
                    <span>Adres sklepu:</span>
                    <a
                      href={liveStoreUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 font-bold underline flex items-center gap-1"
                    >
                      <span>{currentStore.subdomain}.iskral.pl</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full lg:w-auto z-10 flex-wrap">
                <button
                  onClick={handleCopyStoreLink}
                  className="px-4 py-3 bg-[#0E0E11] hover:bg-white/10 text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  <span>{linkCopied ? "Skopiowano!" : "Kopiuj link"}</span>
                </button>

                <a
                  href={liveStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs rounded-xl border border-white/10 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Otwórz sklep</span>
                  <ExternalLink className="w-4 h-4 text-[#FF5B28]" />
                </a>

                <button
                  onClick={handleOpenAddProduct}
                  className="px-5 py-3 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#FF5B28]/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Dodaj Produkt</span>
                </button>
              </div>
            </div>

            {/* BENTO GRID - QUICK STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              {/* Stat 1: Przychód całkowity */}
              <div className="p-6 bg-[#18181B] border border-white/10 rounded-2xl shadow-xl space-y-3 relative overflow-hidden group hover:border-[#FF5B28]/40 transition-all">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Przychód Całkowity</span>
                  <div className="p-2.5 bg-[#FF5B28]/10 text-[#FF5B28] rounded-xl border border-[#FF5B28]/20">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white font-mono">{totalRevenuePLN} PLN</div>
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/5">
                  <span>Średnia wartość koszyka:</span>
                  <strong className="text-emerald-400 font-mono">{aovPLN} PLN</strong>
                </div>
              </div>

              {/* Stat 2: Liczba zamówień */}
              <div className="p-6 bg-[#18181B] border border-white/10 rounded-2xl shadow-xl space-y-3 relative overflow-hidden group hover:border-blue-500/40 transition-all">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Liczba Zamówień</span>
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white font-mono">{totalOrdersCount}</div>
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/5">
                  <span>Status realizacji:</span>
                  <span className="text-blue-400 font-bold">100% zrealizowanych</span>
                </div>
              </div>

              {/* Stat 3: Odsłony sklepu */}
              <div className="p-6 bg-[#18181B] border border-white/10 rounded-2xl shadow-xl space-y-3 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Odsłony Sklepu</span>
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white font-mono">{visitsCount}</div>
                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/5">
                  <span>Ruch na subdomenie:</span>
                  <span className="text-purple-400 font-mono">+{storeProducts.length * 3 + 12} dzisiaj</span>
                </div>
              </div>

              {/* Stat 4: Aktywny Pakiet */}
              <div className="p-6 bg-[#18181B] border border-white/10 rounded-2xl shadow-xl space-y-3 relative overflow-hidden group hover:border-amber-500/40 transition-all">
                <div className="flex justify-between items-center text-zinc-400">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">Aktywny Pakiet</span>
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white flex items-center gap-2">
                  <span>{(currentStore.planType || user.plan || "Start").toUpperCase()}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-zinc-400">{formatExpirationDate(currentStore.planExpiresAt || user.planExpiresAt)}</span>
                  <button
                    onClick={() => setActiveTab("plans")}
                    className="text-amber-400 hover:text-amber-300 font-extrabold text-[11px] underline cursor-pointer"
                  >
                    Zmień plan →
                  </button>
                </div>
              </div>

            </div>

            {/* TAB CONTENT SWITCHER */}
            {activeTab === "home" && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-200">
                
                {/* 1. PRODUKTY TABLE SECTION */}
                <div className="p-6 sm:p-8 bg-[#18181B] border border-white/10 rounded-3xl shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#FF5B28]" />
                        <span>Katalog Produktów ({storeProducts.length})</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">Zarządzaj stanem magazynowym, wariantami rozmiarów i statusem publikacji.</p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="Szukaj produktu..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#FF5B28]"
                        />
                      </div>

                      <button
                        onClick={handleOpenAddProduct}
                        className="px-4 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Dodaj Produkt</span>
                      </button>
                    </div>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="p-12 bg-[#0E0E11] border border-white/5 rounded-2xl text-center space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 mx-auto text-xl">
                        📦
                      </div>
                      <p className="text-sm font-bold text-white">Brak produktów w sklepie</p>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        Kliknij przycisk "Dodaj Produkt" powyżej, aby dodać pierwszy artykuł fizyczny lub cyfrowy do Twojego sklepu.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0E0E11]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#121216] text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-white/10">
                          <tr>
                            <th className="p-4">PRODUKT</th>
                            <th className="p-4">TYP</th>
                            <th className="p-4">CENA (PLN)</th>
                            <th className="p-4">STAN MAGAZYNOWY</th>
                            <th className="p-4">WARIANTY / ROZMIARY</th>
                            <th className="p-4">STATUS</th>
                            <th className="p-4 text-right">AKCJE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white">
                          {filteredProducts.map((prod) => (
                            <tr key={prod.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={prod.image || (prod.images && prod.images[0]) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                                    alt={prod.name}
                                    className="w-12 h-12 rounded-xl object-cover border border-white/10 bg-[#18181B] shrink-0"
                                  />
                                  <div>
                                    <h4 className="font-extrabold text-white text-sm">{prod.name}</h4>
                                    <p className="text-xs text-zinc-500 line-clamp-1 max-w-xs">{prod.description}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                  prod.isDigital || prod.type === "Cyfrowy" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                }`}>
                                  {prod.isDigital || prod.type === "Cyfrowy" ? "💻 Cyfrowy" : "📦 Fizyczny"}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-black text-sm">
                                <span className="text-[#FF5B28]">{prod.price}</span>
                                {prod.comparePrice && (
                                  <span className="text-xs text-zinc-500 line-through block font-normal">{prod.comparePrice}</span>
                                )}
                              </td>
                              <td className="p-4 font-mono font-bold text-zinc-300">
                                {prod.stock !== undefined ? `${prod.stock} szt.` : "50 szt."}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {(prod.variants && prod.variants.length > 0 ? prod.variants : ["S", "M", "L", "XL"]).map((v) => (
                                    <span key={v} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-mono font-extrabold text-zinc-300">
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => executeWithSafeGuard(() => toggleProductStatus(prod.id))}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer transition-all ${
                                    prod.status === "Zawieszony"
                                      ? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/25"
                                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                                  }`}
                                >
                                  {prod.status === "Zawieszony" ? "⚪ Szkic" : "🟢 Aktywny"}
                                </button>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditProduct(prod)}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-xl transition-all cursor-pointer"
                                    title="Edytuj produkt"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => executeWithSafeGuard(() => deleteProduct(prod.id))}
                                    className="p-2 bg-white/5 hover:bg-red-500/15 text-red-400 rounded-xl transition-all cursor-pointer"
                                    title="Usuń produkt"
                                  >
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

                {/* 2. ZAMÓWIENIA TABLE SECTION */}
                <div className="p-6 sm:p-8 bg-[#18181B] border border-white/10 rounded-3xl shadow-2xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-blue-400" />
                        <span>Ostatnie Transakcje & Zamówienia ({paidOrders.length})</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">Lista opłaconych zamówień klientów przez system Stripe.</p>
                    </div>
                  </div>

                  {paidOrders.length === 0 ? (
                    <div className="p-12 bg-[#0E0E11] border border-white/5 rounded-2xl text-center space-y-2">
                      <p className="text-sm font-bold text-white">Brak zamówień do wyświetlenia</p>
                      <p className="text-xs text-zinc-400">
                        Gdy klienci dokonają zakupu na stronie Twojego sklepu, transakcje pojawią się tutaj automatycznie.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0E0E11]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#121216] text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-white/10">
                          <tr>
                            <th className="p-4">ID ZAMÓWIENIA</th>
                            <th className="p-4">KLIENT (E-MAIL)</th>
                            <th className="p-4">KWOTA</th>
                            <th className="p-4">STATUS REALIZACJI</th>
                            <th className="p-4 text-right">DATA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white">
                          {paidOrders.map((ord) => (
                            <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-4 font-mono font-bold text-zinc-300">
                                #{ord.id.slice(-6).toUpperCase()}
                              </td>
                              <td className="p-4 font-mono text-white">
                                {ord.customerEmail}
                              </td>
                              <td className="p-4 font-mono font-black text-emerald-400 text-sm">
                                {(ord.amountTotalCents / 100).toFixed(2)} PLN
                              </td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-extrabold">
                                  🟢 Opłacone (Stripe)
                                </span>
                              </td>
                              <td className="p-4 text-right font-mono text-zinc-400">
                                {new Date(ord.createdAt || Date.now()).toLocaleDateString("pl-PL")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB: PRODUKTY */}
            {activeTab === "products" && (
              <div className="p-6 sm:p-8 bg-[#18181B] border border-white/10 rounded-3xl shadow-2xl space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#FF5B28]" />
                      <span>Pełny Katalog Produktów ({storeProducts.length})</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Dodawaj nowe pozycje, edytuj warianty rozmiarów i kontroluj stan magazynu.</p>
                  </div>

                  <button
                    onClick={handleOpenAddProduct}
                    className="px-5 py-3 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#FF5B28]/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Dodaj Nowy Produkt</span>
                  </button>
                </div>

                {storeProducts.length === 0 ? (
                  <div className="p-12 bg-[#0E0E11] border border-white/5 rounded-2xl text-center space-y-2">
                    <p className="text-sm font-bold text-white">Brak produktów</p>
                    <p className="text-xs text-zinc-400">Kliknij przycisk powyżej, aby dodać produkt.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {storeProducts.map((p) => (
                      <div key={p.id} className="p-5 bg-[#0E0E11] border border-white/10 rounded-2xl flex flex-col justify-between hover:border-[#FF5B28]/40 transition-all shadow-xl">
                        <div>
                          <div className="w-full h-48 rounded-xl bg-[#18181B] overflow-hidden mb-4 border border-white/5">
                            <img
                              src={p.image || (p.images && p.images[0]) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] font-extrabold rounded-md uppercase">
                              {p.type}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono font-bold">Magazyn: {p.stock} szt.</span>
                          </div>
                          <h4 className="font-extrabold text-white text-base">{p.name}</h4>
                          <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{p.description}</p>
                          <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-lg font-black text-[#FF5B28] font-mono">{p.price}</span>
                            {p.comparePrice && <span className="text-xs text-zinc-500 line-through font-mono">{p.comparePrice}</span>}
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-cyan-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Edytuj
                          </button>
                          <button
                            onClick={() => executeWithSafeGuard(() => deleteProduct(p.id))}
                            className="px-3 py-1.5 bg-white/5 hover:bg-red-500/15 text-red-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Usuń
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: TRYB DROPU (COUNTDOWN TIMER) */}
            {activeTab === "drop" && (
              <div className="p-6 sm:p-8 bg-[#18181B] border border-white/10 rounded-3xl shadow-2xl space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span>Konfiguracja Odliczania do Dropu (Countdown Timer)</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Ustaw datę i godzinę premiery kolekcji. Na stronie sklepu pojawi się dynamiczny, animowany licznik na żywo, a sprzedaż zostanie odblokowana w godzinie zero.
                  </p>
                </div>

                <form onSubmit={handleSaveDropConfig} className="space-y-6 max-w-2xl">
                  {/* Drop Enable Toggle */}
                  <div className="p-4 bg-[#0E0E11] border border-white/10 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-white">Włącz Odliczanie do Dropu (Drop Mode)</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Blokuje standardowy widok sklepu i wyświetla licznik hype'u.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={dropEnabled}
                      onChange={(e) => setDropEnabled(e.target.checked)}
                      className="w-5 h-5 accent-[#FF5B28] cursor-pointer"
                    />
                  </div>

                  {/* Datetime Local Picker */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                      Data i godzina najbliższego dropu (Data Picker)
                    </label>
                    <input
                      type="datetime-local"
                      value={dropDate}
                      onChange={(e) => setDropDate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white font-mono font-bold focus:border-[#FF5B28] outline-none"
                    />
                  </div>

                  {/* Template Style */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                      Styl Wizualny Odliczania
                    </label>
                    <select
                      value={dropTemplate}
                      onChange={(e: any) => setDropTemplate(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                    >
                      <option value="Cyberpunk Launch">🔥 Modern Streetwear Hype / Cyberpunk</option>
                      <option value="Minimalist Timer">💎 Minimalist Luxury Clean</option>
                      <option value="Hypebeast Countdown">⚡ Electric Neon Countdown</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-xl shadow-lg shadow-[#FF5B28]/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Flame className="w-4 h-4" />
                    <span>Zapisz Ustawienia Dropu</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB: PAKIETY SAAS (SUBSKRYPCJE) */}
            {activeTab === "plans" && (
              <div className="p-6 sm:p-8 bg-[#18181B] border border-white/10 rounded-3xl shadow-2xl space-y-8 animate-in fade-in duration-200">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="px-3 py-1 bg-[#FF5B28]/10 text-[#FF5B28] rounded-full text-xs font-extrabold border border-[#FF5B28]/20 uppercase">
                    Pakiety Subskrypcyjne
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Wybierz Pakiet Dla Swojego Sklepu</h1>
                  <p className="text-xs text-zinc-400">Przełączaj plany subskrypcji w dowolnym momencie. Zmiana zostaje natychmiast zapisana w modelu sklepu.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Starter / Start */}
                  <div className={`p-6 bg-[#0E0E11] border rounded-2xl flex flex-col justify-between transition-all ${
                    currentStore.planType === "Start" ? "border-[#FF5B28] ring-2 ring-[#FF5B28]/30 shadow-xl" : "border-white/10"
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-extrabold text-[#FF5B28] uppercase">Testowy</span>
                        {currentStore.planType === "Start" && <span className="text-xs text-emerald-400 font-extrabold">Aktywny ✓</span>}
                      </div>
                      <h3 className="text-xl font-black text-white">Starter (Start)</h3>
                      <p className="text-xs text-zinc-400 mt-1">14 dni bez opłat na przetestowanie pomysłu.</p>
                      <div className="mt-4 text-3xl font-black text-white font-mono">0 PLN <span className="text-xs text-zinc-500 font-normal">/ 14 dni</span></div>
                      <ul className="mt-6 space-y-2 text-xs text-zinc-400">
                        <li className="flex items-center gap-2">✓ 1 sklep internetowy</li>
                        <li className="flex items-center gap-2">✓ Do 5 produktów</li>
                        <li className="flex items-center gap-2">✓ Płatności testowe Stripe</li>
                        <li className="flex items-center gap-2">✓ Subdomena .iskral.pl</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => executeWithSafeGuard(() => buyPlan("Start", "miesiac"))}
                      disabled={currentStore.planType === "Start"}
                      className={`mt-6 w-full py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        currentStore.planType === "Start"
                          ? "bg-white/10 text-zinc-400 cursor-default"
                          : "bg-[#FF5B28] hover:bg-[#e04f20] text-white shadow-lg shadow-[#FF5B28]/20"
                      }`}
                    >
                      {currentStore.planType === "Start" ? "Twój Obecny Pakiet" : "Wybierz Starter"}
                    </button>
                  </div>

                  {/* Drop / Creator */}
                  <div className={`p-6 bg-[#0E0E11] border rounded-2xl flex flex-col justify-between transition-all relative ${
                    currentStore.planType === "Creator" ? "border-[#FF5B28] ring-2 ring-[#FF5B28]/30 shadow-xl" : "border-white/10"
                  }`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF5B28] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                      Bestseller
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-extrabold text-[#FF5B28] uppercase">Polecany</span>
                        {currentStore.planType === "Creator" && <span className="text-xs text-emerald-400 font-extrabold">Aktywny ✓</span>}
                      </div>
                      <h3 className="text-xl font-black text-white">Drop (Creator)</h3>
                      <p className="text-xs text-zinc-400 mt-1">Dla marek odzieżowych i twórców dropów.</p>
                      <div className="mt-4 text-3xl font-black text-white font-mono">49.90 PLN <span className="text-xs text-zinc-500 font-normal">/ miesiąc</span></div>
                      <ul className="mt-6 space-y-2 text-xs text-zinc-400">
                        <li className="flex items-center gap-2 text-white font-bold">✓ Nielimitowane produkty</li>
                        <li className="flex items-center gap-2 text-white font-bold">✓ Dynamiczny Licznik Dropu</li>
                        <li className="flex items-center gap-2">✓ Do 3 sklepów internetowych</li>
                        <li className="flex items-center gap-2">✓ Prowizja tylko 1.0%</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => executeWithSafeGuard(() => buyPlan("Creator", "miesiac"))}
                      disabled={currentStore.planType === "Creator"}
                      className={`mt-6 w-full py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        currentStore.planType === "Creator"
                          ? "bg-white/10 text-zinc-400 cursor-default"
                          : "bg-[#FF5B28] hover:bg-[#e04f20] text-white shadow-lg shadow-[#FF5B28]/20"
                      }`}
                    >
                      {currentStore.planType === "Creator" ? "Twój Obecny Pakiet" : "Wybierz Pakiet Drop"}
                    </button>
                  </div>

                  {/* Pro / Brand */}
                  <div className={`p-6 bg-[#0E0E11] border rounded-2xl flex flex-col justify-between transition-all ${
                    currentStore.planType === "Brand" ? "border-[#FF5B28] ring-2 ring-[#FF5B28]/30 shadow-xl" : "border-white/10"
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-extrabold text-[#FF5B28] uppercase">Dla Firm</span>
                        {currentStore.planType === "Brand" && <span className="text-xs text-emerald-400 font-extrabold">Aktywny ✓</span>}
                      </div>
                      <h3 className="text-xl font-black text-white">Pro (Brand)</h3>
                      <p className="text-xs text-zinc-400 mt-1">Maksymalna wydajność i 0% prowizji.</p>
                      <div className="mt-4 text-3xl font-black text-white font-mono">99.90 PLN <span className="text-xs text-zinc-500 font-normal">/ miesiąc</span></div>
                      <ul className="mt-6 space-y-2 text-xs text-zinc-400">
                        <li className="flex items-center gap-2 text-emerald-400 font-bold">✓ 0% prowizji od sprzedaży</li>
                        <li className="flex items-center gap-2">✓ Do 10 sklepów internetowych</li>
                        <li className="flex items-center gap-2">✓ Własne domeny .pl / .com</li>
                        <li className="flex items-center gap-2">✓ Dedykowany support 24/7</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => executeWithSafeGuard(() => buyPlan("Brand", "miesiac"))}
                      disabled={currentStore.planType === "Brand"}
                      className={`mt-6 w-full py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        currentStore.planType === "Brand"
                          ? "bg-white/10 text-zinc-400 cursor-default"
                          : "bg-[#FF5B28] hover:bg-[#e04f20] text-white shadow-lg shadow-[#FF5B28]/20"
                      }`}
                    >
                      {currentStore.planType === "Brand" ? "Twój Obecny Pakiet" : "Wybierz Pakiet Pro"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: USTAWIENIA */}
            {activeTab === "settings" && (
              <div className="p-6 sm:p-8 bg-[#18181B] border border-white/10 rounded-3xl shadow-2xl space-y-6 animate-in fade-in duration-200 max-w-3xl">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-[#FF5B28]" />
                    <span>Ustawienia Konta i Profilu</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">Zarządzaj swoimi danymi, bezpieczeństwem 2FA oraz hasłem.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Imię i Nazwisko</label>
                    <input
                      type="text"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Adres E-mail</label>
                    <input
                      type="email"
                      value={emailInput}
                      disabled
                      className="w-full px-4 py-2.5 bg-[#0E0E11]/60 border border-white/5 rounded-xl text-xs text-zinc-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* MODAL: DODAWANIE / EDYCJA PRODUKTU */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#18181B] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-[#FF5B28]" />
                <span>{editingProductId ? "Edycja Produktu" : "Dodaj Nowy Produkt"}</span>
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Nazwa Produktu</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="np. Bluza Heavyweight Oversize 'Noir'"
                  className="w-full px-4 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white font-bold outline-none focus:border-[#FF5B28]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Cena (PLN)</label>
                  <input
                    type="text"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="149.00"
                    className="w-full px-4 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white font-mono font-bold outline-none focus:border-[#FF5B28]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Cena Porównawcza (PLN)</label>
                  <input
                    type="text"
                    value={prodComparePrice}
                    onChange={(e) => setProdComparePrice(e.target.value)}
                    placeholder="199.00"
                    className="w-full px-4 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-zinc-400 font-mono outline-none focus:border-[#FF5B28]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Stan Magazynowy (Szt.)</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white font-mono outline-none focus:border-[#FF5B28]"
                    min={0}
                  />
                </div>
              </div>

              {/* WARIANTY / ROZMIARY */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Warianty / Rozmiary</label>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {prodVariants.map((v) => (
                    <span key={v} className="px-2.5 py-1 bg-white/10 border border-white/10 rounded-lg text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <span>{v}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v)}
                        className="text-zinc-400 hover:text-red-400 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Wpisz rozmiar (np. XXL, One-Size)..."
                    value={prodVariantInput}
                    onChange={(e) => setProdVariantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddVariant();
                      }
                    }}
                    className="px-3 py-2 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white font-mono flex-1 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    + Dodaj Wariant
                  </button>
                </div>
              </div>

              {/* OPIS */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Opis Produktu</label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Krótki opis materiału, krojów lub instrukcji..."
                  className="w-full px-4 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#FF5B28]"
                />
              </div>

              {/* ZDJĘCIE URL */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Zdjęcie Produktu (URL)</label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/... lub link do zdjęcia"
                  className="w-full px-4 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white font-mono outline-none"
                />
              </div>

              {/* TYP I STATUS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Typ Produktu</label>
                  <select
                    value={prodType}
                    onChange={(e: any) => setProdType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="Fizyczny">📦 Produkt Fizyczny</option>
                    <option value="Cyfrowy">💻 Produkt Cyfrowy (Plik)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Status Publikacji</label>
                  <select
                    value={prodStatus}
                    onChange={(e: any) => setProdStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#0E0E11] border border-white/10 rounded-xl text-xs text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="Aktywny">🟢 Aktywny (Widoczny w sklepie)</option>
                    <option value="Zawieszony">⚪ Szkic (Ukryty)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer"
                >
                  {editingProductId ? "Zapisz Zmiany" : "Utwórz Produkt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
