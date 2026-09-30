"use client"

import { supabase } from './supabase'

export interface OlloWallet {
  id: string
  name: string
  balance: number
  type: 'cash' | 'bank' | 'wallet' | 'credit'
  color: 'emerald' | 'blue' | 'cyan' | 'purple' | 'amber' | 'rose'
  icon?: string
  logo_url?: string
  initial_balance?: number
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
  { id: 'w-cash', name: 'Cash Tunai', balance: 500000, initial_balance: 500000, type: 'cash', color: 'emerald', icon: '💵', logo_url: '💵' },
  { id: 'w-bca', name: 'BCA Utama', balance: 15200000, initial_balance: 15200000, type: 'bank', color: 'blue', icon: '🏦', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg' },
  { id: 'w-gopay', name: 'GoPay / QRIS', balance: 2100000, initial_balance: 2100000, type: 'wallet', color: 'cyan', icon: '📱', logo_url: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg' }
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
  { id: 'ob-4', category: '🎬 Hiburan & Hobi', limit_amount: 1000000, spent_amount: 1200000 }
]

export const INITIAL_SAVINGS: OlloSavingsGoal[] = [
  { id: 'os-1', title: 'Target Dana Darurat', target_amount: 15000000, current_amount: 5000000, target_date: '2026-12-31', color: 'emerald' },
  { id: 'os-2', title: 'Upgrade Laptop M4', target_amount: 20000000, current_amount: 7500000, target_date: '2027-01-15', color: 'blue' }
]

const KEYS = {
  WALLETS: 'ollo_wallets_v3',
  TRANSACTIONS: 'ollo_transactions_v3',
  BUDGETS: 'ollo_budgets_v3',
  SAVINGS: 'ollo_savings_v3'
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
  static notifyChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ollo_data_updated'))
    }
  }

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
    this.notifyChange()
  }

  static addWallet(wallet: Omit<OlloWallet, 'id'>): OlloWallet {
    const wallets = this.getWallets()
    const newW: OlloWallet = {
      ...wallet,
      id: `w-${Date.now()}`,
      initial_balance: wallet.balance
    }
    const updated = [...wallets, newW]
    this.saveWallets(updated)

    try {
      Promise.resolve(
        supabase.from('fin_wallets').insert([{
          name: newW.name,
          balance: newW.balance,
          type: newW.type,
          color: newW.color,
          logo_url: newW.logo_url || ''
        }])
      ).catch(() => {})
    } catch {}

    return newW
  }

  static updateWallet(id: string, updates: Partial<OlloWallet>): OlloWallet | null {
    const wallets = this.getWallets()
    const idx = wallets.findIndex(w => w.id === id)
    if (idx === -1) return null

    wallets[idx] = { ...wallets[idx], ...updates }
    this.saveWallets(wallets)
    this.recalculateBalances()
    return wallets[idx]
  }

  static deleteWallet(id: string) {
    const wallets = this.getWallets().filter(w => w.id !== id)
    this.saveWallets(wallets)

    // Remove associated transactions
    const txs = this.getTransactions().filter(t => t.wallet_id !== id && t.to_wallet_id !== id)
    this.saveTransactions(txs)
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
    this.notifyChange()
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
    this.recalculateBalances()

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

  static updateTransaction(id: string, updates: Partial<OlloTransaction>): OlloTransaction | null {
    const txs = this.getTransactions()
    const idx = txs.findIndex(t => t.id === id)
    if (idx === -1) return null

    txs[idx] = { ...txs[idx], ...updates }
    this.saveTransactions(txs)
    this.recalculateBalances()
    return txs[idx]
  }

  static deleteTransaction(id: string) {
    const txs = this.getTransactions().filter(t => t.id !== id)
    this.saveTransactions(txs)
    this.recalculateBalances()
  }

  // Auto Recalculate Balance Rule:
  // Current Balance = Initial Balance + Sum(Income) - Sum(Expense) - Sum(Transfers Out) + Sum(Transfers In)
  static recalculateBalances() {
    const wallets = this.getWallets()
    const txs = this.getTransactions()
    const budgets = this.getBudgets()

    // Reset budget spent amounts
    const budgetMap: Record<string, number> = {}

    wallets.forEach(w => {
      let balance = w.initial_balance ?? w.balance

      txs.forEach(t => {
        if (t.wallet_id === w.id) {
          if (t.type === 'income') balance += t.amount
          else if (t.type === 'expense') balance -= t.amount
          else if (t.type === 'transfer') balance -= t.amount
        }
        if (t.type === 'transfer' && t.to_wallet_id === w.id) {
          balance += t.amount
        }
      })

      w.balance = balance
    })

    // Recalculate budgets spent
    txs.forEach(t => {
      if (t.type === 'expense') {
        budgetMap[t.category] = (budgetMap[t.category] || 0) + t.amount
      }
    })

    budgets.forEach(b => {
      b.spent_amount = budgetMap[b.category] || 0
    })

    this.saveWallets(wallets)
    this.saveBudgets(budgets)
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
    this.notifyChange()
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
    this.notifyChange()
  }

  static addSavingsGoal(goal: Omit<OlloSavingsGoal, 'id'>): OlloSavingsGoal {
    const goals = this.getSavingsGoals()
    const newG: OlloSavingsGoal = { ...goal, id: `os-${Date.now()}` }
    const updated = [...goals, newG]
    this.saveSavingsGoals(updated)
    return newG
  }

  static depositSavingsGoal(goalId: string, depositAmount: number, fromWalletId: string) {
    const goals = this.getSavingsGoals()
    const gIdx = goals.findIndex(g => g.id === goalId)
    if (gIdx === -1) return

    // Update Goal current_amount
    goals[gIdx].current_amount = Math.min(goals[gIdx].current_amount + depositAmount, goals[gIdx].target_amount)
    this.saveSavingsGoals(goals)

    // Add Expense/Transfer transaction from wallet
    const wallet = this.getWallets().find(w => w.id === fromWalletId)
    this.addTransaction({
      wallet_id: fromWalletId,
      type: 'expense',
      amount: depositAmount,
      category: '🎯 Setoran Tabungan',
      note: `Setoran Tabungan: ${goals[gIdx].title}`,
      date: new Date().toISOString().split('T')[0],
      merchant: goals[gIdx].title
    })
  }

  static getTodaySummary() {
    const txs = this.getTransactions()
    const todayStr = new Date().toISOString().split('T')[0]

    const todayExpense = txs
      .filter(t => t.date === todayStr && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)

    const dailyAvgTarget = 150000 // Rata-rata harian Rp 150.000

    return {
      todayExpense,
      dailyAvgTarget,
      percentageOfAvg: Math.min(Math.round((todayExpense / dailyAvgTarget) * 100), 100)
    }
  }

  // Supabase Realtime Listener Setup
  static setupRealtimeListener() {
    if (typeof window === 'undefined') return
    try {
      const channel = supabase
        .channel('fin_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_wallets' }, () => {
          OlloStore.notifyChange()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_transactions' }, () => {
          OlloStore.notifyChange()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_savings' }, () => {
          OlloStore.notifyChange()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch {}
  }
}
