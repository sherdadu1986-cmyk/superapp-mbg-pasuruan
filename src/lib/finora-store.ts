"use client"

import { supabase } from './supabase'

export interface FinAccount {
  id: string
  name: string
  type: 'bank' | 'wallet' | 'cash' | 'investment' | 'pension' | 'emergency'
  balance: number
  account_number?: string
  icon?: string
  color?: string
}

export interface FinTransaction {
  id: string
  date: string
  amount: number
  type: 'income' | 'expense'
  category: string
  account_name: string
  merchant?: string
  notes?: string
  receipt_url?: string
  payment_method?: string
  items?: FinReceiptItem[]
}

export interface FinReceiptItem {
  id?: string
  transaction_id?: string
  item_name: string
  price: number
  category?: string
  quantity?: number
}

export interface FinBudget {
  id: string
  category: string
  amount_limit: number
  spent_amount: number
  period: string
}

export interface FinRecurring {
  id: string
  name: string
  amount: number
  type: 'income' | 'expense'
  frequency: string
  next_due_date: string
  category: string
  account_name: string
}

export interface FinDebt {
  id: string
  title: string
  total_amount: number
  remaining_amount: number
  type: 'utang' | 'piutang'
  due_date: string
  person_name: string
  status: 'Belum Lunas' | 'Lunas' | 'Dicicil'
}

export interface FinSavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string
  icon: string
  color: string
}

// Initial Realistic September 2026 Seed Data
export const INITIAL_ACCOUNTS: FinAccount[] = [
  { id: 'acc-1', name: 'BCA Express', type: 'bank', balance: 18450000, account_number: '8420-1122-33', icon: 'Building2', color: 'blue' },
  { id: 'acc-2', name: 'Mandiri Utama', type: 'bank', balance: 12300000, account_number: '1440-0099-88', icon: 'Building', color: 'yellow' },
  { id: 'acc-3', name: 'Dompet Tunai', type: 'cash', balance: 2150000, account_number: '-', icon: 'Banknote', color: 'emerald' },
  { id: 'acc-4', name: 'GoPay / QRIS', type: 'wallet', balance: 850000, account_number: '08123456789', icon: 'Smartphone', color: 'cyan' },
  { id: 'acc-5', name: 'Bibit Reksadana', type: 'investment', balance: 45000000, account_number: 'INV-9901', icon: 'TrendingUp', color: 'purple' },
  { id: 'acc-6', name: 'Dana Pensiun DPLK', type: 'pension', balance: 38500000, account_number: 'PEN-8812', icon: 'ShieldCheck', color: 'indigo' },
  { id: 'acc-7', name: 'Kas Dana Darurat', type: 'emergency', balance: 25000000, account_number: 'EMG-0012', icon: 'Lock', color: 'rose' }
]

export const INITIAL_TRANSACTIONS: FinTransaction[] = [
  {
    id: 'tx-101',
    date: '2026-09-01',
    amount: 18500000,
    type: 'income',
    category: 'Gaji Bulanan',
    account_name: 'BCA Express',
    merchant: 'Badan Gizi Nasional SPPG',
    notes: 'Transfer Gaji Pokok September 2026',
    payment_method: 'Bank Transfer'
  },
  {
    id: 'tx-102',
    date: '2026-09-05',
    amount: 5000000,
    type: 'income',
    category: 'Bonus Project AI',
    account_name: 'Mandiri Utama',
    merchant: 'Klien Tech AI',
    notes: 'Insentif Optimasi System AI',
    payment_method: 'Bank Transfer'
  },
  {
    id: 'tx-103',
    date: '2026-09-08',
    amount: 3200000,
    type: 'expense',
    category: 'Rumah & Cicilan',
    account_name: 'BCA Express',
    merchant: 'Bank BTN',
    notes: 'Cicilan KPR Bulan September',
    payment_method: 'Auto Debet'
  },
  {
    id: 'tx-104',
    date: '2026-09-12',
    amount: 680000,
    type: 'expense',
    category: 'Kebutuhan Rumah Tangga',
    account_name: 'GoPay / QRIS',
    merchant: 'Indomaret Kiduldalem',
    notes: 'Belanja Bulanan Minyak, Sabun, Beras',
    payment_method: 'QRIS',
    items: [
      { item_name: 'Minyak Goreng Sania 2L', price: 34000, category: 'Kebutuhan Rumah', quantity: 2 },
      { item_name: 'Beras Premium SPHP 5kg', price: 65000, category: 'Kebutuhan Rumah', quantity: 2 },
      { item_name: 'Deterjen Rinso 1.8kg', price: 42000, category: 'Kebutuhan Rumah', quantity: 1 }
    ]
  },
  {
    id: 'tx-105',
    date: '2026-09-15',
    amount: 250000,
    type: 'expense',
    category: 'Transportasi',
    account_name: 'Mandiri Utama',
    merchant: 'Pertamina Wonorejo',
    notes: 'Bensin Pertamax Full Tank',
    payment_method: 'Mandiri QRIS'
  },
  {
    id: 'tx-106',
    date: '2026-09-18',
    amount: 850000,
    type: 'expense',
    category: 'Tagihan & Utilitas',
    account_name: 'BCA Express',
    merchant: 'PLN & IndiHome',
    notes: 'Listrik Token & Wi-Fi 100Mbps',
    payment_method: 'M-BCA'
  },
  {
    id: 'tx-107',
    date: '2026-09-22',
    amount: 420000,
    type: 'expense',
    category: 'Makanan & Kuliner',
    account_name: 'Dompet Tunai',
    merchant: 'Resto Bebek Goreng Pasuruan',
    notes: 'Makan Malam Keluarga',
    payment_method: 'Cash'
  },
  {
    id: 'tx-108',
    date: '2026-09-25',
    amount: 2000000,
    type: 'expense',
    category: 'Investasi & Tabungan',
    account_name: 'BCA Express',
    merchant: 'Bibit Reksadana',
    notes: 'Auto DCA Reksadana Indeks IHSG',
    payment_method: 'Bank Transfer'
  }
]

export const INITIAL_BUDGETS: FinBudget[] = [
  { id: 'b-1', category: 'Kebutuhan Rumah Tangga', amount_limit: 3500000, spent_amount: 1450000, period: 'Monthly' },
  { id: 'b-2', category: 'Makanan & Kuliner', amount_limit: 2500000, spent_amount: 1120000, period: 'Monthly' },
  { id: 'b-3', category: 'Transportasi', amount_limit: 1500000, spent_amount: 650000, period: 'Monthly' },
  { id: 'b-4', category: 'Tagihan & Utilitas', amount_limit: 1200000, spent_amount: 850000, period: 'Monthly' },
  { id: 'b-5', category: 'Hiburan & Gaya Hidup', amount_limit: 1000000, spent_amount: 380000, period: 'Monthly' },
  { id: 'b-6', category: 'Rumah & Cicilan', amount_limit: 3500000, spent_amount: 3200000, period: 'Monthly' }
]

export const INITIAL_RECURRING: FinRecurring[] = [
  { id: 'r-1', name: 'Cicilan KPR BTN', amount: 3200000, type: 'expense', frequency: 'Monthly', next_due_date: '2026-10-08', category: 'Rumah & Cicilan', account_name: 'BCA Express' },
  { id: 'r-2', name: 'Wi-Fi IndiHome 100Mbps', amount: 380000, type: 'expense', frequency: 'Monthly', next_due_date: '2026-10-15', category: 'Tagihan & Utilitas', account_name: 'BCA Express' },
  { id: 'r-3', name: 'Langganan Netflix & Spotify', amount: 240000, type: 'expense', frequency: 'Monthly', next_due_date: '2026-10-20', category: 'Hiburan & Gaya Hidup', account_name: 'GoPay / QRIS' },
  { id: 'r-4', name: 'Asuransi Kesehatan Sinar Mas', amount: 750000, type: 'expense', frequency: 'Monthly', next_due_date: '2026-10-25', category: 'Kesehatan', account_name: 'Mandiri Utama' }
]

export const INITIAL_DEBTS: FinDebt[] = [
  { id: 'd-1', title: 'Cicilan Laptop Workstation', total_amount: 12000000, remaining_amount: 4200000, type: 'utang', due_date: '2026-12-15', person_name: 'BCA Smartpay', status: 'Dicicil' },
  { id: 'd-2', title: 'Piutang Project Web Mas Budi', total_amount: 2500000, remaining_amount: 1500000, type: 'piutang', due_date: '2026-10-10', person_name: 'Mas Budi Setiawan', status: 'Dicicil' }
]

export const INITIAL_SAVINGS_GOALS: FinSavingsGoal[] = [
  { id: 'g-1', name: 'Liburan Akhir Tahun Jepang', target_amount: 35000000, current_amount: 22500000, target_date: '2026-12-20', icon: 'Plane', color: 'sky' },
  { id: 'g-2', name: 'Upgrade Laptop M4 Max', target_amount: 42000000, current_amount: 28000000, target_date: '2027-03-15', icon: 'Laptop', color: 'indigo' },
  { id: 'g-3', name: 'Beli Sepeda Listrik Wuling', target_amount: 15000000, current_amount: 11000000, target_date: '2026-11-30', icon: 'Zap', color: 'emerald' }
]

// Storage Keys
const KEYS = {
  ACCOUNTS: 'finora_accounts_v1',
  TRANSACTIONS: 'finora_transactions_v1',
  BUDGETS: 'finora_budgets_v1',
  RECURRING: 'finora_recurring_v1',
  DEBTS: 'finora_debts_v1',
  GOALS: 'finora_goals_v1'
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount).replace('Rp', 'Rp ')
}

export class FinoraStore {
  static getAccounts(): FinAccount[] {
    if (typeof window === 'undefined') return INITIAL_ACCOUNTS
    const data = localStorage.getItem(KEYS.ACCOUNTS)
    if (!data) {
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS))
      return INITIAL_ACCOUNTS
    }
    try {
      return JSON.parse(data)
    } catch {
      return INITIAL_ACCOUNTS
    }
  }

  static saveAccounts(accounts: FinAccount[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts))
  }

  static getTransactions(): FinTransaction[] {
    if (typeof window === 'undefined') return INITIAL_TRANSACTIONS
    const data = localStorage.getItem(KEYS.TRANSACTIONS)
    if (!data) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS))
      return INITIAL_TRANSACTIONS
    }
    try {
      return JSON.parse(data)
    } catch {
      return INITIAL_TRANSACTIONS
    }
  }

  static saveTransactions(transactions: FinTransaction[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions))
  }

  static addTransaction(tx: Omit<FinTransaction, 'id'>): FinTransaction {
    const transactions = this.getTransactions()
    const newTx: FinTransaction = {
      ...tx,
      id: `tx-${Date.now()}`
    }
    const updated = [newTx, ...transactions]
    this.saveTransactions(updated)

    // Adjust corresponding account balance
    const accounts = this.getAccounts()
    const accountIndex = accounts.findIndex(a => a.name === tx.account_name)
    if (accountIndex !== -1) {
      if (tx.type === 'income') {
        accounts[accountIndex].balance += tx.amount
      } else {
        accounts[accountIndex].balance -= tx.amount
      }
      this.saveAccounts(accounts)
    }

    // Try background Supabase push if available
    try {
      Promise.resolve(
        supabase.from('fin_transactions').insert([{
          date: tx.date,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          merchant: tx.merchant || '',
          notes: tx.notes || '',
          payment_method: tx.payment_method || 'QRIS'
        }])
      ).catch(() => {})
    } catch {}

    return newTx
  }

  static deleteTransaction(id: string) {
    const transactions = this.getTransactions()
    const target = transactions.find(t => t.id === id)
    if (!target) return

    const updated = transactions.filter(t => t.id !== id)
    this.saveTransactions(updated)

    // Reverse balance effect
    const accounts = this.getAccounts()
    const accountIndex = accounts.findIndex(a => a.name === target.account_name)
    if (accountIndex !== -1) {
      if (target.type === 'income') {
        accounts[accountIndex].balance -= target.amount
      } else {
        accounts[accountIndex].balance += target.amount
      }
      this.saveAccounts(accounts)
    }
  }

  static getBudgets(): FinBudget[] {
    if (typeof window === 'undefined') return INITIAL_BUDGETS
    const data = localStorage.getItem(KEYS.BUDGETS)
    if (!data) {
      localStorage.setItem(KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS))
      return INITIAL_BUDGETS
    }
    try { return JSON.parse(data) } catch { return INITIAL_BUDGETS }
  }

  static getRecurring(): FinRecurring[] {
    if (typeof window === 'undefined') return INITIAL_RECURRING
    const data = localStorage.getItem(KEYS.RECURRING)
    if (!data) {
      localStorage.setItem(KEYS.RECURRING, JSON.stringify(INITIAL_RECURRING))
      return INITIAL_RECURRING
    }
    try { return JSON.parse(data) } catch { return INITIAL_RECURRING }
  }

  static getDebts(): FinDebt[] {
    if (typeof window === 'undefined') return INITIAL_DEBTS
    const data = localStorage.getItem(KEYS.DEBTS)
    if (!data) {
      localStorage.setItem(KEYS.DEBTS, JSON.stringify(INITIAL_DEBTS))
      return INITIAL_DEBTS
    }
    try { return JSON.parse(data) } catch { return INITIAL_DEBTS }
  }

  static getSavingsGoals(): FinSavingsGoal[] {
    if (typeof window === 'undefined') return INITIAL_SAVINGS_GOALS
    const data = localStorage.getItem(KEYS.GOALS)
    if (!data) {
      localStorage.setItem(KEYS.GOALS, JSON.stringify(INITIAL_SAVINGS_GOALS))
      return INITIAL_SAVINGS_GOALS
    }
    try { return JSON.parse(data) } catch { return INITIAL_SAVINGS_GOALS }
  }

  static getSummary() {
    const accounts = this.getAccounts()
    const transactions = this.getTransactions()
    const debts = this.getDebts()
    const goals = this.getSavingsGoals()

    // Liquid Active Balance (Bank + Wallet + Cash)
    const activeBalance = accounts
      .filter(a => ['bank', 'wallet', 'cash'].includes(a.type))
      .reduce((acc, a) => acc + a.balance, 0)

    // Investment
    const investmentTotal = accounts
      .filter(a => a.type === 'investment')
      .reduce((acc, a) => acc + a.balance, 0)

    // Pension
    const pensionTotal = accounts
      .filter(a => a.type === 'pension')
      .reduce((acc, a) => acc + a.balance, 0)

    // Emergency Fund
    const emergencyTotal = accounts
      .filter(a => a.type === 'emergency')
      .reduce((acc, a) => acc + a.balance, 0)

    // Savings Goals Total Current
    const totalSavingsCurrent = goals.reduce((acc, g) => acc + g.current_amount, 0)

    // Current Month Sep 2026 Income & Expense
    const sepTransactions = transactions.filter(t => t.date.startsWith('2026-09'))
    const totalIncomeMonth = sepTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0)

    const totalExpenseMonth = sepTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)

    // Total Utang
    const totalDebts = debts
      .filter(d => d.type === 'utang')
      .reduce((acc, d) => acc + d.remaining_amount, 0)

    // Remaining Cash Flow & Ratio
    const remainingCashFlow = totalIncomeMonth - totalExpenseMonth
    const spendingPercentage = totalIncomeMonth > 0 ? Math.round((totalExpenseMonth / totalIncomeMonth) * 100) : 0

    // Net Worth = Assets (Accounts + Investments + Pensions + Emergency) - Debts
    const totalAssets = accounts.reduce((acc, a) => acc + a.balance, 0)
    const netWorth = totalAssets - totalDebts

    return {
      activeBalance,
      totalIncomeMonth,
      totalExpenseMonth,
      totalDebts,
      totalSavingsCurrent,
      investmentTotal,
      pensionTotal,
      emergencyTotal,
      remainingCashFlow,
      spendingPercentage,
      netWorth,
      totalAssets
    }
  }
}
