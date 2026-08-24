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
  ArrowLeft,
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
  Upload,
  Image as ImageIcon,
  Store,
  DollarSign,
  ShoppingCart,
  Sliders,
  Send,
  Download,
  Calendar,
  Tag,
  AlertCircle,
  FileText,
  Key,
  Palette,
  BellOff,
} from "lucide-react";
import {
  User,
  StoreConfig,
  Product,
  ServicePackage,
  PlanType,
  OrderRecord,
} from "../context/AuthContext";
import { SubscriptionTimer, SubscriptionBadge } from "./SubscriptionBadge";

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
  description?: string;
  isConfigured: boolean;
  visitsCount?: number;
  teamMembers?: Array<{ email: string; role: string; addedAt: string }>;
  ownerEmail?: string;
}

export type TabType =
  | "pulpit"
  | "produkty"
  | "kreator"
  | "profil"
  | "konfiguracja-sklepu"
  | "zarzadzaj-sklepem"
  | "sklep-edytor"
  | "sklep-produkty"
  | "sklep-zamowienia"
  | "sklep-domena"
  | "sklep-platnosci"
  | "sklep-newsletter"
  | "sklep-zespol"
  | "sklep-drop"
  | "sklep-seo"
  | "zamowienia"
  | "pakiety"
  | "drop"
  | "ustawienia";

interface AeuxDashboardProps {
  initialTab?: TabType;
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
  createStripeCheckout?: (params: any) => Promise<string | null>;
  message?: { type: "success" | "error" | "warning"; text: string } | null;
  setMessage?: (msg: any) => void;
}

export default function AeuxDashboard({
  initialTab,
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
  createStripeCheckout,
  message,
  setMessage,
}: AeuxDashboardProps) {
  // Navigation tabs with URL hash (domyślnie ZAWSZE główny Pulpit po wejściu):
  const [activeTab, setActiveTabState] = useState<TabType>(() => {
    if (initialTab) return initialTab;
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as TabType;
      const validTabs: TabType[] = [
        "pulpit",
        "produkty",
        "kreator",
        "profil",
        "konfiguracja-sklepu",
        "zarzadzaj-sklepem",
        "sklep-edytor",
        "sklep-produkty",
        "sklep-zamowienia",
        "sklep-domena",
        "sklep-platnosci",
        "sklep-newsletter",
        "sklep-zespol",
        "sklep-drop",
        "sklep-seo",
        "zamowienia",
        "pakiety",
        "drop",
        "ustawienia",
      ];
      if (hash && hash !== "pulpit" && validTabs.includes(hash)) return hash;
    }
    return initialTab || "pulpit";
  });

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      try {
        window.history.replaceState(null, "", `${window.location.pathname}#${tab}`);
      } catch {}
    }
    setIsMobileMenuOpen(false);
  };

  // Mobile navigation drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Admin status
  const isAdmin =
    user?.role === "superadmin" ||
    user?.role === "admin" ||
    (user?.email ? user.email.toLowerCase().includes("projekt@") : false);

  // UI Dropdowns & States
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("Ostatnie 30 dni");
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeMapTooltip, setActiveMapTooltip] = useState(true);

  // Product Modals & States (Czysty stan bez domyślnych danych)
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productSubTab, setProductSubTab] = useState<"list" | "add">("list");
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodComparePrice, setProdComparePrice] = useState("");
  const [prodType, setProdType] = useState<"Fizyczny" | "Cyfrowy">("Fizyczny");
  const [isClothing, setIsClothing] = useState(false);
  const [sizeStocks, setSizeStocks] = useState<Record<string, number>>({
    XS: 0,
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
  });
  const [prodStock, setProdStock] = useState("50");
  const [prodDescription, setProdDescription] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [imageInputUrl, setImageInputUrl] = useState("");
  const [digitalFile, setDigitalFile] = useState<{ name: string; size: string; url?: string } | null>(null);
  const [isScheduledLaunch, setIsScheduledLaunch] = useState(false);
  const [scheduledLaunchDate, setScheduledLaunchDate] = useState("2026-09-01T18:00");

  // Billing Interval for Packages ("miesiac" | "rok")
  const [billingInterval, setBillingInterval] = useState<"miesiac" | "rok">("miesiac");

  // Template Filter for Szablony tab ("Darmowe" | "Premium")
  const [templateFilter, setTemplateFilter] = useState<"Darmowe" | "Premium">("Darmowe");
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("Dark Vibe");
  const [demoPreviewTemplate, setDemoPreviewTemplate] = useState<{
    id: string;
    name: string;
    tag: string;
    tier: string;
    badgeText: string;
    desc: string;
    image: string;
  } | null>(null);
  const [demoViewport, setDemoViewport] = useState<"desktop" | "mobile">("desktop");

  // User Storage Key (Strictly isolated per user ID or email)
  const getUserKey = (u: User | null | undefined) => {
    if (!u) return "guest";
    return (u.id || (u.email ? u.email.toLowerCase().replace(/[^a-z0-9]/g, "_") : "guest"));
  };

  const userKey = getUserKey(user);

  // Profile Management State
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user?.avatarUrl || "");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [profilePhone, setProfilePhone] = useState(() => {
    if (typeof window !== "undefined" && user) {
      return localStorage.getItem(`iskra_profile_phone_${userKey}`) || "+48 500 123 456";
    }
    return "+48 500 123 456";
  });
  const [profileStreet, setProfileStreet] = useState(() => {
    if (typeof window !== "undefined" && user) {
      return localStorage.getItem(`iskra_profile_street_${userKey}`) || "ul. Floriańska 12/4";
    }
    return "ul. Floriańska 12/4";
  });
  const [profileZip, setProfileZip] = useState(() => {
    if (typeof window !== "undefined" && user) {
      return localStorage.getItem(`iskra_profile_zip_${userKey}`) || "31-021";
    }
    return "31-021";
  });
  const [profileCity, setProfileCity] = useState(() => {
    if (typeof window !== "undefined" && user) {
      return localStorage.getItem(`iskra_profile_city_${userKey}`) || "Kraków";
    }
    return "Kraków";
  });
  const [profileCountry, setProfileCountry] = useState(() => {
    if (typeof window !== "undefined" && user) {
      return localStorage.getItem(`iskra_profile_country_${userKey}`) || "Polska";
    }
    return "Polska";
  });
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [is2FAActive, setIs2FAActive] = useState(user?.is2FAEnabled || false);

  // Synchronize profile state when user object changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
      setProfileAvatarUrl(user.avatarUrl || "");
      setIs2FAActive(user.is2FAEnabled || false);
    }
  }, [user?.id, user?.name, user?.email, user?.avatarUrl, user?.is2FAEnabled]);

  // Notification center state (Dismissable, clear all, empty state)
  const [notificationsList, setNotificationsList] = useState<Array<{ id: string; title: string; text: string; time: string; type: "info" | "success" | "sale" }>>(() => {
    if (typeof window !== "undefined" && user) {
      const saved = localStorage.getItem(`iskra_notifications_${userKey}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [
      {
        id: "notif_1",
        title: "🟢 System IskraL",
        text: "Witaj ponownie w panelu! Twój sklep jest gotowy do konfiguracji.",
        time: "Przed chwilą",
        type: "info",
      },
      {
        id: "notif_2",
        title: "💳 Płatności online",
        text: "Płatności Stripe oraz BLIK są włączone dla Twoich klientów.",
        time: "Dziś",
        type: "success",
      },
    ];
  });

  const handleDismissNotification = (notifId: string) => {
    setNotificationsList((prev) => {
      const updated = prev.filter((n) => n.id !== notifId);
      if (typeof window !== "undefined" && user) {
        localStorage.setItem(`iskra_notifications_${userKey}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleClearAllNotifications = () => {
    setNotificationsList([]);
    if (typeof window !== "undefined" && user) {
      localStorage.setItem(`iskra_notifications_${userKey}`, JSON.stringify([]));
    }
  };

  // Helper to load user packages strictly for the current user
  const getUserPackages = (currentUser: User | null, currentStores: StoreConfig[]): UserPackage[] => {
    if (!currentUser) return [];

    const key = getUserKey(currentUser);

    // 1. Check user-scoped localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`iskra_user_packages_${key}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }

    // 2. Check currentUser.services (from AuthContext / backend)
    if (currentUser.services && currentUser.services.length > 0) {
      return currentUser.services.map((s) => ({
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

    // 3. Check currentUser's stores
    if (currentStores && currentStores.length > 0) {
      return currentStores.map((st, idx) => ({
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

    // 4. Return empty array for a brand new user who has not bought or activated any package yet
    return [];
  };

  // User Packages State (Pakiety i sklepy użytkownika)
  const [userPackages, setUserPackages] = useState<UserPackage[]>(() => getUserPackages(user, userStores));

  // Package renaming
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editingPackageName, setEditingPackageName] = useState("");

  // Store Configurator State
  const [selectedPackageForConfig, setSelectedPackageForConfig] = useState<UserPackage | null>(null);
  const [configStoreName, setConfigStoreName] = useState("");
  const [configSubdomain, setConfigSubdomain] = useState("");
  const [configLogo, setConfigLogo] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);

  // Active Store Management View state (domyślnie null na wejściu do panelu - użytkownik sam wybiera sklep z listy)
  const [activeStorePackage, setActiveStorePackage] = useState<UserPackage | null>(null);

  // Upgrade Modal State
  const [upgradingPackage, setUpgradingPackage] = useState<UserPackage | null>(null);

  // Active Store / Subdomain logic
  const configuredPackage = activeStorePackage || userPackages.find((p) => p.isConfigured && p.subdomain);
  const hasActiveStore = Boolean(configuredPackage);
  const activeSubdomain = configuredPackage?.subdomain || "";
  const liveStoreUrl = `https://${activeSubdomain}.iskral.pl`;

  const isStoreMode =
    activeTab === "zarzadzaj-sklepem" ||
    activeTab.startsWith("sklep-") ||
    activeTab === "zamowienia" ||
    activeTab === "drop" ||
    activeTab === "ustawienia";

  const currentStore: StoreConfig = activeStore || (userStores.length > 0 ? userStores[0] : {
    id: configuredPackage?.id || "empty_store",
    name: configuredPackage?.storeName || configuredPackage?.name || "Mój Sklep",
    subdomain: configuredPackage?.subdomain || "",
    customDomain: "",
    template: "Dark Vibe",
    accentColor: "#D0FF00",
    announcement: configuredPackage?.description || "",
    planType: (configuredPackage?.planType as any) || user?.plan || "Brak",
    planStatus: "active",
    balanceCents: 0,
    visitsCount: configuredPackage?.visitsCount || 0,
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

  const [localProducts, setLocalProducts] = useState<Product[]>(() => {
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      const saved = localStorage.getItem(`iskra_products_${key}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    if (currentStore.products && currentStore.products.length > 0) {
      return currentStore.products;
    }
    return [];
  });

  const saveProductsList = (newProds: Product[]) => {
    setLocalProducts(newProds);
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_products_${key}`, JSON.stringify(newProds));
    }

    if (updateStoreConfig) {
      updateStoreConfig({ products: newProds });
    }

    const stSubdomain = activeStorePackage?.subdomain || currentStore.subdomain;
    const stId = activeStorePackage?.id || currentStore.id;
    const stName = activeStorePackage?.storeName || activeStorePackage?.name || currentStore.name;

    if (stSubdomain) {
      fetch("/api/stores/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: {
            id: stId,
            subdomain: stSubdomain,
            name: stName,
            products: newProds,
          },
          owner_id: user?.id,
        }),
      }).catch(console.warn);

      fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            ...user,
            stores: [{
              ...currentStore,
              id: stId,
              subdomain: stSubdomain,
              name: stName,
              products: newProds,
            }],
          },
        }),
      }).catch(console.warn);
    }
  };

  const [localOrders, setLocalOrders] = useState<OrderRecord[]>(() => {
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      const saved = localStorage.getItem(`iskra_orders_${key}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    if (currentStore.orders && currentStore.orders.length > 0) {
      return currentStore.orders;
    }
    return [];
  });

  const saveOrdersList = (newOrders: OrderRecord[]) => {
    setLocalOrders(newOrders);
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_orders_${key}`, JSON.stringify(newOrders));
    }
  };

  const [orderFilter, setOrderFilter] = useState<"all" | "unshipped" | "paid" | "shipped" | "completed">("all");
  const [selectedOrderModal, setSelectedOrderModal] = useState<OrderRecord | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;

    const queryParams = new URLSearchParams();
    if (user.id) queryParams.set("userId", user.id);
    if (user.email) queryParams.set("userEmail", user.email);

    const stId = activeStorePackage?.id || (currentStore.id !== "empty_store" ? currentStore.id : "");
    const stSub = activeStorePackage?.subdomain || currentStore.subdomain || "";
    if (stId) queryParams.set("storeId", stId);
    if (stSub) queryParams.set("subdomain", stSub);

    if (userStores && userStores.length > 0) {
      const allStoreIds = userStores.map((s) => s.id).filter((id) => id && id !== "empty_store");
      if (allStoreIds.length > 0) queryParams.set("storeIds", allStoreIds.join(","));
    }

    const targetLookupStoreId = String(stId || stSub || user?.id || "wszystkie");

    fetch(`/api/stores/order?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        const orderList = Array.isArray(data?.orders) ? data.orders : [];
        console.log('=== DASHBOARD DANE ===');
        console.log('SZUKAM ZAMÓWIEŃ DLA STORE_ID:', targetLookupStoreId);
        console.log('ZNALEZIONE ZAMÓWIENIA W BAZIE:', orderList);

        const mapped: OrderRecord[] = orderList.map((o: any) => {
          const shipDet = o.shippingDetails || o.shipping_details || {};
          return {
            id: o.id || `ord_${Date.now()}`,
            tenantId: o.store_id || o.storeId || o.tenant_id || stId,
            storeId: o.store_id || o.storeId || stId,
            stripeSessionId: o.stripe_session_id || o.stripeSessionId || "",
            amountTotalCents: o.amount_total_cents || o.amountTotalCents || Math.round((Number(o.total_amount) || 0) * 100),
            totalAmount: o.total_amount || o.totalAmount || ((o.amount_total_cents || 0) / 100).toFixed(2),
            status: o.status || "Opłacone",
            customerEmail: o.customer_email || o.customerEmail || shipDet.email || "klient@iskral.pl",
            customerName: o.customer_name || o.customerName || shipDet.name || "",
            customerPhone: o.customer_phone || o.customerPhone || shipDet.phone || "",
            shippingType: o.shipping_type || o.shippingType || shipDet.method || (o.inpost_box || o.paczkomatCode ? "paczkomat" : o.shipping_address || o.shippingAddress ? "courier" : "digital"),
            shippingAddress: o.shipping_address || o.shippingAddress || shipDet.address || "",
            paczkomatCode: o.inpost_box || o.paczkomatCode || shipDet.paczkomat || "",
            shippingDetails: shipDet,
            items: Array.isArray(o.items) ? o.items : [],
            productTitle: o.product_title || o.productTitle || (Array.isArray(o.items) && o.items[0]?.title) || "Zamówienie w sklepie",
            createdAt: o.created_at || o.createdAt || new Date().toISOString(),
          };
        });

        setLocalOrders((prevOrders) => {
          const existingMap = new Map<string, OrderRecord>();
          (currentStore.orders || []).forEach((o) => o && o.id && existingMap.set(o.id, o));
          prevOrders.forEach((o) => o && o.id && existingMap.set(o.id, o));
          mapped.forEach((o) => o && o.id && existingMap.set(o.id, o));
          const combined = Array.from(existingMap.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          if (typeof window !== "undefined" && user) {
            const key = getUserKey(user);
            localStorage.setItem(`iskra_orders_${key}`, JSON.stringify(combined));
          }
          return combined;
        });
      })
      .catch((err) => console.warn("Błąd pobierania zamówień sklepu:", err));
  }, [activeStorePackage?.id, activeStorePackage?.subdomain, currentStore.id, currentStore.subdomain, currentStore.orders, activeTab, user?.id, user?.email, userStores]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderStatus(true);
    try {
      const targetOrder = localOrders.find((o) => o.id === orderId);
      const storeName = activeStorePackage?.storeName || activeStorePackage?.name || currentStore.name || "IskraL Sklep";

      const res = await fetch("/api/stores/order/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          storeId: activeStorePackage?.id || currentStore.id,
          storeName,
          customerEmail: targetOrder?.customerEmail,
          productTitle: targetOrder?.productTitle,
          items: targetOrder?.items,
          shippingDetails: targetOrder?.shippingDetails,
          shippingType: targetOrder?.shippingType,
          paczkomatCode: targetOrder?.paczkomatCode,
          shippingAddress: targetOrder?.shippingAddress,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updated = localOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
        saveOrdersList(updated);
        if (selectedOrderModal && selectedOrderModal.id === orderId) {
          setSelectedOrderModal({ ...selectedOrderModal, status: newStatus });
        }
        if (setMessage) {
          setMessage({
            type: "success",
            text: newStatus === "shipped" || newStatus === "Wysłane"
              ? `📦 Zmieniono status na 'Wysłane' i wysłano e-mail z powiadomieniem do klienta (${targetOrder?.customerEmail})!`
              : `Zaktualizowano status zamówienia na: ${newStatus}`,
          });
        }
      } else {
        if (setMessage) setMessage({ type: "error", text: data.error || "Nie udało się zaktualizować statusu." });
      }
    } catch (err: any) {
      console.error("Error updating order status:", err);
      if (setMessage) setMessage({ type: "error", text: "Błąd podczas aktualizacji statusu zamówienia." });
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  const [editorStoreName, setEditorStoreName] = useState(configuredPackage?.storeName || configuredPackage?.name || currentStore.name || "");
  const [editorSubdomain, setEditorSubdomain] = useState(configuredPackage?.subdomain || activeSubdomain || currentStore.subdomain || "");
  const [editorDescription, setEditorDescription] = useState(configuredPackage?.description || currentStore.announcement || currentStore.description || "");
  const [editorLogo, setEditorLogo] = useState(configuredPackage?.logoUrl || currentStore.logoUrl || "");
  const [editorTemplate, setEditorTemplate] = useState(currentStore.template || "Dark Vibe");
  const [editorAccentColor, setEditorAccentColor] = useState(currentStore.accentColor || "#D0FF00");
  const [editorButtonRadius, setEditorButtonRadius] = useState<"rounded-xl" | "rounded-full" | "rounded-none">("rounded-xl");
  const [editorSocials, setEditorSocials] = useState({
    instagram: "dropwear.pl",
    showInstagramInNavbar: true,
    tiktok: "dropwear",
    showTiktokInNavbar: true,
    youtube: "",
    showYoutubeInNavbar: false,
    x: "dropwear_eu",
    showXInNavbar: false,
  });

  // Dynamiczne ładowanie danych sklepu do formularza po odświeżeniu (brak resetowania do domyślnych placeholderów)
  useEffect(() => {
    const target = activeStorePackage || configuredPackage;
    if (target && target.isConfigured) {
      if (target.storeName || target.name) setEditorStoreName(target.storeName || target.name);
      if (target.subdomain) setEditorSubdomain(target.subdomain);
      if (target.description) setEditorDescription(target.description);
      if (target.logoUrl !== undefined) setEditorLogo(target.logoUrl || "");
    } else if (currentStore && currentStore.id && currentStore.id !== "empty_store") {
      if (currentStore.name) setEditorStoreName(currentStore.name);
      if (currentStore.subdomain) setEditorSubdomain(currentStore.subdomain);
      if (currentStore.announcement || currentStore.description) setEditorDescription(currentStore.announcement || currentStore.description || "");
      if (currentStore.logoUrl !== undefined) setEditorLogo(currentStore.logoUrl || "");
      if (currentStore.accentColor) setEditorAccentColor(currentStore.accentColor);
    }
  }, [activeStorePackage?.id, configuredPackage?.id, currentStore.id]);

  const [dropEnabled, setDropEnabled] = useState(currentStore.dropConfig?.enabled || false);
  const [dropTargetDate, setDropTargetDate] = useState(currentStore.dropConfig?.targetDate || "2026-09-01T20:00");
  const [dropTemplate, setDropTemplate] = useState<"Cyberpunk Launch" | "Minimalist Timer" | "Hypebeast Countdown">(
    (currentStore.dropConfig?.template as any) || "Cyberpunk Launch"
  );
  const [dropVipPassword, setDropVipPassword] = useState("VIP2026");
  const [dropAnnouncement, setDropAnnouncement] = useState("Limitowana kolekcja ubrań 'CYBERFALL'. Bądź pierwszy.");

  const [seoTitle, setSeoTitle] = useState(currentStore.seoConfig?.metaTitle || `${configuredPackage?.storeName || "Mój Sklep"} • Oficjalny sklep internetowy`);
  const [seoDescription, setSeoDescription] = useState(currentStore.seoConfig?.metaDescription || "Kupuj unikalne ubrania i produkty online. Szybka wysyłka, najwyższa jakość.");
  const [seoKeywords, setSeoKeywords] = useState(currentStore.seoConfig?.keywords || "streetwear, moda, sklep online, ubrania, hoodie, dropwear");
  const [seoFavicon, setSeoFavicon] = useState(configuredPackage?.logoUrl || "");

  const [teamInviteEmail, setTeamInviteEmail] = useState("");
  const [teamInviteRole, setTeamInviteRole] = useState<"Edytor" | "Obsługa zamówień" | "Administrator">("Edytor");
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; email: string; role: string; addedAt: string }>>(() => {
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      const saved = localStorage.getItem(`iskra_team_${key}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return [
      { id: "tm_1", email: user?.email || "wlasciciel@iskral.pl", role: "Właściciel (Pełny dostęp)", addedAt: "Główny właściciel" }
    ];
  });

  const [subscribers, setSubscribers] = useState<Array<{ id: string; email: string; subscribedAt: string }>>([
    { id: "sub_1", email: "kacper.nowak@gmail.com", subscribedAt: "2026-08-20" },
    { id: "sub_2", email: "oliwia.hype@wp.pl", subscribedAt: "2026-08-21" },
    { id: "sub_3", email: "designer_pro@proton.me", subscribedAt: "2026-08-22" },
    { id: "sub_4", email: "hypebeast_pl@onet.pl", subscribedAt: "2026-08-22" },
  ]);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [campaignHistory, setCampaignHistory] = useState<Array<{ id: string; subject: string; sentDate: string; count: number }>>([
    { id: "cmp_1", subject: "🎉 Oficjalny start nowego sklepu na IskraL!", sentDate: "2026-08-21", count: 4 }
  ]);

  const [customDomainInput, setCustomDomainInput] = useState(currentStore.customDomain || "");
  const [domainStatus, setDomainStatus] = useState<"none" | "checking" | "verified">(currentStore.domainVerified ? "verified" : "none");

  const currentActiveStoreId = String(activeStorePackage?.id || activeStore?.id || currentStore?.id || "");
  const currentActiveSubdomain = String(activeStorePackage?.subdomain || activeStore?.subdomain || currentStore?.subdomain || "").toLowerCase();

  const storeOrders = (Array.isArray(localOrders) ? localOrders : []).filter((o) => {
    if (!currentActiveStoreId || currentActiveStoreId === "empty_store" || currentActiveStoreId === "wszystkie") return true;
    const oStoreId = String(o.storeId || o.tenantId || (o as any).store_id || "");
    return (
      oStoreId === currentActiveStoreId ||
      (currentActiveSubdomain && oStoreId.toLowerCase() === currentActiveSubdomain) ||
      (currentActiveSubdomain === "metek" && (oStoreId === "store_1787445507360_d62r" || oStoreId === "c8507661-710f-4fa9-9150-8e4100d0b74e")) ||
      (currentActiveStoreId.includes("1787445507360") && (oStoreId === "c8507661-710f-4fa9-9150-8e4100d0b74e" || oStoreId === "metek")) ||
      (currentActiveStoreId.includes("c8507661") && (oStoreId === "store_1787445507360_d62r" || oStoreId === "metek"))
    );
  });
  // Zliczaj każdy status zamówienia, który przeszedł płatność:
  const validOrders = storeOrders.filter((o) => {
    const s = (o.status || "").trim().toLowerCase();
    return (
      ["opłacone", "niewysłane", "wysłane", "zrealizowane", "paid", "shipped", "completed", "unshipped"].includes(s) ||
      (!["cancelled", "refunded", "failed", "anulowane", "zwrócone"].includes(s))
    );
  });
  const storeRevenue = validOrders.reduce((sum, order) => {
    const cents =
      typeof order.amountTotalCents === "number" && order.amountTotalCents > 0
        ? order.amountTotalCents
        : Math.round((parseFloat(String(order.totalAmount || (order as any).total || 0).replace(",", ".")) || 0) * 100);
    return sum + (isNaN(cents) ? 0 : cents);
  }, 0) / 100;
  const totalRevenuePLN = storeRevenue.toFixed(2);
  const totalOrdersCount = validOrders.length;

  // Sync state whenever the active user changes (Login/Logout/Switch)
  useEffect(() => {
    if (!user) {
      setUserPackages([]);
      setActiveStorePackage(null);
      setLocalProducts([]);
      setLocalOrders([]);
      return;
    }

    const key = getUserKey(user);
    const pkgs = getUserPackages(user, userStores);
    setUserPackages(pkgs);

    if (typeof window !== "undefined") {
      const savedProds = localStorage.getItem(`iskra_products_${key}`);
      if (savedProds) {
        try {
          const parsed = JSON.parse(savedProds);
          if (Array.isArray(parsed)) setLocalProducts(parsed);
        } catch {}
      } else if (currentStore.products && currentStore.products.length > 0) {
        setLocalProducts(currentStore.products);
      } else {
        setLocalProducts([]);
      }

      const savedOrders = localStorage.getItem(`iskra_orders_${key}`);
      if (savedOrders) {
        try {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) setLocalOrders(parsed);
        } catch {}
      } else if (currentStore.orders && currentStore.orders.length > 0) {
        setLocalOrders(currentStore.orders);
      } else {
        setLocalOrders([]);
      }

      const savedTeam = localStorage.getItem(`iskra_team_${key}`);
      if (savedTeam) {
        try {
          const parsed = JSON.parse(savedTeam);
          if (Array.isArray(parsed) && parsed.length > 0) setTeamMembers(parsed);
        } catch {}
      }
    }

    // Cross-device background fetch from Supabase backend API
    const syncRemoteUserResources = async () => {
      if (!user?.email) return;
      try {
        const res = await fetch(`/api/auth/sync-user?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const serverStores: any[] = data.stores || data.user.stores || [];
            const serverServices: any[] = data.services || data.user.services || [];

            if (serverStores.length > 0 || serverServices.length > 0) {
              const serverPkgs: UserPackage[] = [];

              // 1. Zbuduj pakiety ze sklepów zapisanych w bazie Supabase
              serverStores.forEach((st: any, idx: number) => {
                serverPkgs.push({
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
                });
              });

              // 2. Dołącz pakiety z wykupionych usług (services)
              serverServices.forEach((s: any) => {
                if (!serverPkgs.some((p) => p.id === s.id)) {
                  serverPkgs.push({
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
                  });
                }
              });

              if (serverPkgs.length > 0) {
                setUserPackages((prev) => {
                  if (JSON.stringify(prev) === JSON.stringify(serverPkgs)) return prev;
                  localStorage.setItem(`iskra_user_packages_${key}`, JSON.stringify(serverPkgs));
                  return serverPkgs;
                });
              }

              // Synchronizuj produkty aktywnego sklepu z bazy danych
              const activeSt = serverStores[0];
              if (activeSt && Array.isArray(activeSt.products) && activeSt.products.length > 0) {
                setLocalProducts((prev) => {
                  if (JSON.stringify(prev) === JSON.stringify(activeSt.products)) return prev;
                  localStorage.setItem(`iskra_products_${key}`, JSON.stringify(activeSt.products));
                  return activeSt.products;
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn("[Dashboard] Cross-device sync error:", e);
      }
    };

    syncRemoteUserResources();
  }, [user?.id, user?.email, user?.services?.length, userStores.length]);

  // Handle return from Stripe Checkout (?checkout=success or ?checkout=cancelled)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");

    if (checkoutStatus === "success") {
      const plan = (params.get("plan") as any) || "Creator";
      const billing = (params.get("billing") as any) || "miesiac";
      const action = params.get("action") || "buy";
      const pkgId = params.get("package_id");

      if (action === "buy") {
        const days = billing === "rok" ? 365 : 30;
        const priceText =
          billing === "rok"
            ? plan === "Creator"
              ? "14.99 PLN / msc"
              : "29.99 PLN / msc"
            : plan === "Creator"
            ? "29.99 PLN / msc"
            : "59.99 PLN / msc";

        const newPkg: UserPackage = {
          id: `pkg_${Date.now()}`,
          number: Math.floor(1000 + Math.random() * 9000),
          name: `Pakiet ${plan}`,
          planType: plan,
          price: priceText,
          expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
          isConfigured: false,
        };

        setUserPackages((prev) => {
          const updated = [newPkg, ...prev];
          if (user) {
            const key = getUserKey(user);
            localStorage.setItem(`iskra_user_packages_${key}`, JSON.stringify(updated));
          }
          return updated;
        });

        if (buyPlan) {
          buyPlan(plan, billing);
        }
      } else if (action === "extend" && pkgId) {
        setUserPackages((prev) => {
          const updated = prev.map((p) => {
            if (p.id === pkgId) {
              const currentExp = new Date(p.expiresAt || Date.now()).getTime();
              const base = currentExp > Date.now() ? currentExp : Date.now();
              return { ...p, expiresAt: new Date(base + 30 * 86400000).toISOString() };
            }
            return p;
          });
          if (user) {
            const key = getUserKey(user);
            localStorage.setItem(`iskra_user_packages_${key}`, JSON.stringify(updated));
          }
          return updated;
        });
      }

      if (setMessage) {
        setMessage({
          type: "success",
          text: "🎉 Płatność Stripe zakończona sukcesem! Twój pakiet został pomyślnie aktywowany.",
        });
      }

      // Clean query parameter from address bar
      try {
        window.history.replaceState(null, "", window.location.pathname + (window.location.hash || "#pulpit"));
      } catch {}
    } else if (checkoutStatus === "cancelled") {
      if (setMessage) {
        setMessage({
          type: "warning",
          text: "Płatność Stripe została anulowana. Możesz powrócić do zakupu pakietu w dowolnej chwili.",
        });
      }
      try {
        window.history.replaceState(null, "", window.location.pathname + (window.location.hash || "#pulpit"));
      } catch {}
    }
  }, [user?.email, user?.id]);

  // Hydration protection flag
  const [isMounted, setIsMounted] = useState(false);
  // Dynamiczny licznik czasu rzeczywistego (odświeżanie po stronie klienta)
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(Date.now());
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingTimeInfo = (expiresAt?: string) => {
    if (!isMounted) {
      return { text: "Sprawdzanie ważności...", isExpired: false, days: 0, hours: 0, minutes: 0 };
    }
    if (!expiresAt) return { text: "Wygasł", isExpired: true, days: 0, hours: 0, minutes: 0 };
    const expTime = new Date(expiresAt).getTime();
    if (isNaN(expTime)) return { text: "Wygasł", isExpired: true, days: 0, hours: 0, minutes: 0 };
    const now = currentTime || Date.now();
    const diff = expTime - now;
    if (diff <= 0) return { text: "Wygasł", isExpired: true, days: 0, hours: 0, minutes: 0 };

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    if (days >= 1) {
      return {
        text: `Pozostało: ${days} ${days === 1 ? "dzień" : "dni"}, ${hours} godz.`,
        isExpired: false,
        days,
        hours,
        minutes,
      };
    } else {
      return {
        text: `Pozostało: ${hours} godz. ${minutes} min.`,
        isExpired: false,
        days,
        hours,
        minutes,
      };
    }
  };

  const getRemainingTime = (expiresAt?: string) => {
    return getRemainingTimeInfo(expiresAt).text;
  };

  const handleStartRename = (pkg: UserPackage) => {
    setEditingPackageId(pkg.id);
    setEditingPackageName(pkg.name);
  };

  const handleSaveRename = (pkgId: string) => {
    if (!editingPackageName.trim()) return;
    const updated = userPackages.map((p) => (p.id === pkgId ? { ...p, name: editingPackageName.trim(), storeName: editingPackageName.trim() } : p));
    setUserPackages(updated);
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_user_packages_${key}`, JSON.stringify(updated));
    }
    setEditingPackageId(null);
    if (setMessage) setMessage({ type: "success", text: "Zmieniono nazwę pakietu." });
  };

  const handleExtendPackage = async (pkgId: string) => {
    const pkg = userPackages.find((p) => p.id === pkgId);
    if (!pkg) return;

    if (pkg.planType === "Start") {
      setUpgradingPackage(pkg);
      return;
    }

    try {
      if (setMessage) setMessage({ type: "success", text: "Inicjalizacja przedłużenia pakietu przez Stripe..." });
      const priceCents = pkg.planType === "Creator" ? 2999 : 5999;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Przedłużenie Pakietu ${pkg.planType} (+30 dni)`,
          priceCents,
          customerEmail: user?.email || "",
          isPlan: true,
          planType: pkg.planType,
          packageId: pkg.id,
          action: "extend",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.warn("Extend package checkout error, falling back locally:", err);
    }

    // Local fallback
    const updated = userPackages.map((p) => {
      if (p.id === pkgId) {
        const currentExp = new Date(p.expiresAt || Date.now()).getTime();
        const base = currentExp > Date.now() ? currentExp : Date.now();
        const newExp = new Date(base + 30 * 86400000).toISOString();
        return { ...p, expiresAt: newExp };
      }
      return p;
    });
    setUserPackages(updated);
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_user_packages_${key}`, JSON.stringify(updated));
    }
    if (setMessage) setMessage({ type: "success", text: "Przedłużono ważność pakietu o 30 dni!" });
  };

  const handleOpenConfigurator = (pkg: UserPackage) => {
    setSelectedPackageForConfig(pkg);
    setConfigStoreName(pkg.storeName || pkg.name || "");
    setConfigSubdomain(pkg.subdomain || "");
    setConfigLogo(pkg.logoUrl || "");
    setConfigDescription(pkg.description || "");
    setActiveTab("konfiguracja-sklepu");
  };

  const handleBuyPackage = async (planType: "Start" | "Creator" | "Brand", cycle?: "miesiac" | "rok") => {
    const currentCycle = cycle || billingInterval;

    if (planType === "Start") {
      if (buyPlan) {
        await buyPlan(planType, currentCycle);
      }
      const days = 14;
      const priceText = "0 PLN / 14 dni";
      const newPkg: UserPackage = {
        id: `pkg_${Date.now()}`,
        number: Math.floor(1000 + Math.random() * 9000),
        name: `Pakiet ${planType}`,
        planType,
        price: priceText,
        expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
        isConfigured: false,
      };
      const updated = [newPkg, ...userPackages];
      setUserPackages(updated);
      if (typeof window !== "undefined" && user) {
        const key = getUserKey(user);
        localStorage.setItem(`iskra_user_packages_${key}`, JSON.stringify(updated));
      }
      if (setMessage) setMessage({ type: "success", text: `🎉 Aktywowano Pakiet Start (14 dni za darmo)!` });
      setActiveTab("pulpit");
      return;
    }

    // Płatne pakiety (Creator, Brand) -> Przekierowanie do Stripe Checkout
    try {
      const priceCents =
        planType === "Creator"
          ? currentCycle === "rok"
            ? 17988
            : 2999
          : currentCycle === "rok"
          ? 35988
          : 5999;

      if (setMessage) setMessage({ type: "success", text: "Inicjalizacja bezpiecznej płatności Stripe..." });

      if (createStripeCheckout) {
        const checkoutUrl = await createStripeCheckout({
          title: `Pakiet ${planType} (${currentCycle === "rok" ? "Roczny -50%" : "Miesięczny"})`,
          priceCents,
          planType,
          customerEmail: user?.email || "",
        });
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Pakiet ${planType} (${currentCycle === "rok" ? "Roczny -50%" : "Miesięczny"})`,
          priceCents,
          customerEmail: user?.email || "",
          isPlan: true,
          planType,
          billingCycle: currentCycle,
          action: "buy",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.error("[Stripe Checkout Error]:", err);
      if (setMessage) setMessage({ type: "error", text: "Błąd połączenia ze Stripe. Spróbuj ponownie." });
    }
  };

  const handleUpgradePackage = async (targetPlan: "Creator" | "Brand") => {
    if (!upgradingPackage) return;

    try {
      if (setMessage) setMessage({ type: "success", text: `Inicjalizacja ulepszenia do Pakietu ${targetPlan} przez Stripe...` });
      const priceCents = targetPlan === "Creator" ? 2999 : 5999;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Ulepszenie do Pakietu ${targetPlan}`,
          priceCents,
          customerEmail: user?.email || "",
          isPlan: true,
          planType: targetPlan,
          packageId: upgradingPackage.id,
          action: "upgrade",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.warn("Upgrade package checkout error, falling back locally:", err);
    }

    // Local fallback
    const updated = userPackages.map((p) => {
      if (p.id === upgradingPackage.id) {
        return {
          ...p,
          planType: targetPlan,
          price: targetPlan === "Creator" ? "29.99 PLN / msc" : "59.99 PLN / msc",
        };
      }
      return p;
    });
    setUserPackages(updated);
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_user_packages_${key}`, JSON.stringify(updated));
    }
    setUpgradingPackage(null);
    if (setMessage) setMessage({ type: "success", text: `🎉 Pomyślnie ulepszono pakiet do wersji ${targetPlan}!` });
  };

  const handleSelectTemplate = (templateName: string) => {
    setSelectedTemplateName(templateName);
    setEditorTemplate(templateName);
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

  const handleOpenStorePanel = (pkg: UserPackage) => {
    setActiveStorePackage(pkg);
    setEditorStoreName(pkg.storeName || pkg.name);
    setEditorSubdomain(pkg.subdomain || "iskral");
    setEditorDescription(pkg.description || "Oficjalny sklep streetwear.");
    setEditorLogo(pkg.logoUrl || "");
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_active_store_${key}`, JSON.stringify(pkg));
    }
    setActiveTab("zarzadzaj-sklepem");
  };

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      if (setMessage) setMessage({ type: "error", text: "Proszę wybrać plik graficzny (PNG, JPG, SVG, WebP)!" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setConfigLogo(dataUrl);
      setEditorLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleDigitalFileUpload = (file: File) => {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeKB = (file.size / 1024).toFixed(0);
    const formattedSize = file.size >= 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

    setDigitalFile({
      name: file.name,
      size: formattedSize,
    });
    if (setMessage) {
      setMessage({ type: "success", text: `Załadowano plik cyfrowy: ${file.name} (${formattedSize})` });
    }
  };

  const handleProductImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      if (setMessage) setMessage({ type: "error", text: "Proszę wybrać plik graficzny (PNG, JPG, WebP)!" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProdImages((prev) => [...prev, dataUrl]);
      if (!prodImage) setProdImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    if (!imageInputUrl.trim()) return;
    const clean = imageInputUrl.trim();
    if (!prodImages.includes(clean)) {
      setProdImages((prev) => [...prev, clean]);
      if (!prodImage) setProdImage(clean);
    }
    setImageInputUrl("");
  };

  const handleSetMainImage = (index: number) => {
    if (index <= 0 || index >= prodImages.length) return;
    setProdImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      const updated = [selected, ...rest];
      setProdImage(selected);
      return updated;
    });
    if (setMessage) setMessage({ type: "success", text: "Ustawiono nowe zdjęcie główne produktu!" });
  };

  const handleRemoveImage = (index: number) => {
    setProdImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0) setProdImage(updated[0]);
      else setProdImage("");
      return updated;
    });
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

    let updatedPkg: UserPackage | null = null;
    let nextPackages = userPackages;

    if (selectedPackageForConfig) {
      nextPackages = userPackages.map((p) => {
        if (p.id === selectedPackageForConfig.id) {
          const up: UserPackage = {
            ...p,
            name: configStoreName.trim(),
            storeName: configStoreName.trim(),
            subdomain: cleanSub,
            logoUrl: configLogo.trim(),
            description: configDescription.trim(),
            isConfigured: true,
          };
          updatedPkg = up;
          return up;
        }
        return p;
      });
      setUserPackages(nextPackages);
      if (typeof window !== "undefined" && user) {
        const key = getUserKey(user);
        localStorage.setItem(`iskra_user_packages_${key}`, JSON.stringify(nextPackages));
      }
    }

    if (createOrUpdateStoreFull) {
      createOrUpdateStoreFull({
        name: configStoreName.trim(),
        subdomain: cleanSub,
        logoUrl: configLogo.trim(),
        template: "Dark Vibe",
        accentColor: "#D0FF00",
        announcement: configDescription.trim(),
        plan: selectedPackageForConfig?.planType || "Start",
        billingCycle: "miesiac",
      });
    }

    const targetStore: UserPackage = updatedPkg || {
      id: selectedPackageForConfig?.id || "store_" + Date.now(),
      number: selectedPackageForConfig?.number || 1001,
      name: configStoreName.trim(),
      storeName: configStoreName.trim(),
      subdomain: cleanSub,
      logoUrl: configLogo.trim(),
      description: configDescription.trim(),
      planType: selectedPackageForConfig?.planType || "Start",
      price: selectedPackageForConfig?.price || "14 dni za darmo",
      expiresAt: selectedPackageForConfig?.expiresAt || new Date(Date.now() + 14 * 86400000).toISOString(),
      isConfigured: true,
    };

    setActiveStorePackage(targetStore);
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_active_store_${key}`, JSON.stringify(targetStore));
    }
    setActiveTab("zarzadzaj-sklepem");

    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Sklep "${configStoreName.trim()}" został pomyślnie skonfigurowany pod domeną ${cleanSub}.iskral.pl!`,
      });
    }
  };

  const getStoreOnlineUrl = (sub?: string) => {
    const clean = (sub || activeStorePackage?.subdomain || activeSubdomain || editorSubdomain || "iskral").toLowerCase().trim();
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const host = window.location.host;
      const protocol = window.location.protocol;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return `http://localhost:3000/${clean}`;
      }
      if (hostname.endsWith(".vercel.app")) {
        return `${protocol}//${host}/${clean}`;
      }
      if (hostname === "iskral.pl" || hostname === "www.iskral.pl") {
        return `https://${clean}.iskral.pl`;
      }
      return `/${clean}`;
    }
    return `https://${clean}.iskral.pl`;
  };

  const handleSaveStoreEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorStoreName.trim()) {
      if (setMessage) setMessage({ type: "error", text: "Podaj nazwę sklepu!" });
      return;
    }
    const cleanSub = editorSubdomain.toLowerCase().replace(/[^a-z0-9]/g, "");

    const updatedPackages = userPackages.map((p) => {
      if (p.id === activeStorePackage?.id || p.id === configuredPackage?.id) {
        return {
          ...p,
          name: editorStoreName.trim(),
          storeName: editorStoreName.trim(),
          subdomain: cleanSub,
          logoUrl: editorLogo,
          description: editorDescription,
        };
      }
      return p;
    });
    setUserPackages(updatedPackages);

    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_user_packages_${key}`, JSON.stringify(updatedPackages));
    }

    if (activeStorePackage) {
      const updated = {
        ...activeStorePackage,
        name: editorStoreName.trim(),
        storeName: editorStoreName.trim(),
        subdomain: cleanSub,
        logoUrl: editorLogo,
        description: editorDescription,
      };
      setActiveStorePackage(updated);
      if (typeof window !== "undefined" && user) {
        const key = getUserKey(user);
        localStorage.setItem(`iskra_active_store_${key}`, JSON.stringify(updated));
      }
    }

    if (updateStoreConfig) {
      updateStoreConfig({
        name: editorStoreName.trim(),
        subdomain: cleanSub,
        logoUrl: editorLogo,
        template: editorTemplate,
        accentColor: editorAccentColor,
        announcement: editorDescription,
        socials: {
          instagram: editorSocials.instagram,
          tiktok: editorSocials.tiktok,
          youtube: editorSocials.youtube,
          x: editorSocials.x,
        },
      });
    }

    // Bezpośredni zapis i synchronizacja do bazy danych Supabase
    const targetStoreId = activeStorePackage?.id || currentStore.id;
    if (cleanSub) {
      fetch("/api/stores/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: {
            id: targetStoreId,
            subdomain: cleanSub,
            name: editorStoreName.trim(),
            logoUrl: editorLogo,
            template: editorTemplate,
            accentColor: editorAccentColor,
            announcement: editorDescription,
            socials: editorSocials,
            products: localProducts,
          },
          owner_id: user?.id,
        }),
      }).catch((err) => console.warn("Błąd synchronizacji sklepu z Supabase:", err));
    }

    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Zapisano zmiany w wyglądzie i ustawieniach sklepu "${editorStoreName}"!`,
      });
    }
  };

  const handleCreateOrUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      if (setMessage) setMessage({ type: "error", text: "Podaj nazwę produktu!" });
      return;
    }

    const cleanPrice = prodPrice.replace(",", ".").replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(cleanPrice) || 10;
    const priceCents = Math.round(priceNum * 100);

    const cleanComparePrice = prodComparePrice.replace(",", ".").replace(/[^0-9.]/g, "");
    const comparePriceNum = parseFloat(cleanComparePrice) || 0;
    const comparePriceCents = comparePriceNum > 0 ? Math.round(comparePriceNum * 100) : undefined;

    const isDigital = prodType === "Cyfrowy";
    const totalStock = !isDigital && isClothing
      ? Object.values(sizeStocks).reduce((acc, v) => acc + (Number(v) || 0), 0)
      : parseInt(prodStock) || (isDigital ? 999 : 50);

    const activeVariants = !isDigital && isClothing
      ? Object.entries(sizeStocks)
          .filter(([_, stock]) => Number(stock) > 0)
          .map(([size, stock]) => `${size} (${stock} szt.)`)
      : [];

    const defaultImg = prodImages[0] || prodImage || "";
    const allImages = prodImages.length > 0 ? prodImages : (defaultImg ? [defaultImg] : []);
    const targetStoreId = activeStorePackage?.id || currentStore.id;
    const targetSubdomain = activeStorePackage?.subdomain || currentStore.subdomain;

    console.log("DODAWANIE PRODUKTU DANE:", {
      name: prodName,
      price: prodPrice,
      priceNum,
      comparePrice: prodComparePrice,
      type: prodType,
      stock: totalStock,
      description: prodDescription,
      images: allImages,
      isDigital,
      storeId: targetStoreId,
      subdomain: targetSubdomain,
    });

    if (editingProductId) {
      let updatedProductObj: any = null;
      const updated = localProducts.map((p) => {
        if (p.id === editingProductId) {
          updatedProductObj = {
            ...p,
            name: prodName,
            price: `${priceNum.toFixed(2)} zł`,
            priceCents,
            comparePrice: comparePriceNum > 0 ? `${comparePriceNum.toFixed(2)} zł` : undefined,
            comparePriceCents,
            type: prodType,
            isClothing: !isDigital && isClothing,
            stock: totalStock,
            variants: !isDigital && isClothing && activeVariants.length > 0 ? activeVariants : [],
            description: prodDescription,
            image: defaultImg,
            images: allImages,
            isDigital,
            digitalFileName: digitalFile?.name,
            digitalFileSize: digitalFile?.size,
            isDropOnly: isScheduledLaunch,
            dropTargetDate: isScheduledLaunch ? scheduledLaunchDate : undefined,
          };
          return updatedProductObj;
        }
        return p;
      });
      saveProductsList(updated);

      if (updateProduct && updatedProductObj) {
        updateProduct(updatedProductObj.id, updatedProductObj);
      }

      if (targetStoreId && updatedProductObj) {
        fetch("/api/stores/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: updatedProductObj, storeId: targetStoreId, subdomain: targetSubdomain }),
        }).catch((err) => console.warn("Product direct update error:", err));
      }

      if (setMessage) setMessage({ type: "success", text: "Zapisano zmiany w produkcie" });
    } else {
      const newProduct: Product = {
        id: `prod_${Date.now()}`,
        name: prodName,
        price: `${priceNum.toFixed(2)} zł`,
        priceCents,
        comparePrice: comparePriceNum > 0 ? `${comparePriceNum.toFixed(2)} zł` : undefined,
        comparePriceCents,
        type: prodType,
        status: "Aktywny",
        sales: 0,
        isClothing: !isDigital && isClothing,
        stock: totalStock,
        variants: !isDigital && isClothing && activeVariants.length > 0 ? activeVariants : [],
        description: prodDescription,
        image: defaultImg,
        images: allImages,
        isDigital,
        digitalFileName: digitalFile?.name,
        digitalFileSize: digitalFile?.size,
        isDropOnly: isScheduledLaunch,
        dropTargetDate: isScheduledLaunch ? scheduledLaunchDate : undefined,
      };
      saveProductsList([newProduct, ...localProducts]);

      if (addProduct) {
        addProduct(newProduct);
      }

      if (targetStoreId) {
        fetch("/api/stores/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: newProduct, storeId: targetStoreId, subdomain: targetSubdomain }),
        }).catch((err) => console.warn("Product direct create error:", err));
      }

      if (setMessage) setMessage({ type: "success", text: "Pomyślnie dodano produkt do sklepu" });
    }

    setProductSubTab("list");
    setShowProductModal(false);
  };

  const handleDeleteProduct = (id: string) => {
    const updated = localProducts.filter((p) => p.id !== id);
    saveProductsList(updated);

    const targetStoreId = activeStorePackage?.id || currentStore.id;
    if (targetStoreId) {
      fetch(`/api/stores/products?id=${encodeURIComponent(id)}&storeId=${encodeURIComponent(targetStoreId)}`, {
        method: "DELETE",
      }).catch((err) => console.warn("Błąd usuwania produktu z Supabase:", err));
    }

    if (setMessage) setMessage({ type: "success", text: "Produkt został pomyślnie usunięty ze sklepu i bazy." });
  };

  const handleToggleProductStatus = (id: string) => {
    const updated = localProducts.map((p) => {
      if (p.id === id) {
        const nextStatus: any = p.status === "Aktywny" ? "Zawieszony" : "Aktywny";
        return { ...p, status: nextStatus };
      }
      return p;
    });
    saveProductsList(updated);
    if (setMessage) setMessage({ type: "success", text: "Zmieniono status produktu." });
  };

  const handleSaveDropConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateStoreConfig) {
      updateStoreConfig({
        dropConfig: {
          enabled: dropEnabled,
          targetDate: dropTargetDate,
          template: dropTemplate,
        },
      });
    }
    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Zapisano ustawienia Dropu! Odliczanie do: ${new Date(dropTargetDate).toLocaleString("pl-PL")}`,
      });
    }
  };

  const handleSaveSeoConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateStoreConfig) {
      updateStoreConfig({
        seoConfig: {
          metaTitle: seoTitle,
          metaDescription: seoDescription,
          keywords: seoKeywords,
          ogImageUrl: seoFavicon || editorLogo,
        },
      });
    }
    if (setMessage) {
      setMessage({
        type: "success",
        text: "🎉 Zapisano ustawienia SEO i favicorę sklepu!",
      });
    }
  };

  const handleAvatarFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      if (setMessage) setMessage({ type: "error", text: "Proszę wybrać plik graficzny (PNG, JPG, WebP)!" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setProfileAvatarUrl(dataUrl);
      if (updateUserProfile) {
        updateUserProfile({ avatarUrl: dataUrl });
      }
      if (setMessage) setMessage({ type: "success", text: "Zaktualizowano zdjęcie profilowe!" });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatarUrl = () => {
    if (!avatarUrlInput.trim()) return;
    const cleanUrl = avatarUrlInput.trim();
    setProfileAvatarUrl(cleanUrl);
    if (updateUserProfile) {
      updateUserProfile({ avatarUrl: cleanUrl });
    }
    setAvatarUrlInput("");
    if (setMessage) setMessage({ type: "success", text: "Zapisano link do zdjęcia profilowego!" });
  };

  const handleRemoveAvatar = () => {
    setProfileAvatarUrl("");
    setAvatarUrlInput("");
    if (updateUserProfile) {
      updateUserProfile({ avatarUrl: "" });
    }
    if (setMessage) setMessage({ type: "success", text: "Usunięto zdjęcie profilowe." });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      if (setMessage) setMessage({ type: "error", text: "Podaj imię i nazwisko!" });
      return;
    }
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_profile_phone_${key}`, profilePhone);
      localStorage.setItem(`iskra_profile_street_${key}`, profileStreet);
      localStorage.setItem(`iskra_profile_zip_${key}`, profileZip);
      localStorage.setItem(`iskra_profile_city_${key}`, profileCity);
      localStorage.setItem(`iskra_profile_country_${key}`, profileCountry);
    }
    if (updateUserProfile) {
      updateUserProfile({ name: profileName, avatarUrl: profileAvatarUrl });
    }
    if (setMessage) {
      setMessage({ type: "success", text: "🎉 Zapisano pomyślnie zaktualizowane dane profilu!" });
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      if (setMessage) setMessage({ type: "error", text: "Nowe hasło musi zawierać minimum 6 znaków!" });
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      if (setMessage) setMessage({ type: "error", text: "Nowe hasła nie są identyczne!" });
      return;
    }
    setCurrentPasswordInput("");
    setNewPasswordInput("");
    setConfirmPasswordInput("");
    if (setMessage) {
      setMessage({ type: "success", text: "🎉 Twoje hasło zostało pomyślnie zmienione!" });
    }
  };

  const handleInviteTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamInviteEmail.trim() || !teamInviteEmail.includes("@")) {
      if (setMessage) setMessage({ type: "error", text: "Podaj poprawny adres e-mail użytkownika!" });
      return;
    }
    const newMember = {
      id: `tm_${Date.now()}`,
      email: teamInviteEmail.trim(),
      role: teamInviteRole,
      addedAt: new Date().toLocaleDateString("pl-PL"),
    };
    const updated = [...teamMembers, newMember];
    setTeamMembers(updated);
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_team_${key}`, JSON.stringify(updated));
    }
    setTeamInviteEmail("");
    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Dodano ${newMember.email} do zespołu z uprawnieniami: ${teamInviteRole}!`,
      });
    }
  };

  const handleRemoveTeamMember = (id: string) => {
    const updated = teamMembers.filter((m) => m.id !== id);
    setTeamMembers(updated);
    if (typeof window !== "undefined" && user) {
      const key = getUserKey(user);
      localStorage.setItem(`iskra_team_${key}`, JSON.stringify(updated));
    }
    if (setMessage) {
      setMessage({ type: "success", text: "Usunięto członka zespołu ze sklepu." });
    }
  };

  const handleSendNewsletterCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject.trim() || !campaignContent.trim()) {
      if (setMessage) setMessage({ type: "error", text: "Uzupełnij temat i treść wiadomości newslettera!" });
      return;
    }
    const newCamp = {
      id: `cmp_${Date.now()}`,
      subject: campaignSubject.trim(),
      sentDate: new Date().toLocaleDateString("pl-PL"),
      count: subscribers.length,
    };
    setCampaignHistory([newCamp, ...campaignHistory]);
    setCampaignSubject("");
    setCampaignContent("");
    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Wysłano kampanię marketingową do ${subscribers.length} subskrybentów sklepu!`,
      });
    }
  };

  const handleVerifyDomain = () => {
    if (!customDomainInput.trim()) {
      if (setMessage) setMessage({ type: "error", text: "Wpisz domenę (np. twojamarka.pl)!" });
      return;
    }
    setDomainStatus("checking");
    setTimeout(() => {
      setDomainStatus("verified");
      if (updateStoreConfig) {
        updateStoreConfig({
          customDomain: customDomainInput.trim(),
          domainVerified: true,
        });
      }
      if (setMessage) {
        setMessage({
          type: "success",
          text: `🎉 Domena ${customDomainInput.trim()} została pomyślnie zweryfikowana i podpięta z certyfikatem SSL!`,
        });
      }
    }, 1200);
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
              <div className="flex items-center justify-between pb-6">
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

              {isStoreMode ? (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => setActiveTab("pulpit")}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-[#0D0E12] border border-[#17181F] rounded-xl text-xs font-semibold text-zinc-400 hover:text-white font-['Poppins',sans-serif]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#D0FF00]" />
                      <span>Wszystkie pakiety</span>
                    </button>
                  </div>

                  {/* Przycisk powrotu do wszystkich pakietów w mobilnym menu */}
                  <div className="mb-3">
                    <button
                      onClick={() => {
                        setActiveStorePackage(null);
                        setActiveTab("pulpit");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-[#0D0E12] hover:bg-[#151720] border border-[#17181F] rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer font-['Poppins',sans-serif]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#D0FF00]" />
                      <span>Wszystkie pakiety</span>
                    </button>
                  </div>

                  {/* Karta aktywnego sklepu w mobilnym menu */}
                  <div className="mb-4">
                    <div className="p-3 bg-[#0D0E12] border border-[#17181F] rounded-2xl flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center shrink-0 overflow-hidden">
                        {activeStorePackage?.logoUrl || editorLogo || currentStore?.logoUrl ? (
                          <img
                            src={activeStorePackage?.logoUrl || editorLogo || currentStore?.logoUrl}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-[#D0FF00]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-white block truncate font-['Poppins',sans-serif]">
                          {activeStorePackage?.storeName || activeStorePackage?.name || editorStoreName || "Mój Sklep"}
                        </span>
                        <span className="text-[10px] text-[#D0FF00] block truncate font-mono font-medium">
                          {activeStorePackage?.subdomain || activeSubdomain || editorSubdomain || "iskral"}.iskral.pl
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[12px] font-medium text-[#333333] select-none text-left tracking-wider uppercase mb-[12px] font-['Poppins',sans-serif]">
                    FUNKCJE SKLEPU
                  </div>

                  <nav className="flex flex-col gap-1 font-['Poppins',sans-serif]">
                    <button
                      onClick={() => setActiveTab("zarzadzaj-sklepem")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "zarzadzaj-sklepem" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Pulpit</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("sklep-edytor")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "sklep-edytor" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edytor sklepu</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("sklep-produkty")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "sklep-produkty" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Dodaj produkt</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("sklep-zamowienia")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "sklep-zamowienia" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Zamówienia</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("sklep-domena")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "sklep-domena" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      <span>Domena</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("sklep-platnosci")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "sklep-platnosci" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Płatności</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("sklep-newsletter")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "sklep-newsletter" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Newsletter</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("sklep-zespol")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "sklep-zespol" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Współpraca</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("sklep-drop")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "sklep-drop" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <Flame className="w-4 h-4" />
                      <span>Drop</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("sklep-seo")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-medium ${
                        activeTab === "sklep-seo" ? "bg-[#D0FF00]/10 text-[#D0FF00] font-bold" : "text-[#5B5B62] hover:text-white"
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>SEO</span>
                    </button>
                  </nav>
                </>
              ) : (
                <>
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
                </>
              )}
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
      {/* ========================================================================= */}
      {/* LEWY SIDEBAR DESKTOP (BG #070709, LOGODB.SVG 188x22, POPPINS, #D0FF00) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-[284px] bg-[#070709] border-r border-[#141419] flex-col justify-between shrink-0 select-none sticky top-0 h-screen overflow-y-auto z-40">
        
        <div>
          {/* 1. LOGO NA SAMEJ GÓRZE - WYŚRODKOWANE */}
          <div className="flex items-center justify-center py-[48px] px-6">
            <Link href="/dashboard" className="flex items-center justify-center">
              <img
                src="/logodb.svg"
                alt="Logo"
                className="w-[188px] h-[22px] object-contain"
              />
            </Link>
          </div>

          {isStoreMode ? (
            <>
              {/* Przycisk powrotu do wszystkich pakietów */}
              <div className="px-[36px] mb-4">
                <button
                  onClick={() => {
                    setActiveStorePackage(null);
                    setActiveTab("pulpit");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-[#0D0E12] hover:bg-[#151720] border border-[#17181F] rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer font-['Poppins',sans-serif]"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#D0FF00]" />
                  <span>Wszystkie pakiety</span>
                </button>
              </div>

              {/* Karta aktywnego sklepu w sidebarze */}
              <div className="px-[36px] mb-5">
                <div className="p-3 bg-[#0D0E12] border border-[#17181F] rounded-2xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center shrink-0 overflow-hidden">
                    {activeStorePackage?.logoUrl || editorLogo || currentStore?.logoUrl ? (
                      <img
                        src={activeStorePackage?.logoUrl || editorLogo || currentStore?.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="w-4 h-4 text-[#D0FF00]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate font-['Poppins',sans-serif]">
                      {activeStorePackage?.storeName || activeStorePackage?.name || editorStoreName || "Mój Sklep"}
                    </span>
                    <span className="text-[10px] text-[#D0FF00] block truncate font-mono font-medium">
                      {activeStorePackage?.subdomain || activeSubdomain || editorSubdomain || "iskral"}.iskral.pl
                    </span>
                  </div>
                </div>
              </div>

              {/* SEKCJA FUNKCJE */}
              <div className="px-[48px] text-[12px] font-medium text-[#333333] select-none text-left tracking-wider uppercase mb-[12px] font-['Poppins',sans-serif]">
                FUNKCJE
              </div>

              {/* MENU FUNKCJI SKLEPU */}
              <nav className="flex flex-col space-y-[2px] font-['Poppins',sans-serif]">
                {/* Pulpit */}
                <button
                  onClick={() => setActiveTab("zarzadzaj-sklepem")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "zarzadzaj-sklepem" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {activeTab === "zarzadzaj-sklepem" && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <LayoutDashboard className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "zarzadzaj-sklepem" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">Pulpit</span>
                </button>

                {/* Edytor sklepu */}
                <button
                  onClick={() => setActiveTab("sklep-edytor")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "sklep-edytor" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {activeTab === "sklep-edytor" && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <Edit className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "sklep-edytor" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">Edytor sklepu</span>
                </button>

                {/* Dodaj produkt */}
                <button
                  onClick={() => setActiveTab("sklep-produkty")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "sklep-produkty" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {activeTab === "sklep-produkty" && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <Plus className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "sklep-produkty" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">Dodaj produkt</span>
                </button>

                {/* Zamówienia */}
                <button
                  onClick={() => setActiveTab("sklep-zamowienia")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "sklep-zamowienia" || activeTab === "zamowienia" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {(activeTab === "sklep-zamowienia" || activeTab === "zamowienia") && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <ShoppingCart className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "sklep-zamowienia" || activeTab === "zamowienia" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">Zamówienia</span>
                </button>

                {/* Domena */}
                <button
                  onClick={() => setActiveTab("sklep-domena")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "sklep-domena" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {activeTab === "sklep-domena" && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <Globe className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "sklep-domena" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">Domena</span>
                </button>

                {/* Płatności */}
                <button
                  onClick={() => setActiveTab("sklep-platnosci")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "sklep-platnosci" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {activeTab === "sklep-platnosci" && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <Wallet className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "sklep-platnosci" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">Płatności</span>
                </button>

                {/* Newsletter */}
                <button
                  onClick={() => setActiveTab("sklep-newsletter")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "sklep-newsletter" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {activeTab === "sklep-newsletter" && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <Mail className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "sklep-newsletter" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">Newsletter</span>
                </button>

                {/* Współpraca */}
                <button
                  onClick={() => setActiveTab("sklep-zespol")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "sklep-zespol" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {activeTab === "sklep-zespol" && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <Users className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "sklep-zespol" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">Współpraca</span>
                </button>

                {/* Drop */}
                <button
                  onClick={() => setActiveTab("sklep-drop")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "sklep-drop" || activeTab === "drop" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {(activeTab === "sklep-drop" || activeTab === "drop") && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <Flame className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "sklep-drop" || activeTab === "drop" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">Drop</span>
                </button>

                {/* SEO */}
                <button
                  onClick={() => setActiveTab("sklep-seo")}
                  className={`relative w-full flex items-center gap-[10px] px-[48px] py-[6px] text-left transition-colors cursor-pointer group ${
                    activeTab === "sklep-seo" ? "text-[#D0FF00]" : "text-[#5B5B62] hover:text-[#8E8E98]"
                  }`}
                >
                  {activeTab === "sklep-seo" && <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#D0FF00]" />}
                  <Zap className={`w-4 h-4 shrink-0 transition-colors ${activeTab === "sklep-seo" ? "text-[#D0FF00]" : "text-[#22222A] group-hover:text-[#5B5B62]"}`} />
                  <span className="text-[14px] font-medium tracking-tight">SEO</span>
                </button>
              </nav>
            </>
          ) : (
            <>
              {/* SEKCJA GŁÓWNE */}
              <div className="px-[48px] text-[12px] font-medium text-[#333333] select-none text-left tracking-wider uppercase mb-[16px] font-['Poppins',sans-serif]">
                GŁÓWNE
              </div>

              {/* MENU GŁÓWNE */}
              <nav className="flex flex-col font-['Poppins',sans-serif]">
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
            </>
          )}
        </div>

        {/* 4. DOLNA SEKCJA SIDEBARU */}
        <div className="flex flex-col pb-[24px] font-['Poppins',sans-serif]">
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Sora',sans-serif]">
                {activeTab === "pulpit" && "Strona główna"}
                {activeTab === "produkty" && "Sklep"}
                {activeTab === "kreator" && "Szablony"}
                {activeTab === "profil" && "Twój Profil"}
                {activeTab === "konfiguracja-sklepu" && "Konfiguracja Sklepu"}
                {activeTab === "zarzadzaj-sklepem" && (activeStorePackage?.storeName || activeStorePackage?.name || "Pulpit Sklepu")}
                {activeTab === "sklep-edytor" && "Edytor Sklepu"}
                {activeTab === "sklep-produkty" && "Produkty w Sklepie"}
                {activeTab === "sklep-zamowienia" && "Zamówienia Klientów"}
                {activeTab === "sklep-domena" && "Własna Domena"}
                {activeTab === "sklep-platnosci" && "Płatności i Wypłaty"}
                {activeTab === "sklep-newsletter" && "Newsletter i Marketing"}
                {activeTab === "sklep-zespol" && "Współpraca i Zespół"}
                {activeTab === "sklep-drop" && "Tryb Dropu (Premiera)"}
                {activeTab === "sklep-seo" && "SEO i Pozycjonowanie"}
                {activeTab === "zamowienia" && "Zamówienia Klientów"}
                {activeTab === "pakiety" && "Pakiety"}
                {activeTab === "drop" && "Tryb Dropu"}
                {activeTab === "ustawienia" && "Ustawienia Konta"}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-['Poppins',sans-serif]">
              {activeTab === "pulpit" && "Zarządzaj swoimi pakietami i sklepami internetowymi w jednym miejscu."}
              {activeTab === "produkty" && "Wybierz pakiet dla swojej marki lub zarządzaj aktywnymi subskrypcjami."}
              {activeTab === "kreator" && "Wybierz gotowy motyw wizualny dla swojego sklepu."}
              {activeTab === "profil" && "Szczegóły profilu użytkownika i dane kontaktowe."}
              {activeTab === "konfiguracja-sklepu" && "Uzupełnij dane nowo zakupionego pakietu i uruchom swój sklep online."}
              {activeTab === "zarzadzaj-sklepem" && "Statystyki sprzedaży, zamówienia oraz konfiguracja Twojego sklepu."}
              {activeTab === "sklep-edytor" && "Dostosuj logo, motyw, kolory, przyciski i linki społecznościowe."}
              {activeTab === "sklep-produkty" && "Zarządzaj asortymentem odzieżowym, rozmiarówkami i produktami cyfrowymi."}
              {activeTab === "sklep-zamowienia" && "Przeglądaj zamówienia, dane do wysyłki InPost Paczkomat i statusy."}
              {activeTab === "sklep-domena" && "Podepnij własną domenę internetową i skonfiguruj rekordy DNS."}
              {activeTab === "sklep-platnosci" && "Status płatności Stripe, saldo i zlecanie wypłat na konto bankowe."}
              {activeTab === "sklep-newsletter" && "Baza subskrybentów i wysyłka kampanii e-mail marketingu."}
              {activeTab === "sklep-zespol" && "Zaproś współpracowników do zarządzania Twoim sklepem."}
              {activeTab === "sklep-drop" && "Skonfiguruj zegar odliczający i hasło VIP dla wczesnego dostępu."}
              {activeTab === "sklep-seo" && "Zoptymalizuj widoczność sklepu w wyszukiwarce Google."}
              {activeTab === "zamowienia" && "Historia zamówień i płatności Twoich klientów."}
              {activeTab === "pakiety" && "Przegląd ważności i przedłużanie subskrypcji."}
              {activeTab === "drop" && "Konfiguruj premiery i tryb odliczania do dropu."}
              {activeTab === "ustawienia" && "Zarządzaj danymi konta, podepnij domenę i skonfiguruj wypłaty."}
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
                {notificationsList.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#D0FF00] absolute top-4 right-4 ring-2 ring-[#0D0E12] animate-pulse" />
                )}
              </button>

              {/* Dropdown powiadomień */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0D0E12]/95 backdrop-blur-2xl border border-[#17181F] rounded-[22px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 animate-in fade-in space-y-3 font-['Poppins',sans-serif]">
                  <div className="flex items-center justify-between border-b border-[#17181F] pb-2.5 px-1">
                    <span className="text-xs font-bold text-white tracking-wide">
                      Powiadomienia ({notificationsList.length})
                    </span>
                    {notificationsList.length > 0 && (
                      <button
                        onClick={handleClearAllNotifications}
                        className="text-[11px] font-medium text-zinc-500 hover:text-rose-400 cursor-pointer transition-colors"
                      >
                        Wyczyść wszystko
                      </button>
                    )}
                  </div>

                  {notificationsList.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {notificationsList.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-3 bg-[#111319] rounded-xl border border-[#1C1E26] text-white flex items-start justify-between gap-2.5 group transition-colors hover:border-[#262B3B]"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-xs text-[#D0FF00] block leading-tight">
                              {notif.title}
                            </span>
                            <span className="text-[11px] text-zinc-300 mt-1 block leading-relaxed">
                              {notif.text}
                            </span>
                            <span className="text-[9px] text-zinc-500 mt-1.5 block font-mono">
                              {notif.time}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDismissNotification(notif.id)}
                            className="text-zinc-600 hover:text-white p-1 rounded-md transition-colors cursor-pointer shrink-0 opacity-80 hover:opacity-100"
                            title="Usuń powiadomienie"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2">
                      <BellOff className="w-8 h-8 text-zinc-600 mx-auto" />
                      <span className="text-xs text-zinc-400 block font-medium">
                        Brak nowych powiadomień
                      </span>
                      <span className="text-[10px] text-zinc-600 block">
                        Wszystkie komunikaty zostały przeczytane
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Karta Konta Użytkownika z Dropdownem */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="h-[54px] flex items-center gap-3 bg-[#0D0E12] hover:bg-[#13151D] border border-[#17181F] hover:border-[#262835] rounded-[18px] p-1.5 pr-4 cursor-pointer transition-all group select-none"
              >
                <div className="w-9 h-9 shrink-0 flex items-center justify-center">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Profil"
                      className="w-9 h-9 rounded-full object-cover border border-zinc-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                      {user?.name?.slice(0, 2).toUpperCase() || 'US'}
                    </div>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <span className="text-xs sm:text-[13px] font-semibold text-white block leading-tight truncate font-['Poppins',sans-serif]">
                    {user?.name || "Użytkownik"}
                  </span>
                  <span className="text-[11px] text-zinc-500 block truncate font-normal leading-tight mt-0.5 font-['Poppins',sans-serif]">
                    {user?.email || "konto@iskral.pl"}
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
                      className="w-full sm:w-auto px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                      className="w-full sm:w-auto px-[24px] py-[12px] bg-[#141722] hover:bg-[#1A1F2C] text-white text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#22283A] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Wypróbuj za darmo (14 dni)</span>
                      <ArrowUpRight className="w-4 h-4 text-[#D0FF00]" />
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* DLA UŻYTKOWNIKA Z PAKIETEM: CZYSTA SIATKA KART PAKIETÓW */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userPackages.map((pkg) => {
                  const targetDate = pkg.expiresAt ? new Date(pkg.expiresAt).getTime() : 0;
                  const isExp = isMounted && targetDate > 0 && targetDate - Date.now() <= 0;

                  return (
                    <div
                      key={pkg.id}
                      className={`bg-[#0D0E12] border ${isExp ? "border-rose-500/30" : "border-[#17181F] hover:border-[#222530]"} rounded-[24px] p-7 flex flex-col justify-between transition-all space-y-6`}
                    >
                      {/* HEADER KARTY: BADGE PAKIETU + DYSKRETNY UPGRADE */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-[#111319] border border-[#1C1E26] text-xs font-semibold text-white font-['Poppins',sans-serif]">
                            Pakiet {pkg.planType}
                          </span>
                          
                          {/* BADGE WYGASŁ LUB PRZYCISK ULEPSZENIA */}
                          {isExp ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-bold font-['Poppins',sans-serif]">
                              Wygasł
                            </span>
                          ) : (
                            pkg.planType !== "Brand" && (
                              <button
                                type="button"
                                onClick={() => setUpgradingPackage(pkg)}
                                className="text-[11px] font-medium text-zinc-400 hover:text-[#D0FF00] hover:underline transition-colors flex items-center gap-1 cursor-pointer font-['Poppins',sans-serif]"
                                title="Ulepsz pakiet do wyższej wersji"
                              >
                                <span>Ulepsz</span>
                                <ArrowUpRight className="w-3 h-3 text-[#D0FF00]" />
                              </button>
                            )
                          )}
                        </div>

                        <span className="text-xs font-mono text-zinc-500">
                          #{pkg.number}
                        </span>
                      </div>

                      {/* TYTUŁ / NAZWA SKLEPU */}
                      <div className="space-y-1.5">
                        <h2 className="text-xl font-bold text-white tracking-tight font-['Sora',sans-serif]">
                          {pkg.storeName || pkg.name}
                        </h2>
                        {pkg.isConfigured && pkg.subdomain ? (
                          <a
                            href={`https://${pkg.subdomain}.iskral.pl`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-[#D0FF00] hover:underline block truncate"
                          >
                            https://{pkg.subdomain}.iskral.pl
                          </a>
                        ) : (
                          <p className="text-xs text-zinc-400 font-['Poppins',sans-serif]">
                            Pakiet nie został jeszcze skonfigurowany.
                          </p>
                        )}
                      </div>

                      {/* WAŻNOŚĆ SKLEPU + PRZYCISK PRZEDŁUŻ (+30 DNI) */}
                      <div className={`p-4 ${isExp ? "bg-rose-500/10 border-rose-500/30" : "bg-[#111319] border-[#1C1E26]"} border rounded-2xl flex items-center justify-between gap-3`}>
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block font-['Poppins',sans-serif]">
                            Ważność sklepu
                          </span>
                          <div className="flex items-center">
                            <SubscriptionBadge expiresAt={pkg.expiresAt} />
                          </div>
                        </div>

                        <div className="flex items-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleExtendPackage(pkg.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold font-['Poppins',sans-serif] transition-all cursor-pointer shadow-sm ${
                              isExp
                                ? "bg-[#D0FF00] hover:bg-[#bce600] text-black font-bold"
                                : "bg-[#181B24] hover:bg-[#202430] text-zinc-200 hover:text-white border border-[#262B3B] hover:border-zinc-500"
                            }`}
                            title="Przedłuż ważność pakietu o 30 dni"
                          >
                            Przedłuż pakiet
                          </button>
                        </div>
                      </div>

                      {/* GŁÓWNY PRZYCISK: BLOKADA PO WYGAŚNIĘCIU LUB PRZEJŚCIE DO SKLEPU */}
                      <div className="pt-2">
                        {isExp ? (
                          <button
                            type="button"
                            onClick={() => {
                              handleExtendPackage(pkg.id);
                              if (setMessage) {
                                setMessage({
                                  type: "warning",
                                  text: "Pakiet wygasł! Przedłuż subskrypcję, aby odblokować edycję sklepu i dostęp do panelu.",
                                });
                              }
                            }}
                            className="w-full px-[24px] py-[12px] bg-[#161820] hover:bg-[#1f222e] text-rose-300 text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl border border-rose-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            <Lock className="w-4 h-4 text-rose-400" />
                            <span>Pakiet wygasł – przedłuż aby edytować</span>
                          </button>
                        ) : pkg.isConfigured ? (
                          <button
                            onClick={() => handleOpenStorePanel(pkg)}
                            className="w-full px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            <span>Przejdź do sklepu</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenConfigurator(pkg)}
                            className="w-full px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            <span>Przejdź dalej</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        )}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="inline-flex p-1 bg-[#0D0E12] border border-[#17181F] rounded-2xl">
                  <button
                    onClick={() => setBillingInterval("miesiac")}
                    className={`px-5 py-2 rounded-xl text-xs font-semibold font-['Poppins',sans-serif] transition-all cursor-pointer ${
                      billingInterval === "miesiac"
                        ? "bg-[#D0FF00] text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Miesięcznie
                  </button>
                  <button
                    onClick={() => setBillingInterval("rok")}
                    className={`px-5 py-2 rounded-xl text-xs font-semibold font-['Poppins',sans-serif] transition-all cursor-pointer flex items-center gap-1.5 ${
                      billingInterval === "rok"
                        ? "bg-[#D0FF00] text-black font-bold shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span>Rocznie</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      billingInterval === "rok" ? "bg-black text-[#D0FF00]" : "bg-[#D0FF00]/15 text-[#D0FF00]"
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
                      <td className="p-4 text-zinc-400">
                        {isMounted && ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("pl-PL") : "—"}
                      </td>
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
        {/* WIDOK 5: SZABLONY SKLEPÓW (KREATOR) */}
        {/* ========================================================================= */}
        {activeTab === "kreator" && (
          <div className="space-y-6 max-w-5xl font-['Poppins',sans-serif]">
            {/* PRZEŁĄCZNIK DARMOWE / PREMIUM */}
            <div className="flex justify-start items-center">
              <div className="bg-[#0D0E12] border border-[#181A22] p-1.5 rounded-full inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTemplateFilter("Darmowe")}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
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

            {/* LISTA KOMPAKTOWYCH POZIOMYCH KAFELKÓW SZABLONÓW */}
            <div className="space-y-3.5 max-w-4xl">
              {(templateFilter === "Darmowe"
                ? [
                    {
                      id: "dark-vibe",
                      name: "Dark Vibe",
                      tier: "Pakiet Start",
                      badgeText: "W Pakiecie Start",
                      tag: "Streetwear Dark",
                      desc: "Mroczny, minimalistyczny streetwear z mocnymi kontrastami i akcentami.",
                      image:
                        "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
                    },
                    {
                      id: "minimal-clean",
                      name: "Minimal Clean",
                      tier: "Pakiet Start",
                      badgeText: "W Pakiecie Start",
                      tag: "Aesthetic Minimal",
                      desc: "Czysty minimalizm nastawiony na ekspozycję dużych zdjęć produktów.",
                      image:
                        "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
                    },
                    {
                      id: "street-essential",
                      name: "Street Essential",
                      tier: "Pakiet Start",
                      badgeText: "W Pakiecie Start",
                      tag: "Urban Classics",
                      desc: "Klasyczny i przejrzysty układ dla debiutujących marek odzieżowych.",
                      image:
                        "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
                    },
                  ]
                : [
                    {
                      id: "cyber-drop",
                      name: "Cyber Drop",
                      tier: "Pakiet Creator & Brand",
                      badgeText: "Pakiet Creator & Brand",
                      tag: "Drop & Countdown",
                      desc: "Futurystyczny szablon z zaawansowanym zegarem odliczania do dropu.",
                      image:
                        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80",
                    },
                    {
                      id: "oversize-club",
                      name: "Oversize Club",
                      tier: "Pakiet Creator & Brand",
                      badgeText: "Pakiet Creator & Brand",
                      tag: "Lookbook & Fit",
                      desc: "Dedykowany motyw dla marek oversize z lookbookiem i tabelą dopasowania.",
                      image:
                        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
                    },
                    {
                      id: "monochrome-luxury",
                      name: "Monochrome Luxury",
                      tier: "Pakiet Brand",
                      badgeText: "Pakiet Brand",
                      tag: "High Fashion",
                      desc: "Ekskluzywny design z typografią high-fashion i unikalną estetyką.",
                      image:
                        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
                    },
                  ]
              ).map((tpl) => (
                <div
                  key={tpl.id}
                  className="bg-[#0D0E12] border border-[#181A22] hover:border-[#262835] rounded-[22px] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-5 transition-all shadow-sm group"
                >
                  {/* LEWA STRONA: MINIATURKA ZDJĘCIA */}
                  <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden border border-[#1C1E26] bg-[#111319] shrink-0 relative">
                    <img
                      src={tpl.image}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    <span className="absolute bottom-2 left-2 text-[9px] font-bold text-white bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10">
                      {tpl.tag}
                    </span>
                  </div>

                  {/* ŚRODEK: NAZWA ORAZ BADGE PAKIETU */}
                  <div className="flex-1 min-w-0 space-y-1.5 text-left w-full">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#111319] border border-[#1C1E26] text-zinc-400 text-[10px] font-semibold">
                      {tpl.badgeText}
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {tpl.name}
                    </h3>
                  </div>

                  {/* PRAWA STRONA: JEDYNY PRZYCISK ZOBACZ DEMO */}
                  <div className="shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setDemoPreviewTemplate(tpl)}
                      className="w-full sm:w-auto px-[24px] py-[12px] bg-[#141722] hover:bg-[#1A1F2C] text-white text-[16px] font-medium rounded-xl border border-[#22283A] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      <span>Zobacz demo</span>
                      <ExternalLink className="w-4 h-4 text-[#D0FF00]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* MODAL PODGLĄDU NA ŻYWO SZABLONU (LIVE DEMO PREVIEW) */}
            {demoPreviewTemplate && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                  {/* NAGŁÓWEK MODALU */}
                  <div className="p-4 sm:p-5 border-b border-[#17181F] flex items-center justify-between gap-3 bg-[#08090C]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-[#D0FF00]">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">
                          Podgląd: {demoPreviewTemplate.name}
                        </h3>
                        <span className="text-[11px] text-zinc-400">
                          {demoPreviewTemplate.badgeText} • {demoPreviewTemplate.tag}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:flex bg-[#111319] p-1 rounded-xl border border-[#1C1E26] gap-1">
                        <button
                          onClick={() => setDemoViewport("desktop")}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            demoViewport === "desktop" ? "bg-[#D0FF00] text-black" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          Desktop
                        </button>
                        <button
                          onClick={() => setDemoViewport("mobile")}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                            demoViewport === "mobile" ? "bg-[#D0FF00] text-black" : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          Mobile
                        </button>
                      </div>

                      <button
                        onClick={() => setDemoPreviewTemplate(null)}
                        className="p-2 text-zinc-500 hover:text-white rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* ZAWARTOŚĆ DEMO */}
                  <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-[#070709]">
                    <div
                      className={`transition-all duration-300 overflow-hidden rounded-2xl border border-[#1C1E26] shadow-2xl bg-[#0E0E11] ${
                        demoViewport === "mobile" ? "w-80 h-[560px]" : "w-full h-[520px]"
                      }`}
                    >
                      <div className="w-full h-full relative">
                        <img
                          src={demoPreviewTemplate.image}
                          alt={demoPreviewTemplate.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6 space-y-2">
                          <span className="px-3 py-1 rounded-full bg-[#D0FF00] text-black text-xs font-bold w-fit">
                            Live Store Preview
                          </span>
                          <h4 className="text-2xl font-bold text-white">
                            {demoPreviewTemplate.name}
                          </h4>
                          <p className="text-xs text-zinc-300 max-w-md">
                            {demoPreviewTemplate.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* STOPKA MODALU */}
                  <div className="p-4 border-t border-[#17181F] flex items-center justify-between bg-[#08090C]">
                    <a
                      href={liveStoreUrl || "https://demo.iskral.pl"}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#111319] hover:bg-[#1A1F2C] text-zinc-300 hover:text-white text-xs font-semibold rounded-xl border border-[#1C1E26] transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Otwórz w nowej karcie</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#D0FF00]" />
                    </a>

                    <button
                      onClick={() => setDemoPreviewTemplate(null)}
                      className="px-[24px] py-[10px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[15px] font-bold rounded-xl cursor-pointer transition-all"
                    >
                      Zamknij podgląd
                    </button>
                  </div>
                </div>
              </div>
            )}
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
        {/* WIDOK 7: TWÓJ PROFIL */}
        {/* ========================================================================= */}
        {activeTab === "profil" && (
          <div className="space-y-6 max-w-4xl font-['Poppins',sans-serif]">
            {/* SEKCJA 1: ZDJĘCIE PROFILOWE */}
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#17181F] pb-4">
                <h2 className="text-xl font-bold text-white font-['Sora',sans-serif]">
                  Zdjęcie profilowe
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Zarządzaj swoim zdjęciem profilowym widocznym w panelu oraz w prawym górnym rogu.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                {/* PODGLĄD AKTUALNEGO ZDJĘCIA */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#111319] border-2 border-[#1C1E26] flex items-center justify-center shadow-lg">
                    {profileAvatarUrl ? (
                      <img
                        src={profileAvatarUrl}
                        alt="Podgląd zdjęcia profilowego"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-white">
                        {profileName ? profileName.slice(0, 2).toUpperCase() : (user?.name?.slice(0, 2).toUpperCase() || "US")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3.5 flex-1">
                  {/* PRZYCISKI WGRANIA I USUNIĘCIA */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="px-4 py-2.5 bg-[#D0FF00] hover:bg-[#bce600] text-black text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{profileAvatarUrl ? "Zmień zdjęcie" : "Wgraj zdjęcie z dysku"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleAvatarFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {profileAvatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Usuń zdjęcie</span>
                      </button>
                    )}
                  </div>

                  {/* WKLEJANIE LINKU DO ZDJĘCIA */}
                  <div className="pt-1">
                    <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                      Lub wklej bezpośredni adres URL zdjęcia:
                    </label>
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        type="url"
                        value={avatarUrlInput}
                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                        placeholder="https://domena.pl/avatar.jpg"
                        className="flex-1 px-3.5 py-2 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#D0FF00]"
                      />
                      <button
                        type="button"
                        onClick={handleSaveAvatarUrl}
                        disabled={!avatarUrlInput.trim()}
                        className="px-3.5 py-2 bg-[#181B24] hover:bg-[#202430] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl border border-[#262B3B] transition-colors cursor-pointer shrink-0"
                      >
                        Zapisz link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEKCJA 2: DANE PROFILOWE UŻYTKOWNIKA */}
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#17181F] pb-4">
                <h2 className="text-xl font-bold text-white font-['Sora',sans-serif]">
                  Dane Konta i Adres
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Twoje podstawowe dane kontaktowe i adres rozliczeniowy.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">Imię i nazwisko</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">Adres e-mail</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || profileEmail}
                      className="w-full px-4 py-3 bg-[#111319]/50 border border-[#1C1E26] rounded-xl text-sm text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">Numer telefonu</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+48 500 123 456"
                      className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                    />
                  </div>
                </div>

                {/* ADRES ZAMIESZKANIA */}
                <div className="pt-2 border-t border-[#17181F]">
                  <h3 className="text-sm font-bold text-white mb-4">Adres zamieszkania / firmy</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-zinc-300 block mb-2">Ulica i numer</label>
                      <input
                        type="text"
                        value={profileStreet}
                        onChange={(e) => setProfileStreet(e.target.value)}
                        placeholder="ul. Marszałkowska 10/2"
                        className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-2">Kod pocztowy</label>
                      <input
                        type="text"
                        value={profileZip}
                        onChange={(e) => setProfileZip(e.target.value)}
                        placeholder="00-001"
                        className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-2">Miasto</label>
                      <input
                        type="text"
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        placeholder="Warszawa"
                        className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                      />
                    </div>
                  </div>
                  <div className="mt-4 sm:w-1/2">
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">Kraj</label>
                    <input
                      type="text"
                      value={profileCountry}
                      onChange={(e) => setProfileCountry(e.target.value)}
                      placeholder="Polska"
                      className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Zapisz dane profilu</span>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* BEZPIECZEŃSTWO & HASŁO & 2FA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ZMIANA HASŁA */}
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-5">
                <div className="border-b border-[#17181F] pb-3">
                  <h3 className="text-base font-bold text-white">Zmiana hasła</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Zaktualizuj swoje hasło do konta IskraL</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Aktualne hasło</label>
                    <input
                      type="password"
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Nowe hasło</label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Powtórz nowe hasło</label>
                    <input
                      type="password"
                      value={confirmPasswordInput}
                      onChange={(e) => setConfirmPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-[24px] py-[12px] bg-[#141722] hover:bg-[#1A1F2C] text-white text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#22283A] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Zmień hasło</span>
                    <Lock className="w-4 h-4 text-[#D0FF00]" />
                  </button>
                </form>
              </div>

              {/* 2FA AUTHENTICATOR */}
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="border-b border-[#17181F] pb-3">
                    <h3 className="text-base font-bold text-white">Weryfikacja dwuetapowa (2FA)</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Zabezpiecz konto kodem z aplikacji Google Authenticator</p>
                  </div>

                  <div className="p-4 bg-[#111319] border border-[#1C1E26] rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className={`w-6 h-6 ${is2FAActive ? "text-[#D0FF00]" : "text-zinc-500"}`} />
                      <div>
                        <span className="text-xs font-bold text-white block">Status 2FA</span>
                        <span className="text-[11px] text-zinc-400">
                          {is2FAActive ? "Aktywna ochrona logowania" : "Wyłączona (Zalecamy włączenie)"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !is2FAActive;
                        setIs2FAActive(next);
                        if (toggle2FA) toggle2FA();
                        if (setMessage) {
                          setMessage({
                            type: "success",
                            text: next ? "Włączono weryfikację 2FA!" : "Wyłączono weryfikację 2FA.",
                          });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-['Poppins',sans-serif] transition-colors cursor-pointer ${
                        is2FAActive ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" : "bg-[#D0FF00] text-black"
                      }`}
                    >
                      {is2FAActive ? "Wyłącz 2FA" : "Podepnij 2FA"}
                    </button>
                  </div>

                  <div className="p-4 bg-[#111319] border border-[#1C1E26] rounded-2xl space-y-2 text-xs text-zinc-400">
                    <span className="text-white font-semibold block">Klucz konfiguracji ręcznej:</span>
                    <div className="flex items-center justify-between p-2.5 bg-[#0D0E12] border border-[#1C1E26] rounded-xl font-mono text-zinc-300">
                      <span>ISKRA-AUTH-9821-SECURE</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("ISKRA-AUTH-9821-SECURE");
                          if (setMessage) setMessage({ type: "success", text: "Skopiowano klucz 2FA!" });
                        }}
                        className="text-zinc-500 hover:text-[#D0FF00] p-1 cursor-pointer"
                        title="Kopiuj"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: USTAWIENIA KONTA & DOMENY */}
        {/* ========================================================================= */}
        {activeTab === "ustawienia" && (
          <div className="space-y-6 max-w-3xl font-['Poppins',sans-serif]">
            <div>
              <h2 className="text-lg font-bold text-white">Ustawienia Domeny i Wypłat</h2>
              <p className="text-xs text-zinc-400">Zarządzaj domenami i wypłatami środków.</p>
            </div>

            {/* Własna Domena DNS */}
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white border-b border-[#17181F] pb-2">Własna Domena</h3>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Adres Domeny (np. twojamarka.pl)</label>
                <input
                  type="text"
                  defaultValue={currentStore.customDomain || ""}
                  placeholder="twojamarka.pl"
                  className="w-full bg-[#111319] border border-[#1C1E26] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#D0FF00]"
                />
              </div>
              <div className="p-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-zinc-300">
                <p className="font-bold text-white">Rekord DNS CNAME:</p>
                <p className="mt-1 font-mono text-zinc-400">Typ: <strong className="text-white">CNAME</strong> | Host: <strong className="text-white">@ / www</strong> | Wartość: <strong className="text-[#D0FF00]">cname.iskral.pl</strong></p>
              </div>
            </div>

            {/* Wypłaty IBAN */}
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-2xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white border-b border-[#17181F] pb-2">Wypłata Środków ze Sprzedaży</h3>
              <div>
                <span className="text-xs text-zinc-400 block">Dostępne Saldo</span>
                <span className="text-2xl font-bold text-white font-mono mt-1 block">{totalRevenuePLN} PLN</span>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Numer Rachunku Bankowego (IBAN)</label>
                <input
                  type="text"
                  placeholder="PL 00 0000 0000 0000 0000 0000 0000"
                  className="w-full bg-[#111319] border border-[#1C1E26] rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#D0FF00]"
                />
              </div>
              <button
                onClick={() => {
                  if (requestPayoutWithIBAN) requestPayoutWithIBAN(1000, "PL000000000000000000000000");
                  if (setMessage) setMessage({ type: "success", text: "Zlecono wypłatę środków na rachunek bankowy!" });
                }}
                className="px-5 py-2.5 bg-[#D0FF00] hover:bg-[#bce600] text-black font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Zleć Wypłatę na Konto
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: DEDYKOWANA PODSTRONA KONFIGURACJI SKLEPU */}
        {/* ========================================================================= */}
        {activeTab === "konfiguracja-sklepu" && (
          <div className="space-y-6 max-w-3xl">
            {/* PRZYCISK POWROTU */}
            <button
              onClick={() => setActiveTab("pulpit")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer font-['Poppins',sans-serif]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Wróć do Strony głównej</span>
            </button>

            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#17181F] pb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white font-['Sora',sans-serif]">
                    Konfiguracja nowego sklepu
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1 font-['Poppins',sans-serif]">
                    Uzupełnij poniższe dane, aby uruchomić swój sklep online na platformie IskraL.
                  </p>
                </div>

                {selectedPackageForConfig && (
                  <span className="px-3 py-1 rounded-full bg-[#111319] border border-[#1C1E26] text-xs font-semibold text-[#D0FF00] font-['Poppins',sans-serif] shrink-0">
                    Pakiet {selectedPackageForConfig.planType}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveStoreConfig} className="space-y-5 font-['Poppins',sans-serif]">
                {/* NAZWA SKLEPU */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2 font-['Poppins',sans-serif]">
                    Nazwa sklepu *
                  </label>
                  <input
                    type="text"
                    value={configStoreName}
                    onChange={(e) => {
                      setConfigStoreName(e.target.value);
                      if (!configSubdomain) {
                        setConfigSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""));
                      }
                    }}
                    placeholder="np. DROPWEAR, CyberVibe, MyBrand"
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00] transition-colors"
                    required
                  />
                </div>

                {/* SUBDOMENA SKLEPU */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2 font-['Poppins',sans-serif]">
                    Subdomena sklepu *
                  </label>
                  <div className="flex items-center bg-[#111319] border border-[#1C1E26] rounded-xl overflow-hidden focus-within:border-[#D0FF00] transition-colors">
                    <input
                      type="text"
                      value={configSubdomain}
                      onChange={(e) => setConfigSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                      placeholder="twojanazwa"
                      className="flex-1 px-4 py-3 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                      required
                    />
                    <span className="px-4 text-xs font-mono text-[#D0FF00] bg-[#0D0E12] py-3 border-l border-[#1C1E26]">
                      .iskral.pl
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1.5 font-['Poppins',sans-serif]">
                    Twój sklep będzie dostępny pod adresem:{" "}
                    <strong className="text-zinc-300">
                      https://{configSubdomain || "twojanazwa"}.iskral.pl
                    </strong>
                  </p>
                </div>

                {/* LOGO SKLEPU (DRAG & DROP + WYBÓR Z KOMPUTERA + URL) */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2 font-['Poppins',sans-serif]">
                    Logo sklepu
                  </label>

                  {configLogo ? (
                    <div className="flex items-center gap-4 p-4 bg-[#111319] border border-[#1C1E26] rounded-2xl">
                      <div className="w-16 h-16 rounded-xl bg-[#0D0E12] border border-[#1C1E26] overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={configLogo} alt="Podgląd Logo" className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <span className="text-xs font-semibold text-white block truncate">
                          Logo zostało załadowane
                        </span>
                        <div className="flex items-center gap-3">
                          <label className="text-xs text-[#D0FF00] hover:underline cursor-pointer font-medium">
                            Zmień plik
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleLogoFile(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setConfigLogo("")}
                            className="text-xs text-rose-400 hover:underline cursor-pointer font-medium"
                          >
                            Usuń logo
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingLogo(true);
                      }}
                      onDragLeave={() => setIsDraggingLogo(false)}
                      onDrop={handleLogoDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer bg-[#111319]/60 ${
                        isDraggingLogo ? "border-[#D0FF00] bg-[#D0FF00]/5" : "border-[#1C1E26] hover:border-[#2A2E3D]"
                      }`}
                    >
                      <label className="cursor-pointer block">
                        <div className="w-10 h-10 rounded-xl bg-[#141722] border border-[#202535] flex items-center justify-center mx-auto mb-2 text-zinc-400">
                          <Upload className="w-5 h-5 text-[#D0FF00]" />
                        </div>
                        <span className="text-xs font-semibold text-white block">
                          Przeciągnij i upuść plik z komputera lub kliknij, aby wybrać
                        </span>
                        <span className="text-[11px] text-zinc-500 block mt-1">
                          Obsługiwane formaty: PNG, JPG, WebP, SVG (zalecane min. 400x400 px)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoFile(e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}

                  <div className="mt-2.5">
                    <input
                      type="text"
                      value={configLogo.startsWith("data:") ? "" : configLogo}
                      onChange={(e) => setConfigLogo(e.target.value)}
                      placeholder="Lub wklej bezpośredni adres URL do logo (opcjonalnie)"
                      className="w-full px-3.5 py-2 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00] transition-colors"
                    />
                  </div>
                </div>

                {/* KRÓTKI OPIS SKLEPU */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2 font-['Poppins',sans-serif]">
                    Krótki opis sklepu (Bio / Hasło marki)
                  </label>
                  <textarea
                    rows={3}
                    value={configDescription}
                    onChange={(e) => setConfigDescription(e.target.value)}
                    placeholder="Opisz krótko swoją markę, kolekcję lub przekaz dla klientów..."
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00] transition-colors"
                  />
                </div>

                {/* PRZYCISKI AKCJI */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#17181F]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("pulpit")}
                    className="px-[24px] py-[12px] bg-[#111319] hover:bg-[#181B24] text-zinc-300 text-[16px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#1C1E26] cursor-pointer transition-colors"
                  >
                    Anuluj
                  </button>

                  <button
                    type="submit"
                    className="flex-1 px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Stwórz sklep i przejdź do panelu</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: DEDYKOWANY PANEL ZARZĄDZANIA SKLEPEM (PULPIT SKLEPU) */}
        {/* ========================================================================= */}
        {activeTab === "zarzadzaj-sklepem" && (
          <div className="space-y-8 max-w-6xl">
            {/* GÓRNY PASEK SKLEPU (LOGO, NAZWA, ID, PAKIET, WAŻNOŚĆ, OTWARCIE ONLINE, PRZEDŁUŻENIE, UPGRADE) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-7 shadow-xl">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-2xl bg-[#111319] border border-[#1C1E26] overflow-hidden flex items-center justify-center shrink-0">
                  {activeStorePackage?.logoUrl || editorLogo ? (
                    <img
                      src={activeStorePackage?.logoUrl || editorLogo}
                      alt={activeStorePackage?.storeName || activeStorePackage?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="w-7 h-7 text-[#D0FF00]" />
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-['Sora',sans-serif] truncate">
                      {activeStorePackage?.storeName || activeStorePackage?.name || editorStoreName || "Mój Sklep"}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#111319] border border-[#1C1E26] text-xs font-semibold text-[#D0FF00] font-['Poppins',sans-serif]">
                      Pakiet {activeStorePackage?.planType || "Creator"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#111319] border border-[#1C1E26] text-xs font-medium text-zinc-300 font-['Poppins',sans-serif]">
                      Ważność: <strong className="text-white"><SubscriptionBadge expiresAt={activeStorePackage?.expiresAt} /></strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400 font-['Poppins',sans-serif] flex-wrap">
                    <span>ID: #{activeStorePackage?.number || 1000}</span>
                    <span>•</span>
                    <a
                      href={getStoreOnlineUrl(activeStorePackage?.subdomain || activeSubdomain || editorSubdomain)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#D0FF00] hover:underline font-medium inline-flex items-center gap-1 font-mono"
                    >
                      <span>{activeStorePackage?.subdomain || activeSubdomain || editorSubdomain}.iskral.pl</span>
                      <ExternalLink className="w-3 h-3 text-[#D0FF00]" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                {/* PRZYCISK PRZEDŁUŻ PAKIET */}
                <button
                  type="button"
                  onClick={() => activeStorePackage && handleExtendPackage(activeStorePackage.id)}
                  className="px-4 py-2.5 bg-[#141722] hover:bg-[#1A1F2C] text-white text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#22283A] transition-colors cursor-pointer"
                  title="Przedłuż pakiet"
                >
                  Przedłuż pakiet
                </button>

                {/* PRZYCISK ULEPSZ PAKIET */}
                {activeStorePackage && activeStorePackage.planType !== "Brand" && (
                  <button
                    type="button"
                    onClick={() => setUpgradingPackage(activeStorePackage)}
                    className="px-4 py-2.5 bg-[#141722] hover:bg-[#1A1F2C] text-[#D0FF00] text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#22283A] transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Ulepsz pakiet sklepu"
                  >
                    <span>Ulepsz pakiet</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}

                {/* PRZYCISK OTWARCIA SKLEPU ONLINE */}
                <a
                  href={getStoreOnlineUrl(activeStorePackage?.subdomain || activeSubdomain || editorSubdomain)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-[20px] py-[10px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Otwórz sklep online</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* 3 GŁÓWNE STATYSTYKI SKLEPU */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* PRZYCHÓD CAŁKOWITY */}
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400 font-['Poppins',sans-serif]">
                    Przychód całkowity
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-[#D0FF00]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-white font-mono block">
                    {totalRevenuePLN} PLN
                  </span>
                  <span className="text-[11px] text-zinc-500 block mt-1 font-['Poppins',sans-serif]">
                    Suma ze wszystkich zrealizowanych zamówień
                  </span>
                </div>
              </div>

              {/* ZAMÓWIENIA */}
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400 font-['Poppins',sans-serif]">
                    Zamówienia
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-[#D0FF00]">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-white font-mono block">
                    {totalOrdersCount}
                  </span>
                  <span className="text-[11px] text-zinc-500 block mt-1 font-['Poppins',sans-serif]">
                    Liczba złożonych i opłaconych koszyków
                  </span>
                </div>
              </div>

              {/* ODWIEDZINY */}
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400 font-['Poppins',sans-serif]">
                    Odwiedziny
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-[#D0FF00]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-white font-mono block">
                    0
                  </span>
                  <span className="text-[11px] text-zinc-500 block mt-1 font-['Poppins',sans-serif]">
                    Analityka odwiedzin (Wkrótce)
                  </span>
                </div>
              </div>
            </div>

            {/* BOGATY 2-KOLUMNOWY UKŁAD DASHBOARDU SKLEPU */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEWA KOLUMNA: OSTATNIE ZAMÓWIENIA & SZYBKIE AKCJE (7 KOLUMN) */}
              <div className="lg:col-span-7 space-y-6">
                {/* KARTA OSTATNIE ZAMÓWIENIA */}
                <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-['Sora',sans-serif]">
                        Ostatnie zamówienia
                      </h3>
                      <p className="text-xs text-zinc-500 font-['Poppins',sans-serif]">
                        Najnowsze zakupy Twoich klientów
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("sklep-zamowienia")}
                      className="text-xs font-medium text-[#D0FF00] hover:underline font-['Poppins',sans-serif] inline-flex items-center gap-1"
                    >
                      <span>Zobacz wszystkie ({localOrders.length})</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {localOrders.length > 0 ? (
                    <div className="space-y-2.5">
                      {localOrders.slice(0, 3).map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3.5 bg-[#111319] border border-[#1C1E26] rounded-2xl flex items-center justify-between gap-3 text-xs font-['Poppins',sans-serif]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate block">{ord.productTitle}</span>
                            </div>
                            <span className="text-[11px] text-zinc-400 block truncate mt-0.5">{ord.customerEmail}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-white font-mono block">
                              {((ord.amountTotalCents || 0) / 100).toFixed(2)} PLN
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D0FF00]/10 text-[#D0FF00] text-[10px] font-semibold mt-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                              Opłacone
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-[#111319] border border-[#1C1E26] rounded-2xl">
                      <span className="text-xs text-zinc-400 block font-['Poppins',sans-serif]">
                        Brak zamówień. Kiedy klienci zakupią produkty w Twoim sklepie, pojawią się tutaj.
                      </span>
                    </div>
                  )}
                </div>

                {/* SZYBKIE SKRÓTY DO FUNKCJI SKLEPU */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white font-['Sora',sans-serif]">
                    Szybkie zarządzanie
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setProductSubTab("add");
                        setActiveTab("sklep-produkty");
                      }}
                      className="bg-[#0D0E12] hover:bg-[#13151D] border border-[#17181F] hover:border-[#222530] rounded-[20px] p-5 text-left transition-all cursor-pointer flex items-center gap-4 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-zinc-400 group-hover:text-[#D0FF00] shrink-0 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block font-['Poppins',sans-serif]">
                          Dodaj produkt
                        </span>
                        <span className="text-[11px] text-zinc-500 block mt-0.5 font-['Poppins',sans-serif]">
                          Odzież lub plik cyfrowy
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("sklep-edytor")}
                      className="bg-[#0D0E12] hover:bg-[#13151D] border border-[#17181F] hover:border-[#222530] rounded-[20px] p-5 text-left transition-all cursor-pointer flex items-center gap-4 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-zinc-400 group-hover:text-[#D0FF00] shrink-0 transition-colors">
                        <Palette className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block font-['Poppins',sans-serif]">
                          Edytor wyglądu
                        </span>
                        <span className="text-[11px] text-zinc-500 block mt-0.5 font-['Poppins',sans-serif]">
                          Logo, kolory i social media
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("sklep-drop")}
                      className="bg-[#0D0E12] hover:bg-[#13151D] border border-[#17181F] hover:border-[#222530] rounded-[20px] p-5 text-left transition-all cursor-pointer flex items-center gap-4 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-zinc-400 group-hover:text-[#D0FF00] shrink-0 transition-colors">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block font-['Poppins',sans-serif]">
                          Tryb Dropu
                        </span>
                        <span className="text-[11px] text-zinc-500 block mt-0.5 font-['Poppins',sans-serif]">
                          Zegar odliczający i hasło VIP
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab("sklep-domena")}
                      className="bg-[#0D0E12] hover:bg-[#13151D] border border-[#17181F] hover:border-[#222530] rounded-[20px] p-5 text-left transition-all cursor-pointer flex items-center gap-4 group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-zinc-400 group-hover:text-[#D0FF00] shrink-0 transition-colors">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block font-['Poppins',sans-serif]">
                          Własna domena
                        </span>
                        <span className="text-[11px] text-zinc-500 block mt-0.5 font-['Poppins',sans-serif]">
                          Podepnij .pl / .com z SSL
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* PRAWA KOLUMNA: PRODUKTY W TWOIM SKLEPIE & STAN INTEGRACJI (5 KOLUMN) */}
              <div className="lg:col-span-5 space-y-6">
                {/* PRODUKTY W TWOIM SKLEPIE (ASORTYMENT) */}
                <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white font-['Sora',sans-serif]">
                        Produkty ({localProducts.length})
                      </h3>
                      <p className="text-xs text-zinc-500 font-['Poppins',sans-serif]">
                        Aktywny asortyment Twojej marki
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProductSubTab("add");
                        setActiveTab("sklep-produkty");
                      }}
                      className="px-2.5 py-1 bg-[#D0FF00]/10 hover:bg-[#D0FF00]/20 text-[#D0FF00] border border-[#D0FF00]/30 rounded-lg text-xs font-semibold font-['Poppins',sans-serif] transition-colors cursor-pointer"
                    >
                      + Dodaj
                    </button>
                  </div>
                  {localProducts.length > 0 ? (
                    <div className="space-y-2.5">
                      {localProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="p-3 bg-[#111319] border border-[#1C1E26] rounded-2xl flex items-center gap-3 text-xs font-['Poppins',sans-serif]"
                        >
                          <div className="w-12 h-12 rounded-xl bg-[#0D0E12] border border-[#1C1E26] overflow-hidden shrink-0">
                            <img
                              src={prod.image || prod.images?.[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=200"}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-white block truncate">{prod.name}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                              <span className="font-semibold text-[#D0FF00]">{prod.price}</span>
                              <span>•</span>
                              <span>Magazyn: {prod.stock} szt.</span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold shrink-0">
                            {prod.status || "Aktywny"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-[#111319] border border-[#1C1E26] rounded-2xl space-y-3">
                      <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
                      <span className="text-xs text-zinc-400 block font-['Poppins',sans-serif]">
                        Twój sklep nie posiada jeszcze dodanych produktów.
                      </span>
                      <button
                        onClick={() => {
                          setProductSubTab("add");
                          setActiveTab("sklep-produkty");
                        }}
                        className="px-3 py-1.5 bg-[#D0FF00] hover:bg-[#bce600] text-black text-xs font-bold font-['Poppins',sans-serif] rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Dodaj pierwszy produkt</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* STAN I KONFIGURACJA SKLEPU */}
                <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 space-y-3.5">
                  <h3 className="text-base font-bold text-white font-['Sora',sans-serif]">
                    Stan i integracje sklepu
                  </h3>

                  <div className="space-y-2 text-xs font-['Poppins',sans-serif]">
                    {/* Tryb Dropu status */}
                    <div className="p-3 bg-[#111319] border border-[#1C1E26] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Flame className="w-4 h-4 text-[#D0FF00]" />
                        <span className="text-zinc-300">Tryb Dropu</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${dropEnabled ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" : "bg-zinc-800 text-zinc-400"}`}>
                        {dropEnabled ? "Aktywny (Odliczanie)" : "Standardowy sklep"}
                      </span>
                    </div>

                    {/* Domena status */}
                    <div className="p-3 bg-[#111319] border border-[#1C1E26] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-[#D0FF00]" />
                        <span className="text-zinc-300">Domena</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#D0FF00]/10 text-[#D0FF00] text-[10px] font-bold">
                        {customDomainInput ? customDomainInput : `${activeStorePackage?.subdomain || activeSubdomain || "iskral"}.iskral.pl`}
                      </span>
                    </div>

                    {/* Płatności Stripe */}
                    <div className="p-3 bg-[#111319] border border-[#1C1E26] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-4 h-4 text-[#D0FF00]" />
                        <span className="text-zinc-300">Płatności</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                        Stripe • BLIK & Karta
                      </span>
                    </div>

                    {/* Newsletter subscribers */}
                    <div className="p-3 bg-[#111319] border border-[#1C1E26] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-[#D0FF00]" />
                        <span className="text-zinc-300">Newsletter</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#111319] text-zinc-300 text-[10px] font-bold">
                        {subscribers.length} subskrybentów
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: EDYTOR SKLEPU (sklep-edytor) */}
        {/* ========================================================================= */}
        {activeTab === "sklep-edytor" && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#17181F] pb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-['Sora',sans-serif]">
                  Edytor wyglądu i ustawień sklepu
                </h2>
                <p className="text-xs text-zinc-400 mt-1 font-['Poppins',sans-serif]">
                  Zmieniaj logo, subdomenę, motyw, kolory, kształt przycisków i linki społecznościowe w navbarze.
                </p>
              </div>

              <form onSubmit={handleSaveStoreEditor} className="space-y-6 font-['Poppins',sans-serif]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* NAZWA SKLEPU */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">Nazwa sklepu</label>
                    <input
                      type="text"
                      value={editorStoreName}
                      onChange={(e) => setEditorStoreName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                      required
                    />
                  </div>

                  {/* SUBDOMENA SKLEPU */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">Subdomena sklepu</label>
                    <div className="flex items-center bg-[#111319] border border-[#1C1E26] rounded-xl overflow-hidden focus-within:border-[#D0FF00]">
                      <input
                        type="text"
                        value={editorSubdomain}
                        onChange={(e) => setEditorSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                        className="flex-1 px-4 py-3 bg-transparent text-sm text-white focus:outline-none font-mono"
                        required
                      />
                      <span className="px-4 text-xs font-mono text-[#D0FF00] bg-[#0D0E12] py-3 border-l border-[#1C1E26]">
                        .iskral.pl
                      </span>
                    </div>
                  </div>
                </div>

                {/* LOGO SKLEPU - PODGLĄD I ZARZĄDZANIE */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Logo sklepu</label>
                  <div className="p-4 bg-[#111319] border border-[#1C1E26] rounded-2xl space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-[#0D0E12] border border-[#1C1E26] overflow-hidden shrink-0 flex items-center justify-center relative group">
                        {editorLogo ? (
                          <img src={editorLogo} alt="Logo sklepu" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-6 h-6 text-zinc-500" />
                        )}
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="px-3.5 py-1.5 bg-[#171A24] hover:bg-[#202534] text-white text-xs font-semibold rounded-xl border border-[#262C3E] cursor-pointer transition-colors inline-flex items-center gap-1.5">
                            <span>{editorLogo ? "Zmień logo" : "Wybierz plik z komputera"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) handleLogoFile(e.target.files[0]);
                              }}
                            />
                          </label>
                          {editorLogo && (
                            <button
                              type="button"
                              onClick={() => setEditorLogo("")}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium rounded-xl transition-colors cursor-pointer"
                            >
                              Usuń logo
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={editorLogo.startsWith("data:") ? "" : editorLogo}
                          onChange={(e) => setEditorLogo(e.target.value)}
                          placeholder="Lub wklej bezpośredni adres URL do logo (https://...)"
                          className="w-full px-3 py-2 bg-[#0D0E12] border border-[#1C1E26] rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* OPIS / BIO SKLEPU */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Krótki opis / hasło marki</label>
                  <textarea
                    rows={2}
                    value={editorDescription}
                    onChange={(e) => setEditorDescription(e.target.value)}
                    placeholder="Wpisz oficjalne hasło lub opis Twojej marki..."
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white focus:outline-none focus:border-[#D0FF00]"
                  />
                </div>

                {/* WYBÓR SZABLONU (1 GŁÓWNY SZABLON PODSTAWOWY + PODGLĄD DEMO) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-zinc-300 block">Szablon motywu sklepu</label>
                    <span className="text-[11px] text-zinc-500 font-medium">1 aktywny szablon bazowy</span>
                  </div>
                  
                  <div className="p-4 bg-[#111319] border border-[#1C1E26] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-[#0D0E12] border border-[#D0FF00]/40 flex items-center justify-center text-[#D0FF00] font-bold text-sm shrink-0">
                        ⚡
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white block">Dark Vibe (Standard)</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#D0FF00]/10 text-[#D0FF00] text-[10px] font-bold border border-[#D0FF00]/30">
                            Aktywny
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 block mt-0.5">
                          Nowoczesny, ciemny design z dynamicznym akcentem kolorystycznym, koszykiem i siatką produktów.
                        </span>
                      </div>
                    </div>

                    <a
                      href={`https://${activeStorePackage?.subdomain || activeSubdomain || editorSubdomain}.iskral.pl`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#181B24] hover:bg-[#202430] text-zinc-200 hover:text-white text-xs font-medium font-['Poppins',sans-serif] rounded-xl border border-[#2A2E3D] transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>Podgląd wersji demo</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#D0FF00]" />
                    </a>
                  </div>
                </div>

                {/* WYBÓR GŁÓWNEGO KOLORU AKCENTU */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-3">
                    Kolor akcentu (Przyciski, ceny, elementy aktywne)
                  </label>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {[
                      { name: "Neon Lime", hex: "#D0FF00" },
                      { name: "Neon Orange", hex: "#FF5B28" },
                      { name: "Electric Violet", hex: "#8B5CF6" },
                      { name: "Emerald", hex: "#10B981" },
                      { name: "Ice Blue", hex: "#38BDF8" },
                      { name: "Luxury Gold", hex: "#F59E0B" },
                      { name: "Pure White", hex: "#FFFFFF" },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setEditorAccentColor(col.hex)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                          editorAccentColor.toUpperCase() === col.hex.toUpperCase()
                            ? "bg-[#111319] border-[#D0FF00] text-white ring-1 ring-[#D0FF00]/40"
                            : "bg-[#111319] border-[#1C1E26] text-zinc-400 hover:text-white"
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full border border-black/50 shrink-0" style={{ backgroundColor: col.hex }} />
                        <span>{col.name}</span>
                      </button>
                    ))}
                    <div className="flex items-center gap-2 bg-[#111319] border border-[#1C1E26] rounded-xl px-2.5 py-1.5">
                      <span className="w-4 h-4 rounded-full border border-black/50 shrink-0" style={{ backgroundColor: editorAccentColor }} />
                      <input
                        type="text"
                        value={editorAccentColor}
                        onChange={(e) => setEditorAccentColor(e.target.value)}
                        placeholder="#D0FF00"
                        className="w-20 bg-transparent text-xs text-white font-mono text-center focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SOCIAL MEDIA & WIDOCZNOŚĆ W NAVBARZE (INSTAGRAM, TIKTOK, FACEBOOK, DISCORD) */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-semibold text-zinc-300 block">Social Media (Linki i widoczność w menu sklepu)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Instagram */}
                    <div className="p-3.5 bg-[#111319] border border-[#1C1E26] rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Instagram</span>
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editorSocials.showInstagramInNavbar}
                            onChange={(e) => setEditorSocials({ ...editorSocials, showInstagramInNavbar: e.target.checked })}
                            className="accent-[#D0FF00]"
                          />
                          <span>Pokaż w menu</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={editorSocials.instagram}
                        onChange={(e) => setEditorSocials({ ...editorSocials, instagram: e.target.value })}
                        placeholder="twojprofil lub link"
                        className="w-full px-3 py-1.5 bg-[#0D0E12] border border-[#1C1E26] rounded-lg text-xs text-white"
                      />
                    </div>

                    {/* TikTok */}
                    <div className="p-3.5 bg-[#111319] border border-[#1C1E26] rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">TikTok</span>
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editorSocials.showTiktokInNavbar}
                            onChange={(e) => setEditorSocials({ ...editorSocials, showTiktokInNavbar: e.target.checked })}
                            className="accent-[#D0FF00]"
                          />
                          <span>Pokaż w menu</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={editorSocials.tiktok}
                        onChange={(e) => setEditorSocials({ ...editorSocials, tiktok: e.target.value })}
                        placeholder="@twojprofil lub link"
                        className="w-full px-3 py-1.5 bg-[#0D0E12] border border-[#1C1E26] rounded-lg text-xs text-white"
                      />
                    </div>

                    {/* Facebook */}
                    <div className="p-3.5 bg-[#111319] border border-[#1C1E26] rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Facebook</span>
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean((editorSocials as any).showFacebookInNavbar)}
                            onChange={(e) => setEditorSocials({ ...editorSocials, showFacebookInNavbar: e.target.checked } as any)}
                            className="accent-[#D0FF00]"
                          />
                          <span>Pokaż w menu</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={(editorSocials as any).facebook || ""}
                        onChange={(e) => setEditorSocials({ ...editorSocials, facebook: e.target.value } as any)}
                        placeholder="twojastrona lub link"
                        className="w-full px-3 py-1.5 bg-[#0D0E12] border border-[#1C1E26] rounded-lg text-xs text-white"
                      />
                    </div>

                    {/* Discord */}
                    <div className="p-3.5 bg-[#111319] border border-[#1C1E26] rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Discord</span>
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean((editorSocials as any).showDiscordInNavbar)}
                            onChange={(e) => setEditorSocials({ ...editorSocials, showDiscordInNavbar: e.target.checked } as any)}
                            className="accent-[#D0FF00]"
                          />
                          <span>Pokaż w menu</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={(editorSocials as any).discord || ""}
                        onChange={(e) => setEditorSocials({ ...editorSocials, discord: e.target.value } as any)}
                        placeholder="kod zaproszenia lub link"
                        className="w-full px-3 py-1.5 bg-[#0D0E12] border border-[#1C1E26] rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* PRZYCISK ZAPISZ ZMIANY */}
                <div className="pt-4 border-t border-[#17181F] flex justify-end">
                  <button
                    type="submit"
                    className="px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Zapisz zmiany w sklepie</span>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: PRODUKTY & DODAWANIE (sklep-produkty) */}
        {/* ========================================================================= */}
        {activeTab === "sklep-produkty" && (
          <div className="space-y-6 max-w-5xl">
            {/* PRZEŁĄCZNIK ZAKŁADEK: LISTA VS DODAJ NOWY */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="bg-[#0D0E12] border border-[#17181F] p-1.5 rounded-full inline-flex items-center gap-1.5 font-['Poppins',sans-serif]">
                <button
                  type="button"
                  onClick={() => setProductSubTab("list")}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    productSubTab === "list"
                      ? "bg-[#D0FF00] text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Lista produktów ({localProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProductId(null);
                    setProdName("");
                    setProdPrice("");
                    setProdComparePrice("");
                    setProdType("Fizyczny");
                    setIsClothing(false);
                    setSizeStocks({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
                    setProdStock("50");
                    setProdDescription("");
                    setProdImage("");
                    setProdImages([]);
                    setImageInputUrl("");
                    setDigitalFile(null);
                    setIsScheduledLaunch(false);
                    setProductSubTab("add");
                  }}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    productSubTab === "add"
                      ? "bg-[#D0FF00] text-black font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dodaj produkt</span>
                </button>
              </div>
            </div>

            {productSubTab === "add" ? (
              /* FORMULARZ DODAWANIA / EDYCJI PRODUKTU */
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6">
                <div className="border-b border-[#17181F] pb-4">
                  <h2 className="text-xl font-bold text-white font-['Sora',sans-serif]">
                    {editingProductId ? "Edycja produktu" : "Nowy produkt w sklepie"}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 font-['Poppins',sans-serif]">
                    Uzupełnij parametry, warianty rozmiarów odzieży lub pliki cyfrowe.
                  </p>
                </div>

                <form onSubmit={handleCreateOrUpdateProduct} className="space-y-6 font-['Poppins',sans-serif]">
                  {/* NAZWA PRODUKTU */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">Nazwa produktu *</label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="np. Heavyweight Boxy Hoodie Black"
                      className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                      required
                    />
                  </div>

                  {/* CENY (GŁÓWNA & PRZEKREŚLONA) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-2">Cena główna (PLN) *</label>
                      <input
                        type="text"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        placeholder="249.00"
                        className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#D0FF00]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-2">Cena przed obniżką / przekreślona (PLN)</label>
                      <input
                        type="text"
                        value={prodComparePrice}
                        onChange={(e) => setProdComparePrice(e.target.value)}
                        placeholder="319.00"
                        className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-zinc-400 font-mono focus:outline-none focus:border-[#D0FF00]"
                      />
                    </div>
                  </div>

                  {/* PRZEŁĄCZNIK TYPU: FIZYCZNY VS CYFROWY */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-300 block">Rodzaj produktu *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setProdType("Fizyczny")}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          prodType === "Fizyczny"
                            ? "bg-[#D0FF00]/10 border-[#D0FF00] text-[#D0FF00] shadow-sm"
                            : "bg-[#111319] border-[#1C1E26] text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-sm font-bold block text-white">📦 Produkt fizyczny</span>
                        <span className="text-[11px] block mt-1 text-zinc-400">Odzież, akcesoria itp.</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProdType("Cyfrowy")}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          prodType === "Cyfrowy"
                            ? "bg-[#D0FF00]/10 border-[#D0FF00] text-[#D0FF00] shadow-sm"
                            : "bg-[#111319] border-[#1C1E26] text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-sm font-bold block text-white">💻 Produkt cyfrowy</span>
                        <span className="text-[11px] block mt-1 text-zinc-400">Pliki, grafiki, presety, ebooki, dane itp.</span>
                      </button>
                    </div>
                  </div>

                  {/* JEŚLI PRODUKT FIZYCZNY -> WYBÓR CZY TO ODZIEŻ CZY INNY PRODUKT */}
                  {prodType === "Fizyczny" && (
                    <div className="p-5 bg-[#111319] border border-[#1C1E26] rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">Produkt to odzież (z rozmiarówką XS - XXL)</span>
                          <span className="text-[11px] text-zinc-400">Zaznacz, jeśli produkt posiada warianty rozmiarów. Jeśli to akcesoria/gadżet – odznacz.</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isClothing}
                          onChange={(e) => setIsClothing(e.target.checked)}
                          className="w-5 h-5 accent-[#D0FF00] cursor-pointer"
                        />
                      </div>

                      {isClothing ? (
                        <div className="space-y-3 pt-2 border-t border-[#1C1E26]/60">
                          <span className="text-xs font-semibold text-zinc-300 block">Stan magazynowy dla każdego rozmiaru:</span>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                              <div key={size} className="space-y-1">
                                <span className="text-xs font-bold text-zinc-300 block text-center">{size}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={sizeStocks[size] ?? 0}
                                  onChange={(e) =>
                                    setSizeStocks({ ...sizeStocks, [size]: parseInt(e.target.value) || 0 })
                                  }
                                  className="w-full px-2 py-2 bg-[#0D0E12] border border-[#1C1E26] rounded-xl text-center text-xs text-white font-mono focus:outline-none focus:border-[#D0FF00]"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="text-right text-xs text-zinc-400 pt-1">
                            Łączny stan magazynowy:{" "}
                            <strong className="text-[#D0FF00]">
                              {Object.values(sizeStocks).reduce((a, b) => a + (Number(b) || 0), 0)} szt.
                            </strong>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-[#1C1E26]/60">
                          <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Stan magazynowy (dostępna liczba sztuk)</label>
                          <input
                            type="number"
                            min="0"
                            value={prodStock}
                            onChange={(e) => setProdStock(e.target.value)}
                            placeholder="np. 50"
                            className="w-48 px-3.5 py-2 bg-[#0D0E12] border border-[#1C1E26] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#D0FF00]"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* JEŚLI PRODUKT CYFROWY -> PLIK I STAN MAGAZYNOWY/LIMIT */}
                  {prodType === "Cyfrowy" && (
                    <div className="p-5 bg-[#111319] border border-[#1C1E26] rounded-2xl space-y-4">
                      <div>
                        <span className="text-xs font-bold text-white block mb-1">Plik cyfrowy do natychmiastowej wysyłki</span>
                        <span className="text-[11px] text-zinc-400 block mb-3">Klient otrzyma link do pobrania natychmiast po opłaceniu zamówienia.</span>
                        {digitalFile ? (
                          <div className="flex items-center justify-between p-3.5 bg-[#0D0E12] border border-[#1C1E26] rounded-xl text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Download className="w-4 h-4 text-[#D0FF00] shrink-0" />
                              <span className="font-semibold text-white truncate">{digitalFile.name}</span>
                              <span className="text-zinc-500 font-mono">({digitalFile.size})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDigitalFile(null)}
                              className="text-rose-400 hover:underline cursor-pointer text-xs"
                            >
                              Usuń
                            </button>
                          </div>
                        ) : (
                          <label className="border border-dashed border-[#1C1E26] hover:border-[#D0FF00] rounded-xl p-5 block text-center cursor-pointer transition-colors">
                            <Upload className="w-5 h-5 text-[#D0FF00] mx-auto mb-1.5" />
                            <span className="text-xs font-semibold text-white block">Wybierz plik cyfrowy (ZIP, PDF, MP3, grafiki, presety)</span>
                            <span className="text-[11px] text-zinc-500 block mt-0.5">Maksymalny rozmiar: 500 MB</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) handleDigitalFileUpload(e.target.files[0]);
                              }}
                            />
                          </label>
                        )}
                      </div>

                      <div className="pt-3 border-t border-[#1C1E26]/60">
                        <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Stan magazynowy / Dostępna liczba licencji (szt.)</label>
                        <input
                          type="number"
                          min="1"
                          value={prodStock}
                          onChange={(e) => setProdStock(e.target.value)}
                          placeholder="np. 999"
                          className="w-48 px-3.5 py-2 bg-[#0D0E12] border border-[#1C1E26] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#D0FF00]"
                        />
                      </div>
                    </div>
                  )}

                  {/* ZDJĘCIA PRODUKTU (WIĘCEJ ZDJĘĆ / GALERIA) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-zinc-300 block">Zdjęcia produktu (Galeria zdjęć) *</label>
                      <span className="text-[11px] text-zinc-400">Pierwsze zdjęcie to okładka główna • do 8 zdjęć</span>
                    </div>

                    {/* Wklejanie bezpośredniego URL do zdjęcia */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={imageInputUrl}
                        onChange={(e) => setImageInputUrl(e.target.value)}
                        placeholder="Wklej bezpośredni link URL do zdjęcia (np. https://...)..."
                        className="flex-1 px-4 py-2.5 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#D0FF00]"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-4 py-2.5 bg-[#181B24] hover:bg-[#222736] text-white text-xs font-semibold rounded-xl border border-[#262B3B] transition-colors cursor-pointer shrink-0"
                      >
                        + Dodaj z linku
                      </button>
                    </div>

                    {/* Siatka miniatur */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {prodImages.map((img, idx) => (
                        <div key={idx} className="w-24 h-24 rounded-2xl bg-[#111319] border border-[#1C1E26] relative overflow-hidden group shadow-md">
                          <img src={img} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 ? (
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/90 rounded text-[9px] font-bold text-[#D0FF00] border border-[#D0FF00]/40">
                              ★ Główne
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetMainImage(idx)}
                              className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 hover:bg-[#D0FF00] hover:text-black rounded text-[9px] font-medium text-zinc-300 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                              title="Ustaw jako zdjęcie główne"
                            >
                              Główne
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 w-6 h-6 bg-black/80 hover:bg-rose-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Usuń zdjęcie"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {prodImages.length < 8 && (
                        <label className="w-24 h-24 rounded-2xl border border-dashed border-[#1C1E26] hover:border-[#D0FF00] flex flex-col items-center justify-center text-zinc-400 hover:text-white cursor-pointer transition-colors bg-[#0D0E12]/50">
                          <Upload className="w-5 h-5 text-[#D0FF00]" />
                          <span className="text-[10px] font-medium mt-1.5">+ Wgraj plik</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) handleProductImageUpload(e.target.files[0]);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* DUŻY OPIS PRODUKTU */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-zinc-300 block">Dłuższy opis produktu (Specyfikacja, materiały, instrukcja)</label>
                      <span className="text-[11px] text-zinc-500">Widoczny po wejściu w szczegóły produktu</span>
                    </div>
                    <textarea
                      rows={5}
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      placeholder="Wprowadź szczegółowy opis produktu np. krój, skład materiałowy, gramaturę, zawartość paczki plików cyfrowych, licencję lub instrukcję instalacji..."
                      className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white leading-relaxed focus:outline-none focus:border-[#D0FF00]"
                    />
                  </div>

                  {/* ZAPLANOWANA PREMIERA (DROP) */}
                  <div className="p-5 bg-[#111319] border border-[#1C1E26] rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Flame className={`w-4 h-4 ${isScheduledLaunch ? "text-[#D0FF00]" : "text-zinc-500"}`} />
                        <div>
                          <span className="text-xs font-bold text-white block">Zaplanowana premiera (Drop)</span>
                          <span className="text-[11px] text-zinc-400">Produkt pojawi się w sklepie dopiero po nadejściu ustalonej daty</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isScheduledLaunch}
                        onChange={(e) => setIsScheduledLaunch(e.target.checked)}
                        className="w-5 h-5 accent-[#D0FF00] cursor-pointer"
                      />
                    </div>

                    {isScheduledLaunch && (
                      <div className="pt-2 border-t border-[#1C1E26]/60">
                        <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Data i godzina odblokowania dropu</label>
                        <input
                          type="datetime-local"
                          value={scheduledLaunchDate}
                          onChange={(e) => setScheduledLaunchDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#0D0E12] border border-[#1C1E26] rounded-xl text-xs text-white focus:outline-none focus:border-[#D0FF00]"
                        />
                      </div>
                    )}
                  </div>

                  {/* PRZYCISKI AKCJI */}
                  <div className="flex items-center gap-3 pt-4 border-t border-[#17181F]">
                    <button
                      type="button"
                      onClick={() => setProductSubTab("list")}
                      className="px-[24px] py-[12px] bg-[#111319] hover:bg-[#181B24] text-zinc-300 text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl border border-[#1C1E26] cursor-pointer transition-colors"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-[14px] font-medium font-['Poppins',sans-serif] rounded-xl cursor-pointer shadow-sm flex items-center justify-center gap-2 transition-all"
                    >
                      <span>{editingProductId ? "Zapisz zmiany" : "Zapisz i opublikuj produkt"}</span>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* LISTA PRODUKTÓW W SKLEPIE */
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] overflow-hidden">
                {localProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-['Poppins',sans-serif]">
                      <thead className="bg-[#08090C] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#17181F]">
                        <tr>
                          <th className="p-4">Produkt</th>
                          <th className="p-4">Cena</th>
                          <th className="p-4">Typ</th>
                          <th className="p-4">Magazyn</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Akcje</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141419]">
                        {localProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-[#111319]/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#111319] border border-[#1C1E26] overflow-hidden shrink-0">
                                  <img
                                    src={p.image || p.images?.[0] || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=100"}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=100";
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-white block truncate">{p.name}</span>
                                  <span className="text-[11px] text-zinc-500 block truncate">{p.description?.slice(0, 40)}...</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-mono font-bold text-white">{p.price}</td>
                            <td className="p-4 text-zinc-400">{p.type}</td>
                            <td className="p-4 font-mono text-[#D0FF00] font-bold">{p.stock} szt.</td>
                            <td className="p-4">
                              <button
                                onClick={() => handleToggleProductStatus(p.id)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                  p.status === "Aktywny"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                }`}
                              >
                                {p.status || "Aktywny"}
                              </button>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => {
                                  setEditingProductId(p.id);
                                  setProdName(p.name);
                                  setProdPrice(p.price.replace(" zł", "").replace(" PLN", "").trim());
                                  setProdComparePrice(p.comparePrice?.replace(" zł", "").replace(" PLN", "").trim() || "");
                                  setProdType(p.type as any);
                                  setProdStock(String(p.stock || 50));
                                  setProdDescription(p.description || "");
                                  const safeImgs = Array.isArray(p.images) && p.images.length > 0
                                    ? p.images.filter((img) => typeof img === "string" && img.trim().length > 0)
                                    : [p.image || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80"];
                                  setProdImages(safeImgs.length > 0 ? safeImgs : ["https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80"]);
                                  setIsScheduledLaunch(Boolean(p.isDropOnly));
                                  setScheduledLaunchDate(p.dropTargetDate || "2026-09-01T18:00");
                                  setProductSubTab("add");
                                }}
                                className="p-1.5 text-zinc-400 hover:text-white bg-[#111319] hover:bg-[#1A1F2C] border border-[#1C1E26] rounded-lg cursor-pointer transition-colors"
                                title="Edytuj"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-rose-400 hover:text-rose-300 bg-[#111319] hover:bg-rose-500/10 border border-[#1C1E26] rounded-lg cursor-pointer transition-colors"
                                title="Usuń"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-4">
                    <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">Brak produktów w sklepie</h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                        Twój asortyment jest obecnie pusty. Dodaj pierwszy produkt fizyczny lub cyfrowy, aby klienci mogli go kupić.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingProductId(null);
                        setProdName("");
                        setProdPrice("");
                        setProdComparePrice("");
                        setProdType("Fizyczny");
                        setIsClothing(false);
                        setSizeStocks({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
                        setProdStock("50");
                        setProdDescription("");
                        setProdImage("");
                        setProdImages([]);
                        setImageInputUrl("");
                        setDigitalFile(null);
                        setIsScheduledLaunch(false);
                        setProductSubTab("add");
                      }}
                      className="px-5 py-2.5 bg-[#D0FF00] hover:bg-[#bce600] text-black text-xs font-bold font-['Poppins',sans-serif] rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Dodaj pierwszy produkt</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: ZAMÓWIENIA KLIENTÓW (sklep-zamowienia / zamowienia) */}
        {/* ========================================================================= */}
        {(activeTab === "sklep-zamowienia" || activeTab === "zamowienia") && (() => {
          const filteredOrders = localOrders.filter((ord) => {
            const st = (ord.status || "").toLowerCase();
            if (orderFilter === "all") return true;
            if (orderFilter === "unshipped" || (orderFilter as any) === "paid")
              return st === "unshipped" || st === "paid" || st === "opłacone" || st === "niewysłane" || !st;
            if (orderFilter === "shipped") return st === "shipped" || st === "wysłane";
            if (orderFilter === "completed") return st === "completed" || st === "zrealizowane";
            return true;
          });

          return (
            <div className="space-y-6 max-w-5xl">
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 space-y-4 font-['Poppins',sans-serif]">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white font-['Sora',sans-serif]">
                      Zamówienia klientów
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Przeglądaj opłacone koszyki, dane Paczkomatu InPost / kuriera oraz zarządzaj wysyłką towaru.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: "all", label: "Wszystkie" },
                      { id: "unshipped", label: "Niewysłane" },
                      { id: "shipped", label: "Wysłane" },
                      { id: "completed", label: "Zrealizowane" },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setOrderFilter(f.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                          orderFilter === f.id || (f.id === "unshipped" && (orderFilter as any) === "paid")
                            ? "bg-[#D0FF00] text-black font-bold"
                            : "bg-[#111319] text-zinc-400 hover:text-white border border-[#1C1E26]"
                        }`}
                      >
                        {f.label} ({
                          f.id === "all"
                            ? localOrders.length
                            : localOrders.filter((o) => {
                                const s = (o.status || "").toLowerCase();
                                return f.id === "unshipped"
                                  ? s === "unshipped" || s === "paid" || s === "opłacone" || s === "niewysłane" || !s
                                  : f.id === "shipped"
                                  ? s === "shipped" || s === "wysłane"
                                  : s === "completed" || s === "zrealizowane";
                              }).length
                        })
                      </button>
                    ))}
                  </div>
                </div>

                {filteredOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#08090C] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#17181F]">
                        <tr>
                          <th className="p-3.5">ID & Klient</th>
                          <th className="p-3.5">Zamówione produkty</th>
                          <th className="p-3.5">Dostawa / Paczkomat</th>
                          <th className="p-3.5">Kwota</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Akcja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141419]">
                        {filteredOrders.map((ord) => {
                          const isShipped = String(ord.status).toLowerCase() === "shipped" || String(ord.status).toLowerCase() === "wysłane";
                          const isCompleted = String(ord.status).toLowerCase() === "completed" || String(ord.status).toLowerCase() === "zrealizowane";

                          return (
                            <tr key={ord.id} className="hover:bg-[#111319]/50 transition-colors">
                              <td className="p-3.5">
                                <span className="font-bold text-white block">#{ord.id.slice(-8)}</span>
                                <span className="text-[11px] text-zinc-400 block truncate max-w-[150px]">{ord.customerEmail}</span>
                                {ord.customerName && <span className="text-[10px] text-zinc-500 block">{ord.customerName}</span>}
                              </td>
                              <td className="p-3.5">
                                <span className="font-medium text-white block">{ord.productTitle || "Produkt"}</span>
                                {Array.isArray(ord.items) && ord.items.length > 0 && ord.items[0]?.selectedVariant && (
                                  <span className="text-[10px] text-zinc-400 font-mono block">
                                    Rozmiar: {ord.items[0].selectedVariant}
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-zinc-300">
                                {ord.paczkomatCode ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px] font-semibold">
                                    📦 InPost: {ord.paczkomatCode}
                                  </span>
                                ) : ord.shippingAddress ? (
                                  <span className="text-zinc-300 block text-[11px] truncate max-w-[180px]">
                                    🚚 {ord.shippingAddress}
                                  </span>
                                ) : (
                                  <span className="text-zinc-500 text-[11px]">
                                    ⚡ E-mail (Produkt cyfrowy)
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 font-mono font-bold text-white">
                                {((ord.amountTotalCents || 0) / 100).toFixed(2)} PLN
                              </td>
                              <td className="p-3.5">
                                {isCompleted ? (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                    Zrealizowane ✓
                                  </span>
                                ) : isShipped ? (
                                  <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
                                    Wysłane 📦
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                                    Niewysłane
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderModal(ord)}
                                  className="px-3 py-1.5 bg-[#181B24] hover:bg-[#202430] text-zinc-300 hover:text-white border border-[#262B3B] hover:border-zinc-500 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Szczegóły
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-3">
                    <Package className="w-12 h-12 text-zinc-600 mx-auto" />
                    <h3 className="text-base font-bold text-white">Brak zamówień w wybranej kategorii</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      Kiedy klienci dokonają zakupu w Twoim sklepie, zamówienia pojawią się tutaj wraz z pełnymi danymi do wysyłki.
                    </p>
                  </div>
                )}
              </div>

              {/* MODAL SZCZEGÓŁÓW ZAMÓWIENIA & ZMIANY STATUSU */}
              {selectedOrderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="bg-[#111319] border border-[#22283A] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl font-['Poppins',sans-serif] text-xs">
                    <div className="flex items-center justify-between border-b border-[#1E2333] pb-4">
                      <div>
                        <h3 className="text-base font-bold text-white font-['Sora',sans-serif]">
                          Szczegóły zamówienia #{selectedOrderModal.id.slice(-8)}
                        </h3>
                        <span className="text-[11px] text-zinc-400">
                          Złożone: {new Date(selectedOrderModal.createdAt).toLocaleString("pl-PL")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedOrderModal(null)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* DANE KLIENTA */}
                      <div className="p-3.5 bg-[#0D0E12] border border-[#1C202E] rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Dane zamawiającego:
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-zinc-300">
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Imię i nazwisko:</span>
                            <span className="font-semibold text-white">
                              {selectedOrderModal.customerName || selectedOrderModal.shippingDetails?.name || "Brak (Klient)"}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px]">Numer telefonu:</span>
                            <span className="font-mono text-white">
                              {selectedOrderModal.customerPhone || selectedOrderModal.shippingDetails?.phone || "Brak"}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-zinc-500 block text-[10px]">Adres e-mail:</span>
                            <span className="font-mono text-emerald-400">{selectedOrderModal.customerEmail}</span>
                          </div>
                        </div>
                      </div>

                      {/* DANE DOSTAWY */}
                      <div className="p-3.5 bg-[#0D0E12] border border-[#1C202E] rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                          Sposób i adres doręczenia:
                        </span>
                        {selectedOrderModal.paczkomatCode || selectedOrderModal.shippingDetails?.paczkomat ? (
                          <div className="flex items-center gap-2 text-white">
                            <span className="text-base">📦</span>
                            <div>
                              <span className="font-bold text-white block">Paczkomat InPost</span>
                              <span className="font-mono text-[#D0FF00] font-bold text-sm">
                                {selectedOrderModal.paczkomatCode || selectedOrderModal.shippingDetails?.paczkomat}
                              </span>
                            </div>
                          </div>
                        ) : selectedOrderModal.shippingAddress || selectedOrderModal.shippingDetails?.address ? (
                          <div className="flex items-center gap-2 text-white">
                            <span className="text-base">🚚</span>
                            <div>
                              <span className="font-bold text-white block">Przesyłka kurierska</span>
                              <span className="text-zinc-300 block">
                                {selectedOrderModal.shippingAddress || selectedOrderModal.shippingDetails?.address}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-zinc-400">
                            <span>⚡ Produkt cyfrowy dostarczony na e-mail</span>
                          </div>
                        )}
                      </div>

                      {/* ZAMÓWIONY TOWAR I KWOTA */}
                      <div className="p-3.5 bg-[#0D0E12] border border-[#1C202E] rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Zamówione pozycje:
                          </span>
                          <span className="text-sm font-mono font-bold text-white">
                            {((selectedOrderModal.amountTotalCents || 0) / 100).toFixed(2)} PLN
                          </span>
                        </div>
                        <div className="space-y-1.5 border-t border-white/5 pt-2">
                          <div className="flex items-center justify-between text-zinc-300">
                            <span className="font-semibold text-white">{selectedOrderModal.productTitle}</span>
                            <span className="font-mono font-bold text-[#D0FF00]">
                              {((selectedOrderModal.amountTotalCents || 0) / 100).toFixed(2)} PLN
                            </span>
                          </div>
                          {Array.isArray(selectedOrderModal.items) && selectedOrderModal.items.length > 0 && selectedOrderModal.items[0]?.selectedVariant && (
                            <span className="text-[11px] text-zinc-400 font-mono block">
                              Wariant / Rozmiar: <strong>{selectedOrderModal.items[0].selectedVariant}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ID TRANSAKCJI STRIPE */}
                      {selectedOrderModal.stripeSessionId && (
                        <div className="text-[10px] text-zinc-500 font-mono">
                          Stripe ID: {selectedOrderModal.stripeSessionId}
                        </div>
                      )}

                      {/* ZMIANA STATUSU ZAMÓWIENIA */}
                      <div className="pt-2 border-t border-[#1E2333] space-y-2">
                        <span className="text-[11px] font-bold text-zinc-300 block">
                          Zmień status zamówienia:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            disabled={updatingOrderStatus}
                            onClick={() => handleUpdateOrderStatus(selectedOrderModal.id, "unshipped")}
                            className={`py-2 px-2 rounded-xl text-center font-semibold border transition-all cursor-pointer ${
                              String(selectedOrderModal.status).toLowerCase() === "unshipped" ||
                              String(selectedOrderModal.status).toLowerCase() === "paid" ||
                              String(selectedOrderModal.status).toLowerCase() === "opłacone" ||
                              String(selectedOrderModal.status).toLowerCase() === "niewysłane"
                                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                                : "bg-[#0D0E12] border-[#1C202E] text-zinc-400 hover:text-white"
                            }`}
                          >
                            Niewysłane
                          </button>
                          <button
                            type="button"
                            disabled={updatingOrderStatus}
                            onClick={() => handleUpdateOrderStatus(selectedOrderModal.id, "shipped")}
                            className={`py-2 px-2 rounded-xl text-center font-semibold border transition-all cursor-pointer ${
                              String(selectedOrderModal.status).toLowerCase() === "shipped" || String(selectedOrderModal.status).toLowerCase() === "wysłane"
                                ? "bg-sky-500/20 border-sky-500/50 text-sky-300"
                                : "bg-[#0D0E12] border-[#1C202E] text-zinc-400 hover:text-white"
                            }`}
                            title="Oznacz jako wysłane i wyślij automatyczny e-mail do klienta"
                          >
                            📦 Wysłane
                          </button>
                          <button
                            type="button"
                            disabled={updatingOrderStatus}
                            onClick={() => handleUpdateOrderStatus(selectedOrderModal.id, "completed")}
                            className={`py-2 px-2 rounded-xl text-center font-semibold border transition-all cursor-pointer ${
                              String(selectedOrderModal.status).toLowerCase() === "completed" || String(selectedOrderModal.status).toLowerCase() === "zrealizowane"
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                                : "bg-[#0D0E12] border-[#1C202E] text-zinc-400 hover:text-white"
                            }`}
                          >
                            ✓ Zrealizowane
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderModal(null)}
                        className="w-full py-2.5 rounded-xl bg-[#181B24] hover:bg-[#202430] text-zinc-300 hover:text-white border border-[#262B3B] font-semibold transition-colors cursor-pointer"
                      >
                        Zamknij podgląd
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* WIDOK: WŁASNA DOMENA (sklep-domena) */}
        {/* ========================================================================= */}
        {activeTab === "sklep-domena" && (
          <div className="space-y-6 max-w-3xl">
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6 font-['Poppins',sans-serif]">
              <div>
                <h2 className="text-xl font-bold text-white font-['Sora',sans-serif]">
                  Podepnij własną domenę
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Skieruj swój sklep na adres własnej domeny (np. twojamarka.pl). Zapewniamy darmowy certyfikat SSL.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Twoja zarejestrowana domena</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder="twojamarka.pl"
                      className="flex-1 px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyDomain}
                      className="px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-sm font-bold rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      {domainStatus === "checking" ? "Sprawdzanie..." : "Zweryfikuj DNS"}
                    </button>
                  </div>
                </div>

                {domainStatus === "verified" && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold block text-white">Domena zweryfikowana pomyślnie!</span>
                      <span className="text-[11px] text-emerald-400">Certyfikat SSL jest aktywny. Sklep odpowiada pod Twoim adresem.</span>
                    </div>
                  </div>
                )}

                {/* INSTRUKCJA REKORDÓW DNS */}
                <div className="p-5 bg-[#111319] border border-[#1C1E26] rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-white block">Instrukcja konfiguracji u rejestratora domeny</span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-3 bg-[#0D0E12] rounded-xl border border-[#1C1E26]">
                      <div>
                        <span className="text-zinc-400 block text-[11px]">Rekord CNAME dla subdomeny lub www</span>
                        <span className="font-mono text-white font-bold">CNAME @ / www &rarr; cname.iskral.pl</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("cname.iskral.pl");
                          if (setMessage) setMessage({ type: "success", text: "Skopiowano wartość CNAME!" });
                        }}
                        className="px-2.5 py-1 bg-[#171A24] text-zinc-300 hover:text-white rounded-lg text-xs cursor-pointer"
                      >
                        Kopiuj
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#0D0E12] rounded-xl border border-[#1C1E26]">
                      <div>
                        <span className="text-zinc-400 block text-[11px]">Rekord A dla domeny głównej</span>
                        <span className="font-mono text-white font-bold">A @ &rarr; 76.76.21.21</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("76.76.21.21");
                          if (setMessage) setMessage({ type: "success", text: "Skopiowano adres IP!" });
                        }}
                        className="px-2.5 py-1 bg-[#171A24] text-zinc-300 hover:text-white rounded-lg text-xs cursor-pointer"
                      >
                        Kopiuj
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: PŁATNOŚCI & WYPŁATY (sklep-platnosci) */}
        {/* ========================================================================= */}
        {activeTab === "sklep-platnosci" && (
          <div className="space-y-6 max-w-4xl font-['Poppins',sans-serif]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* STATUS PŁATNOŚCI STRIPE */}
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bramka Stripe Connect</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    System automatycznie przetwarza płatności BLIK, karty Visa/Mastercard oraz Apple Pay.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold inline-block">
                  Aktywny • 0% prowizji platformy
                </span>
              </div>

              {/* SALDO DO WYPŁATY */}
              <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#111319] border border-[#1C1E26] flex items-center justify-center text-[#D0FF00]">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-zinc-400 block">Dostępne środki</span>
                  <span className="text-3xl font-bold text-white font-mono block mt-1">{totalRevenuePLN} PLN</span>
                </div>
                <span className="text-[11px] text-zinc-500 block">Środki gotowe do przelania na Twój rachunek bankowy</span>
              </div>
            </div>

            {/* FORMULARZ ZLECENIA WYPŁATY NA IBAN */}
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-4">
              <h3 className="text-base font-bold text-white font-['Sora',sans-serif]">Zlecenie wypłaty na konto bankowe</h3>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">Numer konta bankowego w Polsce (IBAN)</label>
                <input
                  type="text"
                  placeholder="PL 00 0000 0000 0000 0000 0000 0000"
                  className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#D0FF00]"
                />
              </div>
              <button
                onClick={() => {
                  if (setMessage) setMessage({ type: "success", text: "Zlecono wypłatę środków na konto bankowe!" });
                }}
                className="px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-sm font-bold rounded-xl transition-all cursor-pointer"
              >
                Wypłać środki na konto
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: NEWSLETTER & MARKETING (sklep-newsletter) */}
        {/* ========================================================================= */}
        {activeTab === "sklep-newsletter" && (
          <div className="space-y-6 max-w-4xl font-['Poppins',sans-serif]">
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#17181F] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white font-['Sora',sans-serif]">Newsletter i Kampanie E-mail</h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Baza osób zapisanych na powiadomienia o nowym dropie i wysyłka kampanii.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#111319] border border-[#1C1E26] text-xs font-bold text-[#D0FF00]">
                  {subscribers.length} subskrybentów
                </span>
              </div>

              {/* FORMULARZ NOWEJ KAMPANII */}
              <form onSubmit={handleSendNewsletterCampaign} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Temat wiadomości e-mail</label>
                  <input
                    type="text"
                    value={campaignSubject}
                    onChange={(e) => setCampaignSubject(e.target.value)}
                    placeholder="np. 🔥 Nowy Drop już dostępny w sklepie!"
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Treść wiadomości</label>
                  <textarea
                    rows={4}
                    value={campaignContent}
                    onChange={(e) => setCampaignContent(e.target.value)}
                    placeholder="Wpisz treść wiadomości, którą otrzymają wszyscy Twoi subskrybenci..."
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white focus:outline-none focus:border-[#D0FF00]"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Wyślij kampanię do {subscribers.length} osób</span>
                  </button>
                </div>
              </form>

              {/* LISTA SUBSKRYBENTÓW */}
              <div className="pt-4 border-t border-[#17181F] space-y-3">
                <h3 className="text-sm font-bold text-white">Baza adresowa</h3>
                <div className="space-y-2">
                  {subscribers.map((s) => (
                    <div key={s.id} className="p-3 bg-[#111319] border border-[#1C1E26] rounded-xl flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{s.email}</span>
                      <span className="text-zinc-500 font-mono">Zapisano: {s.subscribedAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: WSPÓŁPRACA & ZESPÓŁ (sklep-zespol) */}
        {/* ========================================================================= */}
        {activeTab === "sklep-zespol" && (
          <div className="space-y-6 max-w-4xl font-['Poppins',sans-serif]">
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#17181F] pb-4">
                <h2 className="text-xl font-bold text-white font-['Sora',sans-serif]">Współpraca i Uprawnienia Zespołu</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Zaproś współpracowników do zarządzania sklepem, produktami lub obsługą zamówień.
                </p>
              </div>

              {/* FORMULARZ ZAPRASZANIA */}
              <form onSubmit={handleInviteTeamMember} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">E-mail użytkownika</label>
                    <input
                      type="email"
                      value={teamInviteEmail}
                      onChange={(e) => setTeamInviteEmail(e.target.value)}
                      placeholder="wspolpracownik@gmail.com"
                      className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-2">Rola / Uprawnienia</label>
                    <select
                      value={teamInviteRole}
                      onChange={(e) => setTeamInviteRole(e.target.value as any)}
                      className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white focus:outline-none focus:border-[#D0FF00]"
                    >
                      <option value="Edytor">Edytor (Produkty i wygląd)</option>
                      <option value="Obsługa zamówień">Obsługa zamówień</option>
                      <option value="Administrator">Administrator (Pełny dostęp)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Dodaj członka zespołu</span>
                  </button>
                </div>
              </form>

              {/* LISTA CZŁONKÓW */}
              <div className="pt-4 border-t border-[#17181F] space-y-3">
                <h3 className="text-sm font-bold text-white">Aktywni członkowie zespołu</h3>
                <div className="space-y-2">
                  {teamMembers.map((m) => (
                    <div key={m.id} className="p-3.5 bg-[#111319] border border-[#1C1E26] rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{m.email}</span>
                        <span className="text-[11px] text-[#D0FF00] block mt-0.5">{m.role}</span>
                      </div>
                      {m.id !== "tm_1" && (
                        <button
                          onClick={() => handleRemoveTeamMember(m.id)}
                          className="text-rose-400 hover:underline text-xs cursor-pointer"
                        >
                          Usuń dostęp
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: TRYB DROPU (sklep-drop / drop) */}
        {/* ========================================================================= */}
        {(activeTab === "sklep-drop" || activeTab === "drop") && (
          <div className="space-y-6 max-w-3xl font-['Poppins',sans-serif]">
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#17181F] pb-4">
                <h2 className="text-xl font-bold text-white font-['Sora',sans-serif]">Tryb Dropu i Odliczanie do Premiery</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Zablokuj standardowy sklep i wyświetl odliczanie do premiery kolekcji z hasłem VIP.
                </p>
              </div>

              <form onSubmit={handleSaveDropConfig} className="space-y-5">
                {/* WŁĄCZNIK DROPU */}
                <div className="flex items-center justify-between p-4 bg-[#111319] border border-[#1C1E26] rounded-2xl">
                  <div>
                    <span className="text-sm font-bold text-white block">Włącz tryb dropu na stronie głównej</span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">Zamiast listy produktów pojawi się ekran odliczania</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={dropEnabled}
                    onChange={(e) => setDropEnabled(e.target.checked)}
                    className="w-5 h-5 accent-[#D0FF00] cursor-pointer"
                  />
                </div>

                {/* DATA I GODZINA PREMIERY */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Data i godzina premiery (Target Drop Date)</label>
                  <input
                    type="datetime-local"
                    value={dropTargetDate}
                    onChange={(e) => setDropTargetDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white focus:outline-none focus:border-[#D0FF00]"
                  />
                </div>

                {/* HASŁO VIP DLA INFLUENCERÓW */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Hasło VIP (Wczesny dostęp dla wybranych)</label>
                  <input
                    type="text"
                    value={dropVipPassword}
                    onChange={(e) => setDropVipPassword(e.target.value)}
                    placeholder="VIP2026"
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm font-mono text-white focus:outline-none focus:border-[#D0FF00]"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Osoby posiadające to hasło mogą wejść do sklepu przed oficjalnym startem.</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#17181F]">
                  <button
                    type="submit"
                    className="px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-sm font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Zapisz konfigurację dropu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK: SEO & POZYCJONOWANIE (sklep-seo) */}
        {/* ========================================================================= */}
        {activeTab === "sklep-seo" && (
          <div className="space-y-6 max-w-4xl font-['Poppins',sans-serif]">
            <div className="bg-[#0D0E12] border border-[#17181F] rounded-[24px] p-6 sm:p-8 space-y-6">
              <div className="border-b border-[#17181F] pb-4">
                <h2 className="text-xl font-bold text-white font-['Sora',sans-serif]">SEO i Optymalizacja Google</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Ustaw tytuł, opis i słowa kluczowe, aby Twój sklep zajmował wysokie pozycje w wyszukiwarce.
                </p>
              </div>

              <form onSubmit={handleSaveSeoConfig} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Meta Title (Tytuł w Google)</label>
                  <input
                    type="text"
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-sm text-white focus:outline-none focus:border-[#D0FF00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Meta Description (Opis w wynikach wyszukiwania)</label>
                  <textarea
                    rows={3}
                    value={seoDescription}
                    onChange={(e) => setSeoDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white focus:outline-none focus:border-[#D0FF00]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Słowa kluczowe (Keywords)</label>
                  <input
                    type="text"
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111319] border border-[#1C1E26] rounded-xl text-xs text-white focus:outline-none focus:border-[#D0FF00]"
                  />
                </div>

                {/* PODGLĄD W WYSZUKIWARCE GOOGLE */}
                <div className="p-5 bg-[#111319] border border-[#1C1E26] rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider block">Podgląd w Google</span>
                  <div className="p-4 bg-[#08090C] rounded-xl border border-[#1C1E26] space-y-1">
                    <span className="text-xs text-emerald-400 font-mono block truncate">
                      https://{activeStorePackage?.subdomain || activeSubdomain || "iskral"}.iskral.pl
                    </span>
                    <span className="text-base font-medium text-[#8ab4f8] block hover:underline cursor-pointer">
                      {seoTitle}
                    </span>
                    <span className="text-xs text-zinc-400 block line-clamp-2">
                      {seoDescription}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#17181F]">
                  <button
                    type="submit"
                    className="px-[24px] py-[12px] bg-[#D0FF00] hover:bg-[#bce600] text-black text-sm font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Zapisz ustawienia SEO
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

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
