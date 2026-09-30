"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  PiggyBank,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Sliders
} from 'lucide-react'
import { FinoraStore, FinBudget, formatRupiah } from '@/lib/finora-store'

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<FinBudget[]>([])

  useEffect(() => {
    setBudgets(FinoraStore.getBudgets())
  }, [])

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
              CONTROL SYSTEM
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <PiggyBank className="text-emerald-400" />
            Budget & Anggaran Bulanan
          </h1>
          <p className="text-xs text-slate-400">
            Kendalikan batas belanja bulanan per kategori untuk mencegah pemborosan dana.
          </p>
        </div>
      </div>

      {/* Budget Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const percent = Math.min(Math.round((b.spent_amount / b.amount_limit) * 100), 100)
          const isDanger = percent >= 80

          return (
            <div key={b.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{b.category}</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isDanger ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {percent}% Terpakai
                </span>
              </div>

              <div className="flex items-baseline justify-between text-xs">
                <span className="text-slate-400">Terpakai: <strong className="text-white">{formatRupiah(b.spent_amount)}</strong></span>
                <span className="text-slate-400">Batas: <strong className="text-emerald-400">{formatRupiah(b.amount_limit)}</strong></span>
              </div>

              {/* Progress bar */}
              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  style={{ width: `${percent}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDanger ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                />
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Sisa Budget: <strong className={isDanger ? 'text-rose-400' : 'text-emerald-400'}>{formatRupiah(Math.max(b.amount_limit - b.spent_amount, 0))}</strong></span>
                <span>Periode: Bulanan</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
