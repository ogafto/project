"use client";

import React, { useState } from "react";
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
  // Navigation tabs:
  // "pulpit" | "produkty" | "zamowienia" | "pakiety" | "kreator" | "drop" | "ustawienia" | "profil"
  const [activeTab, setActiveTab] = useState<
    "pulpit" | "produkty" | "zamowienia" | "pakiety" | "kreator" | "drop" | "ustawienia" | "profil"
  >("pulpit");

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

  // Store Creator Modal
  const [showStoreCreatorModal, setShowStoreCreatorModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreSubdomain, setNewStoreSubdomain] = useState("");
  const [newStoreTemplate, setNewStoreTemplate] = useState("Dark Vibe");

  // Current Store fallback data
  const currentStore: StoreConfig = activeStore || (userStores.length > 0 ? userStores[0] : {
    id: "demo_store",
    name: "Mój Sklep",
    subdomain: "dropwear",
    customDomain: "",
    template: "Dark Vibe",
    accentColor: "#FF5A28",
    announcement: "🔥 Nowy Drop 2026 dostępny online!",
    planType: user?.plan || "Brand",
    planStatus: "active",
    balanceCents: 1425000,
    visitsCount: 1420,
    domainVerified: false,
    stripeStatus: "connected",
    dropConfig: {
      enabled: true,
      template: "Cyberpunk Launch",
      targetDate: "2026-09-01T20:00",
    },
    categories: [],
    products: [
      {
        id: "p1",
        name: "Boxy Hoodie Heavyweight Black",
        price: "249.00 PLN",
        priceCents: 24900,
        type: "Fizyczny",
        status: "Aktywny",
        sales: 42,
        stock: 50,
        variants: ["S", "M", "L", "XL"],
        description: "Gramatura 450gsm, 100% bawełna organiczna czesana.",
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "p2",
        name: "Oversized Vintage Tee Acid Wash",
        price: "139.00 PLN",
        priceCents: 13900,
        type: "Fizyczny",
        status: "Aktywny",
        sales: 68,
        stock: 35,
        variants: ["M", "L", "XL"],
        description: "Efekt sprania vintage, gruby kołnierz 3cm.",
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      },
      {
        id: "p3",
        name: "Tech Cargo Pants Cyber Dark",
        price: "299.00 PLN",
        priceCents: 29900,
        type: "Fizyczny",
        status: "Aktywny",
        sales: 24,
        stock: 20,
        variants: ["S", "M", "L"],
        description: "Wodoodporna tkanina ripstop, kieszenie modularne.",
        image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
      }
    ],
    orders: [
      {
        id: "ord_101",
        tenantId: "demo",
        stripeSessionId: "cs_101",
        amountTotalCents: 24900,
        status: "paid",
        customerEmail: "kacper.nowak@gmail.com",
        productTitle: "Boxy Hoodie Heavyweight Black",
        createdAt: new Date().toISOString(),
      },
      {
        id: "ord_102",
        tenantId: "demo",
        stripeSessionId: "cs_102",
        amountTotalCents: 13900,
        status: "paid",
        customerEmail: "oliwia.zielinska@wp.pl",
        productTitle: "Oversized Vintage Tee",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: "ord_103",
        tenantId: "demo",
        stripeSessionId: "cs_103",
        amountTotalCents: 29900,
        status: "paid",
        customerEmail: "mateusz.kowal@o2.pl",
        productTitle: "Tech Cargo Pants Cyber Dark",
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      }
    ],
    payoutHistory: [],
    customers: [],
    campaigns: [],
    team: [],
    socials: {
      instagram: "https://instagram.com",
      tiktok: "https://tiktok.com",
    },
  });

  // Stats calculation
  const storeOrders = currentStore.orders || [];
  const storeProducts = currentStore.products || [];
  const paidOrders = storeOrders.filter((o) => o.status === "paid");
  const totalRevenueCents = paidOrders.reduce((acc, o) => acc + (o.amountTotalCents || 0), currentStore.balanceCents || 0);
  const totalRevenuePLN = (totalRevenueCents / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalOrdersCount = Math.max(paidOrders.length, 84);
  const aovPLN = totalOrdersCount > 0 ? (totalRevenueCents / totalOrdersCount / 100).toFixed(2) : "169.50";

  // Subdomain & Live URL
  const storeSubdomain = currentStore.subdomain || "dropwear";
  const liveStoreUrl = currentStore.customDomain
    ? `https://${currentStore.customDomain}`
    : `https://${storeSubdomain}.iskral.pl`;

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

  const handleCreateStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    const cleanSub = (newStoreSubdomain || newStoreName).toLowerCase().replace(/[^a-z0-9]/g, "");

    if (createOrUpdateStoreFull) {
      createOrUpdateStoreFull({
        name: newStoreName.trim(),
        subdomain: cleanSub,
        template: newStoreTemplate,
        accentColor: "#FF5A28",
        announcement: "🔥 Nowy sklep już otwarty!",
        plan: user?.plan || "Brand",
      });
    }
    setShowStoreCreatorModal(false);
    if (setMessage) {
      setMessage({
        type: "success",
        text: `🎉 Utworzono sklep '${newStoreName}' pod adresem: https://${cleanSub}.iskral.pl`,
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0B0D] text-white flex font-sans antialiased selection:bg-[#FF5A28] selection:text-white">
      
      {/* ========================================================================= */}
      {/* LEWY SIDEBAR (BG #070709, LOGODB.SVG 188x22, POPPINS, #D0FF00 HIGHLIGHT) */}
      {/* ========================================================================= */}
      <aside className="w-[284px] bg-[#070709] border-r border-[#141419] flex flex-col justify-between shrink-0 select-none sticky top-0 h-screen overflow-y-auto z-40">
        
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
      <main className="flex-1 bg-[#0A0B0D] min-h-screen p-6 sm:p-8 lg:p-10 overflow-y-auto font-sans">
        
        {/* GÓRNY PASEK NAGŁÓWKA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Sora',sans-serif]">
                {activeTab === "pulpit" && "Strona główna"}
                {activeTab === "produkty" && "Sklep i Produkty"}
                {activeTab === "zamowienia" && "Zamówienia Klientów"}
                {activeTab === "pakiety" && "Pakiety i Ważność Usług"}
                {activeTab === "kreator" && "Kreator i Szablony"}
                {activeTab === "drop" && "Konfiguracja Trybu Dropu"}
                {activeTab === "ustawienia" && "Ustawienia Konta i Wypłat"}
                {activeTab === "profil" && "Twój Profil i Ustawienia"}
              </h1>
              <a
                href={liveStoreUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#12141A] border border-[#1E222D] text-xs font-semibold text-zinc-300 hover:text-white rounded-full shadow-sm hover:border-[#D0FF00]/40 transition-all"
              >
                <span>{storeSubdomain}.iskral.pl</span>
                <ExternalLink className="w-3 h-3 text-[#D0FF00]" />
              </a>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Zarządzaj swoim sklepem internetowym w jednym miejscu.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Dzwonek powiadomień */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-10 h-10 rounded-2xl bg-[#12141A] hover:bg-[#181B23] border border-[#1E222D] shadow-sm flex items-center justify-center text-zinc-300 relative transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5A28] absolute top-2.5 right-2.5 ring-2 ring-[#0A0B0D] shadow-[0_0_8px_#FF5A28]" />
              </button>

              {/* Dropdown powiadomień */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#12141A] border border-[#1E222D] rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in">
                  <span className="text-[11px] font-bold uppercase text-zinc-400 block mb-2 px-1 tracking-wider">
                    Powiadomienia
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-[#181B23] rounded-xl border border-[#242A38] text-white">
                      <span className="font-bold block text-[#D0FF00]">🟢 Status Sklepu</span>
                      <span className="text-[11px] text-zinc-400">Subdomena i certyfikat SSL są aktywne.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Karta Konta Użytkownika z Dropdownem (ze screena) */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 bg-[#12141A] hover:bg-[#181B23] border border-[#1E222D] rounded-2xl p-1.5 pr-3.5 cursor-pointer transition-all shadow-sm group select-none"
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
                  <span className="text-xs sm:text-[13px] font-semibold text-white block leading-tight truncate">
                    {user?.name || "Jan Kowalski"}
                  </span>
                  <span className="text-[11px] text-zinc-500 block truncate font-normal leading-tight mt-0.5">
                    {user?.email || "jan.kowalski@gmail.com"}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform ml-1 ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown menu konta */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#12141A] border border-[#1E222D] rounded-2xl p-1.5 z-50 shadow-2xl animate-in fade-in">
                  <div className="px-3 py-2 border-b border-[#1E222D] mb-1">
                    <span className="text-[10px] font-bold uppercase text-[#D0FF00] block tracking-wider">
                      {isAdmin ? "Administrator" : "Konto Klienta"}
                    </span>
                    <span className="text-xs font-semibold text-white block truncate">{user?.name || "Jan Kowalski"}</span>
                    <span className="text-[10px] text-zinc-500 block truncate">{user?.email || "jan.kowalski@gmail.com"}</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("profil");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#1A1E28] hover:text-white rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Twój profil</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("ustawienia");
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#1A1E28] hover:text-white rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Ustawienia konta</span>
                  </button>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-[#D0FF00] hover:bg-[#D0FF00]/10 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-[#D0FF00]" />
                      <span>Panel Administratora</span>
                    </Link>
                  )}

                  <div className="border-t border-[#1E222D] my-1" />

                  {logout && (
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2.5 cursor-pointer"
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
        {/* WIDOK 1: STRONA GŁÓWNA */}
        {/* ========================================================================= */}
        {activeTab === "pulpit" && (
          <div className="space-y-6 max-w-6xl">
            
            {/* HERO BANER ONBOARDINGU / STATUSU */}
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#12151D] via-[#0E1017] to-[#0A0B0D] border border-[#1E2330] p-6 sm:p-8 shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D0FF00]/10 border border-[#D0FF00]/30 text-[#D0FF00] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Witaj w panelu platformy</span>
                </div>
                
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Sora',sans-serif]">
                  Uruchom swój sklep i zacznij sprzedawać
                </h2>
                
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Skonfiguruj swoją markę odzieżową w kilku prostych krokach. Wybierz pakiet, aby odblokować płatności online BLIK i kartą, nielimitowane produkty, kreator szablonów oraz własną domenę.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("pakiety")}
                    className="px-5 py-2.5 bg-[#D0FF00] hover:bg-[#bce600] text-black text-xs font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(208,255,0,0.25)] flex items-center gap-2 cursor-pointer"
                  >
                    <span>Wybierz pakiet sklepu</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab("kreator")}
                    className="px-5 py-2.5 bg-[#171B24] hover:bg-[#202532] text-white text-xs font-semibold rounded-xl border border-[#262D3D] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4 text-zinc-400" />
                    <span>Dostosuj szablony</span>
                  </button>
                </div>
              </div>

              {/* Tło ozdobne */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#D0FF00]/5 to-transparent pointer-events-none" />
            </div>

            {/* KROKI STARTOWE DO URUCHOMIENIA SKLEPU (3 KARTY) */}
            <div>
              <h3 className="text-base font-bold text-white font-['Sora',sans-serif] mb-4">
                Kroki do startu sprzedaży
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Krok 1 */}
                <div className="bg-[#12141A] border border-[#1E222D] rounded-[22px] p-5 flex flex-col justify-between hover:border-[#D0FF00]/40 transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[#D0FF00]/10 border border-[#D0FF00]/20 flex items-center justify-center text-[#D0FF00]">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono">
                        Krok 01
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">Aktywuj Pakiet</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Wybierz pakiet Creator lub Brand z nielimitowanymi produktami i integracją płatności BLIK.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("pakiety")}
                    className="mt-5 w-full py-2.5 bg-[#171B24] group-hover:bg-[#D0FF00] group-hover:text-black text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-[#242A38] group-hover:border-[#D0FF00]"
                  >
                    Przejdź do pakietów →
                  </button>
                </div>

                {/* Krok 2 */}
                <div className="bg-[#12141A] border border-[#1E222D] rounded-[22px] p-5 flex flex-col justify-between hover:border-[#D0FF00]/40 transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono">
                        Krok 02
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">Wybierz Szablon</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Dopasuj unikalną oprawę wizualną, baner ogłoszeń oraz motyw graficzny swojego sklepu.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("kreator")}
                    className="mt-5 w-full py-2.5 bg-[#171B24] group-hover:bg-purple-500 group-hover:text-white text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-[#242A38] group-hover:border-purple-500"
                  >
                    Przejdź do szablonów →
                  </button>
                </div>

                {/* Krok 3 */}
                <div className="bg-[#12141A] border border-[#1E222D] rounded-[22px] p-5 flex flex-col justify-between hover:border-[#D0FF00]/40 transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <ShoppingBasket className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-zinc-500 uppercase font-mono">
                        Krok 03
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white">Dodaj Produkty</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Wystaw ubrania, limitowane dropy, ustal ceny i zarządzaj stanami magazynowymi.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("produkty")}
                    className="mt-5 w-full py-2.5 bg-[#171B24] group-hover:bg-blue-500 group-hover:text-white text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-[#242A38] group-hover:border-blue-500"
                  >
                    Zarządzaj sklepem →
                  </button>
                </div>
              </div>
            </div>

            {/* INFORMACJE O TWOIM SKLEPIE (STATUS I DOMENA) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#12141A] border border-[#1E222D] rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#181B23] border border-[#242A38] flex items-center justify-center text-zinc-300 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-zinc-500 block truncate font-medium">Subdomena sklepu</span>
                  <span className="text-xs font-bold text-white block truncate">{storeSubdomain}.iskral.pl</span>
                </div>
              </div>

              <div className="bg-[#12141A] border border-[#1E222D] rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#181B23] border border-[#242A38] flex items-center justify-center text-zinc-300 shrink-0">
                  <Shield className="w-5 h-5 text-[#D0FF00]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-zinc-500 block truncate font-medium">Certyfikat SSL</span>
                  <span className="text-xs font-bold text-white block truncate">Aktywny & Bezpieczny</span>
                </div>
              </div>

              <div className="bg-[#12141A] border border-[#1E222D] rounded-2xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#181B23] border border-[#242A38] flex items-center justify-center text-zinc-300 shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-zinc-500 block truncate font-medium">Pakiet konta</span>
                  <span className="text-xs font-bold text-white block truncate">{user?.plan || "Brak aktywnego planu"}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* WIDOK 2: PRODUKTY */}
        {/* ========================================================================= */}
        {activeTab === "produkty" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Lista Produktów w Sklepie ({storeProducts.length})</h2>
                <p className="text-xs text-zinc-400">Zarządzaj ubraniami, dropami, stanem magazynowym i cenami.</p>
              </div>
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 bg-[#FF5A28] hover:bg-[#FF7144] text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Dodaj Nowy Produkt</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeProducts.map((p) => (
                <div key={p.id} className="bg-[#121620] border border-[#202738] rounded-2xl p-4 space-y-3 shadow-lg hover:border-[#FF5A28]/40 transition-all">
                  <div className="h-52 rounded-xl overflow-hidden bg-[#181D2A] relative">
                    <img src={p.image || (p.images && p.images[0])} alt={p.name} className="w-full h-full object-cover" />
                    <span className="absolute top-2.5 right-2.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-[#0E1118]/90 backdrop-blur-md text-white border border-[#202738]">
                      {p.price}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white truncate">{p.name}</h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1">{p.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#202738]">
                    <span className="text-xs text-zinc-400 font-medium">Stan: <strong className="text-white">{p.stock || 50} szt.</strong></span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        className="px-3 py-1.5 bg-[#181D2A] hover:bg-[#242C3E] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border border-[#273245]"
                      >
                        Edytuj
                      </button>
                      {deleteProduct && (
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-lg font-bold text-white">Kreator i Wygląd Sklepu: {currentStore.name}</h2>
              <p className="text-xs text-zinc-400">Dostosuj nazwę, subdomenę, szablon graficzny i ogłoszenia.</p>
            </div>

            <div className="bg-[#121620] border border-[#202738] rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Nazwa Sklepu</label>
                  <input
                    type="text"
                    defaultValue={currentStore.name}
                    onChange={(e) => updateStoreConfig && updateStoreConfig({ name: e.target.value })}
                    className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Subdomena (.iskral.pl)</label>
                  <input
                    type="text"
                    defaultValue={currentStore.subdomain}
                    onChange={(e) => updateStoreConfig && updateStoreConfig({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") })}
                    className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">Pasek Ogłoszeń (Announcement Bar)</label>
                <input
                  type="text"
                  defaultValue={currentStore.announcement}
                  onChange={(e) => updateStoreConfig && updateStoreConfig({ announcement: e.target.value })}
                  className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                />
              </div>

              {/* Wybór Szablonu */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-2">Szablon Graficzny Sklepu</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { name: "Dark Vibe", desc: "Mroczny streetwear z pomarańczowymi akcentami" },
                    { name: "Minimal Clean", desc: "Czysty minimalizm i duże zdjęcia" },
                    { name: "Cyber Drop", desc: "Futurystyczny szablon z zegarem dropu" },
                  ].map((tpl) => (
                    <button
                      key={tpl.name}
                      type="button"
                      onClick={() => updateStoreConfig && updateStoreConfig({ template: tpl.name })}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        currentStore.template === tpl.name
                          ? "bg-[#FF5A28]/15 border-[#FF5A28] text-white shadow-[0_0_15px_rgba(255,90,40,0.15)]"
                          : "bg-[#181D2A] border-[#242D40] text-zinc-400 hover:border-zinc-500"
                      }`}
                    >
                      <span className="font-bold text-xs block text-white">{tpl.name}</span>
                      <span className="text-[11px] text-zinc-400 block mt-1">{tpl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <a
                  href={liveStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-[#181D2A] hover:bg-[#242D40] text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 border border-[#273245]"
                >
                  <span>Otwórz Sklep Live</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#FF5A28]" />
                </a>
                <button
                  onClick={() => setMessage && setMessage({ type: "success", text: "Zapisano konfigurację sklepu!" })}
                  className="px-6 py-2.5 bg-[#FF5A28] hover:bg-[#FF7144] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  Zapisz Zmiany
                </button>
              </div>
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
      {/* MODAL: TWORZENIE NOWEGO SKLEPU */}
      {/* ========================================================================= */}
      {showStoreCreatorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#121620] border border-[#202738] rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Utwórz Nowy Sklep</h3>
                <p className="text-xs text-zinc-400">Skonfiguruj kolejną markę pod swoim kontem</p>
              </div>
              <button onClick={() => setShowStoreCreatorModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStoreSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Nazwa Sklepu / Marki *</label>
                <input
                  type="text"
                  placeholder="np. Streetwear Studio"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Subdomena (.iskral.pl)</label>
                <input
                  type="text"
                  placeholder="np. streetstudio"
                  value={newStoreSubdomain}
                  onChange={(e) => setNewStoreSubdomain(e.target.value)}
                  className="w-full bg-[#181D2A] border border-[#242D40] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5A28]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStoreCreatorModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF5A28] hover:bg-[#FF7144] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Utwórz Sklep →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
