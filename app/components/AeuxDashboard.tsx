"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingBag,
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
  Eye,
  RefreshCw,
  HelpCircle,
  Smartphone,
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
  // "pulpit" | "produkty" | "zamowienia" | "pakiety" | "kreator" | "drop" | "ustawienia" | "admin"
  const [activeTab, setActiveTab] = useState<
    "pulpit" | "produkty" | "zamowienia" | "pakiety" | "kreator" | "drop" | "ustawienia" | "admin"
  >("pulpit");

  // Admin view toggle (dla administratorów)
  const isAdmin = user?.role === "superadmin" || user?.role === "admin" || user?.email?.toLowerCase().includes("projekt@");
  const [adminViewMode, setAdminViewMode] = useState<"sklep" | "platforma">("sklep");

  // UI Dropdowns & Modals
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
  const [prodVariantInput, setProdVariantInput] = useState("");
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
    accentColor: "#00DF81",
    announcement: "🎉 Nowy Drop 2026 dostępny online!",
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

  // Calculate Store Stats
  const storeOrders = currentStore.orders || [];
  const storeProducts = currentStore.products || [];
  const paidOrders = storeOrders.filter((o) => o.status === "paid");
  const totalRevenueCents = paidOrders.reduce((acc, o) => acc + (o.amountTotalCents || 0), currentStore.balanceCents || 0);
  const totalRevenuePLN = (totalRevenueCents / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalOrdersCount = Math.max(paidOrders.length, 84);
  const aovPLN = totalOrdersCount > 0 ? (totalRevenueCents / totalOrdersCount / 100).toFixed(2) : "169.50";
  const visitsCount = currentStore.visitsCount || 1420;

  // Live Store URL
  const storeSubdomain = currentStore.subdomain || "dropwear";
  const liveStoreUrl = currentStore.customDomain
    ? `https://${currentStore.customDomain}`
    : `https://${storeSubdomain}.iskral.pl`;

  // Weekly Revenue Bar Chart Data
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
        accentColor: "#00DF81",
        announcement: "🎉 Nowy sklep już otwarty!",
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
    <div className="min-h-screen w-full bg-[#090E0A] text-[#111827] flex font-sans antialiased selection:bg-[#00DF81] selection:text-black p-2 sm:p-4 lg:p-6">
      
      {/* GLÓWNY ZAOKRĄGLONY KONTENER DASHBOARDU (STYL PROJEKTU AEUX) */}
      <div className="w-full max-w-[1650px] mx-auto bg-[#0C130E] rounded-[28px] border border-[#17241A] overflow-hidden flex flex-col lg:flex-row shadow-2xl min-h-[92vh]">
        
        {/* ========================================================================= */}
        {/* LEWY SIDEBAR (FOREST CHARCOAL Z ZIELONYMI AKCENTAMI) */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-[270px] bg-[#0C130E] border-b lg:border-b-0 lg:border-r border-[#17241A] p-5 flex flex-col justify-between shrink-0 select-none">
          
          <div className="space-y-5">
            
            {/* LOGO PLATFORMY */}
            <div className="flex items-center justify-between px-2 pt-1">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-4 bg-[#00DF81] rounded-full" />
                  <div className="w-1.5 h-6 bg-[#00DF81] rounded-full" />
                  <div className="w-1.5 h-4 bg-[#00DF81] rounded-full" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight group-hover:text-[#00DF81] transition-colors">
                  iskral
                </span>
              </Link>

              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-[#00DF81]/15 text-[#00DF81] border border-[#00DF81]/30 text-[9px] font-bold uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>

            {/* SELEKTOR AKTYWNEGO SKLEPU */}
            <div className="relative">
              <button
                onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                className="w-full bg-[#121D15] hover:bg-[#17261B] border border-[#1C2E20] rounded-2xl p-2.5 flex items-center justify-between text-left transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-[#00DF81]/15 border border-[#00DF81]/30 flex items-center justify-center text-[#00DF81] shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-zinc-400 block leading-tight truncate">
                      Aktywny Sklep
                    </span>
                    <span className="text-xs font-bold text-white block truncate">
                      {currentStore.name}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </button>

              {/* Lista Sklepów w Dropdownie */}
              {isStoreDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121D15] border border-[#1C2E20] rounded-xl p-1.5 z-50 shadow-2xl animate-in fade-in">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-zinc-500 uppercase">
                    Twoje Sklepy ({userStores.length || 1})
                  </div>
                  {(userStores.length > 0 ? userStores : [currentStore]).map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        if (setActiveStoreId) setActiveStoreId(st.id);
                        setIsStoreDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#18281C] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{st.name}</span>
                      {st.id === currentStore.id && (
                        <Check className="w-3.5 h-3.5 text-[#00DF81]" />
                      )}
                    </button>
                  ))}
                  
                  <div className="border-t border-[#1C2E20] mt-1 pt-1">
                    <button
                      onClick={() => {
                        setShowStoreCreatorModal(true);
                        setIsStoreDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-[#00DF81] hover:bg-[#18281C] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Utwórz nowy sklep</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* WYSZUKIWARKA */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Szukaj w sklepie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#121D15] border border-[#1C2E20] rounded-xl pl-9 pr-12 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00DF81] transition-colors"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 bg-[#0C130E] px-1.5 py-0.5 rounded border border-[#1C2E20]">
                ⌘+F
              </span>
            </div>

            {/* GŁÓWNA NAWIGACJA */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 mb-2 block">
                NAWIGACJA
              </span>

              {/* Pulpit */}
              <button
                onClick={() => setActiveTab("pulpit")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "pulpit"
                    ? "bg-[#18291C] text-white shadow-sm border border-[#263F2C]"
                    : "text-zinc-400 hover:text-white hover:bg-[#121D15]"
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === "pulpit" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                <span>Pulpit</span>
              </button>

              {/* Produkty */}
              <button
                onClick={() => setActiveTab("produkty")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "produkty"
                    ? "bg-[#18291C] text-white shadow-sm border border-[#263F2C]"
                    : "text-zinc-400 hover:text-white hover:bg-[#121D15]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className={`w-4 h-4 ${activeTab === "produkty" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                  <span>Produkty</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#121D15] border border-[#1C2E20] text-zinc-300 font-mono">
                  {storeProducts.length}
                </span>
              </button>

              {/* Zamówienia */}
              <button
                onClick={() => setActiveTab("zamowienia")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "zamowienia"
                    ? "bg-[#18291C] text-white shadow-sm border border-[#263F2C]"
                    : "text-zinc-400 hover:text-white hover:bg-[#121D15]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className={`w-4 h-4 ${activeTab === "zamowienia" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                  <span>Zamówienia</span>
                </div>
                <span className="w-4 h-4 rounded-full bg-[#00DF81] text-[#0C130E] text-[10px] font-bold flex items-center justify-center">
                  {paidOrders.length || 3}
                </span>
              </button>

              {/* Pakiety & Usługi */}
              <button
                onClick={() => setActiveTab("pakiety")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "pakiety"
                    ? "bg-[#18291C] text-white shadow-sm border border-[#263F2C]"
                    : "text-zinc-400 hover:text-white hover:bg-[#121D15]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className={`w-4 h-4 ${activeTab === "pakiety" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                  <span>Pakiety i Ważność</span>
                </div>
                <span className="px-1.5 py-0.2 rounded bg-[#00DF81]/20 text-[#00DF81] text-[9px] font-bold uppercase">
                  {currentStore.planType || user?.plan || "Brand"}
                </span>
              </button>

              {/* Kreator & Szablony */}
              <button
                onClick={() => setActiveTab("kreator")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "kreator"
                    ? "bg-[#18291C] text-white shadow-sm border border-[#263F2C]"
                    : "text-zinc-400 hover:text-white hover:bg-[#121D15]"
                }`}
              >
                <Layers className={`w-4 h-4 ${activeTab === "kreator" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                <span>Kreator & Szablony</span>
              </button>

              {/* Tryb Dropu */}
              <button
                onClick={() => setActiveTab("drop")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "drop"
                    ? "bg-[#18291C] text-white shadow-sm border border-[#263F2C]"
                    : "text-zinc-400 hover:text-white hover:bg-[#121D15]"
                }`}
              >
                <Flame className={`w-4 h-4 ${activeTab === "drop" ? "text-orange-400" : "text-zinc-400"}`} />
                <span>Tryb Dropu</span>
              </button>

              {/* Ustawienia */}
              <button
                onClick={() => setActiveTab("ustawienia")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "ustawienia"
                    ? "bg-[#18291C] text-white shadow-sm border border-[#263F2C]"
                    : "text-zinc-400 hover:text-white hover:bg-[#121D15]"
                }`}
              >
                <Settings className={`w-4 h-4 ${activeTab === "ustawienia" ? "text-[#00DF81]" : "text-zinc-400"}`} />
                <span>Ustawienia</span>
              </button>

              {/* SEKCJA ADMINISTRATORA (DLA SUPERADMINÓW) */}
              {isAdmin && (
                <div className="pt-3 mt-3 border-t border-[#17241A]">
                  <Link
                    href="/admin"
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold text-[#00DF81] bg-[#00DF81]/10 hover:bg-[#00DF81]/20 border border-[#00DF81]/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4" />
                      <span>Panel Admina</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

          </div>

          {/* KARTA KONTA UŻYTKOWNIKA NA DOLE SIDEBARU */}
          <div className="pt-5 mt-5 border-t border-[#17241A] relative">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 mb-2 block">
              ZALOGOWANE KONTO
            </span>
            <div className="flex items-center justify-between p-2 rounded-2xl bg-[#121D15] border border-[#1C2E20]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-950 border border-[#00DF81]/30 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name ? user.name.slice(0, 2).toUpperCase() : "KL"}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {user?.name || "Twórca Marki"}
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">
                    {user?.email || "klient@iskral.pl"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Menu użytkownika (Wyloguj) */}
            {isUserMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#121D15] border border-[#1C2E20] rounded-2xl p-2 z-50 shadow-2xl animate-in fade-in">
                <div className="px-3 py-2 border-b border-[#1C2E20] mb-1">
                  <span className="text-[10px] font-bold uppercase text-[#00DF81] block">
                    {isAdmin ? "Administrator" : "Klient"}
                  </span>
                  <span className="text-xs font-semibold text-white block truncate">{user?.email}</span>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("ustawienia");
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-[#18281C] hover:text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Ustawienia Konta</span>
                </button>
                {logout && (
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Wyloguj się</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </aside>

        {/* ========================================================================= */}
        {/* GŁÓWNE PŁÓTNO DASHBOARDU (CRISP CLEAN THEME) */}
        {/* ========================================================================= */}
        <main className="flex-1 bg-[#F4F7F4] p-5 sm:p-8 overflow-y-auto">
          
          {/* GÓRNY PASEK NAGŁÓWKA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
                  {activeTab === "pulpit" && "Pulpit Główny"}
                  {activeTab === "produkty" && "Zarządzanie Produktami"}
                  {activeTab === "zamowienia" && "Zamówienia Klientów"}
                  {activeTab === "pakiety" && "Pakiety i Ważność Usług"}
                  {activeTab === "kreator" && "Kreator i Wygląd Sklepu"}
                  {activeTab === "drop" && "Konfiguracja Trybu Dropu"}
                  {activeTab === "ustawienia" && "Ustawienia Konta i Wypłat"}
                </h1>
                <a
                  href={liveStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:text-black rounded-full shadow-sm hover:bg-zinc-50 transition-colors"
                >
                  <span>{storeSubdomain}.iskral.pl</span>
                  <ExternalLink className="w-3 h-3 text-[#00DF81]" />
                </a>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                Zarządzaj sprzedażą, produktami i swoim sklepem internetowym.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Dzwonek powiadomień */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="w-10 h-10 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-700 relative transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span className="w-2 h-2 rounded-full bg-[#00DF81] absolute top-2.5 right-2.5 ring-2 ring-white" />
                </button>

                {/* Dropdown powiadomień */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-2xl p-3 shadow-xl z-50">
                    <span className="text-[11px] font-bold uppercase text-zinc-400 block mb-2 px-1">
                      Powiadomienia
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                        <span className="font-bold block">🎉 Nowe zamówienie</span>
                        <span className="text-[11px] text-emerald-700">Opłacono zamówienie na kwotę 249.00 PLN</span>
                      </div>
                      <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-100 text-zinc-800">
                        <span className="font-bold block">🟢 Sklep online</span>
                        <span className="text-[11px] text-zinc-500">Certyfikat SSL i subdomena aktywne</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Główny przycisk akcji */}
              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 bg-[#111827] hover:bg-black text-white text-xs font-semibold rounded-full shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#00DF81]" />
                <span>Dodaj Produkt</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* WIDOK 1: PULPIT GŁÓWNY (MATCHING AEUX DESIGN) */}
          {/* ========================================================================= */}
          {activeTab === "pulpit" && (
            <div className="space-y-6">
              
              {/* GÓRNY WIERSZ: 3 KARTY STATYSTYK KPI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* KARTA 1: PRZYCHÓD ZE SKLEPU (WYRÓŻNIONA CIEMNA KARTA) */}
                <div className="bg-[#0C1510] text-white rounded-[24px] p-6 shadow-sm flex items-center justify-between relative overflow-hidden border border-[#16271D]">
                  <div>
                    <span className="text-xs text-zinc-400 font-medium block mb-1">
                      Całkowity Przychód Sklepu
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">
                      {totalRevenuePLN} <span className="text-base sm:text-lg font-normal text-[#00DF81]">PLN</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-[#00DF81] font-medium">
                      <span>↗ +18.4% w tym miesiącu</span>
                    </div>
                  </div>

                  {/* Pionowe neonowe słupki wykresu */}
                  <div className="flex items-end gap-1.5 h-12">
                    <div className="w-1.5 h-8 bg-[#00DF81]/40 rounded-full" />
                    <div className="w-1.5 h-12 bg-[#00DF81] rounded-full" />
                    <div className="w-1.5 h-6 bg-[#00DF81]/60 rounded-full" />
                    <div className="w-1.5 h-10 bg-[#00DF81] rounded-full" />
                    <div className="w-1.5 h-7 bg-[#00DF81]/80 rounded-full" />
                  </div>
                </div>

                {/* KARTA 2: ZAMÓWIENIA KLIENTÓW */}
                <div className="bg-white text-[#111827] rounded-[24px] p-6 shadow-sm flex items-center justify-between border border-zinc-200/70">
                  <div>
                    <span className="text-xs text-zinc-500 font-medium block mb-1">
                      Zrealizowane Zamówienia
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight font-mono">
                      {totalOrdersCount} <span className="text-base sm:text-lg font-normal text-zinc-400">zam.</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-600 font-medium">
                      <span>↗ +12 nowych w tym tygodniu</span>
                    </div>
                  </div>

                  {/* Koralowy / różowy mini wykres */}
                  <div className="flex items-end gap-1.5 h-12">
                    <div className="w-1.5 h-7 bg-emerald-500/40 rounded-full" />
                    <div className="w-1.5 h-11 bg-emerald-500 rounded-full" />
                    <div className="w-1.5 h-5 bg-emerald-500/50 rounded-full" />
                    <div className="w-1.5 h-10 bg-emerald-500 rounded-full" />
                    <div className="w-1.5 h-8 bg-emerald-500/70 rounded-full" />
                  </div>
                </div>

                {/* KARTA 3: ŚREDNIA WARTOŚĆ KOSZYKA (AOV) */}
                <div className="bg-white text-[#111827] rounded-[24px] p-6 shadow-sm flex items-center justify-between border border-zinc-200/70">
                  <div>
                    <span className="text-xs text-zinc-500 font-medium block mb-1">
                      Średnia Wartość Koszyka (AOV)
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight font-mono">
                      {aovPLN} <span className="text-base sm:text-lg font-normal text-zinc-400">PLN</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-600 font-medium">
                      <span>↗ 5.2% współczynnik konwersji</span>
                    </div>
                  </div>

                  {/* Szmaragdowy mini wykres */}
                  <div className="flex items-end gap-1.5 h-12">
                    <div className="w-1.5 h-6 bg-emerald-500/40 rounded-full" />
                    <div className="w-1.5 h-12 bg-emerald-500 rounded-full" />
                    <div className="w-1.5 h-7 bg-emerald-500/60 rounded-full" />
                    <div className="w-1.5 h-9 bg-emerald-500 rounded-full" />
                    <div className="w-1.5 h-11 bg-emerald-500/80 rounded-full" />
                  </div>
                </div>

              </div>

              {/* ŚRODKOWY WIERSZ: DUŻY WYKRES SPRZEDAŻY + STATUS PAKIETU & DROPU */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* LEWY DUŻY WYKRES: DYNAMIKA SPRZEDAŻY & PRZYCHODU */}
                <div className="lg:col-span-8 bg-white rounded-[24px] p-6 border border-zinc-200/70 shadow-sm flex flex-col justify-between">
                  
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-base font-bold text-[#111827]">
                        Dynamika Sprzedaży & Przychodu
                      </h2>
                      <span className="text-xs text-zinc-400">Wykres tygodniowy transakcji Stripe & BLIK</span>
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                        className="px-3.5 py-1.5 bg-[#111827] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <span>{timeRange}</span>
                        <ChevronDown className="w-3 h-3 text-zinc-300" />
                      </button>

                      {isTimeDropdownOpen && (
                        <div className="absolute right-0 mt-1.5 w-36 bg-white border border-zinc-200 rounded-xl shadow-xl p-1 z-40">
                          {["Ostatnie 30 dni", "2 miesiące", "Cały rok"].map((tr) => (
                            <button
                              key={tr}
                              onClick={() => {
                                setTimeRange(tr);
                                setIsTimeDropdownOpen(false);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span>{tr}</span>
                              {timeRange === tr && <Check className="w-3 h-3 text-[#00DF81]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Słupki wykresu W1–W8 */}
                  <div className="relative pt-6 pb-2">
                    {/* Poziome linie odniesienia */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-zinc-400 pb-6">
                      <div className="border-b border-dashed border-zinc-200/80 w-full pl-8">5 000 PLN</div>
                      <div className="border-b border-dashed border-emerald-300/80 w-full pl-8">Cel: 4 000 PLN</div>
                      <div className="border-b border-dashed border-zinc-200/80 w-full pl-8">3 000 PLN</div>
                      <div className="border-b border-dashed border-zinc-200/80 w-full pl-8">2 000 PLN</div>
                      <div className="border-b border-dashed border-zinc-200/80 w-full pl-8">1 000 PLN</div>
                      <div className="w-full pl-8">0 PLN</div>
                    </div>

                    <div className="grid grid-cols-8 gap-2 sm:gap-3 pl-8 h-48 items-end relative z-10">
                      {weeklySalesData.map((item) => (
                        <div
                          key={item.week}
                          className="flex flex-col items-center justify-end h-full group cursor-pointer"
                        >
                          {item.peak && (
                            <div className="mb-1.5 px-2 py-0.5 bg-[#0C130E] text-[#00DF81] text-[10px] font-bold rounded-lg shadow-md flex items-center gap-1 animate-bounce">
                              <span>Szczyt: {item.peak}</span>
                            </div>
                          )}

                          <div className="flex items-end gap-1 justify-center w-full">
                            {item.past.map((val, idx) => (
                              <div
                                key={idx}
                                style={{ height: `${val * 1.5}px` }}
                                className="w-1 sm:w-1.5 bg-zinc-300 rounded-full transition-all group-hover:bg-zinc-400"
                              />
                            ))}

                            {item.active.map((val, idx) => (
                              <div
                                key={idx}
                                style={{ height: `${val * 1.5}px` }}
                                className={`w-1 sm:w-1.5 rounded-full transition-all ${
                                  idx === 0 && item.week === "W4"
                                    ? "bg-[#0C130E]"
                                    : "bg-[#00DF81] group-hover:brightness-110"
                                }`}
                              />
                            ))}
                          </div>

                          <span className="text-[10px] font-semibold text-zinc-400 mt-2 block">
                            {item.week}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>

                </div>

                {/* PRAWA KARTA: PAKIET SKLEPU & KATEGORIE SPRZEDAŻY */}
                <div className="lg:col-span-4 bg-white rounded-[24px] p-6 border border-zinc-200/70 shadow-sm flex flex-col justify-between">
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Aktywny Pakiet Sklepu
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        Ważny do 21.09
                      </span>
                    </div>

                    <div className="text-3xl font-bold text-[#111827] tracking-tight mt-2">
                      Pakiet {currentStore.planType || user?.plan || "Brand"}
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 mt-1">
                      <span>✓ Nielimitowane produkty i subdomena</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-zinc-100 mt-6">
                    
                    {/* Sprzedaż odzieży */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#111827] block">
                          Odzież & Drop fizyczny
                        </span>
                        <span className="text-xs text-zinc-400 block font-medium">
                          12 400.00 PLN sprzedaży
                        </span>
                      </div>
                    </div>

                    {/* Produkty cyfrowe */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#111827] block">
                          Dropy limitowane & Cyfrowe
                        </span>
                        <span className="text-xs text-zinc-400 block font-medium">
                          1 850.00 PLN sprzedaży
                        </span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

              {/* DOLNY WIERSZ: OSTATNIE ZAMÓWIENIA + GEOGRAFIA SPRZEDAŻY (MAPA) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* LEWA TABELA: OSTATNIE ZAMÓWIENIA KLIENTÓW */}
                <div className="lg:col-span-8 bg-white rounded-[24px] p-6 border border-zinc-200/70 shadow-sm flex flex-col justify-between">
                  
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-base font-bold text-[#111827]">
                          Ostatnie Zamówienia w Sklepie
                        </h2>
                        <span className="text-xs text-zinc-400">Płatności przetworzone przez Stripe i BLIK</span>
                      </div>

                      <button
                        onClick={() => setActiveTab("zamowienia")}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
                      >
                        Zobacz wszystkie →
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[11px] font-medium text-zinc-400 border-b border-zinc-100 pb-2">
                            <th className="pb-3 font-medium">Klient & Kraj</th>
                            <th className="pb-3 font-medium">Produkt</th>
                            <th className="pb-3 font-medium">Płatność</th>
                            <th className="pb-3 font-medium">Trend</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Kwota</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-xs">
                          {[
                            { flag: "🇵🇱", email: "kacper.nowak@gmail.com", country: "Polska", product: "Boxy Hoodie Black", method: "BLIK / Stripe", trend: "up", status: "Opłacone", amount: "249.00 PLN" },
                            { flag: "🇩🇪", email: "johan.m@berlin.de", country: "Niemcy", product: "Vintage Tee Acid Wash", method: "Karta Visa", trend: "up", status: "Opłacone", amount: "139.00 PLN" },
                            { flag: "🇵🇱", email: "oliwia.ziel@wp.pl", country: "Polska", product: "Tech Cargo Pants", method: "BLIK P24", trend: "up", status: "Opłacone", amount: "299.00 PLN" },
                            { flag: "🇬🇧", email: "alex.uk@london.co.uk", country: "Wielka Brytania", product: "Drop Special Package", method: "Apple Pay", trend: "down", status: "Opłacone", amount: "389.00 PLN" },
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                              <td className="py-3.5 pr-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-lg">{row.flag}</span>
                                  <div>
                                    <span className="font-bold text-[#111827] block leading-tight">
                                      {row.email}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 block">
                                      {row.country}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 pr-3 font-semibold text-zinc-800">
                                {row.product}
                              </td>

                              <td className="py-3.5 pr-3 text-zinc-500">
                                {row.method}
                              </td>

                              <td className="py-3.5 pr-3">
                                <div className="w-16 h-5">
                                  <svg viewBox="0 0 80 24" className="w-full h-full">
                                    <path
                                      d={row.trend === "up" ? "M0,18 Q25,14 45,6 T80,2" : "M0,6 Q25,10 45,18 T80,22"}
                                      fill="none"
                                      stroke={row.trend === "up" ? "#00DF81" : "#F43F5E"}
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </div>
                              </td>

                              <td className="py-3.5 pr-3">
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  {row.status}
                                </span>
                              </td>

                              <td className="py-3.5 pr-3 font-bold text-[#111827] font-mono whitespace-nowrap">
                                {row.amount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>

                </div>

                {/* PRAWA KARTA: GEOGRAFIA SPRZEDAŻY (MAPA WEKTOROWA) */}
                <div className="lg:col-span-4 bg-[#0C1510] text-white rounded-[24px] p-6 border border-[#16271D] shadow-sm flex flex-col justify-between relative overflow-hidden">
                  
                  <div className="flex items-center justify-between mb-2 z-10">
                    <div>
                      <h2 className="text-base font-bold text-white">
                        Geografia Zamówień
                      </h2>
                      <span className="text-xs text-zinc-400">Polska & Europa</span>
                    </div>

                    <span className="px-2.5 py-1 bg-white text-[#111827] text-xs font-semibold rounded-xl shadow-sm">
                      Europa Środkowa
                    </span>
                  </div>

                  {/* Wektorowa Mapa SVG */}
                  <div className="relative w-full h-56 flex items-center justify-center my-2">
                    <svg viewBox="0 0 400 300" className="w-full h-full object-contain filter drop-shadow-md">
                      {/* Kraje Europy Zachodniej */}
                      <path
                        d="M60,140 Q80,100 120,90 Q150,80 180,100 Q190,130 160,160 Q120,180 80,170 Z"
                        fill="#152B1E"
                        stroke="#234530"
                        strokeWidth="1"
                      />
                      <path
                        d="M100,50 Q130,40 160,60 Q150,90 120,90 Q90,80 100,50 Z"
                        fill="#152B1E"
                        stroke="#234530"
                        strokeWidth="1"
                      />
                      <path
                        d="M120,180 Q160,170 190,190 Q180,240 140,230 Q110,210 120,180 Z"
                        fill="#152B1E"
                        stroke="#234530"
                        strokeWidth="1"
                      />
                      
                      {/* Polska i Europa Środkowa - Rozświetlona neonową zielenią */}
                      <path
                        d="M180,100 Q240,80 290,110 Q320,150 280,200 Q220,210 170,180 Q160,140 180,100 Z"
                        fill="#00DF81"
                        className="opacity-90 transition-opacity hover:opacity-100 cursor-pointer"
                      />
                      <path
                        d="M250,130 Q300,120 340,150 Q330,190 280,190 Z"
                        fill="#059669"
                        className="opacity-80"
                      />

                      {/* Pingi zamówień */}
                      <circle cx="230" cy="140" r="4" fill="#FFFFFF" />
                      <circle cx="230" cy="140" r="10" fill="none" stroke="#FFFFFF" strokeWidth="1" className="animate-ping opacity-75" />
                    </svg>

                    {/* Dymek ze statystykami Polski */}
                    {activeMapTooltip && (
                      <div className="absolute top-8 left-4 bg-[#18271C]/90 backdrop-blur-md border border-[#2B4733] rounded-xl px-3 py-2 shadow-2xl flex items-center gap-3">
                        <div>
                          <span className="text-[11px] font-bold text-white block leading-tight">
                            Polska
                          </span>
                          <span className="text-[10px] text-zinc-400 block">
                            Główny rynek
                          </span>
                        </div>
                        <span className="text-xs font-bold text-[#00DF81]">
                          92% sprzedaży ↗
                        </span>
                      </div>
                    )}

                    {/* Przycisk Pomocy ? */}
                    <button
                      onClick={() => setActiveMapTooltip(!activeMapTooltip)}
                      className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-[#121D15] hover:bg-[#1A2A1E] border border-[#1C2E20] flex items-center justify-center text-zinc-400 text-xs font-bold transition-colors cursor-pointer"
                    >
                      ?
                    </button>
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
                  <h2 className="text-lg font-bold text-[#111827]">Lista Produktów w Sklepie ({storeProducts.length})</h2>
                  <p className="text-xs text-zinc-500">Zarządzaj ubraniami, dropami, stanem magazynowym i cenami.</p>
                </div>
                <button
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-[#00DF81]" />
                  <span>Dodaj Nowy Produkt</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {storeProducts.map((p) => (
                  <div key={p.id} className="bg-white border border-zinc-200/80 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-48 rounded-xl overflow-hidden bg-zinc-100 relative">
                      <img src={p.image || (p.images && p.images[0])} alt={p.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-black/80 backdrop-blur-md text-white">
                        {p.price}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#111827] truncate">{p.name}</h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1">{p.description}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                      <span className="text-xs text-zinc-500 font-medium">Stan: <strong className="text-zinc-800">{p.stock || 50} szt.</strong></span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Edytuj
                        </button>
                        {deleteProduct && (
                          <button
                            onClick={() => deleteProduct(p.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg cursor-pointer"
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
                <h2 className="text-lg font-bold text-[#111827]">Wszystkie Zamówienia</h2>
                <p className="text-xs text-zinc-500">Historia zamówień ze Stripe, BLIK i szybkich przelewów.</p>
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                    <tr>
                      <th className="p-4">ID Zamówienia</th>
                      <th className="p-4">Klient (E-mail)</th>
                      <th className="p-4">Produkt</th>
                      <th className="p-4">Kwota</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700">
                    {storeOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-zinc-50">
                        <td className="p-4 font-mono font-bold text-zinc-500">{ord.id.slice(0, 10)}</td>
                        <td className="p-4 font-bold text-zinc-900">{ord.customerEmail || "klient@email.com"}</td>
                        <td className="p-4">{ord.productTitle || "Boxy Hoodie Black"}</td>
                        <td className="p-4 font-bold font-mono text-[#111827]">
                          {(ord.amountTotalCents / 100).toFixed(2)} PLN
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Opłacone
                          </span>
                        </td>
                        <td className="p-4 text-zinc-500">{new Date(ord.createdAt).toLocaleDateString("pl-PL")}</td>
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
                <h2 className="text-lg font-bold text-[#111827]">Pakiety Platformy i Ważność Sklepu</h2>
                <p className="text-xs text-zinc-500">Wybierz odpowiedni pakiet dla swojej marki lub przedłuż aktywny plan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pakiet Start */}
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
                  <div>
                    <span className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold uppercase">14 Dni Gratis</span>
                    <h3 className="text-lg font-bold text-[#111827] mt-3">Pakiet Start</h3>
                    <p className="text-xs text-zinc-500 mt-1">Darmowy test konfiguratora sklepu.</p>
                    <div className="text-2xl font-bold text-[#111827] font-mono mt-4">0 PLN <span className="text-xs font-normal text-zinc-500">/ 14 dni</span></div>
                    <ul className="mt-6 space-y-2.5 text-xs text-zinc-600">
                      <li>✓ Subdomena .iskral.pl</li>
                      <li>✓ Podstawowy kreator sklepu</li>
                      <li>✓ Do 3 produktów</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => buyPlan && buyPlan("Start", "miesiac")}
                    className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Aktywuj 14 Dni Gratis
                  </button>
                </div>

                {/* Pakiet Creator */}
                <div className="bg-white border-2 border-[#00DF81] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#00DF81] text-[#0C130E] text-[9px] font-bold px-3 py-0.5 rounded-bl-lg">
                    POPULARNY
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold uppercase">Polecany</span>
                    <h3 className="text-lg font-bold text-[#111827] mt-3">Pakiet Creator</h3>
                    <p className="text-xs text-zinc-500 mt-1">Dla rosnących marek i twórców.</p>
                    <div className="text-2xl font-bold text-[#111827] font-mono mt-4">49.90 PLN <span className="text-xs font-normal text-zinc-500">/ mies.</span></div>
                    <ul className="mt-6 space-y-2.5 text-xs text-zinc-600">
                      <li>✓ Własna subdomena .iskral.pl</li>
                      <li>✓ Do 25 produktów</li>
                      <li>✓ Płatności Stripe & BLIK</li>
                      <li>✓ Statystyki i analityka</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => buyPlan && buyPlan("Creator", "miesiac")}
                    className="w-full py-2.5 bg-[#00DF81] hover:bg-[#00c774] text-[#0C130E] font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    Kup Pakiet Creator
                  </button>
                </div>

                {/* Pakiet Brand */}
                <div className="bg-[#0C1510] text-white border border-[#16271D] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
                  <div>
                    <span className="px-2.5 py-0.5 bg-[#18291C] text-[#00DF81] rounded-full text-[10px] font-bold uppercase border border-[#263F2C]">Pełna Moc</span>
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
                    className="w-full py-2.5 bg-white hover:bg-zinc-100 text-[#111827] font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
                <h2 className="text-lg font-bold text-[#111827]">Kreator i Wygląd Sklepu: {currentStore.name}</h2>
                <p className="text-xs text-zinc-500">Dostosuj nazwę, subdomenę, szablon graficzny i ogłoszenia.</p>
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-5 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1.5">Nazwa Sklepu</label>
                    <input
                      type="text"
                      defaultValue={currentStore.name}
                      onChange={(e) => updateStoreConfig && updateStoreConfig({ name: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#00DF81]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-700 block mb-1.5">Subdomena (.iskral.pl)</label>
                    <input
                      type="text"
                      defaultValue={currentStore.subdomain}
                      onChange={(e) => updateStoreConfig && updateStoreConfig({ subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#00DF81]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">Pasek Ogłoszeń (Announcement Bar)</label>
                  <input
                    type="text"
                    defaultValue={currentStore.announcement}
                    onChange={(e) => updateStoreConfig && updateStoreConfig({ announcement: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#00DF81]"
                  />
                </div>

                {/* Wybór Szablonu */}
                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-2">Szablon Graficzny Sklepu</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { name: "Dark Vibe", desc: "Mroczny streetwear z neonowymi akcentami" },
                      { name: "Minimal Clean", desc: "Czysty minimalizm i duże zdjęcia" },
                      { name: "Cyber Drop", desc: "Futurystyczny szablon z zegarem dropu" },
                    ].map((tpl) => (
                      <button
                        key={tpl.name}
                        type="button"
                        onClick={() => updateStoreConfig && updateStoreConfig({ template: tpl.name })}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          currentStore.template === tpl.name
                            ? "bg-emerald-50/50 border-[#00DF81] text-[#111827]"
                            : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        }`}
                      >
                        <span className="font-bold text-xs block">{tpl.name}</span>
                        <span className="text-[11px] text-zinc-500 block mt-1">{tpl.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <a
                    href={liveStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Otwórz Sklep Live</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setMessage && setMessage({ type: "success", text: "Zapisano konfigurację sklepu!" })}
                    className="px-6 py-2.5 bg-[#111827] hover:bg-black text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
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
                <h2 className="text-lg font-bold text-[#111827]">Tryb Dropu i Odliczanie</h2>
                <p className="text-xs text-zinc-500">Zablokuj sklep i wyświetl odliczanie do premiery kolekcji.</p>
              </div>

              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                  <div>
                    <span className="text-xs font-bold text-zinc-900 block">Włącz tryb odliczania do dropu</span>
                    <span className="text-[11px] text-zinc-500">Klienci zobaczą zegar zamiast standardowej listy produktów</span>
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
                    className="w-5 h-5 accent-[#00DF81] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 block mb-1.5">Data i Godzina Premiery</label>
                  <input
                    type="datetime-local"
                    defaultValue={currentStore.dropConfig?.targetDate || "2026-09-01T20:00"}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#00DF81]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setMessage && setMessage({ type: "success", text: "Zapisano ustawienia trybu dropu!" })}
                    className="px-6 py-2.5 bg-[#111827] hover:bg-black text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Zapisz Tryb Dropu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* WIDOK 7: USTAWIENIA */}
          {/* ========================================================================= */}
          {activeTab === "ustawienia" && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-bold text-[#111827]">Ustawienia Konta, Domeny i Wypłat</h2>
                <p className="text-xs text-zinc-500">Zarządzaj swoimi danymi, bezpieczeństwem i wypłatami środków.</p>
              </div>

              {/* Dane Profilowe */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#111827] border-b border-zinc-100 pb-2">Profil Użytkownika</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Imię i Nazwisko</label>
                    <input
                      type="text"
                      defaultValue={user?.name || "Twórca Marki"}
                      onChange={(e) => updateUserProfile && updateUserProfile({ name: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#00DF81]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">E-mail</label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || "klient@iskral.pl"}
                      className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Własna Domena DNS */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#111827] border-b border-zinc-100 pb-2">Własna Domena</h3>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Adres Domeny (np. twojamarka.pl)</label>
                  <input
                    type="text"
                    defaultValue={currentStore.customDomain || ""}
                    placeholder="twojamarka.pl"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#00DF81]"
                  />
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600">
                  <p className="font-bold text-zinc-800">Rekord DNS CNAME:</p>
                  <p>Typ: <strong>CNAME</strong> | Host: <strong>@ / www</strong> | Wartość: <strong>cname.iskral.pl</strong></p>
                </div>
              </div>

              {/* Wypłaty IBAN */}
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-[#111827] border-b border-zinc-100 pb-2">Wypłata Środków ze Sprzedaży</h3>
                <div>
                  <span className="text-xs text-zinc-500 block">Dostępne Saldo</span>
                  <span className="text-2xl font-bold text-zinc-900 font-mono">{totalRevenuePLN} PLN</span>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Numer Rachunku Bankowego (IBAN)</label>
                  <input
                    type="text"
                    placeholder="PL 00 0000 0000 0000 0000 0000 0000"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:border-[#00DF81]"
                  />
                </div>
                <button
                  onClick={() => {
                    if (requestPayoutWithIBAN) requestPayoutWithIBAN(1000, "PL000000000000000000000000");
                    if (setMessage) setMessage({ type: "success", text: "Zlecono wypłatę środków na rachunek bankowy!" });
                  }}
                  className="px-5 py-2.5 bg-[#111827] hover:bg-black text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Zleć Wypłatę na Konto
                </button>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: DODAWANIE / EDYCJA PRODUKTU */}
      {/* ========================================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0C130E] border border-[#17241A] rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  className="w-full bg-[#121D15] border border-[#1C2E20] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00DF81]"
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
                    className="w-full bg-[#121D15] border border-[#1C2E20] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00DF81]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Stan Magazynowy</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="w-full bg-[#121D15] border border-[#1C2E20] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00DF81]"
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
                  className="w-full bg-[#121D15] border border-[#1C2E20] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00DF81]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Opis Produktu</label>
                <textarea
                  rows={3}
                  placeholder="Opisz materiał, krój, rozmiarówkę..."
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full bg-[#121D15] border border-[#1C2E20] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#00DF81]"
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
                  className="px-6 py-2.5 bg-[#00DF81] hover:bg-[#00c774] text-[#0C130E] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
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
          <div className="bg-[#0C130E] border border-[#17241A] rounded-3xl p-6 sm:p-8 max-w-md w-full text-white space-y-5 shadow-2xl">
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
                  className="w-full bg-[#121D15] border border-[#1C2E20] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00DF81]"
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
                  className="w-full bg-[#121D15] border border-[#1C2E20] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00DF81]"
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
                  className="px-6 py-2.5 bg-[#00DF81] hover:bg-[#00c774] text-[#0C130E] font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md"
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
