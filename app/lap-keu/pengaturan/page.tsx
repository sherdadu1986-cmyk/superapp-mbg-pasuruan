"use client"

import React, { useState } from 'react'
import { Settings, Shield, Database, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function PengaturanPage() {
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleResetData = () => {
    if (confirm('Reset seluruh data Finora ke kondisi awal seed data September 2026?')) {
      localStorage.clear()
      setResetSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="text-emerald-400" />
          Pengaturan Sistem Finora
        </h1>
        <p className="text-xs text-slate-400">
          Konfigurasi mata uang, integrasi Supabase, reset database, dan preferensi tampilan.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> Data berhasil di-reset ke kondisi awal September 2026. Mereload...
        </div>
      )}

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="font-bold text-white text-sm">Status Database Supabase</div>
            <div className="text-slate-400 mt-0.5">Terkoneksi ke https://kolgqqvurvbjbtuufnai.supabase.co</div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            🟢 Online & Active
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="font-bold text-white text-sm">Vision AI Receipt Scanner Model</div>
            <div className="text-slate-400 mt-0.5">Gemini 1.5 Flash Vision OCR + Smart Parsing Engine</div>
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
            🤖 Vision LLM Ready
          </span>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div>
            <div className="font-bold text-white text-sm">Reset Data Finora</div>
            <div className="text-slate-400 mt-0.5">Hapus cache lokal dan muat ulang seed data September 2026.</div>
          </div>
          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Reset Data</span>
          </button>
        </div>
      </div>
    </div>
  )
}
