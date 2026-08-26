-- =========================================================
-- ISKRAL.PL - OFFICIAL DATABASE SCHEMA DDL (SUPABASE / POSTGRESQL)
-- Standardized Architecture with Strict Relational Integrity
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELA PROFILI UŻYTKOWNIKÓW (powiązana 1:1 z auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT NULL,
  address TEXT DEFAULT NULL,
  postal_code TEXT DEFAULT NULL,
  city TEXT DEFAULT NULL,
  role TEXT DEFAULT 'user',
  account_status TEXT DEFAULT 'Active',
  plan TEXT DEFAULT 'Pakiet Creator',
  services JSONB DEFAULT '[]'::jsonb,
  is_email_verified BOOLEAN DEFAULT FALSE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT DEFAULT NULL,
  otp_code TEXT DEFAULT NULL,
  otp_expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA SKLEPÓW (1 użytkownik = 1 główny sklep)
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY DEFAULT ('store_' || extract(epoch from now())::text),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  slug TEXT,
  custom_domain TEXT DEFAULT NULL,
  domain_verified BOOLEAN DEFAULT FALSE,
  logo_url TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  announcement TEXT DEFAULT NULL,
  niche TEXT DEFAULT NULL,
  template TEXT DEFAULT 'Dark Vibe',
  accent_color TEXT DEFAULT '#FF5B28',
  stripe_status TEXT DEFAULT 'disconnected',
  balance_cents INT DEFAULT 0,
  plan_type TEXT DEFAULT 'Pakiet Creator',
  plan TEXT DEFAULT 'Pakiet Creator',
  plan_status TEXT DEFAULT 'active',
  status TEXT DEFAULT 'active', -- 'active' | 'expired' | 'suspended'
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '30 days'),
  trial_ends_at TIMESTAMPTZ DEFAULT NULL,
  grace_period_ends_at TIMESTAMPTZ DEFAULT NULL,
  social_links JSONB DEFAULT '{}'::jsonb,
  theme_config JSONB DEFAULT '{"template": "Dark Vibe", "accentColor": "#FF5B28"}'::jsonb,
  drop_config JSONB DEFAULT '{"enabled": false, "template": "Cyberpunk Launch", "targetDate": ""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA HISTORII ZAKUPÓW / PŁATNOŚCI
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id TEXT REFERENCES public.stores(id) ON DELETE SET NULL,
  plan_name TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  amount_cents INT DEFAULT 0,
  currency TEXT DEFAULT 'PLN',
  stripe_payment_id TEXT DEFAULT NULL,
  stripe_session_id TEXT DEFAULT NULL,
  status TEXT DEFAULT 'Opłacone',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA PRODUKTÓW
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT ('prod_' || extract(epoch from now())::text),
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id TEXT DEFAULT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price TEXT DEFAULT '0.00 zł',
  price_cents INT NOT NULL DEFAULT 0,
  compare_price TEXT DEFAULT NULL,
  compare_price_cents INT DEFAULT NULL,
  type TEXT DEFAULT 'Fizyczny',
  status TEXT DEFAULT 'Aktywny',
  is_active BOOLEAN DEFAULT TRUE,
  is_drop_only BOOLEAN DEFAULT FALSE,
  drop_target_date TIMESTAMPTZ DEFAULT NULL,
  sales INT DEFAULT 0,
  stock INT DEFAULT 50,
  image_url TEXT DEFAULT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  is_digital BOOLEAN DEFAULT FALSE,
  digital_file_name TEXT DEFAULT NULL,
  digital_file_size TEXT DEFAULT NULL,
  digital_file_version TEXT DEFAULT NULL,
  digital_file_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA ZAMÓWIEŃ
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT ('ord_' || extract(epoch from now())::text),
  store_id TEXT REFERENCES public.stores(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  customer_email TEXT NOT NULL,
  customer_name TEXT DEFAULT '',
  customer_phone TEXT DEFAULT '',
  shipping_address TEXT DEFAULT '',
  inpost_box TEXT DEFAULT '',
  shipping_details JSONB DEFAULT '{}'::jsonb,
  total_amount NUMERIC(10, 2) DEFAULT 0.00,
  amount_total_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Opłacone',
  product_title TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA KODÓW OTP
CREATE TABLE IF NOT EXISTS public.otp_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA SUBSKRYPCJI
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id TEXT DEFAULT NULL,
  user_email TEXT NOT NULL,
  plan_name TEXT NOT NULL DEFAULT 'Pakiet Creator',
  plan_id TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT DEFAULT 'miesiac',
  amount_paid_cents INT DEFAULT 0,
  current_period_end TIMESTAMPTZ DEFAULT NULL,
  stripe_customer_id TEXT DEFAULT NULL,
  stripe_subscription_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HIGH PERFORMANCE INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS idx_stores_lower_subdomain ON public.stores (LOWER(subdomain));
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores (owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores (user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders (store_id);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- POLICIES (Allow Read & Mutation with RLS enabled)
CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public select stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Allow public insert stores" ON public.stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update stores" ON public.stores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete stores" ON public.stores FOR DELETE USING (true);

CREATE POLICY "Allow public select purchases" ON public.purchases FOR SELECT USING (true);
CREATE POLICY "Allow public insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update purchases" ON public.purchases FOR UPDATE USING (true);

CREATE POLICY "Allow public select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow public select orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "Allow public all otp" ON public.otp_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
