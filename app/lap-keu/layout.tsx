"use client"

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'

const AUTH_KEY = 'lap_keu_auth_token'
const AUTH_TOKEN = 'authenticated_MBG'

function FinanceAuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const passwordRef = useRef<HTMLInputElement>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === 'MBG' && password === 'wonorejo') {
      setErrorMsg('')
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(AUTH_KEY, AUTH_TOKEN)
      }
      onSuccess()
    } else {
      setErrorMsg('⚠️ Username atau password tidak sesuai')
      setPassword('')
      setTimeout(() => {
        passwordRef.current?.focus()
      }, 0)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900/95 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none w-full">
      {/* Background Ambient Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Login Card */}
      <div className="rounded-[32px] p-8 max-w-sm w-full bg-slate-100 shadow-2xl relative z-10 flex flex-col items-center">
        {/* Top Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shadow-inner relative">
          <Lock className="w-8 h-8 text-purple-600" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-purple-600 rounded-full border-2 border-white" />
        </div>

        <h2 className="text-xl font-bold text-slate-800 text-center mt-3">
          Laporan Keuangan Terproteksi
        </h2>
        <p className="text-xs text-slate-500 text-center mb-6">
          Masukkan kredensial akun untuk membuka akses
        </p>

        {/* Form Input */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value)
                if (errorMsg) setErrorMsg('')
              }}
              placeholder="Masukkan username..."
              className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-slate-800"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 block">
              Password
            </label>
            <div className="relative">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errorMsg) setErrorMsg('')
                }}
                placeholder="Masukkan password..."
                className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-slate-800"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center mt-1">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] mt-2"
          >
            Buka Laporan Keuangan
          </button>
        </form>

        {/* Back Link */}
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition py-1 mt-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Dashboard BGN</span>
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
      if (token) {
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
    return <FinanceAuthScreen onSuccess={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center">
      {children}
    </div>
  )
}

