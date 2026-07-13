"use client"
import React from 'react'
import { Calendar, UserCheck } from 'lucide-react'

export default function ShiftPage() {
  const shifts = [
    { title: 'Shift Subuh (Persiapan Masak)', hours: '04:00 - 08:00', volunteers: 15, leader: 'Siti Aminah' },
    { title: 'Shift Siang (Pengemasan & Packing)', hours: '09:00 - 13:00', volunteers: 12, leader: 'Rahmat Hidayat' },
    { title: 'Shift Sore (Distribusi & Pembersihan)', hours: '13:00 - 17:00', volunteers: 19, leader: 'Ahmad Yunus' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-slate-500 mb-1">SDM / Shift</nav>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">⏰ Pengaturan Shift</h1>
        <p className="text-slate-500 text-sm mt-1">Pengaturan jadwal dan alokasi relawan per shift kerja Dapur SPPG.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={20} />
            Pembagian Shift Aktif
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {shifts.map((item, index) => (
            <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{item.title}</h3>
                <p className="text-slate-600 font-semibold text-sm mt-1">🕒 Jam Kerja: {item.hours}</p>
                <p className="text-slate-500 text-xs mt-1">Koordinator: {item.leader}</p>
              </div>
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-bold w-fit">
                <UserCheck size={14} />
                {item.volunteers} Relawan Alokasi
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
