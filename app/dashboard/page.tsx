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
  ArrowLeft,
  Zap,
  Clock,
  ArrowUpRight,
  Shield,
} from "lucide-react";

export default function DashboardPage() {
  const {
    user,
    allUsers,
    activeStore,
    userStores,
    setActiveStoreId,
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

  // Navigation mode:
  // "main" -> standard left menu
  // "package" -> specific store/package sub-tools
  const [navMode, setNavMode] = useState<"main" | "package">("main");

  // Active tab within "main" mode: "home" | "shop" | "templates" | "settings"
  const [mainTab, setMainTab] = useState<"home" | "shop" | "templates" | "settings">("home");

  // Services Accordion open state in sidebar
  const [isServicesAccordionOpen, setIsServicesAccordionOpen] = useState(true);

  // Active tab within "package" mode:
  // "editor" | "stats" | "products" | "orders" | "domain" | "balance" | "newsletter" | "team" | "drop" | "seo"
  const [packageTab, setPackageTab] = useState<
    "editor" | "stats" | "products" | "orders" | "domain" | "balance" | "newsletter" | "team" | "drop" | "seo"
  >("editor");

  // Selected Service Package
  const [selectedService, setSelectedService] = useState<ServicePackage | null>(null);

  // Configuration Modal state (Kreator Konfiguracji Sklepu)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configService, setConfigService] = useState<ServicePackage | null>(null);

  // Store Configuration Form State
  const [cfgName, setCfgName] = useState("");
  const [cfgSubdomain, setCfgSubdomain] = useState("");
  const [cfgDescription, setCfgDescription] = useState("");
  const [cfgLogo, setCfgLogo] = useState<string>("");
  const [cfgTemplate, setCfgTemplate] = useState("Dark Vibe");
  const [cfgColor, setCfgColor] = useState("#3B82F6");
  const [cfgShowSocials, setCfgShowSocials] = useState(true);
  const [cfgInstagram, setCfgInstagram] = useState("");
  const [cfgTiktok, setCfgTiktok] = useState("");
  const [cfgYoutube, setCfgYoutube] = useState("");
  const [cfgX, setCfgX] = useState("");
  const [cfgDiscord, setCfgDiscord] = useState("");
  const [cfgFacebook, setCfgFacebook] = useState("");
  const [cfgSubdomainAvailable, setCfgSubdomainAvailable] = useState<boolean | null>(null);
  const [cfgCheckingSubdomain, setCfgCheckingSubdomain] = useState(false);

  // Renewal & Upgrade Modal state
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewTargetService, setRenewTargetService] = useState<ServicePackage | null>(null);
  const [renewCycle, setRenewCycle] = useState<"miesiac" | "rok">("miesiac");

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTargetService, setUpgradeTargetService] = useState<ServicePackage | null>(null);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<PlanType>("Brand");

  // Rename Service Modal state
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTargetService, setRenameTargetService] = useState<ServicePackage | null>(null);
  const [newServiceName, setNewServiceName] = useState("");

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
  const [payoutIban, setPayoutIban] = useState("PL 12 1020 4900 0000 1234 5678 9012");

  // Team & Newsletter State
  const [teamEmail, setTeamEmail] = useState("");
  const [campaignTitle, setCampaignTitle] = useState("");

  // Top User Pill Menu
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Live countdown clock ticker (updates every second)
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync profile state with user
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
    name: "Dropwear Club",
    subdomain: "dropwear",
    customDomain: "",
    domainVerified: false,
    template: "Dark Vibe",
    accentColor: "#3B82F6",
    stripeStatus: "connected",
    balanceCents: 0,
    planType: user?.plan || "Brand",
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

  // Store Customization & Editor State (editable per store)
  const [storeEditName, setStoreEditName] = useState(currentStore.name || "");
  const [storeEditSubdomain, setStoreEditSubdomain] = useState(currentStore.subdomain || "");
  const [storeEditAnnouncement, setStoreEditAnnouncement] = useState(currentStore.announcement || "");
  const [storeEditColor, setStoreEditColor] = useState(currentStore.accentColor || "#3B82F6");
  const [storeEditLogo, setStoreEditLogo] = useState(currentStore.logoUrl || "");
  const [storeEditInstagram, setStoreEditInstagram] = useState(currentStore.socials?.instagram || "");
  const [storeEditTiktok, setStoreEditTiktok] = useState(currentStore.socials?.tiktok || "");
  const [storeEditYoutube, setStoreEditYoutube] = useState(currentStore.socials?.youtube || "");
  const [storeEditX, setStoreEditX] = useState(currentStore.socials?.x || "");
  const [storeEditDiscord, setStoreEditDiscord] = useState(currentStore.socials?.discord || "");

  useEffect(() => {
    if (currentStore) {
      setDropEnabled(Boolean(currentStore.dropConfig?.enabled));
      setDropDate(currentStore.dropConfig?.targetDate || "");
      setDropTemplate(currentStore.dropConfig?.template || "Cyberpunk Launch");
      setStoreEditName(currentStore.name || "");
      setStoreEditSubdomain(currentStore.subdomain || "");
      setStoreEditAnnouncement(currentStore.announcement || "🎉 Witaj w naszym sklepie!");
      setStoreEditColor(currentStore.accentColor || "#3B82F6");
      setStoreEditLogo(currentStore.logoUrl || "");
      setStoreEditInstagram(currentStore.socials?.instagram || "");
      setStoreEditTiktok(currentStore.socials?.tiktok || "");
      setStoreEditYoutube(currentStore.socials?.youtube || "");
      setStoreEditX(currentStore.socials?.x || "");
      setStoreEditDiscord(currentStore.socials?.discord || "");
    }
  }, [currentStore.id, currentStore.subdomain, currentStore.name]);

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
      <main className="min-h-screen w-full bg-[#0A0B0D] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1E2025] border-t-[#3B82F6] rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-[#0A0B0D] text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-[#111215] border border-[#1E2025] rounded-[16px] p-8 text-center max-w-md space-y-4">
          <h2 className="text-xl font-bold text-white">Brak Dostępu</h2>
          <p className="text-xs text-zinc-400">Zaloguj się, aby uzyskać dostęp do swojego panelu klienta.</p>
          <Link
            href="/logowanie"
            className="inline-block px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs transition-all"
          >
            Przejdź do logowania →
          </Link>
        </div>
      </main>
    );
  }

  // Derive user services/packages
  const userServices: ServicePackage[] = (user.services && user.services.length > 0)
    ? user.services
    : (user.plan && user.plan !== "Brak")
    ? [
        {
          id: `srv_${user.id || "active"}`,
          number: 442,
          title: (user.stores && user.stores[0]?.name) || `Pakiet ${user.plan} #442`,
          planType: user.plan,
          status: (user.stores && user.stores.length > 0 && user.hasStore) ? "Przypisany" : "Nieprzypisany",
          assignedStoreId: (user.stores && user.stores[0]?.id) || user.store?.id,
          assignedStoreName: (user.stores && user.stores[0]?.name) || user.store?.name || "Mój Sklep",
          assignedSubdomain: (user.stores && user.stores[0]?.subdomain) || user.store?.subdomain || "dropwear",
          expiresAt: user.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString("pl-PL") : "21.09.2026, godz. 00:02",
          createdAt: user.createdAt || new Date().toISOString(),
        },
      ]
    : [];

  const hasPurchasedPackages = userServices.length > 0 || (Boolean(user.plan) && user.plan !== "Brak");
  const hasConfiguredStore = (userStores.length > 0 && user.hasStore) || userServices.some((s) => s.status === "Przypisany");

  const displayServices: ServicePackage[] = userServices;

  // Helper to calculate live countdown
  const getRemainingTime = (expiresAtStr: string) => {
    // If expiresAtStr has a date format, try parsing it, fallback to +30 days
    const expDate = new Date(expiresAtStr).getTime() || Date.now() + 29 * 24 * 3600 * 1000 + 14 * 3600 * 1000;
    const diff = expDate - currentTime;
    if (diff <= 0) return "Wygasł";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const handleStartConfiguration = (service: ServicePackage) => {
    setConfigService(service);
    setCfgName("");
    setCfgSubdomain("");
    setCfgDescription("");
    setCfgLogo("");
    setCfgTemplate("Dark Vibe");
    setCfgColor("#3B82F6");
    setCfgShowSocials(true);
    setCfgInstagram("");
    setCfgTiktok("");
    setCfgYoutube("");
    setCfgX("");
    setCfgDiscord("");
    setCfgFacebook("");
    setShowConfigModal(true);
  };

  const handleOpenPackageManagement = (service: ServicePackage) => {
    setSelectedService(service);
    if (service.assignedStoreId) {
      setActiveStoreId(service.assignedStoreId);
    }
    setNavMode("package");
    setPackageTab("editor");
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

    const cleanSub = cfgSubdomain.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    const created = createOrUpdateStoreFull({
      serviceId: configService?.id,
      name: cfgName.trim(),
      subdomain: cleanSub,
      niche: "Moda & Streetwear",
      logoUrl: cfgLogo,
      template: cfgTemplate,
      accentColor: cfgColor,
      announcement: "🎉 Nowa kolekcja już dostępna online!",
      plan: configService?.planType || user.plan || "Brand",
      billingCycle: "miesiac",
    });

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

    if (created && created.id) {
      setActiveStoreId(created.id);
    }
    setShowConfigModal(false);
    setNavMode("package");
    setPackageTab("editor");
    setMessage({
      type: "success",
      text: `🎉 Sklep ${cfgName} został skonfigurowany pod adresem: https://${cleanSub}.iskral.pl`,
    });
  };

  // Renew Service Package Handler
  const handleExecuteRenewal = () => {
    if (!renewTargetService) return;
    const addedDays = renewCycle === "rok" ? 365 : 30;
    const costPLN = renewCycle === "rok"
      ? (renewTargetService.planType === "Brand" ? 599 : renewTargetService.planType === "Creator" ? 299 : 0)
      : (renewTargetService.planType === "Brand" ? 99.9 : renewTargetService.planType === "Creator" ? 49.9 : 0);

    const updatedServices = (user.services || []).map((s) => {
      if (s.id === renewTargetService.id) {
        const currentExp = new Date(s.expiresAt).getTime() || Date.now();
        const newExp = new Date(currentExp + addedDays * 24 * 3600 * 1000).toLocaleString("pl-PL");
        return { ...s, expiresAt: newExp };
      }
      return s;
    });

    updateUserProfile({ services: updatedServices });
    setShowRenewModal(false);
    setMessage({
      type: "success",
      text: `Pakiet ${renewTargetService.title} został pomyślnie przedłużony o ${addedDays} dni!`,
    });
  };

  // Upgrade Service Package Handler
  const handleExecuteUpgrade = () => {
    if (!upgradeTargetService) return;
    const oldPlanPrice = upgradeTargetService.planType === "Creator" ? 49.9 : 0;
    const newPlanPrice = targetUpgradePlan === "Brand" ? 99.9 : 49.9;
    const priceDiff = Math.max(0, newPlanPrice - oldPlanPrice);

    const updatedServices = (user.services || []).map((s) => {
      if (s.id === upgradeTargetService.id) {
        return {
          ...s,
          planType: targetUpgradePlan,
          title: `Pakiet ${targetUpgradePlan} #${s.number}`,
        };
      }
      return s;
    });

    updateUserProfile({ services: updatedServices, plan: targetUpgradePlan });
    setShowUpgradeModal(false);
    setMessage({
      type: "success",
      text: `Pakiet pomyślnie uaktualniony do ${targetUpgradePlan}! Dopłacono różnicę: ${priceDiff.toFixed(2)} PLN.`,
    });
  };

  // Store Editor Save Handler
  const handleSaveStoreEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeEditName.trim()) {
      alert("Wpisz nazwę sklepu.");
      return;
    }
    const cleanSub = storeEditSubdomain.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleanSub) {
      alert("Wpisz poprawną subdomenę.");
      return;
    }

    updateStoreConfig({
      name: storeEditName.trim(),
      subdomain: cleanSub,
      announcement: storeEditAnnouncement,
      accentColor: storeEditColor,
      logoUrl: storeEditLogo,
      socials: {
        instagram: storeEditInstagram,
        tiktok: storeEditTiktok,
        youtube: storeEditYoutube,
        x: storeEditX,
        discord: storeEditDiscord,
      },
    });

    setMessage({
      type: "success",
      text: `🎉 Zapisano ustawienia sklepu '${storeEditName}'! Adres: https://${cleanSub}.iskral.pl`,
    });
  };

  const handleStoreLogoUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setStoreEditLogo(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
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
    <div className="min-h-screen w-full bg-[#0A0B0D] text-white flex font-sans antialiased selection:bg-[#3B82F6] selection:text-white">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR (BG: #111215, STROKE: #1E2025, NO SHADOWS) */}
      {/* ========================================================================= */}
      <aside className="w-64 bg-[#111215] border-r border-[#1E2025] min-h-screen flex flex-col justify-between shrink-0 sticky top-0 h-screen overflow-y-auto z-20">
        <div className="p-6">
          
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 mb-8 group">
            <img src="/logo.svg" alt="iskral" className="h-7 w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>

          {/* ========================================== */}
          {/* SIDEBAR VIEW A: GŁÓWNE MENU */}
          {/* ========================================== */}
          {navMode === "main" ? (
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2 block">
                GŁÓWNE
              </span>

              {/* Strona główna */}
              <button
                onClick={() => setMainTab("home")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  mainTab === "home"
                    ? "text-white font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Home className={`w-4 h-4 transition-colors ${mainTab === "home" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Strona główna</span>
              </button>

              {/* Sklep */}
              <button
                onClick={() => setMainTab("shop")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  mainTab === "shop"
                    ? "text-white font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <ShoppingBag className={`w-4 h-4 transition-colors ${mainTab === "shop" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Sklep</span>
              </button>

              {/* Szablony */}
              <button
                onClick={() => setMainTab("templates")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  mainTab === "templates"
                    ? "text-white font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Layers className={`w-4 h-4 transition-colors ${mainTab === "templates" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Szablony</span>
              </button>

              {/* Usługi Accordion - rozwija listę zakupionych pakietów */}
              <div className="pt-1">
                <button
                  onClick={() => setIsServicesAccordionOpen(!isServicesAccordionOpen)}
                  className="w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between text-zinc-400 hover:text-white cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    <span>Usługi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.2 bg-[#0A0B0D] border border-[#1E2025] text-zinc-400 text-[10px] rounded font-mono group-hover:text-zinc-200">
                      {displayServices.length}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-zinc-500 transition-transform group-hover:text-white ${
                        isServicesAccordionOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Rozwinięte usługi */}
                {isServicesAccordionOpen && (
                  <div className="ml-5 pl-3 border-l border-[#1E2025] my-1 space-y-1">
                    {displayServices.length === 0 ? (
                      <button
                        onClick={() => setMainTab("shop")}
                        className="w-full text-left py-1.5 text-[11px] font-medium text-zinc-500 hover:text-white transition-colors cursor-pointer"
                      >
                        + Kup pierwszy pakiet
                      </button>
                    ) : (
                      displayServices.map((srv) => (
                        <button
                          key={srv.id}
                          onClick={() => {
                            if (srv.status === "Nieprzypisany") {
                              handleStartConfiguration(srv);
                            } else {
                              handleOpenPackageManagement(srv);
                            }
                          }}
                          className="w-full text-left py-1.5 text-xs font-medium transition-colors flex items-center justify-between text-zinc-400 hover:text-white cursor-pointer group"
                        >
                          <span className="truncate">
                            {srv.assignedStoreName || srv.title}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-[#0A0B0D] border border-[#1E2025] rounded text-zinc-500 group-hover:text-zinc-300">
                            #{srv.number}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Ustawienia */}
              <button
                onClick={() => setMainTab("settings")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  mainTab === "settings"
                    ? "text-white font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <SettingsIcon className={`w-4 h-4 transition-colors ${mainTab === "settings" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Ustawienia</span>
              </button>
            </div>
          ) : (
            /* ========================================== */
            /* SIDEBAR VIEW B: PAKIET (ZARZĄDZANIE SKLEPEM) */
            /* ========================================== */
            <div className="space-y-1">
              
              {/* Back to main */}
              <button
                onClick={() => {
                  setNavMode("main");
                  setMainTab("home");
                }}
                className="w-full text-left px-3 py-2 text-zinc-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-2 mb-3 cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                <span>← Wróć do menu</span>
              </button>

              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2 block">
                PAKIET: {(currentStore.planType || user.plan || "Brand").toUpperCase()}
              </span>

              <button
                onClick={() => setPackageTab("editor")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "editor" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Layers className={`w-3.5 h-3.5 transition-colors ${packageTab === "editor" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Edytor strony</span>
              </button>

              <button
                onClick={() => setPackageTab("stats")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "stats" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <BarChart3 className={`w-3.5 h-3.5 transition-colors ${packageTab === "stats" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Statystyki</span>
              </button>

              <button
                onClick={() => setPackageTab("products")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "products" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Package className={`w-3.5 h-3.5 transition-colors ${packageTab === "products" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Dodaj produkt</span>
              </button>

              <button
                onClick={() => setPackageTab("orders")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "orders" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <ShoppingBag className={`w-3.5 h-3.5 transition-colors ${packageTab === "orders" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Zamówienia</span>
              </button>

              <button
                onClick={() => setPackageTab("domain")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "domain" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Globe className={`w-3.5 h-3.5 transition-colors ${packageTab === "domain" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Domena</span>
              </button>

              <button
                onClick={() => setPackageTab("balance")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "balance" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Wallet className={`w-3.5 h-3.5 transition-colors ${packageTab === "balance" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Saldo</span>
              </button>

              <button
                onClick={() => setPackageTab("newsletter")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "newsletter" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Mail className={`w-3.5 h-3.5 transition-colors ${packageTab === "newsletter" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Newsletter</span>
              </button>

              <button
                onClick={() => setPackageTab("team")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "team" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Users className={`w-3.5 h-3.5 transition-colors ${packageTab === "team" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>Team Collaboration</span>
              </button>

              <button
                onClick={() => setPackageTab("drop")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "drop" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Flame className={`w-3.5 h-3.5 transition-colors ${packageTab === "drop" ? "text-orange-400" : "text-zinc-500 group-hover:text-orange-400"}`} />
                <span>Drop</span>
              </button>

              <button
                onClick={() => setPackageTab("seo")}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2.5 cursor-pointer group ${
                  packageTab === "seo" ? "text-white font-semibold" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Search className={`w-3.5 h-3.5 transition-colors ${packageTab === "seo" ? "text-white" : "text-zinc-500 group-hover:text-white"}`} />
                <span>SEO</span>
              </button>
            </div>
          )}

        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-[#1E2025]">
          <button
            onClick={() => {
              logout();
              router.push("/logowanie");
            }}
            className="w-full px-3 py-2 text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-2 cursor-pointer group"
          >
            <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
            <span>Wyloguj się</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA (BG: #0A0B0D, HEADER HAS NO STROKE) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP HEADER BAR (BG: #0A0B0D, NO STROKE / NO BORDER) */}
        <header className="w-full px-8 py-6 flex items-center justify-between bg-[#0A0B0D]">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {navMode === "package"
                ? currentStore.name
                : mainTab === "home"
                ? "Strona główna"
                : mainTab === "shop"
                ? "Sklep"
                : mainTab === "templates"
                ? "Szablony"
                : "Ustawienia"}
            </h1>
          </div>

          {/* User Profile Pill */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 p-1.5 pl-2 pr-4 bg-[#111215] hover:bg-[#16181F] rounded-full border border-[#1E2025] transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#1E2025] text-zinc-300 font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name ? user.name.slice(0, 2).toUpperCase() : "JK"}</span>
                )}
              </div>
              <span className="text-xs font-bold text-zinc-200">{user.name || user.email}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#111215] border border-[#1E2025] rounded-2xl p-2 z-50 animate-in fade-in duration-100">
                <div className="p-3 border-b border-[#1E2025] mb-1 bg-[#0A0B0D] rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-[#3B82F6] block">Zalogowano jako</span>
                  <span className="text-xs font-bold text-white truncate block">{user.email}</span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">Rola: {user.role === "superadmin" ? "Administrator" : "Klient"}</span>
                </div>

                {/* DLA ADMINISTRATORA: PRZEJŚCIE DO PANELU ADMINA */}
                {(user.role === "superadmin" || user.email?.toLowerCase().includes("projekt@")) && (
                  <Link
                    href="/admin"
                    className="w-full text-left px-3 py-2 text-xs font-bold text-[#3B82F6] hover:bg-[#1E2025] rounded-lg flex items-center gap-2 transition-colors mb-1"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Panel Administratora (Admin)</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    setNavMode("main");
                    setMainTab("settings");
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-[#1E2025] rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <SettingsIcon className="w-4 h-4 text-zinc-400" />
                  <span>Ustawienia Konta</span>
                </button>

                <div className="border-t border-[#1E2025] pt-1 mt-1">
                  <button
                    onClick={() => {
                      logout();
                      router.push("/logowanie");
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Wyloguj się</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="flex-1 px-8 pb-12">

          {/* ========================================================================= */}
          {/* 1. STRONA GŁÓWNA */}
          {/* ========================================================================= */}
          {navMode === "main" && mainTab === "home" && (
            <div className="w-full space-y-8">

              {/* STAN 1: BRAK PAKIETU - WYRÓWNANY DO LEWEJ Z PROWOKUJĄCYMI KARTAMI ZAKUPU/TESTU */}
              {!hasPurchasedPackages && displayServices.length === 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  
                  {/* Left Main Card: Nie posiadasz żadnego pakietu */}
                  <div className="lg:col-span-7 bg-[#111215] border border-[#1E2025] rounded-[16px] p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-[#3B82F6] rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Status Konta
                      </span>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Nie posiadasz żadnego aktywnego pakietu
                      </h2>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Wybierz jeden z dedykowanych planów dla marek odzieżowych lub skorzystaj z darmowego 14-dniowego okresu testowego, aby od razu skonfigurować własny sklep.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                        <li className="flex items-center gap-2">✓ Subdomena .iskral.pl</li>
                        <li className="flex items-center gap-2">✓ Dynamiczne odliczanie do Dropu</li>
                        <li className="flex items-center gap-2">✓ Szybkie płatności Stripe & BLIK</li>
                        <li className="flex items-center gap-2">✓ Natychmiastowa aktywacja w 30 sek.</li>
                      </ul>

                      <button
                        onClick={() => setMainTab("shop")}
                        className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer inline-flex items-center gap-2"
                      >
                        <span>Przejdź do sklepu i wybierz pakiet</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Right Card: Sklep na 14 Dni Za Darmo */}
                  <div className="lg:col-span-5 bg-[#111215] border border-[#1E2025] rounded-[16px] p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
                    <div className="space-y-3">
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        14 Dni Gratis
                      </span>
                      <h3 className="text-xl font-bold text-white tracking-tight">
                        Rozpocznij 14-dniowy test bez opłat
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Aktywuj bezpłatny Pakiet Start na 14 dni. Przetestuj konfigurator sklepu, wgraj logo, dodaj produkty i sprawdź jak wygląda Twój sklep.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#1E2025] flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-white font-mono">0 PLN</span>
                        <span className="text-xs text-zinc-500 block">bez podawania karty</span>
                      </div>
                      <button
                        onClick={() => {
                          buyPlan("Start", "miesiac");
                          setMessage({
                            type: "success",
                            text: "🎉 Aktywowano darmowy Pakiet Start na 14 dni! Przejdź do konfiguracji poniżej.",
                          });
                        }}
                        className="px-5 py-2.5 bg-[#1E2025] hover:bg-[#252830] text-white font-bold text-xs rounded-xl border border-[#1E2025] transition-colors cursor-pointer"
                      >
                        Aktywuj 14 Dni Gratis →
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                /* STAN 2: ZAKUPIONE USŁUGI Z LICZNIKIEM LIVE I OPCJAMI PRZEDŁUŻENIA / UPGRADE */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                      TWOJE USŁUGI ({displayServices.length})
                    </span>
                    <button
                      onClick={() => setMainTab("shop")}
                      className="text-xs font-bold text-[#3B82F6] hover:underline"
                    >
                      + Dokup kolejny pakiet
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayServices.map((srv) => (
                      <div
                        key={srv.id}
                        className="bg-[#111215] border border-[#1E2025] rounded-[16px] p-6 flex flex-col justify-between space-y-6"
                      >
                        <div>
                          {/* Top Row: Title & Action Rename */}
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white">{srv.assignedStoreName || srv.title}</h3>
                                <button
                                  onClick={() => {
                                    setRenameTargetService(srv);
                                    setNewServiceName(srv.assignedStoreName || srv.title);
                                    setShowRenameModal(true);
                                  }}
                                  className="text-zinc-500 hover:text-zinc-300"
                                  title="Zmień nazwę usługi"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="text-xs text-zinc-500 font-medium block mt-0.5">
                                {srv.status === "Nieprzypisany" ? "🟡 Nieprzypisany do sklepu" : "🟢 Przypisany"}
                              </span>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#0A0B0D] border border-[#1E2025] flex items-center justify-center text-zinc-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          </div>

                          {/* Info Lines & Live Countdown */}
                          <div className="mt-5 space-y-2 text-xs text-zinc-400 bg-[#0A0B0D] border border-[#1E2025] rounded-xl p-3.5">
                            <div className="flex items-center justify-between">
                              <span>Nazwa pakietu:</span>
                              <strong className="text-white font-bold">Pakiet {srv.planType}</strong>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Ważność pakietu:</span>
                              <strong className="text-zinc-300 font-mono">{srv.expiresAt}</strong>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-[#1E2025]">
                              <span className="flex items-center gap-1.5 text-zinc-400">
                                <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                                <span>Pozostały czas:</span>
                              </span>
                              <strong className="text-emerald-400 font-mono font-bold">
                                {getRemainingTime(srv.expiresAt)}
                              </strong>
                            </div>
                          </div>

                          {/* Action Sub-Buttons */}
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <button
                              onClick={() => {
                                setRenewTargetService(srv);
                                setShowRenewModal(true);
                              }}
                              className="py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-300 font-bold text-xs rounded-xl border border-[#1E2025] transition-colors cursor-pointer text-center"
                            >
                              przedłuż pakiet
                            </button>
                            <button
                              onClick={() => {
                                setUpgradeTargetService(srv);
                                setTargetUpgradePlan(srv.planType === "Start" ? "Creator" : "Brand");
                                setShowUpgradeModal(true);
                              }}
                              className="py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-300 font-bold text-xs rounded-xl border border-[#1E2025] transition-colors cursor-pointer text-center"
                            >
                              upgrade planu
                            </button>
                          </div>
                        </div>

                        {/* Main Action Button */}
                        <div>
                          {srv.status === "Nieprzypisany" ? (
                            <button
                              onClick={() => handleStartConfiguration(srv)}
                              className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                            >
                              Przejdź dalej (Skonfiguruj sklep)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenPackageManagement(srv)}
                              className="w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
          {/* TAB 2: SKLEP */}
          {/* ========================================================================= */}
          {navMode === "main" && mainTab === "shop" && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="text-xl font-bold text-white">Sklep z Pakietami</h2>
                <p className="text-xs text-zinc-400 mt-1">Wybierz pakiet dla swojego sklepu. Pakiety natychmiast pojawiają się w panelu usług.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Pakiet Start */}
                <div className="bg-[#111215] border border-[#1E2025] rounded-[16px] p-6 flex flex-col justify-between space-y-6">
                  <div>
                    <span className="px-2.5 py-0.5 bg-[#0A0B0D] border border-[#1E2025] text-zinc-400 rounded-full text-[10px] font-bold uppercase">14 Dni Gratis</span>
                    <h3 className="text-lg font-bold text-white mt-3">Pakiet Start</h3>
                    <p className="text-xs text-zinc-500 mt-1">Sprawdź swój pomysł bez opłat.</p>
                    <div className="text-2xl font-bold text-white font-mono mt-4">0 PLN <span className="text-xs font-normal text-zinc-500">/ 14 dni</span></div>
                    <ul className="mt-6 space-y-2 text-xs text-zinc-400">
                      <li>✓ Subdomena .iskral.pl</li>
                      <li>✓ Do 5 produktów</li>
                      <li>✓ Płatności testowe Stripe</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      buyPlan("Start", "miesiac");
                      setMainTab("home");
                    }}
                    className="w-full py-2.5 bg-[#1E2025] hover:bg-[#252830] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Wybierz Pakiet Start (0 PLN)
                  </button>
                </div>

                {/* Pakiet Creator */}
                <div className="bg-[#111215] border-2 border-[#3B82F6] rounded-[16px] p-6 flex flex-col justify-between space-y-6 relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3B82F6] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase">
                    Polecany
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-full text-[10px] font-bold uppercase">Popularny</span>
                    <h3 className="text-lg font-bold text-white mt-3">Pakiet Creator</h3>
                    <p className="text-xs text-zinc-500 mt-1">Dla twórców odzieży i dropów.</p>
                    <div className="text-2xl font-bold text-white font-mono mt-4">49.90 PLN <span className="text-xs font-normal text-zinc-500">/ mc</span></div>
                    <ul className="mt-6 space-y-2 text-xs text-zinc-300">
                      <li>✓ Nielimitowane produkty</li>
                      <li>✓ Dynamiczny licznik dropu</li>
                      <li className="text-emerald-400 font-bold">✓ Prowizja tylko 1.0%</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      buyPlan("Creator", "miesiac");
                      setMainTab("home");
                    }}
                    className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Kup Pakiet Creator
                  </button>
                </div>

                {/* Pakiet Brand */}
                <div className="bg-[#111215] border border-[#1E2025] rounded-[16px] p-6 flex flex-col justify-between space-y-6">
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase">0% Prowizji</span>
                    <h3 className="text-lg font-bold text-white mt-3">Pakiet Brand</h3>
                    <p className="text-xs text-zinc-500 mt-1">Dla rosnących marek streetwear.</p>
                    <div className="text-2xl font-bold text-white font-mono mt-4">99.90 PLN <span className="text-xs font-normal text-zinc-500">/ mc</span></div>
                    <ul className="mt-6 space-y-2 text-xs text-zinc-400">
                      <li className="font-bold text-emerald-400">✓ 0% prowizji platformy</li>
                      <li>✓ Własna domena .pl / .com</li>
                      <li>✓ Priorytetowy support 24/7</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => {
                      buyPlan("Brand", "miesiac");
                      setMainTab("home");
                    }}
                    className="w-full py-2.5 bg-[#1E2025] hover:bg-[#252830] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
          {navMode === "main" && mainTab === "templates" && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-bold text-white">Dostępne Szablony</h2>
                <p className="text-xs text-zinc-400 mt-1">Zoptymalizowany szablon e-commerce dla Twojej marki.</p>
              </div>

              <div className="p-6 bg-[#111215] border border-[#1E2025] rounded-[16px] flex flex-col md:flex-row items-center gap-6">
                <div className="w-full md:w-60 h-36 bg-[#0A0B0D] border border-[#1E2025] rounded-xl flex items-center justify-center text-white font-bold shrink-0 text-sm">
                  🔥 Dark Vibe / Streetwear
                </div>
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] rounded-full uppercase">
                    Domyślny Szablon
                  </span>
                  <h3 className="text-base font-bold text-white">Dark Vibe (Hype & Streetwear)</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Ciemna estetyka z wyrazistym akcentem kolorystycznym, dynamicznym licznikiem odliczania dropów oraz zoptymalizowanym koszykiem mobilnym.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: USTAWIENIA */}
          {/* ========================================================================= */}
          {navMode === "main" && mainTab === "settings" && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Ustawienia Konta</h2>
                <p className="text-xs text-zinc-400 mt-1">Uzupełnij swoje dane osobowe, adres oraz konfigurację 2FA.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 bg-[#111215] border border-[#1E2025] rounded-[16px] space-y-6">
                
                {/* Avatar */}
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">Zdjęcie Profilowe</label>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#0A0B0D] border border-[#1E2025] flex items-center justify-center overflow-hidden shrink-0">
                      {profAvatar ? (
                        <img src={profAvatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <label className="px-4 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] border border-[#1E2025] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Wgraj zdjęcie z komputera</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleAvatarFileUpload(e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-zinc-500 mt-1">Formaty: PNG, JPG, WEBP.</p>
                    </div>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Imię i Nazwisko</label>
                    <input
                      type="text"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Adres E-mail</label>
                    <input
                      type="email"
                      value={profEmail}
                      disabled
                      className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-zinc-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">Numer Telefonu</label>
                    <input
                      type="text"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      placeholder="+48 500 000 000"
                      className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="pt-4 border-t border-[#1E2025] space-y-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Adres Zamieszkania / Siedziba Firmy</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-zinc-300 mb-1">Ulica i numer lokalu</label>
                      <input
                        type="text"
                        value={profStreet}
                        onChange={(e) => setProfStreet(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">Kod Pocztowy</label>
                      <input
                        type="text"
                        value={profZip}
                        onChange={(e) => setProfZip(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">Miejscowość</label>
                      <input
                        type="text"
                        value={profCity}
                        onChange={(e) => setProfCity(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Zapisz Dane Profilowe
                </button>
              </form>

              {/* 2FA Card */}
              <div className="p-6 bg-[#111215] border border-[#1E2025] rounded-[16px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#3B82F6]" />
                    <h3 className="text-sm font-bold text-white">Dwuskładnikowa Autoryzacja 2FA (Google Authenticator)</h3>
                    {user.is2FAEnabled && (
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                        Aktywne ✓
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">Zabezpiecz konto kodami z aplikacji na telefonie.</p>
                </div>

                {user.is2FAEnabled ? (
                  <button
                    onClick={toggle2FA}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl border border-red-500/20 cursor-pointer"
                  >
                    Wyłącz 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => setShow2FAModal(true)}
                    className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Skonfiguruj 2FA</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PAKIET / ZARZĄDZANIE SKLEPEM */}
          {/* ========================================================================= */}
          {navMode === "package" && (
            <div className="space-y-6">
              
              {/* 4 STATS CARDS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat 1 */}
                <div className="bg-[#111215] border border-[#1E2025] rounded-[16px] p-5 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300">Przychód całkowity</h4>
                      <span className="text-[11px] text-zinc-500">Tygodniowo</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#0A0B0D] border border-[#1E2025] text-[#3B82F6] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white font-mono">{totalRevenuePLN || "102"}</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">+29%</span>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="bg-[#111215] border border-[#1E2025] rounded-[16px] p-5 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300">Liczba zamówień</h4>
                      <span className="text-[11px] text-zinc-500">Tygodniowo</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#0A0B0D] border border-[#1E2025] text-[#3B82F6] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white font-mono">{totalOrdersCount || "102"}</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">+29%</span>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="bg-[#111215] border border-[#1E2025] rounded-[16px] p-5 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300">Panel Sklepu</h4>
                      <span className="text-[11px] text-zinc-500">Tygodniowo</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#0A0B0D] border border-[#1E2025] text-[#3B82F6] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white font-mono">{visitsCount || "102"}</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">+29%</span>
                  </div>
                </div>

                {/* Stat 4 */}
                <div className="bg-[#111215] border border-[#1E2025] rounded-[16px] p-5 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-300">Panel Sklepu</h4>
                      <span className="text-[11px] text-zinc-500">Tygodniowo</span>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[#0A0B0D] border border-[#1E2025] text-[#3B82F6] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white font-mono">{aovPLN || "102"}</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">+29%</span>
                  </div>
                </div>

              </div>

              {/* Subdomain Live Quick Bar */}
              <div className="p-5 bg-[#111215] border border-[#1E2025] rounded-[16px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#3B82F6] block">Adres Twojego Sklepu</span>
                  <a
                    href={liveStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-base font-bold text-white hover:text-[#3B82F6] flex items-center gap-1.5 mt-0.5 transition-colors"
                  >
                    <span>https://{currentStore.subdomain}.iskral.pl</span>
                    <ExternalLink className="w-4 h-4 text-zinc-500" />
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-200 font-bold text-xs rounded-xl border border-[#1E2025] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{linkCopied ? "Skopiowano!" : "Kopiuj Link"}</span>
                  </button>

                  <a
                    href={liveStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Odwiedź Sklep ↗</span>
                  </a>
                </div>
              </div>

              {/* Sub-tabs inside Package view */}
              {packageTab === "editor" && (
                <div className="space-y-6 max-w-4xl p-6 bg-[#111215] border border-[#1E2025] rounded-[16px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-[#1E2025]">
                    <div>
                      <h2 className="text-lg font-bold text-white">Edytor i Konfiguracja Sklepu</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">Dostosuj nazwę, subdomenę, logo, kolory i odnośniki społecznościowe.</p>
                    </div>
                    <a
                      href={liveStoreUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] border border-[#1E2025] text-zinc-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#3B82F6]" />
                      <span>Podgląd na żywo ↗</span>
                    </a>
                  </div>

                  <form onSubmit={handleSaveStoreEditor} className="space-y-5">
                    {/* Nazwa i Subdomena */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1">Nazwa Sklepu</label>
                        <input
                          type="text"
                          value={storeEditName}
                          onChange={(e) => setStoreEditName(e.target.value)}
                          placeholder="Wpisz nazwę sklepu..."
                          className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-bold text-white outline-none focus:border-[#3B82F6]"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1">Subdomena Sklepu</label>
                        <div className="flex items-center">
                          <input
                            type="text"
                            value={storeEditSubdomain}
                            onChange={(e) => setStoreEditSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                            placeholder="twoja-subdomena"
                            className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-l-xl text-xs font-mono font-bold text-zinc-200 outline-none focus:border-[#3B82F6]"
                            required
                          />
                          <span className="px-3.5 py-2 bg-[#16171C] border border-l-0 border-[#1E2025] rounded-r-xl text-xs font-mono text-zinc-400">
                            .iskral.pl
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pasek ogłoszeń */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">Pasek Ogłoszeń (Announcement Bar)</label>
                      <input
                        type="text"
                        value={storeEditAnnouncement}
                        onChange={(e) => setStoreEditAnnouncement(e.target.value)}
                        placeholder="np. 🎉 Darmowa dostawa od 200 PLN!"
                        className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none focus:border-[#3B82F6]"
                      />
                    </div>

                    {/* Logo Sklepu */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">Logo Sklepu (Wgraj z Komputera)</label>
                      <div className="border border-dashed border-[#1E2025] hover:border-[#3B82F6] rounded-xl p-4 flex items-center justify-between gap-4 bg-[#0A0B0D] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#111215] border border-[#1E2025] flex items-center justify-center overflow-hidden shrink-0">
                            {storeEditLogo ? (
                              <img src={storeEditLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                            ) : (
                              <Camera className="w-5 h-5 text-zinc-500" />
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {storeEditLogo ? "Logo załadowane ✓" : "Brak logo (wybierz plik)"}
                            </span>
                            <span className="text-[10px] text-zinc-500">Formaty: PNG, JPG, SVG, WEBP</span>
                          </div>
                        </div>

                        <label className="px-4 py-2 bg-[#111215] hover:bg-[#1E2025] border border-[#1E2025] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0">
                          <span>{storeEditLogo ? "Zmień logo" : "Wgraj logo"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleStoreLogoUpload(e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Kolorystyka */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5">Kolor Akcentu Sklepu</label>
                      <div className="flex items-center gap-3 pt-1">
                        {[
                          { name: "Blue", hex: "#3B82F6" },
                          { name: "Orange", hex: "#FF5B28" },
                          { name: "Green", hex: "#10B981" },
                          { name: "Purple", hex: "#8B5CF6" },
                          { name: "Pink", hex: "#EC4899" },
                        ].map((col) => (
                          <button
                            key={col.hex}
                            type="button"
                            onClick={() => setStoreEditColor(col.hex)}
                            style={{ backgroundColor: col.hex }}
                            className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                              storeEditColor === col.hex ? "ring-2 ring-offset-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="pt-3 border-t border-[#1E2025] space-y-3">
                      <h4 className="text-xs font-bold text-white">Social Media Sklepu</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Instagram (np. @twojmarka)..."
                          value={storeEditInstagram}
                          onChange={(e) => setStoreEditInstagram(e.target.value)}
                          className="px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none"
                        />
                        <input
                          type="text"
                          placeholder="TikTok (np. @twojmarka)..."
                          value={storeEditTiktok}
                          onChange={(e) => setStoreEditTiktok(e.target.value)}
                          className="px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none"
                        />
                        <input
                          type="text"
                          placeholder="YouTube..."
                          value={storeEditYoutube}
                          onChange={(e) => setStoreEditYoutube(e.target.value)}
                          className="px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Discord..."
                          value={storeEditDiscord}
                          onChange={(e) => setStoreEditDiscord(e.target.value)}
                          className="px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1E2025] flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-none"
                      >
                        Zapisz Zmiany w Sklepie ✓
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sub-tabs inside Package view */}
              {packageTab === "products" && (
                <div className="space-y-6 p-6 bg-[#111215] border border-[#1E2025] rounded-[16px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">Katalog Produktów ({storeProducts.length})</h2>
                      <p className="text-xs text-zinc-400 mt-0.5">Zarządzaj produktami i stanem magazynowym.</p>
                    </div>

                    <button
                      onClick={handleOpenAddProduct}
                      className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Dodaj Produkt</span>
                    </button>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="p-10 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-center space-y-2">
                      <p className="text-sm font-bold text-zinc-300">Brak produktów</p>
                      <p className="text-xs text-zinc-500">Dodaj pierwszy produkt klikając przycisk powyżej.</p>
                    </div>
                  ) : (
                    <div className="bg-[#0A0B0D] border border-[#1E2025] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#16171C] text-zinc-400 uppercase font-bold text-[10px] border-b border-[#1E2025]">
                          <tr>
                            <th className="p-3.5">PRODUKT</th>
                            <th className="p-3.5">TYP</th>
                            <th className="p-3.5">CENA</th>
                            <th className="p-3.5">MAGAZYN</th>
                            <th className="p-3.5">ROZMIARY</th>
                            <th className="p-3.5">STATUS</th>
                            <th className="p-3.5 text-right">AKCJE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2025] text-white">
                          {filteredProducts.map((p) => (
                            <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3.5">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                                    alt={p.name}
                                    className="w-9 h-9 rounded-lg object-cover border border-[#1E2025] shrink-0"
                                  />
                                  <div>
                                    <span className="font-bold text-white block">{p.name}</span>
                                    <span className="text-[10px] text-zinc-500 line-clamp-1">{p.description}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 bg-[#111215] border border-[#1E2025] text-zinc-300 rounded text-[10px] font-medium">
                                  {p.type}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono font-bold text-[#3B82F6]">
                                {p.price}
                              </td>
                              <td className="p-3.5 font-mono text-zinc-400">
                                {p.stock} szt.
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {(p.variants || ["S", "M", "L"]).map((v) => (
                                    <span key={v} className="px-1.5 py-0.5 bg-[#111215] border border-[#1E2025] text-zinc-300 rounded text-[10px] font-mono">
                                      {v}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3.5">
                                <button
                                  onClick={() => toggleProductStatus(p.id)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                                    p.status === "Zawieszony" ? "bg-zinc-800 text-zinc-400" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  }`}
                                >
                                  {p.status === "Zawieszony" ? "Szkic" : "Aktywny"}
                                </button>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleEditProduct(p)} className="p-1 hover:bg-[#1E2025] rounded text-blue-400">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => deleteProduct(p.id)} className="p-1 hover:bg-red-500/10 rounded text-red-400">
                                    <Trash2 className="w-3.5 h-3.5" />
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

              {packageTab === "orders" && (
                <div className="space-y-6 p-6 bg-[#111215] border border-[#1E2025] rounded-[16px]">
                  <h2 className="text-lg font-bold text-white">Historia Zamówień ({paidOrders.length})</h2>
                  {paidOrders.length === 0 ? (
                    <p className="text-xs text-zinc-500">Brak opłaconych zamówień.</p>
                  ) : (
                    <div className="bg-[#0A0B0D] border border-[#1E2025] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs text-white">
                        <thead className="bg-[#16171C] text-zinc-400 uppercase text-[10px] border-b border-[#1E2025]">
                          <tr>
                            <th className="p-3.5">ID</th>
                            <th className="p-3.5">KLIENT</th>
                            <th className="p-3.5">KWOTA</th>
                            <th className="p-3.5">STATUS</th>
                            <th className="p-3.5 text-right">DATA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2025]">
                          {paidOrders.map((o) => (
                            <tr key={o.id}>
                              <td className="p-3.5 font-mono font-bold text-white">#{o.id.slice(-6).toUpperCase()}</td>
                              <td className="p-3.5 text-zinc-300">{o.customerEmail}</td>
                              <td className="p-3.5 font-bold text-emerald-400">{(o.amountTotalCents / 100).toFixed(2)} PLN</td>
                              <td className="p-3.5"><span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold">Opłacone</span></td>
                              <td className="p-3.5 text-right font-mono text-zinc-500">{new Date(o.createdAt || Date.now()).toLocaleDateString("pl-PL")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {packageTab === "drop" && (
                <div className="max-w-2xl space-y-4 p-6 bg-[#111215] border border-[#1E2025] rounded-[16px]">
                  <h2 className="text-lg font-bold text-white">Konfiguracja Dropu</h2>
                  <form onSubmit={handleSaveDropSettings} className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#0A0B0D] border border-[#1E2025] rounded-xl">
                      <div>
                        <h4 className="text-sm font-bold text-white">Włącz Odliczanie do Dropu</h4>
                        <p className="text-xs text-zinc-400">Blokuje stronę sklepu zegarem przed premierą.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={dropEnabled}
                        onChange={(e) => setDropEnabled(e.target.checked)}
                        className="w-4 h-4 accent-[#3B82F6]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">Data i Godzina Dropu</label>
                      <input
                        type="datetime-local"
                        value={dropDate}
                        onChange={(e) => setDropDate(e.target.value)}
                        className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-bold font-mono text-white"
                      />
                    </div>
                    <button type="submit" className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl">
                      Zapisz Ustawienia Dropu
                    </button>
                  </form>
                </div>
              )}

              {packageTab === "domain" && (
                <div className="max-w-2xl space-y-4 p-6 bg-[#111215] border border-[#1E2025] rounded-[16px]">
                  <h2 className="text-lg font-bold text-white">Ustawienia Domeny</h2>
                  <div className="flex items-center">
                    <input type="text" value={currentStore.subdomain} disabled className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-l-xl text-xs font-bold font-mono text-zinc-300" />
                    <span className="px-3.5 py-2 bg-[#16171C] border border-l-0 border-[#1E2025] rounded-r-xl text-xs font-mono text-zinc-400">.iskral.pl</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-medium">🟢 Subdomena aktywna z certyfikatem SSL.</p>
                </div>
              )}

              {packageTab === "balance" && (
                <div className="max-w-2xl space-y-4 p-6 bg-[#111215] border border-[#1E2025] rounded-[16px]">
                  <h2 className="text-lg font-bold text-white">Saldo i Wypłaty</h2>
                  <div className="text-3xl font-bold text-emerald-400 font-mono">{totalRevenuePLN} PLN</div>
                  <input type="text" value={payoutIban} onChange={(e) => setPayoutIban(e.target.value)} className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-mono text-white" />
                  <button
                    onClick={() => {
                      if (parseFloat(totalRevenuePLN) <= 0) return alert("Brak środków do wypłaty.");
                      requestPayoutWithIBAN(parseFloat(totalRevenuePLN), payoutIban);
                    }}
                    className="px-5 py-2.5 bg-[#1E2025] hover:bg-[#252830] text-white font-bold text-xs rounded-xl"
                  >
                    Zleć Wypłatę na Rachunek
                  </button>
                </div>
              )}

              {packageTab === "newsletter" && (
                <div className="max-w-2xl space-y-4 p-6 bg-[#111215] border border-[#1E2025] rounded-[16px]">
                  <h2 className="text-lg font-bold text-white">Newsletter</h2>
                  <input type="text" placeholder="Tytuł Kampanii..." value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white" />
                  <button onClick={() => { alert("Kampania wysłana!"); setCampaignTitle(""); }} className="px-5 py-2.5 bg-[#3B82F6] text-white font-bold text-xs rounded-xl">Wyślij Kampanię</button>
                </div>
              )}

              {packageTab === "team" && (
                <div className="max-w-2xl space-y-4 p-6 bg-[#111215] border border-[#1E2025] rounded-[16px]">
                  <h2 className="text-lg font-bold text-white">Team Collaboration</h2>
                  <input type="email" placeholder="E-mail członka zespołu..." value={teamEmail} onChange={(e) => setTeamEmail(e.target.value)} className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white" />
                  <button onClick={() => { alert("Zaproszenie wysłane!"); setTeamEmail(""); }} className="px-5 py-2.5 bg-[#3B82F6] text-white font-bold text-xs rounded-xl">Zaproś do sklepu</button>
                </div>
              )}

              {packageTab === "seo" && (
                <div className="max-w-2xl space-y-4 p-6 bg-[#111215] border border-[#1E2025] rounded-[16px]">
                  <h2 className="text-lg font-bold text-white">SEO & Pozycjonowanie</h2>
                  <input type="text" defaultValue={`${currentStore.name} | Oficjalny Sklep`} className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white" />
                  <button onClick={() => setMessage({ type: "success", text: "Zapisano SEO!" })} className="px-5 py-2.5 bg-[#3B82F6] text-white font-bold text-xs rounded-xl">Zapisz SEO</button>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: KREATOR KONFIGURACJI SKLEPU */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#111215] border border-[#1E2025] rounded-[16px] p-6 sm:p-8 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2025]">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#3B82F6] tracking-wider">Krok 2: Konfiguracja Sklepu</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Konfigurator Nowego Sklepu</h3>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="p-1 hover:bg-[#1E2025] rounded-lg text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinishStoreConfiguration} className="mt-6 space-y-5">
              
              {/* Nazwa i Subdomena */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Nazwa Sklepu</label>
                  <input
                    type="text"
                    value={cfgName}
                    onChange={(e) => setCfgName(e.target.value)}
                    placeholder="np. Dropwear Club"
                    className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-bold text-white outline-none focus:border-[#3B82F6]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Subdomena Sklepu</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={cfgSubdomain}
                      onChange={(e) => setCfgSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      placeholder="twojanazwa"
                      className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-l-xl text-xs font-mono font-bold text-zinc-200 outline-none focus:border-[#3B82F6]"
                      required
                    />
                    <span className="px-3 py-2 bg-[#16171C] border border-l-0 border-[#1E2025] rounded-r-xl text-xs font-mono text-zinc-400">
                      .iskral.pl
                    </span>
                  </div>
                  {cfgSubdomain && (
                    <span className={`text-[10px] font-bold mt-1 block ${cfgSubdomainAvailable ? "text-emerald-400" : "text-red-400"}`}>
                      {cfgCheckingSubdomain ? "Sprawdzanie..." : cfgSubdomainAvailable ? "🟢 Subdomena jest wolna!" : "🔴 Zajęta lub niedostępna"}
                    </span>
                  )}
                </div>
              </div>

              {/* Opis */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Krótki Opis Sklepu / Bio</label>
                <textarea
                  rows={2}
                  value={cfgDescription}
                  onChange={(e) => setCfgDescription(e.target.value)}
                  placeholder="Oficjalny sklep streetwear..."
                  className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Logo Sklepu (Wgraj z Komputera lub Przeciągnij)</label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleLogoFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border border-dashed border-[#1E2025] hover:border-[#3B82F6] rounded-xl p-4 flex items-center justify-between gap-4 bg-[#0A0B0D] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#111215] border border-[#1E2025] flex items-center justify-center overflow-hidden shrink-0">
                      {cfgLogo ? (
                        <img src={cfgLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <Camera className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {cfgLogo ? "Logo załadowane ✓" : "Kliknij lub przeciągnij plik logo"}
                      </span>
                      <span className="text-[10px] text-zinc-500">Formaty: PNG, JPG, SVG, WEBP</span>
                    </div>
                  </div>

                  <label className="px-4 py-2 bg-[#111215] hover:bg-[#1E2025] border border-[#1E2025] text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0">
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
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Szablon Sklepu</label>
                  <select
                    value={cfgTemplate}
                    onChange={(e) => setCfgTemplate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-bold text-white outline-none cursor-pointer"
                  >
                    <option value="Dark Vibe">🔥 Dark Vibe (Streetwear)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Kolorystyka Akcentu</label>
                  <div className="flex items-center gap-2 pt-1">
                    {[
                      { name: "Blue", hex: "#3B82F6" },
                      { name: "Orange", hex: "#FF5B28" },
                      { name: "Green", hex: "#10B981" },
                      { name: "Purple", hex: "#8B5CF6" },
                      { name: "Pink", hex: "#EC4899" },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setCfgColor(col.hex)}
                        style={{ backgroundColor: col.hex }}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          cfgColor === col.hex ? "ring-2 ring-offset-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="pt-3 border-t border-[#1E2025] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Social Media Sklepu</h4>
                    <p className="text-[10px] text-zinc-500">Podaj linki do profili społecznościowych.</p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-300">
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
                      placeholder="Instagram..."
                      value={cfgInstagram}
                      onChange={(e) => setCfgInstagram(e.target.value)}
                      className="px-3 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="TikTok..."
                      value={cfgTiktok}
                      onChange={(e) => setCfgTiktok(e.target.value)}
                      className="px-3 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="YouTube..."
                      value={cfgYoutube}
                      onChange={(e) => setCfgYoutube(e.target.value)}
                      className="px-3 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Discord / Telegram..."
                      value={cfgDiscord}
                      onChange={(e) => setCfgDiscord(e.target.value)}
                      className="px-3 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#1E2025] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-5 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-300 font-bold text-xs rounded-xl border border-[#1E2025] cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Uruchom Sklep i Przypisz Pakiet →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: PRZEDŁUŻENIE PAKIETU */}
      {/* ========================================================================= */}
      {showRenewModal && renewTargetService && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111215] border border-[#1E2025] rounded-[16px] p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2025]">
              <h3 className="text-base font-bold text-white">Przedłuż Ważność Pakietu</h3>
              <button onClick={() => setShowRenewModal(false)} className="p-1 hover:bg-[#1E2025] rounded-lg text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {renewTargetService.planType === "Start" ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs leading-relaxed">
                  ⚠️ <strong>Pakiet Start (Trial 14 dni)</strong> jest jednorazowym bezpłatnym okresem próbnym i nie można go przedłużyć. Aby kontynuować działanie sklepu bez limitu czasu, przejdź na pełny pakiet <strong>Creator</strong> lub <strong>Brand</strong>.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRenewModal(false);
                      setUpgradeTargetService(renewTargetService);
                      setTargetUpgradePlan("Creator");
                      setShowUpgradeModal(true);
                    }}
                    className="p-4 rounded-xl border border-[#1E2025] hover:border-[#3B82F6] bg-[#0A0B0D] text-left cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-bold text-white block">Pakiet Creator</span>
                    <span className="text-sm font-bold text-[#3B82F6] font-mono mt-1 block">49.90 PLN / mc</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRenewModal(false);
                      setUpgradeTargetService(renewTargetService);
                      setTargetUpgradePlan("Brand");
                      setShowUpgradeModal(true);
                    }}
                    className="p-4 rounded-xl border border-[#1E2025] hover:border-emerald-500 bg-[#0A0B0D] text-left cursor-pointer transition-colors"
                  >
                    <span className="text-xs font-bold text-white block">Pakiet Brand (0% Prowizji)</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-1 block">99.90 PLN / mc</span>
                  </button>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRenewModal(false)}
                    className="px-4 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-300 text-xs font-bold rounded-xl border border-[#1E2025]"
                  >
                    Zamknij
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Wybierz na jaki okres chcesz przedłużyć pakiet <strong className="text-white">{renewTargetService.title}</strong>:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRenewCycle("miesiac")}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-colors ${
                      renewCycle === "miesiac"
                        ? "bg-[#0A0B0D] border-[#3B82F6] text-white"
                        : "bg-[#0A0B0D] border-[#1E2025] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold block">1 Miesiąc</span>
                    <span className="text-base font-bold text-[#3B82F6] font-mono mt-1 block">
                      {renewTargetService.planType === "Brand" ? "99.90 PLN" : "49.90 PLN"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRenewCycle("rok")}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-colors ${
                      renewCycle === "rok"
                        ? "bg-[#0A0B0D] border-[#3B82F6] text-white"
                        : "bg-[#0A0B0D] border-[#1E2025] text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs font-bold block">1 Rok (-17%)</span>
                    <span className="text-base font-bold text-[#3B82F6] font-mono mt-1 block">
                      {renewTargetService.planType === "Brand" ? "599 PLN" : "299 PLN"}
                    </span>
                  </button>
                </div>

                <div className="pt-3 border-t border-[#1E2025] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRenewModal(false)}
                    className="px-4 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-300 text-xs font-bold rounded-xl border border-[#1E2025]"
                  >
                    Anuluj
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRenewal}
                    className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl"
                  >
                    Opłać i Przedłuż Ważność
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: UPGRADE PLANU */}
      {/* ========================================================================= */}
      {showUpgradeModal && upgradeTargetService && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111215] border border-[#1E2025] rounded-[16px] p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2025]">
              <h3 className="text-base font-bold text-white">Uaktualnij Plan (Upgrade)</h3>
              <button onClick={() => setShowUpgradeModal(false)} className="p-1 hover:bg-[#1E2025] rounded-lg text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                Aktualny plan: <strong className="text-white">{upgradeTargetService.planType}</strong>. Dopłacasz jedynie różnicę w cenie za pozostały okres:
              </p>

              <div className="space-y-2">
                {upgradeTargetService.planType !== "Creator" && (
                  <button
                    type="button"
                    onClick={() => setTargetUpgradePlan("Creator")}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                      targetUpgradePlan === "Creator" ? "bg-[#0A0B0D] border-[#3B82F6] text-white" : "bg-[#0A0B0D] border-[#1E2025] text-zinc-400"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Pakiet Creator</span>
                      <span className="text-[11px] text-zinc-500">Dla twórców z nielimitowanymi produktami</span>
                    </div>
                    <span className="text-xs font-bold text-[#3B82F6] font-mono">+49.90 PLN</span>
                  </button>
                )}

                {upgradeTargetService.planType !== "Brand" && (
                  <button
                    type="button"
                    onClick={() => setTargetUpgradePlan("Brand")}
                    className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                      targetUpgradePlan === "Brand" ? "bg-[#0A0B0D] border-[#3B82F6] text-white" : "bg-[#0A0B0D] border-[#1E2025] text-zinc-400"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Pakiet Brand (0% Prowizji)</span>
                      <span className="text-[11px] text-zinc-500">Własna domena .pl i 0% prowizji platformy</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      +{upgradeTargetService.planType === "Creator" ? "50.00 PLN" : "99.90 PLN"}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#1E2025] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="px-4 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-300 text-xs font-bold rounded-xl border border-[#1E2025]"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={handleExecuteUpgrade}
                className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl"
              >
                Potwierdź Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: ZMIANA NAZWY USŁUGI */}
      {/* ========================================================================= */}
      {showRenameModal && renameTargetService && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111215] border border-[#1E2025] rounded-[16px] p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Zmień Nazwę Usługi / Sklepu</h3>
            <input
              type="text"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="Wpisz nową nazwę..."
              className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none focus:border-[#3B82F6]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-300 text-xs font-bold rounded-xl border border-[#1E2025]"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => {
                  const updatedServices = (user.services || []).map((s) => {
                    if (s.id === renameTargetService.id) {
                      return { ...s, assignedStoreName: newServiceName, title: newServiceName };
                    }
                    return s;
                  });
                  updateUserProfile({ services: updatedServices });
                  setShowRenameModal(false);
                  setMessage({ type: "success", text: "Zaktualizowano nazwę usługi!" });
                }}
                className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl"
              >
                Zapisz Nazwę
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: DODAWANIE PRODUKTU */}
      {/* ========================================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#111215] border border-[#1E2025] rounded-[16px] p-6 sm:p-8 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2025]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-[#3B82F6]" />
                <span>{editingProductId ? "Edycja Produktu" : "Dodaj Nowy Produkt"}</span>
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1 hover:bg-[#1E2025] rounded-lg text-zinc-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Nazwa Produktu</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="np. Bluza Heavyweight 'Noir'"
                  className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-bold text-white outline-none focus:border-[#3B82F6]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Cena (PLN)</label>
                  <input
                    type="text"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="149.00"
                    className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-bold font-mono text-white outline-none focus:border-[#3B82F6]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Cena Porównawcza (PLN)</label>
                  <input
                    type="text"
                    value={prodComparePrice}
                    onChange={(e) => setProdComparePrice(e.target.value)}
                    placeholder="199.00"
                    className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-mono text-zinc-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Stan Magazynowy (Szt.)</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-mono text-white outline-none"
                    min={0}
                  />
                </div>
              </div>

              {/* Rozmiary */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Warianty / Rozmiary</label>
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {prodVariants.map((v) => (
                    <span key={v} className="px-2.5 py-1 bg-[#0A0B0D] border border-[#1E2025] rounded-lg text-xs font-mono font-bold text-white flex items-center gap-1">
                      <span>{v}</span>
                      <button type="button" onClick={() => handleRemoveVariant(v)} className="text-zinc-500 hover:text-red-400 font-bold ml-1">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Dodaj rozmiar (np. XXL)..."
                    value={prodVariantInput}
                    onChange={(e) => setProdVariantInput(e.target.value)}
                    className="px-3 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs font-mono text-white flex-1 outline-none"
                  />
                  <button type="button" onClick={handleAddVariant} className="px-4 py-2 bg-[#1E2025] hover:bg-[#252830] text-white text-xs font-bold rounded-xl cursor-pointer">
                    + Dodaj
                  </button>
                </div>
              </div>

              {/* Zdjęcie Produktu */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Zdjęcie Produktu (Wgraj z Komputera)</label>
                <div className="border border-dashed border-[#1E2025] rounded-xl p-4 flex items-center justify-between gap-4 bg-[#0A0B0D]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#111215] border border-[#1E2025] flex items-center justify-center overflow-hidden shrink-0">
                      {prodImage ? (
                        <img src={prodImage} alt="Produkt" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                    <span className="text-xs text-zinc-400 font-medium">
                      {prodImage ? "Zdjęcie załadowane ✓" : "Wybierz zdjęcie produktu"}
                    </span>
                  </div>
                  <label className="px-4 py-2 bg-[#111215] hover:bg-[#1E2025] border border-[#1E2025] text-white font-bold text-xs rounded-xl cursor-pointer shrink-0">
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
                <label className="block text-xs font-bold text-zinc-300 mb-1">Opis Produktu</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Krótki opis materiałów, kroju..."
                  className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-xs text-white outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="pt-4 border-t border-[#1E2025] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-300 rounded-xl text-xs font-bold border border-[#1E2025] cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {editingProductId ? "Zapisz Zmiany" : "Utwórz Produkt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: 2FA AUTHENTICATOR */}
      {/* ========================================================================= */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111215] border border-[#1E2025] rounded-[16px] p-6 sm:p-8 text-center space-y-4">
            <h3 className="text-base font-bold text-white">Google Authenticator</h3>
            <p className="text-xs text-zinc-400">Zeskanuj poniższy kod QR w aplikacji Authenticator lub Authy:</p>

            <div className="p-3 bg-white rounded-xl inline-block mx-auto">
              <img src={totpQrUrl} alt="2FA QR Code" className="w-40 h-40 mx-auto" />
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
                className="w-full px-3.5 py-2 bg-[#0A0B0D] border border-[#1E2025] rounded-xl text-center text-sm font-mono font-bold tracking-widest text-white outline-none focus:border-[#3B82F6]"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="w-1/2 py-2 bg-[#0A0B0D] hover:bg-[#1E2025] text-zinc-300 text-xs font-bold rounded-xl border border-[#1E2025] cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Aktywuj 2FA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. SLEEK SLIDE-IN TOAST NOTIFICATION (BOTTOM-RIGHT ANIMATED) */}
      {/* ========================================================================= */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right-8 fade-in duration-200">
          <div
            className={`p-4 pr-5 rounded-2xl text-xs font-bold flex items-center gap-3 border ${
              message.type === "success"
                ? "bg-[#111215] text-emerald-300 border-emerald-500/40"
                : "bg-[#111215] text-red-300 border-red-500/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                message.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              {message.type === "success" ? "✓" : "!"}
            </div>
            <span className="max-w-xs">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="p-1 text-zinc-500 hover:text-white rounded-lg cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
