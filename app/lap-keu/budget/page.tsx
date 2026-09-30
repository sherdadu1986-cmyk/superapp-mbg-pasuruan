"use client"

import React, { useState, useEffect } from 'react'
import { PiggyBank, Target, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  OlloStore,
  OlloBudget,
  OlloSavingsGoal,
  formatRupiahShort,
  formatRupiahFull
} from '@/lib/ollo-store'

export default function OlloBudgetPage() {
  const [budgets, setBudgets] = useState<OlloBudget[]>([])
  const [savings, setSavings] = useState<OlloSavingsGoal[]>([])

  const loadData = () => {
    setBudgets(OlloStore.getBudgets())
    setSavings(OlloStore.getSavingsGoals())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDeposit = (id: string, pct: number) => {
    const goal = savings.find(g => g.id === id)
    if (!goal) return
    const amount = Math.round((goal.target_amount * pct) / 100)
    const wallets = OlloStore.getWallets()
    const walletId = wallets[0]?.id || 'w-bni'
    OlloStore.depositSavingsGoal(id, amount, walletId)
    loadData()
  }

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <PiggyBank className="text-emerald-600" size={22} />
          Budget & Target Tabungan
        </h1>
        <p className="text-xs text-slate-500">
          Kendalikan batas pengeluaran bulanan dan percepat pemenuhan target impian Anda.
        </p>
      </div>

      {/* Section 1: Budget Bulanan Ringkas */}
      <div className="space-y-3">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
          Budget Bulanan Per Kategori
        </span>

        <div className="space-y-2.5">
          {budgets.map((b) => {
            const pct = Math.min(Math.round((b.spent_amount / b.limit_amount) * 100), 100)
            const isOver = b.spent_amount > b.limit_amount

            return (
              <div key={b.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{b.category}</span>
                  {isOver ? (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                      <AlertCircle size={12} /> Over-budget! ({pct}%)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-600">{pct}%</span>
                  )}
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>Terpakai: <strong className="text-slate-800">{formatRupiahFull(b.spent_amount)}</strong></span>
                  <span>Batas: <strong className="text-emerald-600">{formatRupiahFull(b.limit_amount)}</strong></span>
                </div>

                {/* Thin Clean Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 2: Target Tabungan & Shortcut Instant Deposits */}
      <div className="space-y-3 pt-2">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
          Target Tabungan (Savings Goals)
        </span>

        <div className="space-y-3">
          {savings.map((s) => {
            const pct = Math.min(Math.round((s.current_amount / s.target_amount) * 100), 100)

            return (
              <div key={s.id} className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-sm">
                      🎯
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{s.title}</h4>
                      <p className="text-[10px] text-slate-400">Target: {s.target_date || '2026-12-31'}</p>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    {pct}%
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-500">
                  <span>Terkumpul: <strong className="text-slate-900">{formatRupiahFull(s.current_amount)}</strong></span>
                  <span>Target: <strong className="text-slate-900">{formatRupiahFull(s.target_amount)}</strong></span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  />
                </div>

                {/* Instant Deposit Shortcut Buttons */}
                <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
                  <span className="text-[11px] font-semibold text-slate-400">Deposit Instan:</span>
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 25, 50].map((stepPct) => (
                      <button
                        key={stepPct}
                        type="button"
                        onClick={() => handleDeposit(s.id, stepPct)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[10px] font-bold transition border border-slate-200/60"
                      >
                        +{stepPct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
