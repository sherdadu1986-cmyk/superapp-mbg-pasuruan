"use client"

import React, { useState, useEffect } from 'react'
import { ShieldAlert, CheckCircle2 } from 'lucide-react'
import { FinoraStore, formatRupiah } from '@/lib/finora-store'

export default function DanaDaruratPage() {
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    setSummary(FinoraStore.getSummary())
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="text-rose-400" />
          Kalkulator & Kas Dana Darurat
        </h1>
        <p className="text-xs text-slate-400">
          Dana perlindungan darurat untuk menghadapi risiko tidak terduga tanpa mengganggu aset utama.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Saldo Dana Darurat Disimpan</span>
            <span className="text-2xl font-black text-emerald-400">{summary ? formatRupiah(summary.emergencyTotal) : 'Rp 25.000.000'}</span>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Aman untuk 3.3 Bulan
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="font-bold text-white text-sm">Target Ideal Dana Darurat (6 Bulan):</div>
          <div className="flex justify-between">
            <span>Rata-rata Pengeluaran Bulanan:</span>
            <strong className="text-white">Rp 7.500.000</strong>
          </div>
          <div className="flex justify-between">
            <span>Target Ideal 6 Bulan:</span>
            <strong className="text-emerald-400">Rp 45.000.000</strong>
          </div>
          <div className="flex justify-between">
            <span>Kekurangan Target:</span>
            <strong className="text-amber-400">Rp 20.000.000</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
