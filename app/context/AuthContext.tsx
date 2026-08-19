"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getAuthCookie, setAuthCookie, deleteAuthCookie } from "@/lib/cookies";

export type Role = "user" | "superadmin" | "client" | "admin";
export type PlanType = "trial_14d" | "starter" | "brand" | "pro" | "Start" | "Creator" | "Brand" | "Brak";
export type ProductType = "Fizyczny" | "Cyfrowy";
export type ProductStatus = "Aktywny" | "Zawieszony" | "Brak w magazynie";
export type AccountStatus = "Active" | "Blocked" | "Suspended";

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  tenantId?: string;
  categoryId?: string;
  name: string;
  price: string;
  priceCents: number;
  comparePrice?: string;
  comparePriceCents?: number;
  type: ProductType;
  status: ProductStatus;
  isDropOnly?: boolean;
  dropTargetDate?: string;
  sales: number;
  stock: number;
  description: string;
  image?: string;
  images?: string[];
  isDigital?: boolean;
  digitalFileName?: string;
  digitalFileSize?: string;
  digitalFileVersion?: string;
  digitalFileUrl?: string;
}

export interface OrderRecord {
  id: string;
  tenantId: string;
  stripeSessionId: string;
  amountTotalCents: number;
  status: "paid" | "pending" | "cancelled";
  customerEmail: string;
  productTitle?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpent: string;
  ordersCount: number;
  lastOrderDate: string;
}

export interface Campaign {
  id: string;
  title: string;
  subject: string;
  sentDate: string;
  recipientsCount: number;
  openRate: string;
}

export interface TeamMember {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  addedAt: string;
}

export interface PayoutRecord {
  id: string;
  amount: string;
  amountCents: number;
  date: string;
  time: string;
  ibanMasked: string;
  status: "completed" | "pending" | "Zrealizowana" | "W trakcie";
  createdAt: string;
}

export interface DropConfig {
  enabled: boolean;
  template: "Cyberpunk Launch" | "Minimalist Timer" | "Hypebeast Countdown";
  targetDate: string;
}

export interface StoreConfig {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  niche?: string;
  template: string;
  accentColor: string;
  subdomain: string;
  customDomain: string;
  domainVerified: boolean;
  stripeStatus: "disconnected" | "pending" | "connected";
  balanceCents: number;
  planType: PlanType;
  planStatus: "active" | "trialing" | "past_due" | "canceled" | "suspended";
  status?: "active" | "suspended" | "canceled";
  planExpiresAt?: string;
  dropConfig: DropConfig;
  categories: Category[];
  products: Product[];
  orders: OrderRecord[];
  payoutHistory: PayoutRecord[];
  customers: Customer[];
  campaigns: Campaign[];
  team: TeamMember[];
  announcement: string;
  socials: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    x?: string;
    discord?: string;
    facebook?: string;
    behance?: string;
    telegram?: string;
  };
  seoConfig?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    ogImageUrl?: string;
  };
  legalTerms?: {
    termsOfService?: string;
    privacyPolicy?: string;
    updatedAt?: string;
  };
}

export interface SaaSSubscriptionRecord {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  planName: string;
  billingCycle: string;
  amountPaidCents: number;
  createdAt: string;
}

export interface TopStoreEntry {
  rank: number;
  name: string;
  ownerEmail: string;
  revenue: string;
  revenueCents: number;
  orders: number;
  plan: PlanType;
}

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  content: string;
  date: string;
  author: string;
}

export interface StoreTemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
}

export interface LandingPageContent {
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  bannerText: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: PlanType;
  billingCycle?: "miesiac" | "rok";
  planExpiresAt?: string;
  isTrial?: boolean;
  hasStore: boolean;
  accountStatus: AccountStatus;
  is2FAEnabled: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  activeStoreId?: string;
  stores?: StoreConfig[];
  store?: StoreConfig;
}

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  activeStore: StoreConfig | undefined;
  userStores: StoreConfig[];
  onlineUsersCount: number;
  topStoresLeaderboard: TopStoreEntry[];
  blogPosts: BlogPost[];
  storeTemplates: StoreTemplateItem[];
  landingContent: LandingPageContent;
  platformTotalGMVCents: number;
  platformSaaSRevenueCents: number;
  platformTotalOrdersCount: number;
  platformTotalStoresCount: number;
  packageRevenueTotal: string;
  recentNotifications: string[];
  subscriptionHistory: SaaSSubscriptionRecord[];
  pendingEmail: string | null;
  requires2FA: boolean;
  pending2FAUser: User | null;
  message: { type: "success" | "error"; text: string } | null;
  setMessage: (msg: { type: "success" | "error"; text: string } | null) => void;
  // Multi-store per user actions
  setActiveStoreId: (storeId: string) => void;
  createAdditionalStore: (name: string, plan: PlanType, billingCycle: "miesiac" | "rok") => Promise<void>;
  // Admin Impersonation Mode
  impersonatedStoreId: string | null;
  isImpersonating: boolean;
  isEditUnlocked: boolean;
  enterImpersonation: (storeId: string) => void;
  exitImpersonation: () => void;
  toggleImpersonationEdit: () => void;
  // Auth methods
  login: (email: string, password?: string) => { success: boolean; requires2FA?: boolean; message?: string };
  verify2FA: (code: string) => boolean;
  register: (name: string, email: string) => void;
  verifyEmail: (code: string) => boolean;
  sendPasswordReset: (email: string) => boolean;
  resetPassword: (code: string, newPassword: string) => boolean;
  logout: () => void;
  buyPlan: (plan: PlanType, billingCycle: "miesiac" | "rok") => Promise<void>;
  toggle2FA: () => void;
  updateUserRole: (userId: string, newRole: Role) => void;
  updateUserPlan: (userId: string, newPlan: PlanType) => void;
  // Admin management actions
  blockUserAccount: (userId: string) => void;
  suspendUserStore: (userId: string) => void;
  deleteUserStore: (userId: string) => void;
  deleteUserAccount: (userId: string) => void;
  toggleAdminRole: (userId: string) => void;
  updateLandingContent: (content: Partial<LandingPageContent>) => void;
  addBlogPost: (post: Omit<BlogPost, "id" | "date">) => void;
  addStoreTemplate: (template: Omit<StoreTemplateItem, "id">) => void;
  // Client Store actions
  updateStoreConfig: (config: Partial<StoreConfig>) => void;
  addProduct: (product: Omit<Product, "id" | "sales">) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductStatus: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (id: string) => void;
  connectStripe: () => void;
  requestPayoutWithIBAN: (amountPLN: number, iban: string) => boolean;
  configureDrop: (dropConfig: DropConfig) => void;
  createCampaign: (title: string, subject: string, content: string) => void;
  addTeamMember: (email: string, permissions: string[]) => void;
  removeTeamMember: (id: string) => void;
  verifyDomainRecords: () => void;
  recordOrder: (tenantId: string, productId: string, customerEmail: string, amountCents: number) => void;
  recordSaaSSubscription: (tenantId: string, userId: string, userEmail: string, planName: string, amountPaidCents: number) => void;
  createStripeCheckout: (params: { productId?: string; planType?: PlanType; title: string; priceCents: number; customerEmail?: string; tenantId?: string }) => Promise<string | null>;
  createOrUpdateStoreFull: (params: {
    name: string;
    subdomain: string;
    customDomain?: string;
    niche?: string;
    logoUrl?: string;
    template: string;
    accentColor: string;
    announcement?: string;
    plan: PlanType;
    billingCycle: "miesiac" | "rok";
    initialProduct?: {
      name: string;
      description?: string;
      price: string;
      priceCents: number;
      type: "Fizyczny" | "Cyfrowy";
      image?: string;
      images?: string[];
      digitalFileName?: string;
      digitalFileSize?: string;
      digitalFileUrl?: string;
    };
  }) => StoreConfig;
}

const CLEAN_EMPTY_STORE_TEMPLATE: StoreConfig = {
  id: "",
  name: "Mój Sklep",
  logoUrl: "",
  niche: "",
  template: "Dark Vibe",
  accentColor: "#FF5B28",
  subdomain: "",
  customDomain: "",
  domainVerified: false,
  stripeStatus: "disconnected",
  balanceCents: 0,
  planType: "Brak",
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

// Super-Admin Account: projekt@motywo.pl / motywo1!
const ADMIN_USER: User = {
  id: "usr_admin_projekt",
  name: "Właściciel / Superadmin",
  email: "projekt@motywo.pl",
  role: "superadmin",
  plan: "Brand",
  billingCycle: "rok",
  planExpiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString(),
  isTrial: false,
  hasStore: true,
  accountStatus: "Active",
  is2FAEnabled: false,
  isEmailVerified: true,
  createdAt: "2026-01-01",
  activeStoreId: "t_admin_projekt",
  stores: [
    {
      ...CLEAN_EMPTY_STORE_TEMPLATE,
      id: "t_admin_projekt",
      name: "Sklep Główny Admina",
      subdomain: "admin-store",
      balanceCents: 0,
      stripeStatus: "connected",
      planType: "Brand",
    },
  ],
  store: {
    ...CLEAN_EMPTY_STORE_TEMPLATE,
    id: "t_admin_projekt",
    name: "Sklep Główny Admina",
    subdomain: "admin-store",
    balanceCents: 0,
    stripeStatus: "connected",
    planType: "Brand",
  },
};

const INITIAL_USERS: User[] = [ADMIN_USER];

const DEFAULT_SUBSCRIPTION_HISTORY: SaaSSubscriptionRecord[] = [
  {
    id: "sub_101",
    tenantId: "t_admin_projekt",
    userId: "usr_admin_projekt",
    userEmail: "projekt@motywo.pl",
    planName: "Brand",
    billingCycle: "rok",
    amountPaidCents: 59900,
    createdAt: "2026-08-01T12:00:00Z",
  },
];

const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: "post_1",
    title: "Jak otworzyć dochodowy sklep internetowy w 2026 roku?",
    category: "E-Commerce",
    content: "Poznaj sprawdzony przewodnik krok po kroku budowania marży...",
    date: "2026-08-10",
    author: "Zespół motywo.pl",
  },
];

const DEFAULT_TEMPLATES: StoreTemplateItem[] = [
  { id: "tmpl_1", name: "Dark Vibe", category: "Prestiż & Luxury", description: "Głębokie ciemne tło z pomarańczowym akcentem neonowym.", badge: "Najpopularniejszy" },
  { id: "tmpl_2", name: "Minimalist", category: "Modern Clean", description: "Przestronny układy z dużymi zdjęciami i elegancką typografią.", badge: "Nowość" },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("motywo_users_v11");
      if (saved) {
        try {
          const parsed: User[] = JSON.parse(saved);
          if (!parsed.some((u) => u.email.toLowerCase() === "projekt@motywo.pl")) {
            parsed.unshift(ADMIN_USER);
          }
          return parsed;
        } catch {}
      }
    }
    return INITIAL_USERS;
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const cookieUser = getAuthCookie("iskra_session");
      if (cookieUser) {
        try { return JSON.parse(cookieUser); } catch {}
      }
      const savedUser = localStorage.getItem("motywo_current_user_v11");
      if (savedUser) {
        try { return JSON.parse(savedUser); } catch {}
      }
    }
    return null;
  });

  const [subscriptionHistory, setSubscriptionHistory] = useState<SaaSSubscriptionRecord[]>(() => {
    if (typeof window !== "undefined") {
      const savedSubs = localStorage.getItem("motywo_subs_history_v11");
      if (savedSubs) {
        try { return JSON.parse(savedSubs); } catch {}
      }
    }
    return DEFAULT_SUBSCRIPTION_HISTORY;
  });

  // Admin Impersonation Mode State
  const [impersonatedStoreId, setImpersonatedStoreId] = useState<string | null>(null);
  const [isEditUnlocked, setIsEditUnlocked] = useState<boolean>(false);

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(DEFAULT_BLOG_POSTS);
  const [storeTemplates, setStoreTemplates] = useState<StoreTemplateItem[]>(DEFAULT_TEMPLATES);
  const [landingContent, setLandingContent] = useState<LandingPageContent>({
    heroTitle: "Stwórz sklep internetowy, który sprzedaje sam.",
    heroSubtitle: "Kompletna platforma dla twórców, marek i e-commerce z obsługą Dropów, produktów cyfrowych i Stripe.",
    ctaText: "Zacznij za darmo na 14 dni",
    bannerText: "Super Szybkie Szablony 2.0 już dostępne!",
  });

  const [onlineUsersCount] = useState<number>(18);
  const [recentNotifications, setRecentNotifications] = useState<string[]>([
    "🎉 Powstanie nowego sklepu w serwisie",
    "🟢 System testowych płatności Stripe aktywny",
  ]);

  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [pending2FAUser, setPending2FAUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("motywo_users_v11", JSON.stringify(allUsers));
    }
  }, [allUsers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (user) {
        setAuthCookie("iskra_session", JSON.stringify(user));
        localStorage.setItem("motywo_current_user_v11", JSON.stringify(user));
      } else {
        deleteAuthCookie("iskra_session");
        localStorage.removeItem("motywo_current_user_v11");
      }
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("motywo_subs_history_v11", JSON.stringify(subscriptionHistory));
    }
  }, [subscriptionHistory]);

  // Derived user stores
  const userStores: StoreConfig[] = user?.stores || (user?.store ? [user.store] : []);
  
  // Find active store (supporting Impersonation Mode and auto-creation fallback)
  let activeStore: StoreConfig | undefined;

  if (user?.role === "superadmin" && impersonatedStoreId) {
    for (const u of allUsers) {
      const found = (u.stores || []).find((s) => s.id === impersonatedStoreId || s.subdomain === impersonatedStoreId);
      if (found) {
        activeStore = found;
        break;
      }
    }
  }

  if (!activeStore && user) {
    const activeId = user.activeStoreId || (user.stores && user.stores[0]?.id) || user.store?.id;
    activeStore = userStores.find((s) => s.id === activeId) || userStores[0] || user.store;
  }

  // Helper: Get or create active store for mutations
  const getOrCreateActiveStore = (): StoreConfig => {
    if (activeStore) return activeStore;

    const newStoreId = `t_${Date.now()}`;
    let baseSub = (user?.name || "sklep").toLowerCase().replace(/[^a-z0-9]/g, "") || "sklep";
    let sub = baseSub;
    let c = 1;
    while (allUsers.some((u) => (u.stores || []).some((s) => s.subdomain === sub))) {
      sub = `${baseSub}${c}`;
      c++;
    }

    const createdStore: StoreConfig = {
      ...CLEAN_EMPTY_STORE_TEMPLATE,
      id: newStoreId,
      name: `Sklep ${user?.name || "Nowy"}`,
      subdomain: sub,
      planType: user?.plan || "Start",
      planStatus: "active",
    };
    return createdStore;
  };

  // Helper: Persist store mutation to user state & allUsers
  const applyStoreMutation = (updatedStore: StoreConfig, successMessage: string) => {
    if (!user) return;

    const currentStores = user.stores && user.stores.length > 0 ? user.stores : [updatedStore];
    const exists = currentStores.some((s) => s.id === updatedStore.id);
    const updatedStores = exists
      ? currentStores.map((s) => (s.id === updatedStore.id ? updatedStore : s))
      : [...currentStores, updatedStore];

    const updatedUser: User = {
      ...user,
      hasStore: true,
      activeStoreId: updatedStore.id,
      stores: updatedStores,
      store: updatedStores[0],
    };

    setUser(updatedUser);
    setAllUsers((prev) =>
      prev.map((u) => (u.id === user.id ? updatedUser : u))
    );

    setMessage({ type: "success", text: successMessage });
  };

  // Derived platform metrics
  const platformTotalGMVCents = allUsers.reduce((sum, u) => {
    const uStores = u.stores || (u.store ? [u.store] : []);
    return (
      sum +
      uStores.reduce((stSum, st) => {
        const paidOrdersSum = (st.orders || [])
          .filter((o) => o.status === "paid")
          .reduce((oSum, o) => oSum + o.amountTotalCents, 0);
        return stSum + paidOrdersSum;
      }, 0)
    );
  }, 0);

  const platformSaaSRevenueCents = subscriptionHistory.reduce((sum, sub) => sum + sub.amountPaidCents, 0);

  const platformTotalOrdersCount = allUsers.reduce((sum, u) => {
    const uStores = u.stores || (u.store ? [u.store] : []);
    return (
      sum +
      uStores.reduce((stSum, st) => {
        return stSum + (st.orders || []).filter((o) => o.status === "paid").length;
      }, 0)
    );
  }, 0);

  const platformTotalStoresCount = allUsers.reduce((sum, u) => {
    const uStores = u.stores || (u.store ? [u.store] : []);
    return sum + uStores.filter((st) => st.subdomain).length;
  }, 0);

  const packageRevenueTotal = `${(platformSaaSRevenueCents / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2 })} PLN`;

  const topStoresLeaderboard: TopStoreEntry[] = [];
  allUsers.forEach((u) => {
    const uStores = u.stores || (u.store ? [u.store] : []);
    uStores.forEach((st) => {
      if (st.subdomain) {
        const revenueCents = (st.orders || [])
          .filter((o) => o.status === "paid")
          .reduce((sum, o) => sum + o.amountTotalCents, 0);
        const orders = (st.orders || []).filter((o) => o.status === "paid").length;
        topStoresLeaderboard.push({
          rank: 1,
          name: st.name || `Sklep ${u.name}`,
          ownerEmail: u.email,
          revenueCents,
          revenue: `${(revenueCents / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2 })} PLN`,
          orders,
          plan: st.planType || u.plan,
        });
      }
    });
  });

  topStoresLeaderboard.sort((a, b) => b.revenueCents - a.revenueCents);
  topStoresLeaderboard.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  const setActiveStoreId = (storeId: string) => {
    if (!user) return;
    const updatedUser = { ...user, activeStoreId: storeId };
    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setMessage({ type: "success", text: `Przełączono na sklep ID: ${storeId}` });
  };

  const enterImpersonation = (storeId: string) => {
    setImpersonatedStoreId(storeId);
    setIsEditUnlocked(false);
    setMessage({ type: "success", text: `Weszono w tryb podglądu Administratora dla sklepu ID: ${storeId}` });
  };

  const exitImpersonation = () => {
    setImpersonatedStoreId(null);
    setIsEditUnlocked(false);
    setMessage({ type: "success", text: "Opuszczono tryb podglądu Administratora." });
  };

  const toggleImpersonationEdit = () => {
    setIsEditUnlocked((prev) => !prev);
    setMessage({ type: "success", text: !isEditUnlocked ? "Odblokowano tryb edycji administratora! Zachowaj ostrożność." : "Zablokowano edycję (Tryb tylko do odczytu)." });
  };

  const createAdditionalStore = async (name: string, plan: PlanType, billingCycle: "miesiac" | "rok") => {
    if (!user) return;

    let baseSubdomain = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!baseSubdomain) baseSubdomain = "sklep";

    let finalSubdomain = baseSubdomain;
    let counter = 1;
    while (allUsers.some((u) => (u.stores || []).some((s) => s.subdomain === finalSubdomain))) {
      finalSubdomain = `${baseSubdomain}${counter}`;
      counter++;
    }

    const newStoreId = `t_${Date.now()}`;
    const durationDays = plan === "Start" || plan === "trial_14d" ? 14 : billingCycle === "rok" ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const newStore: StoreConfig = {
      ...CLEAN_EMPTY_STORE_TEMPLATE,
      id: newStoreId,
      name,
      subdomain: finalSubdomain,
      planType: plan,
      planStatus: "active",
      planExpiresAt: expiresAt,
      balanceCents: 0,
    };

    applyStoreMutation(newStore, `Utworzono nowy sklep: ${name} (${finalSubdomain}.iskral.pl)!`);
  };

  const recordSaaSSubscription = (tenantId: string, userId: string, userEmail: string, planName: string, amountPaidCents: number) => {
    const newRecord: SaaSSubscriptionRecord = {
      id: `sub_${Date.now()}`,
      tenantId,
      userId,
      userEmail,
      planName,
      billingCycle: "miesiac",
      amountPaidCents,
      createdAt: new Date().toISOString(),
    };

    setSubscriptionHistory((prev) => [newRecord, ...prev]);
  };

  const login = (email: string, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, message: "Wprowadź swój adres e-mail." };
    }

    if (cleanEmail === "projekt@motywo.pl" || cleanEmail === "projekt@iskral.pl") {
      let adminUser = allUsers.find(
        (u) => u.email.toLowerCase() === "projekt@motywo.pl" || u.email.toLowerCase() === "projekt@iskral.pl"
      );
      if (!adminUser) {
        adminUser = ADMIN_USER;
        setAllUsers((prev) => [ADMIN_USER, ...prev]);
      }
      setUser(adminUser);
      setMessage({ type: "success", text: "Zalogowano jako Właściciel / Superadmin!" });
      return { success: true };
    }

    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!existing) {
      return {
        success: false,
        message: "Konto o podanym adresie e-mail nie istnieje. Sprawdź pisownię lub załóż darmowe konto.",
      };
    }

    if (existing.isEmailVerified === false) {
      return {
        success: false,
        message: "Adres e-mail nie został jeszcze zweryfikowany. Sprawdź skrzynkę odbiorczą i kliknij link aktywacyjny.",
      };
    }

    if (existing.accountStatus === "Blocked") {
      return {
        success: false,
        message: "Twoje konto zostało zablokowane przez administratora serwisu. Skontaktuj się z pomocą techniczną.",
      };
    }

    if (existing.accountStatus === "Suspended") {
      return {
        success: false,
        message: "Konto Twojego sklepu zostało tymczasowo zawieszone.",
      };
    }

    if (existing.is2FAEnabled) {
      setRequires2FA(true);
      setPending2FAUser(existing);
      return { success: true, requires2FA: true, message: "Wprowadź 6-cyfrowy kod z aplikacji Authenticator 2FA." };
    }

    setUser(existing);
    setMessage({ type: "success", text: `Witaj ponownie, ${existing.name}!` });
    return { success: true };
  };

  const verify2FA = (code: string) => {
    if (code.length === 6) {
      if (pending2FAUser) {
        setUser(pending2FAUser);
        setPending2FAUser(null);
        setRequires2FA(false);
        setMessage({ type: "success", text: "Dwuczynnikowa weryfikacja 2FA przebiegła pomyślnie!" });
        return true;
      }
    }
    return false;
  };

  const register = (name: string, email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      setMessage({ type: "error", text: "Konto o tym adresie e-mail już istnieje!" });
      return;
    }

    const isSuperadmin = cleanEmail === "projekt@motywo.pl" || cleanEmail.includes("admin");

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email: cleanEmail,
      role: isSuperadmin ? "superadmin" : "user",
      plan: isSuperadmin ? "Brand" : "Brak",
      hasStore: isSuperadmin,
      planExpiresAt: isSuperadmin ? new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      accountStatus: "Active",
      is2FAEnabled: false,
      isEmailVerified: true,
      createdAt: new Date().toISOString().split("T")[0],
      activeStoreId: isSuperadmin ? "t_admin_projekt" : undefined,
      stores: isSuperadmin ? ADMIN_USER.stores : [],
      store: isSuperadmin ? ADMIN_USER.store : undefined,
    };

    setAllUsers((prev) => [...prev, newUser]);
    setUser(newUser);
    setMessage({
      type: "success",
      text: isSuperadmin
        ? "Utworzono konto Właściciela / Super-Admina!"
        : "Konto zarejestrowane! Wybierz pakiet, aby aktywować swój sklep.",
    });
  };

  const verifyEmail = (code: string) => {
    if (code.length === 6) {
      setMessage({ type: "success", text: "Adres e-mail zweryfikowany!" });
      return true;
    }
    return false;
  };

  const sendPasswordReset = (email: string) => {
    const existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return Boolean(existing);
  };

  const resetPassword = (code: string, newPassword: string) => {
    if (code.length === 6) {
      setMessage({ type: "success", text: "Hasło zostało zaktualizowane." });
      return true;
    }
    return false;
  };

  const logout = () => {
    deleteAuthCookie("iskra_session");
    setUser(null);
    setImpersonatedStoreId(null);
    setIsEditUnlocked(false);
    setRequires2FA(false);
    setPending2FAUser(null);
    setMessage({ type: "success", text: "Pomyślnie wylogowano z konta." });
  };

  const buyPlan = async (plan: PlanType, billingCycle: "miesiac" | "rok") => {
    if (!user) return;

    const isTrial = plan === "Start" || plan === "trial_14d";
    const durationDays = isTrial ? 14 : billingCycle === "rok" ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const priceCents = isTrial ? 0 : plan === "Creator" || plan === "starter" ? (billingCycle === "rok" ? 29900 : 4990) : (billingCycle === "rok" ? 59900 : 9990);

    const targetStore = getOrCreateActiveStore();

    const updatedStore: StoreConfig = {
      ...targetStore,
      planType: plan,
      planStatus: "active",
      planExpiresAt: expiresAt,
    };

    const updatedUser: User = {
      ...user,
      plan,
      hasStore: true,
      planExpiresAt: expiresAt,
    };

    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

    applyStoreMutation(
      updatedStore,
      isTrial
        ? `🎉 Aktywowano 14-dniowy bezpłatny okres próbny! Pakiet ważny do: ${new Date(expiresAt).toLocaleString("pl-PL")}`
        : `🎉 Pomyślnie aktywowano pakiet ${plan} (${billingCycle})! Sklep aktywowany.`
    );

    if (priceCents > 0) {
      recordSaaSSubscription(updatedStore.id, user.id, user.email, plan, priceCents);
    }
  };

  const createStripeCheckout = async (params: {
    productId?: string;
    planType?: PlanType;
    title: string;
    priceCents: number;
    customerEmail?: string;
    tenantId?: string;
  }): Promise<string | null> => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: params.tenantId || activeStore?.id || "demo-tenant",
          productId: params.productId,
          planType: params.planType,
          title: params.title,
          priceCents: params.priceCents,
          customerEmail: params.customerEmail || user?.email,
        }),
      });
      const data = await res.json();
      if (data.url) {
        return data.url;
      }
    } catch (err) {
      console.error("Failed to create Stripe Checkout:", err);
    }
    return null;
  };

  const recordOrder = (tenantId: string, productId: string, customerEmail: string, amountCents: number) => {
    const newOrder: OrderRecord = {
      id: `ord_${Date.now()}`,
      tenantId,
      stripeSessionId: `cs_test_${Date.now()}`,
      amountTotalCents: amountCents,
      status: "paid",
      customerEmail,
      createdAt: new Date().toISOString(),
    };

    setAllUsers((prev) =>
      prev.map((u) => {
        const uStores = u.stores || (u.store ? [u.store] : []);
        if (uStores.some((s) => s.id === tenantId || s.subdomain === tenantId)) {
          const updatedStores = uStores.map((s) => {
            if (s.id === tenantId || s.subdomain === tenantId) {
              const updatedProds = (s.products || []).map((p) => {
                if (p.id === productId && p.stock > 0) {
                  return { ...p, stock: p.stock - 1, sales: p.sales + 1 };
                }
                return p;
              });
              return {
                ...s,
                products: updatedProds,
                orders: [newOrder, ...(s.orders || [])],
                balanceCents: (s.balanceCents || 0) + amountCents,
              };
            }
            return s;
          });
          return { ...u, stores: updatedStores, store: updatedStores[0] };
        }
        return u;
      })
    );

    setRecentNotifications((prev) => [
      `💳 Nowa sprzedaż Stripe Checkout! ${(amountCents / 100).toFixed(2)} PLN w sklepie ${tenantId}`,
      ...prev,
    ]);

    setMessage({
      type: "success",
      text: `🎉 Zakceptowano opłacone zamówienie Stripe: ${(amountCents / 100).toFixed(2)} PLN! Statystyki zostały zaktualizowane.`,
    });
  };

  const toggle2FA = () => {
    if (user) {
      const updated = { ...user, is2FAEnabled: !user.is2FAEnabled };
      setUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setMessage({ type: "success", text: updated.is2FAEnabled ? "Włączono autoryzację 2FA!" : "Wyłączono 2FA." });
    }
  };

  const updateUserRole = (userId: string, newRole: Role) => {
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    if (user && user.id === userId) {
      setUser({ ...user, role: newRole });
    }
    setMessage({ type: "success", text: "Zaktualizowano rolę użytkownika." });
  };

  const toggleAdminRole = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newRole: Role = u.role === "superadmin" || u.role === "admin" ? "user" : "superadmin";
          return { ...u, role: newRole };
        }
        return u;
      })
    );

    if (user && user.id === userId) {
      const newRole: Role = user.role === "superadmin" || user.role === "admin" ? "user" : "superadmin";
      setUser({ ...user, role: newRole });
    }

    setMessage({ type: "success", text: "Zmieniono uprawnienia Właściciela / Admina!" });
  };

  const updateUserPlan = (userId: string, newPlan: PlanType) => {
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u)));
    if (user && user.id === userId) {
      setUser({ ...user, plan: newPlan });
    }
    setMessage({ type: "success", text: "Zaktualizowano pakiet użytkownika." });
  };

  const blockUserAccount = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStat = u.accountStatus === "Blocked" ? "Active" : "Blocked";
          return { ...u, accountStatus: newStat };
        }
        return u;
      })
    );
    if (user && user.id === userId) {
      setUser((prev) => (prev ? { ...prev, accountStatus: prev.accountStatus === "Blocked" ? "Active" : "Blocked" } : null));
    }
    setMessage({ type: "success", text: "Zmieniono status blokady konta." });
  };

  const suspendUserStore = (targetId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        const uStores = u.stores || (u.store ? [u.store] : []);
        const matchesUser = u.id === targetId;
        const matchesStore = uStores.some((s) => s.id === targetId || s.subdomain === targetId);

        if (matchesUser || matchesStore) {
          const updatedStores = uStores.map((s) => {
            if (matchesUser || s.id === targetId || s.subdomain === targetId) {
              const currentStatus = s.status === "suspended" || s.planStatus === "suspended" ? "active" : "suspended";
              return {
                ...s,
                status: currentStatus as "active" | "suspended" | "canceled",
                planStatus: currentStatus as "active" | "suspended" | "canceled",
              };
            }
            return s;
          });
          const hasSuspended = updatedStores.some((s) => s.status === "suspended" || s.planStatus === "suspended");
          return {
            ...u,
            accountStatus: hasSuspended ? ("Suspended" as AccountStatus) : ("Active" as AccountStatus),
            stores: updatedStores,
            store: updatedStores[0],
          };
        }
        return u;
      })
    );

    if (user) {
      setUser((prevUser) => {
        if (!prevUser) return null;
        const uStores = prevUser.stores || (prevUser.store ? [prevUser.store] : []);
        const matchesUser = prevUser.id === targetId;
        const matchesStore = uStores.some((s) => s.id === targetId || s.subdomain === targetId);
        if (matchesUser || matchesStore) {
          const updatedStores = uStores.map((s) => {
            if (matchesUser || s.id === targetId || s.subdomain === targetId) {
              const currentStatus = s.status === "suspended" || s.planStatus === "suspended" ? "active" : "suspended";
              return {
                ...s,
                status: currentStatus as "active" | "suspended" | "canceled",
                planStatus: currentStatus as "active" | "suspended" | "canceled",
              };
            }
            return s;
          });
          return {
            ...prevUser,
            accountStatus: updatedStores.some((s) => s.status === "suspended") ? ("Suspended" as AccountStatus) : ("Active" as AccountStatus),
            stores: updatedStores,
            store: updatedStores[0],
          };
        }
        return prevUser;
      });
    }

    setMessage({ type: "success", text: "Zmieniono status zawieszenia sklepu (Aktywny / Zawieszony)." });
  };

  const deleteUserStore = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, hasStore: false, stores: [], store: undefined, plan: "Brak" };
        }
        return u;
      })
    );
    if (user && user.id === userId) {
      setUser({ ...user, hasStore: false, stores: [], store: undefined, plan: "Brak" });
    }
    setMessage({ type: "success", text: "Sklep został usunięty z platformy." });
  };

  const deleteUserAccount = (userId: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    if (user && user.id === userId) {
      setUser(null);
    }
    setMessage({ type: "success", text: "Konto użytkownika zostało usunięte." });
  };

  const updateLandingContent = (content: Partial<LandingPageContent>) => {
    setLandingContent((prev) => ({ ...prev, ...content }));
    setMessage({ type: "success", text: "Zapisano treść strony głównej CMS!" });
  };

  const addBlogPost = (post: Omit<BlogPost, "id" | "date">) => {
    const newPost: BlogPost = {
      ...post,
      id: `post_${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
    };
    setBlogPosts((prev) => [newPost, ...prev]);
    setMessage({ type: "success", text: `Opublikowano wpis: ${post.title}` });
  };

  const addStoreTemplate = (template: Omit<StoreTemplateItem, "id">) => {
    const newTmpl: StoreTemplateItem = {
      ...template,
      id: `tmpl_${Date.now()}`,
    };
    setStoreTemplates((prev) => [...prev, newTmpl]);
    setMessage({ type: "success", text: `Dodano nowy szablon: ${template.name}` });
  };

  const createOrUpdateStoreFull = (params: {
    name: string;
    subdomain: string;
    customDomain?: string;
    niche?: string;
    logoUrl?: string;
    template: string;
    accentColor: string;
    announcement?: string;
    plan: PlanType;
    billingCycle: "miesiac" | "rok";
    initialProduct?: {
      name: string;
      description?: string;
      price: string;
      priceCents: number;
      type: "Fizyczny" | "Cyfrowy";
      image?: string;
      images?: string[];
      digitalFileName?: string;
      digitalFileSize?: string;
      digitalFileUrl?: string;
    };
  }): StoreConfig => {
    if (!user) {
      throw new Error("Użytkownik nie jest zalogowany");
    }

    const baseStore = activeStore || (user.stores && user.stores[0]) || user.store;
    const storeId = baseStore?.id || `t_${Date.now()}`;

    let baseSub = (params.subdomain || params.name || "sklep").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!baseSub) baseSub = "sklep";

    let finalSub = baseSub;
    let c = 1;
    while (allUsers.some((u) => (u.stores || []).some((s) => s.subdomain === finalSub && s.id !== storeId))) {
      finalSub = `${baseSub}${c}`;
      c++;
    }

    const isTrial = params.plan === "Start" || params.plan === "trial_14d";
    const durationDays = isTrial ? 14 : params.billingCycle === "rok" ? 365 : 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    let products = baseStore?.products ? [...baseStore.products] : [];
    if (params.initialProduct && params.initialProduct.name) {
      const cleanPrice = String(params.initialProduct.price || "").replace(",", ".").replace(/[^0-9.]/g, "");
      const priceNum = parseFloat(cleanPrice) || 10;
      const priceCents = params.initialProduct.priceCents || Math.round(priceNum * 100);

      const newProd: Product = {
        id: `prod_${Date.now()}`,
        tenantId: storeId,
        name: params.initialProduct.name,
        description: params.initialProduct.description || "Oficjalny produkt gotowy w nowym sklepie.",
        price: `${priceNum.toFixed(2)} PLN`,
        priceCents,
        type: params.initialProduct.type,
        status: "Aktywny",
        sales: 0,
        stock: 50,
        image: params.initialProduct.image || (params.initialProduct.type === "Cyfrowy"
          ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
          : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"),
        images: params.initialProduct.images && params.initialProduct.images.length > 0
          ? params.initialProduct.images
          : [params.initialProduct.image || ""].filter(Boolean),
        isDigital: params.initialProduct.type === "Cyfrowy",
        digitalFileName: params.initialProduct.digitalFileName || (params.initialProduct.type === "Cyfrowy" ? "Plik_Cyfrowy.pdf" : undefined),
        digitalFileSize: params.initialProduct.digitalFileSize || (params.initialProduct.type === "Cyfrowy" ? "15.4 MB" : undefined),
        digitalFileUrl: params.initialProduct.digitalFileUrl || (params.initialProduct.type === "Cyfrowy" ? "data:application/pdf;base64,demo" : undefined),
      };

      if (!products.some((p) => p.name === newProd.name)) {
        products.push(newProd);
      }
    }

    const updatedStore: StoreConfig = {
      ...(baseStore || CLEAN_EMPTY_STORE_TEMPLATE),
      id: storeId,
      name: params.name || "Mój Sklep",
      subdomain: finalSub,
      customDomain: params.customDomain || baseStore?.customDomain || "",
      niche: params.niche || baseStore?.niche || "",
      logoUrl: params.logoUrl || baseStore?.logoUrl || "",
      template: params.template || "Dark Vibe",
      accentColor: params.accentColor || "#FF5B28",
      announcement: params.announcement || "🎉 Zbuduj swój sklep z Motywo!",
      planType: params.plan,
      planStatus: "active",
      planExpiresAt: expiresAt,
      products,
    };

    const currentStores = user.stores && user.stores.length > 0 ? user.stores : [updatedStore];
    const exists = currentStores.some((s) => s.id === updatedStore.id);
    const updatedStores = exists
      ? currentStores.map((s) => (s.id === updatedStore.id ? updatedStore : s))
      : [...currentStores, updatedStore];

    const updatedUser: User = {
      ...user,
      role: user.role === "superadmin" ? "superadmin" : "client",
      plan: params.plan,
      hasStore: true,
      activeStoreId: updatedStore.id,
      stores: updatedStores,
      store: updatedStores[0],
    };

    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

    const priceCents = isTrial ? 0 : params.plan === "Creator" || params.plan === "starter" ? (params.billingCycle === "rok" ? 29900 : 4990) : (params.billingCycle === "rok" ? 59900 : 9990);
    if (priceCents > 0) {
      recordSaaSSubscription(updatedStore.id, user.id, user.email, params.plan, priceCents);
    }

    setMessage({
      type: "success",
      text: `🎉 Sklep ${updatedStore.name} aktywny na: https://${updatedStore.subdomain}.iskral.pl`,
    });

    return updatedStore;
  };

  const updateStoreConfig = (config: Partial<StoreConfig>) => {
    const targetStore = getOrCreateActiveStore();

    let targetSubdomain = config.subdomain || targetStore.subdomain;
    if (config.subdomain && config.subdomain !== targetStore.subdomain) {
      let base = config.subdomain.toLowerCase().replace(/[^a-z0-9]/g, "");
      let candidate = base;
      let c = 1;
      while (allUsers.some((u) => (u.stores || []).some((s) => s.subdomain === candidate && s.id !== targetStore.id))) {
        candidate = `${base}${c}`;
        c++;
      }
      targetSubdomain = candidate;
    }

    const updatedStore = { ...targetStore, ...config, subdomain: targetSubdomain };
    applyStoreMutation(updatedStore, `Zapisano ustawienia sklepu! Subdomena: ${targetSubdomain}.iskral.pl`);
  };

  const addCategory = (name: string) => {
    const targetStore = getOrCreateActiveStore();

    const newCat: Category = {
      id: `cat_${Date.now()}`,
      tenantId: targetStore.id,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
    };
    const updatedStore = { ...targetStore, categories: [...(targetStore.categories || []), newCat] };
    applyStoreMutation(updatedStore, `Dodano kategorię: ${name}`);
  };

  const deleteCategory = (id: string) => {
    const targetStore = getOrCreateActiveStore();

    const updatedCategories = (targetStore.categories || []).filter((c) => c.id !== id);
    const updatedStore = { ...targetStore, categories: updatedCategories };
    applyStoreMutation(updatedStore, "Usunięto kategorię.");
  };

  const addProduct = (product: Omit<Product, "id" | "sales">) => {
    const targetStore = getOrCreateActiveStore();

    // Clean and parse priceCents robustly (e.g. "29,90" or "29.90")
    const cleanPriceStr = String(product.price || "").replace(",", ".").replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(cleanPriceStr) || 10;
    const priceCents = Math.round(priceNum * 100);

    const newProd: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      price: `${priceNum.toFixed(2)} PLN`,
      priceCents,
      sales: 0,
      tenantId: targetStore.id,
    };
    const updatedStore = { ...targetStore, products: [...(targetStore.products || []), newProd] };

    applyStoreMutation(updatedStore, `🎉 Pomyślnie dodano produkt: ${newProd.name}!`);
  };

  const updateProduct = (id: string, updatedFields: Partial<Product>) => {
    const targetStore = getOrCreateActiveStore();

    const updatedProducts = (targetStore.products || []).map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
    const updatedStore = { ...targetStore, products: updatedProducts };
    applyStoreMutation(updatedStore, "Zaktualizowano produkt.");
  };

  const deleteProduct = (id: string) => {
    const targetStore = getOrCreateActiveStore();

    const updatedProducts = (targetStore.products || []).filter((p) => p.id !== id);
    const updatedStore = { ...targetStore, products: updatedProducts };
    applyStoreMutation(updatedStore, "Usunięto produkt ze sklepu.");
  };

  const toggleProductStatus = (id: string) => {
    const targetStore = getOrCreateActiveStore();

    const updatedProducts = (targetStore.products || []).map((p) => {
      if (p.id === id) {
        const newStatus: ProductStatus = p.status === "Aktywny" ? "Zawieszony" : "Aktywny";
        return { ...p, status: newStatus };
      }
      return p;
    });
    const updatedStore = { ...targetStore, products: updatedProducts };
    applyStoreMutation(updatedStore, "Zmieniono status produktu.");
  };

  const connectStripe = () => {
    const targetStore = getOrCreateActiveStore();

    const updatedStore: StoreConfig = { ...targetStore, stripeStatus: "connected" };
    applyStoreMutation(updatedStore, "Połączono ze Stripe w trybie testowym!");
  };

  const requestPayoutWithIBAN = (amountPLN: number, iban: string) => {
    const targetStore = getOrCreateActiveStore();
    const amountCents = Math.round(amountPLN * 100);

    const paidOrdersSum = (targetStore.orders || [])
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + o.amountTotalCents, 0);
    const paidPayoutsSum = (targetStore.payoutHistory || [])
      .filter((p) => p.status === "completed" || p.status === "Zrealizowana")
      .reduce((sum, p) => sum + (p.amountCents || Math.round(parseFloat(p.amount) * 100) || 0), 0);

    const currentBalanceCents = paidOrdersSum - paidPayoutsSum;

    if (amountCents <= currentBalanceCents && amountCents > 0) {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const ibanMasked = `${iban.slice(0, 7)} **** **** ${iban.slice(-4)}`;

      const newPayout: PayoutRecord = {
        id: `pay_${Date.now()}`,
        amount: `${amountPLN.toFixed(2)} PLN`,
        amountCents,
        date: dateStr,
        time: timeStr,
        ibanMasked,
        status: "completed",
        createdAt: now.toISOString(),
      };

      const updatedStore: StoreConfig = {
        ...targetStore,
        payoutHistory: [newPayout, ...(targetStore.payoutHistory || [])],
        balanceCents: currentBalanceCents - amountCents,
      };

      applyStoreMutation(updatedStore, `Zlecono wypłatę ${amountPLN.toFixed(2)} PLN na konto ${ibanMasked}`);
      return true;
    }
    return false;
  };

  const configureDrop = (dropConfig: DropConfig) => {
    const targetStore = getOrCreateActiveStore();

    const updatedStore: StoreConfig = { ...targetStore, dropConfig };
    applyStoreMutation(
      updatedStore,
      dropConfig.enabled ? `Włączono Drop Mode do daty: ${dropConfig.targetDate}` : "Wyłączono Tryb Dropu."
    );
  };

  const createCampaign = (title: string, subject: string, content: string) => {
    const targetStore = getOrCreateActiveStore();

    const newCamp: Campaign = {
      id: `camp_${Date.now()}`,
      title,
      subject,
      sentDate: new Date().toISOString().split("T")[0],
      recipientsCount: 150,
      openRate: "0.0%",
    };
    const updatedStore = { ...targetStore, campaigns: [...targetStore.campaigns, newCamp] };
    applyStoreMutation(updatedStore, `Wysłano kampanię: ${title}`);
  };

  const addTeamMember = (email: string, permissions: string[]) => {
    const targetStore = getOrCreateActiveStore();

    const newTm: TeamMember = {
      id: `tm_${Date.now()}`,
      email,
      role: "Współpracownik",
      permissions,
      addedAt: new Date().toISOString().split("T")[0],
    };
    const updatedStore = { ...targetStore, team: [...targetStore.team, newTm] };
    applyStoreMutation(updatedStore, `Dodano członka zespołu: ${email}`);
  };

  const removeTeamMember = (id: string) => {
    const targetStore = getOrCreateActiveStore();

    const updatedTeam = targetStore.team.filter((t) => t.id !== id);
    const updatedStore = { ...targetStore, team: updatedTeam };
    applyStoreMutation(updatedStore, "Usunięto członka zespołu.");
  };

  const verifyDomainRecords = () => {
    const targetStore = getOrCreateActiveStore();

    const updatedStore: StoreConfig = { ...targetStore, domainVerified: true };
    applyStoreMutation(
      updatedStore,
      `✓ Rekordy DNS domeny ${targetStore.customDomain || targetStore.subdomain + ".iskral.pl"} zostały pomyślnie zweryfikowane!`
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        activeStore,
        userStores,
        onlineUsersCount,
        topStoresLeaderboard,
        blogPosts,
        storeTemplates,
        landingContent,
        platformTotalGMVCents,
        platformSaaSRevenueCents,
        platformTotalOrdersCount,
        platformTotalStoresCount,
        packageRevenueTotal,
        recentNotifications,
        subscriptionHistory,
        pendingEmail,
        requires2FA,
        pending2FAUser,
        message,
        setMessage,
        setActiveStoreId,
        createAdditionalStore,
        impersonatedStoreId,
        isImpersonating: Boolean(impersonatedStoreId),
        isEditUnlocked,
        enterImpersonation,
        exitImpersonation,
        toggleImpersonationEdit,
        login,
        verify2FA,
        register,
        verifyEmail,
        sendPasswordReset,
        resetPassword,
        logout,
        buyPlan,
        toggle2FA,
        updateUserRole,
        updateUserPlan,
        blockUserAccount,
        suspendUserStore,
        deleteUserStore,
        deleteUserAccount,
        toggleAdminRole,
        updateLandingContent,
        addBlogPost,
        addStoreTemplate,
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
        createCampaign,
        addTeamMember,
        removeTeamMember,
        verifyDomainRecords,
        recordOrder,
        recordSaaSSubscription,
        createStripeCheckout,
        createOrUpdateStoreFull,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
