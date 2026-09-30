"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Palmtree,
  Sparkles,
  Bot,
  ScanLine,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts'
import { FinoraStore, formatRupiah } from '@/lib/finora-store'

// 6-Month Cashflow Trend Data
const TREND_DATA = [
  { month: 'Apr 2026', income: 21000000, expense: 7800000 },
  { month: 'Mei 2026', income: 22500000, expense: 8200000 },
  { month: 'Jun 2026', income: 20000000, expense: 6900000 },
  { month: 'Jul 2026', income: 24000000, expense: 8900000 },
  { month: 'Agt 2026', income: 22000000, expense: 7100000 },
  { month: 'Sep 2026', income: 23500000, expense: 7450000 }
]

// Expense Breakdown Categories
const CATEGORY_PIE = [
  { name: 'Rumah & Cicilan', value: 3200000, color: '#6366f1' },
  { name: 'Investasi & DCA', value: 2000000, color: '#06b6d4' },
  { name: 'Kebutuhan Rumah', value: 1450000, color: '#10b981' },
  { name: 'Tagihan & Utilitas', value: 850000, color: '#f59e0b' },
  { name: 'Makanan & Kuliner', value: 680000, color: '#ec4899' },
  { name: 'Transportasi', value: 450000, color: '#8b5cf6' }
]

export default function FinoraDashboard() {
  const [mounted, setMounted] = useState(false)
  const [summary, setSummary] = useState({
    activeBalance: 33750000,
    totalIncomeMonth: 23500000,
    totalExpenseMonth: 7450000,
    totalDebts: 4200000,
    totalSavingsCurrent: 25000000,
    investmentTotal: 45000000,
    pensionTotal: 38500000,
    emergencyTotal: 25000000,
    remainingCashFlow: 16050000,
    spendingPercentage: 31,
    netWorth: 104250000,
    totalAssets: 108450000
  })

  useEffect(() => {
    setMounted(true)
    const data = FinoraStore.getSummary()
    setSummary(data)
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 p-6 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest">
              FINORA OS v2.4
            </span>
            <span className="text-xs text-slate-400 font-medium">· Bulan Aktif: September 2026</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Dashboard Keuangan Pribadi
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Kilas balik kesehatan finansial, alokasi anggaran, dan analisis AI berbasis data real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link
            href="/lap-keu/scan-nota"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
          >
            <ScanLine size={16} />
            <span>Scan Nota (Vision AI)</span>
          </Link>

          <Link
            href="/lap-keu/ai-assistant"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs transition cursor-pointer"
          >
            <Bot size={16} />
            <span>Tanya AI Advisor</span>
          </Link>
        </div>
      </div>

      {/* 7 Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Saldo Aktif */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-emerald-500/30 shadow-xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Saldo Aktif (Kas & Bank)</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl md:text-2xl font-black text-emerald-400">
              {formatRupiah(summary.activeBalance)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" /> Liquid Cash Sehat
            </p>
          </div>
        </motion.div>

        {/* 2. Total Pemasukan Sep 2026 */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pemasukan Bulan Ini</span>
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl md:text-2xl font-bold text-teal-300">
              {formatRupiah(summary.totalIncomeMonth)}
            </h3>
            <p className="text-[11px] text-teal-400 mt-1 font-medium">Gaji SPPG + Bonus AI</p>
          </div>
        </motion.div>

        {/* 3. Total Pengeluaran Sep 2026 */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pengeluaran Bulan Ini</span>
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <ArrowDownRight size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl md:text-2xl font-bold text-rose-400">
              {formatRupiah(summary.totalExpenseMonth)}
            </h3>
            <p className="text-[11px] text-rose-300/80 mt-1 font-medium">
              Rasio Belanja: {summary.spendingPercentage}%
            </p>
          </div>
        </motion.div>

        {/* 4. Total Utang */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Utang Berjalan</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl md:text-2xl font-bold text-amber-300">
              {formatRupiah(summary.totalDebts)}
            </h3>
            <p className="text-[11px] text-amber-400/80 mt-1 font-medium">Cicilan Laptop Workstation</p>
          </div>
        </motion.div>

        {/* 5. Tabungan & Dana Darurat */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tabungan Darurat</span>
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <PiggyBank size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-cyan-300">
              {formatRupiah(summary.emergencyTotal)}
            </h3>
            <p className="text-[11px] text-cyan-400/80 mt-1">Cukup 3.3 Bulan Operational</p>
          </div>
        </motion.div>

        {/* 6. Portofolio Investasi */}
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Portofolio Investasi</span>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-indigo-300">
              {formatRupiah(summary.investmentTotal)}
            </h3>
            <p className="text-[11px] text-indigo-400/80 mt-1">Bibit Reksadana Indeks</p>
          </div>
        </motion.div>

        {/* 7. Dana Pensiun */}
        <motion.div
          whileHover={{ y: -3 }}
          className="col-span-2 sm:col-span-2 lg:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Palmtree size={16} className="text-amber-400" />
              <span>Dana Pensiun DPLK & Net Worth</span>
            </div>
            <div className="mt-2 flex items-baseline gap-4">
              <div>
                <span className="text-xs text-slate-400 block">DPLK:</span>
                <span className="text-lg font-bold text-amber-300">{formatRupiah(summary.pensionTotal)}</span>
              </div>
              <div className="h-8 w-[1px] bg-slate-800" />
              <div>
                <span className="text-xs text-slate-400 block">Net Worth Bersih:</span>
                <span className="text-lg font-extrabold text-emerald-400">{formatRupiah(summary.netWorth)}</span>
              </div>
            </div>
          </div>
          <Link
            href="/lap-keu/net-worth"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
          >
            <span>Detail</span>
            <ChevronRight size={14} />
          </Link>
        </motion.div>
      </div>

      {/* Cashflow Summary Progress Bar (September 2026) */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Activity size={18} className="text-emerald-400" />
              Ringkasan Cash Flow September 2026
            </h3>
            <p className="text-xs text-slate-400">
              Sisa dana bersih yang siap dialokasikan setelah seluruh pengeluaran bulan ini.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Sisa Dana Cash Flow:</span>
            <span className="text-xl font-extrabold text-emerald-400">
              {formatRupiah(summary.remainingCashFlow)}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-rose-400">Pengeluaran: {formatRupiah(summary.totalExpenseMonth)} ({summary.spendingPercentage}%)</span>
            <span className="text-emerald-400">Sisa Cash Flow: {formatRupiah(summary.remainingCashFlow)} ({100 - summary.spendingPercentage}%)</span>
          </div>
          <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
            <div
              style={{ width: `${summary.spendingPercentage}%` }}
              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
              title={`Pengeluaran ${summary.spendingPercentage}%`}
            />
            <div
              style={{ width: `${100 - summary.spendingPercentage}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ml-0.5"
              title={`Sisa Cash Flow ${100 - summary.spendingPercentage}%`}
            />
          </div>
        </div>
      </div>

      {/* Interactive Recharts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Area Chart 6 Month Trend */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Tren Cash Flow 6 Bulan Terakhir</h3>
              <p className="text-xs text-slate-400">Perbandingan historis Pemasukan vs Pengeluaran (April - September 2026)</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                Pemasukan
              </div>
              <div className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                Pengeluaran
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => formatRupiah(Number(val))}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" name="Pemasukan" />
                  <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" name="Pengeluaran" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-950/50 rounded-2xl animate-pulse flex items-center justify-center text-xs text-slate-500">
                Loading Visual Graphic...
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Donut Expense Category Breakdown */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Komposisi Pengeluaran</h3>
            <p className="text-xs text-slate-400">Pembagian pos pengeluaran bulan September 2026</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_PIE}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {CATEGORY_PIE.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => formatRupiah(Number(val))}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-950/50 rounded-2xl animate-pulse" />
            )}
          </div>

          {/* Custom Donut Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-800 max-h-36 overflow-y-auto pr-1 text-xs">
            {CATEGORY_PIE.map((c) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-300 truncate max-w-[120px]">{c.name}</span>
                </div>
                <span className="font-bold text-white">{formatRupiah(c.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card AI Monthly Insight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 shadow-2xl space-y-4 relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-lg">Finora AI Monthly Insight</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AUTOMATED ADVISORY
                </span>
              </div>
              <p className="text-xs text-slate-400">Ringkasan cerdas & rekomendasi keuangan praktis September 2026</p>
            </div>
          </div>

          <Link
            href="/lap-keu/ai-assistant"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition"
          >
            <span>Konsultasi Lanjutan</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-rose-400 font-bold flex items-center gap-1">
              ⚠️ Deteksi Kenaikan Pos
            </span>
            <p className="text-slate-300 leading-relaxed">
              Pos <strong className="text-white">Kebutuhan Rumah Tangga</strong> naik <strong className="text-rose-400">+12%</strong> dibanding bulan lalu karena adanya pembelian persediaan awal beras & minyak.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              ✅ Status Budget Over-performing
            </span>
            <p className="text-slate-300 leading-relaxed">
              Pos <strong className="text-white">Makanan & Kuliner</strong> hemat <strong className="text-emerald-400">55%</strong> dari batas budget. Anda menghemat Rp 1.380.000 bulan ini!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              💡 Tips Keuangan Praktis
            </span>
            <p className="text-slate-300 leading-relaxed">
              Alokasikan <strong className="text-cyan-400">Rp 5.000.000</strong> dari sisa cash flow Rp 16.050.000 ke <strong className="text-white">Kas Dana Darurat</strong> agar mencapai target ideal 6 bulan.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
