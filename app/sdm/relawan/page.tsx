"use client"
import React from 'react'
import { Users, ShieldCheck, Heart } from 'lucide-react'

export default function RelawanPage() {
  const volunteers = [
    { name: 'Siti Aminah', role: 'Tim Masak Utama', status: 'Hadir', origin: 'Wonorejo Tengah' },
    { name: 'Rahmat Hidayat', role: 'Tim Packing & Kebersihan', status: 'Hadir', origin: 'Wonorejo Selatan' },
    { name: 'Ahmad Yunus', role: 'Tim Distribusi Rute 1', status: 'Hadir', origin: 'Wonorejo Utara' },
    { name: 'Lailatul Fitri', role: 'Tim Asisten Masak', status: 'Izin', origin: 'Wonorejo Barat' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">SDM / Relawan</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">👨‍🍳 Relawan Dapur</h1>
        <p className="text-slate-500 text-sm mt-1">Daftar relawan aktif dan pembagian tugas operasional harian.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            Daftar Kehadiran Relawan Hari Ini
          </h2>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            46/48 Hadir
          </span>
        </div>
        <div className="divide-y divide-slate-100">
          {volunteers.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl mt-1">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                  <p className="text-slate-600 font-semibold text-sm mt-1">Peran: {item.role} • Asal: {item.origin}</p>
                </div>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Hadir' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
