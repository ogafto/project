-- =========================================================
-- ISKRAL.PL - SUPABASE POSTGRESQL MULTI-STORE SCHEMA DDL
-- Production SaaS Architecture: Subscriptions, Trial & Grace Period
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    account_status TEXT NOT NULL DEFAULT 'Active',
    plan TEXT DEFAULT 'Start',
    services JSONB DEFAULT '[]'::jsonb,
    is_email_verified BOOLEAN DEFAULT FALSE,
    otp_code TEXT,
    otp_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1B. OTP CODES TABLE
CREATE TABLE IF NOT EXISTS public.otp_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. SUBSCRIPTIONS / PLANS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tenant_id TEXT,
    user_email TEXT,
    plan_name TEXT NOT NULL DEFAULT 'Start',
    plan_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    billing_cycle TEXT DEFAULT 'miesiac',
    amount_paid_cents INT DEFAULT 0,
    current_period_end TIMESTAMPTZ,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STORES TABLE (With Trial 14d + Grace Period 30d Protection)
CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    custom_domain TEXT,
    domain_verified BOOLEAN DEFAULT FALSE,
    logo_url TEXT,
    description TEXT,
    announcement TEXT,
    niche TEXT,
    template TEXT DEFAULT 'Dark Vibe',
    accent_color TEXT DEFAULT '#FF5B28',
    stripe_status TEXT DEFAULT 'disconnected',
    balance_cents INT DEFAULT 0,
    plan_type TEXT DEFAULT 'Start',
    plan_status TEXT DEFAULT 'trialing' CHECK (plan_status IN ('trialing', 'active', 'past_due', 'suspended', 'canceled')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled')),
    is_active BOOLEAN DEFAULT TRUE,
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    grace_period_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '44 days'),
    social_links JSONB DEFAULT '{}'::jsonb,
    theme_config JSONB DEFAULT '{"template": "Dark Vibe", "accentColor": "#FF5B28"}'::jsonb,
    drop_config JSONB DEFAULT '{"enabled": false, "template": "Cyberpunk Launch", "targetDate": ""}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    category_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT,
    price_cents INT NOT NULL DEFAULT 0,
    compare_price TEXT,
    compare_price_cents INT,
    type TEXT DEFAULT 'Fizyczny',
    status TEXT DEFAULT 'Aktywny',
    is_active BOOLEAN DEFAULT TRUE,
    is_drop_only BOOLEAN DEFAULT FALSE,
    drop_target_date TIMESTAMPTZ,
    sales INT DEFAULT 0,
    stock INT DEFAULT 50,
    image_url TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    is_digital BOOLEAN DEFAULT FALSE,
    digital_file_name TEXT,
    digital_file_size TEXT,
    digital_file_version TEXT,
    digital_file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
    stripe_session_id TEXT,
    customer_email TEXT NOT NULL,
    total_amount NUMERIC(10, 2),
    amount_total_cents INT NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'paid',
    product_title TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. WAITLIST LEADS TABLE
CREATE TABLE IF NOT EXISTS public.waitlist_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- HIGH PERFORMANCE INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_lower_subdomain ON public.stores (LOWER(subdomain));
CREATE INDEX IF NOT EXISTS idx_stores_lower_custom_domain ON public.stores (LOWER(custom_domain));
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores (owner_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders (store_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES FOR STOREFRONT RENDERING
CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public select subscriptions" ON public.subscriptions FOR SELECT USING (true);
CREATE POLICY "Allow public select stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Allow public select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public select orders" ON public.orders FOR SELECT USING (true);

-- PUBLIC MUTATION POLICIES
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public insert subscriptions" ON public.subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update subscriptions" ON public.subscriptions FOR UPDATE USING (true);
CREATE POLICY "Allow public insert stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON public.products FOR DELETE USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE USING (true);
