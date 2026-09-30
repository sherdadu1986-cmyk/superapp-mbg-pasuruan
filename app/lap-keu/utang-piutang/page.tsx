"use client"

import React, { useState, useEffect } from 'react'
import { CreditCard, Calendar, User, CheckCircle } from 'lucide-react'
import { FinoraStore, FinDebt, formatRupiah } from '@/lib/finora-store'

export default function UtangPiutangPage() {
  const [debts, setDebts] = useState<FinDebt[]>([])

  useEffect(() => {
    setDebts(FinoraStore.getDebts())
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <CreditCard className="text-amber-400" />
          Manajemen Utang & Piutang
        </h1>
        <p className="text-xs text-slate-400">
          Catat kewajiban utang dan klaim piutang dengan pelacakan sisa pinjaman & tenggat waktu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {debts.map((d) => (
          <div key={d.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-base">{d.title}</span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                d.type === 'utang' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              }`}>
                {d.type === 'utang' ? 'Utang Saya' : 'Piutang Orang Lain'}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400">Total Pinjaman: <strong className="text-white">{formatRupiah(d.total_amount)}</strong></span>
              <span className="text-slate-400">Sisa: <strong className="text-amber-400">{formatRupiah(d.remaining_amount)}</strong></span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span className="flex items-center gap-1"><User size={13} /> {d.person_name}</span>
              <span className="flex items-center gap-1"><Calendar size={13} /> {d.due_date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
