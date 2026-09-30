"use client"

import React, { useState, useEffect } from 'react'
import { Repeat, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { FinoraStore, FinRecurring, formatRupiah } from '@/lib/finora-store'

export default function PengeluaranRutinPage() {
  const [items, setItems] = useState<FinRecurring[]>([])

  useEffect(() => {
    setItems(FinoraStore.getRecurring())
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Repeat className="text-emerald-400" />
          Pengeluaran Rutin & Tagihan Otomatis
        </h1>
        <p className="text-xs text-slate-400">
          Jadwal cicilan, tagihan bulanan, dan berlangganan rutin agar tidak terlambat bayar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((r) => (
          <div key={r.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-base">{r.name}</span>
              <span className="text-xs font-extrabold text-rose-400">{formatRupiah(r.amount)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-emerald-400" /> Jatuh Tempo: <strong className="text-slate-200">{r.next_due_date}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">{r.frequency}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
