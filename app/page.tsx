"use client"
import React, { useState, useEffect } from 'react'
import { 
  CookingPot, 
  School, 
  Gauge, 
  Truck, 
  UserCheck, 
  AlertTriangle, 
  Plus, 
  TrendingUp, 
  MapPin, 
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mock data for production chart
  const chartData = [
    { name: '08/07', Target: 3000, Realisasi: 2950 },
    { name: '09/07', Target: 3000, Realisasi: 3000 },
    { name: '10/07', Target: 3200, Realisasi: 3150 },
    { name: '11/07', Target: 3200, Realisasi: 3200 },
    { name: '12/07', Target: 3200, Realisasi: 3100 },
    { name: '13/07', Target: 3214, Realisasi: 3214 },
    { name: '14/07', Target: 3214, Realisasi: 2730 } // 85% today
  ]

  // Main metrics
  const metrics = [
    { 
      label: 'Porsi Hari Ini', 
      value: '3.214', 
      sub: 'Target 100%', 
      icon: <CookingPot size={22} />, 
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20'
    },
    { 
      label: 'Sekolah Penerima', 
      value: '17', 
      sub: 'Zonasi Wonorejo', 
      icon: <School size={22} />, 
      gradient: 'from-indigo-500 to-blue-600',
      shadow: 'shadow-indigo-500/20'
    },
    { 
      label: 'Efisiensi Produksi', 
      value: '85%', 
      sub: 'Rata-rata 92%', 
      icon: <Gauge size={22} />, 
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20'
    },
    { 
      label: 'Rute Terdistribusi', 
      value: '7 / 10', 
      sub: '3 Rute Pengantaran', 
      icon: <Truck size={22} />, 
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20'
    },
    { 
      label: 'Relawan Hadir', 
      value: '46 / 48', 
      sub: '96% Tingkat Kehadiran', 
      icon: <UserCheck size={22} />, 
      gradient: 'from-cyan-500 to-sky-600',
      shadow: 'shadow-cyan-500/20'
    }
  ]

  // Critical stock items
  const criticalStock = [
    { name: 'Beras C4 Pasuruan', current: 120, limit: 500, unit: 'Kg', color: 'bg-rose-500' },
    { name: 'Daging Ayam Fillet', current: 15, limit: 200, unit: 'Kg', color: 'bg-rose-500' },
    { name: 'Susu UHT Segar', current: 50, limit: 300, unit: 'Liter', color: 'bg-amber-500' }
  ]

  // Distribution routes status
  const routesStatus = [
    { route: 'Rute 1 - Wonorejo Barat', driver: 'Budi Santoso', stops: 'SDN 1 Wonorejo, SDN 3 Wonorejo', time: '07:15', status: 'Tiba', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { route: 'Rute 2 - Wonorejo Timur', driver: 'Edi Wibowo', stops: 'SDN 2 Wonorejo, SMPN 1 Wonorejo', time: '07:30', status: 'Kirim', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { route: 'Rute 3 - Wonorejo Utara', driver: 'Slamet Rahardjo', stops: 'SDN Cobanblimbing 1, 2', time: '07:45', status: 'Siap', color: 'bg-slate-100 text-slate-600 border-slate-200' }
  ]

  // Recent timeline actions
  const timeline = [
    { time: '04:00 AM', event: 'Sanitasi dapur selesai & pemanasan alat masak dimulai.', type: 'info' },
    { time: '05:30 AM', event: 'Uji suhu & organoleptik bahan masakan awal lolos QC.', type: 'success' },
    { time: '06:15 AM', event: 'Masak utama selesai, persiapan area packing.', type: 'info' },
    { time: '07:00 AM', event: 'Rute 1 (Budi Santoso) berangkat mengantar ke 3 sekolah.', type: 'shipping' }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl shadow-xl relative overflow-hidden text-white border border-slate-800">
        <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md rounded-full border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} className="animate-pulse" /> Live System
            </span>
            <span className="text-xs font-semibold text-indigo-300">Dapur Wonorejo</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Sugeng Rawuh, Admin Dapur! 👋</h1>
          <p className="text-slate-400 text-sm max-w-xl font-medium">
            Sistem Manajemen Dapur SPPG Pasuruan Wonorejo. Berikut adalah rangkuman performa dan operasional Anda hari ini.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-200 cursor-pointer">
            <Plus size={16} /> Input Log Produksi
          </button>
        </div>
      </div>

      {/* Main Metrics Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {metrics.map((item, index) => (
          <div 
            key={index} 
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-36 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md ${item.shadow} group-hover:scale-105 transition-transform duration-200`}>
                {item.icon}
              </div>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight block">
                {item.value}
              </span>
              <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                {item.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Grid Content: Chart, Stocks, Routes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Recharts Chart & Routes Status */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Production Chart Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <TrendingUp className="text-indigo-600" size={20} />
                  Tren Produksi Porsi Makanan
                </h3>
                <p className="text-xs text-slate-500 font-medium">Grafik realisasi vs target porsi harian dalam 7 hari terakhir.</p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase">
                Mingguan
              </span>
            </div>
            
            {/* Chart Area wrapper */}
            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} fontWeight={600} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="Target" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorTarget)" />
                    <Area type="monotone" dataKey="Realisasi" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorReal)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Loading visualisasi...
                </div>
              )}
            </div>
          </div>

          {/* Distribution Routes Status Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Truck className="text-emerald-600" size={20} />
                Status Rute Distribusi
              </h3>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                7 / 10 Rute Selesai
              </span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {routesStatus.map((item, idx) => (
                <div key={idx} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors duration-200">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl mt-1">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{item.route}</h4>
                      <p className="text-slate-600 font-semibold text-xs mt-1">Tujuan: {item.stops}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">Pengemudi: {item.driver} • Rencana Berangkat: {item.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.color}`}>
                      {item.status === 'Tiba' ? 'Tiba di Lokasi' : item.status === 'Kirim' ? 'Sedang Kirim' : 'Siap Berangkat'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Critical Stock & Timeline Activity */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Critical Stock Widget */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <AlertTriangle className="text-rose-500" size={20} />
                  Stok Kritis
                </h3>
                <p className="text-xs text-slate-500 font-medium">Bahan pangan di bawah ambang batas aman.</p>
              </div>
            </div>

            <div className="space-y-4">
              {criticalStock.map((item, idx) => {
                const percentage = Math.min(100, (item.current / item.limit) * 100)
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-slate-900 font-bold">{item.current} {item.unit} / <span className="text-slate-400 font-medium">{item.limit} {item.unit}</span></span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider rounded-2xl border border-rose-100 transition duration-150 cursor-pointer">
              Buat PO Pengadaan <ArrowRight size={14} />
            </button>
          </div>

          {/* Timeline Activity Widget */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Clock className="text-indigo-600" size={20} />
                Aktivitas Hari Ini
              </h3>
              <p className="text-xs text-slate-500 font-medium">Kronologi operasional dapur hari ini.</p>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
              {timeline.map((item, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline bullet indicator */}
                  <span className={`absolute -left-[31px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${
                    item.type === 'success' ? 'bg-emerald-500 ring-emerald-50' : 
                    item.type === 'shipping' ? 'bg-amber-500 ring-amber-50' : 'bg-indigo-500 ring-indigo-50'
                  }`} />
                  <span className="text-[10px] font-bold text-slate-400 block">{item.time}</span>
                  <p className="text-sm font-semibold text-slate-700 mt-1 leading-snug">{item.event}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}