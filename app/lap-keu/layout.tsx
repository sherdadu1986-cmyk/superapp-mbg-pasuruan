"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Check, Delete, ArrowLeft } from 'lucide-react'

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
    <div className="min-h-screen bg-slate-900/95 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none w-full">
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

export default function LapKeuLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true)

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

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PinAuthScreen onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center">
      {children}
    </div>
  )
}
