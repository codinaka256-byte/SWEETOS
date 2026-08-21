-- SQL Script to set up tables in Supabase for SWEETOS Store.
-- Copy and paste this script into your Supabase SQL Editor and click RUN.

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. User Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    email TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Owed Coupons Table
CREATE TABLE IF NOT EXISTS owed_coupons (
    email TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) and allow public read/write access (for testing/developer convenience)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owed_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public write access on products" ON products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow public write access on orders" ON orders FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on coupons" ON coupons FOR SELECT USING (true);
CREATE POLICY "Allow public write access on coupons" ON coupons FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow public write access on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on owed_coupons" ON owed_coupons FOR SELECT USING (true);
CREATE POLICY "Allow public write access on owed_coupons" ON owed_coupons FOR ALL USING (true) WITH CHECK (true);

-- 6. Generic Settings Table (for Categories, Brands, Reviews)
CREATE TABLE IF NOT EXISTS sweetos_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE sweetos_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on sweetos_settings" ON sweetos_settings FOR SELECT USING (true);
CREATE POLICY "Allow public write access on sweetos_settings" ON sweetos_settings FOR ALL USING (true) WITH CHECK (true);
