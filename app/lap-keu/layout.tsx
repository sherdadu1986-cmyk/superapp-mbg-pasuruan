"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Receipt,
  Camera,
  PiggyBank,
  Bot,
  Plus,
  ArrowLeft,
  X,
  ArrowRightLeft,
  Wallet,
  Check
} from 'lucide-react'
import { OlloStore, OlloWallet, formatRupiahFull } from '@/lib/ollo-store'

export default function OlloLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [wallets, setWallets] = useState<OlloWallet[]>([])

  // Quick transaction form state
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense')
  const [txAmount, setTxAmount] = useState('')
  const [txWalletId, setTxWalletId] = useState('w-bca')
  const [txToWalletId, setTxToWalletId] = useState('w-cash')
  const [txCategory, setTxCategory] = useState('🍜 Makanan & Minuman')
  const [txNote, setTxNote] = useState('')

  useEffect(() => {
    setWallets(OlloStore.getWallets())
  }, [showQuickAdd, pathname])

  const handleSaveQuickTx = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(txAmount.replace(/\D/g, '')) || 0
    if (num <= 0) return

    OlloStore.addTransaction({
      wallet_id: txWalletId,
      to_wallet_id: txType === 'transfer' ? txToWalletId : undefined,
      type: txType,
      amount: num,
      category: txType === 'transfer' ? '🏦 Transfer Antar Dompet' : txCategory,
      note: txNote || undefined,
      date: new Date().toISOString().split('T')[0]
    })

    setShowQuickAdd(false)
    setTxAmount('')
    setTxNote('')

    // Refresh current view if needed
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ollo_data_updated'))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased relative flex flex-col pb-24 select-none">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 h-16 flex items-center justify-between shadow-xs">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            O
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-tight">
              Ollo Money
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Minimalist Finance OS
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">Catat Transaksi</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
            title="Kembali ke Super App BGN"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">SPPG BGN</span>
          </Link>
        </div>
      </header>

      {/* Main Page Viewport */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-4 md:pt-6">
        {children}
      </main>

      {/* Floating Bottom Navigation Bar (Ollo Style) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-xl border border-slate-200/80 px-4 py-2 rounded-full shadow-xl flex items-center gap-1 sm:gap-4 max-w-sm w-[92%] justify-around">
        {/* 1. Home */}
        <Link
          href="/lap-keu"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[10px] font-bold transition ${
            pathname === '/lap-keu' ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={18} />
          <span>Home</span>
        </Link>

        {/* 2. Transaksi */}
        <Link
          href="/lap-keu/transaksi"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[10px] font-bold transition ${
            pathname.startsWith('/lap-keu/transaksi') ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Receipt size={18} />
          <span>Riwayat</span>
        </Link>

        {/* 3. CENTER CAMERA SCAN BUTTON (Prominent Floating Circle) */}
        <Link
          href="/lap-keu/scan-nota"
          className="relative -top-5 w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-900/30 transition active:scale-95 cursor-pointer border-4 border-slate-50"
          title="Scan Nota AI"
        >
          <Camera size={20} className="text-emerald-400" />
        </Link>

        {/* 4. Budget & Goals */}
        <Link
          href="/lap-keu/budget"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[10px] font-bold transition ${
            pathname.startsWith('/lap-keu/budget') ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <PiggyBank size={18} />
          <span>Budget</span>
        </Link>

        {/* 5. AI Assistant */}
        <Link
          href="/lap-keu/ai-assistant"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[10px] font-bold transition ${
            pathname.startsWith('/lap-keu/ai-assistant') ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bot size={18} />
          <span>AI Ollo</span>
        </Link>
      </nav>

      {/* Quick Add Transaction Modal Sheet */}
      <AnimatePresence>
        {showQuickAdd && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative border border-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Catat Transaksi Baru</h3>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveQuickTx} className="space-y-4 mt-4">
                {/* 3-Way Type Switcher */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense')
                      setTxCategory('🍜 Makanan & Minuman')
                    }}
                    className={`py-2 rounded-lg transition ${
                      txType === 'expense' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    💸 Keluar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('income')
                      setTxCategory('💼 Gaji')
                    }}
                    className={`py-2 rounded-lg transition ${
                      txType === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    💰 Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('transfer')
                    }}
                    className={`py-2 rounded-lg transition ${
                      txType === 'transfer' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    🔄 Transfer
                  </button>
                </div>

                {/* Amount Input */}
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-2xl font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Wallets Select */}
                {txType === 'transfer' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Dari Dompet</label>
                      <select
                        value={txWalletId}
                        onChange={(e) => setTxWalletId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                      >
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Ke Dompet</label>
                      <select
                        value={txToWalletId}
                        onChange={(e) => setTxToWalletId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
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
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Pilih Dompet</label>
                      <select
                        value={txWalletId}
                        onChange={(e) => setTxWalletId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                      >
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Kategori</label>
                      <select
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                      >
                        {txType === 'expense' ? (
                          <>
                            <option value="🍜 Makanan & Minuman">🍜 Makanan & Minuman</option>
                            <option value="🚗 Transportasi">🚗 Transportasi</option>
                            <option value="🛒 Belanja Bulanan">🛒 Belanja Bulanan</option>
                            <option value="🎬 Hiburan & Hobi">🎬 Hiburan & Hobi</option>
                            <option value="⚡ Tagihan & Utilitas">⚡ Tagihan & Utilitas</option>
                          </>
                        ) : (
                          <>
                            <option value="💼 Gaji">💼 Gaji</option>
                            <option value="🎁 Bonus & Insentif">🎁 Bonus & Insentif</option>
                            <option value="💻 Freelance">💻 Freelance</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Catatan Opsional</label>
                  <input
                    type="text"
                    placeholder="Catatan singkat..."
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 cursor-pointer hover:bg-emerald-700"
                  >
                    ✓ Simpan
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
