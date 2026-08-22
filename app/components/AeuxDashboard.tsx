"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  LayoutGrid,
  ShoppingBag,
  ShoppingBasket,
  BookOpen,
  Package,
  Layers,
  Sparkles,
  Flame,
  Globe,
  Wallet,
  Settings,
  Bell,
  Plus,
  Search,
  ChevronDown,
  Check,
  MoreVertical,
  X,
  Menu,
  ExternalLink,
  Shield,
  Clock,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  Copy,
  CheckCircle2,
  Lock,
  CreditCard,
  LogOut,
  Mail,
  Users,
  User as UserIcon,
  Eye,
  RefreshCw,
  HelpCircle,
  Smartphone,
  Zap,
} from "lucide-react";
import {
  User,
  StoreConfig,
  Product,
  ServicePackage,
  PlanType,
  OrderRecord,
} from "../context/AuthContext";

export interface UserPackage {
  id: string;
  number: number;
  name: string;
  planType: "Start" | "Creator" | "Brand";
  price: string;
  expiresAt: string;
  storeName?: string;
  subdomain?: string;
  logoUrl?: string;
  isConfigured: boolean;
}

type TabType = "pulpit" | "produkty" | "zamowienia" | "pakiety" | "kreator" | "drop" | "ustawienia" | "profil";

interface AeuxDashboardProps {
  user: User | null;
  allUsers?: User[];
  activeStore?: StoreConfig;
  userStores?: StoreConfig[];
  setActiveStoreId?: (id: string) => void;
  logout?: () => void;
  buyPlan?: (plan: PlanType, billingCycle: "miesiac" | "rok") => Promise<void>;
  updateUserProfile?: (data: Partial<User>) => void;
  toggle2FA?: () => void;
  updateStoreConfig?: (config: Partial<StoreConfig>) => void;
  addProduct?: (product: any) => void;
  updateProduct?: (id: string, product: any) => void;
  deleteProduct?: (id: string) => void;
  toggleProductStatus?: (id: string) => void;
  requestPayoutWithIBAN?: (amountPLN: number, iban: string) => boolean;
  createOrUpdateStoreFull?: (params: any) => any;
  message?: { type: "success" | "error" | "warning"; text: string } | null;
  setMessage?: (msg: any) => void;
}

export default function AeuxDashboard({
  user,
  allUsers = [],
  activeStore,
  userStores = [],
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
  requestPayoutWithIBAN,
  createOrUpdateStoreFull,
  message,
  setMessage,
}: AeuxDashboardProps) {
  // Navigation tabs with URL hash and localStorage memory on F5 refresh:
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as TabType;
      const validTabs: TabType[] = ["pulpit", "produkty", "zamowienia", "pakiety", "kreator", "drop", "ustawienia", "profil"];
      if (validTabs.includes(hash)) return hash;
      const saved = localStorage.getItem("iskra_dashboard_tab") as TabType;
      if (validTabs.includes(saved)) return saved;
    }
    return "pulpit";
  });

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      localStorage.setItem("iskra_dashboard_tab", tab);
      window.history.replaceState(null, "", `#${tab}`);
    }
    setIsMobileMenuOpen(false);
  };

  // Mobile navigation drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin status
  const isAdmin =
    user?.role === "superadmin" ||
    user?.role === "admin" ||
    user?.email?.toLowerCase().includes("projekt@");

  // UI Dropdowns & States
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("Ostatnie 30 dni");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeMapTooltip, setActiveMapTooltip] = useState(true);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("149.00");
  const [prodComparePrice, setProdComparePrice] = useState("199.00");
  const [prodType, setProdType] = useState<"Fizyczny" | "Cyfrowy">("Fizyczny");
  const [prodStock, setProdStock] = useState("50");
  const [prodVariants, setProdVariants] = useState<string[]>(["S", "M", "L", "XL"]);
  const [prodDescription, setProdDescription] = useState("");
  const [prodImage, setProdImage] = useState("");

  // Billing Interval for Packages ("miesiac" | "rok")
  const [billingInterval, setBillingInterval] = useState<"miesiac" | "rok">("miesiac");

  // Template Filter for Szablony tab ("Darmowe" | "Premium")
  const [templateFilter, setTemplateFilter] = useState<"Darmowe" | "Premium">("Darmowe");
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("Dark Vibe");

  // User Packages State (Pakiety i sklepy użytkownika)
  const [userPackages, setUserPackages] = useState<UserPackage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("iskra_user_packages_v2");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    if (user?.services && user.services.length > 0) {
      return user.services.map((s) => ({
        id: s.id || `pkg_${s.number}`,
        number: s.number || 5191,
        name: s.assignedStoreName || s.title || `Pakiet ${s.planType} #${s.number}`,
        planType: (s.planType as any) || "Start",
        price: s.planType === "Start" ? "14 dni za darmo" : s.planType === "Creator" ? "29.99 zł / msc" : "59.99 zł / msc",
        expiresAt: s.expiresAt || new Date(Date.now() + 14 * 86400000).toISOString(),
        storeName: s.assignedStoreName || "",
        subdomain: s.assignedSubdomain || "",
        logoUrl: "",
        isConfigured: Boolean(s.assignedSubdomain),
      }));
    }
    if (userStores && userStores.length > 0) {
      return userStores.map((st, idx) => ({
        id: st.id || `pkg_${idx + 1000}`,
        number: 1000 + idx,
        name: st.name || `Sklep #${1000 + idx}`,
        planType: (st.planType as any) || "Creator",
        price: "29.99 zł / msc",
        expiresAt: st.planExpiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
        storeName: st.name,
        subdomain: st.subdomain,
        logoUrl: st.logoUrl || "",
        isConfigured: Boolean(st.subdomain),
      }));
    }
    return [];
  });

  // Package renaming
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editingPackageName, setEditingPackageName] = useState("");

  // Store Configurator Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedPackageForConfig, setSelectedPackageForConfig] = useState<UserPackage | null>(null);
  const [configStoreName, setConfigStoreName] = useState("");
  const [configSubdomain, setConfigSubdomain] = useState("");
  const [configLogo, setConfigLogo] = useState("");

  // Upgrade Modal State
  const [upgradingPackage, setUpgradingPackage] = useState<UserPackage | null>(null);

  // Active Store / Subdomain logic
  const configuredPackage = userPackages.find((p) => p.isConfigured && p.subdomain);
  const hasActiveStore = Boolean(configuredPackage);
  const activeSubdomain = configuredPackage?.subdomain || "";
  const liveStoreUrl = `https://${activeSubdomain}.iskral.pl`;

  const currentStore: StoreConfig = activeStore || (userStores.length > 0 ? userStores[0] : {
    id: configuredPackage?.id || "empty_store",
    name: configuredPackage?.storeName || "Mój Sklep",
    subdomain: configuredPackage?.subdomain || "",
    customDomain: "",
    template: "Dark Vibe",
    accentColor: "#D0FF00",
    announcement: "",
    planType: (configuredPackage?.planType as any) || user?.plan || "Brak",
    planStatus: "active",
    balanceCents: 0,
    visitsCount: 0,
    domainVerified: false,
    stripeStatus: "disconnected",
    dropConfig: {
      enabled: false,
      template: "Cyberpunk Launch",
      targetDate: "",
    },
    categories: [],
    products: [],
    orders: [],
    payoutHistory: [],
    customers: [],
    campaigns: [],
    team: [],
    socials: {
      instagram: "",
      tiktok: "",
    },
  });

  // Stats calculation
  const storeOrders = currentStore.orders || [];
  const storeProducts = currentStore.products || [];
  const paidOrders = storeOrders.filter((o) => o.status === "paid");
  const totalRevenueCents = paidOrders.reduce((acc, o) => acc + (o.amountTotalCents || 0), currentStore.balanceCents || 0);
  const totalRevenuePLN = (totalRevenueCents / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalOrdersCount = paidOrders.length;
  const aovPLN = totalOrdersCount > 0 ? (totalRevenueCents / totalOrdersCount / 100).toFixed(2) : "0.00";

  // Handlers for packages with Stripe and Email integration
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");

    if (checkoutStatus === "success") {
      const plan = (params.get("plan") as "Start" | "Creator" | "Brand") || "Creator";
      const billing = params.get("billing") || "miesiac";
      const action = params.get("action") || "buy";
      const pkgIdParam = params.get("pkg_id");
      const isYearly = billing === "rok";
      const durationDays = isYearly ? 365 : 30;

      if (action === "extend" && pkgIdParam) {
        setUserPackages((prev) => {
          const updated = prev.map((p) => {
            if (p.id === pkgIdParam) {
              const currentExp = new Date(p.expiresAt).getTime();
              const base = currentExp > Date.now() ? currentExp : Date.now();
              return { ...p, expiresAt: new Date(base + durationDays * 86400000).toISOString() };
            }
            return p;
          });
          localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
          return updated;
        });
        if (setMessage) {
          setMessage({ type: "success", text: "🎉 Pomyślnie przedłużono subskrypcję pakietu przez Stripe!" });
        }
      } else if (action === "upgrade" && pkgIdParam) {
        setUserPackages((prev) => {
          const updated = prev.map((p) => {
            if (p.id === pkgIdParam) {
              return {
                ...p,
                planType: plan,
                price: plan === "Creator" ? "29.99 zł / msc" : "59.99 zł / msc",
              };
            }
            return p;
          });
          localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
          return updated;
        });
        if (setMessage) {
          setMessage({ type: "success", text: `🎉 Pakiet został pomyślnie ulepszony do ${plan}!` });
        }
      } else {
        const pkgNum = Math.floor(1000 + Math.random() * 9000);
        const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();
        const priceLabel = isYearly
          ? plan === "Creator" ? "14.99 zł / msc (Rocznie)" : "29.99 zł / msc (Rocznie)"
          : plan === "Creator" ? "29.99 zł / msc" : "59.99 zł / msc";

        const newPkg: UserPackage = {
          id: `pkg_${Date.now()}_${pkgNum}`,
          number: pkgNum,
          name: `Pakiet ${plan} #${pkgNum}`,
          planType: plan,
          price: priceLabel,
          expiresAt,
          isConfigured: false,
        };

        setUserPackages((prev) => {
          const exists = prev.some((p) => p.name === newPkg.name);
          if (exists) return prev;
          const updated = [newPkg, ...prev];
          localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
          return updated;
        });

        // Send transactional email
        if (user?.email) {
          fetch("/api/auth/send-plan-confirmation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              planName: `Pakiet ${plan}`,
              amountFormatted: priceLabel,
              expiresAtFormatted: new Date(expiresAt).toLocaleDateString("pl-PL"),
              dashboardUrl: window.location.origin + "/dashboard",
            }),
          }).catch(() => {});
        }

        if (setMessage) {
          setMessage({
            type: "success",
            text: `🎉 Płatność zakończona sukcesem! Aktywowano Pakiet ${plan} #${pkgNum}.`,
          });
        }

        setSelectedPackageForConfig(newPkg);
        setConfigStoreName("");
        setConfigSubdomain("");
        setConfigLogo("");
        setShowConfigModal(true);
      }

      // Clean URL params
      const currentTabHash = window.location.hash || "#pulpit";
      window.history.replaceState(null, "", window.location.pathname + currentTabHash);
    } else if (checkoutStatus === "cancelled") {
      if (setMessage) {
        setMessage({ type: "error", text: "Płatność Stripe została anulowana." });
      }
      const currentTabHash = window.location.hash || "#produkty";
      window.history.replaceState(null, "", window.location.pathname + currentTabHash);
    }
  }, [user?.email, setMessage]);

  const handleBuyPackage = async (planType: "Start" | "Creator" | "Brand") => {
    const isYearly = billingInterval === "rok" && planType !== "Start";
    const durationDays = planType === "Start" ? 14 : isYearly ? 365 : 30;
    const priceLabel = planType === "Start"
      ? "14 dni za darmo"
      : isYearly
      ? planType === "Creator"
        ? "14.99 zł / msc (Rocznie)"
        : "29.99 zł / msc (Rocznie)"
      : planType === "Creator"
      ? "29.99 zł / msc"
      : "59.99 zł / msc";

    if (planType === "Start") {
      const pkgNum = Math.floor(1000 + Math.random() * 9000);
      const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();
      const newPkg: UserPackage = {
        id: `pkg_${Date.now()}_${pkgNum}`,
        number: pkgNum,
        name: `Pakiet Start #${pkgNum}`,
        planType: "Start",
        price: "14 dni za darmo",
        expiresAt,
        isConfigured: false,
      };

      setUserPackages((prev) => {
        const updated = [newPkg, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
        }
        return updated;
      });

      // Send email confirmation
      if (user?.email) {
        fetch("/api/auth/send-plan-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            planName: "Pakiet Start (Trial 14 dni)",
            amountFormatted: "0.00 PLN",
            expiresAtFormatted: new Date(expiresAt).toLocaleDateString("pl-PL"),
            dashboardUrl: window.location.origin + "/dashboard",
          }),
        }).catch(() => {});
      }

      if (setMessage) {
        setMessage({
          type: "success",
          text: `🎉 Aktywowano Pakiet Start #${pkgNum}! Możesz teraz skonfigurować swój sklep.`,
        });
      }

      setSelectedPackageForConfig(newPkg);
      setConfigStoreName("");
      setConfigSubdomain("");
      setConfigLogo("");
      setShowConfigModal(true);
      return;
    }

    // Płatne pakiety: Creator lub Brand -> Przekierowanie do Stripe Checkout
    const priceCents = isYearly
      ? planType === "Creator" ? 17988 : 35988
      : planType === "Creator" ? 2999 : 5999;

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: user?.id || "user_store",
          title: `Pakiet SaaS ${planType}`,
          priceCents,
          customerEmail: user?.email || "",
          isPlan: true,
          planType,
          billingCycle: billingInterval,
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.error("Stripe Checkout Error:", err);
    }

    // Fallback if Stripe is offline in local environment
    const pkgNum = Math.floor(1000 + Math.random() * 9000);
    const expiresAt = new Date(Date.now() + durationDays * 86400000).toISOString();
    const fallbackPkg: UserPackage = {
      id: `pkg_${Date.now()}_${pkgNum}`,
      number: pkgNum,
      name: `Pakiet ${planType} #${pkgNum}`,
      planType,
      price: priceLabel,
      expiresAt,
      isConfigured: false,
    };

    setUserPackages((prev) => {
      const updated = [fallbackPkg, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
      }
      return updated;
    });

    if (user?.email) {
      fetch("/api/auth/send-plan-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          planName: `Pakiet ${planType}`,
          amountFormatted: priceLabel,
          expiresAtFormatted: new Date(expiresAt).toLocaleDateString("pl-PL"),
          dashboardUrl: window.location.origin + "/dashboard",
        }),
      }).catch(() => {});
    }

    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Aktywowano Pakiet ${planType} #${pkgNum}! Możesz teraz skonfigurować swój sklep.`,
      });
    }

    setSelectedPackageForConfig(fallbackPkg);
    setConfigStoreName("");
    setConfigSubdomain("");
    setConfigLogo("");
    setShowConfigModal(true);
  };

  const handleSelectTemplate = (templateName: string) => {
    setSelectedTemplateName(templateName);
    if (updateStoreConfig) {
      updateStoreConfig({ template: templateName });
    }
    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Wybrano szablon "${templateName}" jako aktywny motyw Twojego sklepu!`,
      });
    }
  };

  const handleStartRename = (pkg: UserPackage) => {
    setEditingPackageId(pkg.id);
    setEditingPackageName(pkg.name);
  };

  const handleSaveRename = (pkgId: string) => {
    if (!editingPackageName.trim()) {
      setEditingPackageId(null);
      return;
    }
    setUserPackages((prev) => {
      const updated = prev.map((p) => (p.id === pkgId ? { ...p, name: editingPackageName.trim() } : p));
      if (typeof window !== "undefined") {
        localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
      }
      return updated;
    });
    setEditingPackageId(null);
    if (setMessage) {
      setMessage({ type: "success", text: "Zaktualizowano nazwę pakietu." });
    }
  };

  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Wygasł";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) {
      return `${days} dni, ${hours} godz.`;
    }
    return `${hours} godz., ${minutes} min.`;
  };

  const handleExtendPackage = async (pkgId: string) => {
    const targetPkg = userPackages.find((p) => p.id === pkgId);
    if (!targetPkg) return;

    if (targetPkg.planType === "Start") {
      setUserPackages((prev) => {
        const updated = prev.map((p) => {
          if (p.id === pkgId) {
            const currentExpiry = new Date(p.expiresAt).getTime();
            const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
            const newExpiry = new Date(baseTime + 14 * 86400000).toISOString();
            return { ...p, expiresAt: newExpiry };
          }
          return p;
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
        }
        return updated;
      });
      if (setMessage) {
        setMessage({ type: "success", text: "🎉 Przedłużono okres próbny Pakietu Start o 14 dni!" });
      }
      return;
    }

    const priceCents = targetPkg.planType === "Creator" ? 2999 : 5999;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: user?.id || "user_store",
          title: `Przedłużenie subskrypcji - ${targetPkg.name} (+30 dni)`,
          priceCents,
          customerEmail: user?.email || "",
          isPlan: true,
          planType: targetPkg.planType,
          billingCycle: "miesiac",
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.error("Stripe Extension Error:", err);
    }

    // Fallback
    setUserPackages((prev) => {
      const updated = prev.map((p) => {
        if (p.id === pkgId) {
          const currentExpiry = new Date(p.expiresAt).getTime();
          const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
          const newExpiry = new Date(baseTime + 30 * 86400000).toISOString();
          return { ...p, expiresAt: newExpiry };
        }
        return p;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
      }
      return updated;
    });
    if (setMessage) {
      setMessage({ type: "success", text: "🎉 Pomyślnie przedłużono subskrypcję pakietu o 30 dni!" });
    }
  };

  const handleUpgradePackage = async (targetPlan: "Creator" | "Brand") => {
    if (!upgradingPackage) return;
    const currentPlan = upgradingPackage.planType;

    let diffPLN = 29.99;
    if (currentPlan === "Start" && targetPlan === "Creator") diffPLN = 29.99;
    else if (currentPlan === "Start" && targetPlan === "Brand") diffPLN = 59.99;
    else if (currentPlan === "Creator" && targetPlan === "Brand") diffPLN = 30.00;

    const priceCents = Math.round(diffPLN * 100);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: user?.id || "user_store",
          title: `Ulepszenie pakietu do ${targetPlan} (Dopłata różnicy)`,
          priceCents,
          customerEmail: user?.email || "",
          isPlan: true,
          planType: targetPlan,
          billingCycle: "miesiac",
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.error("Stripe Upgrade Error:", err);
    }

    // Fallback
    setUserPackages((prev) => {
      const updated = prev.map((p) => {
        if (p.id === upgradingPackage.id) {
          return {
            ...p,
            planType: targetPlan,
            price: targetPlan === "Creator" ? "29.99 zł / msc" : "59.99 zł / msc",
          };
        }
        return p;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
      }
      return updated;
    });
    setUpgradingPackage(null);
    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Pakiet został pomyślnie ulepszony do ${targetPlan}!`,
      });
    }
  };

  const handleOpenConfigurator = (pkg: UserPackage) => {
    setSelectedPackageForConfig(pkg);
    setConfigStoreName(pkg.storeName || "");
    setConfigSubdomain(pkg.subdomain || "");
    setConfigLogo(pkg.logoUrl || "");
    setShowConfigModal(true);
  };

  const handleSaveStoreConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configStoreName.trim()) {
      if (setMessage) setMessage({ type: "error", text: "Podaj nazwę sklepu!" });
      return;
    }
    const cleanSub = (configSubdomain || configStoreName).toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!cleanSub) {
      if (setMessage) setMessage({ type: "error", text: "Podaj poprawną subdomenę sklepu!" });
      return;
    }

    if (selectedPackageForConfig) {
      setUserPackages((prev) => {
        const updated = prev.map((p) => {
          if (p.id === selectedPackageForConfig.id) {
            return {
              ...p,
              storeName: configStoreName.trim(),
              subdomain: cleanSub,
              logoUrl: configLogo.trim(),
              isConfigured: true,
            };
          }
          return p;
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("iskra_user_packages_v2", JSON.stringify(updated));
        }
        return updated;
      });
    }

    if (createOrUpdateStoreFull) {
      createOrUpdateStoreFull({
        name: configStoreName.trim(),
        subdomain: cleanSub,
        logoUrl: configLogo.trim(),
        template: "Dark Vibe",
        accentColor: "#D0FF00",
        announcement: "",
        plan: selectedPackageForConfig?.planType || "Start",
        billingCycle: "miesiac",
      });
    }

    setShowConfigModal(false);
    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Sklep '${configStoreName}' został skonfigurowany pod adresem: https://${cleanSub}.iskral.pl`,
      });
    }
  };

  // Weekly Revenue Bar Chart Data (#FF5A28 Theme)
  const weeklySalesData = [
    { week: "W1", past: [35, 50, 75, 45], active: [], label: "1 240 PLN" },
    { week: "W2", past: [20, 45, 65, 55], active: [], label: "1 890 PLN" },
    { week: "W3", past: [30, 55, 80, 60], active: [], label: "2 150 PLN" },
    { week: "W4", past: [], active: [95, 75, 60, 50, 65, 40], peak: "4 820 PLN" },
    { week: "W5", past: [], active: [70, 50, 35, 25, 40, 60], label: "3 200 PLN" },
    { week: "W6", past: [], active: [40, 30, 25, 20, 45, 55], label: "2 780 PLN" },
    { week: "W7", past: [], active: [75, 55, 45, 30, 50, 65], label: "3 940 PLN" },
    { week: "W8", past: [], active: [50, 40, 30, 20, 15, 10], label: "1 650 PLN" },
  ];

  // Product submission handler
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) return;

    const cleanPrice = prodPrice.replace(",", ".").replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(cleanPrice) || 10;
    const priceCents = Math.round(priceNum * 100);
    const defaultImg = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80";

    if (editingProductId && updateProduct) {
      updateProduct(editingProductId, {
        name: prodName,
        price: `${priceNum.toFixed(2)} PLN`,
        priceCents,
        type: prodType,
        stock: parseInt(prodStock) || 50,
        variants: prodVariants,
        description: prodDescription,
        image: prodImage || defaultImg,
      });
      if (setMessage) setMessage({ type: "success", text: `Zaktualizowano produkt: ${prodName}` });
    } else if (addProduct) {
      addProduct({
        name: prodName,
        price: `${priceNum.toFixed(2)} PLN`,
        priceCents,
        type: prodType,
        status: "Aktywny",
        stock: parseInt(prodStock) || 50,
        variants: prodVariants,
        description: prodDescription,
        image: prodImage || defaultImg,
        images: [prodImage || defaultImg],
      });
      if (setMessage) setMessage({ type: "success", text: `Dodano nowy produkt: ${prodName}` });
    }
    setShowProductModal(false);
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
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setProdName(p.name);
    setProdPrice(p.price.replace(" PLN", "").trim());
    setProdType(p.type);
    setProdStock(String(p.stock || 50));
    setProdVariants(p.variants && p.variants.length > 0 ? p.variants : ["S", "M", "L", "XL"]);
    setProdDescription(p.description || "");
    setProdImage(p.image || "");
    setShowProductModal(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0B0D] text-white flex flex-col lg:flex-row font-sans antialiased selection:bg-[#D0FF00] selection:text-black">
      
      {/* ========================================================================= */}
      {/* MOBILNY HEADER (WIDOCZNY TYLKO NA SMARTFONACH / TABLETACH < lg) */}
      {/* ========================================================================= */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-[#070709] border-b border-[#141419] sticky top-0 z-50 select-none">
        <Link href="/dashboard" className="flex items-center">
          <img
            src="/logodb.svg"
            alt="Logo"
            className="w-[140px] h-[18px] object-contain"
          />
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 rounded-xl bg-[#0D0E12] border border-[#17181F] flex items-center justify-center text-white cursor-pointer active:scale-95 transition-transform"
          aria-label="Menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-[#D0FF00]" />
          )}
        </button>
      </header>

      {/* ========================================================================= */}
      {/* MOBILNY DRAWER / OVERLAY SIDEBAR (WIDOCZNY PO KLIKNIĘCIU HAMBURGERA) */}
      {/* ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-[280px] bg-[#070709] border-r border-[#141419] h-full flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-8">
                <img
                  src="/logodb.svg"
                  alt="Logo"
                  className="w-[140px] h-[18px] object-contain"
                />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[12px] font-medium text-[#333333] select-none text-left tracking-wider uppercase mb-[16px] font-['Poppins',sans-serif]">
                GŁÓWNE
              </div>

              <nav className="flex flex-col gap-2 font-['Poppins',sans-serif]">
                <button
                  onClick={() => setActiveTab("pulpit")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    activeTab === "pulpit"
                      ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold"
                      : "text-[#5B5B62] hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-5 h-5 shrink-0" />
                  <span className="text-[15px]">Strona główna</span>
                </button>

                <button
                  onClick={() => setActiveTab("produkty")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    activeTab === "produkty"
                      ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold"
                      : "text-[#5B5B62] hover:text-white"
                  }`}
                >
                  <ShoppingBasket className="w-5 h-5 shrink-0" />
                  <span className="text-[15px]">Sklep</span>
                </button>

                <button
                  onClick={() => setActiveTab("kreator")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    activeTab === "kreator"
                      ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold"
                      : "text-[#5B5B62] hover:text-white"
                  }`}
                >
                  <BookOpen className="w-5 h-5 shrink-0" />
                  <span className="text-[15px]">Szablony</span>
                </button>
              </nav>
            </div>

            <div className="flex flex-col gap-2 pt-6 border-t border-[#141419] font-['Poppins',sans-serif]">
              <button
                onClick={() => setActiveTab("profil")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                  activeTab === "profil"
                    ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold"
                    : "text-[#5B5B62] hover:text-white"
                }`}
              >
                <UserIcon className="w-5 h-5 shrink-0" />
                <span className="text-[15px]">Twój profil</span>
              </button>

              {logout && (
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors cursor-pointer text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  <span className="text-[15px]">Wyloguj się</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEWY SIDEBAR DESKTOP (BG #070709, LOGODB.SVG 188x22, POPPINS, #D0FF00) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-[284px] bg-[#070709] border-r border-[#141419] flex-col justify-between shrink-0 select-none sticky top-0 h-screen overflow-y-auto z-40">
        
        <div>
          {/* 1. LOGO NA SAMEJ GÓRZE - WYŚRODKOWANE, PADDING 64px GÓRA I DÓŁ */}
          <div className="flex items-center justify-center py-[64px] px-6">
            <Link href="/dashboard" className="flex items-center justify-center">
              <img
                src="/logodb.svg"
                alt="Logo"
                className="w-[188px] h-[22px] object-contain"
              />
            </Link>
          </div>

          {/* 2. SEKCJA GŁÓWNE (Poppins medium 12, #333333, padding 48px lewo/prawo, 16px odstępu poniżej) */}
          <div className="px-[48px] text-[12px] font-medium text-[#333333] select-none text-left tracking-wider uppercase mb-[16px]">
            GŁÓWNE
          </div>

          {/* 3. MENU GŁÓWNE (Strona główna -> 8px -> Sklep -> 8px -> Szablony) */}
          <nav className="flex flex-col">
            {/* Strona główna */}
            <button
              onClick={() => setActiveTab("pulpit")}
              className={`relative w-full flex items-center gap-[8px] px-[48px] py-[4px] text-left transition-colors cursor-pointer group mb-[8px] ${
                activeTab === "pulpit"
                  ? "text-[#D0FF00]"
                  : "text-[#5B5B62] hover:text-[#8E8E98]"
              }`}
            >
              {activeTab === "pulpit" && (
                <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />
              )}
              <LayoutGrid
                className={`w-5 h-5 shrink-0 transition-colors ${
                  activeTab === "pulpit"
                    ? "text-[#D0FF00]"
                    : "text-[#22222A] group-hover:text-[#5B5B62]"
                }`}
              />
              <span className="text-[15px] font-medium tracking-tight">
                Strona główna
              </span>
            </button>

            {/* Sklep */}
            <button
              onClick={() => setActiveTab("produkty")}
              className={`relative w-full flex items-center gap-[8px] px-[48px] py-[4px] text-left transition-colors cursor-pointer group mb-[8px] ${
                activeTab === "produkty"
                  ? "text-[#D0FF00]"
                  : "text-[#5B5B62] hover:text-[#8E8E98]"
              }`}
            >
              {activeTab === "produkty" && (
                <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />
              )}
              <ShoppingBasket
                className={`w-5 h-5 shrink-0 transition-colors ${
                  activeTab === "produkty"
                    ? "text-[#D0FF00]"
                    : "text-[#22222A] group-hover:text-[#5B5B62]"
                }`}
              />
              <span className="text-[15px] font-medium tracking-tight">
                Sklep
              </span>
            </button>

            {/* Szablony */}
            <button
              onClick={() => setActiveTab("kreator")}
              className={`relative w-full flex items-center gap-[8px] px-[48px] py-[4px] text-left transition-colors cursor-pointer group ${
                activeTab === "kreator"
                  ? "text-[#D0FF00]"
                  : "text-[#5B5B62] hover:text-[#8E8E98]"
              }`}
            >
              {activeTab === "kreator" && (
                <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />
              )}
              <BookOpen
                className={`w-5 h-5 shrink-0 transition-colors ${
                  activeTab === "kreator"
                    ? "text-[#D0FF00]"
                    : "text-[#22222A] group-hover:text-[#5B5B62]"
                }`}
              />
              <span className="text-[15px] font-medium tracking-tight">
                Szablony
              </span>
            </button>
          </nav>
        </div>

        {/* 4. DOLNA SEKCJA SIDEBARU (TYLKO TWÓJ PROFIL I WYLOGUJ SIĘ, ZMNIEJSZONY SPACING OD DOŁU) */}
        <div className="flex flex-col pb-[24px]">
          {/* Twój profil */}
          <button
            onClick={() => setActiveTab("profil")}
            className={`relative w-full flex items-center gap-[8px] px-[48px] py-[4px] text-left transition-colors cursor-pointer group mb-[8px] ${
              activeTab === "profil"
                ? "text-[#D0FF00]"
                : "text-[#5B5B62] hover:text-[#8E8E98]"
            }`}
          >
            {activeTab === "profil" && (
              <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />
            )}
            <UserIcon
              className={`w-5 h-5 shrink-0 transition-colors ${
                activeTab === "profil"
                  ? "text-[#D0FF00]"
                  : "text-[#22222A] group-hover:text-[#5B5B62]"
              }`}
            />
            <span className="text-[15px] font-medium tracking-tight">
              Twój profil
            </span>
          </button>

          {/* Wyloguj się */}
          {logout && (
            <button
              onClick={logout}
              className="relative w-full flex items-center gap-[8px] px-[48px] py-[4px] text-left transition-colors cursor-pointer group text-[#5B5B62] hover:text-[#FF5A5A]"
            >
              <LogOut className="w-5 h-5 shrink-0 transition-colors text-[#22222A] group-hover:text-[#FF5A5A]" />
              <span className="text-[15px] font-medium tracking-tight">
                Wyloguj się
              </span>
            </button>
          )}
        </div>

      </aside>

      {/* ========================================================================= */}
      {/* GŁÓWNA PRZESTRZEŃ DASHBOARDU - PEŁNY DARK THEME (BG #0A0B0D) */}
      {/* ========================================================================= */}
      <main className="flex-1 bg-[#0A0B0D] min-h-screen p-4 sm:p-6 lg:p-10 overflow-y-auto font-sans">
        
        {/* GÓRNY PASEK NAGŁÓWKA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Sora',sans-serif]">
                {activeTab === "pulpit" && "Strona główna"}
                {activeTab === "produkty" && "Sklep"}
                {activeTab === "zamowienia" && "Zamówienia"}
                {activeTab === "pakiety" && "Pakiety"}
                {activeTab === "kreator" && "Szablony"}
                {activeTab === "drop" && "Tryb Dropu"}
                {activeTab === "ustawienia" && "Ustawienia Konta"}
                {activeTab === "profil" && "Twój Profil"}
              </h1>
              {hasActiveStore && (
                <a
                  href={liveStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#0D0E12] border border-[#17181F] text-xs font-semibold text-zinc-300 hover:text-white rounded-full shadow-sm hover:border-[#D0FF00]/40 transition-all font-['Poppins',sans-serif]"
                >
                  <span>{activeSubdomain}.iskral.pl</span>
                  <ExternalLink className="w-3 h-3 text-[#D0FF00]" />
                </a>
              )}
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-['Poppins',sans-serif]">
              {activeTab === "pulpit" && "Zarządzaj swoim sklepem internetowym w jednym miejscu."}
              {activeTab === "produkty" && "Wybierz pakiet dla swojej marki lub zarządzaj aktywnymi subskrypcjami."}
              {activeTab === "zamowienia" && "Historia zamówień i płatności Twoich klientów."}
              {activeTab === "pakiety" && "Przegląd ważności i przedłużanie subskrypcji."}
              {activeTab === "kreator" && "Wybierz gotowy motyw wizualny dla swojego sklepu."}
              {activeTab === "drop" && "Konfiguruj premiery i tryb odliczania do dropu."}
              {activeTab === "ustawienia" && "Zarządzaj danymi konta, podepnij domenę i skonfiguruj wypłaty."}
              {activeTab === "profil" && "Szczegóły profilu użytkownika i dane kontaktowe."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Dzwonek powiadomień */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-[54px] h-[54px] rounded-[18px] bg-[#0D0E12] hover:bg-[#13151D] border border-[#17181F] hover:border-[#262835] flex items-center justify-center text-zinc-300 hover:text-white relative transition-all cursor-pointer group"
                title="Powiadomienia"
              >
                <Bell className="w-5 h-5 text-zinc-300 group-hover:text-white transition-colors" />
                <span className="w-2 h-2 rounded-full bg-[#D0FF00] absolute top-4 right-4 ring-2 ring-[#0D0E12]" />
              </button>

              {/* Dropdown powiadomień */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0D0E12] border border-[#17181F] rounded-[20px] p-3 shadow-2xl z-50 animate-in fade-in">
                  <span className="text-[11px] font-bold uppercase text-zinc-400 block mb-2 px-1 tracking-wider font-['Poppins',sans-serif]">
                    Powiadomienia
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-[#111319] rounded-xl border border-[#1C1E26] text-white">
                      <span className="font-bold block text-[#D0FF00] font-['Poppins',sans-serif]">🟢 System IskraL</span>
                      <span className="text-[11px] text-zinc-400 font-['Poppins',sans-serif] mt-0.5 block">
                        {userPackages.length > 0 ? "Twój pakiet jest aktywny." : "Wybierz pakiet w zakładce Sklep, aby rozpocząć."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Karta Konta Użytkownika z Dropdownem */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="h-[54px] flex items-center gap-3 bg-[#0D0E12] hover:bg-[#13151D] border border-[#17181F] hover:border-[#262835] rounded-[18px] p-1.5 pr-4 cursor-pointer transition-all group select-none"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/50 shrink-0 flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user?.name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"
                      alt={user?.name || "Jan Kowalski"}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <span className="text-xs sm:text-[13px] font-semibold text-white block leading-tight truncate font-['Poppins',sans-serif]">
                    {user?.name || "Jan Kowalski"}
                  </span>
                  <span className="text-[11px] text-zinc-500 block truncate font-normal leading-tight mt-0.5 font-['Poppins',sans-serif]">
                    {user?.email || "jan.kowalski@gmail.com"}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform ml-1 ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown menu konta */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0D0E12] border border-[#17181F] rounded-[20px] p-1.5 z-50 shadow-2xl animate-in fade-in">
                  <div className="px-3 py-2.5 border-b border-[#17181F] mb-1">
                    <span className="text-[10px] font-bold uppercase text-[#D0FF00] block tracking-wider font-['Poppins',sans-serif]">
                      {isAdmin ? "Administrator" : "Konto Klienta"}
                    </span>
                    <span className="text-xs font-semibold text-white block truncate font-['Poppins',sans-serif]">{user?.name || "Jan Kowalski"}</span>
                    <span className="text-[10px] text-zinc-500 block truncate font-['Poppins',sans-serif]">{user?.email || "jan.kowalski@gmail.com"}</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("profil");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#151720] hover:text-white rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer font-['Poppins',sans-serif]"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Twój profil</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("ustawienia");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#151720] hover:text-white rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer font-['Poppins',sans-serif]"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Ustawienia konta</span>
                  </button>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-[#D0FF00] hover:bg-[#D0FF00]/10 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer font-['Poppins',sans-serif]"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#D0FF00]" />
                      <span>Panel Administratora</span>
                    </Link>
                  )}

                  <div className="border-t border-[#17181F] my-1" />

                  {logout && (
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer font-['Poppins',sans-serif]"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>Wyloguj się</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* WIDOK 1: STRONA GŁÓWNA (DYNAMICZNIE DLA NOWYCH VS POSIADAJĄCYCH PAKIET) */}
        {/* ========================================================================= */}
        {activeTab === "pulpit" && (
          <div className="space-y-6 max-w-5xl">
            {userPackages.length === 0 ? (
              /* DLA NOWEGO UŻYTKOWNIKA BEZ PAKIETU: 2 KAFELKI ONBOARDINGOWE */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* KARTA 1 (LEWA): BRAK PAKIETU */}
                <div className="bg-[#0D0E12] border border-[#17181F] hover:border-[#222530] rounded-[24px] p-7 flex flex-col justify-between transition-all">
                  <div className="space-y-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-zinc-400">
                      <ShoppingBag className="w-5 h-5 text-[#D0FF00]" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight font-['Sora',sans-serif]">
                      Nie posiadasz żadnego pakietu
                    </h2>
                    <p className="text-sm text-zinc-400 leading-relaxed font-['Poppins',sans-serif]">
                      Aby stworzyć swój sklep internetowy, dodawać produkty i uruchomić sprzedaż, wybierz jeden z dostępnych pakietów platformy.
                    </p>
                  </div>

                  <div className="pt-7">
                    <button
                      onClick={() => setActiveTab("produkty")}
                      className="w-full sm:w-auto px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Przejdź dalej</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* KARTA 2 (PRAWA): SKLEP NA 14 DNI (DLA NOWYCH OSÓB) */}
                <div className="bg-[#0D0E12] border border-[#17181F] hover:border-[#222530] rounded-[24px] p-7 flex flex-col justify-between transition-all">
                  <div className="space-y-3.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D0FF00]/10 border border-[#D0FF00]/25 text-[#D0FF00] text-[11px] font-medium font-['Poppins',sans-serif]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Dla nowych użytkowników • Tylko raz</span>
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight font-['Sora',sans-serif]">
                      Sklep na 14 dni
                    </h2>

                    <p className="text-sm text-zinc-400 leading-relaxed font-['Poppins',sans-serif]">
                      Wypróbuj możliwości platformy za darmo przez 14 dni z Pakietem Start. Uruchom swój sklep bez żadnych opłat wstępnych i przetestuj sprzedaż.
                    </p>
                  </div>

                  <div className="pt-7">
                    <button
                      onClick={() => {
                        setActiveTab("produkty");
                      }}
                      className="w-full sm:w-auto px-[24px] py-[12px] bg-[#141722] hover:bg-[#1A1F2C] text-white text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#22283A] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Wypróbuj za darmo (14 dni)</span>
                      <ArrowUpRight className="w-4 h-4 text-[#D0FF00]" />
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* DLA UŻYTKOWNIKA Z PAKIETEM: KAFELKI PAKIETÓW W CZYSTYM, PROPORCJONALNYM UKŁADZIE KART */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPackages.map((pkg) => {
                  const remaining = getRemainingTime(pkg.expiresAt);
                  const isExp = remaining === "Wygasł";

                  return (
                    <div
                      key={pkg.id}
                      className="bg-[#0D0E12] border border-[#17181F] hover:border-[#222530] rounded-[24px] p-6 flex flex-col justify-between transition-all space-y-6"
                    >
                      <div className="space-y-4">
                        {/* GÓRA KARTY: LOGO I BADGE TYPU PAKIETU */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-[#111319] border border-[#1C1E26] overflow-hidden flex items-center justify-center shrink-0">
                            {pkg.logoUrl ? (
                              <img src={pkg.logoUrl} alt={pkg.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center p-1">
                                <ShoppingBag className="w-5 h-5 text-zinc-500 mx-auto" />
                                <span className="text-[9px] text-zinc-500 font-medium block mt-0.5 leading-none font-['Poppins',sans-serif]">
                                  Brak logo
                                </span>
                              </div>
                            )}
                          </div>

                          <span className="px-3 py-1 rounded-full bg-[#111319] border border-[#1C1E26] text-[11px] font-semibold text-[#D0FF00] font-['Poppins',sans-serif]">
                            {pkg.planType}
                          </span>
                        </div>

                        {/* NAZWA PAKIETU (Z MOŻLIWOŚCIĄ EDYCJI) ORAZ STATUS */}
                        <div className="space-y-1">
                          {editingPackageId === pkg.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingPackageName}
                                onChange={(e) => setEditingPackageName(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-[#111319] border border-[#2A2E3D] rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-[#D0FF00] font-['Poppins',sans-serif]"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRename(pkg.id)}
                                className="px-3 py-1 bg-[#D0FF00] text-black text-xs font-bold rounded-lg cursor-pointer shrink-0 font-['Poppins',sans-serif]"
                              >
                                Zapisz
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <h3 className="text-lg font-bold text-white font-['Poppins',sans-serif]">
                                {pkg.name}
                              </h3>
                              <button
                                onClick={() => handleStartRename(pkg)}
                                className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1 rounded"
                                title="Zmień nazwę"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="text-xs text-zinc-500 font-['Poppins',sans-serif]">
                            ID: #{pkg.number} •{" "}
                            {pkg.isConfigured && pkg.subdomain ? (
                              <a
                                href={`https://${pkg.subdomain}.iskral.pl`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#D0FF00] hover:underline font-medium inline-flex items-center gap-1"
                              >
                                <span>{pkg.subdomain}.iskral.pl</span>
                                <ExternalLink className="w-3 h-3 text-[#D0FF00]" />
                              </a>
                            ) : (
                              <span>Nie skonfigurowano</span>
                            )}
                          </div>
                        </div>

                        {/* WAŻNOŚĆ SUBSKRYPCJI */}
                        <div className="p-3.5 bg-[#111319] rounded-xl border border-[#1C1E26] flex items-center justify-between text-xs font-['Poppins',sans-serif]">
                          <span className="text-zinc-400 flex items-center gap-2 font-medium">
                            <Clock className={`w-4 h-4 ${isExp ? "text-rose-400" : "text-zinc-500"}`} />
                            Ważność:
                          </span>
                          <span className={`font-bold ${isExp ? "text-rose-400" : "text-[#D0FF00]"}`}>
                            {remaining}
                          </span>
                        </div>
                      </div>

                      {/* PRZYCISKI AKCJI KARTY PAKIETU */}
                      <div className="space-y-2.5 pt-2">
                        {pkg.isConfigured && pkg.subdomain ? (
                          <a
                            href={`https://${pkg.subdomain}.iskral.pl`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[15px] font-bold font-['Poppins',sans-serif] rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Przejdź do sklepu</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <button
                            onClick={() => handleOpenConfigurator(pkg)}
                            className="w-full px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[15px] font-bold font-['Poppins',sans-serif] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Przejdź dalej (Konfiguruj)</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-2 font-['Poppins',sans-serif]">
                          <button
                            onClick={() => handleExtendPackage(pkg.id)}
                            className="py-2.5 px-2 bg-[#141722] hover:bg-[#1A1F2C] text-white text-xs font-semibold rounded-xl border border-[#22283A] transition-colors cursor-pointer text-center whitespace-nowrap"
                          >
                            Przedłuż (+30 dni)
                          </button>
                          
                          {pkg.planType !== "Brand" ? (
                            <button
                              onClick={() => setUpgradingPackage(pkg)}
                              className="py-2.5 px-2 bg-[#141722] hover:bg-[#1A1F2C] text-zinc-300 hover:text-[#D0FF00] text-xs font-semibold rounded-xl border border-[#22283A] transition-colors cursor-pointer text-center whitespace-nowrap"
                            >
                              Ulepsz pakiet
                            </button>
                          ) : (
                            <div className="py-2.5 px-2 bg-[#111319] text-zinc-600 text-xs font-medium rounded-xl border border-[#1C1E26] text-center">
                              Najwyższy pakiet
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK 2: SKLEP (CENNIK I ZAKUP PAKIETÓW) */}
        {/* ========================================================================= */}
        {activeTab === "produkty" && (
          <div className="space-y-8 max-w-6xl">
              
              {/* PRZEŁĄCZNIK MIESIĄC / ROK (-50%) - WYRÓWNANY DO LEWEJ, W KOLORYSTYCE CREATORA (#D0FF00) */}
              <div className="flex justify-start items-center">
                <div className="bg-[#0D0E12] border border-[#181A22] p-1.5 rounded-full inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBillingInterval("miesiac")}
                    className={`px-5 py-2 rounded-full text-xs font-semibold font-['Poppins',sans-serif] transition-all cursor-pointer ${
                      billingInterval === "miesiac"
                        ? "bg-[#D0FF00] text-black shadow-sm font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Miesiąc
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval("rok")}
                    className={`px-5 py-2 rounded-full text-xs font-semibold font-['Poppins',sans-serif] transition-all cursor-pointer flex items-center gap-2 ${
                      billingInterval === "rok"
                        ? "bg-[#D0FF00] text-black shadow-sm font-bold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>Rok</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                      billingInterval === "rok"
                        ? "bg-black text-[#D0FF00]"
                        : "bg-[#D0FF00] text-black"
                    }`}>
                      -50%
                    </span>
                  </button>
                </div>
              </div>

              {/* SIATKA 3 KAFELKÓW PAKIETÓW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                
                {/* 1. PAKIET START */}
                <div className="bg-[#0D0E12] border border-[#181A22] hover:border-[#242836] rounded-[24px] p-7 flex flex-col justify-between transition-all">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111319] border border-[#1C1E26] text-zinc-400 text-[11px] font-medium font-['Poppins',sans-serif] w-fit">
                      <span>Pakiet Startowy</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white font-['Poppins',sans-serif]">Pakiet Start</h3>
                      <p className="text-xs text-zinc-400 mt-1 font-['Poppins',sans-serif] leading-relaxed min-h-[36px]">
                        Dla osoby, która chce stworzyć pierwszy sklep i sprawdzić swój pomysł.
                      </p>
                    </div>

                    <div className="py-2.5 border-y border-[#17181F] flex items-baseline justify-between min-h-[52px]">
                      <div className="text-2xl font-bold text-white font-['Poppins',sans-serif]">
                        0.00 PLN
                      </div>
                      <span className="text-xs text-zinc-400 font-['Poppins',sans-serif]">
                        Za darmo na 14 dni
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-zinc-300 font-['Poppins',sans-serif]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>1 gotowy szablon</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>do 5 produktów</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>produkty fizyczne i cyfrowe</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>2,5% prowizji od sprzedaży</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>podstawowe statystyki</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>subdomena .iskral.pl</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleBuyPackage("Start")}
                    className="mt-7 w-full px-[24px] py-[12px] bg-[#141722] hover:bg-[#1A1F2C] text-white text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#22283A] transition-colors cursor-pointer flex items-center justify-center text-center whitespace-nowrap"
                  >
                    Zacznij za darmo
                  </button>
                </div>

                {/* 2. PAKIET CREATOR (WYRÓŻNIONY - NAJBARDZIEJ WYBIERANY) */}
                <div className="bg-[#0D0E12] border-2 border-[#D0FF00]/50 hover:border-[#D0FF00] rounded-[24px] p-7 flex flex-col justify-between transition-all relative">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D0FF00]/10 border border-[#D0FF00]/30 text-[#D0FF00] text-[11px] font-semibold font-['Poppins',sans-serif] w-fit">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Najbardziej wybierany</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white font-['Poppins',sans-serif]">Pakiet Creator</h3>
                      <p className="text-xs text-zinc-400 mt-1 font-['Poppins',sans-serif] leading-relaxed min-h-[36px]">
                        Dla twórców i marek, które zaczynają regularnie sprzedawać.
                      </p>
                    </div>

                    <div className="py-2.5 border-y border-[#17181F] flex items-baseline justify-between min-h-[52px]">
                      <div>
                        <span className="text-2xl font-bold text-white font-['Poppins',sans-serif]">
                          {billingInterval === "miesiac" ? "29.99 PLN" : "14.99 PLN"}
                        </span>
                        <span className="text-xs text-zinc-400 font-['Poppins',sans-serif] ml-1">
                          / miesięcznie
                        </span>
                      </div>
                      {billingInterval === "rok" && (
                        <span className="text-[11px] font-medium text-[#D0FF00] font-['Poppins',sans-serif]">
                          -50% taniej
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2.5 text-xs text-zinc-300 font-['Poppins',sans-serif]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>wszystko ze Start</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>nielimitowane produkty</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>wszystkie szablony</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>własna domena</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>dropy i countdown</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>kody rabatowe</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>1,0% prowizji od sprzedaży</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleBuyPackage("Creator")}
                    className="mt-7 w-full px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center text-center whitespace-nowrap"
                  >
                    Kup Pakiet Creator
                  </button>
                </div>

                {/* 3. PAKIET BRAND */}
                <div className="bg-[#0D0E12] border border-[#181A22] hover:border-[#242836] rounded-[24px] p-7 flex flex-col justify-between transition-all">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111319] border border-[#1C1E26] text-zinc-400 text-[11px] font-medium font-['Poppins',sans-serif] w-fit">
                      <span>Dla marek i firm</span>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-white font-['Poppins',sans-serif]">Pakiet Brand</h3>
                      <p className="text-xs text-zinc-400 mt-1 font-['Poppins',sans-serif] leading-relaxed min-h-[36px]">
                        Dla marek, które chcą mocniej rozwijać sprzedaż.
                      </p>
                    </div>

                    <div className="py-2.5 border-y border-[#17181F] flex items-baseline justify-between min-h-[52px]">
                      <div>
                        <span className="text-2xl font-bold text-white font-['Poppins',sans-serif]">
                          {billingInterval === "miesiac" ? "59.99 PLN" : "29.99 PLN"}
                        </span>
                        <span className="text-xs text-zinc-400 font-['Poppins',sans-serif] ml-1">
                          / miesięcznie
                        </span>
                      </div>
                      {billingInterval === "rok" && (
                        <span className="text-[11px] font-medium text-[#D0FF00] font-['Poppins',sans-serif]">
                          -50% taniej
                        </span>
                      )}
                    </div>

                    <ul className="space-y-2.5 text-xs text-zinc-300 font-['Poppins',sans-serif]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>wszystko z Creator</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>3 konta zespołowe</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>automatyczne kampanie e-mail</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>0,5% prowizji od sprzedaży</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>priorytetowe wsparcie</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-[#D0FF00] shrink-0" />
                        <span>zaawansowane statystyki sprzedaży</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => handleBuyPackage("Brand")}
                    className="mt-7 w-full px-[24px] py-[12px] bg-[#141722] hover:bg-[#1A1F2C] text-white text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#22283A] transition-colors cursor-pointer flex items-center justify-center text-center whitespace-nowrap"
                  >
                    Kup Pakiet Brand
                  </button>
                </div>

              </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK 3: ZAMÓWIENIA */}
        {/* ========================================================================= */}
        {activeTab === "zamowienia" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Wszystkie Zamówienia</h2>
              <p className="text-xs text-zinc-400">Historia zamówień ze Stripe, BLIK i szybkich przelewów.</p>
            </div>

            <div className="bg-[#121620] border border-[#202738] rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#181D2A] text-zinc-400 font-bold border-b border-[#202738] uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-semibold">ID Zamówienia</th>
                    <th className="p-4 font-semibold">Klient (E-mail)</th>
                    <th className="p-4 font-semibold">Produkt</th>
                    <th className="p-4 font-semibold">Kwota</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B212F] text-zinc-300">
                  {storeOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#181D2A]">
                      <td className="p-4 font-mono font-bold text-zinc-400">{ord.id.slice(0, 10)}</td>
                      <td className="p-4 font-bold text-white">{ord.customerEmail || "klient@email.com"}</td>
                      <td className="p-4">{ord.productTitle || "Boxy Hoodie Black"}</td>
                      <td className="p-4 font-bold font-mono text-white">
                        {(ord.amountTotalCents / 100).toFixed(2)} PLN
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#FF5A28]/15 text-[#FF5A28] border border-[#FF5A28]/30">
                          Opłacone
                        </span>
                      </td>
                      <td className="p-4 text-zinc-400">{new Date(ord.createdAt).toLocaleDateString("pl-PL")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK 4: PAKIETY I USŁUGI */}
        {/* ========================================================================= */}
        {activeTab === "pakiety" && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h2 className="text-lg font-bold text-white">Pakiety Platformy i Ważność Sklepu</h2>
              <p className="text-xs text-zinc-400">Wybierz odpowiedni pakiet dla swojej marki lub przedłuż aktywny plan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pakiet Start */}
              <div className="bg-[#121620] border border-[#202738] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl">
                <div>
                  <span className="px-2.5 py-0.5 bg-[#1A1F2C] text-zinc-300 rounded-full text-[10px] font-bold uppercase border border-[#273245]">14 Dni Gratis</span>
                  <h3 className="text-lg font-bold text-white mt-3">Pakiet Start</h3>
                  <p className="text-xs text-zinc-400 mt-1">Darmowy test konfiguratora sklepu.</p>
                  <div className="text-2xl font-bold text-white font-mono mt-4">0 PLN <span className="text-xs font-normal text-zinc-400">/ 14 dni</span></div>
                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                    <li>✓ Subdomena .iskral.pl</li>
                    <li>✓ Podstawowy kreator sklepu</li>
                    <li>✓ Do 3 produktów</li>
                  </ul>
                </div>
                <button
                  onClick={() => buyPlan && buyPlan("Start", "miesiac")}
                  className="w-full py-2.5 bg-[#1A1F2C] hover:bg-[#252D3D] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border border-[#273245]"
                >
                  Aktywuj 14 Dni Gratis
                </button>
              </div>

              {/* Pakiet Creator */}
              <div className="bg-[#121620] border-2 border-[#FF5A28] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-[0_0_25px_rgba(255,90,40,0.2)] relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#FF5A28] text-white text-[9px] font-bold px-3 py-0.5 rounded-bl-lg">
                  POPULARNY
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-[#FF5A28]/20 text-[#FF5A28] border border-[#FF5A28]/40 rounded-full text-[10px] font-bold uppercase">Polecany</span>
                  <h3 className="text-lg font-bold text-white mt-3">Pakiet Creator</h3>
                  <p className="text-xs text-zinc-400 mt-1">Dla rosnących marek i twórców.</p>
                  <div className="text-2xl font-bold text-white font-mono mt-4">49.90 PLN <span className="text-xs font-normal text-zinc-400">/ mies.</span></div>
                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                    <li>✓ Własna subdomena .iskral.pl</li>
                    <li>✓ Do 25 produktów</li>
                    <li>✓ Płatności Stripe & BLIK</li>
                    <li>✓ Statystyki i analityka</li>
                  </ul>
                </div>
                <button
                  onClick={() => buyPlan && buyPlan("Creator", "miesiac")}
                  className="w-full py-2.5 bg-[#FF5A28] hover:bg-[#FF7144] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  Kup Pakiet Creator
                </button>
              </div>

              {/* Pakiet Brand */}
              <div className="bg-[#121620] text-white border border-[#202738] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-xl">
                <div>
                  <span className="px-2.5 py-0.5 bg-[#1A1F2C] text-[#FF5A28] rounded-full text-[10px] font-bold uppercase border border-[#FF5A28]/30">Pełna Moc</span>
                  <h3 className="text-lg font-bold text-white mt-3">Pakiet Brand</h3>
                  <p className="text-xs text-zinc-400 mt-1">Dla profesjonalnych marek odzieżowych.</p>
                  <div className="text-2xl font-bold text-white font-mono mt-4">99.90 PLN <span className="text-xs font-normal text-zinc-400">/ mies.</span></div>
                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                    <li>✓ Nielimitowane produkty</li>
                    <li>✓ Własna domena .pl / .com</li>
                    <li>✓ Tryb Dropu z odliczaniem</li>
                    <li>✓ Priorytetowe wsparcie techniczne</li>
                  </ul>
                </div>
                <button
                  onClick={() => buyPlan && buyPlan("Brand", "miesiac")}
                  className="w-full py-2.5 bg-[#1A1F2C] hover:bg-[#252D3D] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer border border-[#273245]"
                >
                  Kup Pakiet Brand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK 5: KREATOR & SZABLONY */}
        {/* ========================================================================= */}
        {activeTab === "kreator" && (
          <div className="space-y-6 max-w-6xl">
            
            {/* PRZEŁĄCZNIK DARMOWE / PREMIUM - WYRÓWNANY DO LEWEJ, W STYLU NEON (#D0FF00) */}
            <div className="flex justify-start items-center">
              <div className="bg-[#0D0E12] border border-[#181A22] p-1.5 rounded-full inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemplateFilter("Darmowe")}
                  className={`px-5 py-2 rounded-full text-xs font-semibold font-['Poppins',sans-serif] transition-all cursor-pointer ${
                    templateFilter === "Darmowe"
                      ? "bg-[#D0FF00] text-black shadow-sm font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Darmowe
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter("Premium")}
                  className={`px-5 py-2 rounded-full text-xs font-semibold font-['Poppins',sans-serif] transition-all cursor-pointer flex items-center gap-2 ${
                    templateFilter === "Premium"
                      ? "bg-[#D0FF00] text-black shadow-sm font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>Premium</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                      templateFilter === "Premium"
                        ? "bg-black text-[#D0FF00]"
                        : "bg-[#D0FF00] text-black"
                    }`}
                  >
                    PRO
                  </span>
                </button>
              </div>
            </div>

            {/* LISTA POZIOMYCH KAFELKÓW SZABLONÓW */}
            <div className="space-y-4 max-w-5xl">
              {(templateFilter === "Darmowe" ? [
                {
                  id: "dark-vibe",
                  name: "Dark Vibe",
                  tier: "Pakiet Start",
                  badgeText: "W Pakiecie Start",
                  tag: "Streetwear Dark",
                  desc: "Mroczny, minimalistyczny streetwear z mocnymi kontrastami i akcentami.",
                  image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
                },
                {
                  id: "minimal-clean",
                  name: "Minimal Clean",
                  tier: "Pakiet Start",
                  badgeText: "W Pakiecie Start",
                  tag: "Aesthetic Minimal",
                  desc: "Czysty minimalizm nastawiony na ekspozycję dużych zdjęć produktów.",
                  image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
                },
                {
                  id: "street-essential",
                  name: "Street Essential",
                  tier: "Pakiet Start",
                  badgeText: "W Pakiecie Start",
                  tag: "Urban Classics",
                  desc: "Klasyczny i przejrzysty układ dla debiutujących marek odzieżowych.",
                  image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
                },
              ] : [
                {
                  id: "cyber-drop",
                  name: "Cyber Drop",
                  tier: "Pakiet Creator & Brand",
                  badgeText: "Pakiet Creator & Brand",
                  tag: "Drop & Countdown",
                  desc: "Futurystyczny szablon z zaawansowanym zegarem odliczania do dropu.",
                  image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80",
                },
                {
                  id: "oversize-club",
                  name: "Oversize Club",
                  tier: "Pakiet Creator & Brand",
                  badgeText: "Pakiet Creator & Brand",
                  tag: "Lookbook & Fit",
                  desc: "Dedykowany motyw dla marek oversize z lookbookiem i tabelą dopasowania.",
                  image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
                },
                {
                  id: "monochrome-luxury",
                  name: "Monochrome Luxury",
                  tier: "Pakiet Brand",
                  badgeText: "Pakiet Brand",
                  tag: "High Fashion",
                  desc: "Ekskluzywny design z typografią high-fashion i unikalną estetyką.",
                  image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
                },
              ]).map((tpl) => {
                const isActive = (selectedTemplateName || currentStore.template) === tpl.name;

                return (
                  <div
                    key={tpl.id}
                    className={`bg-[#0D0E12] border ${
                      isActive ? "border-2 border-[#D0FF00]/50" : "border-[#181A22] hover:border-[#242836]"
                    } rounded-[24px] p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6 transition-all`}
                  >
                    {/* LEWA STRONA: MINIATURKA ZDJĘCIA */}
                    <div className="w-full md:w-64 lg:w-72 h-44 md:h-36 rounded-2xl overflow-hidden border border-[#1C1E26] bg-[#111319] shrink-0 relative group">
                      <img
                        src={tpl.image}
                        alt={tpl.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                      <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold text-white bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 font-['Poppins',sans-serif]">
                        {tpl.tag}
                      </span>
                    </div>

                    {/* ŚRODEK: BADGE, NAZWA SZABLONU, OPIS */}
                    <div className="flex-1 min-w-0 space-y-2 text-left w-full">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111319] border border-[#1C1E26] text-zinc-400 text-[11px] font-medium font-['Poppins',sans-serif] w-fit">
                        {isActive && <Sparkles className="w-3.5 h-3.5 text-[#D0FF00]" />}
                        <span className={isActive ? "text-[#D0FF00] font-semibold" : ""}>
                          {isActive ? "Aktualny szablon" : tpl.badgeText}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-white font-['Poppins',sans-serif] tracking-tight">
                        {tpl.name}
                      </h3>

                      <p className="text-xs text-zinc-400 font-['Poppins',sans-serif] leading-relaxed max-w-xl">
                        {tpl.desc}
                      </p>
                    </div>

                    {/* PRAWA STRONA: PRZYCISKI ZOBACZ DEMO I WYBIERZ */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                      <a
                        href={liveStoreUrl || "https://demo.iskral.pl"}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto px-[24px] py-[12px] bg-[#141722] hover:bg-[#1A1F2C] text-white text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#22283A] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <span>Zobacz demo</span>
                        <ExternalLink className="w-4 h-4 text-[#D0FF00]" />
                      </a>

                      <button
                        onClick={() => handleSelectTemplate(tpl.name)}
                        className={`w-full sm:w-auto px-[24px] py-[12px] text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap ${
                          isActive
                            ? "bg-[#D0FF00]/15 text-[#D0FF00] border border-[#D0FF00]/40"
                            : "bg-[#D0FF00] hover:bg-[#bce600] text-black shadow-sm"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Wybrany</span>
                          </>
                        ) : (
                          <span>Wybierz</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK 6: TRYB DROPU */}
        {/* ========================================================================= */}
        {activeTab === "drop" && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-white">Tryb Dropu i Odliczanie</h2>
              <p className="text-xs text-zinc-400">Zablokuj sklep i wyświetl odliczanie do premiery kolekcji.</p>
            </div>

            <div className="bg-[#121620] border border-[#202738] rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between p-4 bg-[#181D2A] border border-[#242D40] rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">Włącz tryb odliczania do dropu</span>
                  <span className="text-[11px] text-zinc-400">Klienci zobaczą zegar zamiast standardowej listy produktów</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={currentStore.dropConfig?.enabled}
                  onChange={(e) => updateStoreConfig && updateStoreConfig({
                    dropConfig: {
                      ...currentStore.dropConfig,
                      enabled: e.target.checked,
                      template: currentStore.dropConfig?.template || "Cyberpunk Launch",
                      targetDate: currentStore.dropConfig?.targetDate || "2026-09-01T20:00",
                    }
                  })}
                  className="w-5 h-5 accent-[#FF5A28] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">Data i Godzina Premiery</label>
                <input
                  type="datetime-local"
                  defaultValue={currentStore.dropConfig?.targetDate || "2026-09-01T20:00"}
                  className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setMessage && setMessage({ type: "success", text: "Zapisano ustawienia trybu dropu!" })}
                  className="px-6 py-2.5 bg-[#FF5A28] hover:bg-[#FF7144] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  Zapisz Tryb Dropu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK 7: USTAWIENIA & PROFIL */}
        {/* ========================================================================= */}
        {(activeTab === "ustawienia" || activeTab === "profil") && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h2 className="text-lg font-bold text-white">Ustawienia Konta, Domeny i Wypłat</h2>
              <p className="text-xs text-zinc-400">Zarządzaj swoimi danymi, bezpieczeństwem i wypłatami środków.</p>
            </div>

            {/* Dane Profilowe */}
            <div className="bg-[#121620] border border-[#202738] rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white border-b border-[#202738] pb-2">Profil Użytkownika</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Imię i Nazwisko</label>
                  <input
                    type="text"
                    defaultValue={user?.name || "Twórca Marki"}
                    onChange={(e) => updateUserProfile && updateUserProfile({ name: e.target.value })}
                    className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">E-mail</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || "klient@iskral.pl"}
                    className="w-full bg-[#151924] border border-[#242D40] rounded-xl px-3.5 py-2 text-xs text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Własna Domena DNS */}
            <div className="bg-[#121620] border border-[#202738] rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white border-b border-[#202738] pb-2">Własna Domena</h3>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Adres Domeny (np. twojamarka.pl)</label>
                <input
                  type="text"
                  defaultValue={currentStore.customDomain || ""}
                  placeholder="twojamarka.pl"
                  className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                />
              </div>
              <div className="p-3 bg-[#181D2A] border border-[#242D40] rounded-xl text-xs text-zinc-300">
                <p className="font-bold text-white">Rekord DNS CNAME:</p>
                <p className="mt-1 font-mono text-zinc-400">Typ: <strong className="text-white">CNAME</strong> | Host: <strong className="text-white">@ / www</strong> | Wartość: <strong className="text-[#FF5A28]">cname.iskral.pl</strong></p>
              </div>
            </div>

            {/* Wypłaty IBAN */}
            <div className="bg-[#121620] border border-[#202738] rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white border-b border-[#202738] pb-2">Wypłata Środków ze Sprzedaży</h3>
              <div>
                <span className="text-xs text-zinc-400 block">Dostępne Saldo</span>
                <span className="text-2xl font-bold text-white font-mono mt-1 block">{totalRevenuePLN} PLN</span>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Numer Rachunku Bankowego (IBAN)</label>
                <input
                  type="text"
                  placeholder="PL 00 0000 0000 0000 0000 0000 0000"
                  className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF5A28]"
                />
              </div>
              <button
                onClick={() => {
                  if (requestPayoutWithIBAN) requestPayoutWithIBAN(1000, "PL000000000000000000000000");
                  if (setMessage) setMessage({ type: "success", text: "Zlecono wypłatę środków na rachunek bankowy!" });
                }}
                className="px-5 py-2.5 bg-[#FF5A28] hover:bg-[#FF7144] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Zleć Wypłatę na Konto
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* MODAL: DODAWANIE / EDYCJA PRODUKTU */}
      {/* ========================================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#121620] border border-[#202738] rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingProductId ? "Edytuj Produkt" : "Dodaj Nowy Produkt do Sklepu"}
                </h3>
                <p className="text-xs text-zinc-400">Uzupełnij nazwę, cenę, warianty i opis</p>
              </div>
              <button onClick={() => setShowProductModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Nazwa Produktu *</label>
                <input
                  type="text"
                  placeholder="np. Boxy Heavyweight Hoodie Black"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Cena (PLN) *</label>
                  <input
                    type="text"
                    placeholder="199.00"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Stan Magazynowy</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Zdjęcie Produktu (URL)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Opis Produktu</label>
                <textarea
                  rows={3}
                  placeholder="Opisz materiał, krój, rozmiarówkę..."
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF5A28] hover:bg-[#FF7144] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {editingProductId ? "Zapisz Zmiany" : "Dodaj Produkt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: KONFIGURATOR SKLEPU (CZYSTE POLA BEZ DOMYŚLNYCH PLACEHOLDERÓW) */}
      {/* ========================================================================= */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-7 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white font-['Sora',sans-serif]">
                  Konfiguracja Sklepu
                </h3>
                <span className="text-xs text-zinc-400 font-['Poppins',sans-serif]">
                  {selectedPackageForConfig?.name || "Nowy sklep"}
                </span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-8 h-8 rounded-lg bg-[#111319] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-[#1C1E26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStoreConfig} className="space-y-4 font-['Poppins',sans-serif]">
              {/* NAZWA SKLEPU */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 font-['Poppins',sans-serif]">
                  Nazwa sklepu *
                </label>
                <input
                  type="text"
                  value={configStoreName}
                  onChange={(e) => setConfigStoreName(e.target.value)}
                  placeholder="Podaj nazwę sklepu"
                  className="w-full px-3.5 py-2.5 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00] transition-colors"
                  required
                />
              </div>

              {/* SUBDOMENA SKLEPU */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 font-['Poppins',sans-serif]">
                  Subdomena platformy *
                </label>
                <div className="flex items-center bg-[#111319] border border-[#1C1E26] rounded-xl overflow-hidden focus-within:border-[#D0FF00] transition-colors">
                  <input
                    type="text"
                    value={configSubdomain}
                    onChange={(e) => setConfigSubdomain(e.target.value)}
                    placeholder="Podaj subdomenę"
                    className="flex-1 px-3.5 py-2.5 bg-transparent text-xs text-white placeholder:text-zinc-600 focus:outline-none"
                    required
                  />
                  <span className="px-3 text-xs text-zinc-500 font-mono bg-[#0D0E12] py-2.5 border-l border-[#1C1E26]">
                    .iskral.pl
                  </span>
                </div>
              </div>

              {/* LOGO SKLEPU */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5 font-['Poppins',sans-serif]">
                  Logo sklepu (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={configLogo}
                  onChange={(e) => setConfigLogo(e.target.value)}
                  placeholder="Wklej adres URL logo lub pozostaw puste"
                  className="w-full px-3.5 py-2.5 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00] transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-[24px] py-[12px] bg-[#111319] hover:bg-[#181B24] text-zinc-300 text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#1C1E26] cursor-pointer transition-colors text-center"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl cursor-pointer transition-colors shadow-sm text-center"
                >
                  Stwórz sklep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ULEPSZENIE PAKIETU (UPGRADE & DOPŁATA RÓŻNICY) */}
      {/* ========================================================================= */}
      {upgradingPackage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-7 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-['Sora',sans-serif]">
                Ulepsz pakiet
              </h3>
              <button
                onClick={() => setUpgradingPackage(null)}
                className="w-8 h-8 rounded-lg bg-[#111319] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer border border-[#1C1E26]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 font-['Poppins',sans-serif]">
              Aktualny pakiet: <strong className="text-white">{upgradingPackage.name} ({upgradingPackage.planType})</strong>. Wybierz pakiet wyższy, aby odblokować dodatkowe możliwości:
            </p>

            <div className="space-y-3 font-['Poppins',sans-serif]">
              {upgradingPackage.planType !== "Creator" && (
                <button
                  onClick={() => handleUpgradePackage("Creator")}
                  className="w-full p-4 rounded-xl bg-[#111319] hover:bg-[#181B24] border border-[#1C1E26] hover:border-[#D0FF00] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Pakiet Creator</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#D0FF00]/10 border border-[#D0FF00]/30 text-[10px] font-bold text-[#D0FF00]">
                        Dopłata: 29.99 zł
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 mt-1 block">Nielimitowane produkty • Płatność Stripe</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#D0FF00]" />
                </button>
              )}

              {upgradingPackage.planType !== "Brand" && (
                <button
                  onClick={() => handleUpgradePackage("Brand")}
                  className="w-full p-4 rounded-xl bg-[#111319] hover:bg-[#181B24] border border-[#1C1E26] hover:border-[#D0FF00] text-left transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Pakiet Brand</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#D0FF00]/10 border border-[#D0FF00]/30 text-[10px] font-bold text-[#D0FF00]">
                        {upgradingPackage.planType === "Creator" ? "Dopłata różnicy: 30.00 zł" : "Dopłata: 59.99 zł"}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 mt-1 block">Własna domena, tryb dropu i priorytet • Płatność Stripe</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#D0FF00]" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
