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
  card_number?: string
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

// Initial Ollo Seed Data (Cleaned: 1 Primary Account BNI Utama Rp 5.000.000, 0 Dummy Transactions)
export const INITIAL_WALLETS: OlloWallet[] = [
  {
    id: 'w-bni',
    name: 'BNI Utama',
    balance: 5000000,
    initial_balance: 5000000,
    card_number: '•••• •••• •••• 1922',
    type: 'bank',
    color: 'blue',
    icon: '🏦',
    logo_url: 'https://upload.wikimedia.org/wikipedia/en/2/27/Bank_Negara_Indonesia_logo.svg'
  }
]

export const INITIAL_TRANSACTIONS: OlloTransaction[] = []

export const INITIAL_BUDGETS: OlloBudget[] = []

export const INITIAL_SAVINGS: OlloSavingsGoal[] = []

const KEYS = {
  WALLETS: 'ollo_wallets_v4',
  TRANSACTIONS: 'ollo_transactions_v4',
  BUDGETS: 'ollo_budgets_v4',
  SAVINGS: 'ollo_savings_v4'
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
    try {
      const parsed = JSON.parse(data)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_WALLETS
    } catch {
      return INITIAL_WALLETS
    }
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
      initial_balance: wallet.balance,
      card_number: wallet.card_number || `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`
    }
    const updated = [...wallets, newW]
    this.saveWallets(updated)

    try {
      Promise.resolve(
        supabase.from('fin_wallets').upsert({
          id: newW.id,
          name: newW.name,
          nama_akun: newW.name,
          balance: newW.balance,
          saldo_sekarang: newW.balance,
          initial_balance: newW.initial_balance,
          card_number: newW.card_number,
          nomor_kartu: newW.card_number,
          type: newW.type,
          color: newW.color,
          warna: newW.color,
          logo_url: newW.logo_url || ''
        })
      ).catch(() => {})
    } catch {}

    return newW
  }

  static updateWallet(id: string, updates: Partial<OlloWallet>): OlloWallet | null {
    const wallets = this.getWallets()
    const idx = wallets.findIndex(w => w.id === id)
    if (idx === -1) return null

    // Calculate transaction delta for this wallet to keep balance correction exact
    const txs = this.getTransactions()
    let txDelta = 0
    txs.forEach(t => {
      if (t.wallet_id === id) {
        if (t.type === 'income') txDelta += t.amount
        else if (t.type === 'expense' || t.type === 'transfer') txDelta -= t.amount
      }
      if (t.type === 'transfer' && t.to_wallet_id === id) {
        txDelta += t.amount
      }
    })

    if (updates.balance !== undefined) {
      updates.initial_balance = updates.balance - txDelta
    }

    wallets[idx] = { ...wallets[idx], ...updates }
    this.saveWallets(wallets)
    this.recalculateBalances()

    const updatedW = wallets[idx]

    try {
      Promise.resolve(
        supabase.from('fin_wallets').upsert({
          id: updatedW.id,
          name: updatedW.name,
          nama_akun: updatedW.name,
          balance: updatedW.balance,
          saldo_sekarang: updatedW.balance,
          initial_balance: updatedW.initial_balance,
          card_number: updatedW.card_number || '',
          nomor_kartu: updatedW.card_number || '',
          type: updatedW.type,
          color: updatedW.color,
          warna: updatedW.color,
          logo_url: updatedW.logo_url || ''
        })
      ).catch(() => {})
    } catch {}

    return updatedW
  }

  static deleteWallet(id: string): boolean {
    const wallets = this.getWallets()
    if (wallets.length <= 1) {
      return false
    }

    const filtered = wallets.filter(w => w.id !== id)
    this.saveWallets(filtered)

    // Remove associated transactions
    const txs = this.getTransactions().filter(t => t.wallet_id !== id && t.to_wallet_id !== id)
    this.saveTransactions(txs)
    this.recalculateBalances()

    try {
      Promise.resolve(
        supabase.from('fin_wallets').delete().eq('id', id)
      ).catch(() => {})
    } catch {}

    return true
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
    const updatedWallets = this.recalculateBalances()

    try {
      Promise.resolve().then(async () => {
        await supabase.from('fin_transactions').insert([{
          wallet_id: tx.wallet_id,
          to_wallet_id: tx.to_wallet_id || null,
          type: tx.type,
          amount: tx.amount,
          category: tx.category,
          note: tx.note || '',
          date: tx.date,
          merchant: tx.merchant || ''
        }])

        for (const w of updatedWallets) {
          await supabase.from('fin_wallets').upsert({
            id: w.id,
            name: w.name,
            nama_akun: w.name,
            balance: w.balance,
            saldo_sekarang: w.balance,
            initial_balance: w.initial_balance,
            card_number: w.card_number || '',
            nomor_kartu: w.card_number || '',
            type: w.type,
            color: w.color,
            warna: w.color,
            logo_url: w.logo_url || ''
          })
        }
      }).catch(() => {})
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
  static recalculateBalances(): OlloWallet[] {
    const wallets = this.getWallets()
    const txs = this.getTransactions()
    const budgets = this.getBudgets()

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

    return wallets
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

    goals[gIdx].current_amount = Math.min(goals[gIdx].current_amount + depositAmount, goals[gIdx].target_amount)
    this.saveSavingsGoals(goals)

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

    const dailyAvgTarget = 150000

    return {
      todayExpense,
      dailyAvgTarget,
      percentageOfAvg: Math.min(Math.round((todayExpense / dailyAvgTarget) * 100), 100)
    }
  }

  // Supabase Fetch & Sync
  static async syncFromSupabase() {
    if (typeof window === 'undefined') return
    try {
      const { data: dbWallets } = await supabase.from('fin_wallets').select('*')
      if (dbWallets && dbWallets.length > 0) {
        const mappedWallets: OlloWallet[] = dbWallets.map(w => ({
          id: w.id ? String(w.id) : `w-${Date.now()}`,
          name: w.name || w.nama_akun || 'BNI Utama',
          balance: Number(w.balance ?? w.saldo_sekarang ?? 5000000),
          initial_balance: Number(w.initial_balance ?? w.balance ?? w.saldo_sekarang ?? 5000000),
          card_number: w.card_number || w.nomor_kartu || '•••• •••• •••• 1922',
          type: w.type || 'bank',
          color: w.color || w.warna || 'blue',
          logo_url: w.logo_url || 'https://upload.wikimedia.org/wikipedia/en/2/27/Bank_Negara_Indonesia_logo.svg'
        }))
        this.saveWallets(mappedWallets)
      } else {
        await supabase.from('fin_wallets').upsert({
          id: 'w-bni',
          name: 'BNI Utama',
          nama_akun: 'BNI Utama',
          balance: 5000000,
          saldo_sekarang: 5000000,
          card_number: '•••• •••• •••• 1922',
          nomor_kartu: '•••• •••• •••• 1922',
          type: 'bank',
          color: 'blue',
          warna: 'blue',
          logo_url: 'https://upload.wikimedia.org/wikipedia/en/2/27/Bank_Negara_Indonesia_logo.svg'
        })
      }

      const { data: dbTxs } = await supabase.from('fin_transactions').select('*').order('created_at', { ascending: false })
      if (dbTxs) {
        const mappedTxs: OlloTransaction[] = dbTxs.map(t => ({
          id: t.id ? String(t.id) : `ot-${Date.now()}`,
          wallet_id: t.wallet_id,
          to_wallet_id: t.to_wallet_id,
          type: t.type,
          amount: Number(t.amount),
          category: t.category,
          note: t.note,
          date: t.date || new Date().toISOString().split('T')[0],
          merchant: t.merchant
        }))
        this.saveTransactions(mappedTxs)
      }
      this.recalculateBalances()
    } catch (err) {
      console.warn('Supabase sync warning:', err)
    }
  }

  // Supabase Realtime Listener Setup
  static setupRealtimeListener(onUpdate?: () => void) {
    if (typeof window === 'undefined') return
    try {
      const channel = supabase
        .channel('realtime_fin_dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_wallets' }, async () => {
          await OlloStore.syncFromSupabase()
          OlloStore.notifyChange()
          if (onUpdate) onUpdate()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_transactions' }, async () => {
          await OlloStore.syncFromSupabase()
          OlloStore.notifyChange()
          if (onUpdate) onUpdate()
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch {}
  }
}
