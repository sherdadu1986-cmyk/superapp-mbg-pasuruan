-- ============================================================
-- FINORA - Personal Finance OS Database Schema
-- Execute this SQL script in Supabase SQL Editor.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: fin_accounts
CREATE TABLE IF NOT EXISTS public.fin_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'wallet', 'cash', 'investment', 'pension', 'emergency')),
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    account_number VARCHAR(100),
    icon VARCHAR(50) DEFAULT 'Wallet',
    color VARCHAR(50) DEFAULT 'emerald',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: fin_categories
CREATE TABLE IF NOT EXISTS public.fin_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(50) DEFAULT 'Tag',
    color VARCHAR(50) DEFAULT 'blue',
    budget_limit DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: fin_transactions
CREATE TABLE IF NOT EXISTS public.fin_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100) NOT NULL,
    account_id UUID REFERENCES public.fin_accounts(id) ON DELETE SET NULL,
    merchant VARCHAR(255),
    notes TEXT,
    receipt_url TEXT,
    payment_method VARCHAR(50) DEFAULT 'QRIS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table: fin_receipt_items
CREATE TABLE IF NOT EXISTS public.fin_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES public.fin_transactions(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100),
    quantity INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table: fin_budgets
CREATE TABLE IF NOT EXISTS public.fin_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL UNIQUE,
    amount_limit DECIMAL(15, 2) NOT NULL,
    spent_amount DECIMAL(15, 2) DEFAULT 0,
    period VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table: fin_recurring
CREATE TABLE IF NOT EXISTS public.fin_recurring (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    frequency VARCHAR(50) DEFAULT 'Monthly',
    next_due_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    account_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Table: fin_debts
CREATE TABLE IF NOT EXISTS public.fin_debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    remaining_amount DECIMAL(15, 2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('utang', 'piutang')),
    due_date DATE,
    person_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Belum Lunas',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Table: fin_savings_goals
CREATE TABLE IF NOT EXISTS public.fin_savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    target_date DATE,
    icon VARCHAR(50) DEFAULT 'Target',
    color VARCHAR(50) DEFAULT 'emerald',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.fin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fin_savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all access on fin_accounts" ON public.fin_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fin_categories" ON public.fin_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fin_transactions" ON public.fin_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fin_receipt_items" ON public.fin_receipt_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fin_budgets" ON public.fin_budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fin_recurring" ON public.fin_recurring FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fin_debts" ON public.fin_debts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on fin_savings_goals" ON public.fin_savings_goals FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
