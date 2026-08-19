export type PlanId = "Start" | "Creator" | "Brand" | "trial_14d" | "starter" | "brand" | "pro";

export interface PlanFeatureConfig {
  canUseCustomDomain: boolean;
  canUseDrops: boolean;
  canUseNewsletter: boolean;
  canUseTeam: boolean;
  canUseVipTemplates: boolean;
  canUseVisualEditor: boolean;
  canUseAdvancedAnalytics: boolean;
  prioritySupport: boolean;
}

export interface PlanConfigItem {
  id: PlanId;
  canonicalId: "Start" | "Creator" | "Brand";
  name: string;
  priceMonthlyCents: number;
  priceMonthlyPLN: number;
  commissionRate: number;
  commissionText: string;
  trialDays: number;
  badgeText: string;
  description: string;
  features: PlanFeatureConfig;
}

export const PLANS: Record<"Start" | "Creator" | "Brand", PlanConfigItem> = {
  Start: {
    id: "Start",
    canonicalId: "Start",
    name: "Pakiet Start",
    priceMonthlyCents: 0,
    priceMonthlyPLN: 0,
    commissionRate: 0.02,
    commissionText: "2.0%",
    trialDays: 14,
    badgeText: "TRIAL 14 DNI DARMOWY",
    description: "Szybki start dla nowych marek i twórców cyfrowych.",
    features: {
      canUseCustomDomain: false,
      canUseDrops: false,
      canUseNewsletter: false,
      canUseTeam: false,
      canUseVipTemplates: false,
      canUseVisualEditor: false,
      canUseAdvancedAnalytics: false,
      prioritySupport: false,
    },
  },
  Creator: {
    id: "Creator",
    canonicalId: "Creator",
    name: "Pakiet Creator",
    priceMonthlyCents: 2999,
    priceMonthlyPLN: 29.99,
    commissionRate: 0.01,
    commissionText: "1.0%",
    trialDays: 0,
    badgeText: "POPULARNY DLA TWÓRCÓW",
    description: "Kompletny zestaw dla rozwijających się sklepów i premier dropów.",
    features: {
      canUseCustomDomain: false,
      canUseDrops: true,
      canUseNewsletter: true,
      canUseTeam: true,
      canUseVipTemplates: true,
      canUseVisualEditor: false,
      canUseAdvancedAnalytics: false,
      prioritySupport: false,
    },
  },
  Brand: {
    id: "Brand",
    canonicalId: "Brand",
    name: "Pakiet Brand",
    priceMonthlyCents: 5999,
    priceMonthlyPLN: 59.99,
    commissionRate: 0.005,
    commissionText: "0.5%",
    trialDays: 0,
    badgeText: "BEZ LIMITÓW",
    description: "Profesjonalny e-commerce z własną domeną i zaawansowanym edytorem.",
    features: {
      canUseCustomDomain: true,
      canUseDrops: true,
      canUseNewsletter: true,
      canUseTeam: true,
      canUseVipTemplates: true,
      canUseVisualEditor: true,
      canUseAdvancedAnalytics: true,
      prioritySupport: true,
    },
  },
};

/**
 * Normalizes input plan ID string to canonical PlanId ('Start' | 'Creator' | 'Brand')
 */
export function normalizePlanId(planInput?: string | null): "Start" | "Creator" | "Brand" {
  if (!planInput) return "Start";
  const clean = planInput.toLowerCase().trim();
  if (clean.includes("brand") || clean.includes("pro")) return "Brand";
  if (clean.includes("creator") || clean.includes("starter")) return "Creator";
  return "Start";
}

/**
 * Returns full PlanConfigItem for a given plan name
 */
export function getPlanConfig(planInput?: string | null): PlanConfigItem {
  const canonical = normalizePlanId(planInput);
  return PLANS[canonical];
}

/**
 * Checks whether a feature is unlocked for a given plan
 */
export function hasFeatureAccess(
  planInput: string | null | undefined,
  featureKey: keyof PlanFeatureConfig
): boolean {
  const config = getPlanConfig(planInput);
  return Boolean(config.features[featureKey]);
}

/**
 * Returns human-readable commission string (e.g. "1.0%")
 */
export function formatCommissionRate(planInput?: string | null): string {
  const config = getPlanConfig(planInput);
  return config.commissionText;
}

/**
 * Calculates store lifecycle trial & grace period dates
 */
export function getStoreLifecycleDates(createdAt?: string | Date) {
  const baseDate = createdAt ? new Date(createdAt) : new Date();
  const trialEndsAt = new Date(baseDate.getTime() + 14 * 864e5);
  const gracePeriodEndsAt = new Date(trialEndsAt.getTime() + 30 * 864e5);

  const now = new Date();
  const isTrialActive = now.getTime() < trialEndsAt.getTime();
  const isGracePeriodActive = now.getTime() < gracePeriodEndsAt.getTime();
  const trialDaysLeft = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 864e5));

  return {
    trialEndsAt: trialEndsAt.toISOString(),
    gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
    isTrialActive,
    isGracePeriodActive,
    trialDaysLeft,
  };
}
