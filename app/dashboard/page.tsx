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
  Upload
} from "lucide-react";

interface FeatureGateLockProps {
  title: string;
  description: string;
  requiredPlan: "Creator" | "Brand";
  onUpgrade: () => void;
}

function FeatureGateLock({ title, description, requiredPlan, onUpgrade }: FeatureGateLockProps) {
  return (
    <div className="w-full p-8 sm:p-12 bg-[#111216]/90 border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col items-center text-center relative overflow-hidden my-4 animate-in fade-in duration-300">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF5B28]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FF5B28]/10 border border-[#FF5B28]/30 text-[#FF5B28] flex items-center justify-center text-2xl font-extrabold shadow-lg shadow-[#FF5B28]/10">
          <Lock className="w-8 h-8 text-[#FF5B28]" />
        </div>

        <div className="space-y-1">
          <span className="px-3 py-1 bg-[#FF5B28]/15 text-[#FF5B28] border border-[#FF5B28]/30 rounded-full text-[10px] font-black uppercase tracking-wider">
            Wymagany Pakiet {requiredPlan}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight pt-2">
            {title}
          </h2>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed">
          {description}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          <button
            onClick={onUpgrade}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#FF5B28] to-[#FF8C38] hover:from-[#e04f20] hover:to-[#e07520] text-white font-extrabold text-xs rounded-full shadow-lg shadow-[#FF5B28]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Ulepsz Pakiet na {requiredPlan}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

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

  // 6 Main Navbar Tabs (Usługi tab removed, stores shown on Strona główna)
  const [activeTab, setActiveTab] = useState<
    "home" | "templates" | "marketplace" | "analytics" | "customers" | "settings" | "builder"
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
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSafeGuardModal, setShowSafeGuardModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Template Store Selector Modal state
  const [showTemplateStoreModal, setShowTemplateStoreModal] = useState(false);
  const [selectedTemplateToApply, setSelectedTemplateToApply] = useState<string | null>(null);
  const [targetStoreForTemplate, setTargetStoreForTemplate] = useState<string>("");

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Store design & config state
  const [storeNameInput, setStoreNameInput] = useState("");
  const [storeDescriptionInput, setStoreDescriptionInput] = useState("");
  const [subdomainInput, setSubdomainInput] = useState("");
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [templateInput, setTemplateInput] = useState("Dark Vibe");

  // Expanded Social Media State
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

  useEffect(() => {
    const currentSubdomain = activeStore?.subdomain || userStores[0]?.subdomain;
    const storeId = activeStore?.id || userStores[0]?.id;
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
  }, [subdomainInput, activeStore, userStores]);

  // SEO Form State
  const [metaTitleInput, setMetaTitleInput] = useState("");
  const [metaDescriptionInput, setMetaDescriptionInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  // Legal Terms & Privacy Form State
  const [termsOfServiceInput, setTermsOfServiceInput] = useState("");
  const [privacyPolicyInput, setPrivacyPolicyInput] = useState("");

  // Team & Campaign State
  const [teamEmailInput, setTeamEmailInput] = useState("");
  const [teamRoleInput, setTeamRoleInput] = useState("Edytor");
  const [campaignTitleInput, setCampaignTitleInput] = useState("");
  const [campaignSubjectInput, setCampaignSubjectInput] = useState("");

  // Product form state
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodComparePrice, setProdComparePrice] = useState("");
  const [prodType, setProdType] = useState<"Fizyczny" | "Cyfrowy">("Fizyczny");
  const [prodStock, setProdStock] = useState("50");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImage, setProdImage] = useState("");

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
  const totpSecret = "MOTYWO2FASEC2026KEY";
  const totpQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `otpauth://totp/Motywo.pl:${user?.email || "klient@motywo.pl"}?secret=${totpSecret}&issuer=Motywo.pl`
  )}`;

  const handleVerifyAndActivate2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (totpVerificationInput.trim().length !== 6) {
      alert("Wpisz poprawny 6-cyfrowy kod z aplikacji Authenticator.");
      return;
    }
    executeWithSafeGuard(() => {
      if (!user?.is2FAEnabled) {
        toggle2FA();
      }
      setShow2FAModal(false);
      setTotpVerificationInput("");
      setMessage({ type: "success", text: "🟢 Zabezpieczenie dwuskładnikowe 2FA (Authenticator App) zostało pomyślnie aktywowane!" });
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("checkout") === "success") {
        setMessage({
          type: "success",
          text: "🎉 Płatność Stripe zrealizowana pomyślnie! Twoja subskrypcja SaaS została aktywowana.",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [setMessage]);

  useEffect(() => {
    if (user) {
      setFullNameInput(user.name || "");
      setEmailInput(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (activeStore) {
      setStoreNameInput(activeStore.name || "");
      setStoreDescriptionInput(activeStore.description || "Oficjalny sklep marki motywo.pl");
      setSubdomainInput(activeStore.subdomain || "");
      setCustomDomainInput(activeStore.customDomain || "");
      setLogoUrlInput(activeStore.logoUrl || "");
      setTemplateInput(activeStore.template || "Dark Vibe");

      // Socials
      setInstagramInput(activeStore.socials?.instagram || "");
      setTiktokInput(activeStore.socials?.tiktok || "");
      setYoutubeInput(activeStore.socials?.youtube || "");
      setXInput(activeStore.socials?.x || "");
      setDiscordInput(activeStore.socials?.discord || "");
      setFacebookInput(activeStore.socials?.facebook || "");
      setBehanceInput(activeStore.socials?.behance || "");
      setTelegramInput(activeStore.socials?.telegram || "");

      // SEO
      setMetaTitleInput(activeStore.seoConfig?.metaTitle || `${activeStore.name} | Sklep Odzieżowy & Drop`);
      setMetaDescriptionInput(activeStore.seoConfig?.metaDescription || `Kupuj ubrania i akcesoria w sklepie ${activeStore.name}. Szybka wysyłka, oryginalne projekty.`);
      setKeywordsInput(activeStore.seoConfig?.keywords || `sklep, moda, streetwear, ${activeStore.subdomain}, motywo`);

      // Legal Terms
      setTermsOfServiceInput(activeStore.legalTerms?.termsOfService || "Regulamin Sklepu Internetowego motywo.pl...");
      setPrivacyPolicyInput(activeStore.legalTerms?.privacyPolicy || "Polityka Prywatności i Plików Cookies motywo.pl...");
    }
  }, [activeStore]);

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
      <main className="relative min-h-screen w-full bg-[#090A0C] text-white flex flex-col items-center justify-center p-6">
        <BackgroundVideo />
        <div className="relative z-10 p-8 bg-[#111216] border border-white/5 rounded-2xl text-center max-w-md shadow-2xl">
          <h2 className="text-2xl font-black text-white mb-2">Brak Dostępu</h2>
          <p className="text-xs text-zinc-400 mb-6">Musisz być zalogowany, aby zobaczyć swój panel klienta.</p>
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

  const currentStore: StoreConfig = activeStore || userStores[0] || {
    id: "default",
    name: `Sklep ${user.name}`,
    subdomain: "demo",
    customDomain: "",
    domainVerified: false,
    template: "Dark Vibe",
    accentColor: "#FF5B28",
    stripeStatus: "connected",
    balanceCents: 0,
    planType: user.plan || "Brand",
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
  const availableBalancePLN = ((currentStore.balanceCents || totalRevenueCents) / 100).toFixed(2);

  // Format Expiration Date & Time Helper
  const formatExpirationDate = (expDate?: string) => {
    if (user?.role === "superadmin") return "Bezterminowy (Superadmin)";
    if (!expDate) return "Ważny bezterminowo";
    const d = new Date(expDate);
    return `do ${d.toLocaleDateString("pl-PL")} r., godz. ${d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`;
  };

  // Live Expiration Countdown Helper
  const getExpirationCountdown = (expDate?: string) => {
    if (user?.role === "superadmin") return "Bezterminowy";
    if (!expDate) return "Ważny bezterminowo";
    const diffMs = new Date(expDate).getTime() - Date.now();
    if (diffMs <= 0) return "⚠️ Wygasł (Wymagana odnowa)";
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${mins}m`;
  };

  // Customer database compilation across user stores with Store Filtering
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

  // Open Template Selector Modal for target store selection
  const handleOpenTemplateSelector = (templateName: string) => {
    if (userStores.length === 1) {
      // Direct apply if only 1 store
      executeWithSafeGuard(() => {
        updateStoreConfig({ template: templateName });
        setTemplateInput(templateName);
        setMessage({ type: "success", text: `Zastosowano szablon: ${templateName} do sklepu ${currentStore.name}!` });
      });
    } else {
      setSelectedTemplateToApply(templateName);
      setTargetStoreForTemplate(currentStore.id);
      setShowTemplateStoreModal(true);
    }
  };

  const handleConfirmTemplateApplication = () => {
    if (!selectedTemplateToApply || !targetStoreForTemplate) return;
    executeWithSafeGuard(() => {
      setActiveStoreId(targetStoreForTemplate);
      updateStoreConfig({ template: selectedTemplateToApply });
      setTemplateInput(selectedTemplateToApply);
      setShowTemplateStoreModal(false);
      setMessage({ type: "success", text: `Zastosowano szablon ${selectedTemplateToApply} do wybranego sklepu!` });
    });
  };

  // Open Store Management in specific subtab (all 10 subtabs)
  const handleOpenStoreSubTab = (
    storeId: string,
    subTab: "overview" | "products" | "orders" | "design" | "drop" | "team" | "campaigns" | "domain" | "seo" | "legal"
  ) => {
    setActiveStoreId(storeId);
    setActiveTab("builder");
    setBuilderSubTab(subTab);
  };

  const handleGenerateLegalTermsTemplate = () => {
    const defaultTerms = `REGULAMIN SKLEPU INTERNETOWEGO ${currentStore.name.toUpperCase()}\n\n1. POSTANOWIENIA OGÓLNE\n1.1. Sklep Internetowy działający pod adresem https://${currentStore.subdomain}.iskral.pl prowadzony jest przez ${user?.name || "Właściciela Sklepu"}.\n1.2. Niniejszy Regulamin określa zasady korzystania ze Sklepu, składania zamówień oraz realizowania umów sprzedaży towarów fizycznych i cyfrowych.\n\n2. ZAMÓWIENIA I PŁATNOŚCI\n2.1. Wszystkie ceny w sklepie podawane są w złotych polskich (PLN).\n2.2. Płatności realizowane są za pośrednictwem bezpiecznego operatora płatności Stripe.\n\n3. DOSTAWA I ZWROTY\n3.1. Kupujący ma prawo odstąpić od umowy bez podania przyczyny w terminie 14 dni od dnia otrzymania towaru.\n3.2. W przypadku materiałów cyfrowych prawo odstąpienia od umowy wygasa w momencie pobrania pliku.`;

    const defaultPrivacy = `POLITYKA PRYWATNOŚCI I PLIKÓW COOKIES SKLEPU ${currentStore.name.toUpperCase()}\n\n1. ADMINISTRATOR DANYCH OSOBOWYCH\nAdministratorem danych osobowych zbieranych za pośrednictwem Sklepu jest ${currentStore.name}.\n\n2. CEL PRZETWARZANIA DANYCH\nDane przetwarzane są w celu realizacji zamówień, wystawienia dowodów zakupu oraz dostarczania zakupionych towarów.\n\n3. PRAWA UŻYTKOWNIKA\nUżytkownik posiada prawo dostępu do swoich danych, sprostowania oraz żądania ich usunięcia (RODO).`;

    setTermsOfServiceInput(defaultTerms);
    setPrivacyPolicyInput(defaultPrivacy);
    setMessage({ type: "success", text: "⚡ Wygenerowano gotowy wzorzec Regulaminu i Polityki Prywatności!" });
  };

  const handleSaveStoreOverviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeWithSafeGuard(() => {
      updateStoreConfig({
        name: storeNameInput,
        description: storeDescriptionInput,
        subdomain: subdomainInput,
        logoUrl: logoUrlInput,
        socials: {
          instagram: instagramInput,
          tiktok: tiktokInput,
          youtube: youtubeInput,
          x: xInput,
          discord: discordInput,
          facebook: facebookInput,
          behance: behanceInput,
          telegram: telegramInput,
        },
      });
      setMessage({ type: "success", text: "Zapisano nazwę sklepu, subdomenę, logo i media społecznościowe!" });
    });
  };

  const handleSaveSeoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeWithSafeGuard(() => {
      updateStoreConfig({
        seoConfig: {
          metaTitle: metaTitleInput,
          metaDescription: metaDescriptionInput,
          keywords: keywordsInput,
        },
      });
      setMessage({ type: "success", text: "Zapisano ustawienia SEO i słowa kluczowe Google!" });
    });
  };

  const handleSaveLegalTermsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeWithSafeGuard(() => {
      updateStoreConfig({
        legalTerms: {
          termsOfService: termsOfServiceInput,
          privacyPolicy: privacyPolicyInput,
          updatedAt: new Date().toLocaleDateString("pl-PL"),
        },
      });
      setMessage({ type: "success", text: "Zapisano Regulamin Sklepu oraz Politykę Prywatności!" });
    });
  };

  const handleAddTeamMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamEmailInput.trim()) return;
    executeWithSafeGuard(() => {
      const newMember: TeamMember = {
        id: `team_${Date.now()}`,
        email: teamEmailInput,
        role: teamRoleInput,
        permissions: ["read", "write"],
        addedAt: new Date().toLocaleDateString("pl-PL"),
      };
      updateStoreConfig({
        team: [...(currentStore.team || []), newMember],
      });
      setTeamEmailInput("");
      setMessage({ type: "success", text: `Dodano członka zespołu: ${teamEmailInput} (${teamRoleInput})` });
    });
  };

  const handleSendCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitleInput.trim() || !campaignSubjectInput.trim()) {
      alert("Wpisz tytuł i temat kampanii newslettera.");
      return;
    }
    executeWithSafeGuard(() => {
      const newCampaign: Campaign = {
        id: `camp_${Date.now()}`,
        title: campaignTitleInput,
        subject: campaignSubjectInput,
        sentDate: new Date().toLocaleDateString("pl-PL"),
        recipientsCount: filteredCustomers.length || 1,
        openRate: "68.4%",
      };
      updateStoreConfig({
        campaigns: [...(currentStore.campaigns || []), newCampaign],
      });
      setCampaignTitleInput("");
      setCampaignSubjectInput("");
      setMessage({ type: "success", text: "🚀 Wysyłka newslettera do bazy klientów została rozpoczęta!" });
    });
  };

  const handleSaveProfileAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeWithSafeGuard(() => {
      setMessage({ type: "success", text: "Zapisano dane osobowe i adres zamieszkania/firmowy!" });
    });
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmNewPassword) {
      alert("Nowe hasła muszą się zgadzać.");
      return;
    }
    executeWithSafeGuard(() => {
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setMessage({ type: "success", text: "Hasło zostało pomyślnie zmienione!" });
    });
  };

  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProdName("");
    setProdPrice("149.00");
    setProdComparePrice("199.00");
    setProdType("Fizyczny");
    setProdStock("50");
    setProdDescription("");
    setProdImage("");
    setShowProductModal(true);
  };

  const handleEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdPrice(p.price);
    setProdComparePrice(p.comparePrice || "");
    setProdType(p.type);
    setProdStock(String(p.stock));
    setProdDescription(p.description);
    setProdImage(p.image || "");
    setShowProductModal(true);
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert("Wprowadź nazwę produktu.");
      return;
    }
    const cleanPrice = prodPrice.replace(",", ".").replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(cleanPrice) || 0;
    const priceCents = Math.round(priceNum * 100);

    executeWithSafeGuard(() => {
      if (editingProductId) {
        updateProduct(editingProductId, {
          name: prodName,
          price: `${priceNum.toFixed(2)} PLN`,
          priceCents,
          type: prodType,
          stock: parseInt(prodStock) || 50,
          description: prodDescription,
          image: prodImage || undefined,
        });
        setMessage({ type: "success", text: `Zaktualizowano produkt: ${prodName}` });
      } else {
        addProduct({
          name: prodName,
          price: `${priceNum.toFixed(2)} PLN`,
          priceCents,
          type: prodType,
          status: "Aktywny",
          stock: parseInt(prodStock) || 50,
          description: prodDescription || "Produkt w sklepie.",
          image: prodImage || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        });
        setMessage({ type: "success", text: `Dodano produkt: ${prodName}` });
      }
      setShowProductModal(false);
      setEditingProductId(null);
    });
  };

  // IF WIZARD ACTIVE, RENDER FULLSCREEN WIZARD
  if (isWizardActive) {
    return (
      <main className="relative min-h-screen w-full bg-[#090A0C] text-white flex flex-col items-center justify-center p-4 sm:p-8">
        <BackgroundVideo />
        <div className="relative z-10 w-full max-w-5xl">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => setIsWizardActive(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              ← Powrót do Panelu Sklepu
            </button>
            <span className="text-xs text-zinc-400 font-mono">Panel Twórcy Motywo</span>
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
    <main className="min-h-screen w-full bg-[#090A0C] text-white flex flex-col font-sans pb-20 selection:bg-[#FF5B28] selection:text-white">
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
              {isEditUnlocked ? <Unlock className="w-3.5 h-3.5 text-red-300" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isEditUnlocked ? "Odblokowano Edycję" : "Tylko Do Odczytu"}</span>
            </button>

            <button
              onClick={exitImpersonation}
              className="px-3.5 py-1.5 bg-black text-white hover:bg-zinc-900 rounded-xl text-xs font-extrabold cursor-pointer transition-all border border-white/20 flex items-center gap-1.5 shadow-md"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Wróć do Admina</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Quick Return Switcher Bar for Admins / Superadmins */}
      {!isImpersonating && (user?.role === "superadmin" || user?.role === "admin") && (
        <div className="relative z-20 w-full px-6 py-2.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-b border-amber-500/20 backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-semibold">
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Jesteś zalogowany jako <strong className="text-white uppercase">{user.role}</strong>. Dostępna pełna Konsola Zarządcza Platformy.</span>
          </div>
          <Link
            href="/admin"
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Przełącz do Konsoli Admina</span>
          </Link>
        </div>
      )}

      {/* DOKŁADNE 7 ZAKŁADEK W PŁYWAJĄCYM DARK PILL NAVBARZE (#18191E) */}
      <header className="relative z-20 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#111216] p-3 px-6 rounded-2xl border border-white/5 shadow-xl">
          
          {/* Left: motywo.pl Brand Logo (Official /logo.svg) */}
          <Link href="/dashboard" className="flex items-center shrink-0">
            <img
              src="/logo.svg"
              alt="motywo.pl"
              className="h-8 sm:h-9 w-auto object-contain cursor-pointer"
            />
          </Link>

          {/* Center: 6 Main Dark Pill Tabs */}
          <div className="bg-[#18191E] border border-white/5 text-white p-1 rounded-full flex items-center gap-1 overflow-x-auto max-w-full">
            
            {/* 1. Strona główna */}
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "home"
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Strona główna</span>
            </button>

            {/* 2. Szablony */}
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "templates"
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Szablony</span>
            </button>

            {/* 3. Sklep */}
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "marketplace"
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Sklep</span>
            </button>

            {/* 4. Analityka */}
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analityka</span>
            </button>

            {/* 5. Baza klientów */}
            <button
              onClick={() => setActiveTab("customers")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "customers"
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Baza klientów</span>
            </button>

            {/* 6. Ustawienia */}
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#FF5B28] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Ustawienia</span>
            </button>

          </div>

          {/* Right: Interactive User Profile Dropdown Menu */}
          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-3 p-1.5 px-3.5 bg-[#090A0C] hover:bg-white/5 rounded-full border border-white/5 transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-8 h-8 rounded-full bg-[#1A1C23] border border-[#FF5B28]/50 text-[#FF5B28] flex items-center justify-center font-extrabold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {user.name ? user.name.substring(0, 2).toUpperCase() : "KL"}
              </div>

              <div className="flex flex-col text-left pr-1">
                <span className="text-xs font-extrabold text-white leading-tight flex items-center gap-1.5">
                  <span>{user.name || user.email}</span>
                  <span className="px-1.5 py-0.2 bg-[#FF5B28]/10 text-[#FF5B28] rounded text-[9px] font-extrabold border border-[#FF5B28]/20">
                    Właściciel
                  </span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono leading-tight">
                  {currentStore.subdomain}.iskral.pl
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180 text-[#FF5B28]" : "group-hover:text-white"}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#18191E] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in duration-150">
                <div className="px-3.5 py-2.5 border-b border-white/5 mb-1 bg-[#090A0C] rounded-xl">
                  <span className="text-[10px] uppercase font-extrabold text-[#FF5B28] block tracking-wider">
                    🏬 Właściciel Sklepu
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
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="p-1 hover:bg-white/10 rounded-lg text-xs font-bold transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CONTENT AREA BASED ON 7 TABS */}
        <div className="mt-6">

          {/* ZAKŁADKA 1: STRONA GŁÓWNA (KAFELKI SKLEPÓW Z PRZYCISKAMI PRODUKTY & ZAMÓWIENIA) */}
          {activeTab === "home" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Witaj w Panelu, {user.name || "Właścicielu"}!
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Poniżej znajdują się Twoje aktywne sklepy i pakiety. Wybierz sklep i wejdź bezpośrednio w Produkty lub Zamówienia.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab("marketplace")}
                  className="px-5 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-full shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kup Kolejny Pakiet / Sklep</span>
                </button>
              </div>

              {/* KAFELKI SKLEPÓW */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                {userStores.map((st) => {
                  const expStr = formatExpirationDate(st.planExpiresAt || user.planExpiresAt);
                  const stOrdersCount = (st.orders || []).filter((o) => o.status === "paid").length;
                  const stRevenueCents = (st.orders || [])
                    .filter((o) => o.status === "paid")
                    .reduce((sum, o) => sum + o.amountTotalCents, 0);

                  return (
                    <div
                      key={st.id}
                      className="p-6 bg-[#111216] border border-white/5 hover:border-[#FF5B28]/40 rounded-2xl shadow-xl flex flex-col justify-between transition-all group"
                    >
                      <div>
                        {/* Badges Header */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="px-2.5 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] border border-[#FF5B28]/20 rounded-full text-[10px] font-extrabold uppercase">
                            Pakiet: {(st.planType || user.plan).toUpperCase()}
                          </span>
                          <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            🟢 SKLEP AKTYWNY
                          </span>
                        </div>

                        {/* Store Info */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-[#FF5B28]/10 border border-[#FF5B28]/30 flex items-center justify-center text-[#FF5B28] font-black text-xl shrink-0">
                            {st.logoUrl ? (
                              <img src={st.logoUrl} alt={st.name} className="w-8 h-8 object-contain rounded-lg" />
                            ) : (
                              st.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-extrabold text-white">{st.name}</h3>
                            <a
                              href={getStoreUrl(st.subdomain, st.customDomain)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-cyan-400 hover:underline font-mono flex items-center gap-1"
                            >
                              <span>{st.subdomain}.iskral.pl</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>

                        {/* Plan Expiration Box with Live Countdown */}
                        <div className="p-3 bg-[#090A0C] border border-white/5 rounded-xl text-xs space-y-2 mb-4">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-[#FF5B28]" />
                              <span>Ważność Pakietu:</span>
                            </span>
                            <strong className="text-white font-mono text-[11px]">{expStr}</strong>
                          </div>

                          <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-white/5">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Pozostały Czas:</span>
                            </span>
                            <span className="px-2 py-0.5 bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-md text-[10px] font-mono font-extrabold">
                              {getExpirationCountdown(st.planExpiresAt || user.planExpiresAt)}
                            </span>
                          </div>

                          <div className="flex justify-between text-zinc-400 text-[11px] pt-1 border-t border-white/5">
                            <span>Przychód Sklepu:</span>
                            <strong className="text-emerald-400 font-mono">{(stRevenueCents / 100).toFixed(2)} PLN</strong>
                          </div>
                        </div>
                      </div>

                      {/* Direct Buttons on Tile: PRODUKTY and ZAMÓWIENIA */}
                      <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenStoreSubTab(st.id, "products")}
                            className="py-2.5 bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs rounded-xl border border-white/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Package className="w-3.5 h-3.5 text-[#FF5B28]" />
                            <span>📦 Produkty ({(st.products || []).length})</span>
                          </button>

                          <button
                            onClick={() => handleOpenStoreSubTab(st.id, "orders")}
                            className="py-2.5 bg-white/5 hover:bg-white/10 text-white font-extrabold text-xs rounded-xl border border-white/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
                            <span>🛍️ Zamówienia ({stOrdersCount})</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleOpenStoreSubTab(st.id, "overview")}
                          className="w-full py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>⚙️ Otwórz Kreator & Zarządzanie</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ZAKŁADKA 2: SZABLONY (Z POPUPEM WYBORU SKLEPU) */}
          {activeTab === "templates" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Katalog Szablonów Stron</h1>
                <p className="text-xs text-zinc-400 mt-1">Wybierz szablon dla swojego sklepu. Jeśli posiadasz kilka sklepów, system zapyta, do którego sklepu go przypisać.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: "Dark Vibe", desc: "Prestiż, Streetwear & Neon Vibe", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80" },
                  { name: "Minimalist Luxury", desc: "Czysta Elegancja & Odzież Premium", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80" },
                  { name: "Cyberpunk Launch", desc: "Drop Mode & Limitowane Edycje", img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80" },
                  { name: "Digital Creator", desc: "E-booki, Kursy i Pliki Cyfrowe", img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80" },
                ].map((tmpl) => (
                  <div key={tmpl.name} className="p-5 bg-[#111216] border border-white/5 hover:border-[#FF5B28]/40 rounded-2xl shadow-xl flex flex-col justify-between transition-all group">
                    <div>
                      <div className="w-full h-44 rounded-xl bg-cover bg-center mb-4 border border-white/10" style={{ backgroundImage: `url(${tmpl.img})` }} />
                      <h3 className="text-base font-extrabold text-white">{tmpl.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1">{tmpl.desc}</p>
                    </div>

                    <button
                      onClick={() => handleOpenTemplateSelector(tmpl.name)}
                      className={`mt-4 w-full py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                        currentStore.template === tmpl.name
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-[#FF5B28] hover:bg-[#e04f20] text-white border-[#FF5B28]"
                      }`}
                    >
                      {currentStore.template === tmpl.name ? "✓ Zastosowano w Aktywnym Sklepie" : "🎨 Wybierz & Zastosuj Szablon"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ZAKŁADKA 3: SKLEP (ZAKUP PAKIETÓW DLA NOWYCH SKLEPÓW) */}
          {activeTab === "marketplace" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="px-3 py-1 bg-[#FF5B28]/10 text-[#FF5B28] rounded-full text-xs font-extrabold border border-[#FF5B28]/20 uppercase">
                  Wybierz Pakiet Sklepowy
                </span>
                <h1 className="text-2xl font-black text-white tracking-tight">Kup Pakiet Dla Swojego Sklepu</h1>
                <p className="text-xs text-zinc-400">Aktywuj subskrypcję SaaS. Pakiet zostaje natychmiastowo przypisany do Twojego konta klienta.</p>
              </div>

              <Cennik />
            </div>
          )}

          {/* ZAKŁADKA 4: ANALITYKA (ZAWANSOWANA ANALITYKA SKLEPÓW) */}
          {activeTab === "analytics" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
              
              {/* Filter & Header */}
              <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] border border-[#FF5B28]/20 rounded-full text-[10px] font-extrabold uppercase">
                      Centrum Analityczne
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-extrabold">
                      ⚡ Dane na Żywo
                    </span>
                  </div>
                  <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 mt-2">
                    <BarChart3 className="w-6 h-6 text-[#FF5B28]" />
                    <span>Zaawansowana Analityka Sprzedaży</span>
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Kompleksowy podgląd przychodów, wolumenu zamówień i konwersji ze wszystkich Twoich marek.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={analyticsStoreIdFilter}
                    onChange={(e) => setAnalyticsStoreIdFilter(e.target.value)}
                    className="px-4 py-2.5 bg-[#090A0C] border border-white/10 hover:border-[#FF5B28]/40 rounded-full text-xs text-white font-extrabold outline-none cursor-pointer shadow-inner transition-all"
                  >
                    <option value="all">🌐 Wszystkie Sklepy Razem ({userStores.length})</option>
                    {userStores.map((s) => (
                      <option key={s.id} value={s.id}>🏬 {s.name} ({s.subdomain}.iskral.pl)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Top Analytics Metric Cards */}
              {(() => {
                const targetStores = analyticsStoreIdFilter === "all"
                  ? userStores
                  : userStores.filter((s) => s.id === analyticsStoreIdFilter);

                const allPaidOrders = targetStores.flatMap((s) => (s.orders || []).filter((o) => o.status === "paid"));
                const totalRevCents = allPaidOrders.reduce((sum, o) => sum + o.amountTotalCents, 0);
                const totalRevPLN = (totalRevCents / 100).toFixed(2);
                const totalOrdersCount = allPaidOrders.length;
                const avgOrderValuePLN = totalOrdersCount > 0 ? (totalRevCents / totalOrdersCount / 100).toFixed(2) : "0.00";
                const totalBalanceCents = targetStores.reduce((sum, s) => sum + (s.balanceCents || 0), 0);
                const totalBalancePLN = (totalBalanceCents > 0 ? totalBalanceCents / 100 : totalRevCents / 100).toFixed(2);

                return (
                  <div className="flex flex-col gap-6">
                    {/* 4 Main Stat Tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-2 relative overflow-hidden group hover:border-[#FF5B28]/40 transition-all">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Łączny Obrót (PLN)</span>
                          <div className="p-2 bg-[#FF5B28]/10 text-[#FF5B28] rounded-xl"><DollarSign className="w-4 h-4" /></div>
                        </div>
                        <div className="text-3xl font-black text-white">{totalRevPLN} PLN</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold pt-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+24.8% vs poprzedni miesiąc</span>
                        </div>
                      </div>

                      <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-2 relative overflow-hidden group hover:border-blue-500/40 transition-all">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Opłacone Zamówienia</span>
                          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl"><ShoppingBag className="w-4 h-4" /></div>
                        </div>
                        <div className="text-3xl font-black text-blue-400">{totalOrdersCount} szt.</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-blue-300 font-bold pt-1">
                          <span>Wskaźnik Realizacji: 100%</span>
                        </div>
                      </div>

                      <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-2 relative overflow-hidden group hover:border-purple-500/40 transition-all">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Średnia Koszyka (AOV)</span>
                          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl"><TrendingUp className="w-4 h-4" /></div>
                        </div>
                        <div className="text-3xl font-black text-purple-400">{avgOrderValuePLN} PLN</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-300 font-bold pt-1">
                          <span>Wysoka Wartość Koszyka</span>
                        </div>
                      </div>

                      <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Dostępne Saldo IBAN</span>
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><Wallet className="w-4 h-4" /></div>
                        </div>
                        <div className="text-3xl font-black text-emerald-400">{totalBalancePLN} PLN</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-bold pt-1">
                          <span>Wypłaty Stripe: Gotowe</span>
                        </div>
                      </div>
                    </div>

                    {/* Sales Breakdown Progress & Visual Performance */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left 2 Cols: Store Sales Share Chart & Table */}
                      <div className="lg:col-span-2 p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-[#FF5B28]" />
                            <span>Udział Sprzedaży Sklepów</span>
                          </h3>
                          <span className="text-xs text-zinc-400">Liczba sklepów: {targetStores.length}</span>
                        </div>

                        {/* Interactive Store Revenue Progress Bars */}
                        <div className="space-y-4 pt-2">
                          {targetStores.map((st) => {
                            const stPaidOrders = (st.orders || []).filter((o) => o.status === "paid");
                            const stRevCents = stPaidOrders.reduce((sum, o) => sum + o.amountTotalCents, 0);
                            const stRevPLN = (stRevCents / 100).toFixed(2);
                            const sharePercent = totalRevCents > 0 ? Math.round((stRevCents / totalRevCents) * 100) : 0;

                            return (
                              <div key={st.id} className="space-y-1.5 p-3 bg-[#090A0C] border border-white/5 rounded-xl">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <strong className="text-white font-extrabold">{st.name}</strong>
                                    <span className="text-[10px] text-cyan-400 font-mono">({st.subdomain}.iskral.pl)</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-zinc-400 text-[11px]">{stPaidOrders.length} zam.</span>
                                    <strong className="text-emerald-400 font-mono text-xs">{stRevPLN} PLN</strong>
                                    <span className="px-2 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] rounded text-[10px] font-black">
                                      {sharePercent}%
                                    </span>
                                  </div>
                                </div>
                                {/* Bar */}
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-[#FF5B28] to-orange-400 transition-all duration-500 rounded-full"
                                    style={{ width: `${Math.max(sharePercent, 5)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Store Details Table */}
                        <div className="overflow-x-auto pt-2">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-white/5 text-zinc-400 uppercase text-[10px]">
                                <th className="py-2 px-3 font-bold">Sklep / Domena</th>
                                <th className="py-2 px-3 font-bold">Pakiet</th>
                                <th className="py-2 px-3 font-bold text-center">Zamówienia</th>
                                <th className="py-2 px-3 font-bold text-right">Obrót PLN</th>
                                <th className="py-2 px-3 font-bold text-right">Akcja</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {targetStores.map((st) => {
                                const stPaidOrders = (st.orders || []).filter((o) => o.status === "paid");
                                const stRevCents = stPaidOrders.reduce((sum, o) => sum + o.amountTotalCents, 0);

                                return (
                                  <tr key={st.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-2.5 px-3">
                                      <div className="font-extrabold text-white">{st.name}</div>
                                      <span className="text-[10px] text-cyan-400 font-mono">{st.subdomain}.iskral.pl</span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="px-2 py-0.5 bg-[#FF5B28]/10 text-[#FF5B28] border border-[#FF5B28]/20 rounded text-[10px] font-extrabold uppercase">
                                        {st.planType || user.plan}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-400">
                                      {stPaidOrders.length}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-400">
                                      {(stRevCents / 100).toFixed(2)} PLN
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <button
                                        onClick={() => handleOpenStoreSubTab(st.id, "overview")}
                                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                                      >
                                        Zarządzaj →
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right 1 Col: Top Selling Products */}
                      <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                              <Package className="w-4 h-4 text-emerald-400" />
                              <span>Top Oferty Sklepów</span>
                            </h3>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase">Najlepsze</span>
                          </div>

                          <div className="space-y-3 pt-3">
                            {targetStores.flatMap((s) => s.products || []).slice(0, 4).map((p, idx) => (
                              <div key={p.id || idx} className="p-3 bg-[#090A0C] border border-white/5 rounded-xl flex items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#FF5B28]/10 text-[#FF5B28] flex items-center justify-center font-black text-xs shrink-0">
                                    #{idx + 1}
                                  </div>
                                  <div>
                                    <h5 className="font-extrabold text-white text-xs truncate max-w-[140px]">{p.name}</h5>
                                    <span className="text-[10px] text-zinc-400">Typ: {p.type || "Fizyczny"}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-black text-[#FF5B28] block">{p.price}</span>
                                  <span className="text-[10px] text-emerald-400 font-mono">Magazyn: {p.stock || 50}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-[#090A0C] border border-white/5 rounded-xl text-[11px] text-zinc-400 space-y-1 text-center mt-4">
                          <span>💡 Wskazówka: Zwiększ konwersję dodając warianty limitowane w kreatorze dropów.</span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* ZAKŁADKA 6: BAZA KLIENTÓW (Z FILTERKIEM SKLEPÓW) */}
          {activeTab === "customers" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
              <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#FF5B28]" />
                      <span>Baza Klientów ({filteredCustomers.length})</span>
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">Lista kupujących z możliwością filtrowania po wybranym sklepie.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Store Filter Selector */}
                    <select
                      value={customerStoreFilter}
                      onChange={(e) => setCustomerStoreFilter(e.target.value)}
                      className="px-4 py-2 bg-[#090A0C] border border-white/5 rounded-full text-xs text-white font-extrabold outline-none cursor-pointer"
                    >
                      <option value="all">🏬 Wszystkie Twoje Sklepy</option>
                      {userStores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.subdomain}.iskral.pl)
                        </option>
                      ))}
                    </select>

                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Szukaj e-maila..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[#090A0C] border border-white/5 rounded-full text-xs text-white outline-none focus:border-[#FF5B28]"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#090A0C]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18191E] text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-white/5">
                      <tr>
                        <th className="p-4">KUPUJĄCY (E-MAIL)</th>
                        <th className="p-4">PRZYPISANY SKLEP</th>
                        <th className="p-4">KWOTA ZAMÓWIENIA</th>
                        <th className="p-4 text-right">DATA ZAKUPU</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-zinc-400">
                            Brak kupujących w wybranym sklepie.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c) => (
                          <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-mono font-bold text-white">{c.email}</td>
                            <td className="p-4">
                              <span className="font-extrabold text-white block">{c.storeName}</span>
                              <span className="text-[10px] text-cyan-400 font-mono">{c.storeSubdomain}.iskral.pl</span>
                            </td>
                            <td className="p-4 text-emerald-400 font-extrabold text-sm">{c.amountPLN} PLN</td>
                            <td className="p-4 text-right text-zinc-400 font-mono">{c.date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ZAKŁADKA 7: USTAWIENIA (DANE OSOBOWE, ADRES ZAMIESZKANIA, HASŁO & WERYFIKACJA STRIPE) */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-6 w-full max-w-4xl animate-in fade-in duration-300">
              
              {/* Formularz Danych Osobistych i Adresu */}
              <form onSubmit={handleSaveProfileAddressSubmit} className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-6">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-[#FF5B28]" />
                    <span>Dane Osobowe & Adres Zamieszkania / Firmy</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">Uzupełnij oficjalne dane profilowe przypisane do Twojego konta klienta.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Imię i Nazwisko</label>
                    <input
                      type="text"
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Adres E-mail</label>
                    <input
                      type="email"
                      value={emailInput}
                      disabled
                      className="w-full px-4 py-2.5 bg-[#090A0C]/50 border border-white/5 rounded-xl text-xs text-zinc-400 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-white/5">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#FF5B28]" />
                    <span>Adres Zamieszkania / Siedziba Firmy</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Ulica i numer domostwa / lokalu</label>
                    <input
                      type="text"
                      value={streetInput}
                      onChange={(e) => setStreetInput(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Kod pocztowy</label>
                      <input
                        type="text"
                        value={zipInput}
                        onChange={(e) => setZipInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Miasto</label>
                      <input
                        type="text"
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Kraj</label>
                      <input
                        type="text"
                        value={countryInput}
                        onChange={(e) => setCountryInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="px-6 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-full shadow-sm cursor-pointer">
                  Zapisz Dane Profilowe
                </button>
              </form>

              {/* Zmiana Hasła */}
              <form onSubmit={handlePasswordChangeSubmit} className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#FF5B28]" />
                  <span>Zmiana Hasła Dostępowe</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Obecne Hasło</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Nowe Hasło</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Powtórz Nowe Hasło</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-4 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <button type="submit" className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-full cursor-pointer">
                  Zmień Hasło
                </button>
              </form>

              {/* Status Weryfikacji Stripe Identity */}
              <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Weryfikacja Konta Pod Płatności Stripe</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">Status gotowości wypłat środków bezpośrednio na konto bankowe.</p>
                </div>

                <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-extrabold">
                  🟢 Weryfikacja Stripe Gotowa
                </span>
              </div>

              {/* Sekcja Bezpieczeństwa 2FA Authenticator */}
              <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#FF5B28]" />
                      <span>Dwuskładnikowa Autoryzacja 2FA (Google Authenticator / Authy)</span>
                    </h3>
                    {user.is2FAEnabled ? (
                      <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-extrabold">
                        🟢 2FA AKTYWNE
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded-full text-[10px] font-extrabold">
                        🔴 2FA WYŁĄCZONE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">Zabezpiecz konto jednorazowymi kodami z aplikacji Authenticator.</p>
                </div>

                {user.is2FAEnabled ? (
                  <button
                    type="button"
                    onClick={() => executeWithSafeGuard(() => toggle2FA())}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-extrabold text-xs rounded-full border border-red-500/30 cursor-pointer"
                  >
                    Wyłącz 2FA
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShow2FAModal(true)}
                    className="px-5 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-full shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Skonfiguruj Authenticator 2FA</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* DEDYKOWANY PEŁNY MODUŁ KREATORA SKLEPU (`activeTab === "builder"`) */}
          {activeTab === "builder" && (
            <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <button
                  onClick={() => setActiveTab("home")}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border border-white/5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>← Powrót do Listy Sklepów</span>
                </button>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400">Edytujesz sklep:</span>
                  <strong className="text-white font-extrabold">{currentStore.name}</strong>
                </div>
              </div>

              {/* Sub-tabs for Store Builder (10 Subtabs) */}
              <div className="bg-[#111216] p-2 rounded-2xl border border-white/5 flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setBuilderSubTab("overview")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "overview" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  ⚙️ Ustawienia & Logo
                </button>
                <button
                  onClick={() => setBuilderSubTab("products")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "products" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  📦 Produkty ({storeProducts.length})
                </button>
                <button
                  onClick={() => setBuilderSubTab("orders")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "orders" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🛍️ Zamówienia ({paidOrders.length})
                </button>
                <button
                  onClick={() => setBuilderSubTab("design")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "design" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🎨 Wygląd & Szablony
                </button>
                <button
                  onClick={() => setBuilderSubTab("drop")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "drop" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🚀 Tryb Dropu
                </button>
                <button
                  onClick={() => setBuilderSubTab("team")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "team" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  👥 Zespół ({(currentStore.team || []).length})
                </button>
                <button
                  onClick={() => setBuilderSubTab("campaigns")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "campaigns" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  📧 Newsletter
                </button>
                <button
                  onClick={() => setBuilderSubTab("domain")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "domain" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🌐 Domena Zewnętrzna
                </button>
                <button
                  onClick={() => setBuilderSubTab("seo")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "seo" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  🔍 SEO Sklepu
                </button>
                <button
                  onClick={() => setBuilderSubTab("legal")}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    builderSubTab === "legal" ? "bg-[#FF5B28] text-white shadow-lg shadow-[#FF5B28]/25" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  📜 Regulamin & RODO
                </button>
              </div>

              {/* SUBTAB 1: USTAWIENIA SKLEPU, SUBDOMENA, LOGO & EXPANDED SOCIAL MEDIA */}
              {builderSubTab === "overview" && (
                <form onSubmit={handleSaveStoreOverviewSubmit} className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5 text-[#FF5B28]" />
                      <span>Ustawienia Sklepu & Branding Marki</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Skonfiguruj dane podstawowe, podepnij subdomenę oraz zdefiniuj linki do mediów społecznościowych.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Nazwa Sklepu</label>
                      <input
                        type="text"
                        value={storeNameInput}
                        onChange={(e) => setStoreNameInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-extrabold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Subdomena Sklepu (nazwa.iskral.pl)</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          value={subdomainInput}
                          onChange={(e) => setSubdomainInput(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-l-xl text-xs text-cyan-400 font-mono font-bold"
                        />
                        <span className="px-3 py-2.5 bg-white/5 border border-l-0 border-white/10 rounded-r-xl text-xs text-zinc-400 font-mono">
                          .iskral.pl
                        </span>
                      </div>
                      {subdomainValidation && (
                        <div className={`mt-1.5 text-[11px] font-extrabold flex items-center gap-1.5 ${subdomainValidation.available ? "text-emerald-400" : "text-red-400"}`}>
                          {subdomainValidation.checking ? (
                            <span className="text-zinc-400 animate-pulse">⏳ {subdomainValidation.message}</span>
                          ) : (
                            <span>{subdomainValidation.message}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Opis Sklepu / Bio Marki</label>
                    <textarea
                      rows={2}
                      value={storeDescriptionInput}
                      onChange={(e) => setStoreDescriptionInput(e.target.value)}
                      placeholder="Oficjalny sklep streetwear i akcesoriów..."
                      className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                    />
                  </div>

                  {/* Logo Dropzone / URL */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 mb-1">Logo Marki (URL lub Przeciągnij Plik)</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-[#090A0C] border border-white/10 flex items-center justify-center text-zinc-500 overflow-hidden shrink-0">
                        {logoUrlInput ? (
                          <img src={logoUrlInput} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Upload className="w-6 h-6 text-zinc-600" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="https://domena.pl/logo.png"
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Expanded Social Media */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-[#FF5B28]" />
                      <span>Social Media Sklepu</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">Discord Webhook / Invite</label>
                        <input
                          type="text"
                          value={discordInput}
                          onChange={(e) => setDiscordInput(e.target.value)}
                          placeholder="https://discord.gg/..."
                          className="w-full px-3 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">Facebook Fanpage</label>
                        <input
                          type="text"
                          value={facebookInput}
                          onChange={(e) => setFacebookInput(e.target.value)}
                          placeholder="https://facebook.com/..."
                          className="w-full px-3 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">X (Twitter)</label>
                        <input
                          type="text"
                          value={xInput}
                          onChange={(e) => setXInput(e.target.value)}
                          placeholder="https://x.com/..."
                          className="w-full px-3 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">Instagram Profile</label>
                        <input
                          type="text"
                          value={instagramInput}
                          onChange={(e) => setInstagramInput(e.target.value)}
                          placeholder="https://instagram.com/..."
                          className="w-full px-3 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">Behance Portfolio</label>
                        <input
                          type="text"
                          value={behanceInput}
                          onChange={(e) => setBehanceInput(e.target.value)}
                          placeholder="https://behance.net/..."
                          className="w-full px-3 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">YouTube Channel</label>
                        <input
                          type="text"
                          value={youtubeInput}
                          onChange={(e) => setYoutubeInput(e.target.value)}
                          placeholder="https://youtube.com/@..."
                          className="w-full px-3 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">TikTok Account</label>
                        <input
                          type="text"
                          value={tiktokInput}
                          onChange={(e) => setTiktokInput(e.target.value)}
                          placeholder="https://tiktok.com/@..."
                          className="w-full px-3 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 mb-1">Telegram Group</label>
                        <input
                          type="text"
                          value={telegramInput}
                          onChange={(e) => setTelegramInput(e.target.value)}
                          placeholder="https://t.me/..."
                          className="w-full px-3 py-2 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="px-6 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-full shadow-sm cursor-pointer">
                    💾 Zapisz Ustawienia Sklepu & Social Media
                  </button>
                </form>
              )}

              {/* SUBTAB 2: PRODUKTY */}
              {builderSubTab === "products" && (
                <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-[#FF5B28]" />
                        <span>Katalog Produktów Sklepu ({storeProducts.length})</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">Zarządzaj asortymentem, cenami i stanem magazynowym.</p>
                    </div>

                    <button onClick={handleOpenAddProduct} className="px-5 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white text-xs font-extrabold rounded-full shadow-sm cursor-pointer flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>Dodaj Nowy Produkt</span>
                    </button>
                  </div>

                  {storeProducts.length === 0 ? (
                    <div className="p-8 bg-[#090A0C] border border-white/5 rounded-xl text-center">
                      <p className="text-xs text-zinc-400">Brak dodanych produktów. Kliknij przycisk powyżej, aby dodać pierwszy artykuł.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {storeProducts.map((p) => (
                        <div key={p.id} className="p-4 bg-[#090A0C] border border-white/5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-white/10 text-white text-[10px] font-extrabold rounded-md uppercase">
                                {p.type}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">Stan: {p.stock} szt.</span>
                            </div>
                            <h4 className="font-extrabold text-white text-sm">{p.name}</h4>
                            <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{p.description}</p>
                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="text-sm font-extrabold text-[#FF5B28] font-mono">{p.price} PLN</span>
                              {p.comparePrice && <span className="text-xs text-zinc-500 line-through font-mono">{p.comparePrice} PLN</span>}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <button onClick={() => handleEditProduct(p)} className="text-xs text-cyan-400 hover:underline font-bold">
                              Edytuj
                            </button>
                            <button onClick={() => executeWithSafeGuard(() => deleteProduct(p.id))} className="text-xs text-red-400 hover:underline font-bold">
                              Usuń
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: ZAMÓWIENIA */}
              {builderSubTab === "orders" && (
                <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-4">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#FF5B28]" />
                      <span>Historia Zamówień Sklepu ({paidOrders.length})</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Przeglądaj opłacone transakcje klientów Twojego sklepu.</p>
                  </div>

                  {paidOrders.length === 0 ? (
                    <div className="p-8 bg-[#090A0C] border border-white/5 rounded-xl text-center">
                      <p className="text-xs text-zinc-400">Brak zamowień. Zamówienia klientów pojawią się w tym miejscu natychmiast po opłaceniu w koszyku.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-white/5 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-white/5 text-zinc-400 uppercase font-extrabold text-[10px]">
                          <tr>
                            <th className="p-3">ID Transakcji</th>
                            <th className="p-3">E-mail Klienta</th>
                            <th className="p-3">Kwota PLN</th>
                            <th className="p-3">Data</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {paidOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-white/[0.02]">
                              <td className="p-3 font-mono text-zinc-400">{o.id}</td>
                              <td className="p-3 font-extrabold text-white font-mono">{o.customerEmail}</td>
                              <td className="p-3 font-extrabold text-emerald-400 font-mono">{(o.amountTotalCents / 100).toFixed(2)} PLN</td>
                              <td className="p-3 text-zinc-400">{new Date(o.createdAt || Date.now()).toLocaleDateString("pl-PL")}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-extrabold">
                                  ✓ Opłacone Stripe
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 4: WYGLĄD & SZABLONY */}
              {builderSubTab === "design" && (
                <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Palette className="w-5 h-5 text-[#FF5B28]" />
                      <span>Wygląd Graficzny Sklepu & Szablon</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Wybierz jeden z 4 predefiniowanych szablonów przygotowanych pod wysokie nawrócenie.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { name: "Dark Vibe", desc: "Prestiż, Streetwear & Neon Vibe", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80" },
                      { name: "Minimalist Luxury", desc: "Czysta Elegancja & Odzież Premium", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80" },
                      { name: "Cyberpunk Launch", desc: "Drop Mode & Limitowane Edycje", img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&auto=format&fit=crop&q=80" },
                      { name: "Digital Creator", desc: "E-booki, Kursy i Pliki Cyfrowe", img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80" },
                    ].map((tmpl) => (
                      <div key={tmpl.name} className="p-4 bg-[#090A0C] border border-white/5 hover:border-[#FF5B28]/40 rounded-2xl shadow-xl flex flex-col justify-between transition-all">
                        <div>
                          <div className="w-full h-36 rounded-xl bg-cover bg-center mb-3 border border-white/10" style={{ backgroundImage: `url(${tmpl.img})` }} />
                          <h3 className="text-sm font-extrabold text-white">{tmpl.name}</h3>
                          <p className="text-[11px] text-zinc-400 mt-1">{tmpl.desc}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            executeWithSafeGuard(() => {
                              updateStoreConfig({ template: tmpl.name });
                              setTemplateInput(tmpl.name);
                              setMessage({ type: "success", text: `Aktywowano szablon: ${tmpl.name}` });
                            });
                          }}
                          className={`mt-4 w-full py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                            currentStore.template === tmpl.name
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-[#FF5B28] hover:bg-[#e04f20] text-white border-[#FF5B28]"
                          }`}
                        >
                          {currentStore.template === tmpl.name ? "✓ Aktywny Szablon" : "Zastosuj Szablon"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 5: DROPY */}
              {builderSubTab === "drop" && (
                !hasAccess("canUseDrops") ? (
                  <FeatureGateLock
                    title="Moduł Dropu i Premier Produktowych"
                    description="Twórz limitowane edycje produktów, uruchamiaj odliczanie w czasie rzeczywistym i buduj ekskluzywność marek streetwear/digital."
                    requiredPlan="Creator"
                    onUpgrade={() => setActiveTab("marketplace")}
                  />
                ) : (
                <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#FF5B28]" />
                      <span>Tryb Dropu (Drop Mode Countdown)</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Włącz licznik odliczający do premiery nowej kolekcji lub dropu produktów.</p>
                  </div>

                  <div className="p-4 bg-[#090A0C] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-white text-sm">Status Trybu Dropu</h4>
                        <p className="text-xs text-zinc-400">Po włączeniu strona główna sklepu będzie wyświetlać wyłącznie ekran odliczania.</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          executeWithSafeGuard(() => {
                            const newStatus = !currentStore.dropConfig?.enabled;
                            updateStoreConfig({
                              dropConfig: { ...currentStore.dropConfig, enabled: newStatus },
                            });
                            setMessage({ type: "success", text: `Tryb dropu został ${newStatus ? "WŁĄCZONY" : "WYŁĄCZONY"}.` });
                          });
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-extrabold border ${
                          currentStore.dropConfig?.enabled
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-white/5 text-zinc-400 border-white/10"
                        }`}
                      >
                        {currentStore.dropConfig?.enabled ? "🟢 WŁĄCZONY" : "⚪ WYŁĄCZONY"}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">Data & Godzina Premiery Dropu</label>
                        <input
                          type="datetime-local"
                          value={currentStore.dropConfig?.targetDate || ""}
                          onChange={(e) => {
                            updateStoreConfig({
                              dropConfig: { ...currentStore.dropConfig, targetDate: e.target.value },
                            });
                          }}
                          className="w-full px-4 py-2 bg-[#111216] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">Motyw Odliczania Dropu</label>
                        <select
                          value={currentStore.dropConfig?.template || "Cyberpunk Launch"}
                          onChange={(e) => {
                            updateStoreConfig({
                              dropConfig: { ...currentStore.dropConfig, template: e.target.value as any },
                            });
                          }}
                          className="w-full px-4 py-2 bg-[#111216] border border-white/10 rounded-xl text-xs text-white font-extrabold"
                        >
                          <option value="Cyberpunk Launch">Cyberpunk Launch</option>
                          <option value="Minimalist Timer">Minimalist Timer</option>
                          <option value="Hypebeast Countdown">Hypebeast Countdown</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                )
              )}

              {/* SUBTAB 6: ZESPÓŁ (TEAM COLLABORATION) */}
              {builderSubTab === "team" && (
                !hasAccess("canUseTeam") ? (
                  <FeatureGateLock
                    title="Współpraca Zespołowa (Team Collaboration)"
                    description="Zapraszaj członków zespołu, przydzielaj indywidualne role i bezpiecznie zarządzaj uprawnieniami w Twoim sklepie."
                    requiredPlan="Creator"
                    onUpgrade={() => setActiveTab("marketplace")}
                  />
                ) : (
                <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#FF5B28]" />
                      <span>Współpraca Zespołowa (Team Collaboration)</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Dodawaj współpracowników i przydzielaj im role zarządcze w Twoim sklepie.</p>
                  </div>

                  <form onSubmit={handleAddTeamMemberSubmit} className="p-4 bg-[#090A0C] border border-white/5 rounded-2xl space-y-4">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Dodaj Nowego Członka Zespołu</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="email"
                        value={teamEmailInput}
                        onChange={(e) => setTeamEmailInput(e.target.value)}
                        placeholder="pracownik@firma.pl"
                        className="w-full px-4 py-2 bg-[#111216] border border-white/10 rounded-xl text-xs text-white font-mono"
                      />
                      <select
                        value={teamRoleInput}
                        onChange={(e) => setTeamRoleInput(e.target.value)}
                        className="w-full px-4 py-2 bg-[#111216] border border-white/10 rounded-xl text-xs text-white font-extrabold"
                      >
                        <option value="Edytor">Edytor (Produkty & Opisy)</option>
                        <option value="Manager">Manager (Zamówienia & Analityka)</option>
                        <option value="Właściciel">Współwłaściciel</option>
                      </select>
                      <button type="submit" className="px-5 py-2 bg-[#FF5B28] text-white font-extrabold text-xs rounded-xl cursor-pointer">
                        ➕ Dodaj do Zespołu
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {(currentStore.team || []).length === 0 ? (
                      <p className="text-xs text-zinc-400">Brak dodanych członków zespołu. Jesteś jedynym właścicielem tego sklepu.</p>
                    ) : (
                      (currentStore.team || []).map((m) => (
                        <div key={m.id} className="p-3 bg-[#090A0C] rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <span className="font-mono font-bold text-white">{m.email}</span>
                            <span className="ml-3 px-2 py-0.5 bg-white/10 text-zinc-300 rounded-md text-[10px] font-bold">{m.role}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              executeWithSafeGuard(() => {
                                updateStoreConfig({
                                  team: (currentStore.team || []).filter((t) => t.id !== m.id),
                                });
                                setMessage({ type: "success", text: `Usunięto członka zespołu ${m.email}` });
                              });
                            }}
                            className="text-red-400 hover:underline font-bold"
                          >
                            Usuń
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                )
              )}

              {/* SUBTAB 7: NEWSLETTER & KAMPANIE */}
              {builderSubTab === "campaigns" && (
                !hasAccess("canUseNewsletter") ? (
                  <FeatureGateLock
                    title="Wbudowany E-mail Newsletter"
                    description="Zbieraj bazy subskrybentów i wysyłaj automatyczne kampanie e-mail do swoich klientów."
                    requiredPlan="Creator"
                    onUpgrade={() => setActiveTab("marketplace")}
                  />
                ) : (
                <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Send className="w-5 h-5 text-[#FF5B28]" />
                      <span>Newsletter & Kampanie Mailowe</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Wysyłaj masowe wiadomości e-mail do klientów, którzy zrobili zakupy w Twoim sklepie.</p>
                  </div>

                  <form onSubmit={handleSendCampaignSubmit} className="p-4 bg-[#090A0C] border border-white/5 rounded-2xl space-y-4">
                    <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Stwórz nową kampanię mailową</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">Nazwa Kampanii (wewnętrzna)</label>
                        <input
                          type="text"
                          value={campaignTitleInput}
                          onChange={(e) => setCampaignTitleInput(e.target.value)}
                          placeholder="Drop Kolekcji Wiosna 2026"
                          className="w-full px-4 py-2 bg-[#111216] border border-white/10 rounded-xl text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 mb-1">Temat Wiadomości E-mail</label>
                        <input
                          type="text"
                          value={campaignSubjectInput}
                          onChange={(e) => setCampaignSubjectInput(e.target.value)}
                          placeholder="⚡ Nowa dostawa już na sklepie!"
                          className="w-full px-4 py-2 bg-[#111216] border border-white/10 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    <button type="submit" className="px-6 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-full cursor-pointer flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      <span>Wyślij Newsletter do Klientów</span>
                    </button>
                  </form>
                </div>
                )
              )}

              {/* SUBTAB 8: WŁASNA DOMENA */}
              {builderSubTab === "domain" && (
                !hasAccess("canUseCustomDomain") ? (
                  <FeatureGateLock
                    title="Podpinanie Własnej Domeny Zewnętrznej"
                    description="Podepnij swój własny adres strony (np. twojadomena.pl) z darmowym certyfikatem SSL, darmowym CDN i automatyczną weryfikacją DNS."
                    requiredPlan="Brand"
                    onUpgrade={() => setActiveTab("marketplace")}
                  />
                ) : (
                <div className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-[#FF5B28]" />
                      <span>Podpięcie Własnej Domeny Zewnętrznej</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Podepnij własny adres www (np. mojastrona.pl) pod Twój sklep.</p>
                  </div>

                  <div className="p-4 bg-[#090A0C] border border-white/5 rounded-2xl space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Własna Domena WWW</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customDomainInput}
                          onChange={(e) => setCustomDomainInput(e.target.value)}
                          placeholder="mojastrona.pl"
                          className="w-full px-4 py-2.5 bg-[#111216] border border-white/10 rounded-xl text-xs text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            executeWithSafeGuard(() => {
                              updateStoreConfig({ customDomain: customDomainInput, domainVerified: true });
                              setMessage({ type: "success", text: "Zapisano domenę i zweryfikowano rekordy CNAME!" });
                            });
                          }}
                          className="px-5 py-2.5 bg-[#FF5B28] text-white font-extrabold text-xs rounded-xl cursor-pointer whitespace-nowrap"
                        >
                          Zapisz & Weryfikuj Rekordy
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-[#111216] border border-white/5 rounded-xl text-xs text-zinc-400 space-y-1 font-mono">
                      <p className="font-bold text-white">Instrukcja Rekordów DNS u Twojego Rejestratora:</p>
                      <p>• Rekord CNAME: <span className="text-cyan-400">cname.iskral.pl</span></p>
                      <p>• Rekord A: <span className="text-cyan-400">76.76.21.21</span></p>
                    </div>
                  </div>
                </div>
                )
              )}

              {/* SUBTAB 9: SEO SKLEPU */}
              {builderSubTab === "seo" && (
                <form onSubmit={handleSaveSeoSubmit} className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                      <Search className="w-5 h-5 text-[#FF5B28]" />
                      <span>Pozycjonowanie SEO & Słowa Kluczowe Google</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">Zoptymalizuj nagłówki meta i zapowiedzi w wyszukiwarkach i na social mediach.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Meta Tytuł (Title Tag)</label>
                      <input
                        type="text"
                        value={metaTitleInput}
                        onChange={(e) => setMetaTitleInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Meta Opis (Meta Description)</label>
                      <textarea
                        rows={3}
                        value={metaDescriptionInput}
                        onChange={(e) => setMetaDescriptionInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Słowa Kluczowe (Google Keywords)</label>
                      <input
                        type="text"
                        value={keywordsInput}
                        onChange={(e) => setKeywordsInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Podgląd Karty Google */}
                  <div className="p-4 bg-[#090A0C] border border-white/5 rounded-xl space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Podgląd w Wynikach Wyszukiwania Google</span>
                    <h4 className="text-sm font-bold text-blue-400 hover:underline cursor-pointer">{metaTitleInput}</h4>
                    <p className="text-[11px] text-emerald-400 font-mono">https://{subdomainInput || "demo"}.iskral.pl</p>
                    <p className="text-xs text-zinc-400 line-clamp-2">{metaDescriptionInput}</p>
                  </div>

                  <button type="submit" className="px-6 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-full cursor-pointer">
                    🔍 Zapisz Ustawienia SEO
                  </button>
                </form>
              )}

              {/* SUBTAB 10: REGULAMIN SKLEPU & RODO */}
              {builderSubTab === "legal" && (
                <form onSubmit={handleSaveLegalTermsSubmit} className="p-6 bg-[#111216] border border-white/5 rounded-2xl shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#FF5B28]" />
                        <span>Regulamin Sklepu & Polityka Prywatności (RODO)</span>
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1">Zarządzaj treścią wymaganego prawem regulaminu dla Twoich kupujących.</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateLegalTermsTemplate}
                      className="px-4 py-2 bg-[#FF5B28]/10 hover:bg-[#FF5B28]/20 text-[#FF5B28] border border-[#FF5B28]/30 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap"
                    >
                      ⚡ Wygeneruj Wzorzec Regulaminu (RODO)
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Regulamin Sklepu Internetowego</label>
                      <textarea
                        rows={8}
                        value={termsOfServiceInput}
                        onChange={(e) => setTermsOfServiceInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 mb-1">Polityka Prywatności & Cookies</label>
                      <textarea
                        rows={6}
                        value={privacyPolicyInput}
                        onChange={(e) => setPrivacyPolicyInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <button type="submit" className="px-6 py-2.5 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-full cursor-pointer">
                    📜 Zapisz Regulamin Sklepu & Legal
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>

      {/* TARGET STORE SELECTOR MODAL FOR TEMPLATE APPLICATION */}
      {showTemplateStoreModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111216] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-extrabold text-white">Zastosuj Szablon Graficzny</h3>
              <button onClick={() => setShowTemplateStoreModal(false)} className="text-zinc-400 hover:text-white font-bold">✕</button>
            </div>

            <p className="text-xs text-zinc-400">
              Wybierz sklep, do którego chcesz przypisać szablon <strong className="text-white">{selectedTemplateToApply}</strong>:
            </p>

            <select
              value={targetStoreForTemplate}
              onChange={(e) => setTargetStoreForTemplate(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white font-extrabold outline-none"
            >
              {userStores.map((s) => (
                <option key={s.id} value={s.id}>
                  🏬 {s.name} ({s.subdomain}.iskral.pl)
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowTemplateStoreModal(false)} className="px-4 py-2 bg-white/10 text-white rounded-full text-xs font-bold">
                Anuluj
              </button>
              <button onClick={handleConfirmTemplateApplication} className="px-5 py-2 bg-[#FF5B28] text-white rounded-full text-xs font-extrabold">
                Zastosuj Szablon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA AUTHENTICATOR SETUP MODAL */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111216] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#FF5B28]" />
                <span>Konfiguracja 2FA Authenticator</span>
              </h2>
              <button onClick={() => setShow2FAModal(false)} className="text-zinc-400 hover:text-white font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Zeskanuj kod QR poniżej w aplikacji <strong>Google Authenticator</strong>, <strong>Authy</strong> lub <strong>1Password</strong>:
            </p>

            {/* QR Code display */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl">
              <img src={totpQrUrl} alt="2FA QR Code" className="w-44 h-44 object-contain" />
            </div>

            {/* Manual secret key */}
            <div className="p-3 bg-[#090A0C] border border-white/5 rounded-xl text-center space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Klucz Ręczny (Secret Key):</span>
              <div className="flex items-center justify-center gap-2">
                <code className="text-xs text-cyan-400 font-mono font-bold tracking-widest">{totpSecret}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(totpSecret);
                    setMessage({ type: "success", text: "Skopiowano klucz 2FA do schowka!" });
                  }}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-extrabold cursor-pointer"
                >
                  Kopiuj
                </button>
              </div>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerifyAndActivate2FA} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Wpisz 6-cyfrowy kod z aplikacji Authenticator:</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={totpVerificationInput}
                  onChange={(e) => setTotpVerificationInput(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full px-4 py-3 bg-[#090A0C] border border-white/10 rounded-xl text-center text-lg font-mono text-white tracking-widest outline-none focus:border-[#FF5B28]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-full shadow-sm cursor-pointer transition-all"
              >
                🚀 Zweryfikuj & Aktywuj 2FA
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD/EDIT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#111216] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-extrabold text-white">
                {editingProductId ? "Edytuj Produkt" : "Dodaj Nowy Produkt"}
              </h2>
              <button onClick={() => setShowProductModal(false)} className="text-zinc-400 hover:text-white text-xl font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Nazwa Produktu</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="np. Bluza Hype Hoodie"
                  className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#FF5B28]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Cena (PLN)</label>
                  <input
                    type="text"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="149.00"
                    className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#FF5B28]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Magazyn</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#090A0C] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#FF5B28]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FF5B28] hover:bg-[#e04f20] text-white font-extrabold text-xs rounded-full transition-all shadow-sm cursor-pointer"
              >
                Zapisz Produkt w Sklepie
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
