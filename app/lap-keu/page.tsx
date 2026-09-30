"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  PiggyBank,
  Target,
  Trash2,
  Calendar,
  Sparkles,
  ChevronRight,
  Check,
  X
} from 'lucide-react'
import {
  OlloStore,
  OlloWallet,
  OlloTransaction,
  OlloBudget,
  OlloSavingsGoal,
  formatRupiahShort,
  formatRupiahFull
} from '@/lib/ollo-store'

export default function OlloHomePage() {
  const [wallets, setWallets] = useState<OlloWallet[]>([])
  const [transactions, setTransactions] = useState<OlloTransaction[]>([])
  const [budgets, setBudgets] = useState<OlloBudget[]>([])
  const [savings, setSavings] = useState<OlloSavingsGoal[]>([])
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all')
  const [todaySummary, setTodaySummary] = useState({ todayExpense: 0, dailyAvgTarget: 150000, percentageOfAvg: 0 })

  // Add Wallet Modal
  const [showAddWallet, setShowAddWallet] = useState(false)
  const [newWalletName, setNewWalletName] = useState('')
  const [newWalletBalance, setNewWalletBalance] = useState('')
  const [newWalletType, setNewWalletType] = useState<'cash' | 'bank' | 'wallet' | 'credit'>('bank')
  const [newWalletColor, setNewWalletColor] = useState<'emerald' | 'blue' | 'cyan' | 'purple' | 'amber'>('blue')

  const loadAllData = () => {
    setWallets(OlloStore.getWallets())
    setTransactions(OlloStore.getTransactions())
    setBudgets(OlloStore.getBudgets())
    setSavings(OlloStore.getSavingsGoals())
    setTodaySummary(OlloStore.getTodaySummary())
  }

  useEffect(() => {
    loadAllData()

    const handleUpdate = () => loadAllData()
    window.addEventListener('ollo_data_updated', handleUpdate)
    return () => window.removeEventListener('ollo_data_updated', handleUpdate)
  }, [])

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWalletName.trim()) return

    const num = parseInt(newWalletBalance.replace(/\D/g, '')) || 0
    OlloStore.addWallet({
      name: newWalletName,
      balance: num,
      type: newWalletType,
      color: newWalletColor
    })

    loadAllData()
    setShowAddWallet(false)
    setNewWalletName('')
    setNewWalletBalance('')
  }

  const handleDeleteTx = (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      OlloStore.deleteTransaction(id)
      loadAllData()
    }
  }

  // Calculate total balance
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0)

  // Filter transactions by selected wallet
  const filteredTxs = transactions.filter(t => {
    if (selectedWalletId === 'all') return true
    return t.wallet_id === selectedWalletId || t.to_wallet_id === selectedWalletId
  })

  // Group transactions by date
  const todayStr = new Date().toISOString().split('T')[0]
  const groupedTxs: Record<string, OlloTransaction[]> = {}

  filteredTxs.forEach(t => {
    let dateLabel = t.date
    if (t.date === todayStr) dateLabel = 'Hari Ini'
    else if (t.date === '2026-09-29') dateLabel = 'Kemarin'

    if (!groupedTxs[dateLabel]) groupedTxs[dateLabel] = []
    groupedTxs[dateLabel].push(t)
  })

  const walletColorsMap = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
    blue: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
    cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100',
    purple: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
  }

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Multi-Wallet Carousel Bar (Paling Atas) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Dompet Saya ({wallets.length})
          </span>
          <span className="text-xs font-bold text-slate-700">
            Total: <strong className="text-emerald-600">{formatRupiahShort(totalBalance)}</strong>
          </span>
        </div>

        {/* Carousel / Flex Horizontal Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {/* Filter All Pill */}
          <button
            type="button"
            onClick={() => setSelectedWalletId('all')}
            className={`flex-shrink-0 px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              selectedWalletId === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Semua</span>
            <span className="text-[10px] opacity-80">({formatRupiahShort(totalBalance)})</span>
          </button>

          {/* Individual Wallet Pills */}
          {wallets.map((w) => {
            const isSelected = selectedWalletId === w.id
            const style = walletColorsMap[w.color || 'emerald']

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWalletId(w.id)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-white shadow-xs text-slate-900'
                    : style
                }`}
              >
                <span>{w.icon || '💳'}</span>
                <span>{w.name}</span>
                <span className="font-extrabold">{formatRupiahShort(w.balance)}</span>
              </button>
            )
          })}

          {/* Add Wallet Button */}
          <button
            type="button"
            onClick={() => setShowAddWallet(true)}
            className="flex-shrink-0 px-3 py-2 rounded-2xl border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 hover:border-slate-400 bg-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            <span>Dompet</span>
          </button>
        </div>
      </div>

      {/* 2. Today's Spending Widget (Ringkasan Pengeluaran Hari Ini) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
            <span>Pengeluaran Hari Ini</span>
          </div>
          <span className="font-extrabold text-rose-600 text-sm">
            {formatRupiahFull(todaySummary.todayExpense)}
          </span>
        </div>

        {/* Compact Mini Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${todaySummary.percentageOfAvg}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                todaySummary.percentageOfAvg > 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>Terpakai {todaySummary.percentageOfAvg}% dari rata-rata harian</span>
            <span>Target: {formatRupiahShort(todaySummary.dailyAvgTarget)}/hari</span>
          </div>
        </div>
      </div>

      {/* 3. Transaction Feed (Clean Minimalist Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Riwayat Transaksi
          </span>
          <Link
            href="/lap-keu/transaksi"
            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
          >
            <span>Lihat Semua</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {Object.keys(groupedTxs).length > 0 ? (
          Object.entries(groupedTxs).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 px-1 pt-1">
                {dateGroup}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {items.map((t) => {
                  const isIncome = t.type === 'income'
                  const isTransfer = t.type === 'transfer'

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-base shrink-0">
                          {t.category.split(' ')[0] || '💳'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {t.note || t.category}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{t.time || '12:00'}</span>
                            <span>·</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                              {wallets.find(w => w.id === t.wallet_id)?.name || 'Dompet'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <span className={`font-extrabold text-xs ${
                          isIncome ? 'text-emerald-600' : isTransfer ? 'text-blue-600' : 'text-slate-900'
                        }`}>
                          {isIncome ? '+' : isTransfer ? '↔' : '-'} {formatRupiahFull(t.amount)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteTx(t.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          /* Clean Empty State */
          <div className="p-8 bg-white border border-slate-200/80 rounded-2xl text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              🍃
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-slate-800">Belum ada transaksi hari ini</h4>
              <p className="text-[11px] text-slate-400">Seluruh catatan keuangan Anda akan muncul rapi di sini.</p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Budget Snippets */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Budget Bulanan Ringkas
          </span>
          <Link href="/lap-keu/budget" className="text-xs font-bold text-emerald-600 hover:underline">
            Kelola
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {budgets.slice(0, 2).map((b) => {
            const pct = Math.min(Math.round((b.spent_amount / b.limit_amount) * 100), 100)
            const isOver = b.spent_amount > b.limit_amount

            return (
              <div key={b.id} className="p-3 bg-white border border-slate-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate">{b.category}</span>
                  {isOver ? (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                      Over budget!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold">{pct}%</span>
                  )}
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Wallet Modal */}
      <AnimatePresence>
        {showAddWallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Tambah Dompet Baru</h3>
                <button onClick={() => setShowAddWallet(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateWallet} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Nama Dompet</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BCA Tabungan, Mandiri, Cash"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="text"
                    placeholder="Rp 0"
                    value={newWalletBalance}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, '')) || 0
                      setNewWalletBalance(formatRupiahFull(num))
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Warna Kartu</label>
                  <select
                    value={newWalletColor}
                    onChange={(e) => setNewWalletColor(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    <option value="emerald">Emerald (Hijau Pastel)</option>
                    <option value="blue">Blue (Biru Pastel)</option>
                    <option value="cyan">Cyan (Cyan Pastel)</option>
                    <option value="purple">Purple (Ungu Pastel)</option>
                    <option value="amber">Amber (Kuning Pastel)</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddWallet(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-extrabold cursor-pointer"
                  >
                    + Buat Dompet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
