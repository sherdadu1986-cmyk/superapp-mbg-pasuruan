"use client"

import React, { useState, useEffect } from 'react'
import { Gem, ShieldCheck, ArrowRight } from 'lucide-react'
import { FinoraStore, formatRupiah } from '@/lib/finora-store'

export default function NetWorthPage() {
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    setSummary(FinoraStore.getSummary())
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-1">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Gem className="text-indigo-400" />
          Kekayaan Bersih (Net Worth Statement)
        </h1>
        <p className="text-xs text-slate-400">
          Kalkulasi Total Aset dikurangi Total Kewajiban / Utang untuk mengukur kekayaan bersih hakiki.
        </p>
      </div>

      {summary && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-6">
          <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950/60 border border-indigo-500/30">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Net Worth Bersih Anda</span>
            <span className="text-3xl md:text-4xl font-black text-emerald-400 mt-1 block">
              {formatRupiah(summary.netWorth)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-emerald-400 text-sm block">➕ Total Aset (Assets):</span>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Kas & Bank Liquid:</span>
                  <strong>{formatRupiah(summary.activeBalance)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Investasi Reksadana & Saham:</span>
                  <strong>{formatRupiah(summary.investmentTotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Dana Darurat:</span>
                  <strong>{formatRupiah(summary.emergencyTotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Dana Pensiun DPLK:</span>
                  <strong>{formatRupiah(summary.pensionTotal)}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-white">
                  <span>Subtotal Aset:</span>
                  <span className="text-emerald-400">{formatRupiah(summary.totalAssets)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="font-bold text-rose-400 text-sm block">➖ Total Utang (Liabilities):</span>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>Utang Cicilan Laptop Workstation:</span>
                  <strong className="text-rose-400">{formatRupiah(summary.totalDebts)}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-white mt-auto">
                  <span>Subtotal Kewajiban:</span>
                  <span className="text-rose-400">{formatRupiah(summary.totalDebts)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
