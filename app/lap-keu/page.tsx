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
  X,
  Edit2,
  MoreVertical,
  Filter,
  DollarSign
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
import { showToast } from '@/components/toast'
import ModalWallet from './components/ModalWallet'

export default function OlloHomePage() {
  const [wallets, setWallets] = useState<OlloWallet[]>([])
  const [transactions, setTransactions] = useState<OlloTransaction[]>([])
  const [budgets, setBudgets] = useState<OlloBudget[]>([])
  const [savings, setSavings] = useState<OlloSavingsGoal[]>([])
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all')
  const [todaySummary, setTodaySummary] = useState({ todayExpense: 0, dailyAvgTarget: 150000, percentageOfAvg: 0 })

  // Wallet Action Sheet State
  const [activeWalletAction, setActiveWalletAction] = useState<OlloWallet | null>(null)
  
  // Wallet Add / Edit Modal State
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [editingWallet, setEditingWallet] = useState<OlloWallet | null>(null)
  const [walletFormName, setWalletFormName] = useState('')
  const [walletFormBalance, setWalletFormBalance] = useState('')
  const [walletFormType, setWalletFormType] = useState<'cash' | 'bank' | 'wallet' | 'credit'>('bank')
  const [walletFormColor, setWalletFormColor] = useState<'emerald' | 'blue' | 'cyan' | 'purple' | 'amber' | 'rose'>('blue')

  // Transaction Edit Modal State
  const [editingTx, setEditingTx] = useState<OlloTransaction | null>(null)
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense')
  const [txAmount, setTxAmount] = useState('')
  const [txWalletId, setTxWalletId] = useState('w-bca')
  const [txToWalletId, setTxToWalletId] = useState('w-cash')
  const [txCategory, setTxCategory] = useState('🍜 Makanan & Minuman')
  const [txNote, setTxNote] = useState('')
  const [txDate, setTxDate] = useState('')

  // Savings Deposit Modal State
  const [depositGoal, setDepositGoal] = useState<OlloSavingsGoal | null>(null)
  const [depositAmount, setDepositAmount] = useState<number>(100000)
  const [depositWalletId, setDepositWalletId] = useState<string>('w-bca')

  // Add Savings Goal Modal State
  const [showAddSavings, setShowAddSavings] = useState(false)
  const [savingsTitle, setSavingsTitle] = useState('')
  const [savingsTarget, setSavingsTarget] = useState('')

  const loadAllData = () => {
    setWallets(OlloStore.getWallets())
    setTransactions(OlloStore.getTransactions())
    setBudgets(OlloStore.getBudgets())
    setSavings(OlloStore.getSavingsGoals())
    setTodaySummary(OlloStore.getTodaySummary())
  }

  useEffect(() => {
    loadAllData()

    // Realtime Supabase listener
    const cleanup = OlloStore.setupRealtimeListener()

    const handleUpdate = () => loadAllData()
    window.addEventListener('ollo_data_updated', handleUpdate)
    return () => {
      window.removeEventListener('ollo_data_updated', handleUpdate)
      if (cleanup) cleanup()
    }
  }, [])

  // Wallet Modal Open Handlers
  const handleOpenAddWallet = () => {
    setEditingWallet(null)
    setWalletFormName('')
    setWalletFormBalance('')
    setWalletFormType('bank')
    setWalletFormColor('blue')
    setShowWalletModal(true)
  }

  const handleOpenEditWallet = (w: OlloWallet) => {
    setEditingWallet(w)
    setWalletFormName(w.name)
    setWalletFormBalance(formatRupiahFull(w.balance))
    setWalletFormType(w.type)
    setWalletFormColor(w.color)
    setActiveWalletAction(null)
    setShowWalletModal(true)
  }

  const handleSaveWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletFormName.trim()) return

    const num = parseInt(walletFormBalance.replace(/\D/g, '')) || 0

    if (editingWallet) {
      OlloStore.updateWallet(editingWallet.id, {
        name: walletFormName,
        balance: num,
        initial_balance: num,
        type: walletFormType,
        color: walletFormColor
      })
      showToast({ type: 'success', title: 'Dompet Berhasil Diperbarui', message: `Saldo dompet ${walletFormName} telah disesuaikan.` })
    } else {
      OlloStore.addWallet({
        name: walletFormName,
        balance: num,
        type: walletFormType,
        color: walletFormColor
      })
      showToast({ type: 'success', title: 'Dompet Baru Dibuat', message: `Dompet ${walletFormName} berhasil ditambahkan.` })
    }

    loadAllData()
    setShowWalletModal(false)
  }

  const handleDeleteWallet = (w: OlloWallet) => {
    if (confirm(`Hapus dompet "${w.name}" beserta seluruh riwayat reaksinya?`)) {
      OlloStore.deleteWallet(w.id)
      setActiveWalletAction(null)
      loadAllData()
      showToast({ type: 'warning', title: 'Dompet Dihapus', message: `Dompet ${w.name} telah dihapus.` })
    }
  }

  // Transaction Edit Handlers
  const handleOpenEditTx = (t: OlloTransaction) => {
    setEditingTx(t)
    setTxType(t.type)
    setTxAmount(formatRupiahFull(t.amount))
    setTxWalletId(t.wallet_id)
    setTxToWalletId(t.to_wallet_id || 'w-cash')
    setTxCategory(t.category)
    setTxNote(t.note || '')
    setTxDate(t.date)
  }

  const handleSaveTxSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTx) return

    const num = parseInt(txAmount.replace(/\D/g, '')) || 0
    if (num <= 0) return

    OlloStore.updateTransaction(editingTx.id, {
      wallet_id: txWalletId,
      to_wallet_id: txType === 'transfer' ? txToWalletId : undefined,
      type: txType,
      amount: num,
      category: txType === 'transfer' ? '🏦 Transfer Antar Dompet' : txCategory,
      note: txNote || undefined,
      date: txDate
    })

    setEditingTx(null)
    loadAllData()
    showToast({ type: 'success', title: 'Transaksi Diperbarui', message: 'Saldo dompet otomatis terkalkulasi ulang.' })
  }

  const handleDeleteTx = (id: string) => {
    if (confirm('Hapus transaksi ini? Saldo dompet akan disesuaikan otomatis.')) {
      OlloStore.deleteTransaction(id)
      setEditingTx(null)
      loadAllData()
      showToast({ type: 'warning', title: 'Transaksi Dihapus', message: 'Kalkulasi saldo diperbarui.' })
    }
  }

  // Savings Deposit Submit
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!depositGoal || depositAmount <= 0) return

    OlloStore.depositSavingsGoal(depositGoal.id, depositAmount, depositWalletId)
    setDepositGoal(null)
    loadAllData()
    showToast({
      type: 'success',
      title: 'Setoran Tabungan Berhasil!',
      message: `${formatRupiahFull(depositAmount)} dialokasikan ke ${depositGoal.title}.`
    })
  }

  // Create Savings Goal
  const handleCreateSavings = (e: React.FormEvent) => {
    e.preventDefault()
    if (!savingsTitle.trim()) return

    const targetNum = parseInt(savingsTarget.replace(/\D/g, '')) || 0
    OlloStore.addSavingsGoal({
      title: savingsTitle,
      target_amount: targetNum,
      current_amount: 0,
      color: 'emerald'
    })

    setShowAddSavings(false)
    setSavingsTitle('')
    setSavingsTarget('')
    loadAllData()
    showToast({ type: 'success', title: 'Target Tabungan Dibuat', message: `Target ${savingsTitle} berhasil didaftarkan.` })
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Dompet Saya ({wallets.length})
            </span>
            <button
              type="button"
              onClick={handleOpenAddWallet}
              className="px-2 py-0.5 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold text-[10px] transition cursor-pointer flex items-center gap-0.5 border border-emerald-200"
            >
              <Plus size={12} />
              <span>Tambah</span>
            </button>
          </div>

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

          {/* Individual Wallet Chips */}
          {wallets.map((w) => {
            const isSelected = selectedWalletId === w.id
            const style = walletColorsMap[w.color || 'emerald']

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setActiveWalletAction(w)}
                className={`flex-shrink-0 px-3.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 border-emerald-500 bg-white shadow-xs text-slate-900'
                    : style
                }`}
              >
                {w.logo_url && (w.logo_url.startsWith('http') || w.logo_url.startsWith('data:')) ? (
                  <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={w.logo_url} alt={w.name} className="w-full h-full object-contain p-0.5" />
                  </div>
                ) : (
                  <span>{w.logo_url || w.icon || '💳'}</span>
                )}
                <span>{w.name}</span>
                <span className="font-extrabold">{formatRupiahShort(w.balance)}</span>
              </button>
            )
          })}
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

      {/* 3. Transaction Feed (Klik untuk Edit & Hapus Cepat) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Riwayat Transaksi
            </span>
            {selectedWalletId !== 'all' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Filter: {wallets.find(w => w.id === selectedWalletId)?.name}
              </span>
            )}
          </div>
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
                      onClick={() => handleOpenEditTx(t)}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-base shrink-0">
                          {t.category.split(' ')[0] || '💳'}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-600 transition">
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

                      <div className="flex items-center gap-2 text-right">
                        <span className={`font-extrabold text-xs ${
                          isIncome ? 'text-emerald-600' : isTransfer ? 'text-blue-600' : 'text-slate-900'
                        }`}>
                          {isIncome ? '+' : isTransfer ? '↔' : '-'} {formatRupiahFull(t.amount)}
                        </span>
                        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
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

      {/* 5. Seksi Target Tabungan (Savings Goals) di Beranda */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Target Tabungan (Savings Goals)
            </span>
            <button
              type="button"
              onClick={() => setShowAddSavings(true)}
              className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]"
            >
              + Target
            </button>
          </div>

          <Link href="/lap-keu/budget" className="text-xs font-bold text-emerald-600 hover:underline">
            Detail
          </Link>
        </div>

        <div className="space-y-2.5">
          {savings.map((s) => {
            const pct = Math.min(Math.round((s.current_amount / s.target_amount) * 100), 100)

            return (
              <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm">
                      🎯
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{s.title}</h4>
                      <p className="text-[10px] text-slate-400">Target: {s.target_date || '2026-12-31'}</p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    {pct}%
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Terkumpul: <strong className="text-slate-900">{formatRupiahFull(s.current_amount)}</strong></span>
                  <span>Target: <strong className="text-slate-900">{formatRupiahFull(s.target_amount)}</strong></span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  />
                </div>

                {/* Instant Deposit Trigger */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium">Setoran Instan:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDepositGoal(s)
                        setDepositAmount(50000)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition"
                    >
                      +Rp 50k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositGoal(s)
                        setDepositAmount(100000)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition"
                    >
                      +Rp 100k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositGoal(s)
                        setDepositAmount(500000)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-2xs transition"
                    >
                      + Setor Custom
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL 1: Wallet Action Sheet */}
      <AnimatePresence>
        {activeWalletAction && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-3 border border-slate-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{activeWalletAction.icon || '💳'}</span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{activeWalletAction.name}</h3>
                    <p className="text-[10px] text-emerald-600 font-bold">{formatRupiahFull(activeWalletAction.balance)}</p>
                  </div>
                </div>
                <button onClick={() => setActiveWalletAction(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5 text-xs font-semibold text-slate-700 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWalletId(activeWalletAction.id)
                    setActiveWalletAction(null)
                  }}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 text-left transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter size={15} className="text-emerald-600" />
                    <span>Filter Transaksi Dompet Ini</span>
                  </div>
                  <ChevronRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditWallet(activeWalletAction)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-800 text-left transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Edit2 size={15} className="text-blue-600" />
                    <span>Edit Dompet / Koreksi Saldo</span>
                  </div>
                  <ChevronRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteWallet(activeWalletAction)}
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-left transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Trash2 size={15} className="text-rose-600" />
                    <span>Hapus Dompet</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Add / Edit Wallet Modal */}
      <ModalWallet
        isOpen={showWalletModal}
        editingWallet={editingWallet}
        onClose={() => setShowWalletModal(false)}
        onSave={(data) => {
          if (editingWallet) {
            OlloStore.updateWallet(editingWallet.id, {
              name: data.name,
              balance: data.balance,
              initial_balance: data.balance,
              type: data.type,
              color: data.color,
              logo_url: data.logo_url
            })
            showToast({ type: 'success', title: 'Dompet Berhasil Diperbarui', message: `Saldo & preset dompet ${data.name} telah disimpan.` })
          } else {
            OlloStore.addWallet({
              name: data.name,
              balance: data.balance,
              type: data.type,
              color: data.color,
              logo_url: data.logo_url
            })
            showToast({ type: 'success', title: 'Dompet Baru Dibuat', message: `Dompet ${data.name} berhasil ditambahkan.` })
          }
          loadAllData()
          setShowWalletModal(false)
        }}
      />

      {/* MODAL 3: Edit Transaction Bottom Sheet */}
      <AnimatePresence>
        {editingTx && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Detail & Sunting Transaksi</h3>
                <button onClick={() => setEditingTx(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTxSubmit} className="space-y-3.5 text-xs">
                {/* 3-Way Type Switcher */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl font-bold">
                  <button
                    type="button"
                    onClick={() => setTxType('expense')}
                    className={`py-2 rounded-lg transition ${
                      txType === 'expense' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    💸 Keluar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('income')}
                    className={`py-2 rounded-lg transition ${
                      txType === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    💰 Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('transfer')}
                    className={`py-2 rounded-lg transition ${
                      txType === 'transfer' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    🔄 Transfer
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Nominal Transaksi (Rp)</label>
                  <input
                    type="text"
                    required
                    value={txAmount}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, '')) || 0
                      setTxAmount(formatRupiahFull(num))
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Wallet & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Dompet Sumber</label>
                    <select
                      value={txWalletId}
                      onChange={(e) => setTxWalletId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Kategori</label>
                    <input
                      type="text"
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Date & Note */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Catatan</label>
                    <input
                      type="text"
                      placeholder="Catatan..."
                      value={txNote}
                      onChange={(e) => setTxNote(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDeleteTx(editingTx.id)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTx(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold cursor-pointer hover:bg-emerald-700"
                    >
                      ✓ Simpan
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Savings Deposit Sheet */}
      <AnimatePresence>
        {depositGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Setor Ke Target Tabungan</h3>
                  <p className="text-[11px] text-emerald-600 font-bold">{depositGoal.title}</p>
                </div>
                <button onClick={() => setDepositGoal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Nominal Setoran (Rp)</label>
                  <input
                    type="text"
                    required
                    value={formatRupiahFull(depositAmount)}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, '')) || 0
                      setDepositAmount(num)
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Potong Dari Dompet</label>
                  <select
                    value={depositWalletId}
                    onChange={(e) => setDepositWalletId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({formatRupiahFull(w.balance)})</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositGoal(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold cursor-pointer hover:bg-emerald-700"
                  >
                    ✓ Confirm Setor
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: Add Savings Goal Modal */}
      <AnimatePresence>
        {showAddSavings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Tambah Target Tabungan</h3>
                <button onClick={() => setShowAddSavings(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSavings} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Nama Target Impian</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Target Dana Darurat, Beli Laptop"
                    value={savingsTitle}
                    onChange={(e) => setSavingsTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Target Nominal (Rp)</label>
                  <input
                    type="text"
                    required
                    placeholder="Rp 0"
                    value={savingsTarget}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, '')) || 0
                      setSavingsTarget(formatRupiahFull(num))
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-sm text-slate-900"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSavings(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold cursor-pointer hover:bg-emerald-700"
                  >
                    + Buat Target
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
