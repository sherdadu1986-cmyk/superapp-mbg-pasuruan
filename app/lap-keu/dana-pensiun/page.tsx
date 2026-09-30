"use client"

import React, { useState, useEffect } from 'react'
import { Palmtree } from 'lucide-react'
import { FinoraStore, formatRupiah } from '@/lib/finora-store'

export default function DanaPensiunPage() {
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    setSummary(FinoraStore.getSummary())
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Palmtree className="text-amber-400" />
          Proyeksi Dana Pensiun & DPLK
        </h1>
        <p className="text-xs text-slate-400">
          Perencanaan kemandirian finansial masa pensiun dengan kalkulasi compounding interest.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Saldo DPLK Pensiun Saat Ini</span>
          <span className="text-2xl font-black text-amber-300">{summary ? formatRupiah(summary.pensionTotal) : 'Rp 38.500.000'}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="font-bold text-white text-sm">Proyeksi Pensiun di Usia 55 (Asumsi Retur 9%/Tahun):</div>
          <div className="flex justify-between">
            <span>Estimasi Nilai Masa Depan:</span>
            <strong className="text-amber-400 text-sm">Rp 1.450.000.000</strong>
          </div>
          <p className="text-[11px] text-slate-400">
            DPLK BNI & Mandiri Inhealth terdaftar resmi di OJK.
          </p>
        </div>
      </div>
    </div>
  )
}
