"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye,
  EyeOff,
  Bell,
  Settings,
  PlusCircle,
  Send,
  Receipt,
  ScanLine,
  Cpu,
  CreditCard,
  ChevronRight,
  Plus,
  TrendingUp,
  Wallet,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Check,
  X,
  Trash2,
  Edit2,
  Loader2
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
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/toast'
import ModalWallet from './components/ModalWallet'

export default function FinaciDashboard() {
  const [wallets, setWallets] = useState<OlloWallet[]>([])
  const [transactions, setTransactions] = useState<OlloTransaction[]>([])
  const [budgets, setBudgets] = useState<OlloBudget[]>([])
  const [savings, setSavings] = useState<OlloSavingsGoal[]>([])
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all')
  const [todaySummary, setTodaySummary] = useState({ todayExpense: 0, dailyAvgTarget: 150000, percentageOfAvg: 0 })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Privacy State: Show / Hide Balance
  const [showBalance, setShowBalance] = useState<boolean>(true)

  // Quick Action Modal Trigger State
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense' | 'transfer'>('expense')

  // Wallet Modal State
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [editingWallet, setEditingWallet] = useState<OlloWallet | null>(null)
  const [activeWalletAction, setActiveWalletAction] = useState<OlloWallet | null>(null)

  // Transaction Edit State
  const [editingTx, setEditingTx] = useState<OlloTransaction | null>(null)

  // Savings Deposit State
  const [depositGoal, setDepositGoal] = useState<OlloSavingsGoal | null>(null)
  const [depositAmount, setDepositAmount] = useState<number>(100000)
  const [depositWalletId, setDepositWalletId] = useState<string>('w-bni')

  // Quick Transaction Form State
  const [txAmount, setTxAmount] = useState('')
  const [txWalletId, setTxWalletId] = useState('w-bni')
  const [txToWalletId, setTxToWalletId] = useState('w-bni')
  const [txCategory, setTxCategory] = useState('🍜 Makanan & Minuman')
  const [txNote, setTxNote] = useState('')
  const [txDate, setTxDate] = useState('')

  const fetchOnlineData = async () => {
    try {
      setIsLoading(true)
      const { wallets: onlineWallets, transactions: onlineTxs } = await OlloStore.syncFromSupabase()
      setWallets(onlineWallets)
      setTransactions(onlineTxs)
      if (onlineWallets.length > 0 && !txWalletId) {
        setTxWalletId(onlineWallets[0].id)
      }
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOnlineData()

    // Restore showBalance preference
    if (typeof window !== 'undefined') {
      const savedPriv = localStorage.getItem('finaci_show_balance')
      if (savedPriv !== null) setShowBalance(savedPriv === 'true')
    }

    // Handle window focus & tab visibility change for instant multi-device sync
    const handleFocus = () => {
      fetchOnlineData()
    }
    window.addEventListener('focus', handleFocus)
    window.addEventListener('visibilitychange', handleFocus)

    // Supabase Realtime Channel
    const channel = supabase
      .channel('online_sync_lap_keu')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fin_wallets' },
        () => fetchOnlineData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fin_transactions' },
        () => fetchOnlineData()
      )
      .subscribe()

    const handleUpdate = () => fetchOnlineData()
    window.addEventListener('ollo_data_updated', handleUpdate)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('ollo_data_updated', handleUpdate)
      supabase.removeChannel(channel)
    }
  }, [])

  const toggleShowBalance = () => {
    setShowBalance(prev => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('finaci_show_balance', String(next))
      }
      return next
    })
  }

  const openQuickAction = (type: 'income' | 'expense' | 'transfer') => {
    setQuickAddType(type)
    setTxAmount('')
    setTxNote('')
    if (type === 'income') setTxCategory('💼 Gaji')
    else if (type === 'expense') setTxCategory('🍜 Makanan & Minuman')
    else setTxCategory('🏦 Transfer Antar Dompet')
    setShowQuickAdd(true)
  }

  const handleSaveQuickTx = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(txAmount.replace(/\D/g, '')) || 0
    if (num <= 0) return

    try {
      await OlloStore.addTransactionAsync({
        wallet_id: txWalletId,
        to_wallet_id: quickAddType === 'transfer' ? txToWalletId : undefined,
        type: quickAddType,
        amount: num,
        category: quickAddType === 'transfer' ? '🏦 Transfer Antar Dompet' : txCategory,
        note: txNote || undefined,
        date: new Date().toISOString().split('T')[0]
      })

      setShowQuickAdd(false)
      setTxAmount('')
      setTxNote('')

      // Trigger immediate fetch & sync
      await fetchOnlineData()

      showToast({
        type: 'success',
        title: 'Transaksi Berhasil!',
        message: `${quickAddType === 'income' ? 'Pemasukan' : quickAddType === 'transfer' ? 'Transfer' : 'Pengeluaran'} ${formatRupiahFull(num)} telah dicatat.`
      })
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: 'Terjadi kendala saat menyimpan transaksi ke database.'
      })
    }
  }

  const handleDeleteTx = async (id: string) => {
    if (confirm('Hapus transaksi ini? Saldo dompet akan disesuaikan otomatis.')) {
      await OlloStore.deleteTransactionAsync(id)
      setEditingTx(null)
      await fetchOnlineData()
      showToast({ type: 'warning', title: 'Transaksi Dihapus', message: 'Kalkulasi saldo diperbarui.' })
    }
  }

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!depositGoal || depositAmount <= 0) return

    OlloStore.depositSavingsGoal(depositGoal.id, depositAmount, depositWalletId)
    setDepositGoal(null)
    await fetchOnlineData()
    showToast({
      type: 'success',
      title: 'Setoran Tabungan Berhasil!',
      message: `${formatRupiahFull(depositAmount)} dialokasikan ke ${depositGoal.title}.`
    })
  }

  // Dynamic calculations for totals & balance
  const totalPemasukan = transactions
    .filter(t => {
      const typeStr = (t.type || (t as any).tipe || '').toLowerCase()
      return typeStr === 'income' || typeStr === 'pemasukan'
    })
    .reduce((sum, t) => sum + Number(t.amount ?? (t as any).nominal ?? 0), 0)

  const totalPengeluaran = transactions
    .filter(t => {
      const typeStr = (t.type || (t as any).tipe || '').toLowerCase()
      return typeStr === 'expense' || typeStr === 'pengeluaran'
    })
    .reduce((sum, t) => sum + Number(t.amount ?? (t as any).nominal ?? 0), 0)

  // Calculate total balance across all wallets
  const totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance || 0), 0)

  // Filter transactions
  const filteredTxs = transactions.filter(t => {
    if (selectedWalletId === 'all') return true
    return t.wallet_id === selectedWalletId || t.to_wallet_id === selectedWalletId
  })

  // ATM Card gradient themes
  const cardGradientStyles: Record<string, string> = {
    blue: 'from-blue-600 via-indigo-600 to-blue-800 text-white shadow-blue-500/20',
    emerald: 'from-emerald-600 via-teal-600 to-emerald-800 text-white shadow-emerald-500/20',
    cyan: 'from-cyan-500 via-blue-600 to-teal-700 text-white shadow-cyan-500/20',
    purple: 'from-purple-600 via-indigo-600 to-purple-900 text-white shadow-purple-500/20',
    amber: 'from-amber-500 via-yellow-600 to-amber-700 text-white shadow-amber-500/20',
    rose: 'from-rose-600 via-pink-600 to-rose-800 text-white shadow-rose-500/20'
  }

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto">
      {/* 1. Header Profil & Notifikasi (Finaci Top Bar) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-indigo-500/20 border border-white/40">
            AS
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">👋 Selamat Datang,</div>
            <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
              Ahmad Sayyidani
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bell Icon with Red Notification Dot */}
          <button
            type="button"
            onClick={() => showToast({ type: 'info' as any, title: 'Notifikasi Finaci', message: 'Cash flow September 2026 dalam posisi sehat A+' })}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition relative shadow-2xs"
            title="Notifikasi"
          >
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Settings Icon */}
          <Link
            href="/lap-keu/pengaturan"
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition shadow-2xs"
            title="Pengaturan"
          >
            <Settings size={18} />
          </Link>
        </div>
      </div>

      {/* 2. Hero Balance Section (KARTU SALDO UTAMA FINACI UI) */}
      <div className="grid grid-cols-1 gap-4">
        {/* Main Finaci Gradient Total Balance Card */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 text-white rounded-3xl p-6 shadow-xl shadow-indigo-500/20 relative overflow-hidden space-y-4">
          {/* Ambient Mesh Glow Circles Overlay */}
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Label & Eye Privacy Toggle */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2 text-white/80 font-semibold text-xs">
              <Wallet size={16} className="text-white/90" />
              <span>Total Saldo Utama</span>
            </div>

            <button
              type="button"
              onClick={toggleShowBalance}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md transition text-white"
              title={showBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            >
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          {/* Large Bold Balance Figure */}
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {showBalance ? formatRupiahFull(totalBalance) : '••••••••••••'}
            </h1>
          </div>

          {/* Bottom Badges */}
          <div className="flex items-center justify-between pt-1 relative z-10 text-xs">
            <span className="bg-white/20 backdrop-blur-md text-white font-bold px-3 py-1 rounded-full text-[11px] border border-white/30 flex items-center gap-1 shadow-xs">
              <TrendingUp size={13} /> ↗ +12.5% bulan ini
            </span>

            <div className="bg-white/10 backdrop-blur-md text-white/90 font-semibold px-3 py-1 rounded-full text-[11px] border border-white/20 flex items-center gap-1">
              <CreditCard size={13} />
              <span>{wallets.length} Rekening Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Baris Tombol Aksi Cepat (Quick Actions Grid) */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Action 1: Top Up / Pemasukan */}
        <button
          type="button"
          onClick={() => openQuickAction('income')}
          className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:scale-105 transition-all shadow-2xs cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
            <PlusCircle size={20} />
          </div>
          <span className="text-[11px] font-extrabold text-slate-700 truncate w-full text-center">+ Tambah</span>
        </button>

        {/* Action 2: Transfer */}
        <button
          type="button"
          onClick={() => openQuickAction('transfer')}
          className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:scale-105 transition-all shadow-2xs cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
            <Send size={20} />
          </div>
          <span className="text-[11px] font-extrabold text-slate-700 truncate w-full text-center">↗ Transfer</span>
        </button>

        {/* Action 3: Bayar / Catat Pengeluaran */}
        <button
          type="button"
          onClick={() => openQuickAction('expense')}
          className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:scale-105 transition-all shadow-2xs cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
            <Receipt size={20} />
          </div>
          <span className="text-[11px] font-extrabold text-slate-700 truncate w-full text-center">🧾 Bayar</span>
        </button>

        {/* Action 4: Scan AI Nota */}
        <Link
          href="/lap-keu/scan-nota"
          className="bg-white border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 hover:scale-105 transition-all shadow-2xs cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
            <ScanLine size={20} />
          </div>
          <span className="text-[11px] font-extrabold text-slate-700 truncate w-full text-center">📷 Scan AI</span>
        </Link>
      </div>

      {/* 4. Galeri Kartu Bank & Dompet (My Cards Carousel - Physical ATM Card Style) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Kartu Bank & Dompet ({wallets.length})
          </span>
          <button
            type="button"
            onClick={() => {
              setEditingWallet(null)
              setShowWalletModal(true)
            }}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
          >
            <Plus size={14} />
            <span>Tambah Kartu</span>
          </button>
        </div>

        {/* ATM Card Horizontal Carousel */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {wallets.map((w) => {
            const gradStyle = cardGradientStyles[w.color || 'blue']
            const isSelected = selectedWalletId === w.id

            return (
              <div
                key={w.id}
                onClick={() => setSelectedWalletId(selectedWalletId === w.id ? 'all' : w.id)}
                className={`flex-shrink-0 w-64 h-36 rounded-2xl bg-gradient-to-br ${gradStyle} p-4 flex flex-col justify-between shadow-lg relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] border ${
                  isSelected ? 'ring-4 ring-indigo-500/50 border-white' : 'border-white/20'
                }`}
              >
                {/* Glossy Overlay Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

                {/* Top Row: EMV Chip, Edit Button & Bank Logo */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    {/* Golden EMV Chip Icon */}
                    <div className="w-8 h-6 rounded-md bg-amber-300/80 border border-amber-400 flex items-center justify-center text-[10px] text-amber-900 font-bold shadow-2xs">
                      <Cpu size={14} />
                    </div>

                    {/* Edit Pencil Icon Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingWallet(w)
                        setShowWalletModal(true)
                      }}
                      className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center transition shadow-2xs cursor-pointer z-20"
                      title="Sunting / Koreksi Saldo Rekening Ini"
                    >
                      <Edit2 size={12} />
                    </button>
                  </div>

                  {/* Bank Logo / Preset */}
                  <div className="h-6 flex items-center">
                    {w.logo_url && (w.logo_url.startsWith('http') || w.logo_url.startsWith('data:')) ? (
                      <div className="h-6 px-2 rounded-lg bg-white/90 flex items-center justify-center shadow-2xs">
                        <img src={w.logo_url} alt={w.name} className="h-4 max-w-[60px] object-contain" />
                      </div>
                    ) : (
                      <span className="text-lg">{w.logo_url || w.icon || '💳'}</span>
                    )}
                  </div>
                </div>

                {/* Card Number Masked */}
                <div className="font-mono text-xs tracking-widest text-white/90 relative z-10">
                  {w.card_number || `•••• •••• •••• ${w.id.slice(-4).toUpperCase()}`}
                </div>

                {/* Bottom Row: Balance & Cardholder */}
                <div className="flex items-end justify-between relative z-10">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/70 block font-medium">Saldo Rekening</span>
                    <span className="font-extrabold text-sm text-white">
                      {showBalance ? formatRupiahFull(w.balance) : '••••••••'}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider truncate max-w-[90px]">
                    {w.name}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Add Card Plus Button Item */}
          <div
            onClick={() => {
              setEditingWallet(null)
              setShowWalletModal(true)
            }}
            className="flex-shrink-0 w-40 h-36 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 transition cursor-pointer p-4 text-center"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Plus size={20} />
            </div>
            <span className="text-xs font-extrabold">Tambah Kartu Baru</span>
          </div>
        </div>
      </div>

      {/* 5. Riwayat Transaksi Bersih (Recent Transactions) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Transaksi Terakhir
            </span>
            {selectedWalletId !== 'all' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                Filter: {wallets.find(w => w.id === selectedWalletId)?.name}
              </span>
            )}
          </div>

          <Link
            href="/lap-keu/transaksi"
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
          >
            <span>Lihat Semua</span>
            <ChevronRight size={13} />
          </Link>
        </div>

        {filteredTxs.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {filteredTxs.slice(0, 5).map((t) => {
              const isIncome = t.type === 'income'
              const isTransfer = t.type === 'transfer'
              const walletName = wallets.find(w => w.id === t.wallet_id)?.name || 'Dompet'

              return (
                <div
                  key={t.id}
                  onClick={() => setEditingTx(t)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-lg shrink-0">
                      {t.category.split(' ')[0] || '💳'}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition">
                        {t.note || t.category}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{t.time || '12:00'}</span>
                        <span>·</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">{walletName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-right">
                    <span className={`font-extrabold text-xs ${
                      isIncome ? 'text-emerald-600' : isTransfer ? 'text-blue-600' : 'text-slate-900'
                    }`}>
                      {showBalance
                        ? `${isIncome ? '+' : isTransfer ? '↔' : '-'} ${formatRupiahFull(t.amount)}`
                        : '••••••••'}
                    </span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500" />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 bg-white border border-slate-200/80 rounded-2xl text-center space-y-2 shadow-2xs">
            <div className="text-3xl">🍃</div>
            <div className="font-bold text-xs text-slate-800">Belum ada riwayat transaksi</div>
            <p className="text-[11px] text-slate-500 font-medium">
              Belum ada riwayat transaksi. Saldo Anda masih utuh {formatRupiahFull(totalBalance)}.
            </p>
          </div>
        )}
      </div>

      {/* 6. Target Tabungan (Savings Goals) */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
            Target Tabungan (Savings Goals)
          </span>

          <Link href="/lap-keu/budget" className="text-xs font-bold text-indigo-600 hover:underline">
            Detail
          </Link>
        </div>

        <div className="space-y-2.5">
          {savings.map((s) => {
            const pct = Math.min(Math.round((s.current_amount / s.target_amount) * 100), 100)

            return (
              <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      🎯
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{s.title}</h4>
                      <p className="text-[10px] text-slate-400">Target: {s.target_date || '2026-12-31'}</p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    {pct}%
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Terkumpul: <strong className="text-slate-900">{showBalance ? formatRupiahFull(s.current_amount) : '••••••••'}</strong></span>
                  <span>Target: <strong className="text-slate-900">{formatRupiahFull(s.target_amount)}</strong></span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
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
                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition"
                    >
                      +Rp 50k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositGoal(s)
                        setDepositAmount(100000)
                      }}
                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition"
                    >
                      +Rp 100k
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositGoal(s)
                        setDepositAmount(500000)
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-2xs transition"
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

      {/* MODAL 1: Wallet Modal */}
      <ModalWallet
        isOpen={showWalletModal}
        editingWallet={editingWallet}
        totalWalletsCount={wallets.length}
        onClose={() => {
          setShowWalletModal(false)
          setEditingWallet(null)
        }}
        onDelete={async (id) => {
          const ok = await OlloStore.deleteWalletAsync(id)
          if (ok) {
            showToast({ type: 'warning', title: 'Rekening Dihapus', message: 'Rekening berhasil dihapus dari sistem.' })
            await fetchOnlineData()
            setShowWalletModal(false)
            setEditingWallet(null)
          } else {
            showToast({ type: 'error', title: 'Gagal Menghapus', message: 'Sistem memerlukan minimal 1 rekening aktif.' })
          }
        }}
        onSave={async (data) => {
          if (editingWallet) {
            await OlloStore.updateWalletAsync(editingWallet.id, {
              name: data.name,
              balance: data.balance,
              card_number: data.card_number,
              type: data.type,
              color: data.color,
              logo_url: data.logo_url
            })
            showToast({ type: 'success', title: 'Dompet Diperbarui', message: '✓ Data dompet berhasil diperbarui' })
          } else {
            await OlloStore.addWalletAsync({
              name: data.name,
              balance: data.balance,
              card_number: data.card_number,
              type: data.type,
              color: data.color,
              logo_url: data.logo_url
            })
            showToast({ type: 'success', title: 'Kartu Baru Ditambahkan', message: `Kartu ${data.name} berhasil terdaftar.` })
          }
          await fetchOnlineData()
          setShowWalletModal(false)
          setEditingWallet(null)
        }}
      />

      {/* MODAL 2: Quick Action Modal (Top Up / Transfer / Bayar) */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 border border-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {quickAddType === 'income' ? '💰 + Tambah Pemasukan' : quickAddType === 'transfer' ? '↗ Transfer Antar Dompet' : '🧾 Bayar / Pengeluaran'}
                </h3>
                <button type="button" onClick={() => setShowQuickAdd(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveQuickTx} className="space-y-4 text-xs">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nominal (Rupiah)</label>
                  <input
                    type="text"
                    required
                    placeholder="Rp 0"
                    value={txAmount}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, '')) || 0
                      setTxAmount(formatRupiahFull(num))
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Wallets */}
                {quickAddType === 'transfer' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Dari Rekening</label>
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
                      <label className="block font-semibold text-slate-500 mb-1">Ke Rekening</label>
                      <select
                        value={txToWalletId}
                        onChange={(e) => setTxToWalletId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                      >
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">Pilih Rekening</label>
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
                      <label className="block font-semibold text-slate-500 mb-1">Kategori Pos</label>
                      <input
                        type="text"
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Catatan Opsional</label>
                  <input
                    type="text"
                    placeholder="Catatan transaksi..."
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold shadow-md hover:bg-indigo-700 cursor-pointer"
                  >
                    ✓ Simpan Transaksi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Nominal:</span>
                  <span className="text-2xl font-black text-slate-900">{formatRupiahFull(editingTx.amount)}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kategori:</span>
                    <strong className="text-slate-900">{editingTx.category}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal & Waktu:</span>
                    <strong className="text-slate-900">{editingTx.date} · {editingTx.time}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Catatan:</span>
                    <strong className="text-slate-900">{editingTx.note || '-'}</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleDeleteTx(editingTx.id)}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingTx(null)}
                    className="px-5 py-2 rounded-xl bg-slate-900 text-white font-extrabold cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
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
                  <p className="text-[11px] text-indigo-600 font-bold">{depositGoal.title}</p>
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-black text-indigo-600"
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
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold cursor-pointer hover:bg-indigo-700"
                  >
                    ✓ Confirm Setor
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
