"use client"

import { supabase } from './supabase'

export interface OlloWallet {
  id: string
  name: string
  balance: number
  type: 'cash' | 'bank' | 'wallet' | 'credit'
  color: 'emerald' | 'blue' | 'cyan' | 'purple' | 'amber' | 'rose'
  icon?: string
}

export interface OlloTransaction {
  id: string
  wallet_id: string
  to_wallet_id?: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  category: string
  note?: string
  date: string // YYYY-MM-DD
  time?: string // HH:mm
  merchant?: string
}

export interface OlloBudget {
  id: string
  category: string
  limit_amount: number
  spent_amount: number
}

export interface OlloSavingsGoal {
  id: string
  title: string
  target_amount: number
  current_amount: number
  target_date?: string
  color?: string
}

// Initial Ollo Minimalist Seed Data
export const INITIAL_WALLETS: OlloWallet[] = [
  { id: 'w-cash', name: 'Cash', balance: 500000, type: 'cash', color: 'emerald', icon: '💵' },
  { id: 'w-bca', name: 'BCA Utama', balance: 15200000, type: 'bank', color: 'blue', icon: '🏦' },
  { id: 'w-gopay', name: 'GoPay / QRIS', balance: 2100000, type: 'wallet', color: 'cyan', icon: '📱' }
]

export const INITIAL_TRANSACTIONS: OlloTransaction[] = [
  {
    id: 'ot-101',
    wallet_id: 'w-bca',
    type: 'income',
    amount: 18500000,
    category: '💼 Gaji',
    note: 'Gaji Pokok SPPG BGN',
    date: '2026-09-28',
    time: '09:00',
    merchant: 'BGN Kiduldalem'
  },
  {
    id: 'ot-102',
    wallet_id: 'w-gopay',
    type: 'expense',
    amount: 45000,
    category: '🍜 Makanan & Minuman',
    note: 'Kopi & Roti Siang',
    date: '2026-09-30',
    time: '12:30',
    merchant: 'Kopi Janji Jiwa'
  },
  {
    id: 'ot-103',
    wallet_id: 'w-cash',
    type: 'expense',
    amount: 25000,
    category: '🚗 Transportasi',
    note: 'Parkir & E-Toll',
    date: '2026-09-30',
    time: '14:15',
    merchant: 'Parkir Wonorejo'
  },
  {
    id: 'ot-104',
    wallet_id: 'w-gopay',
    type: 'expense',
    amount: 145000,
    category: '🛒 Belanja Bulanan',
    note: 'Minyak & Sembako',
    date: '2026-09-29',
    time: '18:20',
    merchant: 'Indomaret'
  }
]

export const INITIAL_BUDGETS: OlloBudget[] = [
  { id: 'ob-1', category: '🍜 Makanan & Minuman', limit_amount: 2000000, spent_amount: 1500000 },
  { id: 'ob-2', category: '🚗 Transportasi', limit_amount: 800000, spent_amount: 450000 },
  { id: 'ob-3', category: '🛒 Belanja Bulanan', limit_amount: 2500000, spent_amount: 1450000 },
  { id: 'ob-4', category: '🎬 Hiburan & Hobi', limit_amount: 1000000, spent_amount: 1200000 } // Overbudget
]

export const INITIAL_SAVINGS: OlloSavingsGoal[] = [
  { id: 'os-1', title: 'Upgrade Laptop M4', target_amount: 20000000, current_amount: 7500000, target_date: '2027-01-15', color: 'blue' },
  { id: 'os-2', title: 'Liburan Akhir Tahun', target_amount: 10000000, current_amount: 4500000, target_date: '2026-12-20', color: 'emerald' }
]

const KEYS = {
  WALLETS: 'ollo_wallets_v2',
  TRANSACTIONS: 'ollo_transactions_v2',
  BUDGETS: 'ollo_budgets_v2',
  SAVINGS: 'ollo_savings_v2'
}

export function formatRupiahShort(amount: number): string {
  if (Math.abs(amount) >= 1000000) {
    const formatted = (amount / 1000000).toFixed(1).replace('.0', '')
    return `Rp ${formatted}jt`
  }
  if (Math.abs(amount) >= 1000) {
    const formatted = (amount / 1000).toFixed(0)
    return `Rp ${formatted}k`
  }
  return `Rp ${amount}`
}

export function formatRupiahFull(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount).replace('Rp', 'Rp ')
}

export class OlloStore {
  static getWallets(): OlloWallet[] {
    if (typeof window === 'undefined') return INITIAL_WALLETS
    const data = localStorage.getItem(KEYS.WALLETS)
    if (!data) {
      localStorage.setItem(KEYS.WALLETS, JSON.stringify(INITIAL_WALLETS))
      return INITIAL_WALLETS
    }
    try { return JSON.parse(data) } catch { return INITIAL_WALLETS }
  }

  static saveWallets(wallets: OlloWallet[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEYS.WALLETS, JSON.stringify(wallets))
  }

  static addWallet(wallet: Omit<OlloWallet, 'id'>): OlloWallet {
    const wallets = this.getWallets()
    const newW: OlloWallet = { ...wallet, id: `w-${Date.now()}` }
    const updated = [...wallets, newW]
    this.saveWallets(updated)

    try {
      Promise.resolve(
        supabase.from('fin_wallets').insert([{
          name: newW.name,
          balance: newW.balance,
          type: newW.type,
          color: newW.color
        }])
      ).catch(() => {})
    } catch {}

    return newW
  }

  static getTransactions(): OlloTransaction[] {
    if (typeof window === 'undefined') return INITIAL_TRANSACTIONS
    const data = localStorage.getItem(KEYS.TRANSACTIONS)
    if (!data) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS))
      return INITIAL_TRANSACTIONS
    }
    try { return JSON.parse(data) } catch { return INITIAL_TRANSACTIONS }
  }

  static saveTransactions(txs: OlloTransaction[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs))
  }

  static addTransaction(tx: Omit<OlloTransaction, 'id'>): OlloTransaction {
    const txs = this.getTransactions()
    const now = new Date()
    const newTx: OlloTransaction = {
      ...tx,
      id: `ot-${Date.now()}`,
      time: tx.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    const updated = [newTx, ...txs]
    this.saveTransactions(updated)

    // Update wallet balances
    const wallets = this.getWallets()
    if (tx.type === 'expense') {
      const idx = wallets.findIndex(w => w.id === tx.wallet_id)
      if (idx !== -1) wallets[idx].balance -= tx.amount
    } else if (tx.type === 'income') {
      const idx = wallets.findIndex(w => w.id === tx.wallet_id)
      if (idx !== -1) wallets[idx].balance += tx.amount
    } else if (tx.type === 'transfer' && tx.to_wallet_id) {
      const fromIdx = wallets.findIndex(w => w.id === tx.wallet_id)
      const toIdx = wallets.findIndex(w => w.id === tx.to_wallet_id)
      if (fromIdx !== -1) wallets[fromIdx].balance -= tx.amount
      if (toIdx !== -1) wallets[toIdx].balance += tx.amount
    }
    this.saveWallets(wallets)

    // Recalculate Budgets spent amount if expense
    if (tx.type === 'expense') {
      const budgets = this.getBudgets()
      const bIdx = budgets.findIndex(b => b.category === tx.category)
      if (bIdx !== -1) {
        budgets[bIdx].spent_amount += tx.amount
        this.saveBudgets(budgets)
      }
    }

    try {
      Promise.resolve(
        supabase.from('fin_transactions').insert([{
          wallet_id: tx.wallet_id,
          to_wallet_id: tx.to_wallet_id,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          note: tx.note || '',
          date: tx.date,
          merchant: tx.merchant || ''
        }])
      ).catch(() => {})
    } catch {}

    return newTx
  }

  static deleteTransaction(id: string) {
    const txs = this.getTransactions()
    const target = txs.find(t => t.id === id)
    if (!target) return

    const updated = txs.filter(t => t.id !== id)
    this.saveTransactions(updated)

    // Reverse balance
    const wallets = this.getWallets()
    if (target.type === 'expense') {
      const idx = wallets.findIndex(w => w.id === target.wallet_id)
      if (idx !== -1) wallets[idx].balance += target.amount
    } else if (target.type === 'income') {
      const idx = wallets.findIndex(w => w.id === target.wallet_id)
      if (idx !== -1) wallets[idx].balance -= target.amount
    } else if (target.type === 'transfer' && target.to_wallet_id) {
      const fromIdx = wallets.findIndex(w => w.id === target.wallet_id)
      const toIdx = wallets.findIndex(w => w.id === target.to_wallet_id)
      if (fromIdx !== -1) wallets[fromIdx].balance += target.amount
      if (toIdx !== -1) wallets[toIdx].balance -= target.amount
    }
    this.saveWallets(wallets)
  }

  static getBudgets(): OlloBudget[] {
    if (typeof window === 'undefined') return INITIAL_BUDGETS
    const data = localStorage.getItem(KEYS.BUDGETS)
    if (!data) {
      localStorage.setItem(KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS))
      return INITIAL_BUDGETS
    }
    try { return JSON.parse(data) } catch { return INITIAL_BUDGETS }
  }

  static saveBudgets(budgets: OlloBudget[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets))
  }

  static getSavingsGoals(): OlloSavingsGoal[] {
    if (typeof window === 'undefined') return INITIAL_SAVINGS
    const data = localStorage.getItem(KEYS.SAVINGS)
    if (!data) {
      localStorage.setItem(KEYS.SAVINGS, JSON.stringify(INITIAL_SAVINGS))
      return INITIAL_SAVINGS
    }
    try { return JSON.parse(data) } catch { return INITIAL_SAVINGS }
  }

  static saveSavingsGoals(goals: OlloSavingsGoal[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(KEYS.SAVINGS, JSON.stringify(goals))
  }

  static depositSavingsGoal(id: string, percentage: number) {
    const goals = this.getSavingsGoals()
    const idx = goals.findIndex(g => g.id === id)
    if (idx === -1) return

    const addAmount = Math.round((goals[idx].target_amount * percentage) / 100)
    goals[idx].current_amount = Math.min(goals[idx].current_amount + addAmount, goals[idx].target_amount)
    this.saveSavingsGoals(goals)
  }

  static getTodaySummary() {
    const txs = this.getTransactions()
    const todayStr = new Date().toISOString().split('T')[0]

    const todayExpense = txs
      .filter(t => t.date === todayStr && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)

    const dailyAvgTarget = 150000 // Rata-rata acuan harian Rp 150.000

    return {
      todayExpense,
      dailyAvgTarget,
      percentageOfAvg: Math.min(Math.round((todayExpense / dailyAvgTarget) * 100), 100)
    }
  }
}
