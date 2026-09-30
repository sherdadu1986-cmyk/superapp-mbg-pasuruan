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

  // Pure Supabase Online Sync (Single Source of Truth)
  static async syncFromSupabase(): Promise<{ wallets: OlloWallet[]; transactions: OlloTransaction[] }> {
    if (typeof window === 'undefined') return { wallets: [], transactions: [] }
    try {
      // 1. Fetch Wallets directly from Supabase Cloud
      const { data: dbWallets, error: wErr } = await supabase
        .from('fin_wallets')
        .select('*')
        .order('created_at', { ascending: true })

      let wallets: OlloWallet[] = []

      if (!wErr && dbWallets && dbWallets.length > 0) {
        wallets = dbWallets.map(w => ({
          id: String(w.id),
          name: w.name || w.nama_akun || 'BNI Utama',
          balance: Number(w.balance ?? w.saldo_sekarang ?? 1000000),
          initial_balance: Number(w.initial_balance ?? 1000000),
          card_number: w.card_number || w.nomor_kartu || '•••• •••• •••• 1922',
          type: w.type || 'bank',
          color: w.color || w.warna || 'blue',
          logo_url: w.logo_url || 'https://upload.wikimedia.org/wikipedia/en/2/27/Bank_Negara_Indonesia_logo.svg'
        }))
      } else if (!dbWallets || dbWallets.length === 0) {
        // Seed default wallet to Supabase Cloud if database table is empty
        const defaultWalletPayload = {
          id: 'w-bni',
          name: 'BNI Utama',
          nama_akun: 'BNI Utama',
          balance: 1000000,
          saldo_sekarang: 1000000,
          initial_balance: 1000000,
          card_number: '•••• •••• •••• 1922',
          nomor_kartu: '•••• •••• •••• 1922',
          type: 'bank',
          color: 'blue',
          warna: 'blue',
          logo_url: 'https://upload.wikimedia.org/wikipedia/en/2/27/Bank_Negara_Indonesia_logo.svg'
        }
        await supabase.from('fin_wallets').upsert(defaultWalletPayload)
        wallets = [{
          id: defaultWalletPayload.id,
          name: defaultWalletPayload.name,
          balance: defaultWalletPayload.balance,
          initial_balance: defaultWalletPayload.initial_balance,
          card_number: defaultWalletPayload.card_number,
          type: 'bank',
          color: 'blue',
          logo_url: defaultWalletPayload.logo_url
        }]
      }

      // 2. Fetch Transactions directly from Supabase Cloud
      const { data: dbTxs, error: tErr } = await supabase
        .from('fin_transactions')
        .select('*')
        .order('created_at', { ascending: false })

      let transactions: OlloTransaction[] = []
      if (!tErr && dbTxs) {
        transactions = dbTxs.map(t => ({
          id: String(t.id),
          wallet_id: String(t.wallet_id || t.account_id || 'w-bni'),
          to_wallet_id: t.to_wallet_id ? String(t.to_wallet_id) : undefined,
          type: (t.type || t.tipe || 'expense').toLowerCase() as any,
          amount: Number(t.amount ?? t.nominal ?? 0),
          category: t.category || t.kategori || t.keterangan || 'Lainnya',
          note: t.note || t.catatan || t.keterangan || '',
          date: t.date || t.tanggal || new Date().toISOString().split('T')[0],
          merchant: t.merchant || ''
        }))
      }

      return { wallets, transactions }
    } catch (err) {
      console.error('Supabase fetch error:', err)
      return { wallets: [], transactions: [] }
    }
  }

  static async addWalletAsync(wallet: Omit<OlloWallet, 'id'>): Promise<OlloWallet> {
    const id = `w-${Date.now()}`
    const newW: OlloWallet = {
      ...wallet,
      id,
      initial_balance: wallet.balance,
      card_number: wallet.card_number || `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`
    }

    try {
      await supabase.from('fin_wallets').upsert({
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
    } catch (err) {
      console.error('Supabase add wallet error:', err)
    }

    this.notifyChange()
    return newW
  }

  static addWallet(wallet: Omit<OlloWallet, 'id'>): OlloWallet {
    const id = `w-${Date.now()}`
    const newW: OlloWallet = {
      ...wallet,
      id,
      initial_balance: wallet.balance,
      card_number: wallet.card_number || `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`
    }
    OlloStore.addWalletAsync(wallet).catch(err => console.error(err))
    return newW
  }

  static async updateWalletAsync(id: string, updates: Partial<OlloWallet>): Promise<boolean> {
    try {
      const payload: any = {}
      if (updates.name !== undefined) {
        payload.name = updates.name
        payload.nama_akun = updates.name
      }
      if (updates.balance !== undefined) {
        payload.balance = updates.balance
        payload.saldo_sekarang = updates.balance
      }
      if (updates.card_number !== undefined) {
        payload.card_number = updates.card_number
        payload.nomor_kartu = updates.card_number
      }
      if (updates.color !== undefined) {
        payload.color = updates.color
        payload.warna = updates.color
      }
      if (updates.logo_url !== undefined) {
        payload.logo_url = updates.logo_url
      }
      if (updates.type !== undefined) {
        payload.type = updates.type
      }

      await supabase.from('fin_wallets').update(payload).eq('id', id)
      this.notifyChange()
      return true
    } catch (err) {
      console.error('Supabase update wallet error:', err)
      return false
    }
  }

  static updateWallet(id: string, updates: Partial<OlloWallet>) {
    OlloStore.updateWalletAsync(id, updates).catch(err => console.error(err))
    return null
  }

  static async deleteWalletAsync(id: string): Promise<boolean> {
    try {
      const { data: currentWallets } = await supabase.from('fin_wallets').select('id')
      if (currentWallets && currentWallets.length <= 1) {
        return false
      }

      await supabase.from('fin_wallets').delete().eq('id', id)
      await supabase.from('fin_transactions').delete().eq('wallet_id', id)
      this.notifyChange()
      return true
    } catch (err) {
      console.error('Supabase delete wallet error:', err)
      return false
    }
  }

  static deleteWallet(id: string): boolean {
    OlloStore.deleteWalletAsync(id).catch(err => console.error(err))
    return true
  }

  // Add Transaction & Update Target Wallet Balance Directly in Supabase Cloud
  static async addTransactionAsync(tx: Omit<OlloTransaction, 'id'>): Promise<{ success: boolean; error?: any }> {
    try {
      const amt = Number(tx.amount)

      // Comprehensive payload matching English and Indonesian column schemas in Supabase
      const txPayload = {
        wallet_id: tx.wallet_id,
        account_id: tx.wallet_id,
        to_wallet_id: tx.to_wallet_id || null,
        type: tx.type,
        tipe: tx.type === 'expense' ? 'pengeluaran' : tx.type === 'income' ? 'pemasukan' : 'transfer',
        amount: amt,
        nominal: amt,
        category: tx.category,
        kategori: tx.category,
        note: tx.note || tx.category || 'Transaksi Manual',
        catatan: tx.note || tx.category || 'Transaksi Manual',
        keterangan: tx.note || tx.category || 'Transaksi Manual',
        date: tx.date || new Date().toISOString().split('T')[0],
        tanggal: tx.date || new Date().toISOString().split('T')[0],
        merchant: tx.merchant || null
      }

      // 1. Insert transaction into fin_transactions
      const { data: insertRes, error: txErr } = await supabase
        .from('fin_transactions')
        .insert([txPayload])
        .select()

      if (txErr) {
        console.error('Supabase fin_transactions insert primary error:', txErr)

        // Try minimal fallback payload if full schema payload hit an unexpected column error
        const fallbackPayload = {
          wallet_id: tx.wallet_id,
          account_id: tx.wallet_id,
          amount: amt,
          nominal: amt,
          type: tx.type,
          tipe: tx.type === 'expense' ? 'pengeluaran' : tx.type === 'income' ? 'pemasukan' : 'transfer',
          category: tx.category,
          keterangan: tx.note || tx.category || 'Transaksi Manual',
          tanggal: tx.date || new Date().toISOString().split('T')[0]
        }

        const { error: fallbackErr } = await supabase
          .from('fin_transactions')
          .insert([fallbackPayload])

        if (fallbackErr) {
          console.error('Supabase fin_transactions fallback insert error:', fallbackErr)
          return { success: false, error: fallbackErr }
        }
      }

      // 2. Fetch current target wallet from Supabase to compute exact new balance
      const { data: targetW } = await supabase
        .from('fin_wallets')
        .select('*')
        .eq('id', tx.wallet_id)
        .single()

      if (targetW) {
        const currBal = Number(targetW.balance ?? targetW.saldo_sekarang ?? 1000000)
        let newBal = currBal

        if (tx.type === 'expense') newBal = currBal - amt
        else if (tx.type === 'income') newBal = currBal + amt
        else if (tx.type === 'transfer') newBal = currBal - amt

        const { error: updateErr } = await supabase
          .from('fin_wallets')
          .update({
            balance: newBal,
            saldo_sekarang: newBal
          })
          .eq('id', tx.wallet_id)

        if (updateErr) {
          console.error('Supabase fin_wallets update error:', updateErr)
        }
      }

      // 3. If transfer type, add to receiving wallet balance as well
      if (tx.type === 'transfer' && tx.to_wallet_id) {
        const { data: toW } = await supabase
          .from('fin_wallets')
          .select('*')
          .eq('id', tx.to_wallet_id)
          .single()

        if (toW) {
          const toBal = Number(toW.balance ?? toW.saldo_sekarang ?? 0)
          await supabase
            .from('fin_wallets')
            .update({
              balance: toBal + amt,
              saldo_sekarang: toBal + amt
            })
            .eq('id', tx.to_wallet_id)
        }
      }

      this.notifyChange()
      return { success: true }
    } catch (err) {
      console.error('Add transaction error:', err)
      return { success: false, error: err }
    }
  }

  static addTransaction(tx: Omit<OlloTransaction, 'id'>): OlloTransaction {
    const newTx: OlloTransaction = {
      ...tx,
      id: `ot-${Date.now()}`
    }
    OlloStore.addTransactionAsync(tx).catch(err => console.error(err))
    return newTx
  }

  static async deleteTransactionAsync(id: string): Promise<boolean> {
    try {
      await supabase.from('fin_transactions').delete().eq('id', id)
      this.notifyChange()
      return true
    } catch (err) {
      console.error('Delete transaction error:', err)
      return false
    }
  }

  static deleteTransaction(id: string) {
    OlloStore.deleteTransactionAsync(id).catch(err => console.error(err))
  }

  // Helper static methods
  static getWallets(): OlloWallet[] {
    return []
  }

  static getTransactions(): OlloTransaction[] {
    return []
  }

  static saveWallets(wallets: OlloWallet[]) {}
  static saveTransactions(txs: OlloTransaction[]) {}

  static getBudgets(): OlloBudget[] {
    return []
  }

  static saveBudgets(budgets: OlloBudget[]) {}

  static getSavingsGoals(): OlloSavingsGoal[] {
    return []
  }

  static saveSavingsGoals(goals: OlloSavingsGoal[]) {}

  static depositSavingsGoal(goalId: string, depositAmount: number, fromWalletId: string) {
    OlloStore.addTransactionAsync({
      wallet_id: fromWalletId,
      type: 'expense',
      amount: depositAmount,
      category: '🎯 Setoran Tabungan',
      note: 'Setoran Tabungan',
      date: new Date().toISOString().split('T')[0]
    }).catch(err => console.error(err))
  }
}
