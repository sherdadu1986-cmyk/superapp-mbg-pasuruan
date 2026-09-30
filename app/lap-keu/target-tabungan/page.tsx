"use client"

import React, { useState, useEffect } from 'react'
import { Target, Plane, Laptop, Zap } from 'lucide-react'
import { FinoraStore, FinSavingsGoal, formatRupiah } from '@/lib/finora-store'

export default function TargetTabunganPage() {
  const [goals, setGoals] = useState<FinSavingsGoal[]>([])

  useEffect(() => {
    setGoals(FinoraStore.getSavingsGoals())
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Target className="text-emerald-400" />
          Target Tabungan & Financial Goals
        </h1>
        <p className="text-xs text-slate-400">
          Wujudkan impian jangka pendek dan panjang dengan alokasi tabungan disiplin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((g) => {
          const percent = Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100)

          return (
            <div key={g.id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{g.name}</span>
                <span className="text-xs font-bold text-emerald-400">{percent}%</span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Terkumpul:</span>
                  <span className="font-bold text-emerald-400">{formatRupiah(g.current_amount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Target:</span>
                  <span className="font-bold text-white">{formatRupiah(g.target_amount)}</span>
                </div>
              </div>

              <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  style={{ width: `${percent}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                />
              </div>

              <div className="text-[11px] text-slate-400 text-right pt-1">
                Target: {g.target_date}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
