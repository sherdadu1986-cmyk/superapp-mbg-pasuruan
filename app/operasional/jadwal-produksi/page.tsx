"use client"
import React from 'react'
import { Calendar, Clock } from 'lucide-react'

export default function JadwalProduksiPage() {
  const schedules = [
    { id: 1, shift: 'Shift Pagi (04:00 - 08:00)', menu: 'Nasi Kuning, Ayam Goreng, Susu', status: 'Selesai', color: 'bg-emerald-500' },
    { id: 2, shift: 'Shift Siang (09:00 - 13:00)', menu: 'Nasi Putih, Sayur Sop, Ayam Bakar, Buah', status: 'Sedang Berjalan', color: 'bg-amber-500' },
    { id: 3, shift: 'Shift Sore (14:00 - 17:00)', menu: 'Susu & Snack Sore', status: 'Persiapan', color: 'bg-blue-500' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">Operasional / Jadwal Produksi</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">📅 Jadwal Produksi</h1>
        <p className="text-slate-500 text-sm mt-1">Pemantauan jam kerja dapur dan menu harian yang diproduksi hari ini.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-emerald-600" size={20} />
            Jadwal Shift Hari Ini
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 px-3 py-1 rounded-full">
            14 Juli 2026
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {schedules.map((item) => (
            <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors duration-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mt-1">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.shift}</h3>
                  <p className="text-slate-600 font-medium text-sm mt-1">Menu: {item.menu}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-sm font-bold text-slate-700">{item.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
