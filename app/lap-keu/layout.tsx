"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Receipt,
  ScanLine,
  BarChart3,
  PiggyBank,
  Repeat,
  CreditCard,
  Target,
  TrendingUp,
  ShieldAlert,
  Palmtree,
  Gem,
  Bot,
  Settings,
  ArrowLeft,
  Menu,
  X,
  PlusCircle,
  Sparkles,
  Wallet
} from 'lucide-react'
import { FinoraStore, formatRupiah } from '@/lib/finora-store'

interface NavItem {
  name: string
  path: string
  icon: React.ReactNode
  badge?: string
}

export default function FinoraLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeBalance, setActiveBalance] = useState<number>(33750000)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  // Quick transaction state
  const [txType, setTxType] = useState<'expense' | 'income'>('expense')
  const [txAmount, setTxAmount] = useState<string>('')
  const [txAccount, setTxAccount] = useState('BCA Express')
  const [txCategory, setTxCategory] = useState('Kebutuhan Rumah Tangga')
  const [txMerchant, setTxMerchant] = useState('')
  const [txNotes, setTxNotes] = useState('')

  useEffect(() => {
    const summary = FinoraStore.getSummary()
    setActiveBalance(summary.activeBalance)
  }, [pathname])

  const menuItems: NavItem[] = [
    { name: 'Dashboard', path: '/lap-keu', icon: <LayoutDashboard size={18} /> },
    { name: 'Transaksi', path: '/lap-keu/transaksi', icon: <Receipt size={18} /> },
    { name: 'Scan Nota (AI)', path: '/lap-keu/scan-nota', icon: <ScanLine size={18} className="text-emerald-400 animate-pulse" />, badge: 'AI' },
    { name: 'Analitik', path: '/lap-keu/analitik', icon: <BarChart3 size={18} /> },
    { name: 'Budget', path: '/lap-keu/budget', icon: <PiggyBank size={18} /> },
    { name: 'Pengeluaran Rutin', path: '/lap-keu/pengeluaran-rutin', icon: <Repeat size={18} /> },
    { name: 'Utang & Piutang', path: '/lap-keu/utang-piutang', icon: <CreditCard size={18} /> },
    { name: 'Target Tabungan', path: '/lap-keu/target-tabungan', icon: <Target size={18} /> },
    { name: 'Investasi', path: '/lap-keu/investasi', icon: <TrendingUp size={18} className="text-cyan-400" /> },
    { name: 'Dana Darurat', path: '/lap-keu/dana-darurat', icon: <ShieldAlert size={18} className="text-rose-400" /> },
    { name: 'Dana Pensiun', path: '/lap-keu/dana-pensiun', icon: <Palmtree size={18} className="text-amber-400" /> },
    { name: 'Net Worth', path: '/lap-keu/net-worth', icon: <Gem size={18} className="text-indigo-400" /> },
    { name: 'AI Assistant', path: '/lap-keu/ai-assistant', icon: <Bot size={18} className="text-emerald-400" />, badge: 'GPT-4o' },
    { name: 'Pengaturan', path: '/lap-keu/pengaturan', icon: <Settings size={18} /> }
  ]

  const handleSaveQuickTx = (e: React.FormEvent) => {
    e.preventDefault()
    const numeric = parseInt(txAmount.replace(/\D/g, '')) || 0
    if (numeric <= 0) return

    FinoraStore.addTransaction({
      date: new Date().toISOString().split('T')[0],
      amount: numeric,
      type: txType,
      category: txCategory,
      account_name: txAccount,
      merchant: txMerchant || undefined,
      notes: txNotes || undefined,
      payment_method: 'QRIS'
    })

    const updated = FinoraStore.getSummary()
    setActiveBalance(updated.activeBalance)
    setShowQuickAdd(false)
    setTxAmount('')
    setTxMerchant('')
    setTxNotes('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative flex flex-col overflow-x-hidden select-none">
      {/* Background Ambient Mesh Glow Accents */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-40 w-[30rem] h-[30rem] bg-teal-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed -bottom-40 left-1/3 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between shadow-2xl">
        {/* Left: Brand / Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition border border-slate-700/60"
            title="Buka Menu Sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-lg">
              💎
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  FINORA
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  AI Personal Finance OS
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                Sistem Pengelolaan Keuangan Mandiri & Financial Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-3">
          {/* Active Balance Quick Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/80 text-xs">
            <Wallet size={14} className="text-emerald-400" />
            <span className="text-slate-400 font-medium">Saldo Kas:</span>
            <span className="font-bold text-emerald-400">{formatRupiah(activeBalance)}</span>
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span className="hidden md:inline">Tambah Transaksi</span>
          </button>

          {/* Kembali ke BGN Button */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 text-xs font-semibold transition"
            title="Kembali ke Super App BGN"
          >
            <ArrowLeft size={15} />
            <span className="hidden md:inline">Ke SPPG BGN</span>
          </Link>
        </div>
      </header>

      {/* Main Container: Sub-Sidebar + Main Content */}
      <div className="flex-1 flex min-w-0 relative z-10">
        {/* Desktop Left Sub-Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900/60 backdrop-blur-2xl border-r border-slate-800/80 flex-shrink-0 shadow-2xl">
          {/* Top Brand Link Back */}
          <div className="p-4 border-b border-slate-800/80">
            <Link
              href="/"
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:text-white text-xs font-semibold transition group"
            >
              <div className="flex items-center gap-2">
                <ArrowLeft size={16} className="text-emerald-400 transition-transform group-hover:-translate-x-1" />
                <span>Kembali ke SPPG BGN</span>
              </div>
            </Link>
          </div>

          {/* Nav Items List */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
            {menuItems.map((item) => {
              const isActive = item.path === '/lap-keu' ? pathname === '/lap-keu' : pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/5'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'text-emerald-400 scale-110' : 'text-slate-500 group-hover:text-slate-300'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Sub-sidebar Footer */}
          <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800/80 border border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                AS
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-200 truncate">Ahmad Sayyidani</span>
                <span className="text-[10px] text-slate-400">FINORA OS Premium</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-slate-900/95 backdrop-blur-2xl z-50 lg:hidden border-r border-slate-800 flex flex-col shadow-2xl"
              >
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💎</span>
                    <span className="font-extrabold text-white">FINORA · AI</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-3 border-b border-slate-800">
                  <Link
                    href="/"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 text-xs font-semibold text-slate-300"
                  >
                    <ArrowLeft size={16} />
                    <span>Kembali ke SPPG BGN</span>
                  </Link>
                </div>

                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                  {menuItems.map((item) => {
                    const isActive = item.path === '/lap-keu' ? pathname === '/lap-keu' : pathname.startsWith(item.path)
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Quick Add Transaction Modal */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <PlusCircle size={20} className="text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Tambah Transaksi Cepat</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveQuickTx} className="space-y-4 mt-4">
                {/* Type Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTxType('expense')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      txType === 'expense'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💸 Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('income')}
                    className={`py-2 text-xs font-bold rounded-lg transition ${
                      txType === 'income'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    💰 Pemasukan
                  </button>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nominal (Rupiah)</label>
                  <input
                    type="text"
                    required
                    placeholder="Rp 0"
                    value={txAmount}
                    onChange={(e) => {
                      const num = parseInt(e.target.value.replace(/\D/g, '')) || 0
                      setTxAmount(formatRupiah(num))
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-lg font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Account & Category Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Akun Rekening</label>
                    <select
                      value={txAccount}
                      onChange={(e) => setTxAccount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="BCA Express">BCA Express</option>
                      <option value="Mandiri Utama">Mandiri Utama</option>
                      <option value="Dompet Tunai">Dompet Tunai</option>
                      <option value="GoPay / QRIS">GoPay / QRIS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kategori Pos</label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Kebutuhan Rumah Tangga">Kebutuhan Rumah Tangga</option>
                      <option value="Makanan & Kuliner">Makanan & Kuliner</option>
                      <option value="Transportasi">Transportasi</option>
                      <option value="Tagihan & Utilitas">Tagihan & Utilitas</option>
                      <option value="Rumah & Cicilan">Rumah & Cicilan</option>
                      <option value="Gaji Bulanan">Gaji Bulanan</option>
                      <option value="Bonus Project AI">Bonus Project AI</option>
                    </select>
                  </div>
                </div>

                {/* Merchant / Place */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Merchant / Tempat (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: Indomaret, Pertamina, Cafe"
                    value={txMerchant}
                    onChange={(e) => setTxMerchant(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Catatan</label>
                  <input
                    type="text"
                    placeholder="Catatan transaksi..."
                    value={txNotes}
                    onChange={(e) => setTxNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition"
                  >
                    ✓ Simpan Transaksi
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
