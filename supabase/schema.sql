-- =========================================================
-- MOTYWO.PL - SUPABASE POSTGRESQL MULTI-STORE SCHEMA DDL
-- Production Multi-Store Architecture & Admin Panel Integration
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (System Users & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superadmin', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TENANTS TABLE (Individual Stores Owned by Users)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    custom_domain TEXT UNIQUE,
    domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
    plan_type TEXT NOT NULL DEFAULT 'trial_14d' CHECK (plan_type IN ('trial_14d', 'starter', 'brand', 'pro', 'Brak')),
    plan_status TEXT NOT NULL DEFAULT 'active' CHECK (plan_status IN ('active', 'trialing', 'past_due', 'canceled')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled')),
    plan_expires_at TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    balance_cents BIGINT NOT NULL DEFAULT 0,
    drop_mode_active BOOLEAN NOT NULL DEFAULT FALSE,
    drop_target_date TIMESTAMPTZ,
    announcement TEXT,
    accent_color TEXT DEFAULT '#FF5B28',
    template TEXT DEFAULT 'Dark Vibe',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PLATFORM SUBSCRIPTIONS HISTORY TABLE (SaaS Analytics for Admin)
CREATE TABLE IF NOT EXISTS public.platform_subscriptions_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    billing_cycle TEXT NOT NULL DEFAULT 'miesiac',
    amount_paid_cents INTEGER NOT NULL,
    stripe_subscription_id TEXT,
    period_start TIMESTAMPTZ DEFAULT NOW(),
    period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WAITLIST LEADS TABLE (Landing Page Pre-Launch & Lead Capture)
CREATE TABLE IF NOT EXISTS public.waitlist_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified_at TIMESTAMPTZ
);

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PRODUCTS TABLE (Physical & Digital + Product-Level Drop Timer)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    compare_price_cents INTEGER,
    type TEXT NOT NULL DEFAULT 'Fizyczny' CHECK (type IN ('Fizyczny', 'Cyfrowy')),
    status TEXT NOT NULL DEFAULT 'Aktywny' CHECK (status IN ('Aktywny', 'Zawieszony', 'Brak w magazynie')),
    is_drop_only BOOLEAN NOT NULL DEFAULT FALSE,
    drop_target_date TIMESTAMPTZ,
    sales_count INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 50,
    description TEXT,
    image_url TEXT,
    is_digital BOOLEAN NOT NULL DEFAULT FALSE,
    digital_file_name TEXT,
    digital_file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ORDERS TABLE (Customer Purchases in Tenant Stores)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    stripe_session_id TEXT,
    amount_total_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
    customer_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PAYOUTS TABLE (IBAN Withdrawal Requests)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    iban_masked TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'Zrealizowana', 'W trakcie')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR MULTI-TENANT QUERY SPEED
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON public.tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON public.tenants(custom_domain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.platform_subscriptions_history(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist_leads(email);

-- RLS (ROW LEVEL SECURITY) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public tenants read access" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Owners can manage tenants" ON public.tenants FOR ALL USING (
    auth.uid() = owner_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin')
    )
);

CREATE POLICY "Waitlist public insert" ON public.waitlist_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Waitlist admin full access" ON public.waitlist_leads FOR ALL USING (true);

-- Trigger for Automatic Profile Creation on auth.users Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        CASE WHEN NEW.email ILIKE '%admin%' OR NEW.email = 'projekt@motywo.pl' THEN 'superadmin' ELSE 'user' END
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

