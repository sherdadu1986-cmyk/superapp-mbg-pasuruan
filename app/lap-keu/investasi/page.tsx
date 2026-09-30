"use client"

import React, { useState, useEffect } from 'react'
import { TrendingUp, ShieldCheck, DollarSign } from 'lucide-react'
import { FinoraStore, formatRupiah } from '@/lib/finora-store'

export default function InvestasiPage() {
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    setSummary(FinoraStore.getSummary())
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="text-cyan-400" />
          Portofolio Investasi & Asset Growth
        </h1>
        <p className="text-xs text-slate-400">
          Pantau pertumbuhan modal pada reksadana, saham, obligasi negara, dan emas.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Portofolio Investasi</span>
          <span className="text-2xl font-black text-cyan-400">{summary ? formatRupiah(summary.investmentTotal) : 'Rp 45.000.000'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-white text-sm block">Bibit Reksadana IHSG Indeks</span>
            <span className="text-slate-400 block mt-1">Nilai Saat Ini: <strong className="text-cyan-300">Rp 30.000.000</strong></span>
            <span className="text-emerald-400 text-[11px] font-bold block mt-0.5">+14.2% Return (YoY)</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-white text-sm block">Obligasi Negara SBR013</span>
            <span className="text-slate-400 block mt-1">Nilai Saat Ini: <strong className="text-cyan-300">Rp 15.000.000</strong></span>
            <span className="text-emerald-400 text-[11px] font-bold block mt-0.5">+6.4% Coupon Net/Year</span>
          </div>
        </div>
      </div>
    </div>
  )
}
