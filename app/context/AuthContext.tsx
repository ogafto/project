"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, isSupabaseConfigured, upsertStoreInSupabase } from "@/lib/supabase";
import { getAuthCookie, setAuthCookie, deleteAuthCookie } from "@/lib/cookies";
import { hasFeatureAccess, PlanFeatureConfig, getStoreLifecycleDates } from "@/lib/plans";
import {
  safeSetItem,
  safeGetItem,
  safeRemoveItem,
  safeSessionSetItem,
  safeSessionGetItem,
  safeSessionRemoveItem,
  isSubdomainHost,
} from "@/lib/storage";

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
  variants?: string[];
  isClothing?: boolean;
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
  storeId?: string;
  stripeSessionId: string;
  amountTotalCents: number;
  totalAmount?: string;
  status: "paid" | "shipped" | "completed" | "pending" | "cancelled" | string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  shippingType?: "paczkomat" | "courier" | "digital" | string;
  shippingAddress?: string;
  paczkomatCode?: string;
  shippingDetails?: {
    method?: string;
    paczkomat?: string;
    address?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  items?: Array<{
    productId?: string;
    title?: string;
    quantity?: number;
    amountCents?: number;
    selectedVariant?: string;
  }>;
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
  ownerId?: string;
  ownerEmail?: string;
  visitsCount?: number;
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
  plan?: string;
  planType: PlanType;
  planStatus: "active" | "trialing" | "past_due" | "canceled" | "suspended";
  status?: "active" | "suspended" | "canceled";
  expires_at?: string;
  expiresAt?: string;
  planExpiresAt?: string;
  trialEndsAt?: string;
  gracePeriodEndsAt?: string;
  dropConfig: DropConfig;
  categories: Category[];
  products: Product[];
  orders: OrderRecord[];
  payoutHistory: PayoutRecord[];
  customers: Customer[];
  campaigns: Campaign[];
  team: TeamMember[];
  announcement: string;
  showSocials?: boolean;
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
  createdAt?: string;
}

export interface ServicePackage {
  id: string;
  number: number;
  title: string;
  planType: PlanType;
  status: "Nieprzypisany" | "Przypisany";
  assignedStoreId?: string;
  assignedStoreName?: string;
  assignedSubdomain?: string;
  expiresAt: string;
  createdAt: string;
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
  avatarUrl?: string;
  avatar_url?: string;
  phone?: string;
  address?: {
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
  };
  services?: ServicePackage[];
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
  pendingOTPCode: string | null;
  requires2FA: boolean;
  pending2FAUser: User | null;
  message: { type: "success" | "error" | "warning"; text: string } | null;
  setMessage: (msg: { type: "success" | "error" | "warning"; text: string } | null) => void;
  hasAccess: (featureKey: keyof PlanFeatureConfig) => boolean;
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
  sendOTP: (email: string) => Promise<boolean>;
  login: (email: string, password?: string) => Promise<{ success: boolean; requires2FA?: boolean; requiresOTP?: boolean; message?: string }>;
  verify2FA: (code: string) => Promise<boolean> | boolean;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  verifyEmail: (code: string) => Promise<boolean> | boolean;
  sendPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (code: string, newPassword: string, emailOverride?: string) => Promise<boolean>;
  logout: () => void;
  buyPlan: (plan: PlanType, billingCycle: "miesiac" | "rok") => Promise<void>;
  updateUserProfile: (data: Partial<User>) => void;
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
  createStripeCheckout: (params: {
    productId?: string;
    planType?: PlanType;
    title: string;
    priceCents: number;
    customerEmail?: string;
    tenantId?: string;
    storeId?: string;
    userId?: string;
    action?: string;
    packageId?: string;
    billingCycle?: "miesiac" | "rok";
  }) => Promise<string | null>;
  createOrUpdateStoreFull: (params: {
    serviceId?: string;
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

// Super-Admin Account: projekt@iskral.pl / iskral1!
const ADMIN_USER: User = {
  id: "usr_admin_projekt",
  name: "Administrator",
  email: "projekt@iskral.pl",
  role: "superadmin",
  plan: "Brak",
  billingCycle: "miesiac",
  isTrial: false,
  hasStore: false,
  accountStatus: "Active",
  is2FAEnabled: false,
  isEmailVerified: true,
  createdAt: "2026-01-01",
  services: [],
  stores: [],
  store: undefined,
};

const INITIAL_USERS: User[] = [ADMIN_USER];

const DEFAULT_SUBSCRIPTION_HISTORY: SaaSSubscriptionRecord[] = [];

const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: "post_1",
    title: "Jak otworzyć dochodowy sklep internetowy w 2026 roku?",
    category: "E-Commerce",
    content: "Poznaj sprawdzony przewodnik krok po kroku budowania marży...",
    date: "2026-08-10",
    author: "Zespół iskral.pl",
  },
];

const DEFAULT_TEMPLATES: StoreTemplateItem[] = [
  { id: "tmpl_1", name: "Dark Vibe", category: "Prestiż & Luxury", description: "Głębokie ciemne tło z pomarańczowym akcentem neonowym.", badge: "Najpopularniejszy" },
  { id: "tmpl_2", name: "Minimalist", category: "Modern Clean", description: "Przestronny układy z dużymi zdjęciami i elegancką typografią.", badge: "Nowość" },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(false);

  // Load auth state safely after client mount (eliminates SSR hydration mismatch & mobile session drops)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Na publicznych subdomenach sklepów nie wczytujemy ani nie modyfikujemy stanu sesji twórcy
    if (isSubdomainHost()) {
      setIsAuthLoaded(true);
      return;
    }

    try {
      // 1. Wczytaj allUsers
      let loadedUsers: User[] = INITIAL_USERS;
      const cookieAllUsers = getAuthCookie("iskra_all_users");
      if (cookieAllUsers) {
        try {
          const parsed = JSON.parse(cookieAllUsers);
          if (Array.isArray(parsed) && parsed.length > 0) loadedUsers = parsed;
        } catch {}
      }
      if (loadedUsers.length <= 1) {
        const saved = safeGetItem("iskra_users_v12");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) loadedUsers = parsed;
          } catch {}
        }
      }
      setAllUsers(loadedUsers);

      // 2. Wczytaj bieżącego użytkownika (sesja)
      let loadedUser: User | null = null;
      const cookieUser = getAuthCookie("iskra_session");
      if (cookieUser) {
        try {
          const parsed = JSON.parse(cookieUser);
          if (parsed && parsed.email) loadedUser = parsed;
        } catch {}
      }
      if (!loadedUser) {
        const savedUser = safeGetItem("iskra_current_user_v12");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed && parsed.email) loadedUser = parsed;
          } catch {}
        }
      }
      if (loadedUser) {
        const emailKey = loadedUser.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const uKey = loadedUser.id || emailKey;
        const cachedAvatar = safeGetItem(`iskra_user_avatar_${emailKey}`) || safeGetItem(`iskra_user_avatar_${uKey}`);
        if (cachedAvatar) {
          loadedUser.avatarUrl = cachedAvatar;
          loadedUser.avatar_url = cachedAvatar;
        }
        setUser(loadedUser);
      }
    } catch (err) {
      console.warn("[Auth] Initialization warning:", err);
    } finally {
      setIsAuthLoaded(true);
    }
  }, []);

  const [subscriptionHistory, setSubscriptionHistory] = useState<SaaSSubscriptionRecord[]>(() => {
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

  const [pendingEmail, setPendingEmailState] = useState<string | null>(() => {
    if (typeof window !== "undefined") return safeSessionGetItem("iskra_pending_email");
    return null;
  });
  const [pendingOTPCode, setPendingOTPCodeState] = useState<string | null>(() => {
    if (typeof window !== "undefined") return safeSessionGetItem("iskra_pending_otp");
    return null;
  });
  const [pendingUserToVerify, setPendingUserToVerifyState] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const stored = safeSessionGetItem("iskra_pending_user");
      try { return stored ? JSON.parse(stored) : null; } catch (e) { return null; }
    }
    return null;
  });

  const setPendingEmail = (email: string | null) => {
    setPendingEmailState(email);
    if (typeof window !== "undefined") {
      if (email) safeSessionSetItem("iskra_pending_email", email);
      else safeSessionRemoveItem("iskra_pending_email");
    }
  };

  const setPendingOTPCode = (code: string | null) => {
    setPendingOTPCodeState(code);
    if (typeof window !== "undefined") {
      if (code) safeSessionSetItem("iskra_pending_otp", code);
      else safeSessionRemoveItem("iskra_pending_otp");
    }
  };

  const setPendingUserToVerify = (u: User | null) => {
    setPendingUserToVerifyState(u);
    if (typeof window !== "undefined") {
      if (u) safeSessionSetItem("iskra_pending_user", JSON.stringify(u));
      else safeSessionRemoveItem("iskra_pending_user");
    }
  };

  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [pending2FAUser, setPending2FAUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !isSubdomainHost()) {
      const sanitizedUsers = allUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatarUrl: u.avatarUrl,
        role: u.role,
        accountStatus: u.accountStatus,
        plan: u.plan,
        createdAt: u.createdAt,
      }));
      setAuthCookie("iskra_all_users", JSON.stringify(sanitizedUsers));
      safeSetItem("iskra_users_v12", sanitizedUsers);
    }
  }, [allUsers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isSubdomainHost()) {
        // Na subdomenie nie zapisujemy sesji użytkownika
        return;
      }

      if (user) {
        // Optymalizacja pamięci sesji - tylko niezbędne metadane konta
        const sanitizedSession = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountStatus: user.accountStatus,
          plan: user.plan,
          avatarUrl: user.avatarUrl,
          activeStoreId: user.activeStoreId,
          is2FAEnabled: user.is2FAEnabled,
          isEmailVerified: user.isEmailVerified,
        };

        setAuthCookie("iskra_session", JSON.stringify(sanitizedSession));
        safeSetItem("iskra_current_user_v12", sanitizedSession);

        // Automatyczna synchronizacja profilu i wszystkich sklepów użytkownika do bazy danych Supabase
        fetch("/api/auth/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user, stores: user.stores, services: user.services }),
        }).catch(() => {});

        const storesToSync = user.stores && user.stores.length > 0 ? user.stores : user.store ? [user.store] : [];
        storesToSync.forEach((st) => {
          if (st && st.subdomain) {
            upsertStoreInSupabase(st).catch(() => {});
            fetch("/api/stores/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ store: st, owner_id: user.id }),
            }).catch(() => {});
          }
        });
      } else {
        deleteAuthCookie("iskra_session");
        safeRemoveItem("iskra_current_user_v12");
      }
    }
  }, [user]);

  // Background cross-device sync on load
  useEffect(() => {
    if (!user?.email || isSubdomainHost()) return;
    let isMounted = true;
    const syncUserCrossDevice = async () => {
      try {
        const res = await fetch(`/api/auth/sync-user?email=${encodeURIComponent(user.email)}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.success && data.user) {
            const serverUser: User = data.user;
            setUser((prev) => {
              if (!prev) return serverUser;
              const serverStores = Array.isArray(serverUser.stores) ? serverUser.stores : [];
              const prevStores = Array.isArray(prev.stores) ? prev.stores : [];
              const serverServices = Array.isArray(serverUser.services) ? serverUser.services : [];
              const prevServices = Array.isArray(prev.services) ? prev.services : [];

              const emailKey = prev.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
              const localCachedAvatar = safeGetItem(`iskra_user_avatar_${emailKey}`) || safeGetItem(`iskra_user_avatar_${prev.id}`);
              const resolvedAvatar = serverUser.avatarUrl || serverUser.avatar_url || prev.avatarUrl || prev.avatar_url || localCachedAvatar || undefined;

              // Prevent reference change if data is identical
              if (
                serverStores.length === prevStores.length &&
                serverServices.length === prevServices.length &&
                serverUser.plan === prev.plan &&
                serverUser.role === prev.role &&
                serverUser.name === prev.name &&
                (serverUser.avatarUrl || serverUser.avatar_url) === (prev.avatarUrl || prev.avatar_url)
              ) {
                return prev;
              }

              const mergedStores = serverStores.length > 0 ? serverStores : prevStores;
              const mergedServices = serverServices.length > 0 ? serverServices : prevServices;
              return {
                ...prev,
                ...serverUser,
                avatarUrl: resolvedAvatar,
                avatar_url: resolvedAvatar,
                stores: mergedStores,
                store: mergedStores && mergedStores.length > 0 ? mergedStores[0] : prev.store,
                services: mergedServices,
              };
            });
          }
        }
      } catch (err) {
        console.warn("[AuthContext] Background sync warning:", err);
      }
    };
    syncUserCrossDevice();
    return () => {
      isMounted = false;
    };
  }, [user?.email]);

  useEffect(() => {
    if (typeof window !== "undefined" && !isSubdomainHost()) {
      safeSetItem("iskra_subs_history_v12", subscriptionHistory);
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

    const lifecycle = getStoreLifecycleDates();
    const createdStore: StoreConfig = {
      ...CLEAN_EMPTY_STORE_TEMPLATE,
      id: newStoreId,
      name: `Sklep ${user?.name || "Nowy"}`,
      subdomain: sub,
      planType: user?.plan || "Start",
      planStatus: "trialing",
      trialEndsAt: lifecycle.trialEndsAt,
      gracePeriodEndsAt: lifecycle.gracePeriodEndsAt,
    };
    return createdStore;
  };

  // Helper: Persist store mutation to user state & allUsers
  const applyStoreMutation = (updatedStore: StoreConfig, successMessage: string) => {
    if (!user) return;

    // Asynchronously sync store mutation to Supabase PostgreSQL database
    upsertStoreInSupabase(updatedStore).catch(() => {});
    fetch("/api/stores/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: updatedStore }),
    }).catch(() => {});

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

  const login = async (email: string, password?: string): Promise<{ success: boolean; requires2FA?: boolean; requiresOTP?: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { success: false, message: "Wprowadź swój adres e-mail oraz hasło." };
    }

    // 1. TWARDA WALIDACJA HASŁA PRZEZ SUPABASE AUTH / BEZPIECZNE POŚWIADCZENIA (KROK 1)
    let passwordValid = false;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (!authErr && authData?.user) {
          passwordValid = true;
        } else if (authErr?.message?.toLowerCase().includes("email not confirmed")) {
          return {
            success: false,
            requiresOTP: true,
            message: "Twój adres e-mail wymaga weryfikacji. Kod został przesłany na skrzynkę.",
          };
        }
      } catch (authException: any) {
        console.warn("[Supabase Auth] Login exception:", authException);
      }
    }

    if (!passwordValid) {
      try {
        const verifyRes = await fetch("/api/auth/verify-credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData.valid) {
            passwordValid = true;
          }
        }
      } catch {}
    }

    if (!passwordValid) {
      // BEZWZGLĘDNY STOP: Błędne hasło natychmiast zatrzymuje proces i zabrania przejścia do 2FA!
      return {
        success: false,
        message: "Nieprawidłowy adres e-mail lub hasło.",
      };
    }

    // 2. KROK 2: TYLKO PO POPRAWNYM HAŚLE POBIERZ DANE KONTA
    if (cleanEmail === "projekt@motywo.pl" || cleanEmail === "projekt@iskral.pl") {
      let adminUser = allUsers.find(
        (u) => u.email.toLowerCase() === "projekt@motywo.pl" || u.email.toLowerCase() === "projekt@iskral.pl"
      );
      if (!adminUser) {
        adminUser = ADMIN_USER;
        setAllUsers((prev) => [ADMIN_USER, ...prev]);
      }
      const adminEmailKey = cleanEmail.replace(/[^a-z0-9]/g, "_");
      const adminLocal2FA = typeof window !== "undefined" ? localStorage.getItem(`iskra_2fa_enabled_${adminEmailKey}`) === "true" : false;
      if (adminUser.is2FAEnabled || (adminUser as any)?.two_factor_enabled || adminLocal2FA) {
        setRequires2FA(true);
        setPending2FAUser(adminUser);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("iskra_pending_login_email", cleanEmail);
        }
        return { success: true, requires2FA: true, message: "Konto posiada aktywny Authenticator 2FA. Wprowadź 6-cyfrowy kod." };
      }
      setAuthCookie("iskra_session", JSON.stringify(adminUser));
      setUser(adminUser);
      setMessage({ type: "success", text: "Zalogowano jako Właściciel / Superadmin!" });
      return { success: true };
    }

    let existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!existing) {
      try {
        const res = await fetch(`/api/auth/sync-user?email=${encodeURIComponent(cleanEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            existing = data.user;
            setAllUsers((prev) => {
              const already = prev.some((u) => u.email.toLowerCase() === cleanEmail);
              return already ? prev : [...prev, data.user];
            });
          }
        }
      } catch (err) {
        console.warn("[Auth] Cross-device user fetch error:", err);
      }
    }

    if (!existing) {
      return {
        success: false,
        message: "Nieprawidłowy adres e-mail lub hasło.",
      };
    }

    let targetUser: User = existing;

    try {
      const res = await fetch(`/api/auth/sync-user?email=${encodeURIComponent(cleanEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          targetUser = {
            ...targetUser,
            ...data.user,
            stores: data.stores && data.stores.length > 0 ? data.stores : targetUser.stores,
            services: data.services && data.services.length > 0 ? data.services : targetUser.services,
          };
        }
      }
    } catch {}

    if (targetUser.isEmailVerified === false) {
      setPendingUserToVerify(targetUser);
      setPendingEmail(targetUser.email);
      sendOTP(targetUser.email);
      return {
        success: false,
        requiresOTP: true,
        message: "Twój adres e-mail wymaga weryfikacji. Kod 6-cyfrowy został przesłany na skrzynkę.",
      };
    }

    if (targetUser.accountStatus === "Blocked") {
      return {
        success: false,
        message: "Twoje konto zostało zablokowane przez administratora serwisu. Skontaktuj się z pomocą techniczną.",
      };
    }

    if (targetUser.accountStatus === "Suspended") {
      return {
        success: false,
        message: "Konto Twojego sklepu zostało tymczasowo zawieszone.",
      };
    }

    const userStores = targetUser.stores && targetUser.stores.length > 0 ? targetUser.stores : (targetUser.store ? [targetUser.store] : []);
    const hasStore = userStores.length > 0 || Boolean(targetUser.hasStore);
    const activeStoreId = targetUser.activeStoreId || (userStores.length > 0 ? userStores[0].id : undefined);

    const loggedInUser: User = {
      ...targetUser,
      hasStore,
      stores: userStores,
      store: userStores[0] || targetUser.store,
      activeStoreId,
    };

    const emailKey = cleanEmail.replace(/[^a-z0-9]/g, "_");
    const local2FA = typeof window !== "undefined" ? localStorage.getItem(`iskra_2fa_enabled_${emailKey}`) === "true" : false;
    const is2FAActive = Boolean(targetUser.is2FAEnabled || (targetUser as any)?.two_factor_enabled || local2FA);

    if (is2FAActive) {
      setRequires2FA(true);
      setPending2FAUser(loggedInUser);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("iskra_pending_login_email", cleanEmail);
      }
      return { success: true, requires2FA: true, message: "Konto posiada aktywny Authenticator 2FA. Wprowadź 6-cyfrowy kod." };
    }

    setAuthCookie("iskra_session", JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setAllUsers((prev) => {
      const idx = prev.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = loggedInUser;
        return copy;
      }
      return [...prev, loggedInUser];
    });

    setMessage({ type: "success", text: `Witaj ponownie, ${targetUser.name}!` });
    return { success: true };
  };

  const verify2FA = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().replace(/\s+/g, "");
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) return false;

    const emailToVerify = pending2FAUser?.email || user?.email || (typeof window !== "undefined" ? sessionStorage.getItem("iskra_pending_login_email") : null);
    if (!emailToVerify) return false;

    const emailKey = emailToVerify.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const localSecret = typeof window !== "undefined" ? localStorage.getItem(`iskra_2fa_secret_${emailKey}`) : null;
    const resolvedSecret = (pending2FAUser as any)?.two_factor_secret || (user as any)?.two_factor_secret || localSecret || undefined;

    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToVerify,
          code: cleanCode,
          secret: resolvedSecret,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        let loggedIn = pending2FAUser || user;
        if (!loggedIn) {
          loggedIn = allUsers.find((u) => u.email.toLowerCase() === emailToVerify.toLowerCase()) || {
            id: `usr_${emailKey}`,
            email: emailToVerify,
            name: emailToVerify.split("@")[0],
            role: "user",
            plan: "Start",
            hasStore: false,
            is2FAEnabled: true,
            isEmailVerified: true,
            accountStatus: "Active",
            createdAt: new Date().toISOString(),
          };
        }

        setAuthCookie("iskra_session", JSON.stringify(loggedIn));
        safeSetItem("iskra_current_user_v12", loggedIn);
        setUser(loggedIn);
        setPending2FAUser(null);
        setRequires2FA(false);
        setMessage({ type: "success", text: "Dwuczynnikowa weryfikacja 2FA przebiegła pomyślnie!" });
        return true;
      } else {
        setMessage({ type: "error", text: data.error || "Nieprawidłowy kod 2FA." });
        return false;
      }
    } catch (err) {
      console.error("[2FA verify error]:", err);
      return false;
    }
  };

  const sendOTP = async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    // Kod OTP jest generowany i przechowywany TYLKO po stronie serwera (API)
    // NIE generujemy go tutaj po stronie klienta — to jest bezpieczniejsze
    setPendingEmail(cleanEmail);
    setPendingOTPCode(null); // zawsze czyścimy stary kod

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();

      // NIGDY nie przechowujemy debugCode w stanie — kod jest tylko na emailu
      // data.debugCode jest ignorowane celowo dla bezpieczeństwa

      if (!res.ok || !data.success) {
        console.error("Resend OTP send error:", data.error);
        setMessage({
          type: "warning",
          text: data.error || "Wystąpił problem z doręczeniem wiadomości e-mail. Sprawdź swoją skrzynkę.",
        });
        return true;
      }

      if (data.isEmailSent === false) {
        setMessage({
          type: "warning",
          text: `Nie udało się wysłać e-maila (${data.warning || "nieznany błąd"}). Skontaktuj się z supportem.`,
        });
      } else {
        setMessage({
          type: "success",
          text: `Kod weryfikacyjny został wysłany na adres: ${cleanEmail}. Sprawdź skrzynkę i folder SPAM.`,
        });
      }
      return true;
    } catch (err: any) {
      console.error("Failed to send OTP email:", err);
      setMessage({
        type: "warning",
        text: `Błąd sieci podczas wysyłania e-maila: ${err.message || err}.`,
      });
      return true;
    }
  };

  const register = async (name: string, email: string, password?: string): Promise<boolean> => {
    const cleanEmail = email.toLowerCase().trim();
    setPendingEmail(cleanEmail);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("iskra_pending_email", cleanEmail);
    }

    if (password && isSupabaseConfigured && supabase) {
      try {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: { name: name.trim() },
          },
        });
        if (signUpErr && !signUpErr.message?.toLowerCase().includes("already registered")) {
          console.warn("[Supabase Auth] signUp warning:", signUpErr.message);
        }
      } catch (e) {
        console.warn("[Supabase Auth] signUp exception:", e);
      }
    }

    const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (!existing.isEmailVerified) {
        setPendingUserToVerify(existing);
        const sent = await sendOTP(cleanEmail);
        return sent;
      }
      setMessage({ type: "error", text: "Konto o tym adresie e-mail już istnieje!" });
      return false;
    }

    const isSuperadmin = cleanEmail === "projekt@motywo.pl" || cleanEmail.includes("admin");

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email: cleanEmail,
      role: isSuperadmin ? "superadmin" : "user",
      plan: isSuperadmin ? "Brand" : "Start",
      hasStore: isSuperadmin,
      planExpiresAt: isSuperadmin ? new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      accountStatus: "Active",
      is2FAEnabled: false,
      isEmailVerified: false,
      createdAt: new Date().toISOString().split("T")[0],
      activeStoreId: isSuperadmin ? "t_admin_projekt" : undefined,
      stores: isSuperadmin ? ADMIN_USER.stores : [],
      store: isSuperadmin ? ADMIN_USER.store : undefined,
    };

    setPendingUserToVerify(newUser);
    setAllUsers((prev) => [...prev, newUser]);

    fetch("/api/auth/sync-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: newUser }),
    }).catch(() => {});

    const sent = await sendOTP(cleanEmail);
    return sent;
  };

  const verifyEmail = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) return false;

    const targetEmail = pendingEmail || (typeof window !== "undefined" ? sessionStorage.getItem("iskra_pending_email") : null) || user?.email || pendingUserToVerify?.email;

    if (targetEmail) {
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: targetEmail, code: cleanCode }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          if (pendingOTPCode && cleanCode === pendingOTPCode) {
            // Local match fallback
          } else {
            setMessage({ type: "error", text: data.error || "Nieprawidłowy lub wygasły kod weryfikacyjny." });
            return false;
          }
        }
      } catch (err) {
        console.warn("API verify-otp fetch fallback:", err);
        if (pendingOTPCode && cleanCode !== pendingOTPCode) {
          return false;
        }
      }
    } else if (pendingOTPCode && cleanCode !== pendingOTPCode) {
      return false;
    }

    let targetUser = pendingUserToVerify || user || (targetEmail ? allUsers.find(u => u.email === targetEmail) : null);
    if (!targetUser && targetEmail) {
      targetUser = {
        id: `usr_${Date.now()}`,
        name: targetEmail.split("@")[0],
        email: targetEmail,
        role: "user",
        plan: "Start",
        hasStore: false,
        accountStatus: "Active",
        is2FAEnabled: false,
        isEmailVerified: true,
        createdAt: new Date().toISOString().split("T")[0],
      };
    }
    if (!targetUser) return false;

    const verifiedUser: User = {
      ...targetUser,
      isEmailVerified: true,
    };

    setUser(verifiedUser);
    setAllUsers((prev) => {
      const exists = prev.some((u) => u.id === verifiedUser.id || u.email === verifiedUser.email);
      if (exists) {
        return prev.map((u) => (u.id === verifiedUser.id || u.email === verifiedUser.email ? verifiedUser : u));
      }
      return [...prev, verifiedUser];
    });

    fetch("/api/auth/sync-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: verifiedUser }),
    }).catch(() => {});

    setPendingOTPCode(null);
    setPendingUserToVerify(null);
    setMessage({ type: "success", text: "Konto pomyślnie aktywowane i zweryfikowane!" });
    return true;
  };

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setMessage({ type: "error", text: "Wprowadź prawidłowy adres e-mail." });
      return false;
    }

    setPendingEmail(cleanEmail);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("iskra_reset_email", cleanEmail);
      sessionStorage.setItem("iskra_pending_email", cleanEmail);
    }

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, type: "password_reset" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error || "Wystąpił błąd podczas wysyłania kodu resetującego." });
        return false;
      }

      setMessage({ type: "success", text: `Kod do resetowania hasła został wysłany na ${cleanEmail}.` });
      return true;
    } catch (err: any) {
      console.error("[sendPasswordReset error]:", err);
      setMessage({ type: "error", text: "Błąd połączenia z serwerem podczas wysyłania kodu." });
      return false;
    }
  };

  const resetPassword = async (code: string, newPassword: string, emailOverride?: string): Promise<boolean> => {
    const cleanCode = code.trim();
    if (cleanCode.length !== 6) {
      setMessage({ type: "error", text: "Wprowadź 6-cyfrowy kod weryfikacyjny." });
      return false;
    }

    const targetEmail = emailOverride || pendingEmail || (typeof window !== "undefined" ? sessionStorage.getItem("iskra_reset_email") || sessionStorage.getItem("iskra_pending_email") : null) || user?.email;

    if (!targetEmail) {
      setMessage({ type: "error", text: "Brak adresu e-mail do zresetowania hasła. Rozpocznij procedurę od nowa." });
      return false;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          code: cleanCode,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.error || "Nieprawidłowy kod weryfikacyjny." });
        return false;
      }

      setAllUsers((prev) =>
        prev.map((u) => (u.email.toLowerCase() === targetEmail.toLowerCase() ? { ...u, isEmailVerified: true } : u))
      );

      setMessage({ type: "success", text: "Hasło zostało pomyślnie zaktualizowane! Możesz się zalogować." });
      return true;
    } catch (err: any) {
      console.error("[resetPassword error]:", err);
      setMessage({ type: "error", text: "Błąd serwera podczas resetowania hasła." });
      return false;
    }
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
    const cleanPlan = (String(plan).replace(/^Pakiet\s+/i, "")) as PlanType;
    const planTitle = isTrial ? "Pakiet Start (Trial 14 dni)" : `Pakiet ${cleanPlan}`;

    const priceCents = isTrial ? 0 : cleanPlan === "Creator" || (cleanPlan as any) === "starter" ? (billingCycle === "rok" ? 29900 : 4990) : (billingCycle === "rok" ? 59900 : 9990);

    // 1. Jeśli użytkownik ma już sklep (np. Metek), aktualizujemy ten sklep bezpośrednio
    const currentStores = user.stores || (user.store ? [user.store] : []);
    let updatedStores = currentStores.map((st, idx) => {
      if (idx === 0) {
        return {
          ...st,
          plan: planTitle,
          planType: cleanPlan,
          planStatus: "active" as const,
          status: "active" as const,
          expires_at: expiresAt,
          planExpiresAt: expiresAt,
          expiresAt: expiresAt,
        };
      }
      return st;
    });

    const updatedUser: User = {
      ...user,
      plan: cleanPlan,
      planExpiresAt: expiresAt,
      stores: updatedStores,
      store: updatedStores[0] || user.store,
    };

    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

    if (updatedStores[0]) {
      upsertStoreInSupabase(updatedStores[0], user.id).catch(console.warn);
    }

    fetch("/api/auth/sync-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: updatedUser, stores: updatedStores }),
    }).catch(() => {});

    setMessage({
      type: "success",
      text: isTrial
        ? `🎉 Aktywowano 14-dniowy bezpłatny okres próbny (${planTitle})!`
        : `🎉 Pomyślnie aktywowano ${planTitle}!`,
    });

    if (priceCents > 0) {
      recordSaaSSubscription(activeStore?.id || "store_1000", user.id, user.email, cleanPlan, priceCents);
    }

    // Wysyłka potwierdzenia pakietu na e-mail
    if (user.email) {
      const planNameFormatted = isTrial ? "Pakiet Start (Trial 14 dni)" : `Pakiet ${plan} (${billingCycle})`;
      const amountFormatted = isTrial ? "0.00 PLN (Okres Próbny)" : `${(priceCents / 100).toFixed(2)} PLN`;
      const expiresFormatted = isTrial ? "14 dni" : billingCycle === "rok" ? "1 rok (365 dni)" : "30 dni";

      fetch("/api/auth/send-plan-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          planName: planNameFormatted,
          amountFormatted,
          expiresAtFormatted: `${expiresFormatted} (do: ${new Date(expiresAt).toLocaleDateString("pl-PL")})`,
          dashboardUrl: "https://iskral.pl/dashboard",
        }),
      }).catch(console.warn);
    }
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (!user) return;
    const resolvedAvatar = data.avatarUrl !== undefined ? data.avatarUrl : (data as any)?.avatar_url !== undefined ? (data as any).avatar_url : (user.avatarUrl || user.avatar_url || "");
    const updatedUser: User = {
      ...user,
      ...data,
      avatarUrl: resolvedAvatar || undefined,
      avatar_url: resolvedAvatar || undefined,
    };
    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setMessage({ type: "success", text: "Zaktualizowano profil i dane konta!" });

    const emailKey = user.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const uKey = user.id || emailKey;
    if (resolvedAvatar) {
      safeSetItem(`iskra_user_avatar_${emailKey}`, resolvedAvatar);
      safeSetItem(`iskra_user_avatar_${uKey}`, resolvedAvatar);
    } else {
      safeRemoveItem(`iskra_user_avatar_${emailKey}`);
      safeRemoveItem(`iskra_user_avatar_${uKey}`);
    }

    // Trwały zapis 2FA
    if ((data as any)?.two_factor_secret !== undefined || data.is2FAEnabled !== undefined || (data as any)?.two_factor_enabled !== undefined) {
      const isEnabled = data.is2FAEnabled !== false && (data as any)?.two_factor_enabled !== false;
      const secretVal = (data as any)?.two_factor_secret;
      if (typeof window !== "undefined") {
        if (isEnabled && secretVal) {
          localStorage.setItem(`iskra_2fa_secret_${emailKey}`, secretVal);
          localStorage.setItem(`iskra_2fa_enabled_${emailKey}`, "true");
        } else if (data.is2FAEnabled === false || (data as any)?.two_factor_enabled === false) {
          localStorage.removeItem(`iskra_2fa_secret_${emailKey}`);
          localStorage.setItem(`iskra_2fa_enabled_${emailKey}`, "false");
        }
      }
      if (secretVal && isEnabled) {
        fetch("/api/auth/verify-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, secret: secretVal, action: "save" }),
        }).catch(() => {});
      } else if (data.is2FAEnabled === false || (data as any)?.two_factor_enabled === false) {
        fetch("/api/auth/verify-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, action: "disable" }),
        }).catch(() => {});
      }
    }

    // Wywołaj dedykowany endpoint zapisu avatara
    if (data.avatarUrl !== undefined || (data as any)?.avatar_url !== undefined) {
      if (resolvedAvatar) {
        fetch("/api/profile/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, userId: user.id, avatarUrl: resolvedAvatar, imageBase64: resolvedAvatar }),
        }).catch((err) => console.warn("[avatar sync error]:", err));
      } else {
        fetch("/api/profile/avatar", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email, userId: user.id }),
        }).catch((err) => console.warn("[avatar delete error]:", err));
      }
    }

    // Trwały zapis do bazy Supabase przez API
    fetch("/api/auth/sync-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: updatedUser }),
    }).catch((err) => console.warn("[updateUserProfile sync error]:", err));

    if (supabase) {
      const dbPayload: any = {};
      if (data.name !== undefined) dbPayload.name = data.name;
      if (data.avatarUrl !== undefined || (data as any)?.avatar_url !== undefined) dbPayload.avatar_url = resolvedAvatar || null;
      if (data.role !== undefined) dbPayload.role = data.role;
      if (data.plan !== undefined) dbPayload.plan = data.plan;
      if (Object.keys(dbPayload).length > 0) {
        supabase.from("profiles").update(dbPayload).eq("email", user.email).then(() => {});
      }
    }
  };

  const createStripeCheckout = async (params: {
    productId?: string;
    planType?: PlanType;
    title: string;
    priceCents: number;
    customerEmail?: string;
    tenantId?: string;
    storeId?: string;
    userId?: string;
    action?: string;
    packageId?: string;
    billingCycle?: "miesiac" | "rok";
  }): Promise<string | null> => {
    try {
      const isPlan = Boolean(params.planType);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: params.userId || user?.id,
          storeId: params.storeId || params.tenantId || activeStore?.id || "demo-tenant",
          tenantId: params.storeId || params.tenantId || activeStore?.id || "demo-tenant",
          productId: params.productId,
          planType: params.planType,
          isPlan,
          title: params.title,
          priceCents: params.priceCents,
          customerEmail: params.customerEmail || user?.email,
          action: params.action || "buy",
          packageId: params.packageId,
          billingCycle: params.billingCycle || "miesiac",
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
      storeId: tenantId,
      stripeSessionId: `cs_test_${Date.now()}`,
      amountTotalCents: amountCents,
      totalAmount: (amountCents / 100).toFixed(2),
      status: "Opłacone",
      customerEmail: customerEmail || "klient@iskral.pl",
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

    setUser((prev) => {
      if (!prev) return prev;
      const uStores = prev.stores || (prev.store ? [prev.store] : []);
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
      return { ...prev, stores: updatedStores, store: updatedStores[0] };
    });

    // Twardy bezpośredni zapis do API / bazy
    fetch("/api/stores/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: tenantId,
        tenantId,
        productId,
        customerEmail: customerEmail || "klient@iskral.pl",
        amountTotalCents: amountCents,
        status: "Opłacone",
      }),
    }).catch(() => {});

    setRecentNotifications((prev) => [
      `💳 Nowa sprzedaż Stripe Checkout! ${(amountCents / 100).toFixed(2)} PLN w sklepie ${tenantId}`,
      ...prev,
    ]);

    setMessage({
      type: "success",
      text: `🎉 Zaakceptowano opłacone zamówienie: ${(amountCents / 100).toFixed(2)} PLN! Statystyki zostały zaktualizowane.`,
    });
  };

  const toggle2FA = () => {
    if (user) {
      const updated = { ...user, is2FAEnabled: !user.is2FAEnabled };
      setUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setMessage({ type: "success", text: updated.is2FAEnabled ? "Włączono autoryzację 2FA!" : "Wyłączono 2FA." });

      fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: updated }),
      }).catch((err) => console.warn("[Auth] 2FA sync error:", err));
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

  const suspendUserStore = async (targetId: string) => {
    let newlySuspendedStore: { storeId: string; ownerEmail?: string; storeName?: string; subdomain?: string } | null = null;

    setAllUsers((prev) =>
      prev.map((u) => {
        const uStores = u.stores || (u.store ? [u.store] : []);
        const matchesUser = u.id === targetId;
        const matchesStore = uStores.some((s) => s.id === targetId || s.subdomain === targetId);

        if (matchesUser || matchesStore) {
          const updatedStores = uStores.map((s) => {
            if (matchesUser || s.id === targetId || s.subdomain === targetId) {
              const currentStatus = s.status === "suspended" || s.planStatus === "suspended" ? "active" : "suspended";
              if (currentStatus === "suspended") {
                newlySuspendedStore = {
                  storeId: s.id,
                  ownerEmail: u.email,
                  storeName: s.name,
                  subdomain: s.subdomain,
                };
              }
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

    // Jeśli sklep przeszedł w status zawieszony, wysyłamy notyfikację e-mail przez API
    if (newlySuspendedStore) {
      try {
        await fetch("/api/stores/suspend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newlySuspendedStore),
        });
      } catch (err) {
        console.error("[AuthContext suspendUserStore API email error]:", err);
      }
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
    serviceId?: string;
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
    if (!user) throw new Error("No active user session");

    const isTrial = params.plan === "Start" || params.plan === "trial_14d";
    const durationDays = isTrial ? 14 : params.billingCycle === "rok" ? 365 : 30;
    const matchingService = (user.services || []).find(
      (s) => (params.serviceId && s.id === params.serviceId) || (!params.serviceId && s.status === "Nieprzypisany")
    );
    const expiresAt = matchingService?.expiresAt || user.planExpiresAt || new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const cleanSub = params.subdomain.toLowerCase().replace(/[^a-z0-9]/g, "") || "sklep";
    let finalSub = cleanSub;
    let counter = 1;
    while (allUsers.some((u) => (u.stores || []).some((s) => s.subdomain === finalSub && s.ownerId !== user.id))) {
      finalSub = `${cleanSub}${counter}`;
      counter++;
    }

    const storeId = `store_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const products: Product[] = [];

    if (params.initialProduct) {
      const newProd: Product = {
        id: `p_${Date.now()}`,
        tenantId: storeId,
        name: params.initialProduct.name,
        description: params.initialProduct.description || "",
        price: params.initialProduct.price,
        priceCents: params.initialProduct.priceCents,
        type: params.initialProduct.type,
        status: "Aktywny",
        stock: 50,
        sales: 0,
        variants: ["S", "M", "L", "XL"],
        image: params.initialProduct.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        images: params.initialProduct.images || [params.initialProduct.image || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"],
        isDigital: params.initialProduct.type === "Cyfrowy",
        digitalFileName: params.initialProduct.digitalFileName,
        digitalFileSize: params.initialProduct.digitalFileSize,
        digitalFileUrl: params.initialProduct.digitalFileUrl || (params.initialProduct.type === "Cyfrowy" ? "data:application/pdf;base64,demo" : undefined),
      };

      if (!products.some((p) => p.name === newProd.name)) {
        products.push(newProd);
      }
    }

    const newStoreConfig: StoreConfig = {
      ...CLEAN_EMPTY_STORE_TEMPLATE,
      id: storeId,
      ownerId: user.id,
      ownerEmail: user.email,
      name: params.name || "Mój Sklep",
      subdomain: finalSub,
      customDomain: params.customDomain || "",
      niche: params.niche || "Moda & Streetwear",
      logoUrl: params.logoUrl || "",
      template: params.template || "Dark Vibe",
      accentColor: params.accentColor || "#3B82F6",
      announcement: params.announcement || "🎉 Nowy drop już dostępny!",
      planType: params.plan,
      planStatus: "active",
      planExpiresAt: expiresAt,
      products,
    };

    const existingStores = user.stores || [];
    const updatedStores = [...existingStores, newStoreConfig];

    const updatedServices = (user.services || []).map((s) => {
      if ((params.serviceId && s.id === params.serviceId) || (!params.serviceId && s.status === "Nieprzypisany")) {
        return {
          ...s,
          status: "Przypisany" as const,
          assignedStoreId: newStoreConfig.id,
          assignedStoreName: newStoreConfig.name,
          assignedSubdomain: newStoreConfig.subdomain,
        };
      }
      return s;
    });

    const updatedUser: User = {
      ...user,
      role: user.role === "superadmin" ? "superadmin" : "client",
      plan: params.plan,
      hasStore: true,
      services: updatedServices.length > 0 ? updatedServices : user.services,
      activeStoreId: newStoreConfig.id,
      stores: updatedStores,
      store: newStoreConfig,
    };

    setUser(updatedUser);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));

    // Zapisz sklep do Supabase
    upsertStoreInSupabase(newStoreConfig, user.id).then((saved) => {
      if (saved) {
        console.log(`[Store] Sklep '${newStoreConfig.subdomain}' zapisany do Supabase dla User ID: ${user.id}`);
      } else {
        console.warn(`[Store] Nie udało się zapisać sklepu '${newStoreConfig.subdomain}' do Supabase`);
      }
    }).catch(console.error);

    fetch("/api/stores/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: newStoreConfig, owner_id: user.id }),
    }).catch(() => {});

    const priceCents = isTrial ? 0 : params.plan === "Creator" || params.plan === "starter" ? (params.billingCycle === "rok" ? 29900 : 4990) : (params.billingCycle === "rok" ? 59900 : 9990);
    if (priceCents > 0) {
      recordSaaSSubscription(newStoreConfig.id, user.id, user.email, params.plan, priceCents);
    }

    setMessage({
      type: "success",
      text: `🎉 Sklep ${newStoreConfig.name} aktywny pod adresem: https://${newStoreConfig.subdomain}.iskral.pl`,
    });

    return newStoreConfig;
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

  const hasAccess = (featureKey: keyof PlanFeatureConfig): boolean => {
    const currentPlan = activeStore?.planType || user?.plan || "Start";
    return hasFeatureAccess(currentPlan, featureKey);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        allUsers,
        activeStore,
        userStores,
        hasAccess,
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
        pendingOTPCode,
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
        sendOTP,
        verify2FA,
        register,
        verifyEmail,
        sendPasswordReset,
        resetPassword,
        logout,
        buyPlan,
        updateUserProfile,
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      allUsers: [],
      activeStore: undefined,
      userStores: [],
      onlineUsersCount: 1,
      topStoresLeaderboard: [],
      blogPosts: [],
      storeTemplates: [],
      landingContent: { heroTitle: "", heroSubtitle: "", ctaText: "", bannerText: "" },
      platformTotalGMVCents: 0,
      platformSaaSRevenueCents: 0,
      platformTotalOrdersCount: 0,
      platformTotalStoresCount: 0,
      packageRevenueTotal: "0",
      recentNotifications: [],
      subscriptionHistory: [],
      pendingEmail: null,
      pendingOTPCode: null,
      requires2FA: false,
      pending2FAUser: null,
      message: null,
      setMessage: () => {},
      hasAccess: () => false,
      setActiveStoreId: () => {},
      createAdditionalStore: async () => {},
      impersonatedStoreId: null,
      isImpersonating: false,
      isEditUnlocked: false,
      enterImpersonation: () => {},
      exitImpersonation: () => {},
      toggleImpersonationEdit: () => {},
      sendOTP: async () => false,
      login: async () => ({ success: false }),
      verify2FA: () => false,
      register: async () => false,
      verifyEmail: () => false,
      sendPasswordReset: async () => false,
      resetPassword: async () => false,
      logout: () => {},
      buyPlan: async () => {},
      updateUserProfile: () => {},
      toggle2FA: () => {},
      updateUserRole: () => {},
      updateUserPlan: () => {},
      blockUserAccount: () => {},
      suspendUserStore: () => {},
      deleteUserStore: () => {},
      deleteUserAccount: () => {},
      toggleAdminRole: () => {},
      updateLandingContent: () => {},
      addBlogPost: () => {},
      addStoreTemplate: () => {},
      updateStoreConfig: () => {},
      addProduct: () => {},
      updateProduct: () => {},
      deleteProduct: () => {},
      toggleProductStatus: () => {},
      addCategory: () => {},
      deleteCategory: () => {},
      connectStripe: () => {},
      requestPayoutWithIBAN: () => false,
      configureDrop: () => {},
      createCampaign: () => {},
      addTeamMember: () => {},
      removeTeamMember: () => {},
      verifyDomainRecords: () => {},
      recordOrder: () => {},
      recordSaaSSubscription: () => {},
      createStripeCheckout: async () => null,
      createOrUpdateStoreFull: () => ({} as any),
    };
  }
  return context;
}
