-- ============================================================
-- Ollo Personal Money Tracker Schema
-- Execute this SQL script in Supabase SQL Editor.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: fin_wallets
CREATE TABLE IF NOT EXISTS public.fin_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    type VARCHAR(50) DEFAULT 'cash', -- 'cash', 'bank', 'wallet', 'credit'
    color VARCHAR(50) DEFAULT 'emerald',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: fin_transactions
CREATE TABLE IF NOT EXISTS public.fin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID REFERENCES public.fin_wallets(id) ON DELETE CASCADE,
    to_wallet_id UUID REFERENCES public.fin_wallets(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    note TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time VARCHAR(10),
    merchant VARCHAR(200),
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: fin_budgets
CREATE TABLE IF NOT EXISTS public.fin_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL UNIQUE,
    limit_amount DECIMAL(15, 2) NOT NULL,
    month VARCHAR(20) DEFAULT '2026-09',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: fin_savings
CREATE TABLE IF NOT EXISTS public.fin_savings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    target_date DATE,
    icon VARCHAR(50) DEFAULT 'Target',
    color VARCHAR(50) DEFAULT 'blue',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access fin_wallets" ON public.fin_wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access fin_transactions" ON public.fin_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access fin_budgets" ON public.fin_budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access fin_savings" ON public.fin_savings FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
