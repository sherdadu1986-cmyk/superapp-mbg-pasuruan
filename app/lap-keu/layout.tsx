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
  Plus,
  ArrowLeft,
  X,
  Check,
  BarChart3,
  Settings,
  Lock,
  LogOut,
  Delete
} from 'lucide-react'
import { OlloStore, OlloWallet, formatRupiahFull } from '@/lib/ollo-store'

const SECRET_PIN = '001922'
const AUTH_KEY = 'lap_keu_auth_token'
const AUTH_TOKEN = 'authenticated_001922'

function PinAuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('')
  const [isError, setIsError] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleKeyPress = (numStr: string) => {
    if (pin.length >= 6 || isSuccess) return
    setErrorMsg('')
    setIsError(false)
    const newPin = pin + numStr
    setPin(newPin)

    if (newPin.length === 6) {
      if (newPin === SECRET_PIN) {
        setIsSuccess(true)
        setErrorMsg('')
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(AUTH_KEY, AUTH_TOKEN)
        }
        setTimeout(() => {
          onSuccess()
        }, 500)
      } else {
        setIsError(true)
        setIsShaking(true)
        setErrorMsg('PIN salah. Akses ditolak.')
        setTimeout(() => {
          setIsShaking(false)
          setPin('')
          setIsError(false)
        }, 800)
      }
    }
  }

  const handleBackspace = () => {
    if (isSuccess) return
    setErrorMsg('')
    setIsError(false)
    setPin((prev) => prev.slice(0, -1))
  }

  const handleClear = () => {
    if (isSuccess) return
    setErrorMsg('')
    setIsError(false)
    setPin('')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        handleClear()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pin, isSuccess])

  return (
    <div className="min-h-screen bg-slate-900/95 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Glassmorphism PIN Card */}
      <div className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-2xl rounded-3xl p-8 max-w-sm w-full mx-auto relative z-10 flex flex-col items-center">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-inner relative">
          <Lock className="w-8 h-8 text-indigo-600 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 rounded-full border-2 border-white" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-1 text-center">
          Laporan Keuangan Terproteksi
        </h2>
        <p className="text-xs text-slate-500 font-medium mb-6 text-center">
          Masukkan 6 digit PIN untuk melanjutkan
        </p>

        {/* 6 PIN Indicator Dots */}
        <motion.div
          animate={isShaking ? { x: [-12, 12, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-center gap-3 mb-3"
        >
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isFilled = pin.length > index
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                  isError
                    ? 'border-rose-500 bg-rose-500/20 shadow-xs shadow-rose-500/50 scale-110'
                    : isSuccess
                    ? 'border-emerald-500 bg-emerald-500 scale-110 shadow-xs shadow-emerald-500/50'
                    : isFilled
                    ? 'border-indigo-600 bg-indigo-600 shadow-xs shadow-indigo-600/40 scale-110'
                    : 'border-slate-300 bg-slate-100'
                }`}
              >
                {isFilled && !isSuccess && !isError && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
                {isSuccess && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
              </div>
            )
          })}
        </motion.div>

        {/* Status Error / Success Message */}
        <div className="h-6 mb-4 flex items-center justify-center">
          {errorMsg && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/80 px-3 py-0.5 rounded-full"
            >
              {errorMsg}
            </motion.p>
          )}
          {isSuccess && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-3 py-0.5 rounded-full"
            >
              ✓ PIN Benar! Membuka Dashboard...
            </motion.p>
          )}
        </div>

        {/* Numpad Keypad Virtual */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              className="w-full aspect-square rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-xs hover:shadow-md text-slate-800 font-extrabold text-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="w-full aspect-square rounded-2xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-slate-600 font-bold text-xs flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="Hapus Semua (Clear)"
          >
            C
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="w-full aspect-square rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 shadow-xs hover:shadow-md text-slate-800 font-extrabold text-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="w-full aspect-square rounded-2xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-slate-600 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="Hapus (Backspace)"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Exit Link */}
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>← Kembali ke Dashboard BGN</span>
        </Link>
      </div>
    </div>
  )
}

export default function OlloLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true)
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
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem(AUTH_KEY)
      if (token === AUTH_TOKEN) {
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
      setIsCheckingAuth(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      setWallets(OlloStore.getWallets())
    }
  }, [showQuickAdd, pathname, isAuthenticated])

  const handleLock = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(AUTH_KEY)
    }
    setIsAuthenticated(false)
  }

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

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('ollo_data_updated'))
    }
  }

  // Loading state while checking sessionStorage
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  // If unauthenticated, show security PIN gate screen
  if (!isAuthenticated) {
    return <PinAuthScreen onSuccess={() => setIsAuthenticated(true)} />
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

          {/* Instant Lock / Logout Session Button */}
          <button
            type="button"
            onClick={handleLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200/60 shadow-2xs transition active:scale-95 cursor-pointer"
            title="Kunci Dashboard Keuangan (Logout Sesi)"
          >
            <Lock size={14} />
            <span className="hidden sm:inline">Kunci</span>
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

      {/* Floating Bottom Navigation Bar (Finaci UI Kit Style) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-xl border border-slate-200/80 px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-1 sm:gap-4 max-w-sm w-[92%] justify-around">
        {/* 1. Beranda (Home) */}
        <Link
          href="/lap-keu"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[10px] font-bold transition ${
            pathname === '/lap-keu' ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Home size={19} />
          <span>Beranda</span>
        </Link>

        {/* 2. Analitik (Analytics) */}
        <Link
          href="/lap-keu/analitik"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[10px] font-bold transition ${
            pathname.startsWith('/lap-keu/analitik') ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <BarChart3 size={19} />
          <span>Analitik</span>
        </Link>

        {/* 3. CENTER CAMERA SCAN BUTTON (Prominent Floating Circle) */}
        <Link
          href="/lap-keu/scan-nota"
          className="relative -top-5 w-13 h-13 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 transition active:scale-95 cursor-pointer border-4 border-slate-50"
          title="Scan Nota AI"
        >
          <Camera size={22} className="text-white" />
        </Link>

        {/* 4. Budget & Kartu (Cards) */}
        <Link
          href="/lap-keu/budget"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[10px] font-bold transition ${
            pathname.startsWith('/lap-keu/budget') ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <PiggyBank size={19} />
          <span>Budget</span>
        </Link>

        {/* 5. Pengaturan (Settings) */}
        <Link
          href="/lap-keu/pengaturan"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-full text-[10px] font-bold transition ${
            pathname.startsWith('/lap-keu/pengaturan') ? 'text-indigo-600 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          <Settings size={19} />
          <span>Setel</span>
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
