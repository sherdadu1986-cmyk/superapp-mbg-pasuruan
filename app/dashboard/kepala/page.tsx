"use client"
import React, { useState, useEffect } from 'react'
import {
  CookingPot, School, Gauge, Truck, Users,
  AlertTriangle, CheckSquare, Plus, FileText, CheckCircle2,
  Clock, ShieldCheck
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

export default function DashboardKepala() {
  const [mounted, setMounted] = useState(false)
  const [volunteersCount, setVolunteersCount] = useState(0)
  const [totalVolunteersCount, setTotalVolunteersCount] = useState(0)

  useEffect(() => { 
    setMounted(true) 
    
    // 1. Get total registered volunteers
    const storedVolunteers = localStorage.getItem('sppg_volunteers')
    let totalCount = 0
    if (storedVolunteers) {
      try {
        totalCount = JSON.parse(storedVolunteers).length
      } catch {}
    }
    setTotalVolunteersCount(totalCount)

    // 2. Count active present volunteers (masuk !== '-' and pulang === '-') from sppg_kehadiran_logs
    const savedLogs = localStorage.getItem('sppg_kehadiran_logs')
    let presentCount = 0
    if (savedLogs) {
      try {
        const logs = JSON.parse(savedLogs)
        if (Array.isArray(logs)) {
          const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          presentCount = logs.filter(
            (rec: any) => rec.date === todayStr && rec.masuk && rec.masuk !== '-' && rec.pulang === '-'
          ).length
        }
      } catch {}
    }
    setVolunteersCount(presentCount)
  }, [])

  const chartData = [
    { name: '08/07', Target: 3000, Realisasi: 2950 },
    { name: '09/07', Target: 3000, Realisasi: 3000 },
    { name: '10/07', Target: 3200, Realisasi: 3150 },
    { name: '11/07', Target: 3200, Realisasi: 3200 },
    { name: '12/07', Target: 3200, Realisasi: 3100 },
    { name: '13/07', Target: 3214, Realisasi: 3214 },
    { name: '14/07', Target: 3214, Realisasi: 2730 },
  ]

  const percent = totalVolunteersCount > 0 ? Math.round((volunteersCount / totalVolunteersCount) * 100) : 0

  const metrics = [
    { label: 'Porsi Hari Ini',     value: '3.214',  sub: 'Target 100%',          icon: <CookingPot size={20} className="text-emerald-900" /> },
    { label: 'Sekolah Penerima',   value: '17',     sub: 'Zonasi Wonorejo',       icon: <School size={20} className="text-emerald-900" /> },
    { label: 'Efisiensi Produksi', value: '85%',    sub: 'Rata-rata 92%',        icon: <Gauge size={20} className="text-emerald-900" /> },
    { label: 'Rute Terdistribusi', value: '7 / 10', sub: '3 Rute Berjalan',       icon: <Truck size={20} className="text-emerald-900" /> },
    { label: 'Relawan Hadir',      value: `${volunteersCount} / ${totalVolunteersCount}`, sub: `${percent}% Kehadiran`, icon: <Users size={20} className="text-emerald-900" /> },
  ]

  const criticalStock = [
    { name: 'Beras C4 Pasuruan',  current: 120, limit: 500, unit: 'Kg' },
    { name: 'Daging Ayam Fillet', current: 15,  limit: 200, unit: 'Kg' },
    { name: 'Susu UHT Segar',     current: 50,  limit: 300, unit: 'Liter' },
  ]

  const routesStatus = [
    { route: 'Rute 1 — Wonorejo Barat', driver: 'Budi Santoso',    stops: 'SDN 1 Wonorejo, SDN 3 Wonorejo',   time: '07:15', status: 'Tiba' },
    { route: 'Rute 2 — Wonorejo Timur', driver: 'Edi Wibowo',      stops: 'SDN 2 Wonorejo, SMPN 1 Wonorejo', time: '07:30', status: 'Kirim' },
    { route: 'Rute 3 — Wonorejo Utara', driver: 'Slamet Rahardjo', stops: 'SDN Cobanblimbing 1 & 2',         time: '07:45', status: 'Siap' },
  ]

  const approvals = [
    { id: 'REQ-2407-004', requester: 'Kayan Nurmohamad (Akuntan)', desc: 'Pengadaan Ayam Fillet Tambahan 100 Kg', amount: 'Rp 2.800.000', date: 'Hari ini' },
    { id: 'REQ-2407-005', requester: 'Muhammad Indra (Ahli Gizi)', desc: 'Pergantian Menu Selingan Susu Cokelat', amount: 'N/A', date: 'Hari ini' },
  ]

  const timeline = [
    { time: '04:00', event: 'Sanitasi dapur selesai & pemanasan alat masak dimulai.' },
    { time: '05:30', event: 'Uji suhu & organoleptik bahan masakan awal lolos QC.' },
    { time: '06:15', event: 'Masak utama selesai, persiapan area packing dimulai.' },
    { time: '07:00', event: 'Rute 1 (Budi Santoso) berangkat mengantar ke 3 sekolah.' },
  ]

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen text-slate-800 font-sans">
      {/* Welcome Banner Flat */}
      <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-900 text-white text-[10px] font-bold rounded uppercase tracking-wider">
              Kepala SPPG
            </span>
            <span className="text-xs text-gray-500 font-medium">Wonorejo · Live Monitoring</span>
          </div>
          <h1 className="text-xl font-bold text-emerald-950">Monitoring Operasional Dapur Utama</h1>
          <p className="text-gray-500 text-xs font-medium">
            Sugeng Rawuh, Ahmad Sayyidani Haqiqi, S.Pd. Berikut rangkuman data riil operasional hari ini.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold uppercase rounded border border-emerald-950 transition cursor-pointer">
            <Plus size={14} /> Log Produksi
          </button>
        </div>
      </div>

      {/* Metrics Row Grid Flat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((item, i) => (
          <div key={i} className="bg-white border border-gray-200 p-4 rounded-lg flex flex-col justify-between h-28">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</span>
              <div className="p-1.5 bg-gray-100 rounded border border-gray-200">
                {item.icon}
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight block">{item.value}</span>
              <span className="text-[10px] font-bold text-gray-400 block">{item.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">

          {/* Production Chart Card Flat */}
          <div className="bg-white border border-gray-200 p-6 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Tren Produksi Porsi Makanan</h3>
                <p className="text-xs text-gray-400">Realisasi porsi vs target harian minggu ini.</p>
              </div>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-150 px-2 py-0.5 rounded border border-gray-200">Mingguan</span>
            </div>
            <div className="h-56 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight={600} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }} />
                    <Area type="monotone" dataKey="Target" stroke="#64748b" strokeWidth={1.5} fill="none" />
                    <Area type="monotone" dataKey="Realisasi" stroke="#047857" strokeWidth={2} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs">Memuat visualisasi...</div>
              )}
            </div>
          </div>

          {/* Distribution Routes Flat */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Status Pengiriman Rute</h3>
              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">7 / 10 Selesai</span>
            </div>
            <div className="divide-y divide-gray-250">
              {routesStatus.map((item, i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800">{item.route}</h4>
                    <p className="text-gray-500 font-medium mt-0.5">Driver: {item.driver} · Sekolah: {item.stops}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border text-center ${
                    item.status === 'Tiba' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    item.status === 'Kirim' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {item.status === 'Tiba' ? 'Tiba di Lokasi' : item.status === 'Kirim' ? 'Sedang Kirim' : 'Siap'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side widgets */}
        <div className="xl:col-span-1 space-y-6">

          {/* Approval Menunggu Widget */}
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare size={16} className="text-emerald-950" /> Approval Menunggu
            </h3>
            <div className="space-y-3">
              {approvals.map((app, i) => (
                <div key={i} className="p-3 border border-gray-200 rounded bg-slate-50 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{app.id}</span>
                    <span className="text-emerald-900">{app.amount}</span>
                  </div>
                  <p className="text-gray-500 font-medium">{app.desc}</p>
                  <p className="text-[10px] text-gray-400 font-bold">{app.requester} · {app.date}</p>
                  <div className="flex gap-2 pt-1">
                    <button className="flex-1 py-1 bg-emerald-900 text-white font-bold rounded text-[10px] hover:bg-emerald-950 border border-emerald-950 cursor-pointer">
                      Setujui
                    </button>
                    <button className="flex-1 py-1 bg-white text-gray-500 font-bold rounded text-[10px] hover:bg-gray-150 border border-gray-200 cursor-pointer">
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Stock */}
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-rose-600" /> Bahan Stok Kritis
              </h3>
              <p className="text-[10px] text-gray-400">Bahan di bawah batas pengadaan minimum.</p>
            </div>
            <div className="space-y-3">
              {criticalStock.map((item, i) => {
                const pct = Math.min(100, Math.round((item.current / item.limit) * 100))
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="text-slate-900 font-bold">{item.current} / {item.limit} {item.unit}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded overflow-hidden">
                      <div className="h-full bg-rose-600 rounded" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white border border-gray-200 p-5 rounded-lg space-y-4">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={16} className="text-emerald-900" /> Log Dapur Hari Ini
            </h3>
            <div className="relative pl-5 border-l border-gray-200 space-y-4 text-xs font-medium">
              {timeline.map((item, i) => (
                <div key={i} className="relative">
                  <span className="absolute -left-[24.5px] top-1 w-1.5 h-1.5 rounded-full bg-emerald-900 ring-4 ring-white" />
                  <span className="text-[10px] font-bold text-gray-400 block">{item.time}</span>
                  <p className="text-slate-700 mt-0.5 leading-snug">{item.event}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
