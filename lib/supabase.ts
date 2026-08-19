import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yussjgtmfbrlissceunw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_uxqLh2yOoU_6ezWUwt9dKQ_36D-3sX3";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_ONl2-4WQ5ePnVhdRkGLlDA_-b7v7XK2";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const supabaseAdmin = Boolean(supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Fast direct Supabase query to fetch a store by subdomain
 */
export async function fetchStoreFromSupabase(subdomain: string) {
  if (!supabase) return null;
  try {
    const cleanSub = subdomain.trim().toLowerCase();
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .or(`subdomain.eq.${cleanSub},custom_domain.eq.${cleanSub},id.eq.${cleanSub}`)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Fast direct Supabase query to fetch products for a store
 */
export async function fetchProductsFromSupabase(storeId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Fast Supabase insert / update helper for store creation
 */
export async function upsertStoreInSupabase(storeData: any) {
  if (!supabase) return false;
  try {
    const dbPayload = {
      id: storeData.id,
      name: storeData.name,
      subdomain: storeData.subdomain.trim().toLowerCase(),
      custom_domain: storeData.customDomain || null,
      logo_url: storeData.logoUrl || null,
      description: storeData.description || null,
      announcement: storeData.announcement || null,
      template: storeData.template || "Dark Vibe",
      accent_color: storeData.accentColor || "#FF5B28",
      stripe_status: storeData.stripeStatus || "disconnected",
      balance_cents: storeData.balanceCents || 0,
      plan_type: storeData.planType || "Start",
      plan_status: storeData.planStatus || "active",
      status: storeData.status || "active",
      is_active: storeData.is_active !== false,
      social_links: storeData.socials || {},
      theme_config: { template: storeData.template, accentColor: storeData.accentColor },
      drop_config: storeData.dropConfig || {},
    };

    const { error } = await supabase.from("stores").upsert(dbPayload);
    return !error;
  } catch {
    return false;
  }
}
