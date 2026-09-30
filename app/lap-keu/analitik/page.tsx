"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts'
import { FinoraStore, formatRupiah } from '@/lib/finora-store'

const MONTHLY_COMPARISON = [
  { month: 'Apr', pemasukan: 21000000, pengeluaran: 7800000, tabungan: 13200000 },
  { month: 'Mei', pemasukan: 22500000, pengeluaran: 8200000, tabungan: 14300000 },
  { month: 'Jun', pemasukan: 20000000, pengeluaran: 6900000, tabungan: 13100000 },
  { month: 'Jul', pemasukan: 24000000, pengeluaran: 8900000, tabungan: 15100000 },
  { month: 'Agt', pemasukan: 22000000, pengeluaran: 7100000, tabungan: 14900000 },
  { month: 'Sep', pemasukan: 23500000, pengeluaran: 7450000, tabungan: 16050000 }
]

export default function AnalitikPage() {
  const [mounted, setMounted] = useState(false)
  const [summary, setSummary] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    setSummary(FinoraStore.getSummary())
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
              FINANCIAL REPORTING
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="text-emerald-400" />
            Analitik Keuangan & Deep Insights
          </h1>
          <p className="text-xs text-slate-400">
            Laporan mendalam tren pengeluaran, perbandingan bulanan, dan efisiensi alokasi modal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Laporan keuangan berhasil diexport ke format PDF / Excel!')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer self-start md:self-auto"
        >
          <Download size={16} className="text-emerald-400" />
          <span>Export Laporan</span>
        </button>
      </div>

      {/* Bar Chart Section */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Perbandingan Pemasukan, Pengeluaran & Tabungan</h3>
            <p className="text-xs text-slate-400">Data historis semester II 2026</p>
          </div>
        </div>

        <div className="h-80 w-full pt-4">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_COMPARISON} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => formatRupiah(Number(val))}
                />
                <Legend />
                <Bar dataKey="pemasukan" fill="#10b981" radius={[6, 6, 0, 0]} name="Pemasukan" />
                <Bar dataKey="pengeluaran" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Pengeluaran" />
                <Bar dataKey="tabungan" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Tabungan Bersih" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-slate-950/50 rounded-2xl animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}
